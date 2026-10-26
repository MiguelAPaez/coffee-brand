import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useLocation } from 'wouter'
import { MobileMenu } from '@/components/MobileMenu'
import { NAV } from '@/config'
import { useCart } from '@/hooks/useCart'
import { isCurrent } from '@/lib/nav'

type Props = { dark: boolean; position?: 'overlay' | 'fixed' }

export function Navbar({ dark, position = 'overlay' }: Props) {
  const [entered, setEntered] = useState(false)
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [pathname] = useLocation()
  const { count } = useCart()

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Entrance: slide down from -12px, delay i*80+100ms.
  const enterCls = `transition-[opacity,transform] duration-700 ease-expo ${
    entered ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
  }`
  const delay = (i: number): CSSProperties => ({ transitionDelay: `${i * 80 + 100}ms` })

  const color = dark ? 'text-cream' : 'text-ink'
  const border = dark ? 'border-cream/50' : 'border-ink/50'

  return (
    <>
      <header
        className={`${position === 'overlay' ? 'absolute inset-x-0 top-0 z-30' : 'relative'} isolate [&_a]:pointer-events-auto [&_button]:pointer-events-auto px-6 pb-4 pt-8 transition-colors duration-500 sm:px-8 sm:pb-5 sm:pt-12 md:px-12 ${color}`}
      >
        {/* Frosted bar once the background behind the header turns dark; only its opacity animates.
            No blur below md: re-blurring the scrubbing video every frame costs too much on phones. */}
        <div
          aria-hidden
          data-header-backdrop
          className={`pointer-events-none absolute inset-0 -z-10 border-b border-cream/10 bg-ink/90 md:bg-ink/80 md:backdrop-blur-md transition-opacity duration-500 ease-expo ${
            dark ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <nav
          aria-label="Primary"
          className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.3em]"
        >
          <ul className="hidden items-center gap-10 lg:flex">
            {NAV.map(({ label, href }, i) => {
              const current = isCurrent(pathname, href)
              return (
                <li key={href} className={enterCls} style={delay(i)}>
                  <Link href={href} aria-current={current ? 'page' : undefined} className="relative inline-block py-1">
                    {label}
                    {current && <span aria-hidden className="absolute inset-x-0 -bottom-1 h-[2px] bg-current" />}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="ml-auto flex items-center gap-6 sm:gap-8">
            <span className={`flex items-center gap-3 ${enterCls}`} style={delay(5)}>
              <Link href="/roasts">Shop</Link>
              <Link
                href="/cart"
                aria-label={`Bag, ${count} ${count === 1 ? 'item' : 'items'}`}
                className={`grid h-6 w-6 place-items-center rounded-full border text-[10px] tracking-normal transition-colors duration-500 ${border}`}
              >
                <span aria-hidden>{count}</span>
              </Link>
            </span>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-haspopup="dialog"
              className={`hidden uppercase tracking-[0.3em] lg:inline ${enterCls}`}
              style={delay(6)}
            >
              Menu
            </button>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls="mobile-menu"
              className={`-m-2 flex h-11 w-11 flex-col items-end justify-center gap-[5px] p-2.5 lg:hidden ${enterCls}`}
              style={delay(6)}
            >
              <span className="block h-px w-6 bg-current" />
              <span className="block h-px w-6 bg-current" />
              <span className="block h-px w-4 bg-current" />
            </button>
          </div>
        </nav>
      </header>
      <MobileMenu open={open} onClose={() => setOpen(false)} returnFocusTo={triggerRef} />
    </>
  )
}
