from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from typing import Optional

from app.schemas.resume import ResumeAnalysisResponse, SectionScores, AIFeedback
from app.services.resume_parser import extract_text_from_pdf, normalize_text, extract_entities
from app.services.role_parser import preprocess_role
from app.services.resume_sections import detect_sections
from app.services.keyword_matcher import match_keywords
from app.services.ats_checks import run_ats_checks
from app.services.resume_scoring import calculate_scores
from app.services.provider_router import route_provider

router = APIRouter()

# ─── Resource Limits ───────────────────────────────────────────────────
MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024   # 2 MB max upload (prevents RAM spike)
MAX_JD_LENGTH       = 5000              # Increased for deeper analysis


@router.post("/analyze", response_model=ResumeAnalysisResponse)
async def analyze_resume(
    job_description: str = Form(...),
    use_ai: bool = Form(False),
    provider: str = Form("groq"),
    resume_file: Optional[UploadFile] = File(None),
):
    """
    Analyze a resume against a job description using the structured ATS pipeline.
    Optionally returns deep AI feedback if use_ai is True.
    """
    print(f"[RECV] Analyzing resume: {resume_file.filename if resume_file else 'NO FILE'} | AI: {use_ai}")
    # 1. Validate inputs
    if not job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description is required"
        )

    if not resume_file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume PDF file is required"
        )

    # 2. Read file
    file_bytes = await resume_file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max allowed size is 2 MB."
        )

    # 3. Extract & Preprocess
    try:
        raw_text = extract_text_from_pdf(file_bytes)
        processed_text = normalize_text(raw_text)
        entities = extract_entities(processed_text)
        
        # Preprocess Role
        role_data = preprocess_role(job_description)
        trimmed_jd = role_data["clean_description"]
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    # 6. Pipeline Execution
    detected, missing_sections = detect_sections(processed_text)
    matched_kws, missing_kws, match_pct = match_keywords(processed_text, trimmed_jd)
    warnings = run_ats_checks(processed_text, detected)
    has_quantified = "Low quantified impact" not in str(warnings)

    score_data = calculate_scores(
        match_percentage=match_pct,
        missing_sections=missing_sections,
        warnings=warnings,
        has_quantified=has_quantified
    )

    # 7. AI Feedback (Structured)
    ai_response = None
    if use_ai:
        ai_data = route_provider(processed_text, trimmed_jd, provider=provider)
        if ai_data:
            ai_response = AIFeedback(**ai_data)
            # Add specific suggested resume changes to warnings if present
            if "suggested_resume_changes" in ai_data:
                warnings.extend(ai_data["suggested_resume_changes"])

    # 8. Default fallback suggestions
    improvement_suggestions = []
    if match_pct < 50:
        improvement_suggestions.append("Incorporate more keywords from the job description.")
    if missing_sections:
        improvement_suggestions.append(f"Add missing critical sections: {', '.join(missing_sections)}.")
    improvement_suggestions.extend(warnings)

    # 9. Response Construction
    return ResumeAnalysisResponse(
        overall_score=score_data["overall_score"],
        section_scores=SectionScores(**score_data["section_scores"]),
        matched_keywords=matched_kws,
        missing_keywords=missing_kws,
        detected_sections=detected,
        missing_sections=missing_sections,
        ats_warnings=warnings,
        improvement_suggestions=improvement_suggestions,
        ai_feedback=ai_response
    )
