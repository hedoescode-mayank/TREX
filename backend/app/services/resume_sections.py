import re
from typing import List, Tuple

SECTION_PATTERNS = {
    "summary": [r"\b(?:summary|objective|profile|professional summary|executive summary)\b"],
    "education": [r"\b(?:education|academic background|academics|qualifications)\b"],
    "experience": [r"\b(?:experience|work experience|employment history|professional experience|internships)\b"],
    "skills": [r"\b(?:skills|core competencies|technical skills|technologies)\b"],
    "projects": [r"\b(?:projects|academic projects|personal projects)\b"],
    "certifications": [r"\b(?:certifications|licenses|courses)\b"],
    "achievements": [r"\b(?:achievements|awards|honors)\b"]
}

IMPORTANT_SECTIONS = ["experience", "education", "skills"]

def detect_sections(text: str) -> Tuple[List[str], List[str]]:
    """
    Scans the normalized text for common section headers.
    Returns: (detected_sections, missing_important_sections)
    """
    text_lower = text.lower()
    
    # We will do a line-by-line analysis for better accuracy, looking for lines shorter than 50 chars that match our patterns
    lines = text_lower.split('\n')
    detected = set()
    
    for line in lines:
        line_clean = line.strip()
        if len(line_clean) < 60: # It's likely a header
            for section, patterns in SECTION_PATTERNS.items():
                for pattern in patterns:
                    if re.search(r"^" + pattern + r"[:\s]*$", line_clean) or re.search(pattern, line_clean):
                        detected.add(section)

    detected_list = list(detected)
    missing = [sec for sec in IMPORTANT_SECTIONS if sec not in detected_list]
    
    return detected_list, missing
