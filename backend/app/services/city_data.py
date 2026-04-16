import json
from pathlib import Path

CITY_DATA_PATH = Path(__file__).parent.parent / "data" / "cities.json"

def get_city_data():
    with open(CITY_DATA_PATH, "r") as f:
        return json.load(f)
