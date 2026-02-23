-- LearnOS RLS Policies Migration
-- Run this in Supabase SQL Editor AFTER 001_initial_schema.sql

-- ============================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================
alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.nptel_courses enable row level security;
alter table public.nptel_weeks enable row level security;
alter table public.friendships enable row level security;

-- ============================================================
-- USERS POLICIES
-- ============================================================

-- Users can read their own profile
create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Users can insert their own profile (on first login)
create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- Friends can read each other's basic info (for activity feed)
create policy "Friends can read each other profiles"
  on public.users for select
  using (
    exists (
      select 1 from public.friendships
      where status = 'Accepted'
      and ((requester_id = auth.uid() and addressee_id = id)
        or (addressee_id = auth.uid() and requester_id = id))
    )
  );

-- ============================================================
-- SESSIONS POLICIES
-- ============================================================

-- Users can do full CRUD on their own sessions
create policy "Users manage own sessions"
  on public.sessions for all
  using (auth.uid() = user_id);

-- Friends can read sessions (for activity feed) if not hidden
create policy "Friends can read sessions"
  on public.sessions for select
  using (
    exists (
      select 1 from public.friendships f
      join public.users u on u.id = sessions.user_id
      where f.status = 'Accepted'
      and ((f.requester_id = auth.uid() and f.addressee_id = sessions.user_id)
        or (f.addressee_id = auth.uid() and f.requester_id = sessions.user_id))
      and u.hide_from_friends = false
    )
  );

-- ============================================================
-- NPTEL POLICIES
-- ============================================================

-- Users manage their own NPTEL courses
create policy "Users manage own NPTEL courses"
  on public.nptel_courses for all
  using (auth.uid() = user_id);

-- Users manage weeks of their own NPTEL courses
create policy "Users manage own NPTEL weeks"
  on public.nptel_weeks for all
  using (
    exists (
      select 1 from public.nptel_courses
      where id = nptel_weeks.course_id
      and user_id = auth.uid()
    )
  );

-- ============================================================
-- FRIENDSHIPS POLICIES
-- ============================================================

-- Users can manage friendships they are part of
create policy "Users manage own friendships"
  on public.friendships for all
  using (
    auth.uid() = requester_id or auth.uid() = addressee_id
  );
