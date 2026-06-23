-- ============================================================================
-- Project & Operations Dashboard — Opportunities & Leads module setup
-- ============================================================================
-- Idempotent: safe to run more than once. Creates the opportunities table and
-- the search-run audit log, enables RLS with public (anon) read access plus
-- anon insert/update (so the dashboard can save edits with the anon key), and
-- seeds demo opportunities.
--
-- Run this in the Supabase SQL Editor AFTER running scripts/supabase-setup.sql.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.opportunities (
  id text primary key,
  title text not null default '',
  description text not null default '',
  source_name text not null default '',
  source_url text not null default '',
  opportunity_type text not null default 'Other',
  sbu_id text not null default 'general',
  organisation_type text not null default 'General',
  estimated_value text not null default '',
  location text not null default '',
  closing_date date,
  eligibility text not null default '',
  contact_email text not null default '',
  contact_phone text not null default '',
  application_url text not null default '',
  status text not null default 'New',
  priority text not null default 'Medium',
  assigned_to text not null default '',
  notes text not null default '',
  relevance_score int,
  urgency_score int,
  fit_score int,
  recommended_action text,
  link_status text not null default 'unchecked',
  link_checked_at timestamptz,
  link_http_status int,
  is_official_source boolean not null default false,
  data_quality_score int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Link-validation & data-quality columns (added in a later release). The
-- statements below keep existing installations forward-compatible.
alter table public.opportunities add column if not exists link_status text not null default 'unchecked';
alter table public.opportunities add column if not exists link_checked_at timestamptz;
alter table public.opportunities add column if not exists link_http_status int;
alter table public.opportunities add column if not exists is_official_source boolean not null default false;
alter table public.opportunities add column if not exists data_quality_score int not null default 0;

-- source_url is used as an ON CONFLICT target by the discovery/search insert,
-- so it needs a unique constraint. Empty strings would collide, so we use a
-- partial unique index that ignores blank source URLs.
create unique index if not exists opportunities_source_url_key
  on public.opportunities (source_url)
  where source_url <> '';

create index if not exists opportunities_status_idx on public.opportunities (status);
create index if not exists opportunities_sbu_idx on public.opportunities (sbu_id);
create index if not exists opportunities_closing_idx on public.opportunities (closing_date);
create index if not exists opportunities_link_status_idx on public.opportunities (link_status);

create table if not exists public.opportunity_search_runs (
  id bigint generated always as identity primary key,
  triggered_by text not null default '',
  status text not null default '',
  found int not null default 0,
  inserted int not null default 0,
  notes text not null default '',
  ran_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.opportunities          enable row level security;
alter table public.opportunity_search_runs enable row level security;

-- opportunities: public read + anon insert/update (dashboard saves with anon key)
drop policy if exists "public read opportunities" on public.opportunities;
create policy "public read opportunities"
  on public.opportunities for select using (true);

drop policy if exists "anon insert opportunities" on public.opportunities;
create policy "anon insert opportunities"
  on public.opportunities for insert with check (true);

drop policy if exists "anon update opportunities" on public.opportunities;
create policy "anon update opportunities"
  on public.opportunities for update using (true) with check (true);

-- search runs: public read + anon insert (audit log written by the server)
drop policy if exists "public read search runs" on public.opportunity_search_runs;
create policy "public read search runs"
  on public.opportunity_search_runs for select using (true);

drop policy if exists "anon insert search runs" on public.opportunity_search_runs;
create policy "anon insert search runs"
  on public.opportunity_search_runs for insert with check (true);

-- ---------------------------------------------------------------------------
-- Seed demo opportunities
-- ---------------------------------------------------------------------------
insert into public.opportunities
  (id, title, description, source_name, source_url, opportunity_type, sbu_id,
   organisation_type, estimated_value, location, closing_date, eligibility,
   contact_email, contact_phone, application_url, status, priority, assigned_to, notes,
   relevance_score, urgency_score, fit_score, recommended_action,
   link_status, link_checked_at, link_http_status, is_official_source, data_quality_score)
values
  ('opp-demo-1',
   'MICT SETA Discretionary Grant — Learnerships 2026/27',
   'Discretionary grant funding window for accredited IT and digital skills learnerships, internships and workplace-based learning. Suitable for Investhood Skills Hub to host youth learners.',
   'MICT SETA', 'https://www.mict.org.za', 'SETA Opportunity', 'npo', 'NPO',
   'R1,200,000', 'National (South Africa)', current_date + 9,
   'Accredited skills development providers and NPOs hosting MICT-aligned learnerships.',
   'grants@mict.org.za', '011 207 2600', 'https://www.mict.org.za/discretionary-grants',
   'New', 'High', '', '',
   90, 70, 85, 'Apply soon — strong fit and an open SETA funding window.',
   'verified', now(), 200, true, 100),
  ('opp-demo-2',
   'City of Tshwane — School Management & LMS Software Tender',
   'Open tender for the supply, implementation and support of a learner management and school administration system. Strong fit for Investhood IT (Signa LMS) as a private supplier.',
   'City of Tshwane', 'https://www.tshwane.gov.za', 'IT/Software Tender', 'technology', 'Private Company',
   'R2,500,000', 'Tshwane, Gauteng', current_date + 4,
   'Registered companies on the Central Supplier Database with relevant software references.',
   'scm@tshwane.gov.za', '012 358 9999', 'https://www.tshwane.gov.za/tenders',
   'Reviewing', 'High', 'Technical Lead', 'Confirm CSD registration and prepare LMS reference pack.',
   95, 90, 88, 'Prioritise — closes soon and is a direct product fit.',
   'verified', now(), 200, true, 100),
  ('opp-demo-3',
   'Mastercard Foundation — Young Africa Works Education Grant',
   'International funding for youth education, digital skills and entrepreneurship programmes. Aligned with Investhood Skills Hub and SOS coding/robotics camps.',
   'Mastercard Foundation', 'https://mastercardfdn.org', 'International Grant', 'npo', 'NPO',
   'USD 250,000', 'Africa', current_date + 26,
   'Registered NPOs delivering youth skills and education at scale.',
   'info@mastercardfdn.org', '', 'https://mastercardfdn.org/all/partner-with-us',
   'New', 'Medium', '', '',
   80, 45, 75, 'Review eligibility and prepare a concept note.',
   'verified', now(), 200, false, 90),
  ('opp-demo-4',
   'AgriSETA Discretionary Grant — Rural Skills & Farm Training',
   'Funding for agricultural skills development and rural training. Suitable for Dhlamini Farm camps and agri-tourism youth programmes.',
   'AgriSETA', 'https://www.agriseta.co.za', 'SETA Opportunity', 'agro', 'Farm',
   'R600,000', 'National (South Africa)', current_date + 18,
   'Agricultural training providers and community development organisations.',
   'dg@agriseta.co.za', '012 301 5600', 'https://www.agriseta.co.za/discretionary-grants',
   'New', 'Medium', '', '',
   75, 55, 70, 'Assess accreditation requirements before applying.',
   'verified', now(), 200, true, 100),
  ('opp-demo-5',
   'The Innovation Hub — EdTech Incubation Programme',
   'Incubation and acceleration support for technology startups, including EdTech. Good fit for SmartRise EdTech and the Investhood LMS product line.',
   'The Innovation Hub', 'https://www.theinnovationhub.com', 'Incubation/Accelerator', 'technology', 'Private Company',
   'Non-cash (incubation support)', 'Pretoria, Gauteng', current_date + 40,
   'Early-stage technology ventures registered in South Africa.',
   'info@theinnovationhub.com', '012 844 0000', 'https://www.theinnovationhub.com/programmes',
   'New', 'Low', '', '',
   65, 30, 70, 'Add to pipeline — longer runway, non-cash support.',
   'verified', now(), 200, true, 100)
on conflict (id) do update set
  title = excluded.title, description = excluded.description, source_name = excluded.source_name,
  source_url = excluded.source_url, opportunity_type = excluded.opportunity_type, sbu_id = excluded.sbu_id,
  organisation_type = excluded.organisation_type, estimated_value = excluded.estimated_value,
  location = excluded.location, closing_date = excluded.closing_date, eligibility = excluded.eligibility,
  contact_email = excluded.contact_email, contact_phone = excluded.contact_phone,
  application_url = excluded.application_url, status = excluded.status, priority = excluded.priority,
  assigned_to = excluded.assigned_to, notes = excluded.notes,
  relevance_score = excluded.relevance_score, urgency_score = excluded.urgency_score,
  fit_score = excluded.fit_score, recommended_action = excluded.recommended_action,
  link_status = excluded.link_status, link_checked_at = excluded.link_checked_at,
  link_http_status = excluded.link_http_status, is_official_source = excluded.is_official_source,
  data_quality_score = excluded.data_quality_score;
