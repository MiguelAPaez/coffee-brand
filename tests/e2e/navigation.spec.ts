import { expect, test, type Page } from '@playwright/test'

const NAV = [
  { label: 'Origin', href: '/origin' },
  { label: 'Process', href: '/process' },
  { label: 'Roasts', href: '/roasts' },
  { label: 'Visit', href: '/visit' },
  { label: 'Journal', href: '/journal' },
]

async function clickNav(page: Page, label: string, mobile: boolean) {
  if (mobile) {
    await page.getByRole('button', { name: 'Open menu' }).click()
    const dialog = page.getByRole('dialog', { name: 'Menu' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('link', { name: label, exact: true }).click()
  } else {
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: label, exact: true }).click()
  }
}

for (const { label, href } of NAV) {
  test(`nav link ${label} opens ${href}`, async ({ page }, testInfo) => {
    await page.goto('/')
    await clickNav(page, label, testInfo.project.name === 'mobile')
    await expect(page).toHaveURL(new RegExp(`${href}$`))
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Desktop nav links are hidden on mobile, where the menu is closed after the click.
    if (testInfo.project.name === 'mobile') return
    const nav = page.getByRole('navigation', { name: 'Primary' })
    await expect(nav.getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page')
    for (const other of NAV.filter((n) => n.label !== label)) {
      await expect(nav.getByRole('link', { name: other.label, exact: true })).not.toHaveAttribute('aria-current')
    }
  })
}

test('unknown path shows the not-found page with a way home', async ({ page }) => {
  await page.goto('/does-not-exist')
  await expect(page.getByRole('heading', { level: 1, name: 'This trail ends here' })).toBeVisible()
  await expect(page).toHaveTitle('Not found — ALTURA')
  await page.getByRole('link', { name: 'Back to the descent' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1, name: 'From the clouds to your cup' })).toBeVisible()
})

