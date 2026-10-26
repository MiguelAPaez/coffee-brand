import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ORDER_KEY, makeOrderNumber, readOrder, type StoredOrder } from '@/lib/order'

describe('makeOrderNumber', () => {
  it('formats ALT- plus six uppercase base36 characters', () => {
    expect(makeOrderNumber(() => 0.5)).toMatch(/^ALT-[0-9A-Z]{6}$/)
    expect(makeOrderNumber(() => 0)).toMatch(/^ALT-[0-9A-Z]{6}$/)
    expect(makeOrderNumber(() => 0.999999)).toMatch(/^ALT-[0-9A-Z]{6}$/)
    expect(makeOrderNumber()).toMatch(/^ALT-[0-9A-Z]{6}$/)
  })
})

describe('readOrder', () => {
  beforeEach(() => sessionStorage.clear())
  const item = { slug: 'la-cumbre', size: '250g', grind: 'Whole bean', qty: 1 }
  it('returns null when missing', () => {
    expect(readOrder()).toBeNull()
  })
  it('returns a valid stored order', () => {
    const order = { number: 'ALT-ABC123', items: [item], total: 2400 }
    sessionStorage.setItem(ORDER_KEY, JSON.stringify(order))
    expect(readOrder()).toEqual(order)
  })
  it('returns null for malformed shapes', () => {
    const bad = [
      '{',
      '{"number":1}',
      '{"number":"ALT-1","items":"x","total":1}',
      '{"number":"ALT-1","items":[{"slug":"nope"}],"total":1}',
      '{"number":"ALT-1","items":[],"total":1}',
    ]
    for (const raw of bad) {
      sessionStorage.setItem(ORDER_KEY, raw)
      expect(readOrder()).toBeNull()
    }
  })
})

describe('saveOrder', () => {
  const order = {
    number: 'ALT-XYZ789',
    items: [{ slug: 'la-cumbre', size: '250g', grind: 'Whole bean', qty: 2 }],
    total: 5400,
  }
  // The in-memory copy is module state, so each case starts from a fresh module.
  const fresh = async () => {
    vi.resetModules()
    return import('@/lib/order')
  }
  beforeEach(() => sessionStorage.clear())

  it('writes the order to sessionStorage', async () => {
    const { saveOrder, readOrder: read } = await fresh()
    saveOrder(order as StoredOrder)
    expect(JSON.parse(sessionStorage.getItem(ORDER_KEY) as string)).toEqual(order)
    expect(read()).toEqual(order)
  })

  it('keeps the order in memory when sessionStorage access is blocked', async () => {
    const { saveOrder, readOrder: read } = await fresh()
    const original = Object.getOwnPropertyDescriptor(window, 'sessionStorage')!
    Object.defineProperty(window, 'sessionStorage', {
      get() {
        throw new DOMException('blocked', 'SecurityError')
      },
      configurable: true,
    })
    try {
      expect(read()).toBeNull()
      expect(() => saveOrder(order as StoredOrder)).not.toThrow()
      expect(read()).toEqual(order)
    } finally {
      Object.defineProperty(window, 'sessionStorage', original)
    }
  })
})
