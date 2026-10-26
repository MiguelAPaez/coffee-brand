# ALTURA — Descent

A scroll experience with a small showcase site around it. The home page scrubs an aerial video down from the clouds over Quindío to a coffee cherry, hands off to a real-time procedural 3D coffee bean you can rotate and split open, and ends on a calm call to action. Around it sit Origin, Process, Roasts, Visit and Journal pages, plus a demo cart and checkout.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # tsc -b && vite build
npm run preview   # http://localhost:4173 (use this for performance testing)
```

Stack: Vite 5, React 18, TypeScript, Tailwind 3, three, @react-three/fiber, @react-three/drei and lucide-react. Routing is wouter. There is no GSAP or Lenis. One custom `requestAnimationFrame` loop (`src/lib/raf.ts`) drives everything.

## Swapping the videos

The URLs live in `src/config.ts`:

```ts
export const VIDEO_URL = '/video/descent-desktop.mp4' // 1280×720 H.264, 12.9 MB
export const VIDEO_URL_MOBILE = '/video/descent-mobile.mp4' // 720×1280 H.264, 6.5 MB; < 768px wide or Save-Data on
```

To change the footage, replace the files in `public/video/` or point the constants at a CDN.

**Encode with a keyframe every 6 frames.** The page scrubs by seeking the `<video>`, and a seek decodes from the previous keyframe, so a long keyframe interval makes every scroll step expensive. The shipped files were made with:

```bash
ffmpeg -i in.mp4 -c:v libx264 -preset slow -crf 22 -g 6 -keyint_min 6 -sc_threshold 0 \
  -pix_fmt yuv420p -profile:v high -movflags +faststart -an descent-desktop.mp4   # mobile: -crf 25
```

A few more things to keep in mind when you change the footage:

- **Last frame color:** keep the last frame dark and warm. `HANDOFF_BG` in `src/config.ts` was sampled from the final cherry frame (the average of its darkest 30% is `#38100B`). The 3D scene starts on that color and settles to `#1A110C`, so re-sample it if your last frame changes.
- **Length:** the clip can be any length; scroll maps linearly onto its duration.
- **CDN hosting:** the server must send `Accept-Ranges: bytes` so the browser can seek, and `moov` must come before `mdat` (`+faststart`) so metadata arrives early. No CORS headers are needed.

## Design direction

I explored three directions:

| Direction           | Idea                                                                                                              | Verdict                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Editorial Quiet** | Fraunces 300 at large optical size, wide margins, hairline dividers. A single warm-lit bean sits right of center. | **Chosen**                                                         |
| Field Notes         | Technical spec-sheet look with coordinate grids and mono labels.                                                  | Too busy; it fights the footage.                                   |
| Macro Cinema        | The bean fills the frame and text sits in small corner blocks.                                                    | Hides the spec list, and the hotspot labels collide with the copy. |

**Why Editorial Quiet:**

- The footage is the spectacle, so the typography has to whisper.
- Large-optical-size Fraunces reads as premium on both the bright cloud frames and the dark cherry frames, with no overlays or gradients needed.
- Putting the bean right of center on desktop leaves a clean left column for the S3 spec list, so text never sits over the drag area.
- On stacked layouts (below 1024px) the bean moves to the lower part of the frame instead.
- For the CTA the bean drifts to center and dims to 40%, so the final frame is calm.

## Architecture

```
src/
  main.tsx                     router + cart provider
  routes.tsx                   route table; every page except Home is lazy()
  pages/Home.tsx               the descent: layers + sections + handoff (eager)
  pages/                       Origin, Process, Roasts, RoastDetail, Visit, Journal, Article, Cart, Checkout, Confirmed, NotFound
  content/                     copy and product data: roasts, origin, process, visit, journal
  config.ts                    video URLs, colors, timeline, copy data
  lib/cart.ts                  pure cart reducer (clamped quantities, sanitizing)
  lib/order.ts, forms.ts       order numbers, stored order (+ in-memory copy), checkout validation
  lib/storage.ts               JSON read/write for localStorage/sessionStorage that never throws
  lib/format.ts                formatPrice (integer cents to $18.00)
  lib/scrollMemory.ts          scroll position restore on Back
  lib/nav.ts                   current-link matching; tells a direct load from in-app navigation
  lib/raf.ts                   the single rAF loop (stops while the tab is hidden)
  lib/intent.ts                resolves on the visitor's first scroll/touch/key
  lib/math.ts                  clamp / range / sectionOpacity
  hooks/useCart.tsx            cart context provider persisted to localStorage
  hooks/usePageMeta.ts         document title per page
  hooks/useScrollProgress.ts   p → shared ref + --p CSS var; threshold-only React state
  hooks/useVideoScrub.ts       scrub engine: eased scroll position → video.currentTime
  hooks/useMedia.ts            reduced motion / mobile media queries
  components/SiteLayout.tsx, PageHero.tsx, Footer.tsx, Reveal.tsx, Field.tsx, QtyStepper.tsx
  components/Navbar.tsx, MobileMenu.tsx, Section.tsx, Stagger.tsx, Hotspot.tsx, BeanFallback.tsx
  components/three/BeanScene.tsx   lazy chunk: Canvas, drag, PerformanceMonitor, demand invalidation
  components/three/Bean.tsx        two half-beans, split, hotspots, blob contact shadow
  components/three/beanGeometry.ts procedural geometry + canvas noise normal map
  components/three/Particles.tsx   instanced warm dust
tests/e2e/                     Playwright specs (desktop + mobile), including a11y.spec.ts
scripts/budget.mjs             bundle budget check
lighthouserc.cjs               Lighthouse CI config
```

