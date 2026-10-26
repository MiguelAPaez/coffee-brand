import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation } from 'wouter'
import { markNavigated } from '@/lib/nav'

const memory = new Map<string, number>()

export function saveScroll(key: string, y: number): void {
  memory.set(key, y)
}

/** Returns the saved position once, then forgets it. */
export function takeScroll(key: string): number | null {
  const y = memory.get(key)
  memory.delete(key)
  return y ?? null
}

const MAX_FRAMES = 20

/**
 * Per-pathname scroll memory: Back/Forward restores where you were, a new navigation starts at the top.
 */
export function useScrollRestoration(): void {
  const [path] = useLocation()
  const prev = useRef<string | null>(null)
  const y = useRef(0)
  const pushed = useRef(false)

  useEffect(() => {
    const prior = history.scrollRestoration
    history.scrollRestoration = 'manual'
    const { pushState, replaceState } = history
    // Read scrollY at the moment of a push: once the route commits, the incoming page may already
    // have clamped it. Any location change without a push/replace is a Back/Forward traversal.
    // A same-path push/replace (current page's nav link, query/state updates) changes no route, so it is
    // ignored. A path-changing replaceState is intentionally treated as a push (a redirect scrolls to top).
    const record = (url: unknown) => {
      if (new URL(String(url ?? location.href), location.href).pathname === location.pathname) return
      y.current = window.scrollY
      pushed.current = true
    }
    history.pushState = function (...args) {
      record(args[2])
      return pushState.apply(this, args)
    }
    history.replaceState = function (...args) {
      record(args[2])
      return replaceState.apply(this, args)
    }
    // Traversals re-render before the next frame, so the last scroll event is still the page being left.
    const onScroll = () => {
      y.current = window.scrollY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      history.scrollRestoration = prior
      history.pushState = pushState
      history.replaceState = replaceState
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useLayoutEffect(() => {
    const from = prev.current
    prev.current = path
    if (from === null || from === path) {
      pushed.current = false
      return
    }
    markNavigated()
    saveScroll(from, y.current)
    const back = !pushed.current
    pushed.current = false
    const target = back ? takeScroll(path) : null
    if (!target) {
      window.scrollTo(0, 0)
      return
    }
    // Wait a frame for the page to mount, then until the document is tall enough to scroll that far.
    let raf = 0
    let frames = 0
    const restore = () => {
      const room = document.documentElement.scrollHeight - window.innerHeight
      if (room >= target || ++frames >= MAX_FRAMES) {
        window.scrollTo(0, target)
      } else raf = requestAnimationFrame(restore)
    }
    raf = requestAnimationFrame(restore)
    return () => cancelAnimationFrame(raf)
  }, [path])
}
