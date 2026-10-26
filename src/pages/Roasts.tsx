import { Link } from 'wouter'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { SiteLayout } from '@/components/SiteLayout'
import { Stagger } from '@/components/Stagger'
import { ROASTS } from '@/content/roasts'
import { useCart } from '@/hooks/useCart'
import { usePageMeta } from '@/hooks/usePageMeta'
import { formatPrice } from '@/lib/format'

export function Roasts() {
  usePageMeta('Roasts')
  const { add } = useCart()
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Roasts"
        title="Four coffees, one mountain"
        lede="Small-batch roasts, named for the altitude and the weather they grew in."
      />
      <div className="bg-scene px-6 py-24 text-cream sm:px-8 md:px-12 lg:py-32">
        <div className="mx-auto grid max-w-6xl gap-x-12 gap-y-16 sm:grid-cols-2">
          {ROASTS.map((r) => (
            <Reveal key={r.slug} as="article" className="flex flex-col border-t border-cream/15 pt-6">
              <Stagger index={0} as="p" className="text-xs uppercase tracking-[0.2em] text-mist">
                {r.region} · {r.level}
              </Stagger>
              <Stagger index={1} as="h2" className="mt-3 font-display text-3xl font-light sm:text-4xl">
                <Link href={`/roasts/${r.slug}`} className="underline-offset-8 hover:underline">
                  {r.name}
                </Link>
              </Stagger>
              <Stagger index={2} as="p" className="mt-4 text-base leading-relaxed text-cream/80">
                {r.flavors.map((f) => f.name).join(', ')}
              </Stagger>
              <div className="mt-8 flex items-center justify-between gap-6">
                <p className="text-sm uppercase tracking-[0.2em]">from {formatPrice(r.price['250g'])}</p>
                <button
                  type="button"
                  aria-label={`Add ${r.name}, 250g whole bean, to bag`}
                  onClick={() => add({ slug: r.slug, size: '250g', grind: 'Whole bean' })}
                  className="border border-cream/40 px-5 py-3 text-xs uppercase tracking-[0.3em] transition-colors hover:bg-cream hover:text-ink"
                >
                  Add to bag
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </SiteLayout>
  )
}
