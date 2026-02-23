# LearnOS

> Personal Study Intelligence Platform

A cloud-based study tracking and analytics platform that transforms raw learning session data into actionable intelligence.

## 🚀 Features

- **Session Logger**: Track study time with an integrated Pomodoro timer and categorize work.
- **Analytics Dashboard**: Visualize progress with weekly heatmaps, category charts, and streak tracking.
- **Smart Actions**: Track pending next actions and upcoming college submission deadlines.
- **NPTEL Tracker**: Manage course progress week-by-week.
- **Social Learning**: Connect with friends, view real-time activity feeds, and compete on leaderboards.
- **Dark Mode**: Built-in support for system-aware dark themes.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite, TypeScript, Tailwind CSS, Recharts, React Query |
| Backend | Node.js + Express (TypeScript) |
| Database & Auth | Supabase (PostgreSQL + Google OAuth + Realtime) |
| AI | Anthropic Claude API |

## 📁 Project Structure

```
learnos/
├── frontend/          # React + Vite + Tailwind
│   ├── src/
│   ├── public/
│   ├── .env.example
│   └── package.json
├── backend/           # Node.js + Express
│   ├── src/
│   ├── .env.example
│   └── package.json
├── docs/              # PRD and task documentation
└── README.md
```

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- A [Supabase](https://supabase.com) project with Google OAuth configured

### Frontend Setup

```bash
cd frontend
cp .env.example .env
# Fill in your Supabase URL, anon key, and backend URL in .env
npm install
npm run dev
```

The frontend dev server will start at `http://localhost:5173`.

### Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your Supabase URL, service key, Anthropic API key, frontend URL, and port in .env
npm install
npm run dev
```

The backend server will start at `http://localhost:3001`.

## ⚙️ Environment Variables

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |
| `VITE_BACKEND_URL` | URL of the Express backend (e.g. `http://localhost:3001`) |

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Your Supabase service role key |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `FRONTEND_URL` | Frontend origin for CORS (e.g. `http://localhost:5173`) |
| `PORT` | Server port (default: `3001`) |
