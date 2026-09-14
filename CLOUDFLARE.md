# Hosting on Cloudflare Pages

Both sites moved here from Netlify on 2026-09-14 after the Netlify plan lapsed
and both deploys were taken down. Cloudflare Pages is free with unlimited
bandwidth, and — the reason it was chosen over Vercel — it is reachable from
mainland China, where the readers are. (Vercel's `*.vercel.app` is blocked.)

One GitHub repo, two Pages projects that differ only in root directory.

## The two projects

| | Public site | Editor panel |
|---|---|---|
| Project name | `mortalsmag` | `mortals-editor` |
| Root directory | `/` | `editor` |
| Build command | `npm run build` | `npm run build` |
| Build output | `dist` | `dist` |
| Production branch | `main` | `main` |

Both need the same two environment variables (Production **and** Preview):

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://datercxlvabgiieqqucr.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | the **publishable** key from Supabase → Settings → API (`sb_publishable_…`) |
| `NODE_VERSION` | `20` |

The anon/publishable key is safe to put here — it is designed to ship inside
the public JavaScript bundle. The `service_role` key must **never** be set
anywhere on Cloudflare; the code that needs it runs on Supabase (below).

Vite inlines `VITE_*` variables at build time, so changing one requires a
redeploy before the browser sees it.

## What replaced the Netlify-specific pieces

- **`netlify.toml` → `public/_redirects` + `public/_headers`.** Cloudflare
  reads both from the build output, and Vite copies `public/` into `dist/`
  verbatim. Same SPA fallback and the same asset-caching headers as before.
- **Netlify Functions → Supabase Edge Functions.** The editor panel's
  `create-editor` / `delete-editor` endpoints needed the service-role key,
  so they had to run server-side. They now live in `supabase/functions/` and
  are deployed to `https://datercxlvabgiieqqucr.supabase.co/functions/v1/…`.
  Supabase injects the service-role key into them automatically, so there is
  no secret to configure on any host — which is the point: the editor panel
  is now pure static and can move hosts again without touching them.

  They are deployed with `verify_jwt: false` on purpose. With it on, the
  gateway rejects the browser's CORS preflight (which carries no token) and
  the panel can't call them at all. Authorization is done inside the
  function instead: it validates the bearer token and refuses anyone whose
  `profiles.role` is not `chief` — the same check the Netlify version did.

## Redeploying the edge functions

Edit under `supabase/functions/`, then either use the Supabase MCP
`deploy_edge_function` (as was done for the initial deploy) or the CLI:

```bash
supabase functions deploy create-editor --no-verify-jwt
supabase functions deploy delete-editor --no-verify-jwt
```

## Verifying a deploy

- Public site loads and `/volumes` shows database content (no `[api] … fallback` warning in the console)
- Deep link such as `/all-articles/on-selfishness` loads directly (proves `_redirects` is in effect)
- Editor panel signs in; Editors tab can create and delete an editor (proves the edge functions + CORS work)
