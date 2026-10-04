// Génère les icônes PNG à partir des SVG (node tools/make-icons.mjs).
import {chromium} from 'playwright';
import {readFileSync} from 'fs';
const dir = new URL('../icons/', import.meta.url);
const jobs = [
  ['icon.svg', 'icon-192.png', 192], ['icon.svg', 'icon-512.png', 512],
  ['maskable.svg', 'maskable-512.png', 512], ['maskable.svg', 'apple-touch-icon.png', 180]
];
const browser = await chromium.launch({executablePath: process.env.CHROMIUM || undefined});
const page = await browser.newPage();
for (const [src, out, size] of jobs){
  const svg = readFileSync(new URL(src, dir), 'utf8');
  await page.setViewportSize({width: size, height: size});
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({path: new URL(out, dir).pathname, omitBackground: true, clip: {x: 0, y: 0, width: size, height: size}});
  console.log(out);
}
await browser.close();
