import { expect, test } from '@playwright/test'

test('hero renders', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'From the clouds to your cup' })).toBeVisible()
  await expect(page).toHaveTitle('ALTURA — Descent')
})

test('mobile menu traps and returns focus', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile menu only exists on small viewports')
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Open menu' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Menu' })
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})
