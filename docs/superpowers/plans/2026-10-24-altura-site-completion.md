# ALTURA Site Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the one-page ALTURA descent into a complete showcase site (Origin, Process, Roasts, Visit, Journal, cart, demo checkout) behind a safety net of lint, unit, browser, a11y and performance checks.

**Architecture:** `wouter` routes in `main.tsx`; the current `App.tsx` becomes `pages/Home.tsx` (eager), every other page is `lazy()`. Inner pages share `SiteLayout` (light opening band → dark content, mirroring Home). Cart state is a pure reducer in `lib/cart.ts` wrapped by a context provider persisted to `localStorage`. All copy and product data live in `src/content/*.ts`.

**Tech Stack:** Vite 5, React 18, TypeScript 5.6, Tailwind 3, wouter 3, Vitest 2 + Testing Library + jsdom, Playwright + @axe-core/playwright, ESLint 9 (flat) + Prettier 3, @lhci/cli, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-24-altura-site-completion-design.md`

## Global Constraints

- No real payments, accounts, backend, CMS or i18n. Checkout never asks for card details.
- The descent on `/` must not change in look or behavior; LCP 1.8 s mobile / CLS 0 must not regress.
- Entry chunk ≤ 60 KB gzip, CSS ≤ 8 KB gzip (budget enforced in Task 16). Every non-home page is `lazy()`.
- Router is `wouter` (not react-router).
- No new image assets: typography, color tokens and CSS only.
- Tokens only from `tailwind.config.ts` (`ink`, `cream`, `cherry`, `mist`, `scene`) plus the cloud base `#e6e4e1` (`BASE_LIGHT`, export it from `src/config.ts`). Fonts: `font-display` (Fraunces 300) for headings, Inter for body.
- Inner page pattern: light band (`#e6e4e1` bg, `text-ink`, uppercase `tracking-[0.3em] text-xs` eyebrow, Fraunces 300 `h1`) then dark content (`bg-scene text-cream`, `text-mist` labels, `divide-cream/15` hairlines).
- Respect `useReducedMotion()` everywhere; only `transform`/`opacity` animate.
- Code style: no semicolons, single quotes, 2-space indent, `@/` imports, named exports for all new components and pages.
- Document titles: `"<Page> — ALTURA"`; Home keeps `"ALTURA — Descent"`.
- Prices are integer US cents, shown via `formatPrice` (`$18.00`).
- localStorage key `altura:cart:v1`; every storage access in try/catch with in-memory fallback.
- Commit after every task; messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Corrupt or stale `altura:cart:v1` (bad JSON, unknown slug, qty out of range) → app loads with a sanitized cart, never crashes. *(test in Task 6)*
2. Direct load / refresh of a deep link (`/roasts/la-cumbre`, `/journal/...`) on `vite preview`, and unknown slugs → page renders, unknown slug shows NotFound. *(test in Task 7 + Task 10)*
3. Visiting `/checkout` with an empty bag, or refreshing `/checkout/confirmed` → redirected to `/cart` / `/roasts` instead of an empty form or a fake order. *(test in Task 14)*
4. Leaving Home mid-descent and coming back → no stale dark navbar / 3D state on inner pages; Back returns to the same scroll position. *(test in Task 7)*
5. Quantity spam (+ past max, − below 1, typed `0`/`abc`) → clamped to 1..10, `setQty(0)` removes the line. *(test in Task 5)*

---

## Phase A — Safety net

### Task 1: ESLint + Prettier

**Files:**
- Create: `eslint.config.js`, `.prettierrc.json`, `.prettierignore`
- Modify: `package.json` (scripts + devDeps), `src/components/Navbar.tsx:4-6` (stray blank lines), all `src/**` (formatting only)

**Interfaces:** Produces scripts `lint`, `format`, `format:check`.

