const puppeteer = require('puppeteer');
const path = require('path');

const [htmlPath] = process.argv.slice(2);
if (!htmlPath) {
  console.error('Usage: node scripts/screenshot.js <path-to.html>');
  process.exit(1);
}

const outDir = path.join(path.dirname(htmlPath), 'images');
const baseName = path.basename(htmlPath, '.html');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    timeout: 90000,
    pipe: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--no-first-run', '--no-zygote']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });

  const html = require('fs').readFileSync(htmlPath, 'utf8');

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const cards = await page.$$('.card');
  if (!cards.length) {
    console.error('No .card elements found');
    await browser.close();
    process.exit(1);
  }

  require('fs').mkdirSync(outDir, { recursive: true });

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const box = await card.boundingBox();
    await page.screenshot({
      path: path.join(outDir, `${baseName}-${String(i + 1).padStart(2, '0')}.png`),
      clip: { x: box.x, y: box.y, width: box.width, height: box.height }
    });
    console.log(`✓ ${baseName}-${String(i + 1).padStart(2, '0')}.png`);
  }

  await browser.close();
})();
