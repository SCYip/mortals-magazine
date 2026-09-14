import { useEffect, useRef } from 'react'

/**
 * Re-fires `refetch` when the page regains focus after being away for
 * more than `minHiddenMs` (default 2000). Listens to BOTH
 * `visibilitychange` (tab switch / browser minimize) and
 * `window.focus`/`blur` (cross-app: alt-tab to WeChat etc.).
 *
 * Token freshness is NOT handled here and not in supabase.ts either (a
 * focus-driven refresh used to live there and was removed — it raced
 * supabase-js's own refresh). Every panel's `refetch` goes through
 * `runQuery` in query.ts, which refreshes a near-expiry token and
 * unsticks a hung auth lock before the request goes out. That is what
 * makes firing `refetch()` immediately on refocus safe.
 */
export function useTabRefocus(refetch: () => void, minHiddenMs = 2000) {
  const cb = useRef(refetch)
  useEffect(() => { cb.current = refetch })

  useEffect(() => {
    let hiddenAt: number | null = null

    const onHide = () => {
      if (hiddenAt === null) hiddenAt = Date.now()
    }
    const onShow = () => {
      if (hiddenAt === null) return
      const elapsed = Date.now() - hiddenAt
      hiddenAt = null
      if (elapsed < minHiddenMs) return
      cb.current()
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') onHide()
      else if (document.visibilityState === 'visible') onShow()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onHide)
    window.addEventListener('focus', onShow)
    window.addEventListener('pageshow', onShow)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onHide)
      window.removeEventListener('focus', onShow)
      window.removeEventListener('pageshow', onShow)
    }
  }, [minHiddenMs])
}
