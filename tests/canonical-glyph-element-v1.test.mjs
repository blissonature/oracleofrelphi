import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const repo = path.resolve(import.meta.dirname, '..');
let server;
let browser;
let page;
let origin;

test.before(async () => {
  server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const file = path.resolve(repo, `.${pathname}`);
      if (file !== repo && !file.startsWith(`${repo}${path.sep}`)) throw new Error('outside repository');
      const bytes = await readFile(file);
      const extension = path.extname(file);
      response.writeHead(200, { 'content-type': extension === '.json' ? 'application/json' : extension === '.svg' ? 'image/svg+xml' : extension === '.js' || extension === '.mjs' ? 'text/javascript' : 'text/html', 'cache-control': 'no-store' });
      response.end(bytes);
    } catch {
      response.writeHead(404).end('not found');
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
  page = await browser.newPage();
  await page.goto(`${origin}/canonical-glyphs-v1-preview.html`);
  await page.evaluate(async () => { await import('/relphi-canonical-glyph-element-v1.js'); });
  await page.waitForFunction(() => customElements.get('relphi-canonical-glyph'));
});

test.after(async () => {
  await browser?.close();
  await new Promise(resolve => server?.close(resolve));
});

test('element completes a static isolated instance with accessible metadata', async () => {
  const result = await page.evaluate(async () => {
    const element = document.createElement('relphi-canonical-glyph');
    element.identity = 'mercury';
    element.state = 'circled';
    const event = new Promise(resolve => element.addEventListener('relphi-canonical-glyph-load', resolve, { once: true }));
    document.body.append(element);
    await event;
    return { status: element.dataset.status, identity: element.dataset.identity, state: element.dataset.state, label: element.getAttribute('aria-label'), layers: element.shadowRoot.querySelector('#frame').firstElementChild.children.length, errorHidden: element.shadowRoot.querySelector('#error').hidden };
  });
  assert.deepEqual(result, { status: 'ready', identity: 'mercury', state: 'circled', label: 'Mercury', layers: 2, errorHidden: true });
});

test('rapid identity and state changes commit only the newest completed request', async () => {
  const result = await page.evaluate(async () => {
    const element = document.createElement('relphi-canonical-glyph');
    const loads = [];
    const errors = [];
    element.addEventListener('relphi-canonical-glyph-load', event => loads.push(event.detail));
    element.addEventListener('relphi-canonical-glyph-error', event => errors.push(event.detail));
    element.identity = 'mercury';
    element.state = 'circled';
    document.body.append(element);
    element.identity = 'venus';
    element.state = 'plain';
    await new Promise(resolve => element.addEventListener('relphi-canonical-glyph-load', resolve, { once: true }));
    await new Promise(resolve => setTimeout(resolve, 40));
    const instance = element.shadowRoot.querySelector('#frame').firstElementChild;
    return { loads, errors, committedIdentity: instance?.dataset.identity, committedState: instance?.dataset.state, layers: instance?.children.length };
  });
  assert.equal(result.committedIdentity, 'venus');
  assert.equal(result.committedState, 'plain');
  assert.equal(result.layers, 1);
  assert.deepEqual(result.errors, []);
  assert.ok(result.loads.every(detail => detail.identity === 'venus' && detail.state === 'plain'));
});

test('unavailable source renders an explicit error without substitute artwork', async () => {
  const result = await page.evaluate(async () => {
    const element = document.createElement('relphi-canonical-glyph');
    element.identity = 'moon';
    const event = new Promise(resolve => element.addEventListener('relphi-canonical-glyph-error', resolve, { once: true }));
    document.body.append(element);
    const detail = (await event).detail;
    return { detail, status: element.dataset.status, code: element.dataset.errorCode, artwork: element.shadowRoot.querySelectorAll('#frame svg').length, text: element.shadowRoot.querySelector('#error').textContent };
  });
  assert.equal(result.detail.code, 'UNAVAILABLE_MASTER');
  assert.equal(result.status, 'error');
  assert.equal(result.code, 'UNAVAILABLE_MASTER');
  assert.equal(result.artwork, 0);
  assert.match(result.text, /^UNAVAILABLE_MASTER:/);
});

