ALTER TABLE public.nptel_courses
  ADD COLUMN IF NOT EXISTS instructor_name text,
  ADD COLUMN IF NOT EXISTS course_provider text,
  ADD COLUMN IF NOT EXISTS credits integer;
