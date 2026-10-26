import { describe, expect, it } from 'vitest'
import { saveScroll, takeScroll } from '@/lib/scrollMemory'

describe('scrollMemory', () => {
  it('returns a saved position once, then forgets it', () => {
    saveScroll('/a', 420)
    expect(takeScroll('/a')).toBe(420)
    expect(takeScroll('/a')).toBeNull()
  })

  it('returns null for an unknown key', () => {
    expect(takeScroll('/never-saved')).toBeNull()
  })
})