test('detaching cancels stale work and leaves no rendered node or event', async () => {
  const result = await page.evaluate(async () => {
    const element = document.createElement('relphi-canonical-glyph');
    let events = 0;
    element.addEventListener('relphi-canonical-glyph-load', () => events += 1);
    element.addEventListener('relphi-canonical-glyph-error', () => events += 1);
    element.identity = 'mercury';
    document.body.append(element);
    element.remove();
    await new Promise(resolve => setTimeout(resolve, 100));
    return { events, children: element.shadowRoot.querySelector('#frame').children.length };
  });
  assert.deepEqual(result, { events: 0, children: 0 });
});

test('presentation sizing, color, and opacity remain outer CSS concerns', async () => {
  const result = await page.evaluate(async () => {
    const element = document.createElement('relphi-canonical-glyph');
    element.identity = 'mercury';
    element.style.setProperty('--relphi-glyph-size', '72px');
    element.style.setProperty('--relphi-glyph-color', 'rgb(12, 34, 56)');
    element.style.setProperty('--relphi-glyph-opacity', '.4');
    const loaded = new Promise(resolve => element.addEventListener('relphi-canonical-glyph-load', resolve, { once: true }));
    document.body.append(element);
    await loaded;
    const box = element.getBoundingClientRect();
    const path = element.shadowRoot.querySelector('.relphi-canonical-glyph__master [stroke]');
    return { width: box.width, height: box.height, hostOpacity: getComputedStyle(element).opacity, stroke: getComputedStyle(path).stroke, viewBox: element.shadowRoot.querySelector('svg').getAttribute('viewBox'), transforms: element.shadowRoot.querySelectorAll('[transform]').length };
  });
  assert.deepEqual({ width: result.width, height: result.height, hostOpacity: result.hostOpacity, viewBox: result.viewBox, transforms: result.transforms }, { width: 72, height: 72, hostOpacity: '0.4', viewBox: '0 0 100 100', transforms: 0 });
  assert.equal(result.stroke, 'rgb(12, 34, 56)');
});

test('element source contains no procedural glyph or overlay construction', async () => {
  const source = await readFile(path.join(repo, 'relphi-canonical-glyph-element-v1.js'), 'utf8');
  assert.match(source, /from '\.\/relphi-canonical-glyph-loader-v1\.js'/);
  assert.doesNotMatch(source, /getBBox|createElementNS|createBubble|<svg|<circle|Unicode|font fallback|setAttribute\(['"](?:d|viewBox|transform|stroke-width)['"]/i);
});

test('production-contract harness exposes the full 93 by five review matrix', async () => {
  const harnessPage = await browser.newPage();
  await harnessPage.goto(`${origin}/review/canonical-glyph-production-contract/index.html`);
  await harnessPage.waitForFunction(() => window.canonicalContractHarness && document.querySelector('#summary')?.dataset.settled === 'true', null, { timeout: 30000 });
  const result = await harnessPage.evaluate(() => ({ cards: document.querySelectorAll('.card').length, requests: document.querySelectorAll('relphi-canonical-glyph').length, states: new Set([...document.querySelectorAll('relphi-canonical-glyph')].map(node => node.state)).size, available: document.querySelectorAll('.card[data-availability="available"]').length, unavailable: document.querySelectorAll('.card[data-availability="unavailable"]').length, fixtures: [...document.querySelectorAll('.error-scenario')].map(node => node.dataset.errorCode), summary: document.querySelector('#summary').textContent }));
  await harnessPage.close();
  assert.deepEqual({ cards: result.cards, requests: result.requests, states: result.states, available: result.available, unavailable: result.unavailable }, { cards: 93, requests: 465, states: 5, available: 38, unavailable: 55 });
  assert.deepEqual(result.fixtures, ['ASSET_MISSING', 'ASSET_HASH_MISMATCH', 'MANIFEST_INVALID']);
  assert.match(result.summary, /^76 completed \/ 389 explicit failures \/ 465 requests$/);
});
