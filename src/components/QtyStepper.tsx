import { useEffect, useId, useState } from 'react'
import { MAX_QTY } from '@/lib/cart'

type Props = { value: number; onChange(n: number): void; label: string; min?: number; max?: number }

const buttonClass =
  'flex h-11 w-11 items-center justify-center text-lg transition-opacity aria-disabled:cursor-not-allowed aria-disabled:opacity-30'

export function QtyStepper({ value, onChange, label, min = 1, max = MAX_QTY }: Props) {
  const id = useId()
  // The draft lets the field be empty mid-edit; it snaps back to the real value on blur.
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])

  // aria-disabled (not disabled) at the bounds so a focused button keeps focus.
  // Button names carry the field label so several steppers on one page stay distinguishable.
  const noun = label.charAt(0).toLowerCase() + label.slice(1)
  const clamp = (n: number) => Math.min(max, Math.max(min, n))

  return (
    <div className="inline-flex flex-col gap-2">
      <label htmlFor={id} className="text-xs uppercase tracking-[0.2em] text-mist">
        {label}
      </label>
      <div className="inline-flex items-center border border-cream/30">
        <button
          type="button"
          aria-label={`Decrease ${noun}`}
          aria-disabled={value <= min}
          onClick={() => value > min && onChange(clamp(value - 1))}
          className={buttonClass}
        >
          <span aria-hidden="true">−</span>
        </button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={draft}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '')
            if (!digits) return setDraft('')
            const n = clamp(Number(digits))
            setDraft(String(n))
            onChange(n)
          }}
          onBlur={() => setDraft(String(value))}
          className="h-11 w-12 bg-transparent text-center text-base outline-none focus-visible:ring-1 focus-visible:ring-current"
        />
        <button
          type="button"
          aria-label={`Increase ${noun}`}
          aria-disabled={value >= max}
          onClick={() => value < max && onChange(clamp(value + 1))}
          className={buttonClass}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
    </div>
  )
}
