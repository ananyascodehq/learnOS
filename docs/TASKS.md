# LearnOS — Agent Task List
> Sequential implementation tasks for Claude Code.  
> Complete each task fully before moving to the next. Do not skip ahead.  
> Each task has a clear **deliverable** and **done condition**.

---

## PHASE 0 — Project Scaffolding

### TASK 001 — Initialize Project Structure
**What to do:**  
Create the project folder structure:
```
learnos/
└── frontend/   (React + Vite + Tailwind)
```
- Init frontend: `npm create vite@latest frontend -- --template react-ts`
- Install frontend deps: `react-router-dom`, `@tanstack/react-query`, `@supabase/supabase-js`, `recharts`, `react-hot-toast`, `lucide-react`
- Install frontend type deps: `@types/react`, `@types/react-dom`, `@types/react-router-dom`, `@types/recharts`
- Verify `tsconfig.json` exists with `"strict": true` and `"jsx": "react-jsx"`
- Create `frontend/.env.example` with placeholder keys
- Create root `README.md` with setup instructions
**Done when:** `frontend/` exists with TypeScript configured in strict mode and all dependencies installed.

---

### TASK 002 — Configure Tailwind CSS & Base Theme
**What to do:**  
- Install and configure Tailwind CSS in the frontend
- Set up `tailwind.config.js` with a custom color palette:
  - `primary`: `#1A56DB` (blue)
  - `dark`: `#1E293B`
  - `surface`: `#F8FAFC`
  - `muted`: `#6B7280`
  - Category colors: `dsa: #3B82F6`, `learning: #8B5CF6`, `projects: #10B981`, `college: #F59E0B`, `other: #6B7280`
- Create `src/index.css` with Tailwind directives and base font (Inter from Google Fonts)
- Create a `src/constants/categories.ts` file exporting the 5 category definitions with a typed interface:
  ```ts
  export interface Category { label: string; value: string; color: string; }
  export const CATEGORIES: Category[] = [...]
  ```

**Done when:** Tailwind is configured and a test component renders with custom colors correctly.

---

### TASK 002b — TypeScript Types Setup
**What to do:**  
Create the shared types directory `src/types/` with the following files:

**`src/types/index.ts`** — re-exports and aliases for verbose Supabase generated types:
```ts
import type { Database } from './database.types'

export type User = Database['public']['Tables']['users']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type NptelCourse = Database['public']['Tables']['nptel_courses']['Row']
export type NptelWeek = Database['public']['Tables']['nptel_weeks']['Row']
export type Friendship = Database['public']['Tables']['friendships']['Row']

export type CategoryType = Database['public']['Enums']['category_type']
export type SessionStatus = Database['public']['Enums']['session_status']
export type CollegeWorkType = Database['public']['Enums']['college_work_type']
export type NptelStatus = Database['public']['Enums']['nptel_status']
```

**`src/types/filters.ts`** — filter interfaces used by hooks:
```ts
export interface SessionFilters {
  categories?: CategoryType[]
  status?: SessionStatus | 'all'
  wasUseful?: boolean | null
  dateFrom?: string
  dateTo?: string
  search?: string
}
```

**`src/types/ui.ts`** — UI-only types not tied to the database:
```ts
export interface NavItem { label: string; path: string; icon: string }
export interface StatCard { title: string; value: string | number; subtitle?: string }
```

⚠️ `database.types.ts` is generated in Task 003 and must exist before this file compiles. Leave a `// TODO: run supabase gen types after Task 003` comment at the top of `index.ts` until then.

**Done when:** All type files exist, compile without errors, and type aliases are exported correctly.

---

### TASK 003 — Supabase Project Setup & Schema
**What to do:**  
Create all 5 database tables in Supabase via SQL. Run the following migrations in order:

**Table 1: users** (extends Supabase auth.users)
```sql
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
```

**Table 2: sessions**
```sql
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
```

**Table 3: nptel_courses**
```sql
create table public.nptel_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_name text not null,
  total_weeks integer not null,
  created_at timestamptz default now()
);
```

