import re
from typing import Dict, Any

def preprocess_role(jd_text: str) -> Dict[str, Any]:
    """
    Extract structured information from the job description.
    """
    # Normalize JD
    jd_clean = re.sub(r'[ \t]+', ' ', jd_text)
    jd_clean = re.sub(r'\n{3,}', '\n\n', jd_clean).strip()
    
    role_info = {
        "role_title": "Unknown",
        "company_name": "Unknown",
        "required_skills": [],
        "preferred_skills": [],
        "responsibilities": [],
        "seniority": "Not Specified",
        "domain": "Not Specified",
        "links": []
    }
    
    # Extract links
    role_info["links"] = list(set(re.findall(r'https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)', jd_clean)))

    # Heuristic for Role Title (usually first line if short)
    lines = [l.strip() for l in jd_clean.split('\n') if l.strip()]
    if lines and len(lines[0].split()) < 6:
        role_info["role_title"] = lines[0]
        
    # Heuristic for Company (often "About [Company]" or "[Company] is looking for")
    company_match = re.search(r'(?:About|at|join)\s+([A-Z][a-zA-Z0-9&]+(?:\s+[A-Z][a-zA-Z0-9&]+){0,2})', jd_clean)
    if company_match:
        role_info["company_name"] = company_match.group(1)

    # Heuristic for Seniority
    seniority_keywords = ["Junior", "Senior", "Lead", "Principal", "Staff", "Manager", "Intern", "Entry-level"]
    for kw in seniority_keywords:
        if re.search(rf'\b{kw}\b', jd_clean, re.IGNORECASE):
            role_info["seniority"] = kw
            break

    # Extract sections using common headers
    sections = {
        "requirements": [r'requirements', r'qualifications', r'must have', r'what you need'],
        "preferred": [r'preferred', r'nice to have', r'plus', r'bonus'],
        "responsibilities": [r'responsibilities', r'what you will do', r'the role', r'your day']
    }
    
    for key, patterns in sections.items():
        found = False
        for pattern in patterns:
            match = re.search(rf'{pattern}', jd_clean, re.IGNORECASE)
            if match:
                # Capture text until next major header or double newline
                start_idx = match.end()
                # Look for bullet points in the following text
                following_text = jd_clean[start_idx:start_idx+1000]
                bullets = re.findall(r'^[ \t]*[-•●*][ \t]*(.+)$', following_text, re.MULTILINE)
                if bullets:
                    if key == "requirements": role_info["required_skills"] = bullets[:15]
                    elif key == "preferred": role_info["preferred_skills"] = bullets[:10]
                    elif key == "responsibilities": role_info["responsibilities"] = bullets[:10]
                    found = True
                    break
        
    role_info["clean_description"] = jd_clean[:2000] # Cap for LLM input
    
    return role_info
