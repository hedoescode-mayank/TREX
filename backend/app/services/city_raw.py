"""
City Raw Data Service
- Loads and caches the full cost_of_living_india.json
- Provides parse_inr() (imported by city_data.py to avoid duplication)
- Returns categorized price data for a single city
- Returns summary index list for all 54 cities
"""
import json
import re
from pathlib import Path
from typing import Dict, Any, List, Optional

BASE_DIR = Path(__file__).parent.parent.parent.parent
RAW_JSON_PATH = BASE_DIR / "resourcess" / "city_data" / "cost_of_living_india.json"

_RAW_CACHE: Optional[Dict] = None


def get_raw_json() -> Dict:
    global _RAW_CACHE
    if _RAW_CACHE is None:
        with open(RAW_JSON_PATH, "r", encoding="utf-8") as f:
            _RAW_CACHE = json.load(f)
    return _RAW_CACHE


def parse_inr(val_str) -> int:
    """Parse an INR string like '₹1,500', '₹1.1L', '2000' into an integer."""
    if not val_str:
        return 0
    v = str(val_str).replace("₹", "").replace(",", "").strip()
    if v.endswith("L"):
        try:
            return int(float(v[:-1]) * 100_000)
        except Exception:
            pass
    try:
        return int(float(v))
    except Exception:
        return 0


# ─── Category → Item Mapping ─────────────────────────────────────────────────
# Each item has: key (exact JSON key), label (display name), unit