**Table 4: nptel_weeks**
```sql
create type nptel_status as enum ('Not Started', 'In Progress', 'Completed');

create table public.nptel_weeks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.nptel_courses(id) on delete cascade,
  week_number integer not null,
  status nptel_status not null default 'Not Started',
  updated_at timestamptz default now(),
  unique(course_id, week_number)
);
```

**Table 5: friendships**
```sql
create type friendship_status as enum ('Pending', 'Accepted', 'Rejected');

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  addressee_id uuid not null references public.users(id) on delete cascade,
  status friendship_status not null default 'Pending',
  created_at timestamptz default now(),
  unique(requester_id, addressee_id)
);
```


**Done when:** All 5 tables exist in Supabase with correct columns and types. After creating all tables, run:
```bash
npx supabase gen types typescript --project-id <your-project-id> > frontend/src/types/database.types.ts
```
This generates fully-typed interfaces for every table. Commit this file. All Supabase queries in the app must use these generated types.

---

### TASK 004 — Row Level Security Policies
**What to do:**  
Enable RLS on all tables and add policies:

```sql
-- Enable RLS
alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.nptel_courses enable row level security;
alter table public.nptel_weeks enable row level security;
alter table public.friendships enable row level security;

-- users: read own profile, update own profile
create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- users: friends can read each other's basic info (for activity feed)
create policy "Friends can read each other profiles" on public.users for select using (
  exists (
    select 1 from public.friendships
    where status = 'Accepted'
    and ((requester_id = auth.uid() and addressee_id = id)
      or (addressee_id = auth.uid() and requester_id = id))
  )
);

-- sessions: full CRUD on own sessions
create policy "Users manage own sessions" on public.sessions for all using (auth.uid() = user_id);

-- sessions: friends can read sessions (for activity feed) if not hidden
create policy "Friends can read sessions" on public.sessions for select using (
  exists (
    select 1 from public.friendships f
    join public.users u on u.id = sessions.user_id
    where f.status = 'Accepted'
    and ((f.requester_id = auth.uid() and f.addressee_id = sessions.user_id)
      or (f.addressee_id = auth.uid() and f.requester_id = sessions.user_id))
    and u.hide_from_friends = false
  )
);

-- nptel: own only
create policy "Users manage own NPTEL courses" on public.nptel_courses for all using (auth.uid() = user_id);
create policy "Users manage own NPTEL weeks" on public.nptel_weeks for all using (
  exists (select 1 from public.nptel_courses where id = nptel_weeks.course_id and user_id = auth.uid())
);

-- friendships: manage own requests
create policy "Users manage own friendships" on public.friendships for all using (
  auth.uid() = requester_id or auth.uid() = addressee_id
);
```

**Done when:** RLS is enabled on all tables and all policies are active in Supabase dashboard.

---

### TASK 005 — Supabase Realtime & Triggers
**What to do:**  
- Enable Realtime on the `sessions` table in Supabase dashboard (Table Editor → sessions → Enable Realtime)
- Create a database trigger to auto-create a user profile row when a new auth user signs up:
```sql
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
```
- Enable Google OAuth provider in Supabase Auth settings (document the steps in a `SETUP.md` file)

**Done when:** Trigger exists, Realtime is enabled on sessions table, SETUP.md documents the Google OAuth configuration steps.

---

## PHASE 1 — Authentication & Routing

### TASK 006 — Supabase Client & Auth Context
**What to do:**  
- Create `src/lib/supabase.ts` — initializes typed Supabase client:
  ```ts
  import { createClient } from '@supabase/supabase-js'
  import type { Database } from '../types/database.types'
  export const supabase = createClient<Database>(url, key)
  ```
- Create `src/contexts/AuthContext.tsx` — React context providing:
  - `user` (Supabase `User | null`)
  - `profile` (`Database['public']['Tables']['users']['Row'] | null`)
  - `loading` (boolean)
  - `signInWithGoogle()` function
  - `signOut()` function
- The context should listen to `supabase.auth.onAuthStateChange` and keep state in sync
- Export a `useAuth()` hook with return type explicitly typed
- Wrap the entire app in `<AuthProvider>` in `main.tsx`

