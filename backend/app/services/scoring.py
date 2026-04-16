from typing import Dict, Any

def calculate_city_score(
    city_data: Dict[str, Any],
    salary_monthly: float,
    sharing: bool,
    bhk: str
) -> Dict[str, Any]:
    
    # Calculate base rent
    if bhk == "1BHK":
        rent = city_data["rent_1bhk_shared"] if sharing else city_data["rent_1bhk_solo"]
    elif bhk == "2BHK":
        # Usually split by 2 if sharing
        rent = city_data["rent_2bhk"] / 2 if sharing else city_data["rent_2bhk"]
    else:
        rent = city_data["rent_1bhk_solo"]

    total_expense = rent + city_data["food_monthly"] + city_data["commute_monthly"] + \
                    city_data["utilities"] + city_data["groceries"] + city_data["internet"] + \
                    city_data["lifestyle"]

    savings = salary_monthly - total_expense
    savings_score = (savings / salary_monthly) * 100 if salary_monthly > 0 else 0
    
    # Comfort score (Out of 10)
    # Higher expense on lifestyle usually means better comfort, but let's base it on transport and job market
    comfort_score = (city_data["transport_quality"] + city_data["job_market_score"]) / 2

    # Final Score (Out of 100)
    # Savings (max 50) + Comfort (max 30) - Stress (penalty up to 20)
    capped_savings_score = min(50, max(0, savings_score))
    comfort_weighted = (comfort_score / 10) * 30
    stress_penalty = (city_data["stress_score"] / 10) * 20
    
    final_score = capped_savings_score + comfort_weighted - stress_penalty
    
    return {
        "city": city_data["city"],
        "total_expense": total_expense,
        "savings": savings,
        "savings_percentage": savings_score,
        "comfort_score": comfort_score,
        "stress_score": city_data["stress_score"],
        "final_city_score": final_score
    }
