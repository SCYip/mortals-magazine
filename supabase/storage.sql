-- The Mortals — Supabase Storage buckets
-- Run after policies.sql.
-- Creates four public-read buckets + auth-write policies.

-- ---------- Buckets ----------
insert into storage.buckets (id, name, public) values
  ('article-covers',     'article-covers',     true),
  ('volume-covers',      'volume-covers',      true),
  ('hero-slides',        'hero-slides',        true),
  ('alumni-portraits',   'alumni-portraits',   true)
on conflict (id) do nothing;

-- ---------- Public read on every site bucket ----------
drop policy if exists "public read site assets" on storage.objects;
create policy "public read site assets" on storage.objects for select
  using (bucket_id in ('article-covers','volume-covers','hero-slides','alumni-portraits'));

-- ---------- Authenticated upload / update / delete ----------
drop policy if exists "auth write site assets" on storage.objects;
create policy "auth write site assets" on storage.objects for all
  using (
    bucket_id in ('article-covers','volume-covers','hero-slides','alumni-portraits')
    and auth.role() = 'authenticated'
  )
  with check (
    bucket_id in ('article-covers','volume-covers','hero-slides','alumni-portraits')
    and auth.role() = 'authenticated'
  );
