import { Link } from 'wouter'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { SiteLayout } from '@/components/SiteLayout'
import { Stagger } from '@/components/Stagger'
import { ARTICLES } from '@/content/journal'
import { usePageMeta } from '@/hooks/usePageMeta'
import { formatDate } from '@/lib/format'

export function Journal() {
  usePageMeta('Journal')
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Journal"
        title="Notes from the mountain"
        lede="Short dispatches on harvest, craft and the people behind the cup."
      />
      <div className="bg-scene px-6 py-24 text-cream sm:px-8 md:px-12 lg:py-32">
        <div className="mx-auto max-w-6xl divide-y divide-cream/15 border-y border-cream/15">
          {ARTICLES.map((a) => (
            <Reveal key={a.slug} as="article" className="grid gap-4 py-10 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-12">
              <Stagger index={0} as="p" className="text-xs uppercase tracking-[0.2em] text-mist">
                <time dateTime={a.date}>{formatDate(a.date)}</time> · {a.readMins} min read
              </Stagger>
              <div>
                <Stagger index={1} as="h2" className="font-display text-3xl font-light sm:text-4xl">
                  <Link href={`/journal/${a.slug}`} className="underline-offset-8 hover:underline">
                    {a.title}
                  </Link>
                </Stagger>
                <Stagger index={2} as="p" className="mt-4 max-w-[65ch] text-base leading-relaxed text-cream/80">
                  {a.excerpt}
                </Stagger>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </SiteLayout>
  )
}
