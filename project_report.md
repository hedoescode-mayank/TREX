# TREX-AI Project Report

## Overview
TREX-AI is a premium, AI-driven career intelligence platform designed to help users navigate their professional future with high-context insights. The platform provides localized city intelligence, resume analysis, and career matchmaking using frontier-class AI models.

## Technology Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Authentication**: Firebase Authentication (Google, Email/Password)
- **Database/Analytics**: Firebase Cloud
- **Animations**: Framer Motion (Staged reveals, scroll motion, interactive components)
- **Visuals**: Three.js (Interactive hexagon grid background)
- **Backend**: FastAPI (Python), Uvicorn

## Core Features
1. **Full Authentication Suite**: Complete user authorization system supporting both social (Google) and manual (Email/Password) sign-ups.
2. **Premium Auth Interface**: A custom-built, animated `AuthModal` using Framer Motion for a seamless login/signup experience.
3. **Global Session Management**: `AuthContext` implementation providing real-time user state across the entire application.
4. **City Intelligence**: Analysis of cost of living, career opportunities, and growth indices for specific cities.
5. **Resume Optimizer**: AI-powered resume parsing and scoring against industry standards.

## UI/UX Enhancements
The project features a "Premium AI Control Room" aesthetic:

- **Reactive 3D Honeycomb**: A highly customized Three.js background with:
    - **Black Boundaries**: Sharp, high-contrast outlines for maximum visibility in light mode.
    - **3D Depth**: Interactive hexagons that physically "pop" (5.0 depth scale) upon cursor hover.
    - **Ambient Lighting**: Integrated `AmbientLight` and reactive blue point lights for a sophisticated glow.
- **Dynamic Cursor Suite**: A custom ripple effect and drifting particles that respond to interaction.
- **Glassmorphism Navigation**: A persistent, blurred navigation bar that adapts to authentication state.
- **Staged Content Reveal**: Smooth entrance animations for all hero elements.

## Project Structure
```text
TREX-dev/
├── backend/                # FastAPI Backend
│   ├── app/                # Application logic
│   │   ├── main.py         # Entry point
│   │   └── services/       # AI & Business logic
├── frontend/               # Next.js Frontend
│   ├── src/
│   │   ├── app/            # Next.js App Router
│   │   │   ├── layout.tsx  # Root Layout (with AuthProvider)
│   │   │   └── page.tsx    # Landing Page with Auth Integration
│   │   ├── components/     # UI Components
│   │   │   ├── AuthContext.tsx       # Global Auth State
│   │   │   ├── AuthModal.tsx         # Login/Signup UI
│   │   │   ├── HexGridBackground.tsx # 3D Honeycomb
│   │   │   ├── AmbientEffects.tsx
│   │   │   └── FloatingAnalytics.tsx
│   │   └── lib/            # Utilities
│   │       └── firebase.ts # Firebase SDK Initialization
└── start_backend.ps1       # Automated backend startup script
```

## Setup & Execution
- **Backend**: Start via `.\start_backend.ps1` (runs on `http://localhost:8000`)
- **Frontend**: Run `npm run dev` in the `/frontend` directory (runs on `http://localhost:3000`)

---
*Last Updated: April 21, 2026*
