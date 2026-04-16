from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from typing import Optional

from app.schemas.resume import ResumeAnalysisResponse, SectionScores, AIFeedback
from app.services.resume_parser import extract_text_from_pdf, normalize_text
from app.services.resume_sections import detect_sections
from app.services.keyword_matcher import match_keywords
from app.services.ats_checks import run_ats_checks
from app.services.resume_scoring import calculate_scores
from app.services.provider_router import route_provider

router = APIRouter()

# ─── Resource Limits ───────────────────────────────────────────────────
MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024   # 2 MB max upload (prevents RAM spike)
MAX_JD_LENGTH       = 3000              # Trim JD so keyword match is fast


@router.post("/analyze", response_model=ResumeAnalysisResponse)
async def analyze_resume(
    job_description: str = Form(...),
    use_ai: bool = Form(False),
    provider: str = Form("groq"),
    resume_file: Optional[UploadFile] = File(None),
):
    """
    Analyze a resume against a job description using the structured ATS pipeline.
    Optionally returns AI feedback if use_ai is True.

    Resource guardrails:
    - Max file size: 2 MB
    - Max JD length: 3000 chars
    - AI calls: max 1 at a time with 25 s timeout (see llm_feedback.py)
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

    if not resume_file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported"
        )

    # 2. Read file with size guard (prevents huge file from killing RAM/disk)
    file_bytes = await resume_file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max allowed size is 2 MB. Your file: {len(file_bytes)//1024} KB"
        )

    # 3. Extract Text
    try:
        raw_text = extract_text_from_pdf(file_bytes)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )

    if len(raw_text) < 50:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Resume content too short or text extraction failed."
        )

    # 4. Clean Text
    processed_text = normalize_text(raw_text)

    # 5. Trim JD to avoid long keyword scan loops
    trimmed_jd = job_description[:MAX_JD_LENGTH]

    # 6. Pipeline Execution
    # A. Sections
    detected, missing_sections = detect_sections(processed_text)

    # B. Keywords
    matched_kws, missing_kws, match_pct = match_keywords(processed_text, trimmed_jd)

    # C. ATS Checks
    warnings = run_ats_checks(processed_text, detected)
    has_quantified = "Low quantified impact" not in str(warnings)

    # D. Scoring System
    score_data = calculate_scores(
        match_percentage=match_pct,
        missing_sections=missing_sections,
        warnings=warnings,
        has_quantified=has_quantified
    )

    # 7. AI Feedback (Optional – resource-limited inside provider_router)
    ai_response = None
    if use_ai:
        ai_data = route_provider(processed_text, trimmed_jd, provider=provider)
        if ai_data:
            ai_response = AIFeedback(
                provider=provider,
                summary=ai_data.get("summary", "")
            )
            warnings.extend(ai_data.get("suggestions", []))

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
