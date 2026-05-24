import { useEffect, useRef } from 'react'

/**
 * Re-fires `refetch` whenever the tab becomes visible again after
 * having been hidden for more than `minHiddenMs` (default 2000).
 *
 * Chrome aggressively suspends background tabs — in-flight requests
 * can be killed, websockets can drop, and the auth session can drift.
 * The cheapest robust recovery is to just refetch the current view's
 * data the moment the tab refocuses. The minimum-hidden-ms guard
 * prevents spurious refetches when the user quickly alt-tabs.
 */
export function useTabRefocus(refetch: () => void, minHiddenMs = 2000) {
  // Always call the latest refetch closure without making the effect
  // re-run on every render.
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
        if (elapsed >= minHiddenMs) cb.current()
      }
    }
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [minHiddenMs])
}
