# Restoring the Supabase backend

The original project (`datercxlvabgiieqqucr`) stopped resolving — its hostname
returns NXDOMAIN authoritatively from supabase.co's own nameservers, so it was
removed rather than paused. The public site keeps working because every fetcher
in `src/data/api.ts` falls back to the seed bundled in `src/data/articles.ts`,
but the editor panel is dead until a backend exists again.

This runbook rebuilds it. Step 1 needs a signed-in browser and is the only part
an agent cannot do; everything after it is mechanical.

## 1. Create the project (you)

New project at <https://supabase.com/dashboard> — sign in with GitHub. Let
Supabase generate the database password; you do not need it for any step below.
Pick a region close to readers (Singapore or Tokyo for BASIS China).

Then from **Settings → API**, copy:

- Project URL → `https://<new-ref>.supabase.co`
- `anon` **public** key → safe to ship in the frontend bundle
- `service_role` **secret** key → server-side only, never commit it

## 2. Apply the schema

Paste each file into the SQL Editor and run, in this order:

| Order | File | Purpose |
|---|---|---|
| 1 | `schema.sql` | tables |
| 2 | `migrations/002_article_columns.sql` | article ↔ column join table |
| 3 | `migrations/003_acknowledgements.sql` | acknowledgements table |
| 4 | `migrations/004_issue_pdf_url.sql` | **`issues.pdf_url`** |
| 5 | `policies.sql` | row-level security |
| 6 | `roles.sql` | editor role |
| 7 | `storage.sql` | image buckets |

Step 4 matters more than it looks. `pdf_url` was originally added straight to
the live database and never captured in version control, so a restore that
skips it comes up without the column, every issue loses its download link, and
the issue page quietly falls back to the browser's print-to-PDF view.

## 3. Seed from the current data

Do **not** use `seed.sql` — it is a May 2024 snapshot with no trace of the
Fall 2025 or Winter 2025-26 issues and none of the GitHub-hosted PDFs. Seeding
from it would delete content that is live today.

Seed from `src/data/articles.ts` instead, which is current:

```bash
SUPABASE_URL=https://<new-ref>.supabase.co SUPABASE_SERVICE_ROLE=<service-role-key> npx tsx scripts/seed-supabase.ts
```

Both `scripts/seed-supabase.ts` and `scripts/sync-volumes-from-static.ts` now
write `pdf_url`; before this fix they silently dropped it.

## 4. Point both sites at the new project

Set these in **each** Netlify site — the public site and the editor panel are
separate deploys that share one database:

- `VITE_SUPABASE_URL` = `https://<new-ref>.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = the anon public key

Vite inlines env vars at build time, so redeploy both sites afterwards — an
env var change alone never reaches the browser.

## 5. Verify

- `/volumes/2025-2026/issue/fall-2025` shows **Download PDF** pointing at
  `github.com/.../releases/download/magazine-pdfs/...`, not "Download (Save as PDF)"
- Editor panel logs in and lists articles
- Browser console shows no `[api] … fallback:` warnings — a warning means the
  site is still serving seed data rather than the database

## If you drop Supabase instead

Remove `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from both Netlify sites
and redeploy. `hasSupabase` becomes false, the site serves bundled seed data
with no network round trip, and content becomes code-edit-only. The editor
panel stays non-functional.
