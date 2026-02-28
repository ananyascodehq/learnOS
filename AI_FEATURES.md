# LearnOS AI Features Documentation

## Overview

LearnOS integrates AI-powered productivity features to help users reflect on their study sessions, track weekly progress, and receive actionable suggestions. These features leverage LLM APIs and are available throughout the app's logging, dashboard, and planning workflows.

---

## 1. AI Debrief (Session Insight)

- **Purpose:** After logging a session, users receive an AI-generated summary or insight about their work.
- **How it works:**
  - When a session is logged, the frontend calls the `/api/ai/debrief` endpoint with session details.
  - The backend sends the session data to an LLM API (Groq or Hugging Face) and stores the returned insight in the `ai_debrief` column of the session.
  - The insight is shown as a toast notification immediately after logging and is also visible in the session history details.
- **UI Locations:**
  - Toast after session log (SessionForm)
  - Session details in HistoryPage

---

## 2. Weekly AI Summary

- **Purpose:** Provide users with a weekly reflection and summary of their study habits and progress.
- **How it works:**
  - The backend periodically generates a summary for each user and stores it in the `weekly_summaries` table (keyed by `user_id` and `week_start`).
  - The frontend fetches the latest summary for the logged-in user and displays it at the top of the DashboardPage.
- **UI Location:**
  - Top of DashboardPage

---

## 3. Next-Action Suggestion (Ghost Text)

- **Purpose:** Help users plan their next steps by suggesting a next action based on what they just accomplished.
- **How it works:**
  - As the user types in the "What I Did" field in SessionForm, the frontend debounces input and calls `/api/ai/suggest-next-action`.
  - The backend uses the LLM to generate a suggested next action.
  - The suggestion appears as ghost text in the "Next Action" input, and can be accepted or edited by the user.
- **UI Location:**
  - SessionForm (ghost text in Next Action field)

---

## 4. Security & Rate Limiting

- **API keys** for LLM providers are managed securely on the backend.
- **Rate limiting** is enforced on AI endpoints to prevent abuse.
- **Row Level Security (RLS)** ensures users can only access their own AI data in Supabase.

---

## 5. Extensibility

- The AI endpoints are modular and can be extended to support additional LLM providers or new types of insights.
- All AI interactions are logged for monitoring and debugging.

---

## API Endpoints

- `POST /api/ai/debrief` — Generate and store an AI debrief for a session.
- `POST /api/ai/suggest-next-action` — Suggest a next action based on session details.
- `GET /api/ai/weekly-summary` — (If implemented) Fetch the latest weekly summary for the user.

---

## Database Schema

- `sessions.ai_debrief` — Text column for storing AI insights per session.
- `weekly_summaries` — Table for storing weekly summaries (`user_id`, `week_start`, `summary`).

---

## User Experience

- AI features are designed to be non-intrusive, privacy-respecting, and to enhance user productivity and reflection.
- Users can ignore, accept, or edit AI suggestions at any time.

---

For more details, see the code in `backend/src/routes/aiRoutes.ts`, `backend/src/controllers/aiController.ts`, and the frontend components in `SessionForm.tsx`, `DashboardPage.tsx`, and `HistoryPage.tsx`.
