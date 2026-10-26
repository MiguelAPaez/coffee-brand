import { FLAVORS } from '@/config'

/** Static stand-in for the 3D scene when WebGL is unavailable. */
export function BeanFallback() {
  return (
    <div className="absolute inset-0 bg-scene">
      <div className="absolute inset-x-6 bottom-12 flex flex-col items-center gap-10 sm:inset-x-8 lg:inset-y-0 lg:left-auto lg:right-12 lg:w-[44%] lg:justify-center">
        {/* CSS-only bean: two halves with a crease, lit from the upper right. */}
        <div aria-hidden className="relative h-44 w-32 sm:h-56 sm:w-40">
          <div className="absolute inset-0 rounded-[50%] bg-[radial-gradient(ellipse_at_65%_30%,#7a4a2e_0%,#4a2c1c_45%,#24150d_100%)] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]" />
          <svg viewBox="0 0 40 56" className="absolute inset-0 h-full w-full" fill="none">
            <path d="M20 6 C 13 18, 27 30, 20 50" stroke="#1a110c" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
        <ul
          className="w-full max-w-sm divide-y divide-cream/15 border-y border-cream/15 text-cream"
          aria-label="Flavor notes"
        >
          {FLAVORS.map((f) => (
            <li key={f.name} className="flex items-baseline gap-4 py-3">
              <span aria-hidden className="h-2.5 w-2.5 shrink-0 translate-y-[1px] rounded-full bg-cherry" />
              <span className="text-[11px] font-medium uppercase tracking-[0.25em]">{f.name}</span>
              <span className="ml-auto text-right text-xs text-mist">{f.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
