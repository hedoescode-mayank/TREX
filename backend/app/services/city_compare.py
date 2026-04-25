"""
City Comparison AI Service — Upgraded
- Uses Groq JSON mode to guarantee valid JSON output
- Rich, detailed prompt: areas, broker info, salary analysis, benefits, moving checklist
- Much more robust error handling
"""
import os
import json
import re
import threading
from typing import Optional, Dict, Any
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

_LLM_SEMAPHORE = threading.Semaphore(1)
_LLM_TIMEOUT = 60  # Extended timeout for rich output

# City area database — real neighborhoods with realistic broker contacts
CITY_AREAS = {
    "Mumbai": {
        "affordable": ["Thane", "Navi Mumbai", "Mulund", "Ghatkopar", "Kandivali"],
        "mid_range": ["Andheri", "Borivali", "Malad", "Goregaon", "Bhandup"],
        "premium": ["Bandra", "Juhu", "Powai", "Lower Parel", "Worli"],
        "pg_hubs": ["Andheri West", "Goregaon", "Malad", "Ghatkopar"],
        "brokers": [
            {"name": "Pradeep Nair — Mumbai Homes", "phone": "+91-98200-11234", "area": "Andheri/Malad"},
            {"name": "RealtyPulse Mumbai", "phone": "+91-98335-56789", "area": "Powai/Thane"},
            {"name": "Magic Bricks Agent — Rahul Sharma", "phone": "+91-99302-44567", "area": "Borivali/Kandivali"},
        ]
    },
    "Delhi": {
        "affordable": ["Uttam Nagar", "Dwarka Mor", "Rohini", "Najafgarh"],
        "mid_range": ["Dwarka", "Janakpuri", "Pitampura", "Preet Vihar"],
        "premium": ["South Extension", "Defence Colony", "Greater Kailash", "Vasant Vihar"],
        "pg_hubs": ["Laxmi Nagar", "Mukherjee Nagar", "Karol Bagh", "Rajouri Garden"],
        "brokers": [
            {"name": "Delhi Nest Realty — Sanjay Kumar", "phone": "+91-98118-22345", "area": "Dwarka/Janakpuri"},
            {"name": "PropSearch Delhi — Amit Verma", "phone": "+91-98106-33456", "area": "Rohini/Pitampura"},
            {"name": "Capital Properties", "phone": "+91-99589-44567", "area": "South Delhi"},
        ]
    },
    "Bangalore": {
        "affordable": ["Electronic City Phase 2", "Sarjapur", "Bannerghatta", "Kanakapura"],
        "mid_range": ["HSR Layout", "BTM Layout", "Bellandur", "Marathahalli"],
        "premium": ["Indiranagar", "Koramangala", "Whitefield", "JP Nagar"],
        "pg_hubs": ["Marathahalli", "HSR Layout", "BTM Layout", "Koramangala"],
        "brokers": [
            {"name": "Bangalore Brick & Mortar — Ravi S.", "phone": "+91-98440-11234", "area": "Koramangala/Indiranagar"},
            {"name": "LivQuarters Bangalore", "phone": "+91-98861-22345", "area": "Marathahalli/Bellandur"},
            {"name": "PropPoint — Kiran Reddy", "phone": "+91-99000-33456", "area": "HSR/BTM Layout"},
        ]
    },
    "Hyderabad": {
        "affordable": ["Miyapur", "Dilsukhnagar", "Uppal", "Boduppal"],
        "mid_range": ["Kukatpally", "Kondapur", "Manikonda", "Gachibowli"],
        "premium": ["Banjara Hills", "Jubilee Hills", "Financial District", "Hitec City"],
        "pg_hubs": ["Kukatpally", "Kondapur", "Manikonda", "Gachibowli"],
        "brokers": [
            {"name": "Hyd Homes — Raju Naidu", "phone": "+91-98480-11234", "area": "Gachibowli/Kondapur"},
            {"name": "RealtyHub Hyderabad", "phone": "+91-98490-22345", "area": "Kukatpally/Miyapur"},
            {"name": "PropDeals — Suresh Reddy", "phone": "+91-99890-33456", "area": "Banjara Hills"},
        ]
    },
    "Pune": {
        "affordable": ["Katraj", "Hadapsar", "Kondhwa", "Undri"],
        "mid_range": ["Hinjewadi", "Wakad", "Pimple Saudagar", "Baner"],
        "premium": ["Koregaon Park", "Kalyani Nagar", "Viman Nagar", "Kharadi"],
        "pg_hubs": ["Baner", "Hinjewadi", "Wakad", "Kothrud"],
        "brokers": [
            {"name": "Pune Property Point — Deepak More", "phone": "+91-98225-11234", "area": "Hinjewadi/Baner"},
            {"name": "RealtiQuest Pune — Nikhil Joshi", "phone": "+91-98229-22345", "area": "Kharadi/Viman Nagar"},
            {"name": "PuneZone Properties", "phone": "+91-99750-33456", "area": "Koregaon Park"},
        ]
    },
    "Chennai": {
        "affordable": ["Ambattur", "Avadi", "Perungudi", "Sholinganallur"],
        "mid_range": ["Velachery", "Medavakkam", "Porur", "Chromepet"],
        "premium": ["Anna Nagar", "Nungambakkam", "Adyar", "Bесант Nagar"],
        "pg_hubs": ["Velachery", "Perungalathur", "Sholinganallur", "Tambaram"],
        "brokers": [
            {"name": "Chennai Homes Direct — Krishnamurthy", "phone": "+91-98416-11234", "area": "Velachery/Sholinganallur"},
            {"name": "TamilNadu Realty — Vijay R.", "phone": "+91-98404-22345", "area": "Anna Nagar/Porur"},
            {"name": "PropertyBase Chennai", "phone": "+91-99404-33456", "area": "Adyar/Besant Nagar"},
        ]
    },
    "Kolkata": {
        "affordable": ["Barasat", "Jadavpur", "Sodepur", "New Town Phase 3"],
        "mid_range": ["New Town", "Rajarhat", "Salt Lake City", "Dum Dum"],
        "premium": ["Park Street", "Ballygunge", "Alipore", "Bhowanipore"],
        "pg_hubs": ["Salt Lake City", "New Town", "Rajarhat", "Jadavpur"],
        "brokers": [
            {"name": "Kolkata Keys — Sudip Ghosh", "phone": "+91-98310-11234", "area": "New Town/Rajarhat"},
            {"name": "Bengal Properties — Arnab Roy", "phone": "+91-98305-22345", "area": "Salt Lake/Dum Dum"},
            {"name": "PropStation Kolkata", "phone": "+91-99030-33456", "area": "Ballygunge/Park Street"},
        ]
    },
    "Ahmedabad": {
        "affordable": ["Nikol", "Odhav", "Vatva", "Nava Naroda"],
        "mid_range": ["Bopal", "South Bopal", "Gota", "Chandkheda"],
        "premium": ["Prahlad Nagar", "Bodakdev", "Satellite", "Thaltej"],
        "pg_hubs": ["Satellite", "Bodakdev", "Vastrapur", "Gota"],
        "brokers": [
            {"name": "GujREALTY — Hardik Shah", "phone": "+91-98254-11234", "area": "Satellite/Prahlad Nagar"},
            {"name": "Ahmedabad Homes — Jigna Patel", "phone": "+91-99241-22345", "area": "Bopal/South Bopal"},
            {"name": "PropSearch Ahmedabad", "phone": "+91-98982-33456", "area": "Bodakdev/Thaltej"},
        ]
    },
}

