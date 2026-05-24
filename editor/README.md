# The Mortals — Editor Panel

Standalone admin app for editors to manage articles, volumes, hero rotation,
team, and alumni. Writes to Supabase; the public site at the repo root
fetches the same data and renders it.

```
mortals-magazine/         ← public site (deployed to e.g. mortals-magazine.netlify.app)
├── src/                  ← public React app
├── supabase/             ← schema + seed SQL (run once in Supabase dashboard)
└── editor/               ← THIS — editor panel (deployed to e.g. mortals-editor.netlify.app)
    ├── src/
    ├── package.json
    └── netlify.toml
```

## First-time setup

### 1. Create the Supabase project (10 min, one-time)

1. Go to https://app.supabase.com → **New project**. Pick a region near China for low latency (Singapore is good).
2. Wait for the database to provision.
3. **SQL Editor → New query.** Paste and run each file in order:
   - `../supabase/schema.sql`
   - `../supabase/policies.sql`
   - `../supabase/storage.sql`
   - `../supabase/seed.sql`
4. **Authentication → Users → Add user.** Invite editors by email; set a password. They sign in with this on the editor panel.
5. **Settings → API.** Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### 2. Local dev

```bash
cd editor
cp .env.example .env.local
# paste the two values into .env.local
npm install
npm run dev        # → http://localhost:5174
```

### 3. Deploy to Netlify

Same repo, second Netlify site:

1. Netlify → **Add new site → Import an existing project → GitHub → SCYip/mortals-magazine**
2. **Base directory:** `editor`
3. Build command: `npm run build` · Publish dir: `dist` · Node: `20`
   (All three already in `editor/netlify.toml` — Netlify reads them automatically.)
4. **Site configuration → Environment variables** → add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the same values).
5. Deploy. Your editor lives at `<your-editor-site>.netlify.app`.
6. **Important** — also add the same two env vars to the **public** Netlify site, otherwise the public site keeps falling back to static seed data.

## How "auto-refresh" works

The public site uses async fetchers (`src/data/api.ts`) that hit Supabase
on every page navigation. When an editor publishes a new article in the
panel, the next visitor on the public site sees it immediately — no
redeploy, no rebuild. The Editor's Picks rail, All Articles list, and
hero rotation all live-update from Supabase.

If the env vars on the public site aren't set, the site keeps working
from the bundled static seed — you can use Supabase only on the editor
side until you're ready to flip everything live.