**Done when:** AuthContext exists with full TypeScript types, exports a typed `useAuth()` hook, and correctly reflects login state.

---

### TASK 007 — App Router & Protected Routes
**What to do:**  
Set up React Router in `App.tsx` with the following routes:
```
/login              → LoginPage (public)
/setup-profile      → ProfileSetupPage (requires auth, redirects away if profile complete)
/                   → DashboardPage (protected)
/log                → LogSessionPage (protected)
/history            → HistoryPage (protected)
/next-actions       → NextActionsPage (protected)
/friends            → FriendsPage (protected)
/nptel              → NptelPage (protected)
/profile            → ProfilePage (protected)
```
Create a `<ProtectedRoute>` component (`src/components/auth/ProtectedRoute.tsx`) that:
- Accepts `children: React.ReactNode` as prop (typed)
- Redirects unauthenticated users to `/login`
- Redirects authenticated users with incomplete profiles (missing `full_name`, `college`, `year`, `semester`) to `/setup-profile`

**Done when:** All routes are defined, ProtectedRoute correctly redirects, and navigating to `/` without auth goes to `/login`.

---

### TASK 008 — Login Page
**What to do:**  
Create `src/pages/LoginPage.tsx`:
- Clean centered card layout
- LearnOS logo/name at top
- Tagline: "Your personal study intelligence platform"
- Single "Continue with Google" button that calls `signInWithGoogle()`
- Subtle background pattern or gradient
- After successful login: redirect to `/` (ProtectedRoute handles the `/setup-profile` redirect if needed)

**Done when:** The login page renders, Google OAuth flow works, and successful login redirects correctly.

---

### TASK 009 — Profile Setup Page
**What to do:**  
Create `src/pages/ProfileSetupPage.tsx`:
- Shown only once — on first login when profile fields are incomplete
- Form fields: Full Name (text), College Name (text), Year of Study (select: 1–4), Current Semester (select: 1–8), Semester Start Date (date picker), Semester End Date (date picker)
- Email and avatar are pre-filled from Google (read-only display)
- On submit: `upsert` to `public.users`, then redirect to `/`
- Validation: all fields required

**Done when:** New users are redirected here on first login, form saves correctly, and they are redirected to dashboard after completion.

---

### TASK 010 — App Shell & Navigation
**What to do:**  
Create the persistent app layout `src/components/layout/AppShell.tsx`:
- Left sidebar (desktop) with nav links: Dashboard, History, Next Actions, Friends, NPTEL, Profile
- Mobile: bottom navigation bar with icons
- Top bar showing: user avatar, current date, "Log Session" button (opens modal or navigates to /log)
- Sidebar collapses to icon-only on smaller desktop widths
- Active route highlighted in sidebar
- Logout option in sidebar footer

Use `lucide-react` for all icons.

**Done when:** The shell renders correctly on desktop and mobile, all nav links work, and the layout wraps all protected pages.

---

## PHASE 2 — Session Logger

### TASK 011 — Session Logger Form (Core)
**What to do:**  
Create `src/pages/LogSessionPage.tsx` and `src/components/logger/SessionForm.tsx`:

Form fields (in order):
1. Date — date picker, defaults to today
2. Category — styled dropdown with color chips (DSA/Course/Learning/Projects/College Work/Other)
3. College Work Type — appears ONLY when "College Work" is selected (Record / Observation / Assignment)
4. Due Date — appears ONLY when College Work Type is selected
5. Title / Task Name — text input
6. What I Did Today — textarea (min 3 rows)
7. Status — segmented control (In Progress / Completed / Paused)
8. Start Time — time input
9. End Time — time input
10. Duration — auto-calculated display (read-only), shown as "X hr Y min"
11. Was It Useful — toggle button (Yes / No)
12. Next Action — text input (optional, placeholder: "What's the next step?")

On submit: insert into `sessions` table via Supabase. Show success toast. Reset form.

**Done when:** Form renders all fields, conditional fields appear/hide correctly, duration auto-calculates, and a session saves to the database.

---