CATEGORIES: List[Dict] = [
    {
        "id": "dining",
        "name": "Restaurants & Dining",
        "icon": "🍽️",
        "description": "Average prices at local restaurants, street food stalls, and cafes",
        "items": [
            {"key": "Veg Thali (local restaurant)per plate",       "label": "Veg Thali (local restaurant)",       "unit": "per plate"},
            {"key": "Non-Veg Thali (local restaurant)per plate",   "label": "Non-Veg Thali (local restaurant)",   "unit": "per plate"},
            {"key": "Meal for Two (high-end restaurant)per meal",  "label": "Meal for Two (high-end restaurant)", "unit": "per meal"},
            {"key": "Dosa (plain)per plate",                        "label": "Dosa (plain)",                       "unit": "per plate"},
            {"key": "Biryani (chicken)per plate",                   "label": "Biryani (chicken)",                  "unit": "per plate"},
            {"key": "Street Food (Vada Pav / Samosa)per piece",    "label": "Street Food (Vada Pav / Samosa)",   "unit": "per piece"},
            {"key": "Fast Food Combo (McDonald's)per meal",        "label": "Fast Food Combo (McDonald's)",       "unit": "per meal"},
            {"key": "Chai (regular cup)per cup",                    "label": "Chai (regular cup)",                 "unit": "per cup"},
            {"key": "Coffee (Cappuccino)per cup",                   "label": "Cappuccino",                         "unit": "per cup"},
            {"key": "Specialty Coffee (Third Wave)per cup",        "label": "Specialty Coffee (Third Wave)",      "unit": "per cup"},
            {"key": "Soft Drink (Coca-Cola, 300ml)per bottle",    "label": "Soft Drink (Coca-Cola 300ml)",       "unit": "per bottle"},
            {"key": "Bottled Water (1 litre)per bottle",           "label": "Bottled Water (1 litre)",            "unit": "per bottle"},
        ],
    },
    {
        "id": "groceries",
        "name": "Groceries",
        "icon": "🛒",
        "description": "Prices at local markets and grocery stores, including health supplements",
        "items": [
            {"key": "Rice (Basmati)1 kg",              "label": "Rice (Basmati)",          "unit": "1 kg"},
            {"key": "Wheat Flour (Atta)1 kg",          "label": "Wheat Flour (Atta)",      "unit": "1 kg"},
            {"key": "Toor Dal1 kg",                    "label": "Toor Dal",                "unit": "1 kg"},
            {"key": "Milk (Full Cream)1 litre",        "label": "Milk (Full Cream)",       "unit": "1 litre"},
            {"key": "Eggs12 pcs",                      "label": "Eggs",                    "unit": "12 pcs"},
            {"key": "Chicken1 kg",                     "label": "Chicken",                 "unit": "1 kg"},
            {"key": "Paneer1 kg",                      "label": "Paneer",                  "unit": "1 kg"},
            {"key": "Onions1 kg",                      "label": "Onions",                  "unit": "1 kg"},
            {"key": "Tomatoes1 kg",                    "label": "Tomatoes",                "unit": "1 kg"},
            {"key": "Potatoes1 kg",                    "label": "Potatoes",                "unit": "1 kg"},
            {"key": "Cooking Oil (Sunflower)1 litre",  "label": "Cooking Oil (Sunflower)", "unit": "1 litre"},
            {"key": "Sugar1 kg",                       "label": "Sugar",                   "unit": "1 kg"},
            {"key": "Apples (Shimla)1 kg",             "label": "Apples (Shimla)",         "unit": "1 kg"},
            {"key": "Bananas1 dozen",                  "label": "Bananas",                 "unit": "1 dozen"},
            {"key": "Bread (White, Sliced)1 loaf",     "label": "Bread (White, Sliced)",   "unit": "1 loaf"},
            {"key": "Whey Protein (1 kg)per kg",       "label": "Whey Protein (1 kg)",     "unit": "per kg"},
        ],
    },
    {
        "id": "transport",
        "name": "Transportation",
        "icon": "🚗",
        "description": "Local transport costs, fuel prices, and commute options",
        "items": [
            {"key": "Auto Rickshaw (minimum fare)per ride",    "label": "Auto Rickshaw (minimum fare)",       "unit": "per ride"},
            {"key": "Auto Rickshaw (per km after min)per km",  "label": "Auto Rickshaw (per km after min)",   "unit": "per km"},
            {"key": "Metro / Local Train (monthly pass)per month", "label": "Metro / Local Train (monthly pass)", "unit": "per month"},
            {"key": "Bus (monthly pass)per month",             "label": "Bus (monthly pass)",                 "unit": "per month"},
            {"key": "Ola/Uber (avg ride)per ride",             "label": "Ola/Uber (avg ride)",                "unit": "per ride"},
            {"key": "Petrol1 litre",                           "label": "Petrol",                             "unit": "1 litre"},
            {"key": "Diesel1 litre",                           "label": "Diesel",                             "unit": "1 litre"},
            {"key": "Two Wheeler EMI (avg)per month",          "label": "Two Wheeler EMI (avg)",              "unit": "per month"},
            {"key": "Car EMI (avg)per month",                  "label": "Car EMI (avg)",                      "unit": "per month"},
        ],
    },
    {
        "id": "utilities",
        "name": "Utilities",
        "icon": "💡",
        "description": "Monthly costs for electricity, water, gas, and internet services",
        "items": [
            {"key": "Electricityper month",                     "label": "Electricity",               "unit": "per month"},
            {"key": "Water Billper month",                      "label": "Water Bill",                "unit": "per month"},
            {"key": "Cooking Gas (LPG Cylinder)per cylinder",  "label": "Cooking Gas (LPG Cylinder)","unit": "per cylinder"},
            {"key": "Broadband Internetper month",              "label": "Broadband Internet",        "unit": "per month"},
            {"key": "Mobile Plan (Jio/Airtel)per month",       "label": "Mobile Plan (Jio/Airtel)",  "unit": "per month"},
        ],
    },
    {
        "id": "rent",
        "name": "Accommodation — Rent",
        "icon": "🏠",
        "description": "Monthly rent for apartments in city centre and outside city centre",
        "items": [
            {"key": "1 BHK in City Centreper month",        "label": "1 BHK in City Centre",       "unit": "per month"},
            {"key": "1 BHK Outside City Centreper month",   "label": "1 BHK Outside City Centre",  "unit": "per month"},
            {"key": "2 BHK in City Centreper month",        "label": "2 BHK in City Centre",       "unit": "per month"},
            {"key": "2 BHK Outside City Centreper month",   "label": "2 BHK Outside City Centre",  "unit": "per month"},
            {"key": "3 BHK in City Centreper month",        "label": "3 BHK in City Centre",       "unit": "per month"},
            {"key": "3 BHK Outside City Centreper month",   "label": "3 BHK Outside City Centre",  "unit": "per month"},
            {"key": "Home Loan EMI (2BHK avg)per month",    "label": "Home Loan EMI (2BHK avg)",   "unit": "per month"},
        ],
    },
    {
        "id": "pg",
        "name": "PG / Shared Accommodation",
        "icon": "🏘️",
        "description": "PG and shared accommodation prices for professionals and students",
        "items": [
            {"key": "PG - Private Room (with meals)per month",     "label": "PG – Private Room (with meals)",     "unit": "per month"},
            {"key": "PG - Private Room (without meals)per month",  "label": "PG – Private Room (without meals)",  "unit": "per month"},
            {"key": "PG - Double Sharing (with meals)per month",   "label": "PG – Double Sharing (with meals)",   "unit": "per month"},
            {"key": "PG - Double Sharing (without meals)per month","label": "PG – Double Sharing (without meals)","unit": "per month"},
            {"key": "PG - Triple Sharing (with meals)per month",   "label": "PG – Triple Sharing (with meals)",   "unit": "per month"},
            {"key": "PG - Triple Sharing (without meals)per month","label": "PG – Triple Sharing (without meals)","unit": "per month"},
        ],
    },
    {
        "id": "household",
        "name": "Household Help & Misc",
        "icon": "🧹",
        "description": "Domestic help, laundry services, and monthly miscellaneous expenses",
        "items": [
            {"key": "Cook (part-time, 2 meals/day)per month", "label": "Cook (part-time, 2 meals/day)", "unit": "per month"},
            {"key": "Maid / Cleaning Helpper month",          "label": "Maid / Cleaning Help",          "unit": "per month"},
            {"key": "Laundry / Ironing (dhobi)per month",    "label": "Laundry / Ironing (dhobi)",    "unit": "per month"},
            {"key": "Miscellaneous Monthly Spendper month",  "label": "Miscellaneous Monthly Spend",  "unit": "per month"},
        ],
    },
    {
        "id": "shopping",
        "name": "Shopping & Online",
        "icon": "🛍️",
        "description": "Clothing, footwear, and online subscription costs",
        "items": [
            {"key": "Men's Casual Shirt (Zara/H&M)per piece", "label": "Men's Casual Shirt (Zara/H&M)", "unit": "per piece"},
            {"key": "Women's Dress (Myntra/Zara)per piece",   "label": "Women's Dress (Myntra/Zara)",   "unit": "per piece"},
            {"key": "Running Shoes (Nike/Adidas)per pair",    "label": "Running Shoes (Nike/Adidas)",   "unit": "per pair"},
            {"key": "Skincare Basics (Nykaa avg)per month",   "label": "Skincare Basics (Nykaa avg)",   "unit": "per month"},
            {"key": "Amazon Prime Membershipper month",        "label": "Amazon Prime Membership",       "unit": "per month"},
        ],
    },
    {
        "id": "lifestyle",
        "name": "Lifestyle & Entertainment",
        "icon": "🎬",
        "description": "Gym, movies, streaming services, and personal grooming",
        "items": [
            {"key": "Gym Membershipper month",                   "label": "Gym Membership",                   "unit": "per month"},
            {"key": "Movie Ticket (Multiplex)per ticket",        "label": "Movie Ticket (Multiplex)",         "unit": "per ticket"},
            {"key": "Netflix (Standard Plan)per month",          "label": "Netflix (Standard Plan)",          "unit": "per month"},
            {"key": "Spotify Premiumper month",                  "label": "Spotify Premium",                  "unit": "per month"},
            {"key": "Haircut (Men, basic salon)per cut",         "label": "Haircut (Men, basic salon)",       "unit": "per cut"},
            {"key": "Domestic Beer (pint, restaurant)per pint",  "label": "Domestic Beer (restaurant)",       "unit": "per pint"},
            {"key": "Imported Beer (bottle, restaurant)per bottle","label": "Imported Beer (restaurant)",     "unit": "per bottle"},
        ],
    },
]


