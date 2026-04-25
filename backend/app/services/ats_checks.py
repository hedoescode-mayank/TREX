import re
from typing import List

def run_ats_checks(text: str, detected_sections: List[str]) -> List[str]:
    """
    Heuristics to check for common ATS optimization missteps.
    """
    warnings = []
    text_lower = text.lower()
    
    # 1. Contact info presence
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    if not re.search(email_pattern, text):
        warnings.append("No email address found or poorly formatted.")
        
    phone_pattern = r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    if not re.search(phone_pattern, text):
        warnings.append("No standard phone number found.")
        
    # 2. Length issues
    if len(text) < 500:
        warnings.append("Resume content is suspiciously short. Add more details about your experience.")
    
    # 3. Measurable metrics (quantified achievements)
    # Check for %, $, or multiplier like '10x'
    if not re.search(r'(\$|%|\d+x|\d+(?:\.\d+)?[MBK])', text_lower):
        warnings.append("Low quantified impact. Use numbers, percentages, or dollar amounts to measure achievements.")
        
    # 4. Critical sections missing
    if "experience" not in detected_sections and "projects" not in detected_sections:
        warnings.append("No experience or projects section detected. Provide concrete history.")
        
    if "skills" not in detected_sections:
        warnings.append("No distinct skills section found. ATS parses these easily.")
        
    return warnings
