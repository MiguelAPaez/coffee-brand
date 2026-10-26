import { GRINDS, SIZES, getRoast, type Grind, type Size } from '@/content/roasts'

export const MAX_QTY = 10
export const SHIPPING_CENTS = 600
const FREE_SHIPPING_FROM = 6000

export type CartItem = { slug: string; size: Size; grind: Grind; qty: number }
export type CartState = { items: CartItem[] }
export type CartAction =
  | { type: 'add'; item: Omit<CartItem, 'qty'>; qty?: number }
  | { type: 'setQty'; key: string; qty: number }
  | { type: 'remove'; key: string }
  | { type: 'clear' }

export const lineKey = (i: Pick<CartItem, 'slug' | 'size' | 'grind'>): string => `${i.slug}|${i.size}|${i.grind}`

const clampQty = (n: number): number => Math.min(MAX_QTY, n)

export function cartReducer(s: CartState, a: CartAction): CartState {
  switch (a.type) {
    case 'add': {
      const add = a.qty ?? 1
      if (!Number.isFinite(add) || add < 1) return s
      const key = lineKey(a.item)
      const found = s.items.find((i) => lineKey(i) === key)
      // Same object back when nothing changes, so the provider can tell a capped add from a real one.
      if (found?.qty === MAX_QTY) return s
      if (!found) return { items: [...s.items, { ...a.item, qty: clampQty(Math.floor(add)) }] }
      return { items: s.items.map((i) => (lineKey(i) === key ? { ...i, qty: clampQty(i.qty + Math.floor(add)) } : i)) }
    }
    case 'setQty': {
      if (!Number.isFinite(a.qty)) return s
      const whole = Math.floor(a.qty)
      if (whole < 1) return { items: s.items.filter((i) => lineKey(i) !== a.key) }
      const qty = clampQty(whole)
      return { items: s.items.map((i) => (lineKey(i) === a.key ? { ...i, qty } : i)) }
    }
    case 'remove':
      return { items: s.items.filter((i) => lineKey(i) !== a.key) }
    case 'clear':
      return { items: [] }
  }
}

export const cartCount = (s: CartState): number => s.items.reduce((n, i) => n + i.qty, 0)

export function lineTotal(i: CartItem): number {
  const roast = getRoast(i.slug)
  return roast ? roast.price[i.size] * i.qty : 0
}

export const cartSubtotal = (s: CartState): number => s.items.reduce((n, i) => n + lineTotal(i), 0)

export const shippingFor = (subtotal: number): number => (subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_CENTS)

/** Rebuilds a cart from untrusted storage: anything not recognisably valid is dropped, never thrown on. */
export function sanitizeCart(raw: unknown): CartState {
  const list = (raw as { items?: unknown } | null)?.items
  if (!Array.isArray(list)) return { items: [] }
  const merged = new Map<string, CartItem>()
  for (const entry of list) {
    if (typeof entry !== 'object' || entry === null) continue
    const { slug, size, grind, qty } = entry as Record<string, unknown>
    if (typeof slug !== 'string' || !getRoast(slug)) continue
    if (!SIZES.includes(size as Size) || !GRINDS.includes(grind as Grind)) continue
    if (typeof qty !== 'number' || !Number.isFinite(qty)) continue
    const whole = Math.floor(qty)
    if (whole < 1) continue
    const item: CartItem = { slug, size: size as Size, grind: grind as Grind, qty: clampQty(whole) }
    const key = lineKey(item)
    const prev = merged.get(key)
    merged.set(key, prev ? { ...prev, qty: clampQty(prev.qty + item.qty) } : item)
  }
  return { items: [...merged.values()] }
}
