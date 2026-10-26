# ALTURA — complete the site + add a quality safety net

## Context

ALTURA (`coffee_brand/`) is a polished one-page scroll experience (Vite 5, React 18, TS, Tailwind 3, three/r3f). The descent itself is done (Lighthouse 99–100, strong a11y), but everything around it is a placeholder:

- Nav links **Origin, Process, Roasts, Visit, Journal** (`src/config.ts:47`) all point to `href="#"` in `src/components/Navbar.tsx:37` and `src/components/MobileMenu.tsx:105`; "Origin" is always `aria-current="page"`.
- **Shop** + bag count is hard-coded `0` (`Navbar.tsx:46-55`, `MobileMenu.tsx:115`).
- **"Order your first bag"** CTA → `#` (`src/App.tsx:244`).
- No router, no git repo, no linter/formatter, no tests, no CI.

The user wants two projects, done one after the other:
1. **Complete the features** — separate full pages + a showcase (demo) shop.
2. **Improve quality** — a safety net (git, lint, tests, CI) and automated guards that keep the site fast and accessible.

Decided with the user: separate pages (not more scroll sections); shop is **showcase/demo** (working cart, fake checkout, no payment); scope of pages below is approved; quality = "safety net" + "keep it fast & accessible" (not refactoring for its own sake, not visual redesign).

**Order (my call):** Phase A (safety net) first, small and quick, so the feature work in Phase B is built test-first and every page lands under lint/test/a11y checks. Phase C locks performance/a11y budgets once the pages exist.

---

## Phase A — Safety net (foundation)

1. `git init`, sensible `.gitignore` (already ignores node_modules/dist — verify), initial commit of the current state as the baseline.
2. **ESLint** (flat config: `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`) + **Prettier** matching the current style (no semicolons, single quotes, 2-space, ~120 cols — confirm from existing files). Scripts: `lint`, `format`, `format:check`. Fix the stray blank lines in `Navbar.tsx:4-6` and anything lint flags without changing behavior.
3. **Vitest** + `@testing-library/react` + `jsdom`. Scripts: `test`, `test:watch`. First tests for existing pure logic: `src/lib/math.ts` (clamp/range/sectionOpacity), `pickVideoUrl` in `src/config.ts`.
4. **Playwright** (Chromium) running against `vite preview`. First smoke test: home loads, hero `h1` visible, mobile menu opens/closes with Escape and returns focus.
5. **CI**: GitHub Actions workflow (`typecheck`, `lint`, `format:check`, `test`, `build`, Playwright) — committed now, runs once a remote exists. Plus one local `npm run check` that runs the same sequence.

## Phase B — Complete the features (TDD per superpowers:test-driven-development)

