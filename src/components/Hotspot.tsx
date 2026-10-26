import { useState } from 'react'

type Props = { name: string; note: string }

/** A 10px cherry dot whose label expands on hover, focus or tap. Rendered inside drei <Html>. */
export function Hotspot({ name, note }: Props) {
  const [pinned, setPinned] = useState(false)
  return (
    <button
      type="button"
      aria-label={`${name}: ${note}`}
      aria-expanded={pinned}
      onClick={() => setPinned((v) => !v)}
      onPointerDown={(e) => e.stopPropagation()}
      className="group relative -m-4 flex items-center p-4 text-left text-cream outline-none"
      data-pinned={pinned}
    >
      <span className="relative block h-2.5 w-2.5 shrink-0 rounded-full bg-cherry ring-2 ring-cream/40 transition-transform duration-300 group-hover:scale-125 group-focus-visible:ring-cream">
        <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-cherry/60 motion-reduce:hidden" />
      </span>
      <span className="relative ml-3 whitespace-nowrap">
        <span className="block text-[11px] font-medium uppercase tracking-[0.25em]">{name}</span>
        {/* Expansion animates only opacity + transform; the note is pre-laid-out below the name. */}
        <span className="absolute left-0 top-full mt-1 -translate-x-1 text-xs text-mist opacity-0 transition-[opacity,transform] duration-500 ease-expo group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 group-data-[pinned=true]:translate-x-0 group-data-[pinned=true]:opacity-100">
          {note}
        </span>
      </span>
    </button>
  )
}
