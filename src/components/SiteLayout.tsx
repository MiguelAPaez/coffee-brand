import { useEffect, useState, type ReactNode } from 'react'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'

/** Approximate header height: the light band counts as "under the header" until it scrolls past this line. */
const HEADER_PX = 80

/** True once the [data-page-hero] band has scrolled up under the header, so the navbar flips to cream. */
function usePastHero(): boolean {
  const [past, setPast] = useState(false)
  useEffect(() => {
    const hero = document.querySelector('[data-page-hero]')
    if (!hero || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setPast(!entry.isIntersecting), {
      rootMargin: `-${HEADER_PX}px 0px 0px 0px`,
    })
    io.observe(hero)
    return () => io.disconnect()
  }, [])
  return past
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const pastHero = usePastHero()
  return (
    <div className="bg-scene text-cream">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30">
        <Navbar position="fixed" dark={pastHero} />
      </div>
      <main id="main">{children}</main>
      <Footer />
    </div>
  )
}
