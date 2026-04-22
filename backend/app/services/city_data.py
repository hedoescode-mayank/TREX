import json
from pathlib import Path
from typing import List, Dict, Any

CITY_DATA_PATH = Path(__file__).parent.parent / "data" / "cities.json"

# Cache for city data
_CACHED_CITIES: List[Dict[str, Any]] = []

def get_city_data() -> List[Dict[str, Any]]:
    global _CACHED_CITIES
    if not _CACHED_CITIES:
        print(f"[CACHE] Loading city data from {CITY_DATA_PATH}")
        with open(CITY_DATA_PATH, "r") as f:
            _CACHED_CITIES = json.load(f)
    return _CACHED_CITIES
