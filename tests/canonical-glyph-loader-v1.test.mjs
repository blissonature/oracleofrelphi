import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const repo = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(path.join(repo, 'assets/canonical-glyphs/v1/manifest.json'), 'utf8'));
const available = manifest.identities.filter(entry => entry.candidate_path);
const unavailable = manifest.identities.filter(entry => !entry.candidate_path);
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
      response.writeHead(200, {
        'content-type': extension === '.json' ? 'application/json' : extension === '.svg' ? 'image/svg+xml' : extension === '.js' || extension === '.mjs' ? 'text/javascript' : 'text/html',
        'cache-control': 'no-store'
      });
      response.end(bytes);
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain' });
      response.end('not found');
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
  page = await browser.newPage();
  await page.goto(`${origin}/canonical-glyphs-v1-preview.html`);
  await page.evaluate(async () => {
    window.canonicalLoaderModule = await import('/relphi-canonical-glyph-loader-v1.js');
  });
});

test.after(async () => {
  await browser?.close();
  await new Promise(resolve => server?.close(resolve));
});

async function evaluateRequest({ identity = 'mercury', state = 'plain', mode = 'normal', concurrent = 1, abort = false, clear = false } = {}) {
  return page.evaluate(async options => {
    const base = '/assets/canonical-glyphs/v1/manifest.json';
    let fetchCount = 0;
    const fetchImpl = async (input, init) => {
      fetchCount += 1;
      const url = String(input);
      let response = await fetch(input, init);
      if ((options.mode === 'hostile-approved' || options.mode === 'viewbox-approved') && url.endsWith('/manifest.json')) {
        const value = await response.json();
        const original = await (await fetch('/assets/canonical-glyphs/v1/masters/assets/planet-glyphs/mercury.svg')).text();
        const changed = options.mode === 'hostile-approved'
          ? original.replace('</svg>', '<script>alert(1)</script></svg>')
          : original.replace('viewBox="0 0 100 100"', 'viewBox="0 0 99 100"');
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(changed));
        value.identities.find(row => row.canonical_identity === 'mercury').candidate_sha256 = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
        return new Response(JSON.stringify(value), { status: 200 });
      }
      if (options.mode === 'missing-master' && url.includes('/mercury.svg')) return new Response('', { status: 404 });
      if (options.mode === 'missing-overlay' && url.includes('/circled.svg')) return new Response('', { status: 404 });
      if (options.mode === 'network-failure' && url.includes('/mercury.svg')) throw new TypeError('offline');
      if (options.mode === 'malformed-manifest' && url.endsWith('/manifest.json')) return new Response('{}', { status: 200 });
      if (options.mode === 'manifest-hash-change' && url.endsWith('/manifest.json')) {
        const value = await response.json();
        value.identities.find(row => row.canonical_identity === 'mercury').candidate_sha256 = '0'.repeat(64);
        return new Response(JSON.stringify(value), { status: 200 });
      }
      if (options.mode === 'source-byte-change' && url.includes('/mercury.svg')) return new Response(`${await response.text()} `, { status: 200 });
      if (options.mode === 'approval-change' && url.includes('/sun-approved-difference.json')) {
        const value = await response.json();
        value.geometry_confirmation.geometry = false;
        return new Response(JSON.stringify(value), { status: 200 });
      }
      if (options.mode === 'approval-missing' && url.includes('/sun-approved-difference.json')) return new Response('', { status: 404 });
      if (options.mode === 'hostile-markup' && url.includes('/mercury.svg')) {
        const value = await response.text();
        return new Response(value.replace('</svg>', '<script>alert(1)</script></svg>'), { status: 200 });
      }
      if ((options.mode === 'hostile-approved' || options.mode === 'viewbox-approved') && url.includes('/mercury.svg')) {
        const original = await response.text();
        return new Response(options.mode === 'hostile-approved'
          ? original.replace('</svg>', '<script>alert(1)</script></svg>')
          : original.replace('viewBox="0 0 100 100"', 'viewBox="0 0 99 100"'), { status: 200 });
      }
      if (options.mode === 'delayed-master' && url.includes('/mercury.svg')) await new Promise(resolve => setTimeout(resolve, 100));
      return response;
    };
    const loader = window.canonicalLoaderModule.createCanonicalGlyphLoader({ manifestUrl: base, fetchImpl });
    const controller = new AbortController();
    if (options.abort) setTimeout(() => controller.abort('test cancellation'), 10);
    const request = () => loader.loadCanonicalGlyph(options.identity, { state: options.state, signal: controller.signal });
    try {
      const nodes = await Promise.all(Array.from({ length: options.concurrent }, request));
      const first = nodes[0];
      const beforeClear = fetchCount;
      let afterClear = null;
      if (options.clear) {
        await loader.loadCanonicalGlyph(options.identity, { state: options.state });
        const cachedCount = fetchCount;
        loader.clearCanonicalGlyphCache();
        await loader.loadCanonicalGlyph(options.identity, { state: options.state });
        afterClear = { cachedCount, finalCount: fetchCount };
      }
      return {
        ok: true,
        html: first.outerHTML,
        htmls: nodes.map(node => node.outerHTML),
        distinct: new Set(nodes).size,
        layerCount: first.children.length,
        viewBoxes: [...first.querySelectorAll('svg')].map(svg => svg.getAttribute('viewBox')),
        transforms: first.querySelectorAll('[transform]').length,
        runtimeCircles: first.querySelectorAll('circle').length,
        fetchCount,
        beforeClear,
        afterClear,
        frozenAvailability: Object.isFrozen(await loader.inspectCanonicalGlyphAvailability(options.identity, options.state))
      };
    } catch (error) {
      return { ok: false, code: error.code, message: error.message, detailsFrozen: Object.isFrozen(error.details), errorFrozen: Object.isFrozen(error), fetchCount };
    }
  }, { identity, state, mode, concurrent, abort, clear });
}