## Pages

| Route                 | Page                                                               |
| --------------------- | ------------------------------------------------------------------ |
| `/`                   | Home: the scroll descent and 3D bean                               |
| `/origin`             | Origin                                                             |
| `/process`            | Process                                                            |
| `/roasts`             | Roasts: the product list                                           |
| `/roasts/:slug`       | One roast, with size and grind choices (unknown slug shows 404)    |
| `/visit`              | Visit                                                              |
| `/journal`            | Journal: article list                                              |
| `/journal/:slug`      | One article (unknown slug shows 404)                               |
| `/cart`               | The bag                                                            |
| `/checkout`           | Demo checkout form; an empty bag redirects to `/cart`              |
| `/checkout/confirmed` | Order confirmation; with no stored order it redirects to `/roasts` |
| `*`                   | 404                                                                |

Inner pages share `SiteLayout`: a light opening band, then dark content, mirroring Home. Document titles are `<Page> — ALTURA`.

## Cart & checkout (demo)

- **No payment is taken.** There are no accounts, no backend and no card fields. Checkout only collects contact and delivery details.
- The bag lives in `localStorage` under `altura:cart:v1`. A corrupt or stale value (bad JSON, unknown roast, quantity out of range) is sanitized on load rather than crashing, and quantities are clamped to 1–10.
- Placing an order writes a summary to `sessionStorage` under `altura:lastOrder`. The confirmation page reads that summary, so refreshing it in the same tab still works and a fresh tab redirects.
- If storage is blocked or full, nothing throws. The bag keeps working from in-memory state, and the order is also kept in memory, so the confirmation still renders. Neither survives a reload.

## Deploying

The build is a static SPA in `dist/`. Routing happens in the browser, so the host must serve `index.html` for every path; otherwise deep links (`/roasts/la-cumbre`) and refreshes on inner pages return the host's 404. Hosting isn't chosen yet, so these are examples to add with it.

Vercel, `vercel.json` at the repo root:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

Netlify, `public/_redirects` (Vite copies it into `dist/`):

```
/*  /index.html  200
```

Both rewrite only paths that don't match a real file, so `/assets/*`, `/video/*` and the fonts are still served directly.

## Quality checks

