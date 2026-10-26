import { useEffect, useRef, useState, type RefObject } from 'react'
import { clamp } from '@/lib/math'
import { subscribe } from '@/lib/raf'

/**
 * Shared, mutable progress store. Written once per animation frame; read by anything
 * that needs per-frame values (video scrub, 3D scene, section opacities) without React renders.
 */
export const progress = { p: 0 }

/**
 * Tracks p = scrollY / (track height - viewport height) for the given scroll track.
 * Writes p into `progress.p` and the `--p` CSS variable on <html> every frame.
 */
export function useScrollProgress(trackRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    let scrollable = 1

    const measure = () => {
      const vh = window.visualViewport?.height ?? window.innerHeight
      scrollable = Math.max(1, el.offsetHeight - Math.min(vh, window.innerHeight))
    }
    measure()

    const vv = window.visualViewport
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    vv?.addEventListener('resize', measure)
    const ro = new ResizeObserver(measure)
    ro.observe(el)

    const root = document.documentElement.style
    let lastP = -1
    const unsub = subscribe(() => {
      const p = clamp(window.scrollY / scrollable)
      progress.p = p
      if (p !== lastP) {
        root.setProperty('--p', p.toFixed(4))
        lastP = p
      }
    })

    return () => {
      unsub()
      // Leaving Home must not leave a stale mid-descent state for other pages.
      progress.p = 0
      root.removeProperty('--p')
      ro.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
      vv?.removeEventListener('resize', measure)
    }
  }, [trackRef])
}

/**
 * React state that only changes when p crosses `threshold`. Use for coarse,
 * discrete UI changes (color flips, mounting) — never for per-frame values.
 */
export function useProgressAbove(threshold: number): boolean {
  const [above, setAbove] = useState(false)
  const cur = useRef(false)
  useEffect(
    () =>
      subscribe(() => {
        const next = progress.p > threshold
        if (next !== cur.current) {
          cur.current = next
          setAbove(next)
        }
      }),
    [threshold],
  )
  return above
}
