from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel
from typing import List, Optional

from app.services.city_data import get_city_data
from app.services.city_raw import get_city_raw, get_cities_index_list
from app.services.city_metadata import get_meta
from app.services.scoring import calculate_city_score
from app.services.city_insights import generate_city_insights
from app.services.city_compare import generate_compare_analysis
from app.schemas.city import CityDataResponse
from app.schemas.analysis import CityAnalysisRequest, CityAnalysisResponse

router = APIRouter()


# ── Existing endpoints (backward compatible) ─────────────────────────────────

@router.get("/", response_model=CityDataResponse)
def get_cities_legacy():
    """Legacy endpoint — returns normalized city list."""
    try:
        data = get_city_data()
        return {"cities": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading city data: {str(e)}")


@router.post("/analyze", response_model=CityAnalysisResponse)
def analyze_cities(req: CityAnalysisRequest):
    """Score all 54 cities for a given salary/BHK preference."""
    if req.salary_monthly <= 0:
        raise HTTPException(status_code=400, detail="Salary must be greater than 0")
    if req.salary_monthly > 10_000_000:
        raise HTTPException(status_code=400, detail="Salary seems too high. Please enter a valid amount.")
    if req.bhk not in ["1BHK", "2BHK"]:
        raise HTTPException(status_code=400, detail="BHK must be '1BHK' or '2BHK'")

    try:
        all_data = get_city_data()
        filtered = [c for c in all_data if c["city"] in req.cities] if req.cities else all_data
        results = [
            calculate_city_score(cd, req.salary_monthly, req.sharing, req.bhk)
            for cd in filtered
        ]
        results.sort(key=lambda x: x["final_city_score"], reverse=True)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing cities: {str(e)}")


@router.get("/insights/{city}")
def get_city_insights(city: str):
    """Per-city Groq AI insights: popular areas, contacts, affordability notes."""
    try:
        city_data_match = next(
            (c for c in get_city_data() if c["city"].lower() == city.lower()), None
        )
        if not city_data_match:
            raise HTTPException(status_code=404, detail=f"City '{city}' not found.")
        insights = generate_city_insights(city, city_data_match)
        if not insights:
            raise HTTPException(status_code=500, detail="Failed to generate AI insights.")
        return insights
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating insights: {str(e)}")


# ── New City-Workflow endpoints ────────────────────────────────────────────────

@router.get("/cities")
def list_all_cities():
    """Returns all 54 cities with cost-of-living index (Mumbai = 100) and key prices."""
    try:
        cities = get_cities_index_list()
        return {"cities": cities, "total": len(cities)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing cities: {str(e)}")


@router.get("/city/{city_name}")
def get_city_detail(city_name: str):
    """Returns full categorised raw price data + metadata for one city."""
    try:
        raw = get_city_raw(city_name)
        if not raw:
            raise HTTPException(status_code=404, detail=f"City '{city_name}' not found.")

        meta = get_meta(city_name)

        # Normalised summary (for comparison stats)
        all_norm = get_city_data()
        norm = next(
            (c for c in all_norm if c["city"].lower() == city_name.lower()), {}
        )

        # Cost index relative to Mumbai = 100
        mumbai_norm = next((c for c in all_norm if c["city"].lower() == "mumbai"), None)
        if mumbai_norm and norm:
            mumbai_total = sum([
                mumbai_norm["rent_1bhk_solo"], mumbai_norm["food_monthly"],
                mumbai_norm["commute_monthly"], mumbai_norm["utilities"],
                mumbai_norm["groceries"], mumbai_norm["internet"], mumbai_norm["lifestyle"],
            ])
            city_total = sum([
                norm["rent_1bhk_solo"], norm["food_monthly"],
                norm["commute_monthly"], norm["utilities"],
                norm["groceries"], norm["internet"], norm["lifestyle"],
            ])
            index = round((city_total / mumbai_total) * 100) if mumbai_total else 0
        else:
            index = 0

        # Key preview stats from raw JSON
        raw_vals = raw.get("raw", {})
        key_stats = {
            "veg_thali": raw_vals.get("Veg Thali (local restaurant)per plate", "—"),
            "rent_1bhk_centre": raw_vals.get("1 BHK in City Centreper month", "—"),
            "pg_double": raw_vals.get("PG - Double Sharing (with meals)per month", "—"),
            "petrol": raw_vals.get("Petrol1 litre", "—"),
        }

        return {
            "city": city_name,
            "meta": meta,
            "index": index,
            "key_stats": key_stats,
            "categories": raw["categories"],
            "normalized": norm,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching city detail: {str(e)}")


class CompareRequest(BaseModel):
    city1: str
    city2: str
    salary: float = 0


@router.post("/compare")
def compare_cities(req: CompareRequest):
    """Side-by-side comparison: normalized data + affordability (no AI)."""
    try:
        all_norm = get_city_data()

        norm1 = next((c for c in all_norm if c["city"].lower() == req.city1.lower()), None)
        norm2 = next((c for c in all_norm if c["city"].lower() == req.city2.lower()), None)

        if not norm1:
            raise HTTPException(status_code=404, detail=f"City '{req.city1}' not found.")
        if not norm2:
            raise HTTPException(status_code=404, detail=f"City '{req.city2}' not found.")

        raw1 = get_city_raw(req.city1)
        raw2 = get_city_raw(req.city2)
        meta1 = get_meta(req.city1)
        meta2 = get_meta(req.city2)

        def afford(norm, salary):
            if salary > 0:
                return calculate_city_score(norm, salary, True, "1BHK")
            return {}

        return {
            "city1": {
                "name": req.city1,
                "meta": meta1,
                "normalized": norm1,
                "categories": raw1["categories"] if raw1 else [],
                "affordability": afford(norm1, req.salary),
            },
            "city2": {
                "name": req.city2,
                "meta": meta2,
                "normalized": norm2,
                "categories": raw2["categories"] if raw2 else [],
                "affordability": afford(norm2, req.salary),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing cities: {str(e)}")


@router.get("/compare/analysis")
def compare_analysis(
    city1: str = Query(...),
    city2: str = Query(...),
    salary: float = Query(default=0),
):
    """AI-generated comparison analysis (slow — call async from frontend)."""
    try:
        all_norm = get_city_data()
        norm1 = next((c for c in all_norm if c["city"].lower() == city1.lower()), None)
        norm2 = next((c for c in all_norm if c["city"].lower() == city2.lower()), None)

        if not norm1:
            raise HTTPException(status_code=404, detail=f"City '{city1}' not found.")
        if not norm2:
            raise HTTPException(status_code=404, detail=f"City '{city2}' not found.")

        ai = generate_compare_analysis(city1, city2, norm1, norm2, salary)
        if not ai:
            raise HTTPException(status_code=500, detail="AI analysis failed or timed out.")
        return ai
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis error: {str(e)}")
