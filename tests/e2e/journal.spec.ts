import { expect, test } from '@playwright/test'

test('journal lists four articles and the first opens its page', async ({ page }) => {
  await page.goto('/journal')
  await expect(page).toHaveTitle('Journal — ALTURA')
  const articles = page.locator('main article')
  await expect(articles).toHaveCount(4)
  const first = articles.first()
  const title = (await first.getByRole('heading', { level: 2 }).innerText()).trim()
  await first.getByRole('link').click()
  await expect(page).toHaveURL(/\/journal\/[a-z0-9-]+$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
  await expect(page).toHaveTitle(`${title} — ALTURA`)
  await page.getByRole('link', { name: 'Back to Journal' }).click()
  await expect(page).toHaveURL(/\/journal$/)
})

test('unknown article slug shows not-found', async ({ page }) => {
  await page.goto('/journal/ghost')
  await expect(page.getByRole('heading', { level: 1, name: 'This trail ends here' })).toBeVisible()
})
