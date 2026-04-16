import re
from typing import Tuple, List

# A simple list of common English stop words to filter out
STOP_WORDS = set([
    "the", "and", "for", "with", "that", "this", "from", "are", "not", "but", "can", "you", "all", "our", "out", "one", "has", "had", "have",
    "more", "than", "will", "your", "have", "such", "also", "into", "only", "over", "very", "just", "when", "what", "who", "which", "where",
    "why", "how", "all", "each", "every", "both", "few", "more", "most", "other", "some", "such", "any", "many", "much", "even", "then",
    "experience", "years", "work", "job", "role", "team", "strong", "ability"
])

def extract_keywords(text: str) -> List[str]:
    """Extract sensible keywords from text."""
    # Convert to lower case and find words
    words = re.findall(r"\b[a-z0-9+#.-]{2,}\b", text.lower())
    # Filter out stopwords and short meaningless words
    keywords = [w for w in words if w not in STOP_WORDS]
    # Unique preserve order mostly
    return list(dict.fromkeys(keywords))

def match_keywords(resume_text: str, job_description: str) -> Tuple[List[str], List[str], int]:
    """
    Compares JD keywords to Resume and returns missing and matched, and a raw overlap %.
    """
    if not job_description.strip():
        return [], [], 100

    jd_keywords = extract_keywords(job_description)
    resume_keywords_set = set(extract_keywords(resume_text))
    
    # We want meaningful jd keywords, limit to top 50 unique
    jd_keywords = list(dict.fromkeys(jd_keywords))[:50]
    
    matched = []
    missing = []
    
    for kw in jd_keywords:
        if kw in resume_keywords_set:
            matched.append(kw)
        else:
            missing.append(kw)
            
    match_percentage = 0
    if jd_keywords:
        match_percentage = int((len(matched) / len(jd_keywords)) * 100)
        
    return matched, missing, match_percentage