- [ ] **Step 1:** `npm i -D eslint@9 @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh eslint-plugin-jsx-a11y globals prettier@3 eslint-config-prettier`
- [ ] **Step 2:** `eslint.config.js` flat config: ignores `dist`, `node_modules`, `playwright-report`, `test-results`, `.lighthouseci`; extends `js.configs.recommended`, `tseslint.configs.recommended`, `jsxA11y.flatConfigs.recommended`, `reactHooks` recommended rules, `eslint-config-prettier` last. `.prettierrc.json`: `{ "semi": false, "singleQuote": true, "printWidth": 120, "trailingComma": "all" }`. `.prettierignore`: `dist`, `package-lock.json`, `public`, `docs`.
- [ ] **Step 3:** Scripts: `"lint": "eslint ."`, `"format": "prettier --write ."`, `"format:check": "prettier --check ."`.
- [ ] **Step 4:** Run `npm run lint`. Fix real findings without behavior change (remove the blank lines in Navbar). For a11y rules that fire on intentional patterns (e.g. `aria-hidden` on the `<video>`), disable inline with a reason comment rather than changing behavior.
- [ ] **Step 5:** `npm run format`, then `npm run lint && npm run format:check && npm run typecheck && npm run build` → all exit 0.
- [ ] **Step 6:** Manual: `npm run preview`, scroll the descent end to end — unchanged.
- [ ] **Step 7:** Commit `chore: add ESLint + Prettier, format codebase`.

### Task 2: Vitest + first unit tests

**Files:**
- Modify: `vite.config.ts` (add `test` block via `/// <reference types="vitest/config" />`), `package.json`, `tsconfig.app.json` (add `"vitest/globals"`, `"@testing-library/jest-dom"` to `types`)
- Create: `src/test/setup.ts`, `src/lib/math.test.ts`, `src/config.test.ts`

**Interfaces:** Produces scripts `test` (`vitest run`), `test:watch` (`vitest`); test env `jsdom`, `globals: true`, `setupFiles: ['src/test/setup.ts']`, `include: ['src/**/*.test.{ts,tsx}']`.

- [ ] **Step 1:** `npm i -D vitest@2 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event`. `setup.ts` imports `@testing-library/jest-dom/vitest` and calls `cleanup` + `localStorage.clear()` in `afterEach`.
- [ ] **Step 2: Write tests**

```ts
// math.test.ts
expect(clamp(-1)).toBe(0); expect(clamp(2)).toBe(1); expect(clamp(5, 0, 10)).toBe(5)
expect(range(0.5, 0, 1)).toBe(0.5); expect(range(2, 0, 1)).toBe(1)
expect(sectionOpacity(0, 0, 0.18)).toBe(1)          // starts at 0 → visible
expect(sectionOpacity(0.26, 0.26, 0.44)).toBe(0)
expect(sectionOpacity(0.34, 0.26, 0.44)).toBeCloseTo(1)
expect(sectionOpacity(1, 0.9, 1)).toBe(1)           // ends at 1 → no fade out
// config.test.ts — stub innerWidth / navigator.connection
// width 500 → VIDEO_URL_MOBILE; width 1440 → VIDEO_URL; width 1440 + saveData → VIDEO_URL_MOBILE
```

- [ ] **Step 3:** `npm test` → all pass (these cover existing code; confirm a deliberately wrong expectation fails once, then revert).
- [ ] **Step 4:** Commit `test: add Vitest with unit tests for math and video URL selection`.

