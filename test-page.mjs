import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  if (errors.length > 0) {
    console.error('Errors found:');
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log('No errors found');
  await browser.close();
})();
