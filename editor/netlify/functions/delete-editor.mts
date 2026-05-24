import type { Context } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

/**
 * POST /.netlify/functions/delete-editor
 * Body: { user_id: string }
 * Headers: Authorization: Bearer <chief's supabase access token>
 *
 * Fully removes an editor: deletes from auth.users (which cascades to
 * profiles via the foreign key). Refuses to delete the last remaining
 * chief, and refuses self-delete (avoid locking yourself out).
 *
 * Why this exists: deleting only the profile row leaves an orphaned
 * auth.users record, so re-inviting the same email later hits "User
 * already exists" and admin.updateUserById doesn't refire the
 * handle_new_user trigger.
 */

const SUPABASE_URL = Netlify.env.get('VITE_SUPABASE_URL') ?? Netlify.env.get('SUPABASE_URL')
const ANON_KEY    = Netlify.env.get('VITE_SUPABASE_ANON_KEY') ?? Netlify.env.get('SUPABASE_ANON_KEY')
const SERVICE_ROLE = Netlify.env.get('SUPABASE_SERVICE_ROLE')

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

export default async (req: Request, _ctx: Context): Promise<Response> => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })
  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE) {
    return json(500, { error: 'Server misconfigured: missing Supabase env' })
  }
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.replace(/^Bearer\s+/i, '').trim()
  if (!token) return json(401, { error: 'Missing Authorization header' })

  const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws as any },
  })
  const { data: userData, error: userErr } = await anonClient.auth.getUser(token)
  if (userErr || !userData?.user) return json(401, { error: 'Invalid token' })

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws as any },
  })

  // Caller must be chief.
  const { data: callerProfile, error: callerErr } = await adminClient
    .from('profiles').select('role').eq('user_id', userData.user.id).maybeSingle()
  if (callerErr) return json(500, { error: callerErr.message })
  if (callerProfile?.role !== 'chief') return json(403, { error: 'Only the editor-in-chief can delete editors' })

  let body: { user_id?: unknown }
  try { body = await req.json() } catch { return json(400, { error: 'Body must be JSON' }) }
  const targetId = String(body.user_id ?? '').trim()
  if (!targetId) return json(400, { error: 'Missing user_id' })

  // Refuse self-delete.
  if (targetId === userData.user.id) {
    return json(400, { error: "You can't delete your own account from here. Sign out first or have another chief delete you." })
  }

  // Refuse deleting the last chief.
  const { data: target, error: tgtErr } = await adminClient
    .from('profiles').select('role,email').eq('user_id', targetId).maybeSingle()
  if (tgtErr) return json(500, { error: tgtErr.message })
  if (target?.role === 'chief') {
    const { count } = await adminClient
      .from('profiles').select('user_id', { count: 'exact', head: true }).eq('role', 'chief')
    if ((count ?? 0) <= 1) {
      return json(400, { error: 'Cannot delete the last chief. Promote another editor to chief first.' })
    }
  }

  // Delete from auth.users — cascade removes the profile row too.
  const { error: delErr } = await adminClient.auth.admin.deleteUser(targetId)
  if (delErr) return json(500, { error: delErr.message })

  return json(200, { ok: true, deleted_user_id: targetId })
}
