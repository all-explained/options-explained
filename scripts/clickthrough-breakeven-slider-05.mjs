/**
 * TASK-008 Playwright click-through. After building:
 *   node scripts/clickthrough-breakeven-slider-05.mjs
 * Drives BreakevenSlider in chapter 05 (strategy buttons, toggle, drag) and prints the readouts.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4333;
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
  for (const viewport of [{ width: 1280, height: 900 }, { width: 360, height: 800 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(BASE + 'chapters/05-strategies/', { waitUntil: 'networkidle' });
    const widget = page.locator('figure.widget').filter({ hasText: 'Where does profit cross zero?' });
    await widget.scrollIntoViewIfNeeded();
    const handle = widget.locator('.mafs-movable-point');
    await handle.waitFor();
    const readout = async () => (await widget.locator('.widget-readout').innerText()).replace(/\s+/g, ' ').trim();
    const spot = async () => Number((await readout()).match(/ends at \$([\d.]+)/)[1]);
    const say = async (name) => console.log(`[${viewport.width}px] ${name}: ${await readout()}`);
    const includes = (actual, needle, label) => assert.ok(actual.includes(needle), `${label}: expected "${needle}", got "${actual}"`);

    // Controls: one Segmented, one button, one drag handle; no table, no slider, no select.
    assert.equal(await widget.locator('.ctl-segmented').count(), 1, 'one Segmented');
    assert.equal(await widget.locator('.ctl-button').count(), 1, 'one toggle button');
    assert.equal(await widget.locator('.mafs-movable-point').count(), 1, 'one drag handle');
    assert.equal(await widget.locator('table, input, select').count(), 0, 'no table or other controls');
    assert.equal(await widget.getByRole('radio', { checked: true }).innerText(), 'Bull call spread', 'bull spread first');

    // Drag: calibrate pixels per dollar with a test drag, then land near a target price.
    const centre = async () => { const b = await handle.boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
    async function dragBy(dx) {
      const [x, y] = await centre();
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + dx / 2, y, { steps: 5 });
      await page.mouse.move(x + dx, y, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(100);
    }
    async function dragTo(price) {
      for (let i = 0; i < 4 && Math.abs((await spot()) - price) > 0.3; i++) await dragBy(((price - (await spot())) * pxPerDollar));
    }
    const s0 = await spot();
    await dragBy(100);
    const pxPerDollar = 100 / ((await spot()) - s0);
    assert.ok(pxPerDollar > 1, 'drag moved the point');

    await dragTo(100);
    await say('Bull spread, S_T = 100');
    includes(await readout(), 'lose $5.98', 'loss at 100');
    assert.ok((await widget.locator('.widget-readout .bad').count()) > 0, 'loss is red');
    await dragTo(115);
    await say('Bull spread, S_T = 115');
    includes(await readout(), 'make $9.02', 'gain at 115');
    assert.ok((await widget.locator('.widget-readout .good').count()) > 0, 'gain is green');
    await dragTo(106);
    await say('Bull spread, S_T = 106');
    includes(await readout(), "That's the breakeven", 'near 105.98');

    // Toggle.
    assert.equal(await widget.locator('svg text', { hasText: '$105.98' }).count(), 0, 'hidden at first');
    await widget.getByRole('button', { name: 'Show the breakevens' }).click();
    await widget.locator('svg text', { hasText: '$105.98' }).waitFor();
    console.log(`[${viewport.width}px] Bull spread breakeven label: ${await widget.locator('svg text', { hasText: '$105.98' }).textContent()}`);

    // Other strategies: breakeven labels and the readout at each crossing.
    for (const [name, labels, cross] of [['Long straddle', ['$84', '$116'], [84, 116]], ['Long butterfly', ['$92', '$108'], [92, 108]]]) {
      await widget.getByRole('radio', { name }).click();
      for (const l of labels) await widget.locator('svg text', { hasText: new RegExp('^' + l.replace('$', '\\$') + '$') }).waitFor();
      console.log(`[${viewport.width}px] ${name}: labels ${labels.join(' and ')}`);
      const [l1, l2] = await Promise.all(labels.map((l) => widget.locator('svg text', { hasText: new RegExp('^' + l.replace('$', '\\$') + '$') }).boundingBox()));
      assert.ok(l1.x + l1.width <= l2.x || l2.x + l2.width <= l1.x, `${name}: breakeven labels overlap`);
      for (const c of cross) {
        await dragTo(c);
        await say(`${name}, S_T = ${c}`);
        includes(await readout(), "That's the breakeven", `${name} at ${c}`);
      }
      await dragTo(100);
      await say(`${name}, S_T = 100`);
    }
    await widget.getByRole('button', { name: 'Hide the breakevens' }).click();
    assert.equal(await widget.locator('svg text', { hasText: '$92' }).count(), 0, 'hidden again');

    // 360px: nothing cut off.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 1, 'Horizontal overflow: ' + overflow);
    const box = await widget.boundingBox();
    for (const child of await widget.locator('.widget-controls > *, .widget-readout, svg').all()) {
      const b = await child.boundingBox();
      assert.ok(b.x >= box.x - 1 && b.x + b.width <= box.x + box.width + 1, 'child inside the card');
    }
    assert.equal(errors.length, 0, 'Browser errors: ' + errors.join(' | '));
    assert.equal(await page.locator('.katex-error').count(), 0, 'KaTeX errors');
    await page.close();
  }
  console.log('PASS: strategy buttons, toggle, drag, readouts, 1280px and 360px');
} finally {
  if (browser) await browser.close();
  server.kill();
}
