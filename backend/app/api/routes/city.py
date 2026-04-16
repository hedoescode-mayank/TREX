from fastapi import APIRouter, HTTPException, status
from typing import List
from app.services.city_data import get_city_data
from app.services.scoring import calculate_city_score
from app.schemas.city import CityDataResponse
from app.schemas.analysis import CityAnalysisRequest, CityAnalysisResponse

router = APIRouter()

@router.get("/", response_model=CityDataResponse)
def get_cities():
    try:
        data = get_city_data()
        return {"cities": data}
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="City data not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error loading city data: {str(e)}"
        )

@router.post("/analyze", response_model=CityAnalysisResponse)
def analyze_cities(req: CityAnalysisRequest):
    # Input validation
    if req.salary_monthly <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Salary must be greater than 0"
        )
    if req.salary_monthly > 10000000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Salary seems too high. Please enter a valid amount."
        )
    if req.bhk not in ["1BHK", "2BHK"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="BHK must be '1BHK' or '2BHK'"
        )
    
    try:
        all_data = get_city_data()
        
        # Filter cities if specified
        if req.cities:
            filtered_data = [c for c in all_data if c["city"] in req.cities]
        else:
            filtered_data = all_data
            
        results = []
        for city_data in filtered_data:
            score_data = calculate_city_score(
                city_data=city_data,
                salary_monthly=req.salary_monthly,
                sharing=req.sharing,
                bhk=req.bhk
            )
            results.append(score_data)
            
        # Sort by descending final score
        results.sort(key=lambda x: x["final_city_score"], reverse=True)
        
        return {"results": results}
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="City data not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing cities: {str(e)}"
        )