test('all 38 available masters complete in Plain without altered viewBoxes or added transforms', async () => {
  const results = await page.evaluate(async identities => {
    const loader = window.canonicalLoaderModule.createCanonicalGlyphLoader({ manifestUrl: '/assets/canonical-glyphs/v1/manifest.json' });
    return Promise.all(identities.map(async identity => {
      const node = await loader.loadCanonicalGlyph(identity, { state: 'plain' });
      return { identity, layers: node.children.length, viewBox: node.querySelector('svg').getAttribute('viewBox'), transforms: node.querySelectorAll('[transform]').length };
    }));
  }, available.map(entry => entry.canonical_identity));
  assert.equal(results.length, 38);
  assert.ok(results.every(result => result.layers === 1 && result.viewBox === '0 0 100 100' && result.transforms === 0));
});

test('all 38 available masters compose with the approved static Circled layer', async () => {
  const results = await page.evaluate(async identities => {
    const loader = window.canonicalLoaderModule.createCanonicalGlyphLoader({ manifestUrl: '/assets/canonical-glyphs/v1/manifest.json' });
    return Promise.all(identities.map(async identity => {
      const node = await loader.loadCanonicalGlyph(identity, { state: 'circled' });
      return { layers: node.children.length, viewBoxes: [...node.querySelectorAll('svg')].map(svg => svg.getAttribute('viewBox')) };
    }));
  }, available.map(entry => entry.canonical_identity));
  assert.ok(results.every(result => result.layers === 2 && result.viewBoxes.every(viewBox => viewBox === '0 0 100 100')));
});

test('all 55 unavailable identities fail explicitly and Moon remains unavailable', async () => {
  const results = await page.evaluate(async identities => {
    const loader = window.canonicalLoaderModule.createCanonicalGlyphLoader({ manifestUrl: '/assets/canonical-glyphs/v1/manifest.json' });
    return Promise.all(identities.map(async identity => {
      try { await loader.loadCanonicalGlyph(identity); return { identity, code: null }; }
      catch (error) { return { identity, code: error.code }; }
    }));
  }, unavailable.map(entry => entry.canonical_identity));
  assert.equal(results.length, 55);
  assert.ok(results.every(result => result.code === 'UNAVAILABLE_MASTER'));
  assert.equal(results.find(result => result.identity === 'moon').code, 'UNAVAILABLE_MASTER');
});

