import { GRINDS, SIZES, getRoast, type Grind, type Size } from '@/content/roasts'
import type { CartItem } from '@/lib/cart'
import { readJSON, writeJSON } from '@/lib/storage'

export const ORDER_KEY = 'altura:lastOrder' // sessionStorage

export type StoredOrder = { number: string; items: CartItem[]; total: number }

export function makeOrderNumber(rand: () => number = Math.random): string {
  let id = ''
  for (let i = 0; i < 6; i++) id += Math.floor(rand() * 36).toString(36)
  return `ALT-${id.toUpperCase()}`
}

const isItem = (e: unknown): e is CartItem => {
  if (typeof e !== 'object' || e === null) return false
  const { slug, size, grind, qty } = e as Record<string, unknown>
  return (
    typeof slug === 'string' &&
    !!getRoast(slug) &&
    SIZES.includes(size as Size) &&
    GRINDS.includes(grind as Grind) &&
    typeof qty === 'number' &&
    Number.isInteger(qty) &&
    qty >= 1
  )
}

// The last order placed in this page session, so the confirmation renders even when sessionStorage is unavailable.
let lastOrder: StoredOrder | null = null

export function saveOrder(order: StoredOrder): void {
  lastOrder = order
  writeJSON(ORDER_KEY, order, 'session')
}

/** The confirmation page trusts nothing in sessionStorage: a malformed order reads as "no order". */
export function readOrder(): StoredOrder | null {
  const raw = (readJSON(ORDER_KEY, 'session') ?? lastOrder) as Partial<StoredOrder> | null
  if (!raw || typeof raw.number !== 'string' || !/^ALT-[0-9A-Z]{6}$/.test(raw.number)) return null
  if (!Array.isArray(raw.items) || raw.items.length === 0 || !raw.items.every(isItem)) return null
  if (typeof raw.total !== 'number' || !Number.isFinite(raw.total)) return null
  return { number: raw.number, items: raw.items, total: raw.total }
}
