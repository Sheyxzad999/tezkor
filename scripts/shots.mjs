// Barcha sahifalarni skrinshot qiladi: node scripts/shots.mjs <outDir> [dark|light] [tabs...]
import { chromium } from 'playwright';
const [out, scheme = 'dark', ...only] = process.argv.slice(2);
const tabs = only.length ? only : ['timecode', 'color', 'monitor', 'currency', 'prayer', 'clipboard', 'dev', 'settings'];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 640 }, deviceScaleFactor: 2, colorScheme: scheme });
await page.goto('http://localhost:1420/');
for (const tab of tabs) {
  await page.evaluate((t) => { localStorage.setItem('tezkor:tab', JSON.stringify(t)); }, tab);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(tab === 'monitor' ? 4000 : 900);
  await page.screenshot({ path: `${out}/${scheme}-${tab}.png` });
}
await browser.close();