test('all three ruler states fail explicitly without state substitution', async () => {
  for (const state of ['day-ruler', 'hour-ruler', 'day-and-hour-ruler']) {
    assert.equal((await evaluateRequest({ state })).code, 'UNAVAILABLE_OVERLAY');
  }
});

test('the five documented-difference masters require their exact matching approval records', async () => {
  const approved = available.filter(entry => entry.status === 'approved-with-documented-raster-difference').map(entry => entry.canonical_identity);
  assert.deepEqual(approved.sort(), ['capricorn', 'jupiter', 'pluto', 'sun', 'virgo']);
  for (const identity of approved) assert.equal((await evaluateRequest({ identity })).ok, true, identity);
  assert.equal((await evaluateRequest({ identity: 'sun', mode: 'approval-change' })).code, 'MANIFEST_INVALID');
  assert.equal((await evaluateRequest({ identity: 'sun', mode: 'approval-missing' })).code, 'ASSET_MISSING');
});

test('one changed source byte or manifest hash fails SHA-256 verification', async () => {
  assert.equal((await evaluateRequest({ mode: 'source-byte-change' })).code, 'ASSET_HASH_MISMATCH');
  assert.equal((await evaluateRequest({ mode: 'manifest-hash-change' })).code, 'ASSET_HASH_MISMATCH');
});

test('completed output preserves source geometry and stroke attributes exactly', async () => {
  const comparison = await page.evaluate(async () => {
    const loader = window.canonicalLoaderModule.createCanonicalGlyphLoader({ manifestUrl: '/assets/canonical-glyphs/v1/manifest.json' });
    const node = await loader.loadCanonicalGlyph('neptune');
    const returned = node.querySelector('svg');
    const sourceText = await (await fetch('/assets/canonical-glyphs/v1/masters/assets/planet-glyphs/neptune.svg')).text();
    const source = new DOMParser().parseFromString(sourceText, 'image/svg+xml').documentElement;
    const attributes = element => [...element.attributes].filter(attribute => !['class', 'aria-hidden'].includes(attribute.name)).map(attribute => [attribute.name, attribute.value]);
    return {
      sourceViewBox: source.getAttribute('viewBox'),
      returnedViewBox: returned.getAttribute('viewBox'),
      sourceChildren: [...source.children].map(child => ({ tag: child.localName, attributes: attributes(child) })),
      returnedChildren: [...returned.children].map(child => ({ tag: child.localName, attributes: attributes(child) })),
      loaderTransforms: node.querySelectorAll('[transform]').length
    };
  });
  assert.equal(comparison.returnedViewBox, comparison.sourceViewBox);
  assert.deepEqual(comparison.returnedChildren, comparison.sourceChildren);
  assert.equal(comparison.loaderTransforms, 0);
});

test('concurrent callers receive separate DOM instances with identical serialization', async () => {
  const result = await evaluateRequest({ identity: 'venus', state: 'circled', concurrent: 12 });
  assert.equal(result.ok, true);
  assert.equal(result.distinct, 12);
  assert.equal(new Set(result.htmls).size, 1);
  assert.equal(result.frozenAvailability, true);
});

test('cancellation returns no partial result and structured errors are immutable', async () => {
  const result = await evaluateRequest({ mode: 'delayed-master', abort: true });
  assert.deepEqual({ ok: result.ok, code: result.code, detailsFrozen: result.detailsFrozen, errorFrozen: result.errorFrozen }, { ok: false, code: 'REQUEST_ABORTED', detailsFrozen: true, errorFrozen: true });
});

test('cached and uncached output serialize identically and cache clearing refetches source bytes', async () => {
  const result = await evaluateRequest({ identity: 'mercury', state: 'circled', concurrent: 2, clear: true });
  assert.equal(result.ok, true);
  assert.equal(new Set(result.htmls).size, 1);
  assert.ok(result.afterClear.finalCount > result.afterClear.cachedCount);
});

