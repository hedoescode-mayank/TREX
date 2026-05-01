import os
import json
import re
import threading
from typing import Optional
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

# ─── Resource Guard ────────────────────────────────────────────────────
# Only allow 1 LLM call at a time so the laptop doesn't choke.
# If a second request arrives while one is running, it waits (max 20 sec).
_LLM_SEMAPHORE = threading.Semaphore(1)
_LLM_TIMEOUT_SECONDS = 25  # Hard kill after 25 s – prevents hanging

# We read this at runtime to ensure it's loaded properly
def get_groq_api_key():
    return os.getenv("GROQ_API_KEY", "")    

SYSTEM_PROMPT = """You are an expert ATS and technical resume analyst.
Your job is to provide honest, specific feedback explaining the resume's match to the job description.
Do not calculate a score, just provide qualitative feedback.
Return a valid JSON object with EXACTLY this structure:
{
  "summary": "<2-3 sentences of overall assessment>",
  "suggestions": [
     "<specific actionable tip 1>",
     "<specific actionable tip 2>",
     "<specific actionable tip 3>"
  ]
}
Return ONLY valid JSON and no markdown formatting.
"""

def generate_ai_feedback(resume_text: str, jd_text: str) -> Optional[dict]:
    """
    Call Groq LLM with strict resource limits:
    - Only 1 call at a time (semaphore)
    - Hard timeout of 25 seconds
    - Input text truncated to avoid huge token bills / slow responses
    """
    api_key = get_groq_api_key()
    if not api_key:
        print("[LLM] No API key found in environment.")
        return None  # Graceful degrade
    
    # Debug: Print masked key
    masked_key = f"{api_key[:6]}...{api_key[-4:]}"
    print(f"[LLM] Using API Key: {masked_key} (Length: {len(api_key)})")