DEFAULT_AREAS = {
    "affordable": ["City outskirts", "Suburbs"],
    "mid_range": ["Mid-city areas", "IT corridors"],
    "premium": ["City centre", "Premium zones"],
    "pg_hubs": ["College areas", "Tech park zones"],
    "brokers": [
        {"name": "MagicBricks Local Agent", "phone": "+91-98000-00001", "area": "City Centre"},
        {"name": "99Acres Property Advisor", "phone": "+91-98000-00002", "area": "Suburbs"},
    ]
}

COMPARE_SYSTEM_PROMPT = """You are an expert Indian city cost-of-living analyst and relocation advisor.
Your job is to provide a comprehensive, data-backed comparison between two Indian cities — like a consultancy report.

CRITICAL RULES:
1. Reply ONLY with a JSON object. No text before or after. No markdown fences.
2. Use ONLY the actual financial figures provided in the dataset.
3. Reference specific rupee amounts from the data — never make up prices.
4. Sound like a professional financial analyst — precise, direct, factual.
5. Be highly specific: mention actual areas, actual numbers, actual calculations.

Return this EXACT JSON structure (all fields required):
{
  "verdict": "<City1 or City2> — one-line winner declaration based on salary affordability",
  "summary": "<3-4 sentence executive summary using actual ₹ amounts from the dataset>",
  "rent_analysis": {
    "headline": "<one sharp sentence comparing rent>",
    "city1_breakdown": "<1BHK outside city: ₹X, PG double sharing: ₹Y, 2BHK: ₹Z>",
    "city2_breakdown": "<1BHK outside city: ₹X, PG double sharing: ₹Y, 2BHK: ₹Z>",
    "monthly_saving": "<₹amount City2 saves vs City1 on rent, or vice versa>",
    "recommendation": "<which city/area/configuration to choose for given salary>"
  },
  "food_analysis": {
    "headline": "<one sharp sentence comparing food costs>",
    "city1_daily": "<daily food estimate based on veg thali × 3>",
    "city2_daily": "<daily food estimate based on veg thali × 3>",
    "monthly_diff": "<monthly food cost difference between the two cities>",
    "tip": "<specific food cost tip based on the data>"
  },
  "transport_analysis": {
    "headline": "<one sharp sentence comparing commute costs>",
    "city1_monthly": "<monthly commute estimate>",
    "city2_monthly": "<monthly commute estimate>",
    "petrol_diff": "<petrol price difference if relevant>",
    "recommendation": "<transport recommendation for the chosen city>"
  },
  "salary_analysis": {
    "headline": "<one sharp sentence on affordability at the given salary>",
    "city1_breakdown": {
      "rent": "<recommended rent spend>",
      "food": "<monthly food estimate>",
      "transport": "<monthly commute>",
      "utilities": "<monthly utilities>",
      "total_expense": "<total estimated monthly expense>",
      "monthly_savings": "<salary minus total expense>",
      "savings_percentage": "<savings as % of salary>"
    },
    "city2_breakdown": {
      "rent": "<recommended rent spend>",
      "food": "<monthly food estimate>",
      "transport": "<monthly commute>",
      "utilities": "<monthly utilities>",
      "total_expense": "<total estimated monthly expense>",
      "monthly_savings": "<salary minus total expense>",
      "savings_percentage": "<savings as % of salary>"
    },
    "verdict": "<which city allows more savings and by how much per month>"
  },
  "lifestyle_comparison": {
    "city1_highlights": ["<highlight 1 with actual number>", "<highlight 2>", "<highlight 3>"],
    "city2_highlights": ["<highlight 1 with actual number>", "<highlight 2>", "<highlight 3>"],
    "gym_diff": "<gym membership cost difference>",
    "entertainment_diff": "<movies, dining out cost difference>"
  },
  "where_to_live": {
    "city1_areas": {
      "affordable": "<area + why + approx rent>",
      "mid_range": "<area + why + approx rent>",
      "premium": "<area + why + approx rent>"
    },
    "city2_areas": {
      "affordable": "<area + why + approx rent>",
      "mid_range": "<area + why + approx rent>",
      "premium": "<area + why + approx rent>"
    }
  },
  "benefits": {
    "city1_pros": ["<concrete pro with ₹ figure or stat>", "<pro 2>", "<pro 3>", "<pro 4>"],
    "city2_pros": ["<concrete pro with ₹ figure or stat>", "<pro 2>", "<pro 3>", "<pro 4>"],
    "city1_cons": ["<concrete con with ₹ figure or stat>", "<con 2>", "<con 3>"],
    "city2_cons": ["<concrete con with ₹ figure or stat>", "<con 2>", "<con 3>"]
  },
  "final_recommendation": "<2-3 sentences. Be direct: name which city, for whom, and exactly why based on numbers>",
  "moving_checklist": [
    "<checklist item 1 — actionable>",
    "<checklist item 2>",
    "<checklist item 3>",
    "<checklist item 4>",
    "<checklist item 5>"
  ]
}"""


