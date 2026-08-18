-- 004_issue_pdf_url.sql
--
-- Adds issues.pdf_url: the direct link to an issue's full magazine PDF.
--
-- This column already exists in the live database (it was added ad-hoc when
-- issue PDFs were first hosted) but had never been captured in version
-- control. That gap only becomes visible when the schema is applied to a
-- fresh project: without this migration the column is missing, every issue
-- loses its download link, and the issue page silently falls back to the
-- browser's "Save as PDF" print view instead of serving the real magazine.
--
-- Nullable on purpose — older issues have no PDF and should keep using the
-- print fallback. The app treats NULL as "no PDF available".
--
-- Idempotent, so it is safe to re-run against an existing database.

alter table public.issues
  add column if not exists pdf_url text;

comment on column public.issues.pdf_url is
  'Direct URL to the full issue PDF (currently hosted on GitHub Releases). NULL when the issue has no PDF, in which case the site offers a print-to-PDF fallback.';
