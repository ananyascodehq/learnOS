-- LearnOS Triggers Migration
-- Run this in Supabase SQL Editor AFTER 002_rls_policies.sql

-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================
-- When a new user signs up via Google OAuth, this trigger
-- automatically creates a row in public.users with their
-- id, email, and Google avatar URL.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
