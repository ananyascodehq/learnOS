-- Test suite for the calculate_streak function.
-- This script uses the pgTAP testing framework for PostgreSQL.
-- To run: You would typically use a test runner like `pg_prove`.
-- Example: `pg_prove -d your_database --verbose tests/streak_calculation.sql`

-- Start a transaction
BEGIN;

-- Plan the number of tests to run
SELECT plan(18);

-- Create the pgTAP extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Mock necessary tables (users, sessions)
-- Note: In a real test setup, you might have a dedicated test schema.
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    timezone TEXT
);

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    created_at TIMESTAMPTZ,
    -- other session fields...
    title TEXT
);

-- Test Data Setup
-- -----------------------------------------------------------------------------

-- User 1: UTC timezone for simple tests
-- User 2: America/New_York for DST tests
-- User 3: Asia/Kolkata for timezone-ahead-of-UTC tests
-- User 4: No sessions
INSERT INTO public.users (id, timezone) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'UTC'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'America/New_York'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Asia/Kolkata'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'UTC');

-- We need to mock NOW() to have reproducible tests.
-- pgTAP's `set_time()` is perfect for this. Let's set a fixed "today".
-- Let's pretend "today" is 2026-02-28 10:00:00 UTC
SELECT set_time('2026-02-28 10:00:00 UTC');

-- Sessions for User 1 (UTC)
INSERT INTO public.sessions (user_id, created_at, title) VALUES
-- A 3-day streak, active today
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-02-28 01:00:00Z', 'Session today'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-02-27 15:00:00Z', 'Session yesterday'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-02-26 23:00:00Z', 'Session 2 days ago'),
-- An old, broken streak
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-02-20 12:00:00Z', 'Old session');


-- Sessions for User 2 (America/New_York, DST test case from docs)
-- DST in America/New_York ends Nov 2, 2025
-- Let's set "today" to Nov 3, 2025 for this user's test
SELECT set_time('2025-11-04 02:00:00 UTC'); -- This is Nov 3 evening in NY
INSERT INTO public.sessions (user_id, created_at, title) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', '2025-10-31 23:30:00Z', 'DST Session 1'), -- NY Date: Oct 31
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', '2025-11-01 23:30:00Z', 'DST Session 2'), -- NY Date: Nov 1
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', '2025-11-02 05:30:00Z', 'DST Session 3'), -- NY Date: Nov 2 (after DST)
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', '2025-11-04 01:30:00Z', 'DST Session 4'); -- NY Date: Nov 3

-- Sessions for User 3 (Asia/Kolkata, UTC+5:30)
-- Set "today" to a time where UTC date and Kolkata date are different
SELECT set_time('2026-03-10 20:00:00 UTC'); -- This is 2026-03-11 in Kolkata
INSERT INTO public.sessions (user_id, created_at, title) VALUES
-- Streak is based on Kolkata time
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', '2026-03-10 19:00:00Z', 'Kolkata Session 1'), -- IST: 2026-03-11 00:30
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', '2026-03-09 20:00:00Z', 'Kolkata Session 2'); -- IST: 2026-03-10 01:30

-- Test Cases
-- -----------------------------------------------------------------------------
SELECT bag_eq(
    $$ SELECT * FROM calculate_streak('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') $$,
    $$ VALUES (3, '2026-02-28'::DATE, false) $$,
    'Test 1: Should return a 3-day streak that is active today.'
);

SELECT bag_eq(
    $$ SELECT * FROM calculate_streak('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12') $$,
    $$ VALUES (4, '2025-11-03'::DATE, false) $$,
    'Test 2: Should correctly calculate a 4-day streak across a DST boundary.'
);

SELECT bag_eq(
    $$ SELECT * FROM calculate_streak('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13') $$,
    $$ VALUES (2, '2026-03-11'::DATE, false) $$,
    'Test 3: Should correctly calculate a 2-day streak for a timezone ahead of UTC.'
);

SELECT bag_eq(
    $$ SELECT * FROM calculate_streak('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14') $$,
    $$ VALUES (0, NULL::DATE, true) $$,
    'Test 4: Should return a 0 streak for a user with no sessions.'
);


-- Test case: Streak at risk (last session yesterday)
-- Use a new user to avoid data conflicts
INSERT INTO public.users (id, timezone) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'UTC');
SELECT set_time('2026-02-28 10:00:00 UTC');
INSERT INTO public.sessions (user_id, created_at, title) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', '2026-02-27 15:00:00Z', 'At-risk session');

SELECT bag_eq(
    $$ SELECT * FROM calculate_streak('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15') $$,
    $$ VALUES (1, '2026-02-27'::DATE, true) $$,
    'Test 5: Should return a 1-day streak that is at risk.'
);


-- Test case: Broken streak (last session 2 days ago)
INSERT INTO public.users (id, timezone) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'UTC');
SELECT set_time('2026-02-28 10:00:00 UTC');
INSERT INTO public.sessions (user_id, created_at, title) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-02-26 23:00:00Z', 'Broken streak session');

SELECT bag_eq(
    $$ SELECT * FROM calculate_streak('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16') $$,
    $$ VALUES (0, '2026-02-26'::DATE, true) $$,
    'Test 6: Should return a 0 streak for a broken streak.'
);


-- Test case: Multiple sessions on the same day
INSERT INTO public.users (id, timezone) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'UTC');
SELECT set_time('2026-02-28 10:00:00 UTC');
INSERT INTO public.sessions (user_id, created_at, title) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', '2026-02-28 08:00:00Z', 'Multi-session 1'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', '2026-02-28 18:00:00Z', 'Multi-session 2'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', '2026-02-27 10:00:00Z', 'Multi-session 3');

SELECT bag_eq(
    $$ SELECT * FROM calculate_streak('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17') $$,
    $$ VALUES (2, '2026-02-28'::DATE, false) $$,
    'Test 7: Should count multiple sessions on the same day as one day in the streak.'
);

-- Finish the tests
SELECT * FROM finish();

-- Rollback the transaction to keep the database clean
ROLLBACK;

-- Additional Test Cases to consider for a more robust suite:
-- 1. User with a NULL timezone (should default to UTC).
-- 2. Performance on a user with thousands of sessions.
-- 3. Edge cases around midnight for various timezones.
-- 4. Leap year dates.
