import { expect, test, type Page } from '@playwright/test'

test('empty bag on /checkout redirects to /cart', async ({ page }) => {
  await page.goto('/checkout')
  await expect(page).toHaveURL(/\/cart$/)
})

test('shipping form shows errors and focuses the first invalid field', async ({ page }) => {
  await page.goto('/roasts')
  await page.getByRole('button', { name: 'Add La Cumbre, 250g whole bean, to bag' }).click()
  await page.goto('/checkout')
  await page.getByRole('button', { name: 'Place order' }).click()
  await expect(page.getByText('Please tell us your name.')).toBeVisible()
  await expect(page.getByText('Choose your country.')).toBeVisible()
  await expect(page.getByLabel('Name')).toBeFocused()
  await expect(page).toHaveURL(/\/checkout$/)
})

test('full flow: add, bag, checkout, place order, confirmed; bag is emptied', async ({ page, browser }) => {
  await page.goto('/roasts')
  await page.getByRole('button', { name: 'Add La Cumbre, 250g whole bean, to bag' }).click()
  await page.getByRole('link', { name: 'Bag, 1 item' }).click()
  await page.getByRole('link', { name: 'Checkout' }).click()
  await expect(page).toHaveURL(/\/checkout$/)
  await expect(page.getByText('This is a demo store — no payment is taken.')).toBeVisible()

  await page.getByLabel('Name').fill('Ana Gómez')
  await page.getByLabel('Email').fill('ana@example.com')
  await page.getByLabel('Address').fill('Calle Real 1')
  await page.getByLabel('City').fill('Salento')
  await page.getByLabel('Postal code').fill('630001')
  await page.getByLabel('Country').selectOption('Colombia')
  await page.getByRole('button', { name: 'Place order' }).click()

  await expect(page).toHaveURL(/\/checkout\/confirmed$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Thank you' })).toBeVisible()
  await expect(page.getByText(/ALT-[0-9A-Z]{6}/).first()).toBeVisible()
  await expect(page.getByRole('list', { name: 'Items in your order' }).getByText('La Cumbre')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Bag, 0 items' })).toBeVisible()
  await page.getByRole('link', { name: 'Back to the descent' }).click()
  await expect(page).toHaveURL(/\/$/)

  // A fresh context has no sessionStorage order, so a direct load must not show a fake confirmation.
  const fresh = await browser.newContext()
  const freshPage = await fresh.newPage()
  await freshPage.goto('/checkout/confirmed')
  await expect(freshPage).toHaveURL(/\/roasts$/)
  await fresh.close()
})

async function placeOrder(page: Page) {
  await page.goto('/roasts')
  await page.getByRole('button', { name: 'Add La Cumbre, 250g whole bean, to bag' }).click()
  await page.getByRole('link', { name: 'Bag, 1 item' }).click()
  await page.getByRole('link', { name: 'Checkout' }).click()
  await expect(page).toHaveURL(/\/checkout$/)
  await page.getByLabel('Name').fill('Ana Gómez')
  await page.getByLabel('Email').fill('ana@example.com')
  await page.getByLabel('Address').fill('Calle Real 1')
  await page.getByLabel('City').fill('Salento')
  await page.getByLabel('Postal code').fill('630001')
  await page.getByLabel('Country').selectOption('Colombia')
  await page.getByRole('button', { name: 'Place order' }).click()
  await expect(page).toHaveURL(/\/checkout\/confirmed$/)
  await expect(page.getByText(/ALT-[0-9A-Z]{6}/).first()).toBeVisible()
}

test('Back after placing an order walks out of checkout instead of looping on /cart', async ({ page }) => {
  await placeOrder(page)
  // /checkout now has an empty bag, so it redirects in place to /cart; the next Back is the real /cart visit.
  await page.goBack()
  await expect(page).toHaveURL(/\/cart$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/cart$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/roasts$/)
})

test('the empty-bag redirect replaces /checkout, so Back reaches the page before it', async ({ page }) => {
  await page.goto('/roasts')
  await page.goto('/checkout')
  await expect(page).toHaveURL(/\/cart$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/roasts$/)
})

test('the no-order redirect replaces /checkout/confirmed, so Back reaches the page before it', async ({ page }) => {
  await page.goto('/origin')
  await page.goto('/checkout/confirmed')
  await expect(page).toHaveURL(/\/roasts$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/origin$/)
})

test('checkout completes with no uncaught errors when site storage is blocked', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.addInitScript(() => {
    for (const name of ['localStorage', 'sessionStorage']) {
      Object.defineProperty(globalThis, name, {
        get() {
          throw new DOMException('blocked', 'SecurityError')
        },
        configurable: true,
      })
    }
  })
  await placeOrder(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Thank you' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Items in your order' }).getByText('La Cumbre')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Bag, 0 items' })).toBeVisible()
  expect(errors).toEqual([])
})
