import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = process.env.GLYPH_TEST_ORIGIN || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
function cardFor(identity) {
  return [...document.querySelectorAll('#ugGrid .ug-card')]
    .find(card => card.querySelector('.ug-id')?.textContent === identity);
}
async function ready(page) {
  await page.waitForFunction(() => {
    const card = [...document.querySelectorAll('#ugGrid .ug-card')]
      .find(item => item.querySelector('.ug-id')?.textContent === 'retrograde');
    return !!card?.querySelector('.relphi-glyph-retrograde path');
  }, { timeout: 30000 });
}
async function inspect(page) {
  return page.evaluate(() => {
    const get = id => [...document.querySelectorAll('#ugGrid .ug-card')]
      .find(card => card.querySelector('.ug-id')?.textContent === id);
    const card = get('retrograde');
    const svg = card.querySelector('svg');
    const ring = card.querySelector('.relphi-glyph-bubble > circle');
    const art = card.querySelector('.relphi-glyph-retrograde');
    const rect = art.getBoundingClientRect();
    const circle = ring.getBoundingClientRect();
    const center = { x: circle.x + circle.width / 2, y: circle.y + circle.height / 2 };
    const corners = [[rect.left,rect.top],[rect.right,rect.top],[rect.left,rect.bottom],[rect.right,rect.bottom]];
    const farthest = Math.max(...corners.map(([x,y]) => Math.hypot(x-center.x,y-center.y)));
    const vertex = get('vertex')?.querySelector('.relphi-glyph-vertex');
    return {
      viewBox: svg.getAttribute('viewBox'),
      paths: art.querySelectorAll('path').length,
      embeddedCircle: art.querySelectorAll('circle').length,
      liveText: art.querySelectorAll('text').length,
      dx: rect.x + rect.width / 2 - center.x,
      dy: rect.y + rect.height / 2 - center.y,
      farthest,
      clearRadius: 19 - 2.35 / 2 - 1,
      ringOpacity: ring.style.opacity,
      vertexFont: vertex ? getComputedStyle(vertex).fontFamily : null,
      vertexWeight: vertex ? getComputedStyle(vertex).fontWeight : null
    };
  });
}
try {
  for (const [name, width, height] of [['desktop',1280,800],['mobile',390,844]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/glyphs-unified-preview.html', { waitUntil: 'domcontentloaded' });
    await ready(page);
    const circled = await inspect(page);
    assert.equal(circled.viewBox, '-32 -32 64 64');
    assert.equal(circled.paths, 2, 'P and x must be authored SVG outlines');
    assert.equal(circled.embeddedCircle, 0, 'master must not contain a second ring');
    assert.equal(circled.liveText, 0, 'master must not depend on font availability');
    assert.ok(Math.abs(circled.dx) < 1, 'Retrograde horizontal center');
    assert.ok(Math.abs(circled.dy) < 1, 'Retrograde vertical center');
    assert.ok(circled.farthest < circled.clearRadius, 'Retrograde must fit entirely inside circle');
    assert.match(circled.vertexFont || '', /Montserrat/, 'Vertex must use matching Montserrat');
    assert.equal(circled.vertexWeight, '700');
    assert.equal(circled.ringOpacity, '1');
    await page.screenshot({ path: 'retrograde-master-' + name + '.png' });

    await page.locator('[data-circle="false"]').click();
    await ready(page);
    const uncircled = await inspect(page);
    assert.equal(uncircled.ringOpacity, '0');
    assert.ok(Math.abs(uncircled.dx-circled.dx)<0.25);
    assert.ok(Math.abs(uncircled.dy-circled.dy)<0.25);

    await page.locator('[data-circle="true"]').click();
    await ready(page);
    assert.equal((await inspect(page)).ringOpacity, '1');
    assert.deepEqual(errors, [], 'Master Glyph List must render without script errors');
    await page.close();
    console.log('Retrograde master Chromium PASS:', name, JSON.stringify(circled));
  }
} finally {
  await browser.close();
}
