/**
 * The single requestAnimationFrame loop that drives every per-frame value on the page.
 * Subscribers receive dt in seconds (clamped to 0.1). The loop stops while the tab is hidden.
 */
type Tick = (dt: number, now: number) => void

const subs = new Set<Tick>()
let rafId = 0
let last = 0

function frame(now: number) {
  const dt = Math.min(0.1, last ? (now - last) / 1000 : 0)
  last = now
  subs.forEach((fn) => fn(dt, now))
  rafId = requestAnimationFrame(frame)
}

function start() {
  if (rafId || document.hidden) return
  last = 0
  rafId = requestAnimationFrame(frame)
}

function stop() {
  cancelAnimationFrame(rafId)
  rafId = 0
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : subs.size && start()))
}

export function subscribe(fn: Tick): () => void {
  subs.add(fn)
  start()
  return () => {
    subs.delete(fn)
    if (!subs.size) stop()
  }
}
