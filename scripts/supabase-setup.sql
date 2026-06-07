-- ============================================================================
-- Project & Operations Dashboard — Supabase setup
-- ============================================================================
-- Run this entire file once in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run).
--
-- It is idempotent: safe to run more than once. It creates the six tables the
-- dashboard reads, enables Row Level Security with public (anon) READ access,
-- and seeds the demo data. The app uses the anon key for read-only access.
--
-- NOTE: column names use double quotes where they are camelCase so they match
-- exactly what the REST API / app expects (e.g. "revenueTarget").
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------
create table if not exists public.sbus (
  id text primary key,
  name text,
  goal text,
  projects jsonb
);

create table if not exists public.projects (
  id text primary key,
  name text,
  sbu text,
  status text,
  priority text,
  owner text,
  progress int,
  "revenueTarget" text,
  "currentRevenue" text,
  "targetDate" text,
  "nextAction" text,
  risk text
);

create table if not exists public.tasks (
  id text primary key,
  title text,
  "projectId" text,
  owner text,
  "dueDate" text,
  status text,
  priority text,
  progress int,
  notes text
);

create table if not exists public.weekly_review (
  label text primary key,
  done boolean
);

create table if not exists public.kpis (
  label text primary key,
  value text
);

create table if not exists public.events (
  id text primary key,
  title text,
  date text,
  type text,
  notes text
);

-- ----------------------------------------------------------------------------
-- Row Level Security: allow public (anon) read access
-- ----------------------------------------------------------------------------
alter table public.sbus          enable row level security;
alter table public.projects      enable row level security;
alter table public.tasks         enable row level security;
alter table public.weekly_review enable row level security;
alter table public.kpis          enable row level security;
alter table public.events        enable row level security;

