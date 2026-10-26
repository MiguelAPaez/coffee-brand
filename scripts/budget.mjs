import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

// 62 rather than the planned 60: routing (wouter) + cart put the entry at ~60.2 KB (controller Ruling 5).
const JS_LIMIT_KB = 62
const CSS_LIMIT_KB = 8

const dist = 'dist'
const html = readFileSync(join(dist, 'index.html'), 'utf8')

// Entry script and modulepreloads load with the first page, so both count toward the JS budget.
const tags = html.match(/<(?:script|link)\b[^>]*>/g) ?? []
const files = []
for (const tag of tags) {
  const href = /\b(?:src|href)="([^"]+)"/.exec(tag)?.[1]
  if (!href) continue
  const isEntry = tag.startsWith('<script') && /type="module"/.test(tag)
  const isPreload = /rel="modulepreload"/.test(tag)
  const isCss = /rel="stylesheet"/.test(tag)
  if (isEntry || isPreload) files.push({ href, kind: 'js' })
  else if (isCss) files.push({ href, kind: 'css' })
}

if (!files.some((f) => f.kind === 'js')) {
  console.error('budget: no entry <script type="module"> found in dist/index.html (run `npm run build` first)')
  process.exit(1)
}

const totals = { js: 0, css: 0 }
const rows = files.map(({ href, kind }) => {
  const buf = readFileSync(join(dist, href.replace(/^\//, '')))
  const gzip = gzipSync(buf, { level: 9 }).length
  totals[kind] += gzip
  return { href, raw: buf.length, gzip }
})

const kb = (n) => (n / 1024).toFixed(2).padStart(8)
console.log(`${'file'.padEnd(40)} ${'raw KB'.padStart(8)} ${'gzip KB'.padStart(8)}`)
for (const r of rows) console.log(`${r.href.padEnd(40)} ${kb(r.raw)} ${kb(r.gzip)}`)

const limits = { js: JS_LIMIT_KB, css: CSS_LIMIT_KB }
let failed = false
for (const kind of ['js', 'css']) {
  const used = totals[kind] / 1024
  const over = used > limits[kind]
  failed ||= over
  console.log(
    `${kind.toUpperCase().padEnd(3)} total ${used.toFixed(2)} KB gzip / limit ${limits[kind]} KB  ${over ? 'OVER' : 'ok'}`,
  )
}

if (failed) {
  console.error('budget: bundle size budget exceeded')
  process.exit(1)
}