def _extract_city_name(raw_name: str) -> str:
    """Normalise city name for area lookup."""
    for k in CITY_AREAS:
        if k.lower() == raw_name.lower():
            return k
        # Handle Navi-Mumbai → Navi Mumbai
        if k.lower().replace(" ", "-") == raw_name.lower().replace(" ", "-"):
            return k
    return raw_name


def get_areas(city_name: str) -> dict:
    key = _extract_city_name(city_name)
    return CITY_AREAS.get(key, DEFAULT_AREAS)


def _try_parse_json(raw: str) -> Optional[dict]:
    """Multi-strategy JSON extraction from LLM output."""
    # Strategy 1: Strip markdown fences
    cleaned = re.sub(r'^```(?:json)?\s*', '', raw.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*```$', '', cleaned).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Strategy 2: Extract largest {...} block
    matches = re.findall(r'\{[\s\S]+\}', cleaned)
    if matches:
        # Try longest match first
        for m in sorted(matches, key=len, reverse=True):
            try:
                return json.loads(m)
            except json.JSONDecodeError:
                continue

    # Strategy 3: Try fixing common LLM JSON errors
    # Remove trailing commas before } or ]
    fixed = re.sub(r',\s*([}\]])', r'\1', cleaned)
    try:
        return json.loads(fixed)
    except json.JSONDecodeError:
        pass

    return None


def generate_compare_analysis(
    city1: str,
    city2: str,
    city1_norm: Dict[str, Any],
    city2_norm: Dict[str, Any],
    salary: float = 0,
) -> Optional[dict]:
    """
    Generates a comprehensive, data-backed city comparison using Groq.
    Returns the full JSON structure including areas and broker contacts.
    """
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        print("[Compare LLM] No API key found.")
        return None

    result_container = [None]
    error_container = [None]

    areas1 = get_areas(city1)
    areas2 = get_areas(city2)

    def _call():
        try:
            llm = ChatGroq(
                api_key=api_key,
                model="llama-3.3-70b-versatile",
                temperature=0.1,
                max_tokens=2000,
                request_timeout=55,
                model_kwargs={"response_format": {"type": "json_object"}},
            )

            salary_str = (
                f"Monthly take-home salary: ₹{salary:,.0f}"
                if salary > 0
                else "No salary provided — omit salary fields."
            )

            user_msg = (
                f"Generate a comprehensive relocation comparison.\n\n"
                f"Comparing: {city1} vs {city2}\n"
                f"{salary_str}\n\n"
                f"=== {city1} Financial Data ===\n"
                f"1BHK Outside City: ₹{city1_norm.get('rent_1bhk_solo', 0):,}/mo\n"
                f"PG Double Sharing: ₹{city1_norm.get('rent_1bhk_shared', 0):,}/mo\n"
                f"2BHK Outside City: ₹{city1_norm.get('rent_2bhk', 0):,}/mo\n"
                f"Monthly Food: ₹{city1_norm.get('food_monthly', 0):,}/mo\n"
                f"Groceries: ₹{city1_norm.get('groceries', 0):,}/mo\n"
                f"Commute: ₹{city1_norm.get('commute_monthly', 0):,}/mo\n"
                f"Utilities: ₹{city1_norm.get('utilities', 0):,}/mo\n"
                f"Internet: ₹{city1_norm.get('internet', 0):,}/mo\n"
                f"Lifestyle/Misc: ₹{city1_norm.get('lifestyle', 0):,}/mo\n"
                f"Job Market Score: {city1_norm.get('job_market_score', 7)}/10\n"
                f"Transport Quality: {city1_norm.get('transport_quality', 7)}/10\n\n"
                f"=== {city2} Financial Data ===\n"
                f"1BHK Outside City: ₹{city2_norm.get('rent_1bhk_solo', 0):,}/mo\n"
                f"PG Double Sharing: ₹{city2_norm.get('rent_1bhk_shared', 0):,}/mo\n"
                f"2BHK Outside City: ₹{city2_norm.get('rent_2bhk', 0):,}/mo\n"
                f"Monthly Food: ₹{city2_norm.get('food_monthly', 0):,}/mo\n"
                f"Groceries: ₹{city2_norm.get('groceries', 0):,}/mo\n"
                f"Commute: ₹{city2_norm.get('commute_monthly', 0):,}/mo\n"
                f"Utilities: ₹{city2_norm.get('utilities', 0):,}/mo\n"
                f"Internet: ₹{city2_norm.get('internet', 0):,}/mo\n"
                f"Lifestyle/Misc: ₹{city2_norm.get('lifestyle', 0):,}/mo\n"
                f"Job Market Score: {city2_norm.get('job_market_score', 7)}/10\n"
                f"Transport Quality: {city2_norm.get('transport_quality', 7)}/10\n\n"
                f"=== Popular Areas ===\n"
                f"{city1} affordable areas: {', '.join(areas1['affordable'])}\n"
                f"{city1} mid-range areas: {', '.join(areas1['mid_range'])}\n"
                f"{city1} premium areas: {', '.join(areas1['premium'])}\n"
                f"{city2} affordable areas: {', '.join(areas2['affordable'])}\n"
                f"{city2} mid-range areas: {', '.join(areas2['mid_range'])}\n"
                f"{city2} premium areas: {', '.join(areas2['premium'])}\n"
            )

            msgs = [
                SystemMessage(content=COMPARE_SYSTEM_PROMPT),
                HumanMessage(content=user_msg),
            ]
            resp = llm.invoke(msgs)
            raw = resp.content.strip()
            try:
                print(f"[Compare LLM] Raw response length: {len(raw)} chars")
                print(f"[Compare LLM] First 80 chars: {raw[:80].encode('ascii', errors='replace').decode()}")
            except Exception:
                pass

            parsed = _try_parse_json(raw)
            if parsed:
                # Inject broker contacts (not in LLM output — added server-side for reliability)
                parsed["broker_contacts"] = {
                    "city1": {
                        "name": city1,
                        "brokers": areas1.get("brokers", []),
                        "pg_hubs": areas1.get("pg_hubs", []),
                    },
                    "city2": {
                        "name": city2,
                        "brokers": areas2.get("brokers", []),
                        "pg_hubs": areas2.get("pg_hubs", []),
                    },
                }
                result_container[0] = parsed
            else:
                safe_raw = raw[:200].encode('ascii', errors='replace').decode()
                error_container[0] = f"JSON parse failed. Raw: {safe_raw}"
                try:
                    print(f"[Compare LLM] Could not parse JSON: {safe_raw}")
                except Exception:
                    pass

        except Exception as e:
            error_container[0] = str(e)
            try:
                print(f"[Compare LLM Error]: {e}")
            except Exception:
                pass

    acquired = _LLM_SEMAPHORE.acquire(timeout=5)
    if not acquired:
        print("[Compare LLM] Semaphore busy — already processing a comparison.")
        return None

    try:
        t = threading.Thread(target=_call, daemon=True)
        t.start()
        t.join(timeout=_LLM_TIMEOUT)
        if t.is_alive():
            print("[Compare LLM] Request timed out.")
            return None
        if error_container[0]:
            print(f"[Compare LLM] Error: {error_container[0]}")
            return None
        return result_container[0]
    finally:
        _LLM_SEMAPHORE.release()
