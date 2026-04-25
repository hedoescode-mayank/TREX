import os
import json
import re
import threading
from typing import Optional, Dict, Any
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

_LLM_SEMAPHORE = threading.Semaphore(1)  # Strict concurrency limit
_LLM_TIMEOUT_SECONDS = 30

def get_groq_api_key():
    return os.getenv("GROQ_API_KEY", "")

SYSTEM_PROMPT = """You are a cost-of-living analysis engine for Indian cities. Your task is to explain verified city data in a professional, concise, non-promotional tone. Use only the provided dataset and normalized city records. Compare cities using ranked indices, rent, food, transport, and affordability signals. When data is incomplete, state that explicitly. Do not invent prices, do not add hype, do not sound conversational unless the user asks for it. Produce structured, readable, long-form responses suitable for a finance or relocation tool. Prioritize accuracy, clarity, and practical interpretation over creativity.

Return a valid JSON object with EXACTLY this structure:
{
  "popular_areas": ["area name 1", "area name 2"],
  "unpopular_areas": ["area name 1", "area name 2"],
  "helpful_contacts": ["contact or app name 1", "contact or app name 2"],
  "affordability_notes": "<long-form explanation paragraph focusing on budget impact, transport, and lifestyle>"
}
Return ONLY valid JSON and no markdown formatting. Do not wrap in ```json or ```.
"""

def generate_city_insights(city_name: str, city_data: Dict[str, Any]) -> Optional[dict]:
    api_key = get_groq_api_key()
    if not api_key:
        print("[LLM] No API key found in environment for city insights.")
        return None
    
    result_container = [None]
    error_container = [None]
    
    data_summary = json.dumps(city_data, indent=2)

    def _call_llm():
        try:
            llm = ChatGroq(
                api_key=api_key,
                model="llama-3.3-70b-versatile",
                temperature=0.2,
                max_tokens=600,
                request_timeout=25,
            )

            user_message = (
                f"=== CITY ===\n{city_name}\n\n"
                f"=== VERIFIED DATA ===\n{data_summary}\n"
            )

            messages = [
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=user_message),
            ]

            response = llm.invoke(messages)
            raw = response.content.strip()

            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)

            try:
                result_container[0] = json.loads(raw)
            except json.JSONDecodeError:
                match = re.search(r'\{[\s\S]+\}', raw)
                if match:
                    result_container[0] = json.loads(match.group())
                else:
                    result_container[0] = {
                        "popular_areas": [],
                        "unpopular_areas": [],
                        "helpful_contacts": ["NoBroker", "99acres", "MagicBricks"],
                        "affordability_notes": "AI analysis completed but structural extraction failed."
                    }
        except Exception as e:
            error_container[0] = str(e)
            print(f"[LLM City] Error: {e}")

    acquired = _LLM_SEMAPHORE.acquire(timeout=5)
    if not acquired:
        print("[LLM] Semaphore busy - skipping city insights to protect resources.")
        return None

    try:
        thread = threading.Thread(target=_call_llm, daemon=True)
        thread.start()
        thread.join(timeout=_LLM_TIMEOUT_SECONDS)

        if thread.is_alive():
            print("[LLM] Timed out on city insights - returning None.")
            return None

        if error_container[0]:
            print(f"[LLM] Error inside thread: {error_container[0]}")
            return None

        return result_container[0]

    finally:
        _LLM_SEMAPHORE.release()
