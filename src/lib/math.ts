export const clamp = (v: number, min = 0, max = 1) => (v < min ? min : v > max ? max : v)

/** Normalised position of p inside [a, b], clamped to 0..1. */
export const range = (p: number, a: number, b: number) => clamp((p - a) / (b - a))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * Opacity of a section visible in [start, end] with fade windows of `fade`
 * on each side: fades in over [start, start+fade], out over [end-fade, end].
 * A section starting at 0 is fully visible at p = 0.
 */
export function sectionOpacity(p: number, start: number, end: number, fade = 0.08) {
  const fadeIn = start <= 0 ? 1 : range(p, start, start + fade)
  const fadeOut = end >= 1 ? 1 : 1 - range(p, end - fade, end)
  return Math.min(fadeIn, fadeOut)
}

export const smoothstep = (t: number) => t * t * (3 - 2 * t)
