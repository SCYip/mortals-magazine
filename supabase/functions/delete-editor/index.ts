import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { CORS, json, adminClient, requireChief } from '../_shared/lib.ts'

/**
 * POST /functions/v1/delete-editor
 * Body:    { user_id: string }
 * Headers: Authorization: Bearer <chief's supabase access token>
 *
 * Fully removes an editor by deleting from auth.users, which cascades to
 * profiles. Refuses self-delete and refuses to remove the last chief, so
 * nobody can lock the panel with no one able to sign in.
 *
 * Deleting only the profile row would orphan the auth.users record, and a
 * later re-invite of the same email would then hit "already exists" without
 * the profile trigger re-firing — hence the full delete.
 */
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  const caller = await requireChief(req)
  if (caller instanceof Response) return caller

  let body: { user_id?: unknown }
  try { body = await req.json() } catch { return json(400, { error: 'Body must be JSON' }) }
  const targetId = String(body.user_id ?? '').trim()
  if (!targetId) return json(400, { error: 'Missing user_id' })

  if (targetId === caller.userId) {
    return json(400, { error: "You can't delete your own account from here. Sign out first or have another chief delete you." })
  }

  const admin = adminClient()
  const { data: target, error: tgtErr } = await admin
    .from('profiles').select('role,email').eq('user_id', targetId).maybeSingle()
  if (tgtErr) return json(500, { error: tgtErr.message })
  if (target?.role === 'chief') {
    const { count } = await admin
      .from('profiles').select('user_id', { count: 'exact', head: true }).eq('role', 'chief')
    if ((count ?? 0) <= 1) {
      return json(400, { error: 'Cannot delete the last chief. Promote another editor to chief first.' })
    }
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(targetId)
  if (delErr) return json(500, { error: delErr.message })

  return json(200, { ok: true, deleted_user_id: targetId })
})
