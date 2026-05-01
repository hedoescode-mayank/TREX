import os
import json
import re
import threading
from typing import Optional
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

_LLM_SEMAPHORE = threading.Semaphore(1)
_LLM_TIMEOUT_SECONDS = 30

def get_groq_api_key():
    return os.getenv("GROQ_API_KEY", "")

def generate_career_matchmaking(
    resume_text: str, 
    target_role: str, 
    location: str, 
    experience_level: str, 
    expected_salary: str, 
    job_type: str
) -> Optional[dict]:
    api_key = get_groq_api_key()
    if not api_key:
        return None
    
    resume_snippet = resume_text[:8000]
    
    result_container = [None]
    error_container  = [None]

    def _call_llm():
        try:
            llm = ChatGroq(
                api_key=api_key,
                model="llama-3.3-70b-versatile",
                temperature=0.3,
                max_tokens=2500,
                request_timeout=30,
            )

            SYSTEM_PROMPT = """You are an expert Career Coach and Technical Recruiter.
Analyze the candidate's resume against their target preferences and provide a detailed matchmaking report.

User Preferences:
- Target Role: {target_role}
- Preferred Location: {location}
- Experience Level: {experience_level}
- Expected Salary: {expected_salary}
- Job Type: {job_type}

You must return a VALID JSON object with this EXACT structure:
{{
  "recommended_roles": [
    {{
      "role": "Role Name",
      "match_score": 85,
      "missing_skills": ["Skill A", "Skill B"],
      "skills_to_learn": ["Skill C"],
      "description": "Why this role fits."
    }}
  ],
  "overall_match_score": 80,
  "missing_skills": ["Skill A", "Skill B"],
  "skills_to_learn": ["Skill C", "Skill D"],
  "improvement_suggestions": ["Suggestion 1", "Suggestion 2"],
  "job_readiness_score": 75,
  "roadmap": ["Step 1", "Step 2", "Step 3"],
  "extracted_skills": ["Skill 1", "Skill 2"]
}}

Return ONLY valid JSON and no markdown formatting.
"""
            user_message = f"=== RESUME TEXT ===\n{resume_snippet}\n"
            
            messages = [
                SystemMessage(content=SYSTEM_PROMPT.format(
                    target_role=target_role,
                    location=location,
                    experience_level=experience_level,
                    expected_salary=expected_salary,
                    job_type=job_type
                )),
                HumanMessage(content=user_message),
            ]

            response = llm.invoke(messages)
            raw = response.content.strip()
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
            
            try:
                data = json.loads(raw)
                result_container[0] = data
            except json.JSONDecodeError:
                match = re.search(r'(\{[\s\S]+\})', raw)
                if match:
                    result_container[0] = json.loads(match.group())
                else:
                    raise ValueError("Failed to parse LLM response")
        except Exception as e:
            error_container[0] = str(e)
            print(f"[CAREER-LLM] Error: {e}")

    acquired = _LLM_SEMAPHORE.acquire(timeout=5)
    if not acquired:
        return None

    try:
        thread = threading.Thread(target=_call_llm, daemon=True)
        thread.start()
        thread.join(timeout=_LLM_TIMEOUT_SECONDS)

        if thread.is_alive():
            return None

        return result_container[0]
    finally:
        _LLM_SEMAPHORE.release()