### TASK 012 — Session Continuity (Resume Feature)
**What to do:**  
Add session continuity detection to the logger form:
- On page load (or when Title field loses focus), query today's sessions for the current user
- If a session with the same title exists from today, show a dismissible banner: "You worked on [Title] earlier today — Resume this task?"
- Clicking "Resume" pre-fills: Category, College Work Type, Status = "In Progress", and populates Next Action field with the previous session's Next Action as context
- Clicking "Dismiss" hides the banner

**Done when:** The resume prompt appears when a matching task exists today and pre-fills fields correctly.

---

### TASK 013 — Pomodoro Timer Integration
**What to do:**  
Add an optional Pomodoro timer to the session logger:
- A "Start Timer" toggle button above the Start Time field
- When activated: shows a 25-minute countdown timer (configurable: 25 / 50 min options)
- Timer displays as `MM:SS` with a circular progress ring (CSS-only, no library)
- When timer starts: auto-fills Start Time with current time
- When timer ends: auto-fills End Time, plays a soft browser audio beep, shows "Session complete! Log what you did." prompt
- Timer can be cancelled (clears auto-filled times)
- Timer is purely optional — if not used, Start/End Time fields work manually as normal

**Done when:** Timer counts down, auto-fills times correctly, and does not interfere with manual time entry.

---

## PHASE 3 — Dashboard

### TASK 014 — Dashboard Data Hooks
**What to do:**  
Create data-fetching hooks using React Query in `src/hooks/` — all hooks must be `.ts` files with explicit return types using the generated `database.types.ts`:
- `useSessionsToday()` — returns `UseQueryResult<Session[]>`
- `useSessionsThisWeek()` — returns `UseQueryResult<Session[]>`
- `useSessionsThisMonth()` — returns `UseQueryResult<Session[]>`
- `useAllSessions(filters: SessionFilters)` — `SessionFilters` is a typed interface defined in `src/types/filters.ts`
- `useStreak()` — returns `UseQueryResult<number>`

Where `Session` is `Database['public']['Tables']['sessions']['Row']` aliased in `src/types/index.ts`.

All hooks use `@supabase/supabase-js` query builder and are wrapped in `useQuery` from React Query.

**Done when:** All hooks exist, return correct data shapes, and have proper loading/error states.

---

### TASK 015 — Dashboard: Today at a Glance
**What to do:**  
Create `src/pages/DashboardPage.tsx` with the first section:

**Today at a Glance** — a row of 4 stat cards:
1. Sessions Today (count)
2. Time Logged Today (total minutes → displayed as "Xh Ym")
3. Categories Active Today (count of distinct categories)
4. Current Streak (days) — with a 🔥 icon

Below the cards: a horizontal list of today's sessions (compact view — category chip, title, duration, useful indicator).

**Done when:** All 4 stat cards show real data from today's sessions, and today's session list renders correctly.

---

### TASK 016 — Dashboard: Weekly Activity Heatmap
**What to do:**  
Add the weekly heatmap section to the Dashboard:
- A 7-column grid (Mon → Sun) showing the current week
- Each day cell shows total minutes logged that day
- Intensity shading: 0 min = gray, 1–30 = light blue, 31–60 = medium blue, 60+ = dark blue
- Clicking a day cell shows a slide-out panel (right side) listing all sessions for that day
- Today's cell is outlined/highlighted

**Done when:** Heatmap renders with correct data, intensity colors are accurate, and clicking a day shows that day's sessions.

---

### TASK 017 — Dashboard: Time by Category Chart
**What to do:**  
Add the category chart section to the Dashboard:
- Horizontal bar chart using Recharts (`BarChart`)
- X-axis: total minutes, Y-axis: category names
- Each bar uses the category's defined color
- Toggle buttons: "This Week" / "This Month"
- Tooltip shows exact time on hover

**Done when:** Chart renders with Recharts, toggle works, colors match category definitions, tooltips display correctly.

---

### TASK 018 — Dashboard: Useful vs Not Useful Donut Chart
**What to do:**  
Add the usefulness chart section to the Dashboard:
- Donut chart using Recharts (`PieChart`)
- Shows ratio of useful (was_useful = true) vs not useful sessions
- Segmented by category (one donut per category, or a legend breakdown)
- If a category has 0 sessions, it's hidden
- Center of donut shows overall useful percentage

