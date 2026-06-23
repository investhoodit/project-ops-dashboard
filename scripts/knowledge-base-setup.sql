-- Project & Operations Dashboard — Knowledge Base setup
-- Idempotent: safe to run more than once.
-- Paste the CONTENTS of this file into the Supabase SQL Editor and click Run.

create table if not exists public.knowledge_base (
  id text primary key,
  title text not null default '',
  category text not null default 'General',
  content text not null default '',
  tags text not null default '',
  source_url text not null default '',
  -- Reserved for a future vector store (e.g. pgvector). Left as text now so the
  -- table is forward-compatible without requiring the extension yet.
  embedding text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_base_category_idx on public.knowledge_base (category);

-- Simple full-text search support over title + content.
create index if not exists knowledge_base_fts_idx
  on public.knowledge_base
  using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'')));

alter table public.knowledge_base enable row level security;

drop policy if exists "public read knowledge_base" on public.knowledge_base;
create policy "public read knowledge_base"
  on public.knowledge_base for select using (true);

drop policy if exists "anon insert knowledge_base" on public.knowledge_base;
create policy "anon insert knowledge_base"
  on public.knowledge_base for insert with check (true);

drop policy if exists "anon update knowledge_base" on public.knowledge_base;
create policy "anon update knowledge_base"
  on public.knowledge_base for update using (true) with check (true);

-- Seed a few baseline entries describing the organisation so the assistant has
-- grounded context to answer "general" questions about Investhood.
insert into public.knowledge_base (id, title, category, content, tags, source_url)
values
  ('kb-org-overview',
   'Investhood Group — Overview',
   'Organisation',
   'Investhood is a South African group operating across education, technology and community development. Its strategic business units include Investhood Skills Hub (accredited skills development and learnerships), Investhood IT (software and the Signa LMS product), Charisma Smart-Rise Creche (early childhood development), and Dhlamini Farm (agri-tourism and rural youth programmes).',
   'about,company,sbus,overview', ''),
  ('kb-funding-strategy',
   'Funding & Opportunity Strategy',
   'Strategy',
   'The group pursues SETA discretionary grants (MICT, AgriSETA), government and IT/software tenders, local and international grants, CSI/donor funding, and incubation programmes. Priority is given to opportunities with high relevance to existing SBUs, near-term closing dates, and strong eligibility fit.',
   'funding,grants,tenders,strategy', ''),
  ('kb-compliance',
   'Compliance & Registration',
   'Compliance',
   'For government tenders, suppliers must be registered on the Central Supplier Database (CSD) and tax compliant. SETA grant applications require accreditation as a skills development provider. NPO funding typically requires NPO registration and audited financials.',
   'compliance,csd,accreditation,npo', '')
on conflict (id) do update set
  title = excluded.title, category = excluded.category, content = excluded.content,
  tags = excluded.tags, source_url = excluded.source_url, updated_at = now();
