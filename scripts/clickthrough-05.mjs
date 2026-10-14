/**
 * Browser verification for TASK-004. Run after npm run build:
 *   node scripts/clickthrough-05.mjs
 * Requires Playwright Chromium (same as npm run screenshots 05).
 *
 * Prints the real readout text for each user interaction; throws if any
 * control, ordering constraint or expected readout is broken.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4331;
const URL = 'http://localhost:' + PORT + '/options-explained/chapters/05-strategies/';

async function waitForServer() {
  for (let n = 0; n < 60; n++) {
    try {
      const response = await fetch(URL);
      if (response.ok) return;
    } catch { /* preview starting */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Could not start Astro preview');
}

async function launchChromium() {
  try { return await chromium.launch(); }
  catch { return chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); }
}

const server = spawn(process.execPath, [
  'node_modules/astro/bin/astro.mjs', 'preview', '--port', String(PORT), '--ignore-lock',
], { stdio: 'ignore' });

let browser;
try {
  await waitForServer();
  browser = await launchChromium();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(URL, { waitUntil: 'networkidle' });
  const widget = page.locator('figure.widget').filter({ hasText: 'Build any shape from calls' });
  assert.equal(await widget.count(), 1);
  await widget.scrollIntoViewIfNeeded();
  await widget.locator('input[type="range"]').first().waitFor();

  const slider = (label) => widget.locator('.ctl-slider').filter({ hasText: label }).locator('input[type="range"]');
  const readout = () => widget.locator('.widget-readout p').first().innerText();
  const report = async (event, expected) => {
    const actual = await readout();
    console.log(event + ': ' + actual.replace(/\s+/g, ' '));
    if (expected) assert.match(actual, expected, event);
    assert.match(await widget.locator('.widget-readout').innerText(), /Exact match at every plotted price/);
  };
  const strikes = async () => {
    const lines = await widget.locator('.leg-name').allTextContents();
    return lines.map((text) => Number(text.match(/strike \$(\d+)/)?.[1]));
  };
  const ordered = async () => {
    const values = await strikes();
    assert(values.every((value, i) => Number.isFinite(value) && (!i || value > values[i - 1])));
  };

  await report('Default three-kink payoff', /drawn payoff\s*\+\$5\.00.*rebuilt payoff\s*\+\$5\.00/s);
  await slider('Strike K1').focus();
  await page.keyboard.press('ArrowRight');
  await report('Strike K1 moved to 91', /drawn payoff\s*\+\$4\.00.*rebuilt payoff\s*\+\$4\.00/s);
  await ordered();

  await slider('Slope after kink 2').focus();
  await page.keyboard.press('ArrowRight');
  await report('Second right-hand slope increased to -0.75', /drawn payoff\s*\+\$5\.25.*rebuilt payoff\s*\+\$5\.25/s);
  assert.match(await widget.locator('.leg-name').nth(1).innerText(), /calls −1\.75/);

  await widget.getByRole('radio', { name: 'Each term' }).click();
  console.log('Each term selected; table rows: ' + await widget.locator('.iter-table tbody tr').count());
  await widget.getByRole('radio', { name: 'Rebuild' }).click();
  await slider('Running sum').focus();
  await page.keyboard.press('Home');
  console.log('Running sum at zero terms: ' + (await readout()).replace(/\s+/g, ' '));
  assert.match(await readout(), /partial sum\s*\$0\.00/);
  await slider('Running sum').focus();
  await page.keyboard.press('End');
  await report('All five terms restored', /rebuilt payoff\s*\+\$5\.25/);

  await widget.getByRole('button', { name: 'Remove kink 3' }).click();
  await ordered();
  assert.equal((await strikes()).length, 2);
  await widget.getByRole('button', { name: 'Remove kink 2' }).click();
  await ordered();
  assert.equal((await strikes()).length, 1);
  await report('Minimum of one kink');
  for (let n = 2; n <= 5; n++) {
    await widget.getByRole('button', { name: '+ Add kink' }).click();
    await ordered();
    assert.equal((await strikes()).length, n);
    await report(n + ' ordered kinks');
  }
  assert(await widget.getByRole('button', { name: '+ Add kink' }).isDisabled());
  console.log('Click-through passed: one to five kinks, drag-equivalent keyboard edits, terms, running sum, readouts.');
} finally {
  if (browser) await browser.close();
  server.kill();
}
