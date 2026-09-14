import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { CORS, json, adminClient, requireChief } from '../_shared/lib.ts'

/**
 * POST /functions/v1/create-editor
 * Body:    { email: string, password: string }
 * Headers: Authorization: Bearer <chief's supabase access token>
 *
 * Creates a new editor account, or resets an existing one's password
 * (idempotent — handy when a half-finished invite left a stub user).
 * Only a chief may call it. The service-role key never reaches the browser.
 *
 * On a fresh create the auth.users INSERT fires `handle_new_user`, which
 * creates the public.profiles row as role='editor'. On a password reset
 * that trigger doesn't fire, so we upsert the profile ourselves — with
 * ignoreDuplicates so a reset can never demote an existing chief.
 */
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  const caller = await requireChief(req)
  if (caller instanceof Response) return caller

  let body: { email?: unknown; password?: unknown }
  try { body = await req.json() } catch { return json(400, { error: 'Body must be JSON' }) }
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  if (!/.+@.+\..+/.test(email)) return json(400, { error: 'Invalid email' })
  if (password.length < 8) return json(400, { error: 'Password must be at least 8 characters' })

  const admin = adminClient()
  let userId: string | undefined
  let mode: 'created' | 'reset'

  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (!created.error) {
    userId = created.data.user?.id
    mode = 'created'
  } else if (!created.error.message.toLowerCase().includes('already')) {
    return json(500, { error: created.error.message })
  } else {
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
    if (listErr) return json(500, { error: listErr.message })
    const existing = list.users.find(u => u.email?.toLowerCase() === email)
    if (!existing) return json(500, { error: 'User exists but could not be located in listUsers' })
    const { data: updated, error: updateErr } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    })
    if (updateErr) return json(500, { error: updateErr.message })
    userId = updated.user?.id ?? existing.id
    mode = 'reset'
  }

  if (userId) {
    const { error: profileErr } = await admin
      .from('profiles')
      .upsert({ user_id: userId, email, role: 'editor' }, { onConflict: 'user_id', ignoreDuplicates: true })
    if (profileErr) return json(500, { error: `User saved but profile upsert failed: ${profileErr.message}` })
  }

  return json(200, { ok: true, mode, user_id: userId })
})
