import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'wouter'
import { ArrowDown, ArrowRight, ChevronUp, Hand } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Section } from '@/components/Section'
import { Stagger } from '@/components/Stagger'
import { BeanFallback } from '@/components/BeanFallback'
import { useScrollProgress, useProgressAbove, progress } from '@/hooks/useScrollProgress'
import { useVideoScrub } from '@/hooks/useVideoScrub'
import { useIsMobile, useReducedMotion } from '@/hooks/useMedia'
import { subscribe } from '@/lib/raf'
import { range } from '@/lib/math'
import { firstIntent } from '@/lib/intent'
import { hasNavigated } from '@/lib/nav'
import { BASE_LIGHT, FLAVORS, HANDOFF_BG, pickVideoUrl, SPECS, T } from '@/config'

const load3D = () => import('@/components/three/BeanScene')
const BeanScene = lazy(load3D)

function hasWebGL(): boolean {
  if (new URLSearchParams(location.search).has('nowebgl')) return false
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') ?? c.getContext('webgl')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return !!gl
  } catch {
    return false
  }
}

/** Falls back to the static bean if the 3D chunk or WebGL context fails at runtime. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <BeanFallback /> : this.props.children
  }
}

const pad = 'px-6 sm:px-8 md:px-12'
/** Sticky-layer base under the final dim (the light cloud base is BASE_LIGHT in config). */
const BASE_DIM = '#0b0705'

