import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const CART = { items: [{ slug: 'la-cumbre', size: '250g', grind: 'Whole bean', qty: 1 }] }
const ORDER = { number: 'ALT-A1B2C3', items: CART.items, total: 1800 }

const ROUTES = [
  '/',
  '/origin',
  '/process',
  '/roasts',
  '/roasts/la-cumbre',
  '/visit',
  '/journal',
  '/journal/the-harvest-begins',
  '/cart',
  '/checkout',
  '/checkout/confirmed',
  '/does-not-exist',
]

// Readable failures: rule id plus the offending selectors, instead of axe's full result dump.
async function scan(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
}

test.beforeEach(async ({ page }) => {
  // Reveal content fades in on scroll; reduced motion shows it immediately so contrast is measured on real colors.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(
    ([cart, order]) => {
      localStorage.setItem('altura:cart:v1', cart)
      sessionStorage.setItem('altura:lastOrder', order)
    },
    [JSON.stringify(CART), JSON.stringify(ORDER)],
  )
})

for (const route of ROUTES) {
  test(`no serious a11y violations on ${route}`, async ({ page }) => {
    await page.goto(route)
    // A redirect (empty cart, rejected order) would otherwise silently scan a different page.
    await expect(page).toHaveURL(new RegExp(`${route}$`))
    await page.locator('h1').first().waitFor()
    expect(await scan(page)).toEqual([])
  })
}

test('no serious a11y violations on the empty bag', async ({ page }) => {
  // Registered after beforeEach's seed, so it runs after it and empties the cart.
  await page.addInitScript(() => localStorage.removeItem('altura:cart:v1'))
  await page.goto('/cart')
  await expect(page).toHaveURL(/\/cart$/)
  await page.locator('h1').first().waitFor()
  await expect(page.getByText('Your bag is empty')).toBeVisible()
  expect(await scan(page)).toEqual([])
})

test('no serious a11y violations on the visit form with errors', async ({ page }) => {
  await page.goto('/visit')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByText('Please tell us your name.')).toBeVisible()
  await expect(page.getByText('Write a message of at least 10 characters.')).toBeVisible()
  // The failed submit scrolls to the first invalid field, past the light band. The fixed header flips to cream there
  // via an IntersectionObserver; scanning before that flip lands measures ink-on-dark, a false contrast failure.
  await expect(page.locator('header')).toHaveClass(/text-cream/)
  expect(await scan(page)).toEqual([])
})

test('mobile menu dialog has no serious a11y violations', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The menu button only exists on mobile')
  await page.goto('/origin')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('dialog', { name: 'Menu' }).waitFor()
  expect(await scan(page)).toEqual([])
})