do $$
declare t text;
begin
  foreach t in array array['sbus','projects','tasks','weekly_review','kpis','events']
  loop
    execute format('drop policy if exists "public read %1$s" on public.%1$I;', t);
    execute format('create policy "public read %1$s" on public.%1$I for select using (true);', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Seed data
-- ----------------------------------------------------------------------------
insert into public.sbus (id, name, goal, projects) values
  ('education', 'Education & Child Development', 'Recurring learner-based income',
    '["SmartRise Creche","Charisma Creches","Investhood Aftercare","Charisma School Digitisation"]'::jsonb),
  ('technology', 'Technology & Software', 'B2B contracts and software service revenue',
    '["Signa LMS","Recruitment App","Investhood LMS","School Systems"]'::jsonb),
  ('npo', 'Youth Skills & NPO', 'Grants, sponsors, equipment and community impact',
    '["Investhood Skills Hub","SmartRise EdTech","SOS Programmes","Digital Innovation Programme"]'::jsonb),
  ('agro', 'Agro-Tech, Camps & Community', 'Farm income, camps, events and community development',
    '["Dhlamini Farm","Coding Camps","Robotics Camps","School Camps","Church Camps","Agro-tourism"]'::jsonb)
on conflict (id) do update set
  name = excluded.name, goal = excluded.goal, projects = excluded.projects;

insert into public.projects
  (id, name, sbu, status, priority, owner, progress, "revenueTarget", "currentRevenue", "targetDate", "nextAction", risk) values
  ('smartcreche', 'SmartRise Creche', 'education', 'At Risk', 'High', 'Operations Manager', 38,
    'R135,000 pm', 'R1,800 pm', '2026-09-01', 'Run direct marketing drive and parent site visits',
    'Low learner registration numbers'),
  ('aftercare', 'Investhood Aftercare', 'education', 'In Progress', 'High', 'Programme Lead', 48,
    'R120,000 pm', 'R20,000 pm', '2026-07-01', 'Launch app and start SOS lab visits',
    'Programme not fully delivering promised coding/robotics services yet'),
  ('signa', 'Signa LMS', 'technology', 'In Progress', 'High', 'Technical Lead', 90,
    'Contract + support revenue', 'Pending approval', '2026-07-01',
    'Complete testing, payroll automation and domain migration',
    'Pilot delay if testing or documentation is not signed off'),
  ('recruitment', 'Recruitment App', 'technology', 'In Progress', 'High', 'Sales + Technical Lead', 88,
    '1 paying customer', 'Pipeline', '2026-07-31', 'Book demos with learnership and recruitment companies',
    'Insufficient sales focus after build completion'),
  ('sos-camps', 'SOS Coding Camps', 'npo', 'On Track', 'High', 'Programme Lead', 25,
    'R50,000 - R150,000 per camp', 'Planning', '2026-07-15', 'Publish camp calendar and send sponsor packs',
    'No confirmed sponsor or registration pipeline yet'),
  ('farm', 'Dhlamini Farm & Farm Camps', 'agro', 'In Progress', 'Medium', 'Farm Lead', 22,
    'Farm sales + camp income', 'Pre-revenue', '2026-09-30',
    'Complete access, livestock setup, first crop plan and camp concept',
    'Infrastructure and operating capital constraints')
on conflict (id) do update set
  name = excluded.name, sbu = excluded.sbu, status = excluded.status, priority = excluded.priority,
  owner = excluded.owner, progress = excluded.progress, "revenueTarget" = excluded."revenueTarget",
  "currentRevenue" = excluded."currentRevenue", "targetDate" = excluded."targetDate",
  "nextAction" = excluded."nextAction", risk = excluded.risk;

insert into public.tasks
  (id, title, "projectId", owner, "dueDate", status, priority, progress, notes) values
  ('task-1', 'Complete SmartRise Creche curriculum and timetable', 'smartcreche', 'BA Team', '2026-06-30',
    'In Progress', 'High', 55, 'Must support parent marketing and compliance.'),
  ('task-2', 'Arrange social worker assessment for creche compliance', 'smartcreche', 'Operations Manager',
    '2026-06-12', 'Blocked', 'High', 20, 'Required for social development funding process.'),
  ('task-3', 'Run weekly parent open day for SmartRise Creche', 'smartcreche', 'Marketing Lead', '2026-06-15',
    'Not Started', 'High', 0, 'Saturday open day with tours and registration promotion.'),
  ('task-4', 'Update Aftercare Management Plan', 'aftercare', 'Programme Lead', '2026-06-12',
    'In Progress', 'High', 45, 'Include homework, coding, robotics, AI, computer basics and SOPs.'),
  ('task-5', 'Schedule SOS computer lab visits', 'aftercare', 'Operations Manager', '2026-06-20',
    'Not Started', 'High', 0, 'Use code.org, Investhood LMS and STEMulator.'),
  ('task-6', 'Complete Signa payroll and timesheet automation', 'signa', 'Technical Lead', '2026-06-12',
    'In Progress', 'High', 70, 'Auto-calculate days attended and generate timesheets.'),
  ('task-7', 'Prepare Recruitment App client demo list', 'recruitment', 'Sales Lead', '2026-06-25',
    'In Progress', 'High', 35, 'Target learnership, internship and recruitment companies.'),
  ('task-8', 'Prepare SOS Coding Camp sponsor pack', 'sos-camps', 'Programme Lead', '2026-06-28',
    'Not Started', 'High', 0, 'Include coding, robotics, AI and FLL camp packages.'),
  ('task-9', 'Create Dhlamini Farm camp concept and price package', 'farm', 'Farm Lead', '2026-07-05',
    'Not Started', 'Medium', 0, 'School camps, church camps, coding camps and agro-tourism.')
on conflict (id) do update set
  title = excluded.title, "projectId" = excluded."projectId", owner = excluded.owner,
  "dueDate" = excluded."dueDate", status = excluded.status, priority = excluded.priority,
  progress = excluded.progress, notes = excluded.notes;

insert into public.weekly_review (label, done) values
  ('Learner growth reviewed', false),
  ('App progress reviewed', false),
  ('Demos booked and followed up', false),
  ('Sponsor pipeline updated', false),
  ('Cash flow and revenue checked', false),
  ('Top risks escalated', false),
  ('Next-week actions assigned', false)
on conflict (label) do update set done = excluded.done;

insert into public.kpis (label, value) values
  ('Leads Captured', '25'),
  ('Follow-ups Done', '18'),
  ('Active Dev Tasks', '32'),
  ('Sponsor Follow-ups', '12'),
  ('Staff Attendance', '92%'),
  ('Cash Collected', 'R18,450'),
  ('Demos Booked', '5'),
  ('Overdue Tasks', '0')
on conflict (label) do update set value = excluded.value;

-- events starts empty; the app manages calendar entries.

-- ============================================================================
-- Done. Reload the dashboard — the header badge should now read
-- "Live Data (Supabase)".
-- ============================================================================
