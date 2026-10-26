import { useState } from 'react'
import { Link, Redirect } from 'wouter'
import { PageHero } from '@/components/PageHero'
import { SiteLayout } from '@/components/SiteLayout'
import { getRoast } from '@/content/roasts'
import { usePageMeta } from '@/hooks/usePageMeta'
import { lineKey } from '@/lib/cart'
import { formatPrice } from '@/lib/format'
import { readOrder } from '@/lib/order'

export function Confirmed() {
  usePageMeta('Order confirmed')
  const [order] = useState(readOrder)
  if (!order) return <Redirect to="/roasts" replace />

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Order confirmed"
        title="Thank you"
        lede={`Your order number is ${order.number}. This is a demo, so nothing will arrive.`}
      />
      <div className="bg-scene px-6 py-24 text-cream sm:px-8 md:px-12 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <ul aria-label="Items in your order" className="divide-y divide-cream/15 border-y border-cream/15">
            {order.items.map((item) => (
              <li key={lineKey(item)} className="flex justify-between gap-6 py-6">
                <p className="font-display text-2xl font-light">{getRoast(item.slug)?.name ?? item.slug}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-mist">
                  {item.size} · {item.grind} · Qty {item.qty}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-6 flex justify-between gap-6 text-xs uppercase tracking-[0.2em]">
            <span className="text-mist">Total</span>
            <span>{formatPrice(order.total)}</span>
          </p>
          <Link
            href="/"
            className="mt-10 inline-block border border-cream/40 px-8 py-4 text-xs uppercase tracking-[0.3em] transition-colors hover:bg-cream hover:text-ink"
          >
            Back to the descent
          </Link>
        </div>
      </div>
    </SiteLayout>
  )
}
