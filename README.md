# T.R.E.X (Total Relocation & Employment eXpert) 🦖

[![Status](https://img.shields.io/badge/Status-Early_Beta-orange.svg)]()
[![Update](https://img.shields.io/badge/Last_Updated-April_2026-green.svg)]()
[![Tech](https://img.shields.io/badge/Tech-Next.js%20%2B%20FastAPI-blue.svg)]()

**T.R.E.X** is an AI-driven decision-support platform designed to help freshers and professionals navigate the complexities of relocation, career optimization, and modern employment.

> [!IMPORTANT]
> **Status: Early Beta Phase**
> This project is currently in its early beta stage. Our primary focus has been on establishing a **Premium UI/UX Foundation** and core functionality. Advanced AI features and deep logic are being incrementally added.

---

## 🌟 Key Modules

### 🏙️ City AI (City Intelligence)
Dynamically evaluate living costs, tech hubs, and quality of life across top Indian cities. Compare real savings based on your salary and lifestyle preferences.

### 📄 Resume AI (Resume Optimizer)
Instant semantic analysis of your resume against specific job descriptions. Get a "Match Score" and actionable suggestions to beat the ATS and align with recruiter expectations.

### 🚀 Career AI (Career Matchmaker) - *Coming Soon*
Map long-term career paths, discover relevant internships, and plan your career switches with intelligent guidance.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router), React 19, Tailwind CSS, Framer Motion, Recharts, Lucide React.
- **Backend**: FastAPI (Python 3.12), LangChain, LangGraph, Pydantic, Uvicorn.
- **AI**: Integration with frontier-class models (Groq, OpenAI, DeepSeek).

---

## 🚀 Quick Start

### Backend Setup
1. Navigate to the `backend` directory.
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   python -m uvicorn app.main:app --reload
   ```

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🗺️ Roadmap & Future Features

- [ ] **Resume Parsing**: Direct PDF/DOCX upload and parsing.
- [ ] **Career Mapping**: Interactive roadmap generation for specified roles.
- [ ] **Live Data**: Real-time integration with job boards and housing APIs.
- [ ] **User Accounts**: Persistence for analysis history.
- [ ] **Dark Mode**: High-fidelity dark theme support.

---

## 🤝 Contributing & Issues

We are actively tracking future enhancements and bugs. Please check the **Issues** tab to see what we're working on next!
