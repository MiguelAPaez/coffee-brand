import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { SiteLayout } from '@/components/SiteLayout'
import { Stagger } from '@/components/Stagger'
import { STEPS } from '@/content/process'
import { usePageMeta } from '@/hooks/usePageMeta'

export function Process() {
  usePageMeta('Process')
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Process"
        title="Slow by design"
        lede="From ripe cherry to resting bean, each step is given the time it asks for."
      />
      <div className="bg-scene px-6 py-24 text-cream sm:px-8 md:px-12 lg:py-32">
        <ol aria-label="Process steps" className="mx-auto max-w-6xl divide-y divide-cream/15 border-y border-cream/15">
          {STEPS.map((s) => (
            <li key={s.n}>
              <Reveal className="grid gap-4 py-12 md:grid-cols-[8rem_1fr] md:gap-12 lg:py-16">
                <Stagger>
                  <span aria-hidden="true" className="font-display text-6xl font-light text-mist lg:text-7xl">
                    {s.n}
                  </span>
                </Stagger>
                <div>
                  <Stagger index={1} as="h2" className="font-display text-3xl font-light sm:text-4xl">
                    {s.title}
                  </Stagger>
                  <Stagger index={2} as="p" className="mt-4 max-w-prose text-base leading-relaxed text-cream/80">
                    {s.body}
                  </Stagger>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </SiteLayout>
  )
}