export function Home() {
  const trackRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)

  useScrollProgress(trackRef)
  useEffect(() => {
    document.title = 'ALTURA — Descent'
    // Like usePageMeta: a direct load keeps the browser's default focus; an in-app arrival lands on the h1.
    if (!hasNavigated()) return
    const h1 = trackRef.current?.querySelector('h1')
    if (!h1) return
    h1.tabIndex = -1
    h1.focus({ preventScroll: true })
  }, [])
  const src = useMemo(pickVideoUrl, [])
  const { videoRef } = useVideoScrub(src)
  const reduced = useReducedMotion()
  const mobile = useIsMobile()
  const dark = useProgressAbove(T.darkFootage)
  const reached3D = useProgressAbove(T.mount3D)
  const webgl = useMemo(hasWebGL, [])
  const [mount3D, setMount3D] = useState(false)
  const [showHint, setShowHint] = useState(true)

  // Once mounted, keep the 3D scene alive so scrolling back up never remounts it.
  useEffect(() => {
    if (reached3D) setMount3D(true)
  }, [reached3D])

  // Preload the 3D chunk in idle time, once the visitor starts scrolling (well before p = 0.35).
  useEffect(() => {
    if (!webgl) return
    let cancelled = false
    let id = 0
    void firstIntent().then(() => {
      if (cancelled) return
      const run = () => void load3D()
      id =
        'requestIdleCallback' in window
          ? requestIdleCallback(run, { timeout: 3000 })
          : (setTimeout(run, 300) as unknown as number)
    })
    return () => {
      cancelled = true
      if ('cancelIdleCallback' in window) cancelIdleCallback(id)
    }
  }, [webgl])

  // Video → 3D handoff and final dim, written straight to the DOM every frame.
  useEffect(() => {
    const sticky = stickyRef.current!
    const media = mediaRef.current!
    const scene = sceneRef.current!
    let last = -1
    let lastBase = ''
    return subscribe(() => {
      const p = progress.p
      if (p === last) return
      last = p
      const h = range(p, T.handoffStart, T.handoffEnd)
      const dim = 1 - 0.6 * range(p, T.settleStart, T.dimEnd)
      // The base shows through the cross-fade: match it to the last frame so nothing flashes.
      const base = p < T.darkFootage ? BASE_LIGHT : p < T.handoffEnd ? HANDOFF_BG : BASE_DIM
      if (base !== lastBase) sticky.style.backgroundColor = lastBase = base
      media.style.opacity = String(1 - h)
      media.style.visibility = h >= 1 ? 'hidden' : 'visible'
      scene.style.opacity = String(h * dim)
      scene.style.transform = `scale(${1.04 - 0.04 * h})`
      scene.style.visibility = h > 0 ? 'visible' : 'hidden'
    })
  }, [])

  const scrollBy = (vh: number) =>
    window.scrollBy({ top: window.innerHeight * vh, behavior: reduced ? 'auto' : 'smooth' })

  return (
    <main>
      <div ref={trackRef} className="relative h-[600vh]">
        <div
          ref={stickyRef}
          className="sticky top-0 h-[100svh] w-full overflow-hidden"
          style={{ backgroundColor: BASE_LIGHT }}
        >
          {/* 1–2: scrubbed video */}
          <div ref={mediaRef} className="absolute inset-0">
            <video
              ref={videoRef}
              muted
              playsInline
              preload="auto"
              disablePictureInPicture
              aria-hidden
              tabIndex={-1}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          {/* 3: real-time 3D */}
          <div ref={sceneRef} className="absolute inset-0 origin-center" style={{ opacity: 0, visibility: 'hidden' }}>
            {mount3D &&
              (webgl ? (
                <SceneBoundary>
                  <Suspense fallback={null}>
                    <BeanScene reduced={reduced} mobile={mobile} onInteract={() => setShowHint(false)} />
                  </Suspense>
                </SceneBoundary>
              ) : (
                <BeanFallback />
              ))}
          </div>

          {/* 4: UI overlay */}
          <div className="pointer-events-none absolute inset-0">
            <Navbar dark={dark} />

            {/* S1 — hero */}
            <Section start={0} end={0.18} label="Introduction" className={`flex items-center text-ink ${pad}`}>
              <div className="max-w-[48rem]">
                <Stagger index={0} as="p" className="text-xs uppercase tracking-[0.3em]">
                  ALTURA — Quindío, Colombia
                </Stagger>
                <Stagger
                  index={1}
                  as="h1"
                  className="mt-6 font-display text-[clamp(2.25rem,6vw,6rem)] font-light leading-[1.05] outline-none"
                >
                  From the clouds to your cup
                </Stagger>
                <Stagger index={2} as="p" className="mt-6 text-sm uppercase tracking-[0.2em] text-ink/85">
                  Single-origin coffee grown at 1,600 meters
                </Stagger>
              </div>
              <button
                type="button"
                onClick={() => scrollBy(1)}
                aria-label="Scroll to begin the descent"
                className={`pointer-events-auto absolute bottom-8 right-6 grid h-12 w-12 place-items-center rounded-full border border-ink/50 transition-transform duration-300 ease-expo hover:scale-110 sm:bottom-12 sm:right-8 md:right-12`}
              >
                <ArrowDown size={18} strokeWidth={1.5} aria-hidden />
              </button>
            </Section>

            {/* S2 — statement */}
            <Section
              start={0.26}
              end={0.44}
              label="Our coffee"
              className={`flex items-center justify-center text-center text-cream ${pad}`}
            >
              <Stagger
                as="h2"
                className="max-w-[900px] font-display text-[clamp(1.5rem,4.5vw,4.25rem)] font-light leading-[1.1]"
              >
                Grown above the clouds, <span className="opacity-80">picked by hand, </span>
                <span className="opacity-50">roasted with patience</span>
              </Stagger>
              <div
                aria-hidden
                className="absolute right-6 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3 sm:right-8 md:right-12"
              >
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`block rounded-full bg-cream ${i === 1 ? 'h-2 w-2' : 'h-1.5 w-1.5 opacity-40'}`}
                  />
                ))}
              </div>
            </Section>

            {/* S3 — the bean */}
            <Section start={0.56} end={0.86} label="Open the bean" className="text-cream">
              <div
                className={`absolute inset-x-0 top-24 sm:top-32 lg:inset-x-auto lg:left-0 lg:top-1/2 lg:w-[38%] lg:max-w-[30rem] lg:-translate-y-1/2 ${pad}`}
              >
                <Stagger index={0} as="p" className="text-xs uppercase tracking-[0.3em] text-mist">
                  Open the bean
                </Stagger>
                <Stagger
                  index={1}
                  as="h2"
                  className="mt-3 font-display text-[clamp(1.75rem,3.6vw,3.25rem)] font-light leading-[1.08] lg:mt-5"
                >
                  Every note starts inside
                </Stagger>
                <Stagger index={2}>
                  <dl className="mt-5 max-w-sm divide-y divide-cream/15 border-y border-cream/15 text-[11px] uppercase tracking-[0.2em] lg:mt-10 lg:text-xs">
                    {SPECS.map((s) => (
                      <div key={s.label} className="flex justify-between py-2 lg:py-3.5">
                        <dt className="text-mist">{s.label}</dt>
                        <dd>{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                  {reduced && (
                    <ul aria-label="Flavor notes" className="mt-5 max-w-sm space-y-2 text-xs lg:mt-8">
                      {FLAVORS.map((f) => (
                        <li key={f.name} className="flex items-baseline gap-3">
                          <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-cherry" />
                          <span className="font-medium uppercase tracking-[0.2em]">{f.name}</span>
                          <span className="text-mist">— {f.note}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Stagger>
              </div>
              {webgl && (
                <div
                  aria-hidden={!showHint}
                  className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-500 sm:bottom-12 ${showHint ? 'opacity-100' : 'opacity-0'}`}
                >
                  <div className="flex items-center gap-2.5 whitespace-nowrap rounded-full border border-cream/25 px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-cream">
                    <Hand size={14} strokeWidth={1.5} aria-hidden />
                    Drag to rotate
                  </div>
                </div>
              )}
            </Section>

            {/* S4 — call to action */}
            <Section
              start={0.9}
              end={1}
              label="Order"
              className={`flex flex-col items-center justify-center text-center text-cream ${pad}`}
            >
              <Stagger
                index={0}
                as="h2"
                className="font-display text-[clamp(2.25rem,6vw,5.5rem)] font-light leading-[1.05]"
              >
                Taste the descent
              </Stagger>
              <Stagger index={1} className="mt-10">
                <Link
                  href="/roasts"
                  className="group pointer-events-auto inline-flex items-center gap-5 text-sm uppercase tracking-[0.3em]"
                >
                  Order your first bag
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-cream text-ink transition-transform duration-300 ease-expo group-hover:scale-110 group-focus-visible:scale-110">
                    <ArrowRight size={18} strokeWidth={1.5} aria-hidden />
                  </span>
                </Link>
              </Stagger>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })}
                aria-label="Back to top"
                className="pointer-events-auto absolute bottom-8 left-1/2 grid h-11 w-11 -translate-x-1/2 place-items-center text-mist transition-colors hover:text-cream sm:bottom-12"
              >
                <ChevronUp size={20} strokeWidth={1.5} aria-hidden />
              </button>
            </Section>
          </div>
        </div>
      </div>
    </main>
  )
}
