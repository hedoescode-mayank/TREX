# TREX-AI Project Report

## Overview

TREX-AI is a premium, AI-driven career intelligence platform designed to help users navigate their professional future with high-context insights. The platform provides localized city intelligence, resume analysis, and career matchmaking using frontier-class AI models.

## Technology Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Animations**: Framer Motion (Staged reveals, scroll motion, interactive components)
- **Visuals**: Three.js (Hexagon grid background)
- **Backend**: FastAPI (Python), Uvicorn
- **Environment**: Virtual environment (venv) for backend, Node.js for frontend

## Core Features

1. **City Intelligence**: Analysis of cost of living, career opportunities, and growth indices for specific cities.
2. **Resume Optimizer**: AI-powered resume parsing and scoring against industry standards.
3. **Career Matchmaker**: Personalized career path recommendations based on user profiles.

## UI/UX Enhancements

The project features a "Premium AI Control Room" aesthetic:

- **Reactive Hex Grid**: A Three.js based interactive background that responds to cursor movement and pulses rhythmically.
- **Dynamic Cursor**: A custom glow and ripple effect that follows the user's cursor with high precision.
- **Ambient Effects**: Slow-drifting light gradients and floating particles for visual depth.
- **Staged Reveal**: Content enters the screen in a polished, staggered sequence.
- **Floating Analytics**: Real-time product metrics displayed in a glassmorphism card.

## Project Structure

```text
TREX-dev/
├── backend/                # FastAPI Backend
│   ├── app/                # Application logic
│   │   ├── main.py         # Entry point
│   │   ├── api/            # API Endpoints
│   │   ├── core/           # Configuration & Settings
│   │   └── services/       # AI & Business logic
│   ├── .env.development    # Backend environment variables
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js Frontend
│   ├── src/
│   │   ├── app/            # Next.js App Router (Pages)
│   │   │   ├── page.tsx    # Landing Page
│   │   │   └── globals.css # Global styles & Design tokens
│   │   ├── components/     # UI Components
│   │   │   ├── AmbientEffects.tsx
│   │   │   ├── CursorRipple.tsx
│   │   │   ├── FloatingAnalytics.tsx
│   │   │   └── HexGridBackground.tsx
│   │   └── lib/            # Utility functions
│   ├── package.json        # Frontend dependencies
│   └── tailwind.config.ts  # Tailwind configuration
├── start_backend.ps1       # Automated backend startup script
└── README.md               # Project documentation
```

## Setup & Execution

- **Backend**: Start via `.\start_backend.ps1` (runs on `http://localhost:8000`)
- **Frontend**: Run `npm run dev` in the `/frontend` directory (runs on `http://localhost:3000`)
