import type { Context } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /.netlify/functions/create-editor
 * Body: { email: string, password: string }
 * Headers: Authorization: Bearer <chief's supabase access token>
 *
 * Creates a new editor account (or resets an existing one's password)
 * using Supabase's Admin API. The service-role key never leaves this
 * function — the browser can't see it, so a malicious user can't
 * exfiltrate it from the bundle.
 *
 * Authorization:
 *   1. The caller's JWT is validated against Supabase Auth.
 *   2. The caller's user_id is looked up in public.profiles.
 *   3. The function refuses unless role = 'chief'.
 *
 * On success the auth.users INSERT fires the `handle_new_user` trigger
 * which creates the public.profiles row with role='editor'. The chief
 * can then promote the new editor from the Editors panel if needed.
 */

const SUPABASE_URL = Netlify.env.get('VITE_SUPABASE_URL') ?? Netlify.env.get('SUPABASE_URL')
const ANON_KEY    = Netlify.env.get('VITE_SUPABASE_ANON_KEY') ?? Netlify.env.get('SUPABASE_ANON_KEY')
const SERVICE_ROLE = Netlify.env.get('SUPABASE_SERVICE_ROLE')

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

export default async (req: Request, _ctx: Context): Promise<Response> => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE) {
    return json(500, {
      error: 'Server misconfigured: missing one of VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE in Netlify env.',
    })
  }

  // 1. Pull the caller's bearer token.
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.replace(/^Bearer\s+/i, '').trim()
  if (!token) return json(401, { error: 'Missing Authorization header' })

  // 2. Verify the token by asking Supabase Auth who the user is.
  const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: userData, error: userErr } = await anonClient.auth.getUser(token)
  if (userErr || !userData?.user) return json(401, { error: 'Invalid token' })

  // 3. Look up the caller's role via the service-role client (bypasses RLS).
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: profile, error: profileErr } = await adminClient
    .from('profiles')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (profileErr) return json(500, { error: profileErr.message })
  if (profile?.role !== 'chief') {
    return json(403, { error: 'Only the editor-in-chief can create editors' })
  }

  // 4. Validate input.
  let body: { email?: unknown; password?: unknown }
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Body must be JSON' })
  }
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  if (!/.+@.+\..+/.test(email)) return json(400, { error: 'Invalid email' })
  if (password.length < 8) return json(400, { error: 'Password must be at least 8 characters' })

  // 5. Create the user, or reset their password if the email is taken
  //    (idempotent — convenient when a previous half-completed invite
  //    left a stub user row).
  const created = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (!created.error) {
    return json(200, { ok: true, mode: 'created', user_id: created.data.user?.id })
  }
  if (!created.error.message.toLowerCase().includes('already')) {
    return json(500, { error: created.error.message })
  }

  // Existing user — find and update.
  const { data: list, error: listErr } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (listErr) return json(500, { error: listErr.message })
  const existing = list.users.find(u => u.email?.toLowerCase() === email)
  if (!existing) return json(500, { error: 'User exists but could not be located in listUsers' })
  const { data: updated, error: updateErr } = await adminClient.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  })
  if (updateErr) return json(500, { error: updateErr.message })
  return json(200, { ok: true, mode: 'reset', user_id: updated.user?.id })
}
