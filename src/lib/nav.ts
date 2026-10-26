/** A nav link is current on its own path and on any child path (/roasts marks /roasts/la-cumbre). */
export function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

let navigated = false
/** Set once the visitor has moved between routes, so a direct page load can be told apart from navigation. */
export const markNavigated = () => {
  navigated = true
}
export const hasNavigated = () => navigated