def _city_key(name: str) -> str:
    """Normalise a city display name to the lowercase JSON key."""
    return name.lower().replace(" ", "-")


def get_city_raw(city_name: str) -> Optional[Dict[str, Any]]:
    """Return full categorised price data for one city, or None if not found."""
    raw = get_raw_json()
    city_data = raw.get(city_name.lower()) or raw.get(_city_key(city_name))
    if not city_data:
        for key in raw:
            if key.lower() == city_name.lower():
                city_data = raw[key]
                break
    if not city_data:
        return None

    categories_result = []
    for cat in CATEGORIES:
        items = []
        for item in cat["items"]:
            raw_val = city_data.get(item["key"], None)
            items.append({
                "label": item["label"],
                "unit": item["unit"],
                "value": raw_val if raw_val else "—",
                "numeric": parse_inr(raw_val),
                "raw_key": item["key"],
            })
        categories_result.append({
            "id": cat["id"],
            "name": cat["name"],
            "icon": cat["icon"],
            "description": cat["description"],
            "items": items,
        })

    return {
        "city": city_name,
        "categories": categories_result,
        "raw": city_data,
    }


def get_cities_index_list() -> List[Dict]:
    """Returns all 54 cities with cost-of-living index (Mumbai = 100) and key prices."""
    raw = get_raw_json()
    totals: Dict[str, int] = {}

    for city_key, city_data in raw.items():
        rent = parse_inr(city_data.get("1 BHK Outside City Centreper month", "0"))
        food = parse_inr(city_data.get("Veg Thali (local restaurant)per plate", "0")) * 60
        utilities = (
            parse_inr(city_data.get("Electricityper month", "0"))
            + parse_inr(city_data.get("Broadband Internetper month", "0"))
        )
        transport = parse_inr(
            city_data.get("Metro / Local Train (monthly pass)per month", "0")
        ) or parse_inr(city_data.get("Bus (monthly pass)per month", "0"))
        grocery = (
            parse_inr(city_data.get("Rice (Basmati)1 kg", "0")) * 5
            + parse_inr(city_data.get("Milk (Full Cream)1 litre", "0")) * 15
            + parse_inr(city_data.get("Chicken1 kg", "0")) * 4
            + 1000
        )
        totals[city_key] = rent + food + utilities + transport + grocery

    mumbai_total = totals.get("mumbai", 1)

    result = []
    for city_key, city_data in raw.items():
        city_name = city_key.title().replace("-", " ").replace(" ", "-")
        # Better display name: title case each word separated by hyphen
        display_name = " ".join(p.capitalize() for p in city_key.split("-"))
        total = totals[city_key]
        index = round((total / mumbai_total) * 100) if mumbai_total > 0 else 0

        result.append({
            "city": display_name,
            "city_key": city_key,
            "index": index,
            "veg_thali": city_data.get("Veg Thali (local restaurant)per plate", "—"),
            "rent_1bhk_centre": city_data.get("1 BHK in City Centreper month", "—"),
            "pg_double": city_data.get("PG - Double Sharing (with meals)per month", "—"),
            "petrol": city_data.get("Petrol1 litre", "—"),
        })

    result.sort(key=lambda x: x["index"], reverse=True)
    return result
