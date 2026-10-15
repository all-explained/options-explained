/**
 * TASK-007 Playwright click-through. After building:
 *   node scripts/clickthrough-breakevens-05.mjs
 * Exercises rendered controls; prints actual arithmetic and breakeven readouts.
 * Does not replace the four-view screenshot/visual review.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4332;
const BASE = 'http://localhost:' + PORT + '/options-explained/';
async function waitForPreview() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(BASE)).ok) return; } catch { /* starting */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Astro preview did not start');
}
async function launch() {
  try { return await chromium.launch(); }
  catch { return chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); }
}
const server = spawn(process.execPath, [
  'node_modules/astro/bin/astro.mjs', 'preview', '--port', String(PORT), '--ignore-lock',
], { stdio: 'ignore' });
let browser;
try {
  await waitForPreview();
  browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(BASE + 'chapters/05-strategies/', { waitUntil: 'networkidle' });
  const widget = page.locator('figure.widget').filter({
    hasText: 'Find the breakevens, one piece at a time',
  });
  await widget.scrollIntoViewIfNeeded();
  await widget.getByLabel('Strategy preset').waitFor();
  const roots = () => widget.getByLabel('Final breakevens').innerText();
  const arithmetic = () => widget.getByLabel('Selected piece arithmetic').innerText();
  const table = () => widget.getByRole('table', { name: 'Breakeven pieces' }).innerText();
  async function report(name) {
    console.log(name + '\n  ' + (await roots()).replace(/\s+/g, ' ').trim()
      + '\n  ' + (await arithmetic()).replace(/\s+/g, ' ').trim());
  }
  async function setSlider(label, value) {
    const input = widget.locator('.ctl-slider').filter({ hasText: label }).locator('input[type="range"]');
    assert.equal(await input.count(), 1, 'Missing/ambiguous slider: ' + label);
    await input.evaluate((element, next) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(element, String(next));
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
    await page.waitForTimeout(100);
  }
  const choose = (value) => widget.getByLabel('Strategy preset').selectOption(value);
  const includes = (actual, needle, label) => assert.ok(
    actual.includes(needle), label + ': expected ' + needle + ', received ' + actual,
  );

  await report('Long straddle: default');
  includes(await roots(), '$84.00 and $116.00', 'straddle');
  includes(await widget.getByLabel('Straddle formula check').innerText(), '100.00 ± 16.00', 'straddle check');
  includes(await table(), '84.00', 'straddle piece table');
  await widget.getByRole('button', { name: /Solve piece 1/ }).click();
  await report('Long straddle: second piece');
  includes(await arithmetic(), '116.00', 'second candidate');
  includes(await arithmetic(), 'yes (accepted)', 'second piece');
  await setSlider('Strike K1', 110);
  await report('Straddle: K to 110');
  includes(await roots(), '$94.00 and $126.00', 'straddle K update');

  await choose('bull');
  await report('Bull call spread: default');
  includes(await roots(), '$105.98', 'bull spread');
  await setSlider('Strike K1', 95);
  await report('Bull spread: K1 to 95');
  includes(await roots(), '$100.98', 'strike edit');
  await setSlider('Slope after kink 1', 0.5);
  await report('Bull spread: middle slope to 0.5');
  includes(await roots(), '$106.96', 'slope edit');

  await choose('butterfly');
  await report('Long butterfly: default');
  includes(await roots(), '$92.00 and $108.00', 'butterfly');
  await widget.getByRole('button', { name: 'Inspect piece 2' }).click();
  await report('Butterfly: selected rising piece');
  includes(await arithmetic(), 'yes (accepted)', 'butterfly piece');
  await setSlider('Net cost today', 20);
  await report('Butterfly: cost exceeds peak payoff');
  includes(await roots(), 'no breakeven', 'no crossing');
  includes(await arithmetic(), 'no (rejected)', 'out-of-piece candidate');

  await choose('custom');
  await setSlider('Net cost today', 2);
  await widget.getByRole('button', { name: /\+ Add kink/ }).click();
  await report('Custom: fourth kink');
  assert.equal(await widget.getByRole('table', { name: 'Breakeven pieces' })
    .locator('tbody tr').count(), 5, 'Four kinks need five pieces');
  assert.equal(errors.length, 0, 'Browser errors: ' + errors.join(' | '));
  assert.equal(await page.locator('.katex-error').count(), 0, 'KaTeX errors');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(overflow <= 1, 'Horizontal overflow: ' + overflow);
  console.log('PASS: presets, strike, slope, cost, solve-step, custom count and readouts');
} finally {
  if (browser) await browser.close();
  server.kill();
}
