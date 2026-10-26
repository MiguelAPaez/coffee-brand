export type StorageKind = 'local' | 'session'

// Resolved lazily, inside the callers' try: merely touching the global throws SecurityError when site data is blocked.
const resolve = (kind: StorageKind): Storage => (kind === 'session' ? sessionStorage : localStorage)

export function readJSON(key: string, kind: StorageKind = 'local'): unknown {
  try {
    const raw = resolve(kind).getItem(key)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

/** Returns false when the value could not be stored (private mode, quota, blocked site data). */
export function writeJSON(key: string, value: unknown, kind: StorageKind = 'local'): boolean {
  try {
    resolve(kind).setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
