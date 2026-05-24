-- The Mortals — Row Level Security policies
-- Run after schema.sql.
-- Strategy: public can read; only authenticated users (i.e. signed-in editors)
-- can insert / update / delete.

-- ---------- Enable RLS on every table ----------
alter table public.columns        enable row level security;
alter table public.articles       enable row level security;
alter table public.volumes        enable row level security;
alter table public.issues         enable row level security;
alter table public.hero_slides    enable row level security;
alter table public.team_members   enable row level security;
alter table public.alumni         enable row level security;

-- ---------- Public read ----------
drop policy if exists "public read columns"      on public.columns;
create policy "public read columns"      on public.columns      for select using (true);

drop policy if exists "public read articles"     on public.articles;
create policy "public read articles"     on public.articles     for select using (published = true);

drop policy if exists "public read volumes"      on public.volumes;
create policy "public read volumes"      on public.volumes      for select using (true);

drop policy if exists "public read issues"       on public.issues;
create policy "public read issues"       on public.issues       for select using (true);

drop policy if exists "public read hero_slides"  on public.hero_slides;
create policy "public read hero_slides"  on public.hero_slides  for select using (active = true);

drop policy if exists "public read team"         on public.team_members;
create policy "public read team"         on public.team_members for select using (active = true);

drop policy if exists "public read alumni"       on public.alumni;
create policy "public read alumni"       on public.alumni       for select using (true);

-- ---------- Authenticated write (editors) ----------
drop policy if exists "auth write columns"       on public.columns;
create policy "auth write columns"       on public.columns      for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "auth write articles"      on public.articles;
create policy "auth write articles"      on public.articles     for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "auth write volumes"       on public.volumes;
create policy "auth write volumes"       on public.volumes      for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "auth write issues"        on public.issues;
create policy "auth write issues"        on public.issues       for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "auth write hero_slides"   on public.hero_slides;
create policy "auth write hero_slides"   on public.hero_slides  for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "auth write team"          on public.team_members;
create policy "auth write team"          on public.team_members for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "auth write alumni"        on public.alumni;
create policy "auth write alumni"        on public.alumni       for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Editors should also see draft (unpublished) articles
drop policy if exists "auth read draft articles" on public.articles;
create policy "auth read draft articles" on public.articles for select
  using (auth.role() = 'authenticated');