### Routing & layout
- Add `wouter` (see builder's calls). `main.tsx` renders the router + cart provider.
- Move the current `App.tsx` content to `src/pages/Home.tsx` unchanged in behavior. Its scroll machinery (`useScrollProgress`, `progress` store, raf subscriptions) must clean up on unmount and reset `progress.p = 0`, so other pages don't inherit a stale dark state.
- Every non-home page is `lazy()`-loaded so the home entry chunk stays ≈55 KB gzip.
- `src/components/SiteLayout.tsx`: shared shell for inner pages — header in normal flow (not the absolute overlay used over the video), `<main>`, footer (address, small nav, © ALTURA). Scroll-to-top on forward navigation (Back restores position); focus moves to the page `h1` for screen readers; per-page `document.title`.
- `Navbar`: links become router `Link`s; `aria-current` follows the actual route. It keeps its current `dark` prop for Home and uses a fixed style on inner pages. Same for `MobileMenu`.
- 404 page in the same style.
- SPA fallback: `vite preview` handles it locally; add a host rewrite (e.g. `vercel.json` / `_redirects`) once hosting is chosen.

### Pages (copy & data in `src/content/*.ts`, brand voice, believable placeholder copy; no new image assets — typography, color, CSS treatments)
- **/origin** — the farm in Quindío, altitude, people; editorial long-form layout.
- **/process** — picking → washing → drying → roasting as a numbered step sequence.
- **/roasts** — grid of 3–4 coffees (name, origin note, flavor notes, roast level, price, "Add to bag"). **/roasts/:slug** — detail page with size/grind selector and quantity. Existing `SPECS`/`FLAVORS` in `config.ts` become the data for the flagship roast.
- **/visit** — location, hours, a contact form with client-side validation that ends in a "message received" state (nothing is sent).
- **/journal** — list of 3–4 articles; **/journal/:slug** — article page.
- **/cart** — line items, quantity +/-, remove, subtotal, empty state.
- **/checkout** — realistic shipping form (validated), order summary, "Place order" → **/checkout/confirmed** (order number, clears the bag). Clearly no payment step.

### Cart
- `src/lib/cart.ts`: pure reducer (add / remove / setQty / clear, totals) — unit-tested first.
- `src/hooks/useCart` + context provider; persisted to `localStorage` (wrapped in try/catch, falls back to memory).
- Navbar bag count and the `sr-only` "bag has N items" text become live; adding an item gives a polite `aria-live` announcement.
- `"Order your first bag"` (`App.tsx:244`) → `/roasts`; "Shop" → `/roasts`, bag icon → `/cart`.

### Style reuse (user: "maintain the standard of the current main page")
Inner pages mirror the home page's light→dark arc: a **light opening band** (cloud base `#e6e4e1`, ink text, uppercase eyebrow + large Fraunces 300 `h1`, like S1) followed by **dark content** (`scene`/ink background, cream text, `mist` labels, hairline `cream/15` dividers, like S2–S4). Header uses `text-ink` over the light band and flips to cream once scrolled into the dark area (same `dark` prop Navbar already has). Fraunces display / Inter body, `ink`/`cream`/`cherry`/`mist` tokens (`tailwind.config.ts`), `Stagger` for reveals, `ease-expo` transitions, the existing cherry focus ring. Respect `useReducedMotion` everywhere. Contrast verified by the axe checks in Phase C.

### Builder's calls (made by Claude, flag if you disagree)
- **Router = `wouter`** (~2 KB gzip) instead of react-router: react-router would push the entry chunk from 54.7 KB to ~70 KB and break the budget. Hook-based `useRoute`/`Link` cover everything needed here.
- **Back to Home**: browser Back restores the previous scroll position in the descent (manual `history.scrollRestoration` keyed by location); clicking a link to Home starts at the top. Home simply remounts — the video is served from HTTP cache, and the frame bank/3D only rebuild after first intent as today. No keep-alive.
- **Lighthouse CI**: 3 runs per URL, median; **Accessibility = 100 blocks** the build, performance thresholds **warn** in CI (shared runners are noisy) and are enforced in the local `npm run check:perf`.

## Phase C — Keep it fast & accessible

- **Playwright e2e flows**: navigate every nav link (desktop + mobile menu); add to bag → count updates → cart → checkout → confirmation → bag empty; bag survives reload; 404.
- **Automated a11y**: `@axe-core/playwright` scan on every route (fail on serious/critical).
- **Bundle budget**: a small script (or `size-limit`) failing if the entry chunk exceeds ~60 KB gzip or CSS ~8 KB gzip.
- **Lighthouse CI** (`@lhci/cli`) on `/`, `/roasts`, `/roasts/:slug`, `/checkout`, 3 runs/median: Accessibility = 100 (blocking); Performance ≥ 95 mobile, Best Practices ≥ 95, CLS < 0.05 (warn in CI, enforced locally via `npm run check:perf`).
- All of the above wired into `npm run check` and the CI workflow.
- Update `README.md`: routes, cart behavior, scripts, how to run checks.

## Non-goals / anti-goals
- No real payments, accounts, backend or CMS; no i18n.
- No visual redesign of the descent; no refactor beyond moving it into `pages/Home.tsx`.
- Anti-goal: any regression in the home page's measured performance (LCP 1.8 s mobile, CLS 0) or accessibility.

## Critical files
- Modify: `src/main.tsx`, `src/App.tsx` (→ `src/pages/Home.tsx`), `src/components/Navbar.tsx`, `src/components/MobileMenu.tsx`, `src/config.ts`, `src/hooks/useScrollProgress.ts` (reset on unmount), `package.json`, `README.md`.
- New: `src/pages/*`, `src/components/SiteLayout.tsx`, `src/content/*`, `src/lib/cart.ts`, `src/hooks/useCart.ts`, `eslint.config.js`, `.prettierrc`, `vitest.config.ts` (or in `vite.config.ts`), `playwright.config.ts`, `tests/e2e/*`, `lighthouserc.json`, `.github/workflows/ci.yml`.

## Verification
1. `npm run check` → typecheck, lint, format check, unit tests, build, bundle budget, Playwright (flows + axe) all green.
2. `npm run build && npm run preview`, then Lighthouse CI on the listed routes meets thresholds; home numbers match the README's (±small variance).
3. Manual pass in the browser: descent still scrubs and hands off to 3D; every nav link works on desktop + mobile; full cart → checkout → confirmation; reload keeps bag; keyboard-only navigation and reduced-motion mode on all pages.

## Next steps after approval
Write this as the spec at `docs/superpowers/specs/2026-10-23-altura-site-completion-design.md`, then superpowers:writing-plans for a task-by-task implementation plan, executed phase by phase (A → B → C) with a commit per task.
