/**
 * TASK-003 browser click-through (after npm run build):
 *   node scripts/clickthrough-put-05.mjs
 *
 * Tests the real hydrated controls and prints their real readouts for review.
 * Uses the same Astro preview and Chromium convention as screenshots.mjs.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4332;
const URL = 'http://localhost:' + PORT + '/options-explained/chapters/05-strategies/';
const server = spawn(process.execPath, [
  'node_modules/astro/bin/astro.mjs', 'preview', '--port', String(PORT), '--ignore-lock',
], { stdio: 'ignore' });
let browser;

async function serverReady() {
  for (let tries = 0; tries < 60; tries++) {
    try { if ((await fetch(URL)).ok) return; }
    catch { /* preview starting */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Astro preview did not start');
}

async function launch() {
  try { return await chromium.launch(); }
  catch { return chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); }
}

async function exercise(theme, viewport) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript((value) => localStorage.setItem('theme', value), theme);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  try {
    await page.goto(URL, { waitUntil: 'networkidle' });
    const widget = page.locator('figure.widget').filter({ hasText: 'A put, assembled from calls' });
    assert.equal(await widget.count(), 1);
    await widget.scrollIntoViewIfNeeded();
    const slider = (name) => widget.locator('.ctl-slider').filter({ hasText: name }).locator('input[type="range"]');
    const value = async (name) => widget.getByTestId(name).innerText();
    const record = async (label, expected) => {
      const readout = (await widget.getByTestId('put-from-calls-readout').innerText()).replace(/\s+/g, ' ');
      console.log(theme + '/' + viewport.width + 'px — ' + label + ': ' + readout);
      for (const [id, amount] of Object.entries(expected)) assert.equal(await value(id), amount, label + ': ' + id);
      assert.match(await value('put-exactness'), /Exact identity/);
    };

    await slider('Strike').waitFor();
    await record('default K=100, S=90', {
      'put-payoff': '+$10.00', 'cash-term': '+$100.00', 'stock-term': '−$90.00',
      'call-term': '$0.00', 'full-sum': '+$10.00', 'step-count': '3 / 3', 'running-sum': '+$10.00',
    });
    await slider('Add building blocks').focus();
    await page.keyboard.press('Home');
    await record('step 0: nothing', { 'step-count': '0 / 3', 'running-sum': '$0.00' });
    await page.keyboard.press('ArrowRight');
    await record('step 1: cash', { 'step-count': '1 / 3', 'running-sum': '+$100.00' });
    await page.keyboard.press('ArrowRight');
    await record('step 2: minus share', { 'step-count': '2 / 3', 'running-sum': '+$10.00' });
    await page.keyboard.press('ArrowRight');
    await record('step 3: add call', { 'step-count': '3 / 3', 'running-sum': '+$10.00' });

    await slider('Strike').focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await record('K moved to 110', {
      'put-payoff': '+$20.00', 'cash-term': '+$110.00',
      'stock-term': '−$90.00', 'call-term': '$0.00', 'full-sum': '+$20.00',
    });

    await slider('Inspect expiry price').focus();
    await page.keyboard.press('End');
    await record('S moved to 160', {
      'put-payoff': '$0.00', 'cash-term': '+$110.00',
      'stock-term': '−$160.00', 'call-term': '+$50.00', 'full-sum': '$0.00',
    });
    await widget.getByRole('radio', { name: 'Stock + put = call + cash' }).click();
    await record('parity mode at K=110, S=160', {
      'put-payoff': '$0.00', 'parity-left': '+$160.00', 'parity-right': '+$160.00',
    });
    await slider('Strike').focus();
    await page.keyboard.press('ArrowRight');
    await record('parity after K moved to 115', {
      'put-payoff': '$0.00', 'parity-left': '+$160.00', 'parity-right': '+$160.00',
    });
    await slider('Inspect expiry price').focus();
    await page.keyboard.press('Home');
    await record('parity at S=0', {
      'put-payoff': '+$115.00', 'parity-left': '+$115.00', 'parity-right': '+$115.00',
    });
    await widget.getByRole('radio', { name: 'Build the put' }).click();
    await record('returned to build mode', {
      'put-payoff': '+$115.00', 'cash-term': '+$115.00', 'stock-term': '$0.00',
      'call-term': '$0.00', 'full-sum': '+$115.00',
    });
    assert.deepEqual(errors, [], 'Browser errors');
    assert.equal(await page.locator('.katex-error').count(), 0, 'KaTeX errors');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert(overflow <= 1, 'Horizontal overflow: ' + overflow + 'px');
  } finally {
    await context.close();
  }
}

try {
  await serverReady();
  browser = await launch();
  for (const theme of ['dark', 'light']) {
    for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 800 }]) {
      await exercise(theme, viewport);
    }
  }
  console.log('TASK-003 Playwright click-through passed in both themes, desktop and phone.');
} finally {
  if (browser) await browser.close();
  server.kill();
}
