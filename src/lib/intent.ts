/**
 * Resolves on the visitor's first sign of intent to move through the page (scroll, wheel,
 * touch, pointer or key). Heavy, non-critical work (frame bank decode, 3D chunk) waits for this
 * so it never competes with the first render.
 */
const EVENTS = ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown'] as const

let promise: Promise<void> | null = null

export function firstIntent(): Promise<void> {
  if (promise) return promise
  promise = new Promise<void>((resolve) => {
    if (window.scrollY > 0) return resolve()
    const done = () => {
      EVENTS.forEach((e) => window.removeEventListener(e, done))
      resolve()
    }
    EVENTS.forEach((e) => window.addEventListener(e, done, { passive: true, once: true }))
  })
  return promise
}
