from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class SectionScores(BaseModel):
    keywords: int
    sections: int
    achievements: int
    ats_format: int
    skills_alignment: int

class AIFeedback(BaseModel):
    provider: str
    summary: str

class ResumeAnalysisResponse(BaseModel):
    overall_score: int
    section_scores: SectionScores
    matched_keywords: List[str]
    missing_keywords: List[str]
    detected_sections: List[str]
    missing_sections: List[str]
    ats_warnings: List[str]
    improvement_suggestions: List[str]
    ai_feedback: Optional[AIFeedback] = None
