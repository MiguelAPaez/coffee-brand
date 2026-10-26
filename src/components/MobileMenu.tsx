import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { X } from 'lucide-react'
import { Link, useLocation } from 'wouter'
import { NAV } from '@/config'
import { useCart } from '@/hooks/useCart'
import { isCurrent } from '@/lib/nav'

type Props = { open: boolean; onClose: () => void; returnFocusTo: RefObject<HTMLElement> }

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Full-screen INK overlay with staggered links, scroll lock, Escape-to-close and a focus trap. */
export function MobileMenu({ open, onClose, returnFocusTo }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => onClose(), [onClose])
  const [pathname] = useLocation()
  const { count } = useCart()

  // `inert` keeps the closed overlay out of the tab order and accessibility tree.
  useEffect(() => {
    ref.current?.toggleAttribute('inert', !open)
  }, [open])

  useEffect(() => {
    if (!open) return
    const html = document.documentElement
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    const restoreTo = (document.activeElement as HTMLElement | null) ?? returnFocusTo.current
    // The overlay only becomes focusable once its visibility flips; retry for a few frames.
    let raf = 0
    let tries = 0
    const focusClose = () => {
      const btn = closeRef.current
      btn?.focus({ preventScroll: true })
      if (document.activeElement !== btn && ++tries < 30) raf = requestAnimationFrame(focusClose)
    }
    raf = requestAnimationFrame(focusClose)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key !== 'Tab' || !ref.current) return
      const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (!ref.current.contains(active)) {
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      html.style.overflow = ''
      document.body.style.overflow = ''
      restoreTo?.focus({ preventScroll: true })
    }
  }, [open, close, returnFocusTo])

  const linkCls = (i: number) => ({
    className: `transition-[opacity,transform] duration-700 ease-expo ${
      open ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
    }`,
    style: { transitionDelay: open ? `${i * 80 + 100}ms` : '0ms' },
  })

  return (
    <div
      ref={ref}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className={`pointer-events-auto fixed inset-0 z-50 flex flex-col bg-ink px-6 pb-12 pt-8 text-cream transition-[opacity,visibility] duration-500 ease-expo sm:px-8 sm:pt-12 md:px-12 ${
        open ? 'visible opacity-100' : 'invisible opacity-0'
      }`}
    >
      <div className="flex justify-end">
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Close menu"
          className="-m-2 grid h-11 w-11 place-items-center"
        >
          <X size={22} strokeWidth={1.5} aria-hidden />
        </button>
      </div>

      <nav aria-label="Menu links" className="mt-auto">
        <ul className="space-y-2">
          {NAV.map(({ label, href }, i) => (
            <li key={href} {...linkCls(i)}>
              <Link
                href={href}
                onClick={close}
                aria-current={isCurrent(pathname, href) ? 'page' : undefined}
                className="font-display text-[clamp(2.5rem,11vw,4.5rem)] font-light leading-[1.15]"
              >
                {label}
              </Link>
            </li>
          ))}
          <li {...linkCls(NAV.length)} className={`${linkCls(NAV.length).className} pt-8`}>
            <Link href="/cart" onClick={close} className="text-xs font-medium uppercase tracking-[0.3em] text-mist">
              Shop ({count})
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}
