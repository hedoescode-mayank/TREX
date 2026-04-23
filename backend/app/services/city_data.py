"""
City Data Service — normalises raw JSON into the canonical schema used by scoring.py.
parse_inr is imported from city_raw to keep a single source of truth.
"""
import json
from pathlib import Path
from typing import List, Dict, Any

# Shared utilities — no circular import (city_raw doesn't import city_data)
from app.services.city_raw import get_raw_json, parse_inr

OLD_JSON_PATH = Path(__file__).parent.parent / "data" / "cities.json"

_CACHED_CITIES: List[Dict[str, Any]] = []


def normalize_raw_city(city_key: str, raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """Build a canonical city dict from a raw JSON city entry."""
    # Better display name: each hyphen-separated word is capitalised
    city_name = " ".join(p.capitalize() for p in city_key.split("-"))

    r1_shared = parse_inr(raw_data.get("PG - Double Sharing (without meals)per month"))
    r1_solo = parse_inr(raw_data.get("1 BHK Outside City Centreper month"))
    r2 = parse_inr(raw_data.get("2 BHK Outside City Centreper month"))

    thali = parse_inr(raw_data.get("Veg Thali (local restaurant)per plate") or "100")
    meat = parse_inr(raw_data.get("Chicken1 kg") or "200")
    food_monthly = (thali * 20) + (meat * 4) + 2000

    milk = parse_inr(raw_data.get("Milk (Full Cream)1 litre") or "50")
    rice = parse_inr(raw_data.get("Rice (Basmati)1 kg") or "80")
    groceries = (milk * 15) + (rice * 5) + 1500

    pass_price = parse_inr(raw_data.get("Metro / Local Train (monthly pass)per month")) \
        or parse_inr(raw_data.get("Bus (monthly pass)per month"))
    commute_monthly = pass_price if pass_price > 0 else 1500

    elec = parse_inr(raw_data.get("Electricityper month") or "1000")
    water = parse_inr(raw_data.get("Water Billper month") or "200")
    gas = parse_inr(raw_data.get("Cooking Gas (LPG Cylinder)per cylinder") or "800")
    utilities = elec + water + gas

    internet = parse_inr(raw_data.get("Broadband Internetper month") or "700")

    gym = parse_inr(raw_data.get("Gym Membershipper month") or "1000")
    movie = parse_inr(raw_data.get("Movie Ticket (Multiplex)per ticket") or "250")
    misc = parse_inr(raw_data.get("Miscellaneous Monthly Spendper month") or "2000")
    lifestyle = gym + (movie * 2) + misc

    TOP_METRICS = {
        "Mumbai":    {"transport": 8.5, "job": 9.0, "stress": 9.0},
        "Bangalore": {"transport": 6.0, "job": 9.5, "stress": 8.5},
        "Delhi":     {"transport": 9.0, "job": 8.5, "stress": 8.5},
        "Hyderabad": {"transport": 7.5, "job": 8.8, "stress": 6.5},
        "Pune":      {"transport": 6.5, "job": 8.5, "stress": 6.0},
        "Chennai":   {"transport": 7.5, "job": 8.0, "stress": 7.0},
        "Gurgaon":   {"transport": 7.0, "job": 9.0, "stress": 8.0},
        "Noida":     {"transport": 7.5, "job": 8.5, "stress": 7.5},
        "Kolkata":   {"transport": 8.0, "job": 7.5, "stress": 6.0},
        "Ahmedabad": {"transport": 7.0, "job": 7.8, "stress": 5.5},
    }
    metrics = TOP_METRICS.get(city_name, {"transport": 7.0, "job": 7.0, "stress": 5.0})

    return {
        "city": city_name,
        "rent_1bhk_shared": r1_shared or 8000,
        "rent_1bhk_solo": r1_solo or 12000,
        "rent_2bhk": r2 or 20000,
        "food_monthly": food_monthly or 5000,
        "commute_monthly": commute_monthly or 1500,
        "utilities": utilities or 2000,
        "groceries": groceries or 3000,
        "internet": internet or 700,
        "lifestyle": lifestyle or 3000,
        "transport_quality": metrics["transport"],
        "job_market_score": metrics["job"],
        "stress_score": metrics["stress"],
    }


def get_city_data() -> List[Dict[str, Any]]:
    global _CACHED_CITIES
    if not _CACHED_CITIES:
        print("[CACHE] Ingesting & normalizing 54-city raw data...")
        raw_dict = get_raw_json()
        _CACHED_CITIES = [normalize_raw_city(k, v) for k, v in raw_dict.items()]
    return _CACHED_CITIES
