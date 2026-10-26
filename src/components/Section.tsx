import { useEffect, useRef, type ReactNode } from 'react'
import { subscribe } from '@/lib/raf'
import { progress } from '@/hooks/useScrollProgress'
import { sectionOpacity } from '@/lib/math'

type Props = {
  start: number
  end: number
  className?: string
  children: ReactNode
  label?: string
}

const REVEAL_AT = 0.3

/**
 * A text section pinned inside the sticky layer. Opacity is driven per frame from scroll
 * progress and written directly to the DOM. Crossing 0.3 toggles `data-revealed`, which
 * triggers the CSS stagger of its <Stagger> children. Fully hidden sections get
 * `visibility: hidden` so their controls drop out of the tab order.
 */
export function Section({ start, end, className = '', children, label }: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let lastO = -1
    let revealed = start <= 0
    return subscribe(() => {
      const o = sectionOpacity(progress.p, start, end)
      if (o === lastO) return
      lastO = o
      el.style.opacity = String(o)
      el.style.visibility = o > 0.001 ? 'visible' : 'hidden'
      const next = o > REVEAL_AT
      if (next !== revealed) {
        revealed = next
        el.dataset.revealed = String(next)
        // Hand the initial CSS keyframe reveal over to the scroll-driven transitions.
        delete el.dataset.initial
      }
    })
  }, [start, end])

  return (
    <section
      ref={ref}
      aria-label={label}
      // A section visible at p = 0 reveals with a CSS keyframe on first paint, without waiting
      // for JS animation frames, so the hero text (LCP) paints as early as possible.
      data-revealed={start <= 0 ? 'true' : 'false'}
      data-initial={start <= 0 ? 'true' : undefined}
      className={`absolute inset-0 ${className}`}
      style={{ opacity: start <= 0 ? 1 : 0, visibility: start <= 0 ? 'visible' : 'hidden' }}
    >
      {children}
    </section>
  )
}