**Done when:** Donut chart renders with correct ratios from real session data.

---

### TASK 019 — Dashboard: Semester Progress Bar & Streak-at-Risk Banner
**What to do:**  
Add two final dashboard elements:

**Semester Progress Bar:**
- A labeled progress bar: "Semester X — Week Y of Z"
- Calculated from `profile.semester_start` and `profile.semester_end`
- Shows percentage complete
- Color: green if < 80%, amber if 80–95%, red if > 95%

**Streak-at-Risk Banner:**
- Logic: if `useSessionsToday()` returns 0 sessions AND current local time is after 21:00
- Show a dismissible amber banner: "⚡ Your streak is at risk — you haven't logged anything today."
- Banner disappears if user logs a session (React Query cache invalidation)

**Done when:** Progress bar shows correct semester progress and streak banner appears after 9 PM with no sessions logged.

---

## PHASE 4 — Session History

### TASK 020 — History Page
**What to do:**  
Create `src/pages/HistoryPage.tsx`:

**Filter bar** (horizontal, above the list):
- Category multi-select filter (chips)
- Status filter (All / In Progress / Completed / Paused)
- Was Useful filter (All / Yes / No)
- Date range picker (start date, end date)
- Search input (searches `title` field)

**Session list:**
- Infinite scroll (load 20 at a time)
- Each row: Date, Category chip (color-coded), Title, What I Did (truncated to 1 line), Duration, Useful indicator (✓ or ✗), Next Action preview
- Clicking a row expands it to show full details
- Expanded row shows: Edit button, Delete button (with confirmation)

**Done when:** History page renders sessions, all filters work, infinite scroll loads more, and expand/collapse works.

---

### TASK 021 — Edit & Delete Session
**What to do:**  
Add edit and delete functionality to the expanded session row in History:

**Edit:**
- Clicking Edit opens the same `SessionForm` component pre-filled with the session's data
- On submit: `update` the session in Supabase
- On success: close form, invalidate React Query cache, show success toast

**Delete:**
- Clicking Delete shows a confirmation dialog: "Delete this session? This cannot be undone."
- On confirm: `delete` the session from Supabase
- On success: remove from list, show toast

**Done when:** Sessions can be edited and deleted from the History page with correct cache invalidation.

---

## PHASE 5 — Next Actions & Deadlines

### TASK 022 — Next Actions Panel
**What to do:**  
Create `src/pages/NextActionsPage.tsx` with two sections:

**Section 1 — Pending Next Actions:**
- Query: all sessions where `next_action IS NOT NULL AND next_action_done = false`, ordered by `created_at DESC`
- Each item shows: Category chip, Task title, Next action text, Date logged, "Mark Done" button
- Clicking "Mark Done": updates `next_action_done = true` in Supabase, removes from list with animation

**Section 2 — Upcoming Deadlines:**
- Query: all sessions where `due_date IS NOT NULL AND deadline_submitted = false`, ordered by `due_date ASC`
- Each item shows: College Work Type badge (Record/Observation/Assignment), Task title, Due date, Days remaining pill
- Color coding: green (>3 days), amber (1–3 days), red (overdue)
- "Mark Submitted" button updates `deadline_submitted = true`

**Done when:** Both panels render correct data, mark actions work, and color coding is accurate.

---

## PHASE 6 — NPTEL Tracker

### TASK 023 — NPTEL Course Management
**What to do:**  
Create `src/pages/NptelPage.tsx`:

**Empty state:** "You haven't added any NPTEL courses yet. Add one to start tracking." with an "Add Course" button.

**Add Course modal/form:**
- Fields: Course Name (text), Total Weeks (number, 1–16)
- On submit: inserts into `nptel_courses`, then bulk-inserts N rows into `nptel_weeks` (one per week, all defaulting to 'Not Started')

**Course list:**
- Each course shows: Course Name, progress bar (completed weeks / total weeks), percentage
- Expand button to show week-by-week grid

