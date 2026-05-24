import { useEffect, useRef } from 'react'

/**
 * Reload-on-refocus for list views; soft refetch for edit forms.
 *
 * Why both visibilitychange AND focus/blur:
 *
 *   - `visibilitychange` fires when the BROWSER TAB toggles hidden /
 *     visible (e.g. user switches Chrome tabs, or minimizes the Chrome
 *     window). It does NOT fire when the user alt-tabs to a different
 *     app like WeChat — the editor tab is still "visible" as far as
 *     Chrome is concerned, only the Chrome window has lost focus.
 *
 *   - `window.blur` / `window.focus` cover the cross-app case. When
 *     you switch to WeChat the editor window loses focus (blur); when
 *     you come back to Chrome it regains focus.
 *
 * We track ANY blur-like event ("hide") and ANY focus-like event
 * ("show"), record the timestamp the page went away, and on return
 * reload the page if it was away for `minHiddenMs` or more. Edit-form
 * routes skip the reload so unsaved input isn't lost.
 */
export function useTabRefocus(refetch: () => void, minHiddenMs = 2000) {
  const cb = useRef(refetch)
  useEffect(() => { cb.current = refetch })

  useEffect(() => {
    let hiddenAt: number | null = null
    let reloading = false

    const onHide = () => {
      // Only record the first hide event in a sequence.
      if (hiddenAt === null) hiddenAt = Date.now()
    }
    const onShow = () => {
      if (reloading) return
      if (hiddenAt === null) return
      const elapsed = Date.now() - hiddenAt
      hiddenAt = null
      if (elapsed < minHiddenMs) return
      const path = window.location.pathname
      const isEditRoute = /\/(new|\d+)(\/|$)/.test(path)
      if (isEditRoute) {
        cb.current()
      } else {
        reloading = true
        // setTimeout(0) so the user sees one frame of the focused
        // editor before it reloads — feels less jarring than the page
        // tearing apart at the same moment they clicked back into it.
        setTimeout(() => window.location.reload(), 0)
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') onHide()
      else if (document.visibilityState === 'visible') onShow()
    }
    const onBlur = () => onHide()
    const onFocus = () => onShow()
    // pageshow fires on bfcache restore (Safari "back" button etc.);
    // treat that as a fresh visible event so we still reload if the
    // page was tucked away for a while.
    const onPageShow = () => onShow()

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [minHiddenMs])
}
