from typing import List, Optional
from pydantic import BaseModel
from .city import CityExpense

class CityAnalysisRequest(BaseModel):
    salary_monthly: float
    sharing: bool
    bhk: str # "1BHK" or "2BHK"
    cities: Optional[List[str]] = None

class CityAnalysisResult(BaseModel):
    city: str
    total_expense: float
    savings: float
    savings_percentage: float
    comfort_score: float
    stress_score: float
    final_city_score: float

class CityAnalysisResponse(BaseModel):
    results: List[CityAnalysisResult]
