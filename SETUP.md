# LearnOS — Setup Guide

## 1. Supabase Project Setup

### Create Project
1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name: `learnos`, Region: **South Asia (Mumbai)**, Plan: **Free**
3. Wait for provisioning (~2 min)

### Run Migrations
Run these SQL files in order via **SQL Editor** (left sidebar):
1. `docs/migrations/001_initial_schema.sql` — tables & enums
2. `docs/migrations/002_rls_policies.sql` — row level security
3. `docs/migrations/003_triggers.sql` — auto-create profile on signup

### Enable Realtime
1. Go to **Table Editor** → click on the **sessions** table
2. Click the **Realtime** toggle (top-right area) to **ON**
3. This enables live subscriptions for the friend activity feed

### Get API Keys
Go to **Settings → API** and copy:
- **Project URL** → `VITE_SUPABASE_URL` in `frontend/.env`
- **anon public key** → `VITE_SUPABASE_ANON_KEY` in `frontend/.env`
- **service_role key** → `SUPABASE_SERVICE_KEY` in `backend/.env` (never expose in frontend)

---

## 2. Google OAuth Configuration

### Step 1 — Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing) → name it `LearnOS`
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. If prompted, configure the **OAuth consent screen** first:
   - User type: **External**
   - App name: `LearnOS`
   - User support email: your email
   - Authorized domains: add `supabase.co`
   - Save and continue through all steps
6. Back in **Credentials → Create OAuth client ID**:
   - Application type: **Web application**
   - Name: `LearnOS`
   - Authorized redirect URIs: add `https://<your-project-ref>.supabase.co/auth/v1/callback`
     *(Get your project ref from the Supabase dashboard URL)*
7. Click **Create** — copy the **Client ID** and **Client Secret**

### Step 2 — Enable Google Provider in Supabase
1. Go to your Supabase Dashboard → **Authentication → Providers**
2. Find **Google** in the list and click to expand
3. Toggle **Enable Google** to ON
4. Paste your **Client ID** and **Client Secret** from Google Cloud
5. Click **Save**

### Step 3 — Test
1. Start the frontend dev server (`npm run dev` in `frontend/`)
2. Navigate to the login page
3. Click "Continue with Google" — you should see the Google OAuth popup

---

## 3. Environment Files

### Frontend (`frontend/.env`)
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
VITE_BACKEND_URL=http://localhost:3001
```

### Backend (`backend/.env`)
```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=eyJ...your-service-role-key
FRONTEND_URL=http://localhost:5173
PORT=3001
```
