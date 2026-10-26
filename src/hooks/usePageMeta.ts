import { useEffect } from 'react'
import { hasNavigated } from '@/lib/nav'

/** Sets the document title and, after a client-side navigation, moves focus to the page h1. */
export function usePageMeta(title: string): void {
  useEffect(() => {
    document.title = `${title} — ALTURA`
    // A direct load keeps the browser's default focus; only in-app navigations announce the new page.
    if (!hasNavigated()) return
    const h1 = document.querySelector('h1')
    if (!h1) return
    h1.tabIndex = -1
    h1.focus({ preventScroll: true })
  }, [title])
}
