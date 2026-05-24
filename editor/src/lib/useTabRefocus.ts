import { useEffect, useRef } from 'react'

/**
 * Reload-on-refocus for list views; soft refetch for edit forms.
 *
 * The previous implementation called `refetch` directly when the tab
 * became visible again, but that races with supabase-js's own
 * `_onVisibilityChanged` handler — when both fire at once, refetch can
 * go out with an in-flight refresh token and either return zero rows
 * or stall waiting on the auth lock. The user sees the panel "stop
 * loading" after coming back from another window.
 *
 * For list views the bulletproof answer is a full `window.location
 * .reload()`: the session is persisted in localStorage so the user
 * stays signed in, and the reloaded page fetches every panel cleanly.
 *
 * Edit forms (URLs like `/articles/new` or `/articles/123`,
 * `/volumes/new`, etc.) preserve unsaved typing by falling back to
 * the soft refetch instead — same behaviour as before.
 */
export function useTabRefocus(refetch: () => void, minHiddenMs = 2000) {
  const cb = useRef(refetch)
  useEffect(() => { cb.current = refetch })

  useEffect(() => {
    let hiddenAt: number | null = null
    const onChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
        return
      }
      if (document.visibilityState === 'visible' && hiddenAt !== null) {
        const elapsed = Date.now() - hiddenAt
        hiddenAt = null
        if (elapsed < minHiddenMs) return
        // Edit-form routes look like /<panel>/new or /<panel>/<id>.
        // Anything matching that pattern stays on the soft-refetch
        // path so we don't blow away unsaved input.
        const path = window.location.pathname
        const isEditRoute = /\/(new|\d+)(\/|$)/.test(path)
        if (isEditRoute) {
          cb.current()
        } else {
          window.location.reload()
        }
      }
    }
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [minHiddenMs])
}
