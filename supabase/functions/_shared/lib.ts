import { createClient } from 'npm:@supabase/supabase-js@2'

/**
 * Shared plumbing for the editor-management functions.
 *
 * These moved here from Netlify Functions when the site left Netlify. The
 * important difference: on Netlify they were same-origin (/.netlify/...),
 * so the browser never sent a CORS preflight. Now they live on
 * *.supabase.co while the editor panel lives elsewhere, so every response
 * must carry CORS headers and OPTIONS must be answered.
 *
 * CORS is deliberately `*`. It is not the security boundary here — the
 * bearer token is. Nothing cookie-based is involved, so there's no CSRF
 * surface for an open origin to widen.
 */
export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...CORS },
  })

// Supabase injects these into every Edge Function. No secret to configure.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

export const adminClient = () =>
  createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

/**
 * Resolve the caller from their bearer token and confirm they're the chief.
 * Returns the caller's user id, or a ready-to-send error Response.
 */
export async function requireChief(req: Request): Promise<{ userId: string } | Response> {
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.replace(/^Bearer\s+/i, '').trim()
  if (!token) return json(401, { error: 'Missing Authorization header' })

  const anon = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: userData, error: userErr } = await anon.auth.getUser(token)
  if (userErr || !userData?.user) return json(401, { error: 'Invalid token' })

  const { data: profile, error: profileErr } = await adminClient()
    .from('profiles')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (profileErr) return json(500, { error: profileErr.message })
  if (profile?.role !== 'chief') {
    return json(403, { error: 'Only the editor-in-chief can manage editors' })
  }
  return { userId: userData.user.id }
}
