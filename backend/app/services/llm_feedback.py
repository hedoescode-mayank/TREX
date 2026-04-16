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

    # Truncate inputs to keep tokens low and response fast
    # 1500 chars ≈ ~375 tokens for resume, 750 chars for JD
    resume_snippet = resume_text[:1500]
    jd_snippet     = jd_text[:750]

    result_container = [None]
    error_container  = [None]

    def _call_llm():
        """Inner function run in a guarded thread."""
        try:
            llm = ChatGroq(
                api_key=api_key,
                model="llama-3.3-70b-versatile",
                temperature=0.2,
                max_tokens=400,          # Reduced from 600 → faster + less CPU
                request_timeout=20,      # Network timeout
            )

            user_message = (
                f"=== RESUME ===\n{resume_snippet}\n\n"
                f"=== JOB DESCRIPTION ===\n{jd_snippet}\n"
            )

            messages = [
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=user_message),
            ]

            response = llm.invoke(messages)
            raw = response.content.strip()

            # Clean JSON
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)

            try:
                result_container[0] = json.loads(raw)
            except json.JSONDecodeError:
                match = re.search(r'\{[\s\S]+\}', raw)
                if match:
                    result_container[0] = json.loads(match.group())
                else:
                    result_container[0] = {
                        "summary": "AI analysis completed but response could not be parsed.",
                        "suggestions": []
                    }
        except Exception as e:
            error_container[0] = str(e)
            print(f"[LLM] Error: {e}")

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
