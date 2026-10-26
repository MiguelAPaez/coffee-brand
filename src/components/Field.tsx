import type { ChangeEvent, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

type FieldProps = {
  label: string
  name: string
  error?: string
  as?: 'input' | 'textarea' | 'select'
  // Method syntax keeps this bivariant, so a handler typed for any one element kind is accepted.
  onChange?(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'>

export function Field({ label, name, error, as = 'input', className = '', ...rest }: FieldProps) {
  const errorId = `${name}-error`
  const shared = {
    id: name,
    name,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
    className: `mt-2 block w-full border-0 border-b border-cream/30 bg-transparent py-2.5 text-base text-cream transition-colors focus:border-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-cream focus-visible:ring-offset-2 focus-visible:ring-offset-scene ${className}`,
  }
  return (
    <div>
      <label htmlFor={name} className="block text-xs uppercase tracking-[0.2em] text-mist">
        {label}
      </label>
      {as === 'textarea' ? (
        <textarea rows={5} {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} {...shared} />
      ) : as === 'select' ? (
        <select {...(rest as SelectHTMLAttributes<HTMLSelectElement>)} {...shared} />
      ) : (
        <input {...(rest as InputHTMLAttributes<HTMLInputElement>)} {...shared} />
      )}
      {/* Light tone: cherry fails contrast on the scene background. */}
      {error && (
        <p id={errorId} className="mt-2 text-sm text-[#f3a9a3]">
          {error}
        </p>
      )}
    </div>
  )
}
