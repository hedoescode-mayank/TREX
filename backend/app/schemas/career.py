from pydantic import BaseModel
from typing import List, Optional

class JobMatch(BaseModel):
    role: str
    match_score: int
    missing_skills: List[str]
    skills_to_learn: List[str]
    description: str

class CareerAnalysisResponse(BaseModel):
    recommended_roles: List[JobMatch]
    overall_match_score: int
    missing_skills: List[str]
    skills_to_learn: List[str]
    improvement_suggestions: List[str]
    job_readiness_score: int
    roadmap: List[str]
    extracted_skills: List[str]
    sample_jobs: Optional[List[dict]] = None
