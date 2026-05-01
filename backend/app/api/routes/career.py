from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from typing import Optional, List
import json
import os
from app.schemas.career import CareerAnalysisResponse
from app.services.resume_parser import extract_text_from_pdf, normalize_text
from app.services.career_matcher import generate_career_matchmaking

router = APIRouter()

MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 

SAMPLE_JOBS_PATH = "backend/app/data/sample_jobs.json"
def get_sample_jobs():
    if os.path.exists(SAMPLE_JOBS_PATH):
        with open(SAMPLE_JOBS_PATH, "r") as f:
            return json.load(f)
    return []

@router.post("/analyze", response_model=CareerAnalysisResponse)
async def analyze_career(
    target_role: str = Form(...),
    location: str = Form(...),
    experience_level: str = Form(...),
    expected_salary: str = Form(...),
    job_type: str = Form(...),
    resume_file: Optional[UploadFile] = File(None),
):
    if not resume_file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume PDF file is required"
        )

    file_bytes = await resume_file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max allowed size is 2 MB."
        )

    try:
        raw_text = extract_text_from_pdf(file_bytes)
        processed_text = normalize_text(raw_text)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    career_data = generate_career_matchmaking(
        resume_text=processed_text,
        target_role=target_role,
        location=location,
        experience_level=experience_level,
        expected_salary=expected_salary,
        job_type=job_type
    )

    if not career_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate career matchmaking analysis"
        )

    career_data["sample_jobs"] = get_sample_jobs()
    return career_data
