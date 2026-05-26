const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const [htmlPath] = process.argv.slice(2);
if (!htmlPath) {
  console.error('Usage: node scripts/screenshot-linux.js <path-to.html>');
  process.exit(1);
}

const outDir = path.join(path.dirname(htmlPath), 'images');
const baseName = path.basename(htmlPath, '.html');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    timeout: 90000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-extensions',
      '--font-render-hinting=none'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });

  const html = fs.readFileSync(htmlPath, 'utf8');
  await page.setContent(html, { waitUntil: 'networkidle2', timeout: 60000 });

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);

  const cards = await page.$$('.card');
  if (!cards.length) {
    console.error('No .card elements found');
    await browser.close();
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const box = await card.boundingBox();
    const outPath = path.join(outDir, `${baseName}-${String(i + 1).padStart(2, '0')}.png`);
    await page.screenshot({
      path: outPath,
      clip: { x: box.x, y: box.y, width: box.width, height: box.height }
    });
    console.log(`captured: ${outPath}`);
  }

  await browser.close();
  console.log(`Done: ${cards.length} cards captured from ${baseName}`);
})();
