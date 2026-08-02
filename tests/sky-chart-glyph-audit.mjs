import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const signs = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

function placement(name, longitude) {
  const value = ((Number(longitude) % 360) + 360) % 360;
  const signIndex = Math.floor(value / 30);
  const within = value - signIndex * 30;
  const degree = Math.floor(within);
  const minuteFloat = (within - degree) * 60;
  const minute = Math.floor(minuteFloat);
  const second = Math.round((minuteFloat - minute) * 60);
  return { name, longitude:value, sign:signs[signIndex], degree, minute, second };
}

function sample(name, offset, profile) {
  const asc = (168.38 + offset) % 360;
  const mc = (76.28 + offset) % 360;
  const houseCusps = Array.from({length:12}, (_, index)=>(asc + index * 30) % 360);
  const values = {
    Sun:195.00,
    Moon:118.42,
    Mercury:206.17,
    Venus:169.88,
    Mars:167.87,
    Jupiter:307.15,
    Saturn:235.57,
    Uranus:254.85,
    Neptune:271.02,
    Pluto:213.88,
    Ascendant:asc - offset,
    Descendant:asc - offset + 180,
    Midheaven:mc - offset,
    IC:mc - offset + 180,
    Chiron:74.48,
    'North Node':40.30,
    'South Node':220.30,
    Lilith:44.23,
    'Part of Fortune':244.97,
    Vertex:330.33
  };
  const placements = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, placement(key, value + offset)])
  );
  return {
    name,
    houseSystem:'equal-house',
    houseCusps,
    calcProfile:{
      dateTime:profile.dateTime,
      instant:profile.instant,
      location:profile.location,
      locationQuery:profile.location,
      timeZone:profile.timeZone,
      latitude:profile.latitude,
      longitude:profile.longitude,
      houseSystem:'equal-house',
      houseCusps
    },
    placements
  };
}

const skyA = sample('My birth chart', 0, {
  dateTime:'1985-10-08T04:37',
  instant:'1985-10-08T08:37:00.000Z',
  location:'Malden, Massachusetts, United States',
  timeZone:'America/New_York',
  latitude:42.4251,
  longitude:-71.0662
});
const skyB = sample('Planetary Hours 2026-08-02 02:07', 29.27, {
  dateTime:'2026-08-02T02:07',
  instant:'2026-08-02T08:07:00.000Z',
  location:'Salt Lake City, Utah, United States',
  timeZone:'America/Denver',
  latitude:40.7608,
  longitude:-111.8910
});

const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1660,height:1300}});
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (message.type() === 'error' && !/favicon/i.test(message.text())) errors.push(message.text());
});

await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js', route => route.fulfill({
  path:path.resolve('node_modules/suncalc/suncalc.js'),
  contentType:'application/javascript'
}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js', route => route.fulfill({
  path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),
  contentType:'application/javascript'
}));
await page.addInitScript(({a,b}) => {
  localStorage.setItem('relphiSkyChartA', JSON.stringify(a));
  localStorage.setItem('relphiSkyChartB', JSON.stringify(b));
  sessionStorage.removeItem('relphiSkyWhereWhenViewV1');
}, {a:skyA,b:skyB});

