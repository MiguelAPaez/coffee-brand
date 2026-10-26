import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Field } from '@/components/Field'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { SiteLayout } from '@/components/SiteLayout'
import { Stagger } from '@/components/Stagger'
import { VISIT } from '@/content/visit'
import { usePageMeta } from '@/hooks/usePageMeta'
import { validateContact, type ContactValues, type Errors } from '@/lib/forms'

const FIELD_ORDER: (keyof ContactValues)[] = ['name', 'email', 'message']

export function Visit() {
  usePageMeta('Visit')
  const [values, setValues] = useState<ContactValues>({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState<Errors<ContactValues>>({})
  const [sent, setSent] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // The focused submit button unmounts on success; move focus to the heading so it isn't lost to <body>.
  useEffect(() => {
    if (sent) headingRef.current?.focus()
  }, [sent])

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = e.target.name as keyof ContactValues
    const next = { ...values, [name]: e.target.value }
    setValues(next)
    // Re-validate only fields already flagged, so errors clear as they are fixed.
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: validateContact(next)[name] }))
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const found = validateContact(values)
    setErrors(found)
    const first = FIELD_ORDER.find((k) => found[k])
    if (first) {
      ;(e.currentTarget.elements.namedItem(first) as HTMLElement | null)?.focus()
      return
    }
    setSent(true)
  }

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Visit"
        title="Come up the mountain"
        lede="Tastings, tours and a cup at the edge of the clouds."
      />
      <div className="bg-scene px-6 py-24 text-cream sm:px-8 md:px-12 lg:py-32">
        <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-24">
          <Reveal>
            <Stagger>
              <h2 className="text-xs uppercase tracking-[0.2em] text-mist">Find us</h2>
              <address className="mt-4 font-display text-2xl font-light not-italic leading-snug">
                {VISIT.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              <h2 className="mt-12 text-xs uppercase tracking-[0.2em] text-mist">Hours</h2>
              <dl className="mt-4 divide-y divide-cream/15 border-y border-cream/15 text-xs uppercase tracking-[0.2em]">
                {VISIT.hours.map((h) => (
                  <div key={h.day} className="flex justify-between gap-6 py-3.5">
                    <dt className="text-mist">{h.day}</dt>
                    <dd className="text-right">{h.time}</dd>
                  </div>
                ))}
              </dl>
              <h2 className="mt-12 text-xs uppercase tracking-[0.2em] text-mist">Getting here</h2>
              {VISIT.directions.map((p) => (
                <p key={p} className="mt-4 max-w-prose text-base leading-relaxed text-cream/80">
                  {p}
                </p>
              ))}
            </Stagger>
          </Reveal>
          <div>
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="font-display text-3xl font-light leading-tight focus:outline-none sm:text-4xl"
            >
              Write to us
            </h2>
            {/* Always mounted so screen readers announce the text when it changes. */}
            <p role="status" className={sent ? 'mt-8 text-base text-cream/80' : undefined}>
              {sent && "Message received — we'll write back within two days."}
            </p>
            {!sent && (
              <form noValidate onSubmit={onSubmit} className="mt-8 space-y-8">
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
                  label="Message"
                  name="message"
                  as="textarea"
                  value={values.message}
                  onChange={onChange}
                  error={errors.message}
                />
                <button
                  type="submit"
                  className="block w-full border border-cream/40 px-5 py-4 text-xs uppercase tracking-[0.3em] transition-colors hover:bg-cream hover:text-ink sm:w-auto sm:px-10"
                >
                  Send message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