### Task 3: Playwright + home smoke test

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/home.spec.ts`
- Modify: `package.json`, `.gitignore` (`playwright-report`, `test-results`), `tsconfig.node.json` (include `playwright.config.ts`, `tests`)

**Interfaces:** Produces script `e2e` (`playwright test`). Config: `webServer: { command: 'npm run build && npm run preview -- --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI }`, `baseURL` same, projects `desktop` (Desktop Chrome) and `mobile` (Pixel 7).

- [ ] **Step 1:** `npm i -D @playwright/test && npx playwright install chromium`
- [ ] **Step 2: Write tests** in `home.spec.ts`:
  - `hero renders`: `getByRole('heading', { level: 1, name: 'From the clouds to your cup' })` visible; title `ALTURA — Descent`.
  - `mobile menu traps and returns focus` (mobile project only): click `Open menu` → dialog `Menu` visible → `Escape` → dialog hidden and `Open menu` button focused.
- [ ] **Step 3:** `npm run e2e` → pass on both projects.
- [ ] **Step 4:** Commit `test: add Playwright with home smoke tests`.

### Task 4: `npm run check` + CI

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `package.json`

**Interfaces:** Produces `"check": "npm run typecheck && npm run lint && npm run format:check && npm test && npm run build && npm run e2e"`. Later tasks append `budget` (Task 16) before `e2e`.

- [ ] **Step 1:** Workflow on `push` and `pull_request`: ubuntu-latest, Node 20, `npm ci`, `npx playwright install --with-deps chromium`, `npm run check`; upload `playwright-report` on failure.
- [ ] **Step 2:** `npm run check` locally → exit 0.
- [ ] **Step 3:** Commit `ci: add check script and GitHub Actions workflow`.

---

## Phase B — Complete the features (TDD)

### Task 5: Catalog + cart reducer

**Files:**
- Create: `src/content/roasts.ts`, `src/lib/cart.ts`, `src/lib/cart.test.ts`, `src/lib/format.ts`, `src/lib/format.test.ts`
- Modify: `src/config.ts` (`SPECS`/`FLAVORS` re-exported from the flagship roast so Home is unchanged)

**Interfaces — Produces:**
```ts
// content/roasts.ts
export type Size = '250g' | '1kg'
export type Grind = 'Whole bean' | 'Filter' | 'Espresso'
export type Roast = {
  slug: string; name: string; region: string; level: 'Light' | 'Medium' | 'Dark'
  summary: string; body: string[]
  specs: readonly { label: string; value: string }[]
  flavors: readonly { name: string; note: string }[]
  price: Record<Size, number> // cents
}
export const SIZES: readonly Size[]; export const GRINDS: readonly Grind[]
export const ROASTS: readonly Roast[]      // 4 roasts; first is flagship slug 'la-cumbre' using today's SPECS/FLAVORS
export function getRoast(slug: string): Roast | undefined
// lib/format.ts
export function formatPrice(cents: number): string   // Intl en-US USD → '$18.00'
// lib/cart.ts
export const MAX_QTY = 10
export type CartItem = { slug: string; size: Size; grind: Grind; qty: number }
export type CartState = { items: CartItem[] }
export type CartAction =
  | { type: 'add'; item: Omit<CartItem, 'qty'>; qty?: number }
  | { type: 'setQty'; key: string; qty: number }
  | { type: 'remove'; key: string }
  | { type: 'clear' }
export const lineKey: (i: Pick<CartItem, 'slug' | 'size' | 'grind'>) => string  // `${slug}|${size}|${grind}`
export function cartReducer(s: CartState, a: CartAction): CartState
export function cartCount(s: CartState): number
export function lineTotal(i: CartItem): number      // uses getRoast(i.slug).price[i.size]
export function cartSubtotal(s: CartState): number
export function sanitizeCart(raw: unknown): CartState  // drops unknown slugs/sizes/grinds, clamps qty, non-arrays → empty
```
Prices: 250g 1800–2400 cents, 1kg 6200–8200. Shipping flat `SHIPPING_CENTS = 600`, free at subtotal ≥ 6000 — export `shippingFor(subtotal: number): number` from `lib/cart.ts`.

- [ ] **Step 1: Write failing tests** (`cart.test.ts`):
  - add new line → qty 1; add same key again → qty 2 (one line); add with different grind → two lines
  - `add` with qty 15 → qty `MAX_QTY`; `setQty` 3 → 3; `setQty` 0 → line removed; `setQty` 99 → 10; `setQty` NaN → unchanged
  - `remove`, `clear` → expected items
  - `cartCount` sums qty; `cartSubtotal` = Σ price×qty for flagship 250g×2
  - `shippingFor(5999) === 600`, `shippingFor(6000) === 0`
  - `sanitizeCart('nope')`, `sanitizeCart({ items: [{ slug: 'ghost', size: '250g', grind: 'Filter', qty: 1 }] })` → `{ items: [] }`; qty 40 → 10; qty -2 → line dropped
  - `format.test.ts`: `formatPrice(1800) === '$18.00'`, `formatPrice(0) === '$0.00'`
- [ ] **Step 2:** `npm test` → FAIL (modules missing).
- [ ] **Step 3:** Implement the modules above; write the 4 roasts' copy in brand voice (Quindío, altitudes 1,450–1,900 m, Caturra/Castillo/Pink Bourbon/Gesha, washed/honey/natural).
- [ ] **Step 4:** `npm test` → PASS; `npm run typecheck` → 0.
- [ ] **Step 5:** Commit `feat: add roast catalog and cart reducer`.

### Task 6: Cart provider with persistence

**Files:**
- Create: `src/hooks/useCart.tsx`, `src/hooks/useCart.test.tsx`, `src/lib/storage.ts`

**Interfaces:**
- Consumes: Task 5 `cartReducer`, `sanitizeCart`, `cartCount`, `cartSubtotal`.
- Produces:
```ts
// lib/storage.ts
export function readJSON(key: string, storage?: Storage): unknown      // null on missing/throw/bad JSON
export function writeJSON(key: string, value: unknown, storage?: Storage): void  // swallows errors
// hooks/useCart.tsx
export const CART_KEY = 'altura:cart:v1'
export function CartProvider({ children }: { children: ReactNode }): JSX.Element
export function useCart(): {
  items: CartItem[]; count: number; subtotal: number
  add(item: Omit<CartItem, 'qty'>, qty?: number): void
  setQty(key: string, qty: number): void; remove(key: string): void; clear(): void
  announcement: string   // polite live-region text, e.g. 'Added La Cumbre, 250g, to your bag. 3 items.'
}
```
Initial state = `sanitizeCart(readJSON(CART_KEY))`; write on every change; listen to `storage` events to sync tabs. `CartProvider` renders a visually hidden `<div aria-live="polite">{announcement}</div>`.

- [ ] **Step 1: Write failing tests:** add via a test component → `localStorage[CART_KEY]` contains the item; remount with that storage → count restored; `localStorage[CART_KEY] = '{bad'` → renders with count 0, no throw; `Storage.prototype.setItem` throwing → add still updates count; add → live region text contains roast name.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: add persisted cart provider`.

### Task 7: Router, Home move, nav wiring

**Files:**
- Create: `src/routes.tsx`, `src/pages/Home.tsx` (moved from `src/App.tsx`), `src/pages/NotFound.tsx`, `src/lib/scrollMemory.ts`, `src/lib/scrollMemory.test.ts`, `tests/e2e/navigation.spec.ts`
- Delete: `src/App.tsx`
- Modify: `src/main.tsx`, `src/hooks/useScrollProgress.ts`, `src/components/Navbar.tsx`, `src/components/MobileMenu.tsx`, `src/config.ts`

**Interfaces:**
- Consumes: `CartProvider`, `useCart().count` (Task 6).
- Produces:
```ts
// config.ts
export const NAV = [
  { label: 'Origin', href: '/origin' }, { label: 'Process', href: '/process' }, { label: 'Roasts', href: '/roasts' },
  { label: 'Visit', href: '/visit' }, { label: 'Journal', href: '/journal' },
] as const   // replaces NAV_LINKS
export const BASE_LIGHT = '#e6e4e1'
// routes.tsx — <AppRoutes/>: wouter <Switch> with '/', '/origin', '/process', '/roasts', '/roasts/:slug',
//   '/visit', '/journal', '/journal/:slug', '/cart', '/checkout', '/checkout/confirmed', fallback NotFound.
//   Every page except Home via lazy(() => import(...).then(m => ({ default: m.X }))) inside <Suspense fallback={null}>.
// lib/scrollMemory.ts
export function saveScroll(key: string, y: number): void
export function takeScroll(key: string): number | null   // returns once then forgets
export function useScrollRestoration(): void  // sets history.scrollRestoration='manual'; on popstate restores saved y
                                               // for the new location (after next frame), otherwise scrolls to 0
// pages/NotFound.tsx
export function NotFound(): JSX.Element   // used by routes and by detail pages for unknown slugs
```
Navbar: `NAV` → wouter `<Link href>`; `aria-current="page"` when `useLocation()[0]` starts with `href`; "Shop" → `/roasts`; bag circle becomes a separate `<Link href="/cart" aria-label={`Bag, ${count} ${count === 1 ? 'item' : 'items'}`}>` showing `count`. MobileMenu mirrors it (`Shop (${count})` → `/cart`). Home CTA "Order your first bag" → `<Link href="/roasts">`. `useScrollProgress` cleanup sets `progress.p = 0` and removes the `--p` property.

- [ ] **Step 1: Write failing tests:** `scrollMemory.test.ts` (save/take once, unknown key → null). `navigation.spec.ts`: each `NAV` link (desktop nav; mobile via menu) → URL matches and `h1` visible and link has `aria-current="page"`; `/does-not-exist` → heading "This trail ends here" (NotFound copy) with link home; direct `page.goto('/roasts/la-cumbre')` renders (SPA fallback works); scroll Home to 50%, click Roasts, `goBack()` → `scrollY` within 5% of before, and navbar on `/origin` after leaving Home mid-descent has `text-ink` over the light band.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement (pages other than Home/NotFound can be one-line stubs with an `h1` until their task). **Step 4:** `npm test && npm run e2e` → PASS, Task 3 tests still green.
- [ ] **Step 5:** `npm run build`: entry chunk gzip printed by Vite ≤ 60 KB.
- [ ] **Step 6:** Commit `feat: add routing, wire navbar and CTA to real pages`.

### Task 8: SiteLayout, PageHero, Reveal, Footer

**Files:**
- Create: `src/components/SiteLayout.tsx`, `src/components/PageHero.tsx`, `src/components/Reveal.tsx`, `src/components/Footer.tsx`, `src/hooks/usePageMeta.ts`, `src/components/Reveal.test.tsx`
- Modify: `src/components/Navbar.tsx` (accept `position?: 'overlay' | 'fixed'`, default `'overlay'` = current behavior)

**Interfaces:**
```ts
export function SiteLayout(props: { children: ReactNode }): JSX.Element
  // fixed header wrapper (pointer-events-none, z-30) with <Navbar position="fixed" dark={pastHero} />,
  // <main id="main">, <Footer/>. pastHero = IntersectionObserver on [data-page-hero] no longer under the header.
export function PageHero(props: { eyebrow: string; title: string; lede?: string }): JSX.Element
  // light band: bg BASE_LIGHT, text-ink, pt-40 pb-24, data-page-hero, h1 tabIndex={-1}, uses Stagger inside a revealed wrapper
export function Reveal(props: { as?: ElementType; className?: string; children: ReactNode }): JSX.Element
  // sets data-revealed='true' once ≥15% in view (IntersectionObserver, disconnects after); immediately when reduced motion
  // or IntersectionObserver missing. Lets existing <Stagger> + .stagger-item CSS work outside <Section>.
export function Footer(): JSX.Element   // dark; address (Finca La Cumbre, Salento, Quindío), NAV links, © {year} ALTURA
export function usePageMeta(title: string): void  // document.title = `${title} — ALTURA`; focuses the page h1 on mount
```

- [ ] **Step 1: Write failing tests:** `Reveal.test.tsx` with a mocked `IntersectionObserver`: initially `data-revealed="false"`; trigger intersection → `"true"`; with `matchMedia` reduced → `"true"` immediately; no `IntersectionObserver` global → `"true"`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement; switch the stub pages from Task 7 to `SiteLayout` + `PageHero`. **Step 4:** Run → PASS; e2e still green.
- [ ] **Step 5:** Commit `feat: add shared inner-page layout`.

### Task 9: Origin + Process pages

**Files:**
- Create: `src/content/origin.ts`, `src/content/process.ts`, `src/pages/Origin.tsx`, `src/pages/Process.tsx`
- Test: extend `tests/e2e/navigation.spec.ts`

**Interfaces:** `content/process.ts` exports `STEPS: readonly { n: string; title: string; body: string }[]` (Picking, Washing, Drying, Roasting — `n` = '01'..'04'). `content/origin.ts` exports `ORIGIN: { sections: readonly { heading: string; body: string[] }[]; facts: readonly { label: string; value: string }[] }`.

- [ ] **Step 1: Failing e2e:** `/process` shows 4 `listitem`s in an ordered list named "Process steps", headings in order; `/origin` shows the facts `dl` with "Altitude".
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement — Origin: editorial two-column (facts `dl` left, long-form right on `lg`); Process: `<ol aria-label="Process steps">` with large Fraunces numerals, each item in a `Reveal`. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: add Origin and Process pages`.

### Task 10: Roasts list + detail

**Files:**
- Create: `src/pages/Roasts.tsx`, `src/pages/RoastDetail.tsx`, `src/components/QtyStepper.tsx`, `src/components/QtyStepper.test.tsx`, `tests/e2e/shop.spec.ts`

**Interfaces:**
- Consumes: `ROASTS`, `getRoast`, `SIZES`, `GRINDS` (Task 5), `useCart().add` (Task 6), `formatPrice`, `NotFound` (Task 7).
- Produces: `QtyStepper(props: { value: number; onChange(n: number): void; label: string; min?: number; max?: number })` — − / input / + buttons, clamps to `[min=1, max=MAX_QTY]`, ignores non-numeric input. Reused by Cart (Task 13).

Roasts grid: card per roast (name, region, level, flavor names, "from $18.00", link to detail, "Add to bag" = 250g Whole bean). Detail: specs `dl`, flavor list, size + grind as radio groups (`fieldset`/`legend`), `QtyStepper`, price updates with size, "Add to bag" button. Unknown slug → `<NotFound/>`.

- [ ] **Step 1: Failing tests:** `QtyStepper.test.tsx` (+ at 10 stays 10, − at 1 stays 1, typing `abc` keeps value, typing `4` → onChange(4)). `shop.spec.ts`: `/roasts` lists 4 roast cards; quick-add → bag link label `Bag, 1 item`; detail: choose 1kg + Espresso + qty 2 → add → bag count 3, price shows 1kg price; `/roasts/ghost` → NotFound heading.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: add Roasts list and detail pages`.

### Task 11: Journal list + article

**Files:**
- Create: `src/content/journal.ts`, `src/pages/Journal.tsx`, `src/pages/Article.tsx`
- Test: extend `tests/e2e/navigation.spec.ts`

**Interfaces:** `export type Article = { slug: string; title: string; date: string /* ISO */; readMins: number; excerpt: string; body: string[] }`; `ARTICLES` (4, newest first), `getArticle(slug)`. Dates shown with `Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' })` in a `<time dateTime>`.

- [ ] **Step 1: Failing e2e:** `/journal` shows 4 `article` elements; clicking the first opens `/journal/<slug>` with matching `h1`; `/journal/ghost` → NotFound.
- [ ] **Step 2:** FAIL. **Step 3:** Implement (article body max-w-[65ch], Fraunces headings, "Back to Journal" link). **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: add Journal pages`.

### Task 12: Visit page + form validation

**Files:**
- Create: `src/lib/forms.ts`, `src/lib/forms.test.ts`, `src/components/Field.tsx`, `src/content/visit.ts`, `src/pages/Visit.tsx`
- Test: `tests/e2e/visit.spec.ts`

**Interfaces — Produces (reused by Task 14):**
```ts
export type Errors<T> = Partial<Record<keyof T, string>>
export type ContactValues = { name: string; email: string; message: string }
export function validateContact(v: ContactValues): Errors<ContactValues>
export const isEmail: (s: string) => boolean
export function Field(props: { label: string; name: string; error?: string; as?: 'input' | 'textarea' } & InputHTMLAttributes<...>): JSX.Element
  // label + control + error text linked via aria-describedby, aria-invalid when error
```
Messages: `'Please tell us your name.'`, `'Enter a valid email address.'`, `'Write a message of at least 10 characters.'`. Visit content: address, hours table, a short "how to get there". Submit: validate → focus first invalid field; valid → replace form with "Message received — we'll write back within two days." (role="status"). Nothing is sent.

- [ ] **Step 1: Failing tests:** `forms.test.ts` (empty → 3 errors with exact messages; `a@b` invalid; valid → `{}`; whitespace-only name invalid). `visit.spec.ts`: submit empty → first field focused + 3 error texts; fill valid → status text visible.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: add Visit page with contact form`.

### Task 13: Cart page

**Files:**
- Create: `src/pages/Cart.tsx`
- Test: extend `tests/e2e/shop.spec.ts`

**Interfaces:** Consumes `useCart`, `lineTotal`, `shippingFor`, `QtyStepper`, `formatPrice`, `getRoast`.

Line items (name link, size · grind, `QtyStepper`, line total, Remove button `aria-label="Remove <name> <size>"`), summary (subtotal, shipping or "Free", total), "Checkout" link → `/checkout`. Empty state: "Your bag is empty" + link "Browse roasts" → `/roasts`.

- [ ] **Step 1: Failing e2e:** empty `/cart` shows empty state; add 2 items → cart shows both, + updates line total and navbar count; Remove → line gone; reload `/cart` → items persist.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: add Cart page`.

### Task 14: Checkout + confirmation

**Files:**
- Create: `src/pages/Checkout.tsx`, `src/pages/Confirmed.tsx`
- Modify: `src/lib/forms.ts`, `src/lib/forms.test.ts`
- Test: `tests/e2e/checkout.spec.ts`

**Interfaces:**
```ts
export type ShippingValues = { name: string; email: string; address: string; city: string; postcode: string; country: string }
export function validateShipping(v: ShippingValues): Errors<ShippingValues>
export const ORDER_KEY = 'altura:lastOrder'          // sessionStorage
export function makeOrderNumber(rand?: () => number): string   // 'ALT-' + 6 uppercase base36 chars
```
Checkout: if `count === 0` → `<Redirect to="/cart" />`. Shipping form (Field), order summary, a clear note "This is a demo store — no payment is taken." "Place order" → validate → write `{ number, items, total }` to `ORDER_KEY`, `clear()` cart, navigate `/checkout/confirmed`. Confirmed: read `ORDER_KEY`; missing → `<Redirect to="/roasts" />`; else show "Thank you" + order number + items, and a link back to Home.

- [ ] **Step 1: Failing tests:** `forms.test.ts` (`validateShipping` empty → 6 errors; postcode `''` invalid; valid → `{}`; `makeOrderNumber(() => 0.5)` matches `/^ALT-[0-9A-Z]{6}$/`). `checkout.spec.ts`: empty bag `/checkout` → URL `/cart`; full flow add → cart → checkout → fill → place → confirmed shows `ALT-`, navbar bag 0; reload `/checkout/confirmed` in a fresh context → URL `/roasts`.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: add demo checkout and confirmation`.

---

## Phase C — Keep it fast & accessible

### Task 15: Axe scan on every route

**Files:**
- Create: `tests/e2e/a11y.spec.ts`

- [ ] **Step 1:** `npm i -D @axe-core/playwright`. Test loops routes `['/', '/origin', '/process', '/roasts', '/roasts/la-cumbre', '/visit', '/journal', '/journal/<first slug>', '/cart', '/does-not-exist']` plus `/checkout` with a seeded cart (`addInitScript` writing `altura:cart:v1`), on both projects: `new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()` → no violations with impact `serious` or `critical`. Also: open mobile menu → scan the dialog.
- [ ] **Step 2:** Run → fix any violations in the pages (contrast of `mist` on light band is a likely one — use `text-ink/70` there).
- [ ] **Step 3:** PASS. Commit `test: add axe accessibility scan for all routes`.

### Task 16: Bundle budget

**Files:**
- Create: `scripts/budget.mjs`
- Modify: `package.json`

**Interfaces:** `"budget": "node scripts/budget.mjs"`; `check` becomes `… && npm run build && npm run budget && npm run e2e`.

- [ ] **Step 1:** Script reads `dist/index.html`, finds the entry `<script type="module" src>` and `<link rel="stylesheet">` (plus any `modulepreload`s — they load with the first page), gzips each with `node:zlib` `gzipSync` level 9, prints a table, exits 1 if JS > 60 KB or CSS > 8 KB.
- [ ] **Step 2:** Verify: `npm run build && npm run budget` → passes; temporarily set the JS limit to 10 KB → exits 1; revert.
- [ ] **Step 3:** Commit `chore: add bundle size budget`.

### Task 17: Lighthouse CI, CI wiring, README

**Files:**
- Create: `lighthouserc.cjs`
- Modify: `package.json`, `.github/workflows/ci.yml`, `.gitignore` (`.lighthouseci`), `README.md`

**Interfaces:** `"check:perf": "lhci autorun"` (strict config); CI step `lhci autorun` with env `LHCI_MODE=ci` that downgrades performance assertions to `warn`.

- [ ] **Step 1:** `npm i -D @lhci/cli`. `lighthouserc.cjs`: `collect.startServerCommand: 'npm run preview -- --port 4173'`, urls `/`, `/roasts`, `/roasts/la-cumbre`, `/checkout`, `numberOfRuns: 3`; assertions `categories:accessibility` `['error', { minScore: 1 }]`, `categories:performance` `minScore 0.95`, `categories:best-practices` `minScore 0.95`, `cumulative-layout-shift` `maxNumericValue 0.05` — the last three `warn` when `process.env.LHCI_MODE === 'ci'`, else `error`. Mobile emulation default (simulated Slow 4G).
- [ ] **Step 2:** `npm run build && npm run check:perf` → all assertions pass locally; `/` scores within ±2 of the README table. Fix regressions if not.
- [ ] **Step 3:** Add Lighthouse step to `ci.yml` after `npm run check`.
- [ ] **Step 4:** README: new "Pages" section (route table), "Cart & checkout (demo)" section (storage key, no payment), "Quality checks" section (`check`, `e2e`, `budget`, `check:perf`), update the Architecture tree and the measured-results table with the new numbers.
- [ ] **Step 5:** Final verification: `npm run check` → exit 0; manual browser pass — descent scrubs and hands off to 3D, every nav link on desktop + mobile, full cart → checkout → confirmation, reload keeps bag, keyboard-only and reduced-motion (DevTools emulation) on all pages.
- [ ] **Step 6:** Commit `chore: add Lighthouse CI and document pages and checks`.