await page.goto('http://127.0.0.1:4173/sky-chart.html', {waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]', {timeout:20000});
await page.waitForSelector('.sky-foundation-relationship-row[data-relation-index]', {timeout:20000});
await page.waitForSelector('#skySelectedRelationship:not([hidden])', {timeout:20000});
await page.waitForFunction(() => document.querySelectorAll('.sky-ph-heptagram[data-canonical-heptagram-v1="true"]').length === 2, null, {timeout:20000});
await page.waitForSelector('html[data-sky-glyph-audit="passed"][data-sky-glyph-audit-count="0"]', {timeout:20000});

const auditIssues = await page.evaluate(() => window.RelphiSkyGlyphAudit?.run?.() || ['Audit API unavailable']);
assert.deepEqual(auditIssues, []);
assert.equal(await page.evaluate(() => window.RelphiGlyphComponent?.skyWhitespaceAware === true), true);

const contextIssues = await page.evaluate(() => {
  const issues = [];
  const registry = window.RelphiGlyphRegistry;
  const signs = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const chaldean = ['saturn','jupiter','mars','sun','venus','mercury','moon'];
  const rootFor = host => host?.querySelector?.('.relphi-glyph-bubble') || null;
  const artFor = root => Array.from(root?.children || []).find(node => node.classList?.contains('relphi-canonical-glyph')) || null;
  const circleFor = root => root?.querySelector?.(':scope > circle') || null;
  const hidden = root => {
    const circle = circleFor(root);
    if (!circle) return false;
    return root.classList.contains('relphi-glyph-framed') ||
      root.dataset.canonicalFraming === 'hidden-bubble' ||
      Number(circle.getAttribute('opacity')) === 0 ||
      Number.parseFloat(circle.style.opacity || '') === 0 ||
      circle.closest('svg')?.dataset?.canonicalCircle === 'hidden';
  };
  const checkIdentity = (host, expected, label, shouldHide) => {
    const root = rootFor(host);
    const art = artFor(root);
    if (!root) return issues.push(`${label}: no canonical bubble`);
    if (root.dataset.glyphId !== expected) issues.push(`${label}: expected ${expected}, received ${root.dataset.glyphId || '(missing)'}`);
    if (!registry.get(expected) && !registry.resolve(expected)) issues.push(`${label}: ${expected} is absent from the registry`);
    if (!art?.classList.contains(`relphi-glyph-${expected}`)) issues.push(`${label}: artwork class does not match ${expected}`);
    if (shouldHide !== undefined && hidden(root) !== shouldHide) issues.push(`${label}: calibration circle visibility is wrong`);
    const entry = registry.get(expected) || registry.resolve(expected);
    if (entry?.asset && art?.querySelector('text')) issues.push(`${label}: asset-backed glyph was replaced by text`);
  };

  document.querySelectorAll('.sky-foundation-ledger .sky-foundation-row[data-placement]').forEach((row, index) => {
    checkIdentity(row.querySelector(':scope > svg'), row.dataset.placement, `ledger ${index + 1}`, true);
  });

  const zodiac = Array.from(document.querySelectorAll('[data-layer="zodiac"] > g'));
  if (zodiac.length !== 12) issues.push(`zodiac wheel: expected 12 glyphs, received ${zodiac.length}`);
  zodiac.forEach((host, index) => checkIdentity(host, signs[index], `zodiac ${signs[index]}`, true));

  document.querySelectorAll('[data-layer="placements"] > g[data-placement]').forEach((host, index) => {
    checkIdentity(host, host.dataset.placement, `wheel placement ${index + 1}`, false);
  });

  document.querySelectorAll('.sky-foundation-relationship-row').forEach((row, rowIndex) => {
    const glyphs = row.querySelectorAll(':scope > svg');
    const expected = [row.dataset.leftPlacement, row.dataset.aspect, row.dataset.rightPlacement];
    if (glyphs.length !== 3) issues.push(`relationship row ${rowIndex + 1}: expected 3 glyphs, received ${glyphs.length}`);
    expected.forEach((id, index) => checkIdentity(glyphs[index], id, `relationship row ${rowIndex + 1} glyph ${index + 1}`, true));
  });

  const selected = document.querySelector('#skySelectedRelationship');
  const selectedRow = document.querySelector(`.sky-foundation-relationship-row[data-relation-index="${selected?.dataset?.relationIndex}"]`);
  if (selected && selectedRow) {
    checkIdentity(selected.querySelector('[data-selected-graphic-a]'), selectedRow.dataset.leftPlacement, 'selected header Sky A', false);
    checkIdentity(selected.querySelector('[data-selected-graphic-aspect]'), selectedRow.dataset.aspect, 'selected header aspect', false);
    checkIdentity(selected.querySelector('[data-selected-graphic-b]'), selectedRow.dataset.rightPlacement, 'selected header Sky B', false);
  } else {
    issues.push('selected relationship or its source row is unavailable');
  }

  document.querySelectorAll('.sky-selected-reveal-glyph svg').forEach(host => {
    checkIdentity(host, selectedRow?.dataset?.aspect, 'selected reveal aspect', true);
  });
  document.querySelectorAll('.sky-progressive-token[data-progressive-glyph-id]').forEach((token, index) => {
    checkIdentity(token.querySelector('svg'), token.dataset.progressiveGlyphId, `progressive token ${index + 1}`, true);
  });

  document.querySelectorAll('.sky-ph-heptagram[data-canonical-heptagram-v1="true"]').forEach((svg, chartIndex) => {
    chaldean.forEach(key => {
      const host = svg.querySelector(`.sky-ph-${key} .sky-ph-node-glyph`);
      checkIdentity(host, key, `heptagram ${chartIndex + 1} ${key}`, false);
    });
  });

  document.querySelectorAll('.relphi-glyph-venus').forEach((art, index) => {
    const circle = art.querySelector('circle');
    const path = art.querySelector('path');
    if (!circle || !path) issues.push(`Venus ${index + 1}: canonical circle or cross is missing`);
    if (circle && getComputedStyle(circle).stroke === 'none') issues.push(`Venus ${index + 1}: circle stroke is missing`);
    if (path && getComputedStyle(path).stroke === 'none') issues.push(`Venus ${index + 1}: cross stroke is missing`);
  });
  document.querySelectorAll('.relphi-glyph-moon').forEach((art, index) => {
    const path = art.querySelector('path');
    if (!path) issues.push(`Moon ${index + 1}: canonical crescent path is missing`);
    if (path && getComputedStyle(path).stroke === 'none') issues.push(`Moon ${index + 1}: supportive stroke is missing`);
  });

  document.querySelectorAll('.relphi-glyph-bubble').forEach((root, index) => {
    const id = root.dataset.glyphId;
    const entry = registry.get(id) || registry.resolve(id);
    const art = artFor(root);
    if (!entry) issues.push(`bubble ${index + 1}: unresolved identity ${id || '(missing)'}`);
    if (!art) issues.push(`bubble ${index + 1}: canonical artwork missing`);
    if (entry && art && !art.classList.contains(`relphi-glyph-${entry.id}`)) issues.push(`bubble ${index + 1}: identity/artwork mismatch`);
  });

  return Array.from(new Set(issues));
});
assert.deepEqual(contextIssues, []);
assert.deepEqual(errors, []);

await page.screenshot({path:'sky-chart-glyph-audit-desktop.png', fullPage:true});
await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(300);
await page.waitForSelector('html[data-sky-glyph-audit="passed"][data-sky-glyph-audit-count="0"]', {timeout:10000});
assert.deepEqual(await page.evaluate(() => window.RelphiSkyGlyphAudit.run()), []);
await page.screenshot({path:'sky-chart-glyph-audit-mobile.png', fullPage:true});

await browser.close();
console.log('Sky Chart glyph audit passed across all rendered contexts.');
