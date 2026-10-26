import { expect, test } from '@playwright/test'

test('roasts page lists four roast cards', async ({ page }) => {
  await page.goto('/roasts')
  await expect(page.getByRole('article')).toHaveCount(4)
})

test('quick add puts one item in the bag', async ({ page }) => {
  await page.goto('/roasts')
  await page.getByRole('button', { name: 'Add La Cumbre, 250g whole bean, to bag' }).click()
  await expect(page.getByRole('link', { name: 'Bag, 1 item' })).toBeVisible()
})

test('detail: 1kg + Espresso + qty 2 adds to the bag at the 1kg price', async ({ page }) => {
  await page.goto('/roasts/la-cumbre')
  await expect(page.getByTestId('line-price')).toHaveText('$18.00')
  await page.getByRole('radio', { name: '1kg' }).check({ force: true })
  await page.getByRole('radio', { name: 'Espresso' }).check({ force: true })
  await page.getByRole('button', { name: 'Increase quantity' }).click()
  await expect(page.getByTestId('line-price')).toHaveText('$124.00')
  await page.getByRole('button', { name: 'Add to bag' }).click()
  await expect(page.getByRole('link', { name: 'Bag, 2 items' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'View bag' })).toBeVisible()
})

test('quick add then detail via the card link accumulates in the bag', async ({ page }) => {
  await page.goto('/roasts')
  await page.getByRole('button', { name: 'Add La Cumbre, 250g whole bean, to bag' }).click()
  await expect(page.getByRole('link', { name: 'Bag, 1 item' })).toBeVisible()
  await page.getByRole('link', { name: 'La Cumbre' }).click()
  await expect(page).toHaveURL(/\/roasts\/la-cumbre$/)
  await page.getByRole('radio', { name: '1kg' }).check({ force: true })
  await page.getByRole('radio', { name: 'Espresso' }).check({ force: true })
  await page.getByRole('button', { name: 'Increase quantity' }).click()
  await expect(page.getByTestId('line-price')).toHaveText('$124.00')
  await page.getByRole('button', { name: 'Add to bag' }).click()
  await expect(page.getByRole('link', { name: 'Bag, 3 items' })).toBeVisible()
})

test('detail: each add is announced once, and an add at the cap says so', async ({ page }) => {
  await page.goto('/roasts/la-cumbre')
  await page.getByRole('textbox', { name: 'Quantity' }).fill('10')
  await page.getByRole('button', { name: 'Add to bag' }).click()
  await expect(page.getByText('Added to your bag.')).toBeVisible()
  const live = page.locator('[aria-live], [role="status"], [role="alert"]')
  await expect(live.filter({ hasText: /\S/ })).toHaveText(['Added La Cumbre, 250g, to your bag. 10 items.'])

  await page.getByRole('button', { name: 'Add to bag' }).click()
  await expect(page.getByText('Already at the maximum in your bag.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'View bag' })).toBeVisible()
  await expect(live.filter({ hasText: /\S/ })).toHaveText(['La Cumbre, 250g, is already at the maximum of 10.'])
  await expect(page.getByRole('link', { name: 'Bag, 10 items' })).toBeVisible()
})

test('unknown roast shows the not-found page', async ({ page }) => {
  await page.goto('/roasts/ghost')
  await expect(page.getByRole('heading', { level: 1, name: 'This trail ends here' })).toBeVisible()
})

test.describe('cart page', () => {
  test('empty bag shows the empty state', async ({ page }) => {
    await page.goto('/cart')
    await expect(page.getByText('Your bag is empty')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Browse roasts' })).toHaveAttribute('href', '/roasts')
  })

  test('two items: qty updates line total and navbar count, reload persists, remove drops lines', async ({ page }) => {
    await page.goto('/roasts')
    await page.getByRole('button', { name: 'Add La Cumbre, 250g whole bean, to bag' }).click()
    await expect(page.getByRole('link', { name: 'Bag, 1 item' })).toBeVisible()
    await page
      .getByRole('button', { name: /^Add (?!La Cumbre).*, 250g whole bean, to bag$/ })
      .first()
      .click()
    await expect(page.getByRole('link', { name: 'Bag, 2 items' })).toBeVisible()
    await page.getByRole('link', { name: 'Bag, 2 items' }).click()

    const lines = page.getByRole('list', { name: 'Items in your bag' }).getByRole('listitem')
    await expect(lines).toHaveCount(2)
    await expect(lines.first()).toContainText('$18.00')

    await page.getByRole('button', { name: /^Increase quantity, La Cumbre/ }).click()
    await expect(lines.first()).toContainText('$36.00')
    await expect(page.getByRole('link', { name: 'Bag, 3 items' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Checkout' })).toHaveAttribute('href', '/checkout')

    await page.reload()
    await expect(lines).toHaveCount(2)
    await expect(lines.first()).toContainText('$36.00')

    await page.getByRole('button', { name: /^Remove La Cumbre/ }).click()
    await expect(lines).toHaveCount(1)
    await expect(lines.first()).not.toContainText('La Cumbre')
    await expect(lines.first().getByRole('link')).toBeFocused()

    await page.getByRole('button', { name: /^Remove / }).click()
    await expect(page.getByText('Your bag is empty')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Browse roasts' })).toBeFocused()
  })
})
