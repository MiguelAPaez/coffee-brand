import { render, screen } from '@testing-library/react'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'
import { describe, expect, it } from 'vitest'
import { Navbar } from '@/components/Navbar'
import { CartProvider } from '@/hooks/useCart'
import { NAV } from '@/config'

function renderAt(path: string) {
  const { hook } = memoryLocation({ path })
  render(
    <Router hook={hook}>
      <CartProvider>
        <Navbar dark={false} />
      </CartProvider>
    </Router>,
  )
}

describe('Navbar', () => {
  it.each(NAV)('marks $label as current on $href', ({ label, href }) => {
    renderAt(href)
    const links = screen.getAllByRole('link', { name: label })
    expect(links.length).toBeGreaterThan(0)
    for (const l of links) expect(l).toHaveAttribute('aria-current', 'page')
  })

  it('marks Roasts current on a roast detail path', () => {
    renderAt('/roasts/la-cumbre')
    expect(screen.getAllByRole('link', { name: 'Roasts' })[0]).toHaveAttribute('aria-current', 'page')
    expect(screen.getAllByRole('link', { name: 'Origin' })[0]).not.toHaveAttribute('aria-current')
  })

  it('does not mark a prefix lookalike as current', () => {
    renderAt('/roastsfoo')
    expect(screen.getAllByRole('link', { name: 'Roasts' })[0]).not.toHaveAttribute('aria-current')
  })

  it('exposes the bag count in the cart link label', () => {
    renderAt('/')
    expect(screen.getByRole('link', { name: 'Bag, 0 items' })).toHaveAttribute('href', '/cart')
  })
})
