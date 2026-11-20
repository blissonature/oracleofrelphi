import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = process.env.GLYPH_TEST_ORIGIN || 'http://127.0.0.1:4173';
const glyphs = Object.freeze([
  { id: 'retrograde', paths: 2, outline: 'M46.666 33.1' },
  { id: 'anti-vertex', paths: 3, outline: 'M27 57.623' }
]);
const browser = await chromium.launch({ headless: true });

async function ready(page) {
  await page.waitForFunction(ids => ids.every(id => {
    const card = [...document.querySelectorAll('#ugGrid .ug-card')]
      .find(item => item.querySelector('.ug-id')?.textContent === id);
    return !!card?.querySelector('.relphi-glyph-' + id + ' path');
  }), glyphs.map(g => g.id), { timeout: 30000 });
}

async function inspect(page) {
  return page.evaluate(ids => {
    const get = id => [...document.querySelectorAll('#ugGrid .ug-card')]
      .find(card => card.querySelector('.ug-id')?.textContent === id);
    const letters = Object.fromEntries(ids.map(id => {
      const card = get(id);
      const svg = card.querySelector('svg');
      const ring = card.querySelector('.relphi-glyph-bubble > circle');
      const art = card.querySelector('.relphi-glyph-' + id);
      const rect = art.getBoundingClientRect();
      const circle = ring.getBoundingClientRect();
      const center = { x: circle.x + circle.width / 2, y: circle.y + circle.height / 2 };
      const corners = [[rect.left,rect.top],[rect.right,rect.top],[rect.left,rect.bottom],[rect.right,rect.bottom]];
      return [id, {
        viewBox: svg.getAttribute('viewBox'),
        paths: art.querySelectorAll('path').length,
        firstPath: art.querySelector('path')?.getAttribute('d')?.slice(0, 25) || '',
        embeddedCircle: art.querySelectorAll('circle').length,
        liveText: art.querySelectorAll('text').length,
        dx: rect.x + rect.width / 2 - center.x,
        dy: rect.y + rect.height / 2 - center.y,
        farthest: Math.max(...corners.map(([x,y]) => Math.hypot(x-center.x,y-center.y))),
        clearRadius: 19 - 2.35 / 2 - 1,
        ringOpacity: ring.style.opacity
      }];
    }));
    const vertex = get('vertex')?.querySelector('.relphi-glyph-vertex');
    return {
      letters,
      vertexFont: vertex ? getComputedStyle(vertex).fontFamily : null,
      vertexWeight: vertex ? getComputedStyle(vertex).fontWeight : null
    };
  }, glyphs.map(g => g.id));
}

try {
  for (const [name, width, height] of [['desktop',1280,800],['mobile',390,844]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/glyphs-unified-preview.html', { waitUntil: 'domcontentloaded' });
    await ready(page);
    const circled = await inspect(page);
    assert.match(circled.vertexFont || '', /Montserrat/, 'Vertex must use Montserrat');
    assert.equal(circled.vertexWeight, '700');

    for (const glyph of glyphs) {
      const measured = circled.letters[glyph.id];
      assert.equal(measured.viewBox, '-32 -32 64 64');
      assert.equal(measured.paths, glyph.paths, 'Montserrat outlined letter count: ' + glyph.id);
      assert.ok(measured.firstPath.startsWith(glyph.outline), 'Expected committed Montserrat master: ' + glyph.id);
      assert.equal(measured.embeddedCircle, 0, 'No added circle inside the SVG master: ' + glyph.id);
      assert.equal(measured.liveText, 0, 'Master is font-independent outlined SVG: ' + glyph.id);
      assert.ok(Math.abs(measured.dx) < 1, 'Horizontal center: ' + glyph.id);
      assert.ok(Math.abs(measured.dy) < 1, 'Vertical center: ' + glyph.id);
      assert.ok(measured.farthest < measured.clearRadius, 'Entire mark fits within the ring: ' + glyph.id);
      assert.equal(measured.ringOpacity, '1');
    }

    const assets = await page.evaluate(async ids => Object.fromEntries(await Promise.all(ids.map(async id => {
      const response = await fetch('assets/planet-glyphs/' + id + '.svg');
      if (!response.ok) throw new Error('Asset unavailable: ' + id);
      const svg = new DOMParser().parseFromString(await response.text(), 'image/svg+xml').documentElement;
      return [id, {
        viewBox: svg.getAttribute('viewBox'),
        paths: svg.querySelectorAll('path').length,
        circles: svg.querySelectorAll('circle').length,
        text: svg.querySelectorAll('text').length
      }];
    }))), glyphs.map(g => g.id));
    for (const glyph of glyphs) {
      assert.deepEqual(assets[glyph.id], { viewBox: '0 0 100 100', paths: glyph.paths, circles: 0, text: 0 },
        'Authored SVG frame and master-only paths: ' + glyph.id);
    }

    await page.screenshot({ path: 'retrograde-master-' + name + '.png', fullPage: true });
    await page.locator('[data-circle="false"]').click();
    await ready(page);
    const uncircled = await inspect(page);
    for (const glyph of glyphs) {
      const previous = circled.letters[glyph.id], current = uncircled.letters[glyph.id];
      assert.equal(current.ringOpacity, '0');
      assert.ok(Math.abs(current.dx - previous.dx) < 0.25);
      assert.ok(Math.abs(current.dy - previous.dy) < 0.25);
    }
    await page.locator('[data-circle="true"]').click();
    await ready(page);
    const restored = await inspect(page);
    for (const glyph of glyphs) assert.equal(restored.letters[glyph.id].ringOpacity, '1');
    assert.deepEqual(errors, [], 'Master Glyph List has no script errors');
    await page.close();
    console.log('Montserrat letter masters Chromium PASS:', name, JSON.stringify(circled));
  }
} finally {
  await browser.close();
}
