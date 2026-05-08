const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const htmlFile = process.argv[2];
  if (!htmlFile) {
    console.error('Please provide an HTML file path.');
    process.exit(1);
  }

  const fullPath = path.resolve(htmlFile);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  // Create output directory based on today's date
  const dateStr = new Date().toISOString().split('T')[0];
  const outputBaseDir = path.join(__dirname, 'outputs', dateStr, path.basename(htmlFile, '.html'));

  if (!fs.existsSync(outputBaseDir)) {
    fs.mkdirSync(outputBaseDir, { recursive: true });
  }

  console.log(`Processing ${fullPath}...`);
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Standard Instagram Carousel size (1080x1350)
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });

  await page.goto(`file://${fullPath}`, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');

  // Logic to find all elements with class 'card' and screenshot them
  const cards = await page.$$('.card');
  if (cards.length === 0) {
    console.error('No elements with class "card" found. Taking full page screenshot instead.');
    await page.screenshot({ path: path.join(outputBaseDir, 'full-page.png') });
  } else {
    console.log(`Found ${cards.length} cards.`);
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const outputPath = path.join(outputBaseDir, `card-${(i + 1).toString().padStart(2, '0')}.png`);
      await card.screenshot({ path: outputPath });
      console.log(`Saved ${outputPath}`);
    }
  }

  await browser.close();
  console.log('Finished.');
})();
