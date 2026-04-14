import os
import io
import json
import re
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from typing import Optional
from pypdf import PdfReader
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

SYSTEM_PROMPT = """You are an expert ATS (Applicant Tracking System) and resume analyst with 15+ years of HR and technical recruiting experience.

Your job is to deeply analyze a resume against a job description and provide GENUINE, ACTIONABLE feedback — not generic advice.

You MUST return a valid JSON object with this exact structure:
{
  "ats_score": <integer 0-100>,
  "summary": "<2-3 sentence honest overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "matched_keywords": ["<keyword>", ...],
  "missing_keywords": ["<keyword>", ...],
  "critical_gaps": ["<specific gap with explanation>", ...],
  "suggestions": [
    {"priority": "HIGH|MEDIUM|LOW", "action": "<specific what to do>", "reason": "<why this matters>"}
  ],
  "section_scores": {
    "skills_match": <0-100>,
    "experience_relevance": <0-100>,
    "education_fit": <0-100>,
    "keyword_density": <0-100>
  },
  "verdict": "STRONG_MATCH|GOOD_MATCH|FAIR_MATCH|WEAK_MATCH"
}

Rules:
- Be HONEST. If a resume is weak, say so clearly.
- matched_keywords should only include words actually present in BOTH resume and job description
- missing_keywords should be important terms from JD not found in resume
- suggestions must be SPECIFIC to this resume/JD combo, not generic tips
- critical_gaps are serious mismatches the candidate must address
- Return ONLY the JSON object, no markdown, no extra text"""


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes using pypdf"""
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {str(e)}")


def analyze_with_groq(resume_text: str, job_description: str) -> dict:
    """Use LangChain + Groq to analyze resume against JD"""
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not configured. Add it to backend/.env.development")

    llm = ChatGroq(
        api_key=GROQ_API_KEY,
        model="llama-3.3-70b-versatile",
        temperature=0.2,
        max_tokens=2048,
    )

    user_message = f"""Analyze this resume against the job description.

=== RESUME ===
{resume_text[:4000]}

=== JOB DESCRIPTION ===
{job_description[:2000]}

Return ONLY the JSON analysis object as specified."""

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=user_message),
    ]

    response = llm.invoke(messages)
    raw = response.content.strip()

    # Strip markdown code fences if present
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    try:
        result = json.loads(raw)
        return result
    except json.JSONDecodeError:
        # Try to extract JSON from response
        match = re.search(r'\{[\s\S]+\}', raw)
        if match:
            return json.loads(match.group())
        raise ValueError(f"AI returned invalid JSON: {raw[:200]}")


@router.post("/analyze")
async def analyze_resume(
    job_description: str = Form(...),
    resume_text: Optional[str] = Form(None),
    resume_file: Optional[UploadFile] = File(None),
):
    """
    Analyze a resume against a job description using AI.
    Accepts either:
    - resume_text (plain text paste)
    - resume_file (PDF upload)
    """
    # Validate inputs
    if not job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description is required"
        )

    # Get resume content
    final_resume_text = ""

    if resume_file:
        if not resume_file.filename.endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are supported"
            )
        file_bytes = await resume_file.read()
        if len(file_bytes) > 5 * 1024 * 1024:  # 5MB limit
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too large. Maximum size is 5MB"
            )
        try:
            final_resume_text = extract_text_from_pdf(file_bytes)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(e)
            )
    elif resume_text:
        final_resume_text = resume_text.strip()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either a resume PDF file or resume text"
        )

    if len(final_resume_text) < 50:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Resume content too short. Please provide a complete resume."
        )

    # Run AI analysis
    try:
        analysis = analyze_with_groq(final_resume_text, job_description)
        return {
            "success": True,
            "analysis": analysis,
            "resume_chars": len(final_resume_text),
            "input_method": "pdf" if resume_file else "text"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )
