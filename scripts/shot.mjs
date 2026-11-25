// Foydalanish: node scripts/shot.mjs <url> <out.png> [width] [height] [dark|light] [scale]
import { chromium } from 'playwright';
const [url, out, w = '420', h = '640', scheme = 'dark', scale = '2'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: +w, height: +h },
  deviceScaleFactor: +scale,
  colorScheme: scheme,
});
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.screenshot({ path: out });
await browser.close();