**Done when:** Courses can be added, weeks are auto-generated, and the course list renders with progress bars.

---

### TASK 024 — NPTEL Week Grid & Progress
**What to do:**  
Add the week-by-week tracking grid inside each expanded NPTEL course:

- Grid of week cells (Week 1, Week 2, ... Week N)
- Each cell has a 3-state toggle: Not Started → In Progress → Completed (click cycles through)
- Clicking a cell: updates `nptel_weeks.status` in Supabase
- Cell colors: gray (Not Started), amber (In Progress), green (Completed)
- Overall course progress bar updates in real-time as weeks are updated

**Done when:** Week cells toggle through states, updates persist to Supabase, and progress bar reflects changes.

---


## PHASE 7 — Friends & Social

### TASK 025 — Friend Request System
**What to do:**  
Create `src/pages/FriendsPage.tsx` with the friend management section:

**Search & Add:**
- Search input: user types an email address
- Query `public.users` where `email = searchTerm` (only returns users, not current user)
- Result shows: avatar, name, email, "Send Request" button
- Sending: inserts into `friendships` with status 'Pending'

**Pending Requests (Incoming):**
- Query: friendships where `addressee_id = current_user AND status = 'Pending'`
- Shows requester's name + avatar with "Accept" and "Reject" buttons
- Accept: updates `status = 'Accepted'`; Reject: updates `status = 'Rejected'`

**Your Friends List:**
- Query: accepted friendships involving current user
- Shows friend's avatar, name, college, year

**Done when:** Friend requests can be sent, received, accepted, and rejected. Friends list shows accepted connections.

---

### TASK 026 — Activity Feed
**What to do:**  
Add the Activity Feed section to FriendsPage:

- Query: today's sessions from all accepted friends (where `hide_from_friends = false`)
- Use **Supabase Realtime** to subscribe to INSERT events on `sessions` table:
  ```ts
  supabase
    .channel('friend-sessions')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sessions' }, handleNewSession)
    .subscribe()
  ```
- Filter incoming events to only show sessions from friends
- Each feed item: avatar, "[Friend Name] logged Xmin on [Category] — [Title]", time ago
- Feed is sorted newest first
- Empty state: "Your friends haven't logged anything today yet."

**Done when:** Activity feed shows real-time updates when a friend logs a session.

---

### TASK 027 — Group Analytics & Leaderboard
**What to do:**  
Add two more tabs to FriendsPage:

**Group Analytics Tab:**
- Grouped bar chart (Recharts) showing time spent per category per friend for the current week
- X-axis: categories, grouped bars: one per friend (including current user)
- Each friend's bars use a distinct color (auto-assigned from a palette)
- Toggle: This Week / This Month

**Leaderboard Tab:**
- Ranked list of friends (including current user) by total minutes logged this week
- Each row: rank number, avatar, name, total minutes (displayed as "Xh Ym"), horizontal mini-bar
- Current user's row is highlighted
- Empty state if no friends have logged anything

**Done when:** Both tabs render with real data from friend sessions.

---

## PHASE 8 — Profile Page

### TASK 028 — Profile Page
**What to do:**  
Create `src/pages/ProfilePage.tsx`:

**Profile section:**
- Displays: avatar (from Google), full name, email (read-only), college, year, semester, semester dates
- "Edit Profile" button opens an inline edit mode
- In edit mode: all fields except email become editable inputs
- Save: `upsert` to `public.users`, invalidate profile cache, show success toast
- Cancel: reverts to display mode

**Settings section:**
- Toggle: "Hide my activity from friends" (maps to `hide_from_friends`)
- Saves immediately on toggle change

**Danger Zone:**
- "Sign Out" button with confirmation

**Done when:** Profile displays correctly, edits save to Supabase, and the privacy toggle works.

---

## PHASE 9 — Polish & Hardening

### TASK 029 — Loading States & Error Boundaries
**What to do:**  
Add consistent loading and error UX across the entire app:
- Create a `<Skeleton>` component (animated gray blocks) for loading states
- Apply skeleton loaders to: Dashboard cards, session list, charts, friend feed
- Create a `<ErrorBoundary>` React component that catches render errors and shows a fallback UI
- Wrap each page in ErrorBoundary
- All React Query errors should surface as toast notifications (use `react-hot-toast`)
- Add a global `QueryClient` error handler in `main.tsx`

