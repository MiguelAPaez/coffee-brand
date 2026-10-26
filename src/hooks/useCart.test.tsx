import { act, render, screen } from '@testing-library/react'
import { CART_KEY, CartProvider, useCart } from '@/hooks/useCart'
import { MAX_QTY } from '@/lib/cart'

const item = { slug: 'la-cumbre', size: '250g', grind: 'Whole bean' } as const

function Probe() {
  const cart = useCart()
  return (
    <div>
      <span data-testid="count">{cart.count}</span>
      <button onClick={() => cart.add(item)}>add</button>
    </div>
  )
}

const mount = () =>
  render(
    <CartProvider>
      <Probe />
    </CartProvider>,
  )

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('CartProvider', () => {
  it('persists added items to localStorage', () => {
    mount()
    act(() => screen.getByText('add').click())
    expect(JSON.parse(localStorage.getItem(CART_KEY) as string).items).toEqual([{ ...item, qty: 1 }])
  })

  it('restores the cart on remount', () => {
    localStorage.setItem(CART_KEY, JSON.stringify({ items: [{ ...item, qty: 3 }] }))
    mount()
    expect(screen.getByTestId('count').textContent).toBe('3')
  })

  it('survives corrupt storage', () => {
    localStorage.setItem(CART_KEY, '{bad')
    mount()
    expect(screen.getByTestId('count').textContent).toBe('0')
  })

  it('still updates when setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    mount()
    act(() => screen.getByText('add').click())
    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('announces additions in a polite live region', () => {
    mount()
    act(() => screen.getByText('add').click())
    const region = screen.getByText(/Added La Cumbre/)
    expect(region.textContent).toBe('Added La Cumbre, 250g, to your bag. 1 item.')
    expect(region.getAttribute('aria-live')).toBe('polite')
  })

  it('announces the cap instead of an addition when the line is already at the maximum', () => {
    localStorage.setItem(CART_KEY, JSON.stringify({ items: [{ ...item, qty: MAX_QTY }] }))
    mount()
    act(() => screen.getByText('add').click())
    expect(screen.getByTestId('count').textContent).toBe(String(MAX_QTY))
    expect(screen.queryByText(/Added/)).toBeNull()
    const region = screen.getByText(/already at the maximum/)
    expect(region.textContent).toBe(`La Cumbre, 250g, is already at the maximum of ${MAX_QTY}.`)
    expect(region.getAttribute('aria-live')).toBe('polite')
  })

  it('syncs from storage events of other tabs', () => {
    mount()
    const next = JSON.stringify({ items: [{ ...item, qty: 2 }] })
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: CART_KEY, newValue: next }))
    })
    expect(screen.getByTestId('count').textContent).toBe('2')
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: CART_KEY, newValue: null }))
    })
    expect(screen.getByTestId('count').textContent).toBe('0')
  })

  it('throws outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow(/CartProvider/)
  })
})
