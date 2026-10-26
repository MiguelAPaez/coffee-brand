/* eslint-disable react-refresh/only-export-components -- provider and its hook belong together */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import {
  MAX_QTY,
  cartCount,
  cartReducer,
  cartSubtotal,
  lineKey,
  sanitizeCart,
  type CartAction,
  type CartItem,
  type CartState,
} from '@/lib/cart'
import { getRoast } from '@/content/roasts'
import { readJSON, writeJSON } from '@/lib/storage'

export const CART_KEY = 'altura:cart:v1'

type State = { cart: CartState; announcement: string }
// 'replace' is internal: it carries another tab's cart in without touching the public reducer.
type Action = CartAction | { type: 'replace'; cart: CartState }

function reducer(s: State, a: Action): State {
  if (a.type === 'replace') return { cart: a.cart, announcement: '' }
  const cart = cartReducer(s.cart, a)
  if (a.type !== 'add') return { cart, announcement: s.announcement }
  const roast = getRoast(a.item.slug)
  if (!roast) return { cart, announcement: s.announcement }
  if (cart === s.cart) {
    const key = lineKey(a.item)
    const capped = cart.items.some((i) => lineKey(i) === key && i.qty === MAX_QTY)
    if (!capped) return s
    return { cart, announcement: `${roast.name}, ${a.item.size}, is already at the maximum of ${MAX_QTY}.` }
  }
  const count = cartCount(cart)
  return {
    cart,
    announcement: `Added ${roast.name}, ${a.item.size}, to your bag. ${count} ${count === 1 ? 'item' : 'items'}.`,
  }
}

type CartApi = {
  items: CartItem[]
  count: number
  subtotal: number
  add(item: Omit<CartItem, 'qty'>, qty?: number): void
  setQty(key: string, qty: number): void
  remove(key: string): void
  clear(): void
  announcement: string
}

const CartContext = createContext<CartApi | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    cart: sanitizeCart(readJSON(CART_KEY)),
    announcement: '',
  }))

  useEffect(() => {
    writeJSON(CART_KEY, state.cart)
  }, [state.cart])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== CART_KEY) return
      let raw: unknown = null
      try {
        raw = e.newValue === null ? null : JSON.parse(e.newValue)
      } catch {
        // sanitizeCart turns the null into an empty bag
      }
      dispatch({ type: 'replace', cart: sanitizeCart(raw) })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const add = useCallback((item: Omit<CartItem, 'qty'>, qty?: number) => dispatch({ type: 'add', item, qty }), [])
  const setQty = useCallback((key: string, qty: number) => dispatch({ type: 'setQty', key, qty }), [])
  const remove = useCallback((key: string) => dispatch({ type: 'remove', key }), [])
  const clear = useCallback(() => dispatch({ type: 'clear' }), [])

  const api = useMemo<CartApi>(
    () => ({
      items: state.cart.items,
      count: cartCount(state.cart),
      subtotal: cartSubtotal(state.cart),
      add,
      setQty,
      remove,
      clear,
      announcement: state.announcement,
    }),
    [state, add, setQty, remove, clear],
  )

  return (
    <CartContext.Provider value={api}>
      {children}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {state.announcement}
      </div>
    </CartContext.Provider>
  )
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside a <CartProvider>')
  return ctx
}
