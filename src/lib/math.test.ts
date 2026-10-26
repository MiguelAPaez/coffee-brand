import { clamp, range, sectionOpacity } from '@/lib/math'

describe('clamp', () => {
  it('limits values to the given bounds', () => {
    expect(clamp(-1)).toBe(0)
    expect(clamp(2)).toBe(1)
    expect(clamp(5, 0, 10)).toBe(5)
  })
})

describe('range', () => {
  it('normalises and clamps position inside [a, b]', () => {
    expect(range(0.5, 0, 1)).toBe(0.5)
    expect(range(2, 0, 1)).toBe(1)
  })
})

describe('sectionOpacity', () => {
  it('is visible at p = 0 when the section starts at 0', () => {
    expect(sectionOpacity(0, 0, 0.18)).toBe(1)
  })
  it('is hidden at its start edge', () => {
    expect(sectionOpacity(0.26, 0.26, 0.44)).toBe(0)
  })
  it('is fully visible once the fade-in completes', () => {
    expect(sectionOpacity(0.34, 0.26, 0.44)).toBeCloseTo(1)
  })
  it('does not fade out when the section ends at 1', () => {
    expect(sectionOpacity(1, 0.9, 1)).toBe(1)
  })
})
