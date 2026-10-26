import { Reveal } from '@/components/Reveal'
import { Stagger } from '@/components/Stagger'
import { BASE_LIGHT } from '@/config'

type Props = { eyebrow: string; title: string; lede?: string }

/** Light opening band of every inner page; mirrors the cloud-white start of the descent. */
export function PageHero({ eyebrow, title, lede }: Props) {
  return (
    <section
      data-page-hero
      style={{ backgroundColor: BASE_LIGHT }}
      className="px-6 pb-24 pt-40 text-ink sm:px-8 md:px-12"
    >
      <Reveal className="max-w-[48rem]">
        <Stagger index={0} as="p" className="text-xs uppercase tracking-[0.3em]">
          {eyebrow}
        </Stagger>
        <Stagger index={1} className="mt-6">
          <h1
            tabIndex={-1}
            className="font-display text-[clamp(2.5rem,7vw,6rem)] font-light leading-[1.05] outline-none"
          >
            {title}
          </h1>
        </Stagger>
        {lede && (
          <Stagger index={2} as="p" className="mt-8 max-w-md text-base leading-relaxed text-ink/80">
            {lede}
          </Stagger>
        )}
      </Reveal>
    </section>
  )
}
