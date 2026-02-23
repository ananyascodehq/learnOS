-- LearnOS Schema Migration
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)
-- Execute in order — each section depends on the previous.

-- ============================================================
-- TABLE 1: users (extends Supabase auth.users)
-- ============================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  college text,
  year integer,
  semester integer,
  semester_start date,
  semester_end date,
  avatar_url text,
  hide_from_friends boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- TABLE 2: sessions
-- ============================================================
create type category_type as enum ('DSA', 'Course/Learning', 'Projects', 'College Work', 'Other');
create type college_work_type as enum ('Record', 'Observation', 'Assignment');
create type session_status as enum ('In Progress', 'Completed', 'Paused');

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null default current_date,
  category category_type not null,
  college_work_type college_work_type,
  title text not null,
  what_i_did text not null,
  status session_status not null default 'In Progress',
  start_time time not null,
  end_time time not null,
  duration_minutes integer generated always as (
    extract(epoch from (end_time - start_time)) / 60
  ) stored,
  was_useful boolean not null,
  next_action text,
  next_action_done boolean default false,
  due_date date,
  deadline_submitted boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- TABLE 3: nptel_courses
-- ============================================================
create table public.nptel_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_name text not null,
  total_weeks integer not null,
  created_at timestamptz default now()
);

-- ============================================================
-- TABLE 4: nptel_weeks
-- ============================================================
create type nptel_status as enum ('Not Started', 'In Progress', 'Completed');

create table public.nptel_weeks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.nptel_courses(id) on delete cascade,
  week_number integer not null,
  status nptel_status not null default 'Not Started',
  updated_at timestamptz default now(),
  unique(course_id, week_number)
);

-- ============================================================
-- TABLE 5: friendships
-- ============================================================
create type friendship_status as enum ('Pending', 'Accepted', 'Rejected');

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  addressee_id uuid not null references public.users(id) on delete cascade,
  status friendship_status not null default 'Pending',
  created_at timestamptz default now(),
  unique(requester_id, addressee_id)
);