# 1. Truncate inputs more generously for deep analysis
    # 8000 chars ≈ ~2000 tokens for resume, 4000 chars for JD
    resume_snippet = resume_text[:8000]
    jd_snippet     = jd_text[:4000]

    result_container = [None]
    error_container  = [None]

    def _call_llm():
        """Inner function run in a guarded thread."""
        try:
            llm = ChatGroq(
                api_key=api_key,
                model="llama-3.3-70b-versatile",
                temperature=0.3,
                max_tokens=2500,         # Increased for detailed cards
                request_timeout=30,      # Network timeout
            )
            
            raw = "" # Initialize to avoid UnboundLocalError in except block

            # Extract entities and role context if possible (logic moved here for LLM visibility)
            from app.services.resume_parser import extract_entities
            from app.services.role_parser import preprocess_role
            
            entities = extract_entities(resume_snippet)
            role_ctx = preprocess_role(jd_snippet)

            SYSTEM_PROMPT_UPGRADED = """You are a sharp Senior Technical Recruiter and Engineering Manager.
Your goal is to provide a brutal, honest, and deeply technical review of a candidate's resume against a job description.
Do not give generic advice. Be specific, actionable, and authoritative.

You must return a VALID JSON object with this EXACT structure:
{
  "overall_match": {
    "title": "Overall Match Assessment",
    "severity": "moderate",
    "details": "Detailed analysis of role fit, seniority, and domain alignment.",
    "action_items": [{"label": "Fix X", "impact": "High"}]
  },
  "resume_weaknesses": {
    "title": "Critical Resume Weaknesses",
    "severity": "critical",
    "details": "What exactly is wrong? Missing impact? Poor formatting? Weak verbs?",
    "action_items": [{"label": "Add metrics to experience", "impact": "Critical"}]
  },
  "section_review": {
    "title": "Section-by-Section Review",
    "severity": "moderate",
    "details": "Feedback on Summary, Skills, Experience, and Education sections.",
    "action_items": []
  },
  "role_alignment": {
    "title": "JD Alignment & Keywords",
    "severity": "major",
    "details": "Specific keywords missing or misaligned. Technical stack gap analysis.",
    "action_items": []
  },
  "project_review": {
    "title": "Technical Project Deep-Dive",
    "severity": "moderate",
    "details": "For EACH project: \n- [Project Name]: [Brief critique]. \n- LACKS: [Surgical list of missing metrics/scale]. \n- AMBIGUOUS: [What technical part is unclear?]. \nBe extremely specific for each project individually.",
    "action_items": [{"label": "Quantify users/latency for Project X", "impact": "High"}]
  },
  "roadmap": {
    "title": "Candidate Growth Roadmap",
    "severity": "minor",
    "details": "Step-by-step guide on what to learn or build to become a perfect fit.",
    "action_items": []
  },
  "application_strategy": {
    "title": "Strategic Application Advice",
    "severity": "minor",
    "details": "What kind of companies/roles should this candidate target now vs later?",
    "action_items": []
  },
  "final_verdict": {
    "title": "The Final Verdict",
    "severity": "critical",
    "details": "The absolute bottom line. Is this candidate hireable for this role?",
    "action_items": []
  },
  "suggested_resume_changes": ["Change 1", "Change 2", "Change 3"]
}

SEVERITY LEVELS: "critical", "major", "moderate", "minor".
TONE: Professional, Senior, Direct, No fluff.
"""

            # Extract entities and role context if possible (logic moved here for LLM visibility)
            from app.services.resume_parser import extract_entities
            from app.services.role_parser import preprocess_role
            
            entities = extract_entities(resume_snippet)
            role_ctx = preprocess_role(jd_snippet)

            SYSTEM_PROMPT_UPGRADED = """You are a sharp Senior Technical Recruiter and Engineering Manager.
Your goal is to provide a brutal, honest, and deeply technical review of a candidate's resume against a job description.
Do not give generic advice. Be specific, actionable, and authoritative.

You must return a VALID JSON object with this EXACT structure:
{
  "overall_match": {
    "title": "Overall Match Assessment",
    "severity": "moderate",
    "details": "Detailed analysis of role fit, seniority, and domain alignment.",
    "action_items": [{"label": "Fix X", "impact": "High"}]
  },
  "resume_weaknesses": {
    "title": "Critical Resume Weaknesses",
    "severity": "critical",
    "details": "What exactly is wrong? Missing impact? Poor formatting? Weak verbs?",
    "action_items": [{"label": "Add metrics to experience", "impact": "Critical"}]
  },
  "section_review": {
    "title": "Section-by-Section Review",
    "severity": "moderate",
    "details": "Feedback on Summary, Skills, Experience, and Education sections.",
    "action_items": []
  },
  "role_alignment": {
    "title": "JD Alignment & Keywords",
    "severity": "major",
    "details": "Specific keywords missing or misaligned. Technical stack gap analysis.",
    "action_items": []
  },
  "project_review": {
    "title": "Technical Project Deep-Dive",
    "severity": "moderate",
    "details": "Analyze the complexity, architecture, and impact of mentioned projects.",
    "action_items": []
  },
  "roadmap": {
    "title": "Candidate Growth Roadmap",
    "severity": "minor",
    "details": "Step-by-step guide on what to learn or build to become a perfect fit.",
    "action_items": []
  },
  "application_strategy": {
    "title": "Strategic Application Advice",
    "severity": "minor",
    "details": "What kind of companies/roles should this candidate target now vs later?",
    "action_items": []
  },
  "final_verdict": {
    "title": "The Final Verdict",
    "severity": "critical",
    "details": "The absolute bottom line. Is this candidate hireable for this role?",
    "action_items": []
  },
  "suggested_resume_changes": ["Change 1", "Change 2", "Change 3"]
}

SEVERITY LEVELS: "critical", "major", "moderate", "minor".
TONE: Professional, Senior, Direct, No fluff.
"""

            user_message = (
                f"=== CANDIDATE ENTITIES ===\n{json.dumps(entities, indent=2)}\n\n"
                f"=== JOB CONTEXT ===\n{json.dumps(role_ctx, indent=2)}\n\n"
                f"=== FULL RESUME TEXT ===\n{resume_snippet}\n\n"
                f"=== FULL JOB DESCRIPTION ===\n{jd_snippet}\n"
            )

            messages = [
                SystemMessage(content=SYSTEM_PROMPT_UPGRADED),
                HumanMessage(content=user_message),
            ]

            response = llm.invoke(messages)
            raw = response.content.strip()

            # Clean JSON and handle control characters
            raw = raw.strip()
            # Remove markdown code blocks if present
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
            
            # Handle potential control characters that break json.loads
            # This replaces common control chars (like literal newlines inside strings)
            # though we want to keep \n if it's meant to be a newline char.
            # Actually, standard json.loads handles \n. It's usually literal tabs or 
            # unescaped control chars that cause issues.
            
            try:
                data = json.loads(raw)
                data["provider"] = "groq"
                result_container[0] = data
            except json.JSONDecodeError:
                # 2. Extract JSON block more carefully
                print("[LLM] Initial JSON parse failed. Attempting extraction...")
                match = re.search(r'(\{[\s\S]+\})', raw)
                if match:
                    data = json.loads(match.group())
                    data["provider"] = "groq"
                    result_container[0] = data
                else:
                    raise ValueError("Failed to parse LLM response as JSON")
        except Exception as e:
            error_container[0] = str(e)
            print(f"[LLM] Error: {e}")
            print(f"[LLM] Raw response was: {raw}")

    # ── Acquire semaphore (max 1 concurrent LLM call) ──
    acquired = _LLM_SEMAPHORE.acquire(timeout=5)  # Wait max 5 s for slot
    if not acquired:
        print("[LLM] Semaphore busy – skipping AI feedback to protect resources.")
        return None

    try:
        thread = threading.Thread(target=_call_llm, daemon=True)
        thread.start()
        thread.join(timeout=_LLM_TIMEOUT_SECONDS)  # Kill if too slow

        if thread.is_alive():
            print("[LLM] Timed out – returning None to protect CPU.")
            return None

        if error_container[0]:
            return None

        return result_container[0]

    finally:
        _LLM_SEMAPHORE.release()
