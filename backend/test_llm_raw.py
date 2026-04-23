import sys, os, json, re
sys.path.insert(0, '.')
sys.stdout.reconfigure(encoding='utf-8')

# Use environment variable for testing
GROQ_KEY = os.environ.get("GROQ_API_KEY", "")

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

llm = ChatGroq(
    api_key=GROQ_KEY,
    model='llama-3.3-70b-versatile',
    temperature=0.15,
    max_tokens=200,
    request_timeout=30
)

resp = llm.invoke([
    SystemMessage(content='You are a JSON API. Reply ONLY with a valid JSON object. No markdown fences. No explanation text.'),
    HumanMessage(content='Return exactly this JSON object: {"status": "ok", "city": "Bangalore"}')
])
print('RAW LLM response repr:')
print(repr(resp.content[:500]))
print()

# Extraction test
raw = resp.content.strip()
raw_clean = re.sub(r'^```(?:json)?\s*', '', raw)
raw_clean = re.sub(r'\s*```$', '', raw_clean).strip()
try:
    parsed = json.loads(raw_clean)
    print('Direct parse OK:', parsed)
except Exception as e:
    print('Direct parse failed:', e)
    m = re.search(r'\{[\s\S]+\}', raw_clean, re.DOTALL)
    if m:
        try:
            parsed = json.loads(m.group())
            print('Regex extracted:', parsed)
        except Exception as e2:
            print('Regex parse also failed:', e2)
            print('Raw was:', raw_clean[:200])
