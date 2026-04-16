from typing import Optional
from .llm_feedback import generate_ai_feedback

def route_provider(resume_text: str, jd_text: str, provider: str = "groq") -> Optional[dict]:
    """Routes the AI request to the correct provider safely."""
    if provider.lower() == "groq":
        return generate_ai_feedback(resume_text, jd_text)
    
    # If none or unsupported
    return None
