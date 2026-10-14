/**
 * TASK-002 browser click-through. Run after a successful build:
 *   node scripts/clickthrough-butterfly-05.mjs
 *
 * The printed readouts are observed browser values, not illustrative results.
 * Validates live table quantities, payoff reconstruction and slope/strike edits.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4332;
const URL = 'http://localhost:' + PORT + '/options-explained/chapters/05-strategies/';

async function waitForPreview() {
  for (let n = 0; n < 60; n++) {
    try {
      const response = await fetch(URL);
      if (response.ok) return;
    } catch { /* Astro is starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Astro preview did not start');
}

async function openChromium() {
  try { return await chromium.launch(); }
  catch { return chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); }
}

function asNumber(value) {
  return Number(value.replace(/−/g, '-').replace(/\$/g, '').replace(/\s/g, ''));
}

const preview = spawn(process.execPath, [
  'node_modules/astro/bin/astro.mjs', 'preview', '--port', String(PORT), '--ignore-lock',
], { stdio: 'ignore' });

let browser;
try {
  await waitForPreview();
  browser = await openChromium();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(URL, { waitUntil: 'networkidle' });

  const widget = page.locator('figure.widget').filter({ hasText: 'Butterfly: slopes become calls' });
  assert.equal(await widget.count(), 1, 'Exactly one butterfly teaching widget');
  await widget.scrollIntoViewIfNeeded();
  await widget.locator('.ctl-slider input[type="range"]').first().waitFor();

  const slider = (name) => widget.locator('.ctl-slider').filter({ hasText: name }).locator('input[type="range"]');
  const slopeText = () => widget.locator('[aria-label="Slope changes"]').innerText();
  const positionsText = () => widget.locator('[aria-label="Implied call positions"]').innerText();
  const tableRows = () => widget.locator('table[aria-label="Replicating cash, shares and calls"] tbody tr');
  const payoffText = () => widget.locator('.widget-readout p').last().innerText();

  async function report(label, expectedPayoff, expectedSlopes, expectedTrades, expectedStrikes, expectedQuantities) {
    const lines = await widget.locator('.widget-readout p').allInnerTexts();
    const main = lines.find((line) => line.includes('drawn payoff'));
    assert(main, label + ': expected payoff readout');
    const match = main.match(/drawn payoff\s*([+−-]?\$\d+\.\d{2});\s*rebuilt payoff\s*([+−-]?\$\d+\.\d{2})/s);
    assert(match, label + ': missing complete payoff reconstruction');
    assert.equal(asNumber(match[1]), expectedPayoff, label + ': drawn payoff');
    assert.equal(asNumber(match[2]), expectedPayoff, label + ': rebuilt payoff');
    assert.match(lines.join(' '), /Exact match at every plotted price/);
    assert.equal(await slopeText(), 'Slope changes: ' + expectedSlopes + '.');
    assert.equal(await positionsText(), 'Implied calls: ' + expectedTrades + '.');

    const rows = tableRows();
    assert.equal(await rows.count(), 5, label + ': expected cash, shares, and three calls');
    const cells = await Promise.all(
      (await rows.all()).map(async (row) => row.locator('td').allTextContents())
    );
    assert.deepEqual(cells.map((row) => row[0]), [
      'Cash', 'Shares', ...expectedStrikes.map((strike) => 'Call at $' + strike),
    ]);
    assert.deepEqual(cells.map((row) => asNumber(row[1])), [0, 0, ...expectedQuantities]);

    // Independently evaluate the displayed portfolio from the table at S_T=105.
    const spot = 105;
    const rebuiltFromRows = expectedQuantities.reduce(
      (value, quantity, i) => value + quantity * Math.max(spot - expectedStrikes[i], 0), 0,
    );
    assert(Math.abs(rebuiltFromRows - expectedPayoff) < 1e-9, label + ': table must replicate line');
    console.log(label + ': ' + main.replace(/\s+/g, ' ').trim());
    console.log('  ' + (await slopeText()).replace(/\s+/g, ' '));
    console.log('  ' + (await positionsText()).replace(/\s+/g, ' '));
    console.log('  table calls: ' + expectedQuantities.join(', '));
  }

  await report('Default butterfly', 5, '+1, −2, +1',
    'Buy 1 × $90 call; Sell 2 × $100 calls; Buy 1 × $110 call',
    [90, 100, 110], [1, -2, 1]);

  await slider('Slope after kink 2').focus();
  await page.keyboard.press('ArrowRight');
  await report('Middle slope −0.75', 6.25, '+1, −1.75, +0.75',
    'Buy 1 × $90 call; Sell 1.75 × $100 calls; Buy 0.75 × $110 calls',
    [90, 100, 110], [1, -1.75, 0.75]);

  await slider('Strike K1').focus();
  await page.keyboard.press('ArrowRight');
  await report('First strike 91', 5.25, '+1, −1.75, +0.75',
    'Buy 1 × $91 call; Sell 1.75 × $100 calls; Buy 0.75 × $110 calls',
    [91, 100, 110], [1, -1.75, 0.75]);

  await slider('Slope after kink 1').focus();
  await page.keyboard.press('ArrowRight');
  await report('First right-hand slope +1.25', 7.5, '+1.25, −2, +0.75',
    'Buy 1.25 × $91 calls; Sell 2 × $100 calls; Buy 0.75 × $110 calls',
    [91, 100, 110], [1.25, -2, 0.75]);

  assert.deepEqual(errors, [], 'No browser console or page errors');
  console.log('TASK-002 click-through passed; all readouts were observed in Chromium.');
} finally {
  if (browser) await browser.close();
  preview.kill();
}
