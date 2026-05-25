-- Migration 002 — many-to-many article ↔ columns
-- Adds a junction table so a single article/poem can live in multiple
-- columns (matches how mortalsmag.com publishes pieces under both
-- Inkmagination and Fourteenlines, for example).
--
-- Backward compat: articles.column_slug is preserved as a legacy field;
-- the API treats the junction table as the source of truth and falls
-- back to column_slug only when no junction rows exist for an article.

create table if not exists public.article_columns (
  article_id  bigint not null references public.articles(id)      on delete cascade,
  column_slug text   not null references public.columns(slug)     on delete cascade,
  primary key (article_id, column_slug)
);

create index if not exists article_columns_column_slug_idx
  on public.article_columns (column_slug);

create index if not exists article_columns_article_id_idx
  on public.article_columns (article_id);

-- RLS — public read, authenticated write (mirrors articles + columns)
alter table public.article_columns enable row level security;

drop policy if exists "public read article_columns"  on public.article_columns;
create policy "public read article_columns" on public.article_columns
  for select using (true);

drop policy if exists "auth write article_columns"   on public.article_columns;
create policy "auth write article_columns" on public.article_columns
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Backfill: copy current articles.column_slug into the junction so
-- everything that already had a single column survives the migration.
insert into public.article_columns (article_id, column_slug)
  select id, column_slug
  from public.articles
  where column_slug is not null
on conflict do nothing;
