import { Link } from 'wouter'
import { NAV } from '@/config'

export function Footer() {
  return (
    <footer className="bg-scene px-6 py-16 text-cream sm:px-8 md:px-12">
      <div className="flex flex-col gap-12 border-t border-cream/15 pt-12 md:flex-row md:justify-between">
        <div>
          <p className="font-display text-2xl font-light tracking-[0.2em]">ALTURA</p>
          <address className="mt-4 text-sm not-italic leading-relaxed text-mist">
            Finca La Cumbre, Salento,
            <br />
            Quindío, Colombia
          </address>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-col gap-3 text-xs uppercase tracking-[0.3em] md:flex-row md:gap-8">
            {NAV.map(({ label, href }) => (
              <li key={href}>
                <Link href={href} className="inline-block py-1">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="mt-12 text-xs text-mist">© {new Date().getFullYear()} ALTURA</p>
    </footer>
  )
}
