import { useEffect, useRef, useState } from 'react'
import { Link } from 'wouter'
import { PageHero } from '@/components/PageHero'
import { QtyStepper } from '@/components/QtyStepper'
import { Reveal } from '@/components/Reveal'
import { SiteLayout } from '@/components/SiteLayout'
import { getRoast } from '@/content/roasts'
import { useCart } from '@/hooks/useCart'
import { usePageMeta } from '@/hooks/usePageMeta'
import { lineKey, lineTotal, shippingFor } from '@/lib/cart'
import { formatPrice } from '@/lib/format'

const EMPTY = 'empty'

export function Cart() {
  usePageMeta('Your bag')
  const { items, subtotal, setQty, remove } = useCart()
  const shipping = shippingFor(subtotal)
  const nameLinks = useRef(new Map<string, HTMLAnchorElement>())
  const browseLink = useRef<HTMLAnchorElement>(null)
  // Where focus goes after a Remove: a line key, or EMPTY once the bag has no lines left.
  const [focusTarget, setFocusTarget] = useState<string | null>(null)

  useEffect(() => {
    if (focusTarget === null) return
    const el = focusTarget === EMPTY ? browseLink.current : nameLinks.current.get(focusTarget)
    el?.focus()
    setFocusTarget(null)
  }, [focusTarget, items])

  const removeLine = (index: number) => {
    const rest = items.filter((_, i) => i !== index)
    const next = rest[Math.min(index, rest.length - 1)]
    setFocusTarget(next ? lineKey(next) : EMPTY)
    remove(lineKey(items[index]))
  }

  return (
    <SiteLayout>
      <PageHero eyebrow="Bag" title="Your bag" lede="Ships from Salento within two days." />
      <div className="bg-scene px-6 py-24 text-cream sm:px-8 md:px-12 lg:py-32">
        <Reveal className="mx-auto max-w-4xl">
          {items.length === 0 ? (
            <div>
              <p className="font-display text-3xl font-light">Your bag is empty</p>
              <Link
                ref={browseLink}
                href="/roasts"
                className="mt-10 inline-block border border-cream/40 px-8 py-4 text-xs uppercase tracking-[0.3em] transition-colors hover:bg-cream hover:text-ink"
              >
                Browse roasts
              </Link>
            </div>
          ) : (
            <>
              <ul aria-label="Items in your bag" className="divide-y divide-cream/15 border-y border-cream/15">
                {items.map((item, index) => {
                  const key = lineKey(item)
                  const name = getRoast(item.slug)?.name ?? item.slug
                  return (
                    <li key={key} className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6 py-8">
                      <div className="min-w-[12rem] flex-1">
                        <Link
                          ref={(el) => {
                            if (el) nameLinks.current.set(key, el)
                            else nameLinks.current.delete(key)
                          }}
                          href={`/roasts/${item.slug}`}
                          className="font-display text-2xl font-light underline-offset-4 hover:underline"
                        >
                          {name}
                        </Link>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-mist">
                          {item.size} · {item.grind}
                        </p>
                      </div>
                      <QtyStepper
                        label={`Quantity, ${name} ${item.size} ${item.grind}`}
                        value={item.qty}
                        onChange={(n) => setQty(key, n)}
                      />
                      <div className="flex items-center gap-6">
                        <p className="min-w-[5rem] text-right font-display text-2xl font-light">
                          {formatPrice(lineTotal(item))}
                        </p>
                        <button
                          type="button"
                          aria-label={`Remove ${name} ${item.size}, ${item.grind}`}
                          onClick={() => removeLine(index)}
                          className="min-h-11 text-xs uppercase tracking-[0.2em] text-mist underline underline-offset-4 transition-colors hover:text-cream"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <dl className="ml-auto mt-10 max-w-sm divide-y divide-cream/15 border-y border-cream/15 text-xs uppercase tracking-[0.2em]">
                <div className="flex justify-between gap-6 py-3.5">
                  <dt className="text-mist">Subtotal</dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-6 py-3.5">
                  <dt className="text-mist">Shipping</dt>
                  <dd>{shipping === 0 ? 'Free' : formatPrice(shipping)}</dd>
                </div>
                <div className="flex justify-between gap-6 py-3.5">
                  <dt className="text-mist">Total</dt>
                  <dd>{formatPrice(subtotal + shipping)}</dd>
                </div>
              </dl>
              <Link
                href="/checkout"
                className="ml-auto mt-10 block max-w-sm border border-cream/40 px-5 py-4 text-center text-xs uppercase tracking-[0.3em] transition-colors hover:bg-cream hover:text-ink"
              >
                Checkout
              </Link>
            </>
          )}
        </Reveal>
      </div>
    </SiteLayout>
  )
}
