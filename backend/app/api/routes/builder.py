from fastapi import APIRouter, HTTPException, BackgroundTasks, Body, Query
from fastapi.responses import StreamingResponse, FileResponse
from app.schemas.builder import ResumeData
from app.services.resume_builder import ResumeBuilder
from app.services.github_enricher import GitHubEnricher
from app.services.pdf_service import generate_resume_pdf
from typing import Any, Dict, List
import json
import asyncio
import uuid
import os
import traceback
from datetime import datetime

router = APIRouter()
builder = ResumeBuilder()
enricher = GitHubEnricher()

# In-memory store for session data (simplified for now)
sessions = {}
# Store the final generated resume data for PDF generation
completed_resumes = {}

STORAGE_DIR = os.path.join(os.getcwd(), "storage", "resumes")

@router.post("/generate")
async def start_generation(data: ResumeData):
    session_id = str(uuid.uuid4())
    sessions[session_id] = data
    return {"session_id": session_id}

@router.get("/stream/{session_id}")
async def stream_generation(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    data = sessions[session_id]
    
    async def event_generator():
        try:
            # We'll build a copy of the resume as we go to save it eventually
            final_resume_data = {
                "personal_info": data.personal_info,
                "summary": "",
                "education": [e.dict() for e in data.education],
                "experience": [],
                "projects": [],
                "skills": {}
            }

            # 1. Heading (Personal Info)
            yield f"data: {json.dumps({'section': 'heading', 'data': data.personal_info})}\n\n"
            await asyncio.sleep(0.5)

            # 2. Summary
            summary = builder.generate_summary(data)
            if summary is None:
                summary = "Experienced professional seeking challenging opportunities."
            final_resume_data["summary"] = summary
            yield f"data: {json.dumps({'section': 'summary', 'data': summary})}\n\n"
            await asyncio.sleep(0.5)

            # 3. Education
            yield f"data: {json.dumps({'section': 'education', 'data': final_resume_data['education']})}\n\n"
            await asyncio.sleep(0.5)

            # 4. Experience (Polished bullets)
            for exp in data.experience:
                bullets = builder.polish_experience(exp)
                if bullets is None:
                    bullets = exp.bullets if exp.bullets else ["Managed project responsibilities"]
                exp_dict = exp.dict()
                exp_dict['bullets'] = bullets
                final_resume_data["experience"].append(exp_dict)
                yield f"data: {json.dumps({'section': 'experience_item', 'data': exp_dict})}\n\n"
                await asyncio.sleep(0.3)

            # 5. Projects
            for proj in data.projects:
                # GitHub Enrichment
                if proj.link and "github.com" in proj.link:
                    enriched_data = await enricher.enrich_project(proj.link)
                    if enriched_data:
                        if not proj.description or len(proj.description) < 10:
                            proj.description = enriched_data.get("description") or proj.description
                        if not proj.tech_stack:
                            proj.tech_stack = enriched_data.get("tech_stack", [])
                
                polished = builder.polish_project(proj)
                proj_dict = proj.dict()
                if polished and isinstance(polished, dict):
                    proj_dict.update(polished)
                final_resume_data["projects"].append(proj_dict)
                yield f"data: {json.dumps({'section': 'project_item', 'data': proj_dict})}\n\n"
                await asyncio.sleep(0.3)

            # 6. Skills (Grouped)
            grouped_skills = builder.group_skills(data.skills)
            if grouped_skills is None:
                grouped_skills = {"Skills": data.skills}
            final_resume_data["skills"] = grouped_skills
            yield f"data: {json.dumps({'section': 'skills', 'data': grouped_skills})}\n\n"
            await asyncio.sleep(0.5)

            # 7. Generate and Store PDF
            pdf_url = None
            try:
                pdf_filename = f"resume_{session_id}.pdf"
                pdf_path = os.path.join(STORAGE_DIR, pdf_filename)
                print(f"[PDF] Generating PDF at: {pdf_path}")
                print(f"[PDF] Resume data keys: {list(final_resume_data.keys())}")
                generate_resume_pdf(final_resume_data, pdf_path)
                pdf_url = f"http://localhost:8000/api/builder/download/{session_id}"
                print(f"[PDF] Success! URL: {pdf_url}")
            except Exception as pdf_err:
                print(f"[PDF ERROR] Failed to generate PDF: {str(pdf_err)}")
                traceback.print_exc()
                # Don't fail the stream - still send complete event
            
            # Store final data for explicit export if needed
            completed_resumes[session_id] = final_resume_data
            
            if pdf_url:
                yield f"data: {json.dumps({'section': 'pdf_url', 'data': pdf_url})}\n\n"
            else:
                # Even if PDF failed, send the resume data as JSON so frontend can still save it
                yield f"data: {json.dumps({'section': 'pdf_url', 'data': ''})}\n\n"

            # 8. Final
            yield f"data: {json.dumps({'section': 'status', 'data': 'complete'})}\n\n"

        except Exception as e:
            print(f"[ERROR] Stream failed: {str(e)}")
            traceback.print_exc()
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/ai-edit")
async def ai_edit_section(
    section_type: str = Query(...), 
    instruction: str = Query(...), 
    content: Any = Body(...)
):
    try:
        refined = builder.refine_section(section_type, content, instruction)
        return {"data": refined}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{session_id}")
async def download_resume(session_id: str):
    pdf_path = os.path.join(STORAGE_DIR, f"resume_{session_id}.pdf")
    if not os.path.exists(pdf_path):
        # Try generating it if we have the data but file is missing
        if session_id in completed_resumes:
            generate_resume_pdf(completed_resumes[session_id], pdf_path)
        else:
            raise HTTPException(status_code=404, detail="Resume PDF not found")
    
    return FileResponse(
        path=pdf_path, 
        filename=f"TREX_Resume_{session_id[:8]}.pdf",
        media_type="application/pdf"
    )

@router.post("/export")
async def export_resume_manual(data: Dict[str, Any] = Body(...)):
    """Allows manual export of any resume data to PDF."""
    try:
        export_id = str(uuid.uuid4())
        pdf_path = os.path.join(STORAGE_DIR, f"export_{export_id}.pdf")
        generate_resume_pdf(data, pdf_path)
        return {
            "success": True,
            "pdf_url": f"http://localhost:8000/api/builder/download/export_{export_id}",
            "message": "PDF generated successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.get("/history")
async def get_resume_history():
    """Lists all generated resumes in the storage folder."""
    try:
        if not os.path.exists(STORAGE_DIR):
            return {"resumes": []}
        
        files = [f for f in os.listdir(STORAGE_DIR) if f.endswith(".pdf")]
        resumes = []
        for f in files:
            # Extract session_id or export_id from filename
            file_id = f.replace("resume_", "").replace(".pdf", "").replace("export_", "")
            resumes.append({
                "id": file_id,
                "filename": f,
                "url": f"http://localhost:8000/api/builder/download/{file_id if 'resume_' in f else 'export_'+file_id}",
                "created_at": datetime.fromtimestamp(os.path.getctime(os.path.join(STORAGE_DIR, f))).isoformat()
            })
        
        # Sort by date descending
        resumes.sort(key=lambda x: x["created_at"], reverse=True)
        return {"resumes": resumes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")
