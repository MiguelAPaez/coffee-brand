import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { prefersReducedMotion } from '@/hooks/useMedia'

type Props = {
  as?: ElementType
  className?: string
  children: ReactNode
}

const canObserve = () => typeof IntersectionObserver !== 'undefined'

/** Reveals its <Stagger> children once 15% is in view, for content outside a scroll-driven <Section>. */
export function Reveal({ as: Tag = 'div', className, children }: Props) {
  const ref = useRef<HTMLElement>(null)
  // Reduced motion or no IntersectionObserver: never hide the content in the first place.
  const [revealed, setRevealed] = useState(() => prefersReducedMotion() || !canObserve())

  useEffect(() => {
    const el = ref.current
    if (revealed || !el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true)
          io.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [revealed])

  return (
    <Tag ref={ref} className={className} data-revealed={String(revealed)}>
      {children}
    </Tag>
  )
}
