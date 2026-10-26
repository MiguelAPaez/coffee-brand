import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Reveal } from '@/components/Reveal'

type IOCallback = (entries: Partial<IntersectionObserverEntry>[]) => void
let callback: IOCallback | null = null
const disconnect = vi.fn()

function mockMatchMedia(reduced: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduced && query.includes('reduce'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

describe('Reveal', () => {
  beforeEach(() => {
    callback = null
    disconnect.mockClear()
    mockMatchMedia(false)
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IOCallback) {
          callback = cb
        }
        observe() {}
        unobserve() {}
        disconnect = disconnect
      },
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('starts hidden and reveals once intersecting, then disconnects', () => {
    render(<Reveal>hello</Reveal>)
    const el = screen.getByText('hello')
    expect(el).toHaveAttribute('data-revealed', 'false')
    act(() => callback?.([{ isIntersecting: true }]))
    expect(el).toHaveAttribute('data-revealed', 'true')
    expect(disconnect).toHaveBeenCalled()
  })

  it('stays hidden for a non-intersecting callback', () => {
    render(<Reveal>hello</Reveal>)
    act(() => callback?.([{ isIntersecting: false }]))
    expect(screen.getByText('hello')).toHaveAttribute('data-revealed', 'false')
  })

  it('reveals immediately under reduced motion', () => {
    mockMatchMedia(true)
    render(<Reveal>hello</Reveal>)
    expect(screen.getByText('hello')).toHaveAttribute('data-revealed', 'true')
  })

  it('reveals immediately without IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    render(<Reveal>hello</Reveal>)
    expect(screen.getByText('hello')).toHaveAttribute('data-revealed', 'true')
  })
})
