import { expect, test } from '@playwright/test'

test('the video is downloaded once, as media, never re-fetched for decoding', async ({ page }) => {
  const fetches: string[] = []
  page.on('request', (r) => {
    if (r.url().includes('/video/') && r.resourceType() !== 'media') fetches.push(`${r.resourceType()} ${r.url()}`)
  })
  await page.goto('/')
  await page.mouse.move(200, 300)
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(3000)
  expect(fetches).toEqual([])
})

test('scrolling scrubs the video to the matching time', async ({ page }) => {
  await page.goto('/')
  await expect.poll(() => page.evaluate<number>("document.querySelector('video').duration || 0")).toBeGreaterThan(0)
  await page.mouse.move(200, 300)
  const track = await page.evaluate<number>('document.documentElement.scrollHeight - innerHeight')
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, (track * 0.25) / 10)
    await page.waitForTimeout(50)
  }
  const p = await page.evaluate<number>("Number(getComputedStyle(document.documentElement).getPropertyValue('--p'))")
  expect(p).toBeGreaterThan(0.2)
  // videoEnd = 0.5: p maps linearly onto 0..duration over the first half of the track.
  await expect
    .poll(() =>
      page.evaluate<number>(
        `(() => { const v = document.querySelector('video'); return Math.abs(v.currentTime - (${p} / 0.5) * v.duration) })()`,
      ),
    )
    .toBeLessThan(0.5)
})
