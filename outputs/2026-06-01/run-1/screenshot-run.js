const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const htmlFiles = [
  '/home/runner/work/aussie-umma/aussie-umma/outputs/2026-06-01/run-1/childcare-closure-risk-guide.html',
  '/home/runner/work/aussie-umma/aussie-umma/outputs/2026-06-01/run-1/ppl-super-contribution-guide.html',
];

const outDir = '/home/runner/work/aussie-umma/aussie-umma/outputs/2026-06-01/run-1/images';
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--no-first-run', '--no-zygote', '--disable-gpu'],
    timeout: 90000,
  });

  for (const htmlPath of htmlFiles) {
    const baseName = path.basename(htmlPath, '.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });

    const cards = await page.$$('.card');
    console.log(baseName + ': found ' + cards.length + ' cards');

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const box = await card.boundingBox();
      const outPath = path.join(outDir, baseName + '-' + String(i + 1).padStart(2, '0') + '.png');
      await page.screenshot({
        path: outPath,
        clip: { x: box.x, y: box.y, width: box.width, height: box.height }
      });
      console.log('  wrote ' + path.basename(outPath));
    }

    await page.close();
  }

  await browser.close();
  console.log('DONE');
})().catch(function(e) { console.error('ERROR:', e.message); process.exit(1); });
