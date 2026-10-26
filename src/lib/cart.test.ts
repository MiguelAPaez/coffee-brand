import {
  MAX_QTY,
  cartCount,
  cartReducer,
  cartSubtotal,
  lineKey,
  lineTotal,
  sanitizeCart,
  shippingFor,
  type CartItem,
  type CartState,
} from '@/lib/cart'
import { getRoast } from '@/content/roasts'

const base = { slug: 'la-cumbre', size: '250g', grind: 'Whole bean' } as const
const empty: CartState = { items: [] }
const one = (qty: number): CartState => ({ items: [{ ...base, qty }] })

describe('cartReducer', () => {
  it('adds a new line with qty 1', () => {
    expect(cartReducer(empty, { type: 'add', item: base }).items).toEqual([{ ...base, qty: 1 }])
  })

  it('merges adds with the same key', () => {
    const s = cartReducer(cartReducer(empty, { type: 'add', item: base }), { type: 'add', item: base })
    expect(s.items).toEqual([{ ...base, qty: 2 }])
  })

  it('keeps different grinds as separate lines', () => {
    const s = cartReducer(cartReducer(empty, { type: 'add', item: base }), {
      type: 'add',
      item: { ...base, grind: 'Filter' },
    })
    expect(s.items).toHaveLength(2)
  })

  it('clamps add to MAX_QTY', () => {
    expect(cartReducer(empty, { type: 'add', item: base, qty: 15 }).items[0].qty).toBe(MAX_QTY)
    expect(cartReducer(one(8), { type: 'add', item: base, qty: 5 }).items[0].qty).toBe(MAX_QTY)
  })

  it('add to a line already at MAX_QTY returns the same state', () => {
    const s = one(MAX_QTY)
    expect(cartReducer(s, { type: 'add', item: base })).toBe(s)
    expect(cartReducer(s, { type: 'add', item: base, qty: 3 })).toBe(s)
  })

  it('setQty sets, removes at 0, clamps, ignores NaN', () => {
    const key = lineKey(base)
    expect(cartReducer(one(1), { type: 'setQty', key, qty: 3 }).items[0].qty).toBe(3)
    expect(cartReducer(one(1), { type: 'setQty', key, qty: 0 }).items).toEqual([])
    expect(cartReducer(one(1), { type: 'setQty', key, qty: 99 }).items[0].qty).toBe(10)
    const s = one(2)
    expect(cartReducer(s, { type: 'setQty', key, qty: NaN })).toBe(s)
  })

  it('setQty removes the line for negative and fractional-below-1 qty', () => {
    const key = lineKey(base)
    expect(cartReducer(one(2), { type: 'setQty', key, qty: -3 }).items).toEqual([])
    expect(cartReducer(one(2), { type: 'setQty', key, qty: 0.5 }).items).toEqual([])
  })

  it('add with qty 0 or NaN is a no-op', () => {
    const s = one(2)
    expect(cartReducer(s, { type: 'add', item: base, qty: 0 })).toBe(s)
    expect(cartReducer(s, { type: 'add', item: base, qty: NaN })).toBe(s)
  })

  it('removes and clears', () => {
    expect(cartReducer(one(2), { type: 'remove', key: lineKey(base) }).items).toEqual([])
    expect(cartReducer(one(2), { type: 'clear' }).items).toEqual([])
  })
})

describe('selectors', () => {
  it('counts and totals', () => {
    const s: CartState = {
      items: [
        { ...base, qty: 2 },
        { ...base, grind: 'Filter', qty: 1 },
      ],
    }
    expect(cartCount(s)).toBe(3)
    const price = getRoast('la-cumbre')!.price['250g']
    expect(cartSubtotal(one(2))).toBe(price * 2)
  })

  it('lineTotal is 0 for an unknown slug', () => {
    expect(lineTotal({ ...base, slug: 'ghost', qty: 2 })).toBe(0)
  })

  it('shipping is flat below 6000 and free at or above', () => {
    expect(shippingFor(5999)).toBe(600)
    expect(shippingFor(6000)).toBe(0)
  })
})

describe('sanitizeCart', () => {
  const line = (over: Partial<Record<keyof CartItem, unknown>>) => ({ ...base, qty: 1, ...over })

  it('returns empty for junk', () => {
    expect(sanitizeCart('nope')).toEqual(empty)
    expect(sanitizeCart(null)).toEqual(empty)
    expect(sanitizeCart({ items: 'x' })).toEqual(empty)
  })

  it('drops unknown slugs, sizes and grinds', () => {
    expect(sanitizeCart({ items: [line({ slug: 'ghost' })] })).toEqual(empty)
    expect(sanitizeCart({ items: [line({ size: '2kg' })] })).toEqual(empty)
    expect(sanitizeCart({ items: [line({ grind: 'Turkish' })] })).toEqual(empty)
  })

  it('clamps, floors and drops quantities', () => {
    expect(sanitizeCart({ items: [line({ qty: 40 })] }).items[0].qty).toBe(10)
    expect(sanitizeCart({ items: [line({ qty: 2.9 })] }).items[0].qty).toBe(2)
    expect(sanitizeCart({ items: [line({ qty: -2 })] })).toEqual(empty)
    expect(sanitizeCart({ items: [line({ qty: 0.5 })] })).toEqual(empty)
    expect(sanitizeCart({ items: [line({ qty: '3' })] })).toEqual(empty)
  })

  it('merges duplicate keys', () => {
    const s = sanitizeCart({ items: [line({ qty: 4 }), line({ qty: 9 })] })
    expect(s.items).toEqual([{ ...base, qty: 10 }])
  })
})
