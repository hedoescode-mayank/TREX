from typing import List, Optional
from pydantic import BaseModel

class CityExpense(BaseModel):
    city: str
    rent_1bhk_shared: int
    rent_1bhk_solo: int
    rent_2bhk: int
    food_monthly: int
    commute_monthly: int
    utilities: int
    groceries: int
    internet: int
    lifestyle: int
    stress_score: float
    transport_quality: float
    job_market_score: float

class CityDataResponse(BaseModel):
    cities: List[CityExpense]
