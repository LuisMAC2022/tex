// Solo CI: se copia al directorio temporal que contiene Playwright.
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const { resolve } = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ offline: true, acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure().errorText}`));
    await page.goto(pathToFileURL(resolve(process.argv[2], 'index.html')).href);
    await page.locator('#note-title').fill('Prueba de humo');
    await page.locator('#block-type').selectOption('text');
    await page.locator('#block-content').fill(String.raw`Sea $x \in \mathbb{R}$`);
    await page.locator('#math-preview .katex').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#math-preview .katex annotation').textContent(), String.raw`x \in \mathbb{R}`);
    await page.locator('#add-block').click();
    await page.locator('#block-list .katex').waitFor({ state: 'visible' });
    await page.locator('#block-type').selectOption('bibliography');
    await page.locator('#block-content').fill('Spivak, M. Cálculo infinitesimal.');
    await page.locator('#add-block').click();
    await page.locator('#generate').click();
    const output = await page.locator('#latex-output').inputValue();
    assert.ok(output.includes(String.raw`\begin{thebibliography}{9}`));
    assert.ok(output.includes(String.raw`\bibitem{ref1} Spivak`));
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#download-tex').click();
    const download = await downloadPromise;
    assert.match(download.suggestedFilename(), /\.tex$/);
    assert.equal(await readFile(await download.path(), 'utf8'), output);
    await page.evaluate(() => document.fonts.ready);
    assert.deepEqual(errors, []);
    console.log('Humo correcto: file:// sin red, KaTeX y descarga con bibliografía.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
