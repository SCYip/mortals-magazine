import { supabase, unstickAuthLock } from './supabase'

/**
 * Run a PostgREST query in a way that cannot silently hang or go out with
 * a dead token.
 *
 * Why this exists: every panel used to call `supabase.from(...).select()`
 * directly, and "sometimes the panel never loads until I refresh" was the
 * result. Two things were happening, neither of which the panels could
 * see:
 *
 *   1. The tab sat in the background for over an hour, the JWT expired,
 *      and useTabRefocus fired a refetch the instant the tab came back —
 *      before supabase-js had refreshed the token. The request went out
 *      with an expired JWT and came back empty or 401.
 *   2. `supabase.auth.getSession()` waited on a navigator.locks lock that
 *      a previous tab never released. Nothing ever resolved, the panel
 *      stayed on "Loading…" forever, and a reload fixed it only because
 *      module load steals stale locks (see supabase.ts).
 *
 * This wraps the *call site* rather than supabase-js itself. supabase.ts
 * carries a hard-won warning against intercepting fetch or managing locks
 * inside the client; everything here happens outside it and is plain
 * await-with-timeout-and-retry.
 */

const QUERY_TIMEOUT_MS = 10_000
const SESSION_TIMEOUT_MS = 6_000
// Refresh proactively if the token would expire within this window — a
// token that's valid now but dies mid-request is still a failed request.
const EXPIRY_MARGIN_S = 60

export class QueryTimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`${label} timed out after ${ms}ms`)
    this.name = 'QueryTimeoutError'
  }
}

function withTimeout<T>(p: PromiseLike<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new QueryTimeoutError(label, ms)), ms)
    Promise.resolve(p).then(
      v => { clearTimeout(t); resolve(v) },
      e => { clearTimeout(t); reject(e) },
    )
  })
}

/** PostgREST's ways of saying "your token is no good". */
function isAuthError(err: { code?: string; message?: string; status?: number } | null): boolean {
  if (!err) return false
  if (err.status === 401) return true
  if (err.code && /^PGRST30[0-9]$/.test(err.code)) return true   // JWT family
  return /jwt|expired|invalid token|not authenticated/i.test(err.message ?? '')
}

/**
 * Make sure the client holds a token that will outlive the request.
 * Throws QueryTimeoutError if getSession() hangs, after one attempt to
 * unstick the auth lock.
 */
export async function ensureFreshSession(): Promise<void> {
  let sessionRes
  try {
    sessionRes = await withTimeout(supabase.auth.getSession(), SESSION_TIMEOUT_MS, 'getSession')
  } catch (err) {
    if (!(err instanceof QueryTimeoutError)) throw err
    // The classic symptom of a stuck lock. Steal it and try exactly once more.
    const stole = await unstickAuthLock('getSession timed out')
    if (!stole) throw err
    sessionRes = await withTimeout(supabase.auth.getSession(), SESSION_TIMEOUT_MS, 'getSession (after unstick)')
  }
  const session = sessionRes.data.session
  if (!session) throw new Error('Not signed in')

  const secondsLeft = (session.expires_at ?? 0) - Math.floor(Date.now() / 1000)
  if (secondsLeft < EXPIRY_MARGIN_S) {
    const { error } = await withTimeout(supabase.auth.refreshSession(), SESSION_TIMEOUT_MS, 'refreshSession')
    if (error) throw error
  }
}

/**
 * Same hang-proof session acquisition as ensureFreshSession, for the
 * places that need the raw token — the edge-function calls that manage
 * editors, which used to `await supabase.auth.getSession()` directly and
 * so hung on the same stuck lock as everything else.
 */
export async function getFreshAccessToken(): Promise<string> {
  await ensureFreshSession()
  const { data } = await withTimeout(supabase.auth.getSession(), SESSION_TIMEOUT_MS, 'getSession')
  const token = data.session?.access_token
  if (!token) throw new Error('Not signed in')
  return token
}

/** The shape every supabase-js query response shares. */
type AnyResult = { data: unknown; error: { code?: string; message: string; status?: number } | null }

export async function runQuery<R extends AnyResult>(build: () => PromiseLike<R>): Promise<R> {
  const attempt = async (): Promise<R> => {
    await ensureFreshSession()
    return withTimeout(build(), QUERY_TIMEOUT_MS, 'query')
  }

  let first: R
  try {
    first = await attempt()
  } catch (err) {
    console.warn('[query] first attempt failed, retrying once:', (err as Error)?.message ?? err)
    return attempt()
  }

  if (first.error && isAuthError(first.error)) {
    // The token looked fine to ensureFreshSession but the server disagreed
    // (clock skew, revoked, etc.). Force a refresh and go again.
    console.warn('[query] auth error from server, refreshing and retrying:', first.error.message)
    const { error: refreshErr } = await withTimeout(supabase.auth.refreshSession(), SESSION_TIMEOUT_MS, 'refreshSession')
    if (refreshErr) return first
    return withTimeout(build(), QUERY_TIMEOUT_MS, 'query (after refresh)')
  }
  return first
}
