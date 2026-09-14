-- Migration 006 — editor's picks
--
-- The home page's "Editor's Picks" rail used to be a misnomer: it showed the
-- five most recently published articles, with no way to curate it. This
-- makes it a real editorial choice managed from the panel.
--
-- One nullable column carries both facts: NULL means "not a pick";
-- 1..5 is the article's slot on the rail. Kept on `articles` rather than a
-- join table so the existing list query picks it up with no extra round
-- trip. The panel always writes a complete, consistent set (clears every
-- slot, then assigns), so a uniqueness constraint is deliberately omitted —
-- it would only turn a harmless mid-save state into an error.

alter table public.articles
  add column if not exists pick_order int;

comment on column public.articles.pick_order is
  'Slot on the home page Editor''s Picks rail (1 = first). NULL when the article is not a pick.';

-- Seed the five newest published articles as picks 1..5 — exactly what the
-- rail showed before this column existed — so deploying changes nothing
-- until an editor decides otherwise. Only runs when no picks exist yet.
with ranked as (
  select id, row_number() over (order by published_at desc) as rn
  from public.articles
  where published = true
)
update public.articles a
set pick_order = r.rn
from ranked r
where a.id = r.id
  and r.rn <= 5
  and not exists (select 1 from public.articles where pick_order is not null);
