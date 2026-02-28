-- Migration to add AI-related features to the database schema
-- Based on docs/LearnOS_AI_FRD.md

-- 1. Add ai_debrief column to the sessions table
ALTER TABLE public.sessions ADD COLUMN ai_debrief TEXT;

-- 2. Create the new weekly_summaries table
CREATE TABLE public.weekly_summaries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start  DATE NOT NULL,
  summary     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- 3. Add Row Level Security for the new table
ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own summaries"
  ON public.weekly_summaries FOR SELECT
  USING (auth.uid() = user_id);

-- Note: An insert policy for the service_role key will be needed
-- if the cron job runs under a user that is not the owner.
-- For now, a service_role key bypasses RLS, so this is sufficient.
