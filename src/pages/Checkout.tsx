import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Redirect, useLocation } from 'wouter'
import { Field } from '@/components/Field'
import { PageHero } from '@/components/PageHero'
import { SiteLayout } from '@/components/SiteLayout'
import { getRoast } from '@/content/roasts'
import { useCart } from '@/hooks/useCart'
import { usePageMeta } from '@/hooks/usePageMeta'
import { lineKey, lineTotal, shippingFor } from '@/lib/cart'
import { validateShipping, type Errors, type ShippingValues } from '@/lib/forms'
import { formatPrice } from '@/lib/format'
import { makeOrderNumber, saveOrder, type StoredOrder } from '@/lib/order'

const FIELD_ORDER: (keyof ShippingValues)[] = ['name', 'email', 'address', 'city', 'postcode', 'country']
const COUNTRIES = ['Colombia', 'United States', 'Canada', 'United Kingdom', 'Spain', 'Germany']

export function Checkout() {
  usePageMeta('Checkout')
  const { items, count, subtotal, clear } = useCart()
  const [, navigate] = useLocation()
  const [values, setValues] = useState<ShippingValues>({
    name: '',
    email: '',
    address: '',
    city: '',
    postcode: '',
    country: '',
  })
  const [errors, setErrors] = useState<Errors<ShippingValues>>({})
  // Clearing the bag after the order is written would otherwise trip the empty-bag redirect below.
  const placing = useRef(false)
  const shipping = shippingFor(subtotal)

  if (count === 0 && !placing.current) return <Redirect to="/cart" replace />

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const name = e.target.name as keyof ShippingValues
    const next = { ...values, [name]: e.target.value }
    setValues(next)
    // Re-validate only fields already flagged, so errors clear as they are fixed.
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: validateShipping(next)[name] }))
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const found = validateShipping(values)
    setErrors(found)
    const first = FIELD_ORDER.find((k) => found[k])
    if (first) {
      ;(e.currentTarget.elements.namedItem(first) as HTMLElement | null)?.focus()
      return
    }
    const order: StoredOrder = { number: makeOrderNumber(), items, total: subtotal + shipping }
    placing.current = true
    saveOrder(order)
    navigate('/checkout/confirmed')
    clear()
  }

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Checkout"
        title="Where should we send it?"
        lede="A few details and your coffee is on its way."
      />
      <div className="bg-scene px-6 py-24 text-cream sm:px-8 md:px-12 lg:py-32">
        <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-24">
          <form noValidate onSubmit={onSubmit} className="space-y-8">
            <Field
              label="Name"
              name="name"
              autoComplete="name"
              value={values.name}
              onChange={onChange}
              error={errors.name}
            />
            <Field
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={onChange}
              error={errors.email}
            />
            <Field
              label="Address"
              name="address"
              autoComplete="street-address"
              value={values.address}
              onChange={onChange}
              error={errors.address}
            />
            <Field
              label="City"
              name="city"
              autoComplete="address-level2"
              value={values.city}
              onChange={onChange}
              error={errors.city}
            />
            <Field
              label="Postal code"
              name="postcode"
              autoComplete="postal-code"
              value={values.postcode}
              onChange={onChange}
              error={errors.postcode}
            />
            <Field
              label="Country"
              name="country"
              as="select"
              autoComplete="country-name"
              value={values.country}
              onChange={onChange}
              error={errors.country}
            >
              <option value="" className="bg-scene text-cream">
                Select a country
              </option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c} className="bg-scene text-cream">
                  {c}
                </option>
              ))}
            </Field>
            <div>
              <p className="mb-4 text-sm text-mist">This is a demo store — no payment is taken.</p>
              <button
                type="submit"
                className="block w-full border border-cream/40 px-5 py-4 text-xs uppercase tracking-[0.3em] transition-colors hover:bg-cream hover:text-ink sm:w-auto sm:px-10"
              >
                Place order
              </button>
            </div>
          </form>
          <section aria-labelledby="summary-heading">
            <h2 id="summary-heading" className="text-xs uppercase tracking-[0.2em] text-mist">
              Order summary
            </h2>
            <ul className="mt-4 divide-y divide-cream/15 border-y border-cream/15">
              {items.map((item) => (
                <li key={lineKey(item)} className="flex justify-between gap-6 py-4">
                  <div>
                    <p className="font-display text-xl font-light">{getRoast(item.slug)?.name ?? item.slug}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-mist">
                      {item.size} · {item.grind} · Qty {item.qty}
                    </p>
                  </div>
                  <p className="font-display text-xl font-light">{formatPrice(lineTotal(item))}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-6 divide-y divide-cream/15 border-y border-cream/15 text-xs uppercase tracking-[0.2em]">
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
          </section>
        </div>
      </div>
    </SiteLayout>
  )
}
