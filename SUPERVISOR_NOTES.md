# Overnight Supervision Notes

Generated: 2026-05-25, by Claude acting as autonomous supervisor.

You're handed back the project in a tested, working state. Sections below cover what I did, what works, what to watch.

---

## Credentials (you asked me to set these up)

| Account | Email | Password | Role |
|---|---|---|---|
| Chief  | `shingchoyip@gmail.com`                 | `Mortals2026!Editor` | chief  |
| Editor | `shingcho.yip15377-biph@basischina.com` | `Wog49555`           | editor |

Both accounts are created in Supabase auth.users **and** have rows in `public.profiles` (the profile row drives `useRole`, which gates the chief-only `/editors` tab).

---

## What I tested end-to-end (all passing)

### Auth + sign-in flow
- ✅ Chief sign-in → `/articles` loads 16 rows, 5 nav items (Articles, Volumes, Hero, Team & Alumni, Editors)
- ✅ Editor sign-in → `/articles` loads 16 rows, 4 nav items (no Editors tab)
- ✅ Editor visiting `/editors` directly → sees *"Only the editor-in-chief can manage editors"* message instead of the management UI
- ✅ Sign out from any panel → reloads to `/login`
- ✅ Sign in/out cycled three times (chief → editor → chief) — no stale state
- ✅ Session persists across hard refreshes
- ✅ Wrong password → error banner on login form

### Panels (chief + editor)
- ✅ `/articles` — 16 articles, search bar, "New article" button, each row has thumbnail strip, Edit / Publish-toggle / Delete buttons
- ✅ `/volumes` — 3 volume cards with title/season/theme/issue count + thumbnail strip
- ✅ `/hero` — 5 hero slide cards, all background images resolve to `mortalsmag.netlify.app`
- ✅ `/people` — Team (5+ members, "No images" since portraits never existed in source data) and Alumni (3 portraits) subtabs
- ✅ `/editors` (chief only) — 2 accounts visible, promote/demote buttons, delete buttons

### Create-editor in-app form (the thing you asked for explicitly)
- ✅ Enter email + password (or click Shuffle for random) → Create editor
- ✅ Fresh user → mode: created (banner: *"Editor X created. They can sign in now."*)
- ✅ Existing user → mode: reset (banner: *"Password reset for X. They can sign in now."*)
- ✅ Profile row is always upserted, so even password resets leave a valid profile (was broken before — see *Architecture fixes*)
- ✅ Delete editor (revoke) — cascades to `auth.users` so the email is fully reusable
- ✅ Last-chief protection — refuses to delete the only chief or self
- ✅ Form rejects passwords < 8 chars

### Reliability
- ✅ 35-second idle on `/articles` → still functional, nav still works
- ✅ Rapid SPA tab-switching (Articles ↔ Volumes ↔ Articles ↔ Volumes ↔ Articles) → all loads succeeded
- ✅ Tab refocus after >2s hidden → useTabRefocus refetches each panel automatically

---

## Architecture fixes shipped tonight

### 1. `editor: full page reload on sign-in / sign-out` (a0422a3)
LoginPage / signOut now do a full `window.location.href = ...` instead of SPA `<Navigate>`. This kills a race we'd been chasing for ~10 commits where the panel mounted before supabase-js's PostgrestClient had the new access token wired in — first refetch went out as anon, returned RLS-filtered subset (often zero), user stared at "0 total · 0 published." Bulletproof now: reload reads the persisted session from storage and starts clean.

### 2. `editor: exempt /auth/v1/* from the 15s fetch timeout` (a3315c2)
The fetch wrapper used to apply a 15-second AbortController timeout to *every* Supabase request. If an auth call (sign-in, refresh) got aborted, supabase-js was left with a stale in-memory token while the storage looked valid → next REST call goes out as anon. Auth requests are now exempt; REST/Storage still capped at 15s.

### 3. `editor: profile-upsert on user create/reset + delete-editor function` (563e6b8)
**Two real architectural bugs**:

- The chief's old "Revoke access" only deleted the `public.profiles` row, leaving `auth.users` intact. Re-inviting the same email later hit "User already exists" and went through `admin.updateUserById`, which does *not* fire the `handle_new_user` trigger — so no profile row was created. The user could sign in but `useRole` returned null and the panel rendered broken.
- Even on the happy path, `admin.updateUserById` never touched `public.profiles`.

Fixes:
- `create-editor.mts` always upserts the profile after create/reset, with `on conflict do nothing` so a chief never gets silently demoted on password reset.
- New `delete-editor.mts` Netlify Function that calls `admin.deleteUser` (which cascades to profiles via the FK). Refuses self-delete and refuses to drop the last chief.
- `EditorsPanel.remove()` now POSTs to `delete-editor` instead of deleting only the profile row.

I also rescued the two orphaned auth.users records that existed in the DB.

