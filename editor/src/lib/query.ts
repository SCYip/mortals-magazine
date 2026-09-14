import { supabase, supabaseAuth, readStoredSession, AUTH_FETCH_TIMEOUT_MS } from './supabase'

/**
 * Run a PostgREST query in a way that cannot silently hang or go out with
 * a dead token.
 *
 * Why this exists: every panel used to call `supabase.from(...).select()`
 * directly, and "sometimes the panel never loads until I refresh" was the
 * result. The mechanism, confirmed against supabase-js source and
 * reproduced in a test: a token refresh that stalls on the network leaves
 * the auth client's internal queue wedged, and every `getSession()` —
 * which the data client used to call before each request — waited behind
 * it forever.
 *
 * Two things fix that, and this file is the second:
 *   1. supabase.ts gives the data client its own token source (storage),
 *      so a read never enters the auth queue at all; and bounds auth
 *      requests so a stalled refresh fails and the queue drains.
 *   2. Here, each read gets a hard timeout and a single retry, and an
 *      auth error from the server triggers one bounded refresh before
 *      that retry. Nothing here blocks on the auth queue up front.
 */

const QUERY_TIMEOUT_MS = 15_000
// A refresh request is aborted at AUTH_FETCH_TIMEOUT_MS; give the promise a
// little longer than that to settle before we stop waiting on it.
const REFRESH_WAIT_MS = AUTH_FETCH_TIMEOUT_MS + 3_000
// Refresh proactively if the stored token dies within this window — a
// token that's valid now but expires mid-request is still a failed request.
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

const secondsLeft = (expiresAt: number | undefined) =>
  (expiresAt ?? 0) - Math.floor(Date.now() / 1000)

/**
 * Ask the auth client for a new token, but never wait on it for longer
 * than the auth deadline allows. Failure is logged, not thrown: the caller
 * retries with whatever is in storage and lets the server be the judge.
 */
async function refreshBounded(reason: string): Promise<void> {
  try {
    const { error } = await withTimeout(supabaseAuth.auth.refreshSession(), REFRESH_WAIT_MS, 'refreshSession')
    if (error) console.warn(`[query] refresh (${reason}) failed:`, error.message)
  } catch (err) {
    console.warn(`[query] refresh (${reason}) did not settle:`, (err as Error)?.message ?? err)
  }
}

/**
 * The access token for a direct call (the editor-management edge
 * functions). Comes from storage — instantly — unless it has expired or
 * is about to, in which case one bounded refresh is attempted first.
 */
export async function getFreshAccessToken(): Promise<string> {
  const stored = readStoredSession()
  if (stored?.access_token && secondsLeft(stored.expires_at) > EXPIRY_MARGIN_S) return stored.access_token
  await refreshBounded(stored ? 'token near expiry' : 'no stored session')
  const after = readStoredSession()
  if (!after?.access_token) throw new Error('Not signed in')
  return after.access_token
}

/** The shape every supabase-js query response shares. */
type AnyResult = { data: unknown; error: { code?: string; message: string; status?: number } | null }

/**
 * Run `build()` — which must construct a *fresh* query each call, since a
 * PostgrestBuilder can't be safely awaited twice — with a hard timeout and
 * one retry, refreshing the token first only when it is already dead.
 *
 * Resolves with the usual `{ data, error }` so call sites keep their
 * existing `if (error) throw error` shape. Rejects only when both attempts
 * fail, so a panel shows its error/Retry state instead of an indefinite
 * spinner.
 */
export async function runQuery<R extends AnyResult>(build: () => PromiseLike<R>): Promise<R> {
  // Don't bother the server with a token we already know is expired.
  const stored = readStoredSession()
  if (stored && secondsLeft(stored.expires_at) <= 0) await refreshBounded('stored token expired')

  const attempt = (): Promise<R> => withTimeout(build(), QUERY_TIMEOUT_MS, 'query')

  let first: R
  try {
    first = await attempt()
  } catch (err) {
    console.warn('[query] first attempt failed, retrying once:', (err as Error)?.message ?? err)
    return attempt()
  }

  if (first.error && isAuthError(first.error)) {
    console.warn('[query] auth error from server, refreshing and retrying:', first.error.message)
    await refreshBounded('server rejected token')
    return attempt()
  }
  return first
}
