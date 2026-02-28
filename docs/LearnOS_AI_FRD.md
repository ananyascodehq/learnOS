# LearnOS — AI Feature Requirements Document
**Open-Source LLM Integration · v1.0 · February 2026**

---

| Field | Value |
|---|---|
| Document Type | Feature Requirements Document (FRD) |
| Product | LearnOS — Personal Study Intelligence Platform |
| Scope | AI / LLM Integration — Phase 1 (Tier 1 Features) |
| Status | Draft — Pending Engineering Review |
| Last Updated | February 28, 2026 |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture Integration](#2-architecture-integration)
3. [Feature Specifications](#3-feature-specifications)
4. [Database Schema Changes](#4-database-schema-changes)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Risks & Mitigations](#6-risks--mitigations)
7. [Out of Scope — Phase 1](#7-out-of-scope--phase-1)
8. [Acceptance Criteria](#8-acceptance-criteria)

---

## 1. Overview

LearnOS currently functions as a session logger and analytics dashboard. This document specifies requirements for integrating open-source large language models (LLMs) to elevate the product from a passive tracker to an active intelligence layer — fulfilling the promise implied by the platform name.

Three Tier-1 features are scoped in this document:

- **Post-Session Debrief (FR-01):** AI-generated insight immediately after each Pomodoro session
- **Weekly Pattern Summary (FR-02):** Aggregated weekly behavioural insight surfaced on the dashboard
- **Smart Next-Action Suggestions (FR-03):** Contextual next-step recommendations auto-populated during session logging

> ⚠️ **Constraint — Open-Source Models Only**
>
> All LLM inference must use open-source models. No OpenAI, Anthropic, or Google paid APIs are permitted.
> Permitted stacks: **Ollama** (local), **Hugging Face Inference API** (free tier), **Groq API** (free tier with open-source models).
> Model selection criteria: permissive license (Apache 2.0 / MIT), <8B parameters preferred for latency, runs on free-tier infrastructure.

---

## 2. Architecture Integration

### 2.1 Call Flow Mandate

LLM calls must never originate from the frontend. All inference requests are routed through the Express backend. This is non-negotiable: it protects API credentials, enables rate limiting, allows response caching, and provides a single point for prompt versioning.

```
Frontend
  → POST /api/ai/<feature>
    → Express Backend
      → LLM Inference API
        → Response stored in Supabase
          → Returned to client
```

The frontend never holds an API key. The backend constructs all prompts server-side. LLM responses are persisted in Supabase alongside the session record to avoid re-inference on re-renders.

### 2.2 Approved Model Stack

| Feature | Model | Hosting | Rationale |
|---|---|---|---|
| Post-Session Debrief | Llama 3.1 8B Instruct | Groq API (free tier) | Fast inference (<1s), Apache 2.0, sufficient reasoning for short-form insight |
| Weekly Summary | Mistral 7B Instruct v0.3 | Hugging Face Inference API | Strong summarisation, free tier handles weekly batch calls comfortably |
| Next-Action Suggestion | Llama 3.1 8B Instruct | Groq API (free tier) | Same model as debrief for stack consistency; low-latency matters here |

> Groq API (groq.com) provides free-tier access to Llama 3 and Mixtral with rate limits of ~30 req/min — sufficient for current scale.

### 2.3 Failure Behaviour

LLM features are enhancement-only. A failed inference call must never block session submission or dashboard load. All AI features degrade gracefully:

- Session saves successfully regardless of debrief API status
- If inference fails, the AI field is hidden — no error state shown to user
- Retry is silent and automatic on the next relevant trigger
- Failures are logged server-side for monitoring; not surfaced to the client

---

## 3. Feature Specifications

### FR-01: Post-Session Debrief

| Field | Value |
|---|---|
| Feature ID | FR-01 |
| Trigger | User completes or manually ends a Pomodoro session |
| Owner | Backend — `/api/ai/debrief` |
| Model | Llama 3.1 8B Instruct via Groq API |
| Priority | P0 — Critical |

#### 3.1.1 Functional Requirements

| Sub-Feature | Description | Priority |
|---|---|---|
| Async Call | Inference is fired after session is saved to DB. UI does not wait on it. | P0 — Critical |
| Input Construction | Backend assembles prompt from: `category`, `duration`, `what_i_did`, `was_useful`, `next_action` fields. | P0 — Critical |
| Output Format | Two sentences maximum. Sentence 1: what went wrong or what went well. Sentence 2: concrete next step. | P0 — Critical |
| Persistence | AI insight stored in `sessions.ai_debrief` column (TEXT, nullable). | P0 — Critical |
| UI Display | Insight card shown in session history row and post-session modal. Labelled "AI Insight". | P1 — High |
| Regenerate | User can tap refresh icon to trigger a new inference call on a past session. | P1 — High |

#### 3.1.2 Prompt Template

**System Prompt:**
```
You are a study coach. Given a student's session data, provide exactly two sentences:
Sentence 1 — What limited the session's effectiveness, or what went well if it was productive.
Sentence 2 — One concrete, specific next action the student should take.
Be direct. No filler. No encouragement. Max 60 words total.
```

**User Prompt (runtime values injected by backend):**
```
Category: {category}
Duration: {duration_minutes} minutes
What I did: {what_i_did}
Was it useful: {was_useful}
Planned next action: {next_action}
```

---

### FR-02: Weekly Pattern Summary

| Field | Value |
|---|---|
| Feature ID | FR-02 |
| Trigger | Cron job — runs every Monday 06:00 UTC for all active users |
| Owner | Backend — `/api/ai/weekly-summary` (internal, cron-triggered) |
| Model | Mistral 7B Instruct v0.3 via Hugging Face Inference API |
| Priority | P1 — High |

#### 3.2.1 Functional Requirements

| Sub-Feature | Description | Priority |
|---|---|---|
| Data Aggregation | Backend queries prior 7-day window: total hours, category breakdown, useful ratio, distraction count (when available). | P0 — Critical |
| Batch Processing | Summaries generated in background; stored before user opens the dashboard. | P0 — Critical |
| Output Format | 3 lines: (1) Dominant pattern, (2) Biggest weakness, (3) This week's focus recommendation. | P0 — Critical |
| Persistence | Stored in `weekly_summaries` table keyed by `user_id` and `week_start` date. | P0 — Critical |
| Dashboard Card | Displayed as a fixed card on the Analytics Dashboard. Dismissed per-week, re-shown on new week. | P1 — High |
| Opt-out | User can disable AI summary generation in profile settings. | P2 — Low |

---

### FR-03: Smart Next-Action Suggestions

| Field | Value |
|---|---|
| Feature ID | FR-03 |
| Trigger | User finishes typing in the "What I Did" field (500ms debounce) |
| Owner | Backend — `/api/ai/suggest-next-action` |
| Model | Llama 3.1 8B Instruct via Groq API |
| Priority | P1 — High |

#### 3.3.1 Functional Requirements

| Sub-Feature | Description | Priority |
|---|---|---|
| Contextual Input | Prompt includes: current `what_i_did`, `category`, last 3 `next_action` entries in same category. | P0 — Critical |
| Output Format | Single sentence. Starts with a verb. Under 15 words. No explanation. | P0 — Critical |
| UI Behaviour | Suggestion appears as ghost text in the Next Action field. User accepts (Tab) or ignores. | P1 — High |
| Debounce | Call fires 500ms after user stops typing. Cancelled if user resumes typing. | P1 — High |
| No Persistence | Suggestions are ephemeral — not stored unless the user accepts them. | P2 — Low |

---

## 4. Database Schema Changes

All new columns are nullable to preserve backward compatibility with existing session records.

```sql
-- On sessions table
ALTER TABLE sessions ADD COLUMN ai_debrief TEXT;

-- New table for weekly summaries
CREATE TABLE weekly_summaries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start  DATE NOT NULL,
  summary     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- RLS: users can only read their own summaries
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own summaries"
  ON weekly_summaries FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 5. Non-Functional Requirements

| Requirement | Specification | Priority |
|---|---|---|
| Latency — FR-01 | Debrief must not add latency to session save. Insight available within 3s of save. | P0 — Critical |
| Latency — FR-03 | Suggestion must appear within 1.5s of debounce trigger. | P1 — High |
| Rate Limiting | Backend enforces per-user limit: max 50 AI calls/day to stay within Groq free tier. | P0 — Critical |
| Prompt Versioning | Prompts stored as constants in `/backend/src/ai/prompts.ts`. Changes tracked via git. | P1 — High |
| Privacy | No session content sent to paid external APIs. Only open-source model endpoints permitted. | P0 — Critical |
| Observability | All AI calls logged with: `user_id` (hashed), feature, `latency_ms`, success/fail. No content logged. | P1 — High |

---

## 6. Risks & Mitigations

| Risk | Detail | Mitigation |
|---|---|---|
| Groq Free Tier Rate Limits | 30 req/min cap may be hit during peak usage as user base grows. | Implement per-user daily cap (50 calls). Queue non-urgent calls. Add Hugging Face as fallback. |
| Output Quality | 7–8B models may produce generic or irrelevant insights for short/thin sessions. | Minimum gate: do not trigger FR-01 if duration < 10 min or `what_i_did` < 20 characters. |
| Prompt Injection | Malicious content in `what_i_did` field could manipulate model output. | Sanitise all user input before prompt injection. Enforce max character limits at DB and API layer. |
| Model Availability | HuggingFace free tier has cold-start delays for low-traffic models. | Use Groq as primary for all latency-sensitive features. HuggingFace only for async batch (FR-02). |

> ⚠️ **Prompt injection is the highest-severity risk.** The `what_i_did` field is raw user text inserted directly into a prompt. Sanitise and length-cap it at the backend layer before anything else ships.

---

## 7. Out of Scope — Phase 1

The following AI features are explicitly deferred. They are not to be built, partially implemented, or designed around during Phase 1:

- Real-time session coaching or mid-session interventions
- LLM-generated quiz questions or flashcard generation (requires RAG pipeline)
- Conversational AI chatbot interface
- Study plan generation from exam date + topics
- NPTEL course-specific Q&A
- Fine-tuning or self-hosted model deployment

---

## 8. Acceptance Criteria

All three features must meet the following criteria before being considered shippable:

1. Session saves are never delayed or blocked by LLM inference failures.
2. AI debrief insights appear within 3 seconds of session save on a standard connection.
3. No API keys are accessible from browser devtools or frontend source.
4. Weekly summary is present on the dashboard before 08:00 UTC every Monday.
5. Next-action suggestion appears as ghost text and is dismissible without affecting session data.
6. All AI calls respect the 50-calls-per-user-per-day rate limit.
7. Schema migrations run cleanly on existing Supabase instance without data loss.

---

*This document governs Phase 1 AI integration only. Changes to model selection, prompt templates, or feature scope require a formal revision with version increment.*