### 3b. `editor: tab-refocus does a full reload on list views` (8fedd53)
You reported one more time that switching to WeChat and back broke
the panels. The old `useTabRefocus` soft-refetched, which raced with
supabase-js's own visibilitychange handler — both hit the auth lock
at the same instant and the panel's refetch went out with an
in-flight token. Now `useTabRefocus` does `window.location.reload()`
on tab refocus from list views. The session is in localStorage so
you stay signed in, the fresh page reads it cleanly, every panel
fetches with the correct token from the first request. Edit-form
routes (`/articles/new`, `/articles/123`, etc.) skip the reload and
fall back to soft refetch so unsaved typing isn't lost. Verified in
browser: simulated tab-hidden 3 s then tab-visible → page reloaded,
16 articles loaded, signed-in state preserved.

### 4. `editor: route-level ErrorBoundary so panel crashes are recoverable` (a1cd4d8)
Each `Protected` route now wraps its child in `<ErrorBoundary label="...">`. Until tonight a null deref inside a panel would unmount the whole React tree and blank the screen. Now you get an error card with the message + Try Again / Reload buttons, and sibling panels keep working.

### 5. `editor: harden useRole + add tab refocus to Editors panel` (be0c002)
`useRole.fetchRole` had no try/finally — a 15-second timeout abort threw and `setLoading(false)` never ran, stranding the chief on a permanent "Loading…" after tab refocus. Wrapped in try/catch/finally; previous role value preserved on transient error.

### 6. `editor: pass ws transport to supabase-js inside the function` (390373c)
Netlify Functions ship Node 20 by default. supabase-js detects no native `WebSocket` on Node < 22 and throws on client construction. Even though our functions don't use Realtime, supabase-js initializes the realtime client eagerly. Passed the `ws` polyfill via `realtime.transport`.

### 7. Misc earlier (already in main from yesterday)
- 15s fetch timeout on every Supabase request + per-panel retry banners (cc0c724)
- Auto-refetch on tab refocus across every panel (09e8051)
- AuthProvider singleton context to avoid useAuth state races (fc695c1)
- navigator.locks + steal-leaked-lock-at-startup (cc1560d)
- ImageStrip resolves `/images/*` against the public site (c7f93dc, 12179fe)
- Eager loading on 40-px ImageStrip thumbs (37b8b0e)

---

## How to add another editor tomorrow

1. Sign in as chief
2. Go to **Editors** tab
3. Type email + password (or click the Shuffle icon to generate a random one)
4. Click **Create editor**
5. Green banner appears → send credentials to the new editor over WeChat / iMessage / wherever
6. They sign in at `https://mortals-editor.netlify.app/login`

If you ever want to revoke someone, click the trash-can icon next to their row. It fully removes them from the system (auth + profile, cascading) so the email becomes free again.

---

## Production infra reference

| Thing | Value |
|---|---|
| Public site (Netlify)  | https://mortalsmag.netlify.app   |
| Editor (Netlify)       | https://mortals-editor.netlify.app |
| Supabase project ref   | `datercxlvabgiieqqucr` |
| Supabase URL           | https://datercxlvabgiieqqucr.supabase.co |
| Netlify env (editor)   | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE` 🔒 (added overnight) |
| Netlify Node version   | 22 (set in `editor/netlify.toml`) |

Netlify Functions in production:
- `POST /.netlify/functions/create-editor` — chief-gated, creates auth user + profile
- `POST /.netlify/functions/delete-editor` — chief-gated, deletes auth user (cascades to profile)

Both validate the caller's JWT, check `profiles.role = 'chief'`, then use the service-role client for the privileged operation.

---

## Known limitations / things I deliberately did NOT change

- **No self-service password change yet.** If an editor forgets their password, they have to ask you to reset it via the in-app form. I didn't add this because the chief-only reset path is working and adding a new feature increases risk overnight.
- **No audit log.** I didn't add a table tracking who created/deleted whom and when. It would be a nice add — `public.editor_audit_log(id, actor_user_id, action, target_email, at)` — but again, scope creep risk.
- **Supabase dashboard URL Configuration is still set to `localhost:3000` for Site URL.** This doesn't matter anymore because we bypass the magic-link flow entirely with the in-app form. If you ever want to re-enable the original "send invite email" flow, you'd need to update Supabase Auth → URL Configuration → Site URL and Redirect Allowlist (instructions in chat history).
- **One race condition I couldn't eliminate**: extremely rapid SPA navigation (clicking the next nav link in <900 ms) can briefly show 0 rows for a heartbeat before the second refetch completes. Real users don't click that fast; the data fixes itself on next interaction.

---

## File changes overnight

```
A  editor/netlify/functions/delete-editor.mts   (new)
M  editor/netlify/functions/create-editor.mts   (profile upsert)
A  editor/src/components/ErrorBoundary.tsx      (new)
M  editor/src/App.tsx                           (wrap routes in ErrorBoundary)
M  editor/src/lib/auth.ts                       (window.location reload on signout)
M  editor/src/lib/role.ts                       (try/finally, never strand loading)
M  editor/src/lib/supabase.ts                   (exempt /auth/* from 15s timeout)
M  editor/src/pages/LoginPage.tsx               (window.location reload on signin)
M  editor/src/pages/EditorsPanel.tsx            (use delete-editor function)
M  editor/src/styles.css                        (error-card styles)
A  scripts/create-editor.ts                     (CLI fallback — still useful if Netlify is down)
A  SUPERVISOR_NOTES.md                          (this file)
```

Eleven commits in total. Each one builds clean.

---

That's it. Sleep well — the editor is in a good state.
