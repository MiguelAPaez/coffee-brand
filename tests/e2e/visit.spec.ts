import { expect, test } from '@playwright/test'

test('empty submit focuses the first field and lists three errors', async ({ page }) => {
  await page.goto('/visit')
  await expect(page).toHaveTitle('Visit — ALTURA')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByLabel('Name')).toBeFocused()
  await expect(page.getByText('Please tell us your name.')).toBeVisible()
  await expect(page.getByText('Enter a valid email address.')).toBeVisible()
  await expect(page.getByText('Write a message of at least 10 characters.')).toBeVisible()
})

test('errors clear as fields are fixed and a valid submit confirms', async ({ page }) => {
  await page.goto('/visit')
  await page.getByRole('button', { name: 'Send message' }).click()
  await page.getByLabel('Name').fill('Ana')
  await expect(page.getByText('Please tell us your name.')).toHaveCount(0)
  await page.getByLabel('Email').fill('ana@example.com')
  await page.getByLabel('Message').fill('We would love a tour on Saturday.')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByRole('status')).toHaveText("Message received — we'll write back within two days.")
  await expect(page.getByRole('button', { name: 'Send message' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Write to us' })).toBeFocused()
})

test('invalid email alone focuses the email field with linked error', async ({ page }) => {
  await page.goto('/visit')
  await page.getByLabel('Name').fill('Ana')
  await page.getByLabel('Email').fill('a@b')
  await page.getByLabel('Message').fill('We would love a tour on Saturday.')
  await page.getByRole('button', { name: 'Send message' }).click()
  const email = page.getByLabel('Email')
  await expect(email).toBeFocused()
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).toHaveAttribute('aria-describedby', 'email-error')
})