test('navigating to Home focuses its hero heading; a direct load does not', async ({ page }) => {
  const hero = page.getByRole('heading', { level: 1, name: 'From the clouds to your cup' })
  await page.goto('/')
  await expect(hero).toBeVisible()
  await expect(hero).not.toBeFocused()

  await page.goto('/does-not-exist')
  await page.getByRole('link', { name: 'Back to the descent' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(hero).toBeFocused()
})

test('deep link renders on direct load', async ({ page }) => {
  await page.goto('/roasts/la-cumbre')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('leaving Home mid-descent resets progress and Back restores scroll', async ({ page }, testInfo) => {
  await page.goto('/')
  await page.evaluate<number>(
    '(() => { const y = Math.round((document.documentElement.scrollHeight - innerHeight) * 0.5); scrollTo({ top: y, behavior: "instant" }); return y })()',
  )
  // Playwright may nudge the page while targeting the link, so record where the visitor actually left.
  await page.evaluate(
    '(() => { const push = history.pushState; history.pushState = function (...a) { window.__leftAt = scrollY; return push.apply(this, a) } })()',
  )
  await expect.poll(() => page.evaluate<string>("document.documentElement.style.getPropertyValue('--p')")).not.toBe('')
  await clickNav(page, 'Origin', testInfo.project.name === 'mobile')
  await expect(page).toHaveURL(/\/origin$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await page.evaluate<string>("document.documentElement.style.getPropertyValue('--p')")).toBe('')
  expect(await page.evaluate<number>('window.scrollY')).toBe(0)

  await page.goBack()
  await expect(page.getByRole('heading', { level: 1, name: 'From the clouds to your cup' })).toBeAttached()
  const target = await page.evaluate<number>('window.__leftAt')
  expect(target).toBeGreaterThan(1000)
  await expect.poll(() => page.evaluate<number>('window.scrollY')).toBeGreaterThan(target * 0.95)
  expect(await page.evaluate<number>('window.scrollY')).toBeLessThan(target * 1.05)
  await expect(page).toHaveTitle('ALTURA — Descent')
})

test('a same-path push does not break Back scroll restoration', async ({ page }, testInfo) => {
  await page.goto('/')
  await page.evaluate('scrollTo({ top: 1500, behavior: "instant" })')
  await expect.poll(() => page.evaluate<number>('window.scrollY')).toBe(1500)
  // Playwright's click may nudge the page, so record where the visitor actually left (first push only).
  await page.evaluate(
    '(() => { const push = history.pushState; history.pushState = function (...a) { window.__leftAt ??= scrollY; return push.apply(this, a) } })()',
  )
  await clickNav(page, 'Origin', testInfo.project.name === 'mobile')
  await expect(page).toHaveURL(/\/origin$/)
  await page.evaluate("history.pushState(null, '', '/origin')")
  await page.goBack()
  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  const target = await page.evaluate<number>('window.__leftAt')
  expect(target).toBeGreaterThan(500)
  await expect.poll(() => page.evaluate<number>('window.scrollY')).toBeGreaterThan(target * 0.95)
  expect(await page.evaluate<number>('window.scrollY')).toBeLessThan(target * 1.05)
})

test('inner-page header is ink over the light band, then flips to cream past it', async ({ page }, testInfo) => {
  await page.goto('/')
  await page.evaluate(
    'scrollTo({ top: Math.round((document.documentElement.scrollHeight - innerHeight) * 0.5), behavior: "instant" })',
  )
  await clickNav(page, 'Origin', testInfo.project.name === 'mobile')
  await expect(page).toHaveURL(/\/origin$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Where the clouds touch the farm' })).toBeVisible()
  const header = page.locator('header')
  await expect(header).toHaveClass(/text-ink/)
  // Stub pages are short: add height so the hero can scroll fully under the header.
  await page.evaluate(
    "document.getElementById('main').insertAdjacentHTML('beforeend', '<div style=\"height:2000px\"></div>')",
  )
  await page.evaluate('scrollTo({ top: 1200, behavior: "instant" })')
  await expect(header).toHaveClass(/text-cream/)
  await page.evaluate('scrollTo({ top: 0, behavior: "instant" })')
  await expect(header).toHaveClass(/text-ink/)
})

test('the header gets its frosted bar once the background turns dark', async ({ page }) => {
  const backdrop = page.locator('header [data-header-backdrop]')

  await page.goto('/')
  await expect(backdrop).toHaveCSS('opacity', '0')
  // Home: the footage turns dark at p = 0.3.
  await page.evaluate(
    'scrollTo({ top: Math.round((document.documentElement.scrollHeight - innerHeight) * 0.35), behavior: "instant" })',
  )
  await expect(backdrop).toHaveCSS('opacity', '1')
  await page.evaluate('scrollTo({ top: 0, behavior: "instant" })')
  await expect(backdrop).toHaveCSS('opacity', '0')

  // Inner pages: once the light hero band has scrolled under the header.
  await page.goto('/origin')
  await expect(backdrop).toHaveCSS('opacity', '0')
  await page.evaluate('scrollTo({ top: 1200, behavior: "instant" })')
  await expect(backdrop).toHaveCSS('opacity', '1')
})

test('desktop nav marks the current section on inner pages, including child routes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'desktop nav links are hidden on mobile')
  await page.goto('/roasts/la-cumbre')
  const nav = page.getByRole('navigation', { name: 'Primary' })
  await expect(nav.getByRole('link', { name: 'Roasts', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(nav.getByRole('link', { name: 'Origin', exact: true })).not.toHaveAttribute('aria-current', 'page')
})

test('inner pages set the document title', async ({ page }) => {
  await page.goto('/origin')
  await expect(page).toHaveTitle('Origin — ALTURA')
})

test('process lists four ordered steps', async ({ page }) => {
  await page.goto('/process')
  const list = page.getByRole('list', { name: 'Process steps' })
  await expect(list.getByRole('listitem')).toHaveCount(4)
  await expect(list.getByRole('heading', { level: 2 })).toHaveText(['Picking', 'Washing', 'Drying', 'Roasting'])
})

test('origin lists the farm facts', async ({ page }) => {
  await page.goto('/origin')
  await expect(page.locator('dl dt').first()).toHaveText('Altitude')
  await expect(page.locator('dl dd').first()).toHaveText('1,600 m')
  await expect(page.getByRole('heading', { level: 2 })).not.toHaveCount(0)
})
