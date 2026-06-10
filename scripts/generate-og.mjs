// Generates public/og.png (1200×630) and public/icon-180.png with Playwright.
// Run: npm run generate:og  (requires `npx playwright install chromium` once)
import { chromium } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const OG_HTML = `<!doctype html>
<html><head>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Hanken+Grotesk:wght@500;600&family=JetBrains+Mono:wght@700&display=swap" />
<style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; background: #16110b; color: #f3ebdb;
    font-family: 'Hanken Grotesk', sans-serif; overflow: hidden; position: relative;
    display: flex; flex-direction: column; justify-content: center; padding: 0 96px;
  }
  body::after {
    content: ''; position: absolute; inset: 0; opacity: 0.06;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E");
  }
  .kicker { font-family: 'JetBrains Mono', monospace; font-size: 22px; letter-spacing: 0.4em; color: #c9a45c; text-transform: uppercase; }
  h1 { font-family: 'Fraunces', serif; font-weight: 600; font-size: 92px; line-height: 1.04; margin-top: 28px; }
  .sub { font-size: 30px; color: #ab9a7f; margin-top: 28px; font-weight: 500; }
  .sub strong { color: #e9c87e; font-weight: 600; }
  .ring { position: absolute; right: -140px; top: 50%; transform: translateY(-50%); width: 520px; height: 520px; border: 3px solid rgba(201,164,92,0.35); border-radius: 50%; }
  .ring::after { content: ''; position: absolute; inset: 60px; border: 2px solid rgba(201,164,92,0.18); border-radius: 50%; }
</style></head>
<body>
  <div class="ring"></div>
  <div class="kicker">The Vault</div>
  <h1>You're leaving<br/>money locked up.</h1>
  <div class="sub">Five questions → every perk you qualify for, <strong>ranked by dollar value</strong>.</div>
</body></html>`

const browser = await chromium.launch()

const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await og.setContent(OG_HTML, { waitUntil: 'networkidle' })
await og.evaluate(() => document.fonts.ready)
await og.screenshot({ path: path.join(root, 'public/og.png') })
console.log('wrote public/og.png')

const icon = await browser.newPage({ viewport: { width: 180, height: 180 } })
await icon.setContent(
  `<body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="180" height="180"><rect width="64" height="64" fill="#16110b"/><circle cx="32" cy="32" r="19" fill="none" stroke="#c9a45c" stroke-width="3"/><circle cx="32" cy="27" r="5.5" fill="#e9c87e"/><rect x="29.25" y="29" width="5.5" height="13" rx="2.75" fill="#e9c87e"/></svg></body>`,
)
await icon.screenshot({ path: path.join(root, 'public/icon-180.png') })
console.log('wrote public/icon-180.png')

await browser.close()
