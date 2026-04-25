from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class SectionScores(BaseModel):
    keywords: int
    sections: int
    achievements: int
    ats_format: int
    skills_alignment: int

class ActionItem(BaseModel):
    label: str
    impact: str

class AICard(BaseModel):
    title: str
    severity: str  # critical, major, moderate, minor
    details: str
    action_items: List[ActionItem] = []

class AIFeedback(BaseModel):
    provider: str
    overall_match: AICard
    resume_weaknesses: AICard
    section_review: AICard
    role_alignment: AICard
    project_review: AICard
    roadmap: AICard
    application_strategy: AICard
    final_verdict: AICard
    suggested_resume_changes: List[str]

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
