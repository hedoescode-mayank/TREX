import os
from dotenv import load_dotenv

# Load environment variables from .env.development
load_dotenv(".env.development")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import city, resume

app = FastAPI(title="T.R.E.X API", version="1.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

app.include_router(city.router, prefix="/api", tags=["City"])
app.include_router(resume.router, prefix="/api/resume", tags=["Resume AI"])

@app.get("/")
def read_root():
    return {"message": "Welcome to T.R.E.X API"}