test('Plain and Circled differ only by the immutable static overlay layer', async () => {
  const result = await page.evaluate(async () => {
    const loader = window.canonicalLoaderModule.createCanonicalGlyphLoader({ manifestUrl: '/assets/canonical-glyphs/v1/manifest.json' });
    const plain = await loader.loadCanonicalGlyph('mercury', { state: 'plain' });
    const circled = await loader.loadCanonicalGlyph('mercury', { state: 'circled' });
    return {
      sameMaster: plain.querySelector('.relphi-canonical-glyph__master').outerHTML === circled.querySelector('.relphi-canonical-glyph__master').outerHTML,
      overlayLayers: circled.querySelectorAll('.relphi-canonical-glyph__overlay').length,
      plainLayers: plain.children.length,
      circledLayers: circled.children.length
    };
  });
  assert.deepEqual(result, { sameMaster: true, overlayLayers: 1, plainLayers: 1, circledLayers: 2 });
});

test('malformed, missing, hostile, and network fixtures fail closed with exact codes', async () => {
  assert.equal((await evaluateRequest({ mode: 'malformed-manifest' })).code, 'MANIFEST_INVALID');
  assert.equal((await evaluateRequest({ mode: 'missing-master' })).code, 'ASSET_MISSING');
  assert.equal((await evaluateRequest({ state: 'circled', mode: 'missing-overlay' })).code, 'ASSET_MISSING');
  assert.equal((await evaluateRequest({ mode: 'network-failure' })).code, 'NETWORK_FAILURE');
  assert.equal((await evaluateRequest({ mode: 'hostile-markup' })).code, 'ASSET_HASH_MISMATCH');
  assert.equal((await evaluateRequest({ mode: 'hostile-approved' })).code, 'PROHIBITED_MARKUP');
  assert.equal((await evaluateRequest({ mode: 'viewbox-approved' })).code, 'INCOMPLETE_COMPOSITION');
});

test('preload and availability APIs retain fail-closed semantics', async () => {
  const result = await page.evaluate(async () => {
    const loader = window.canonicalLoaderModule.createCanonicalGlyphLoader({ manifestUrl: '/assets/canonical-glyphs/v1/manifest.json' });
    const nodes = await loader.preloadCanonicalGlyphs(['mercury', { identity: 'venus', state: 'circled' }]);
    const blocked = await loader.inspectCanonicalGlyphAvailability('moon', 'plain');
    const overlayBlocked = await loader.inspectCanonicalGlyphAvailability('mercury', 'day-ruler');
    const unknown = await loader.inspectCanonicalGlyphAvailability('not-real', 'plain');
    return { count: nodes.length, frozen: Object.isFrozen(nodes), layers: nodes.map(node => node.children.length), blocked, overlayBlocked, unknown };
  });
  assert.deepEqual({ count: result.count, frozen: result.frozen, layers: result.layers }, { count: 2, frozen: true, layers: [1, 2] });
  assert.equal(result.blocked.code, 'UNAVAILABLE_MASTER');
  assert.equal(result.overlayBlocked.code, 'UNAVAILABLE_OVERLAY');
  assert.equal(result.unknown.code, 'UNKNOWN_IDENTITY');
});

test('unknown identities and states are explicit and never substituted', async () => {
  assert.equal((await evaluateRequest({ identity: 'not-a-glyph' })).code, 'UNKNOWN_IDENTITY');
  assert.equal((await evaluateRequest({ state: 'nearby-state' })).code, 'UNKNOWN_STATE');
});

test('loader source has no geometry construction, fallback, fitting, or repair path', async () => {
  const source = await readFile(path.join(repo, 'relphi-canonical-glyph-loader-v1.js'), 'utf8');
  assert.doesNotMatch(source, /getBBox|createElementNS|createBubble|Unicode|font fallback|textGlyph|setAttribute\(['"]transform|\bradius\b|\bpadding\b|path rewriting|stroke repair/i);
  assert.doesNotMatch(source, /createElement\(['"](?:svg|circle|path|line|rect|ellipse|polygon|polyline)['"]\)/i);
});