**Done when:** Every data-fetching state has a loading skeleton, errors show toasts, and ErrorBoundary catches crashes.

---

### TASK 030 — Mobile Responsiveness
**What to do:**  
Audit and fix mobile layout across all pages:
- AppShell: bottom nav bar on mobile (< 768px), sidebar hidden
- Dashboard: stat cards stack vertically on mobile
- Charts: constrain width, add horizontal scroll if needed
- SessionForm: full-width fields, touch-friendly inputs
- History: compressed row layout on mobile
- FriendsPage: tabs stack vertically on mobile
- Test all pages at 375px (iPhone SE) and 768px (tablet) breakpoints
- Ensure the Pomodoro timer is usable on mobile

**Done when:** All pages are usable on a 375px viewport with no horizontal overflow.

---

### TASK 031 — Dark Mode
**What to do:**  
Implement system-preference-aware dark mode:
- Use Tailwind's `dark:` variant throughout
- Detect system preference: `window.matchMedia('(prefers-color-scheme: dark)')`
- Store user preference in `localStorage` (override)
- Add a theme toggle button in the AppShell top bar (sun/moon icon)
- Ensure all custom colors have dark mode variants defined in `tailwind.config.js`
- Charts: update Recharts colors for dark mode (lighter stroke colors)

**Done when:** Dark mode toggles correctly, respects system preference by default, and all pages are readable in dark mode.

---

### TASK 032 — Environment Configuration & Deployment Prep
**What to do:**  
Prepare both apps for deployment:

**Frontend (Vercel):**
- Create `vercel.json` with SPA rewrite rule: `{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }`
- Document all required env vars in `frontend/.env.example`:
  ```
  VITE_SUPABASE_URL=
  VITE_SUPABASE_ANON_KEY=
  ```
- Update `README.md` with full deployment steps for Vercel

**Done when:** Frontend has deployment config, all env vars are documented, and README has clear deployment instructions.

---

## TASK INDEX SUMMARY

| Task | Phase | Description |
|------|-------|-------------|
| 001 | Scaffold | Initialize project |
| 002 | Scaffold | Tailwind + theme |
| 002b | Scaffold | TypeScript types setup |
| 003 | Scaffold | Supabase schema (5 tables) + generate types |
| 004 | Scaffold | RLS policies |
| 005 | Scaffold | Realtime + triggers |
| 006 | Auth | Supabase typed client + auth context |
| 007 | Auth | Router + protected routes |
| 008 | Auth | Login page |
| 009 | Auth | Profile setup page |
| 010 | Auth | App shell + navigation |
| 011 | Logger | Session form |
| 012 | Logger | Session continuity |
| 013 | Logger | Pomodoro timer |
| 014 | Dashboard | Typed data hooks |
| 015 | Dashboard | Today at a glance |
| 016 | Dashboard | Weekly heatmap |
| 017 | Dashboard | Category chart |
| 018 | Dashboard | Useful/not-useful donut |
| 019 | Dashboard | Semester bar + streak banner |
| 020 | History | History page + filters |
| 021 | History | Edit + delete session |
| 022 | Next Actions | Next actions + deadlines panel |
| 023 | NPTEL | Course management |
| 024 | NPTEL | Week grid + progress |
| 025 | Friends | Friend request system |
| 026 | Friends | Activity feed (Realtime) |
| 027 | Friends | Group analytics + leaderboard |
| 028 | Profile | Profile page |
| 029 | Polish | Loading states + error boundaries |
| 030 | Polish | Mobile responsiveness |
| 031 | Polish | Dark mode |
| 032 | Polish | Deployment prep (Vercel) |

**Total: 33 tasks across 9 phases.**

---

> ⚠️ **Agent instruction:** Execute tasks strictly in order. Each task assumes the previous is complete. If a task cannot be completed due to a missing dependency, stop and report the blocker — do not skip ahead.
