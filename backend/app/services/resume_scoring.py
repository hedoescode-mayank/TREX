from typing import List, Dict

def calculate_scores(
    match_percentage: int,
    missing_sections: List[str],
    warnings: List[str],
    has_quantified: bool
) -> Dict[str, dict]:
    
    # Weights for overall score:
    # Keywords: 30%
    # Section completeness: 20%
    # Achievements/Impact: 20%
    # ATS formatting: 15%
    # Skills alignment (treated similarly to keywords for now): 15%
    
    # Section 1: Keywords mapping (0-100 to 0-30 points)
    keywords_score = min(100, max(0, match_percentage))
    
    # Section 2: Completeness mapping (20 points max, lose 5 per missing important section)
    penalty_missing = len(missing_sections) * 20
    sections_score = max(0, 100 - penalty_missing)
    
    # Section 3: Achievements (20 points max)
    achievements_score = 100 if has_quantified else 40 
    
    # Section 4: ATS format (15 points max)
    # Start at 100, minus 15 per warning
    ats_format_score = max(0, 100 - (len(warnings) * 15))
    
    # Section 5: Skills Alignment (using matched percentage)
    skills_alignment_score = keywords_score
    
    overall_score = (
        (keywords_score * 0.30) +
        (sections_score * 0.20) +
        (achievements_score * 0.20) +
        (ats_format_score * 0.15) +
        (skills_alignment_score * 0.15)
    )
    
    return {
        "overall_score": int(overall_score),
        "section_scores": {
            "keywords": int(keywords_score),
            "sections": int(sections_score),
            "achievements": int(achievements_score),
            "ats_format": int(ats_format_score),
            "skills_alignment": int(skills_alignment_score)
        }
    }
