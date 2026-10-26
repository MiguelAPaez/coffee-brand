import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { SiteLayout } from '@/components/SiteLayout'
import { Stagger } from '@/components/Stagger'
import { ORIGIN } from '@/content/origin'
import { usePageMeta } from '@/hooks/usePageMeta'

export function Origin() {
  usePageMeta('Origin')
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Origin"
        title="Where the clouds touch the farm"
        lede="Finca La Cumbre sits at 1,600 metres in Quindío, where every cherry is picked by hand."
      />
      <div className="bg-scene px-6 py-24 text-cream sm:px-8 md:px-12 lg:py-32">
        <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-24">
          <Reveal>
            <Stagger>
              <dl className="divide-y divide-cream/15 border-y border-cream/15 text-xs uppercase tracking-[0.2em] lg:sticky lg:top-32">
                {ORIGIN.facts.map((f) => (
                  <div key={f.label} className="flex justify-between gap-6 py-3.5">
                    <dt className="text-mist">{f.label}</dt>
                    <dd className="text-right">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </Stagger>
          </Reveal>
          <div className="space-y-16">
            {ORIGIN.sections.map((s) => (
              <Reveal key={s.heading} as="section">
                <Stagger as="h2" className="font-display text-3xl font-light leading-tight sm:text-4xl">
                  {s.heading}
                </Stagger>
                {s.body.map((p, i) => (
                  <Stagger
                    key={p}
                    index={i + 1}
                    as="p"
                    className="mt-5 max-w-prose text-base leading-relaxed text-cream/80"
                  >
                    {p}
                  </Stagger>
                ))}
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
