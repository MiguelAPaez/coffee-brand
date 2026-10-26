import { readJSON, writeJSON } from '@/lib/storage'

/** Makes the global throw on access, as browsers do when site data is blocked. Returns the restore function. */
function blockStorage(name: 'localStorage' | 'sessionStorage'): () => void {
  const original = Object.getOwnPropertyDescriptor(window, name)!
  Object.defineProperty(window, name, {
    get() {
      throw new DOMException('blocked', 'SecurityError')
    },
    configurable: true,
  })
  return () => Object.defineProperty(window, name, original)
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('readJSON / writeJSON', () => {
  it('round-trips through localStorage by default', () => {
    expect(writeJSON('k', { a: 1 })).toBe(true)
    expect(JSON.parse(localStorage.getItem('k') as string)).toEqual({ a: 1 })
    expect(readJSON('k')).toEqual({ a: 1 })
  })

  it('uses sessionStorage for the session kind', () => {
    expect(writeJSON('k', [1], 'session')).toBe(true)
    expect(sessionStorage.getItem('k')).toBe('[1]')
    expect(localStorage.getItem('k')).toBeNull()
    expect(readJSON('k', 'session')).toEqual([1])
  })

  it('returns null for missing or corrupt values', () => {
    expect(readJSON('missing')).toBeNull()
    localStorage.setItem('bad', '{')
    expect(readJSON('bad')).toBeNull()
  })

  it('degrades without throwing when sessionStorage access is blocked', () => {
    const restore = blockStorage('sessionStorage')
    try {
      expect(readJSON('k', 'session')).toBeNull()
      expect(writeJSON('k', 1, 'session')).toBe(false)
    } finally {
      restore()
    }
  })

  it('degrades without throwing when localStorage access is blocked', () => {
    const restore = blockStorage('localStorage')
    try {
      expect(readJSON('k')).toBeNull()
      expect(writeJSON('k', 1)).toBe(false)
    } finally {
      restore()
    }
  })
})
