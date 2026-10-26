import { formatDate, formatPrice } from '@/lib/format'

describe('formatPrice', () => {
  it('formats integer cents as US dollars', () => {
    expect(formatPrice(1800)).toBe('$18.00')
    expect(formatPrice(0)).toBe('$0.00')
    expect(formatPrice(6250)).toBe('$62.50')
  })
})

describe('formatDate', () => {
  it('formats an ISO date as a long US date', () => {
    expect(formatDate('2026-09-14')).toBe('September 14, 2026')
    expect(formatDate('2026-01-01')).toBe('January 1, 2026')
  })
})