| Command              | What it does                                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`      | typecheck, lint, format check, unit tests, build, budget and e2e, in that order. Exit 0 means shippable. It does not run `check:perf`          |
| `npm test`           | Vitest + Testing Library unit tests (cart reducer, storage, forms, components)                                                                 |
| `npm run e2e`        | Playwright on desktop and mobile against `vite preview`. Includes `a11y.spec.ts`, an axe scan of the pages                                     |
| `npm run budget`     | Fails if the entry gzip exceeds 62 KB JS or 8 KB CSS                                                                                           |
| `npm run check:perf` | Builds, then runs Lighthouse CI (`lhci autorun`, config in `lighthouserc.cjs`) on `/`, `/roasts`, `/roasts/la-cumbre` and `/cart`, 3 runs each |

`check:perf` thresholds are accessibility 100, performance and best practices at least 95, CLS at most 0.05. It builds first because the config serves `dist` with `vite preview`. It needs a Chrome install; if none is found, point `CHROME_PATH` at Playwright's Chromium:

```bash
export CHROME_PATH=$(node -e "console.log(require('@playwright/test').chromium.executablePath())")
```

**In CI** (`.github/workflows/ci.yml`): `npm run check` runs first, so axe accessibility violations in the e2e suite block the build. The Lighthouse step then runs with `LHCI_MODE=ci`: accessibility still fails the build, but performance, best practices and CLS only warn, because shared runners are too noisy to gate on.

## Performance decisions

- **One rAF loop, no per-frame React state.** Scroll progress, section opacities, the handoff and the scene background are written straight to the DOM through refs. React state changes only when a threshold is crossed: footage turning dark, mounting the 3D scene, and revealing a section's stagger.
- **Hero text paints before any JavaScript animation.**
  - The hero reveal is a CSS keyframe that starts on first paint, so it doesn't wait for the rAF loop.
  - The keyframe starts at `opacity: 0.01` rather than 0. Chrome excludes zero-opacity paints from LCP, so starting at 0 would leave the hero unmeasured.
- **Fonts are self-hosted Google Fonts files.** These are the latin subsets of Fraunces (opsz 9–144, wght 300–400) and Inter (400–500), one variable woff2 each, served from the same origin and preloaded.
  - **Why:** in Lighthouse's Slow 4G simulation, loading from googleapis and gstatic added two cross-origin connections. That pushed mobile LCP to 3.0 s; self-hosting brought it to 1.8 s.
  - **No layout shift:** the fallbacks are metric-matched with `size-adjust` and `ascent-override` / `descent-override`, so the swap doesn't move anything.
- **Heavy work waits for intent.** The page first loads only the HTML, CSS, the entry chunk (about 60 KB gzip) and the fonts. Everything else waits for the visitor's first scroll, touch or key press:
  - **Video:** the source is attached after `load` with `preload="metadata"`, enough for the first frame behind the hero. It switches to `preload="auto"` on first intent.
  - **3D chunk:** it is prefetched in `requestIdleCallback` after first intent, well before it mounts at p > 0.35.
- **Scrubbing seeks the `<video>` directly.** Each frame the eased scroll position is written to `video.currentTime`, with one seek in flight at a time; scrubbing stops once p > 0.56.
  - **Why not a WebCodecs frame bank:** an earlier version pre-decoded the clip into WebP frames. Measured in Chrome (Oct 2026), it downloaded the file a second time and its decoding starved the video's own seeks (p90 1.1–2.2 s) for the 5–10 s it took to build, and afterwards 20–34% of frames had no decoded bitmap ready and the picture froze. Seeking a short-GOP file directly measures 6–8 ms median / ~10 ms p90 on desktop and 6–10 ms / 30–60 ms on a 4×-throttled mobile profile, updating every frame.
- **Header bar.** Once the background behind the header turns dark (Home: the footage at p = 0.3; inner pages: past the light band) a frosted bar fades in under it; only its opacity animates. Below `md` it skips `backdrop-filter`, since re-blurring the scrubbing video every frame tripled long frames on the throttled mobile profile.
- **3D scene.**
  - **Rendering:** `frameloop="demand"`, invalidated only while the 3D layer is on screen and something is moving. Device pixel ratio is capped at [1, 1.5] on mobile and [1, 2] on desktop. `PerformanceMonitor` lowers DPR and halves the particles when fps declines.
  - **Geometry:** about 39k triangles across both halves.
  - **Shadow:** a radial-texture blob instead of `ContactShadows`. That avoids a second depth render every frame, and the drei version also rendered as a dark slab in testing.
- **Animation.** Only `transform` and `opacity` animate. The hotspot label expansion is opacity plus translate over a pre-laid-out label, so it causes no reflow.

## Accessibility

- **Reduced motion:**
  - The video jumps straight to each frame instead of easing.
  - There are no particles and no auto-rotation.
  - The bean starts already split, and the flavor notes also appear as a static list under the specs.
- **No WebGL** (or append `?nowebgl` to test it): a static CSS bean with the spec list and flavor notes. An error boundary shows the same fallback if the 3D chunk or the WebGL context fails at runtime.
- **Real DOM text:** all copy is DOM text, and hidden sections get `visibility: hidden` so they drop out of the tab order.
- **Focus:** the focus ring is cherry with a cream halo, so it shows on both light and dark backgrounds.
- **Mobile menu:** focus trap, Escape to close, body scroll lock, `inert` when closed, and focus returns to the trigger.
- **3D viewer:** focusable, with arrow keys to rotate. Hotspots are buttons with `aria-label`s.

## Measured results (24 Oct 2026, Windows 11, local `vite preview`, Chrome 155, Lighthouse 12.6)

|      | Entry JS | CSS    | 3D chunk (lazy) |
| ---- | -------- | ------ | --------------- |
| gzip | 58.3 KB  | 5.7 KB | 247.7 KB        |

Entry JS is the entry script plus its modulepreloads, as counted by `npm run budget`: 58.3 KB of the 62 KB budget (CSS 5.7 KB of 8 KB).

Lighthouse CI, mobile (simulated Slow 4G, 4× CPU), median of 3 runs:

| Page                | Performance | Accessibility | Best Practices | FCP   | LCP   | TBT   | CLS |
| ------------------- | ----------- | ------------- | -------------- | ----- | ----- | ----- | --- |
| `/`                 | 99          | 100           | 100            | 1.2 s | 1.8 s | 38 ms | 0   |
| `/roasts`           | 99          | 100           | 100            | 1.3 s | 2.2 s | 0 ms  | 0   |
| `/roasts/la-cumbre` | 98          | 100           | 100            | 1.4 s | 2.1 s | 0 ms  | 0   |
| `/cart`             | 98          | 100           | 100            | 1.4 s | 2.1 s | 0 ms  | 0   |

These are local-server numbers, so real CDN latency will add some time.
