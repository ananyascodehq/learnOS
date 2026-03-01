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
# Fill in your Supabase URL, service key, frontend URL, and port in .env
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
| `FRONTEND_URL` | Frontend origin for CORS (e.g. `http://localhost:5173`) |
| `PORT` | Server port (default: `3001`) |
| `GROQ_API_KEY` | Your Groq API key for AI debriefs and ghost text features |

## 🚀 Deployment (Vercel)

The frontend is ready to be deployed on Vercel as a Single Page Application (SPA). A `vercel.json` file is already included to handle React Router rewrites.

### Steps to deploy the frontend:

1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository.
4. Set the **Framework Preset** to Vite.
5. Set the **Root Directory** to `frontend`.
6. Add the following **Environment Variables** in the Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_BACKEND_URL` (Set this to your live production backend URL)
7. Click **Deploy**.

Vercel will automatically build and deploy your app. All routing will be successfully captured thanks to the provided `vercel.json` that redirects all 404s back to `index.html`.
