import { useState } from 'react'
import { Link, useParams } from 'wouter'
import { PageHero } from '@/components/PageHero'
import { QtyStepper } from '@/components/QtyStepper'
import { Reveal } from '@/components/Reveal'
import { SiteLayout } from '@/components/SiteLayout'
import { Stagger } from '@/components/Stagger'
import { GRINDS, SIZES, getRoast, type Grind, type Roast, type Size } from '@/content/roasts'
import { useCart } from '@/hooks/useCart'
import { usePageMeta } from '@/hooks/usePageMeta'
import { MAX_QTY, lineKey } from '@/lib/cart'
import { formatPrice } from '@/lib/format'
import { NotFound } from '@/pages/NotFound'

type ChoiceProps<T extends string> = {
  legend: string
  name: string
  options: readonly T[]
  value: T
  onChange(v: T): void
}

function Choice<T extends string>({ legend, name, options, value, onChange }: ChoiceProps<T>) {
  return (
    <fieldset>
      <legend className="text-xs uppercase tracking-[0.2em] text-mist">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-3">
        {options.map((o) => (
          <label key={o} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={o}
              checked={value === o}
              onChange={() => onChange(o)}
              className="peer sr-only"
            />
            <span className="block border border-cream/30 px-4 py-3 text-sm transition-colors peer-checked:bg-cream peer-checked:text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-cream peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-scene">
              {o}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function RoastView({ roast }: { roast: Roast }) {
  usePageMeta(roast.name)
  const { add, items } = useCart()
  const [size, setSize] = useState<Size>('250g')
  const [grind, setGrind] = useState<Grind>('Whole bean')
  const [qty, setQty] = useState(1)
  const [notice, setNotice] = useState<'added' | 'capped' | null>(null)

  // Any edit after adding invalidates the confirmation.
  const edit =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v)
      setNotice(null)
    }

  return (
    <SiteLayout>
      <PageHero eyebrow={roast.region} title={roast.name} lede={roast.summary} />
      <div className="bg-scene px-6 py-24 text-cream sm:px-8 md:px-12 lg:py-32">
        <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-24">
          <Reveal>
            {roast.body.map((p, i) => (
              <Stagger key={p} index={i} as="p" className="mb-5 max-w-prose text-base leading-relaxed text-cream/80">
                {p}
              </Stagger>
            ))}
            <Stagger index={2}>
              <dl className="mt-10 divide-y divide-cream/15 border-y border-cream/15 text-xs uppercase tracking-[0.2em]">
                <div className="flex justify-between gap-6 py-3.5">
                  <dt className="text-mist">Roast</dt>
                  <dd className="text-right">{roast.level}</dd>
                </div>
                {roast.specs.map((s) => (
                  <div key={s.label} className="flex justify-between gap-6 py-3.5">
                    <dt className="text-mist">{s.label}</dt>
                    <dd className="text-right">{s.value}</dd>
                  </div>
                ))}
              </dl>
              <h2 className="mt-12 text-xs uppercase tracking-[0.2em] text-mist">Tasting notes</h2>
              <ul className="mt-4 divide-y divide-cream/15 border-y border-cream/15">
                {roast.flavors.map((f) => (
                  <li key={f.name} className="flex justify-between gap-6 py-3.5 text-base">
                    <span className="font-display text-xl font-light">{f.name}</span>
                    <span className="text-right text-cream/70">{f.note}</span>
                  </li>
                ))}
              </ul>
            </Stagger>
          </Reveal>
          <form
            className="space-y-8 self-start lg:sticky lg:top-32"
            onSubmit={(e) => {
              e.preventDefault()
              const item = { slug: roast.slug, size, grind }
              const key = lineKey(item)
              const capped = items.some((i) => lineKey(i) === key && i.qty === MAX_QTY)
              add(item, qty)
              setNotice(capped ? 'capped' : 'added')
            }}
          >
            <Choice legend="Size" name="size" options={SIZES} value={size} onChange={edit<Size>(setSize)} />
            <Choice legend="Grind" name="grind" options={GRINDS} value={grind} onChange={edit<Grind>(setGrind)} />
            <QtyStepper label="Quantity" value={qty} onChange={edit<number>(setQty)} />
            <p className="font-display text-4xl font-light" data-testid="line-price">
              {formatPrice(roast.price[size] * qty)}
            </p>
            <button
              type="submit"
              className="block w-full border border-cream/40 px-5 py-4 text-xs uppercase tracking-[0.3em] transition-colors hover:bg-cream hover:text-ink"
            >
              Add to bag
            </button>
            {/* Not a live region: the cart provider's polite region already announces every add. */}
            <p className="text-sm text-cream/80">
              {notice && (
                <>
                  {notice === 'capped' ? 'Already at the maximum in your bag.' : 'Added to your bag.'}{' '}
                  <Link href="/cart" className="underline underline-offset-4">
                    View bag
                  </Link>
                </>
              )}
            </p>
          </form>
        </div>
      </div>
    </SiteLayout>
  )
}

export function RoastDetail() {
  const { slug } = useParams<{ slug: string }>()
  const roast = getRoast(slug)
  return roast ? <RoastView roast={roast} /> : <NotFound />
}
