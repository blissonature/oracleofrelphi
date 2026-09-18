import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const fixedInstant = '2026-08-03T02:30:00.000Z';
const currentLocation = {
  latitude:40.7608,
  longitude:-111.8910,
  timezone:'America/Denver',
  canonical:'Salt Lake City, Utah, United States'
};

function placement(name, longitude) {
  const value = ((longitude % 360) + 360) % 360;
  const sign = Math.floor(value / 30);
  const within = value - sign * 30;
  const degree = Math.floor(within);
  const minute = Math.floor((within - degree) * 60);
  return { name, longitude:value, sign:SIGNS[sign], degree, minute, second:0 };
}

function sample(name, offset, profile) {
  const asc = (168.38 + offset) % 360;
  const cusps = Array.from({ length:12 }, (_, index) => (asc + index * 30) % 360);
  const raw = {
    Sun:195, Moon:118.42, Mercury:206.17, Venus:169.88, Mars:167.87,
    Jupiter:307.15, Saturn:235.57, Uranus:254.85, Neptune:271.02, Pluto:213.88,
    Ascendant:168.38, Midheaven:76.28, Chiron:74.48, Lilith:44.23, Vertex:330.33
  };
  return {
    name,
    houseSystem:'equal-house',
    houseCusps:cusps,
    calcProfile:{ ...profile, houseCusps:cusps, houseSystem:'equal-house' },
    placements:Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, placement(key, value + offset)]))
  };
}

const skyA = sample('My birth chart', 0, {
  dateTime:'1985-10-08T04:37', instant:'1985-10-08T08:37:00.000Z',
  location:'Malden, Massachusetts, United States', timeZone:'America/New_York',
  latitude:42.4251, longitude:-71.0662
});
const skyB = sample('Current sky', 29.27, {
  dateTime:'2026-07-31T00:37', instant:'2026-07-31T06:37:00.000Z',
  location:'Denver, Colorado, United States', timeZone:'America/Denver',
  latitude:39.7392, longitude:-104.9903
});

const browser = await chromium.launch({ headless:true });
const context = await browser.newContext({
  viewport:{ width:1680, height:1000 },
  deviceScaleFactor:1,
  geolocation:{ latitude:currentLocation.latitude, longitude:currentLocation.longitude },
  permissions:['geolocation'],
  timezoneId:currentLocation.timezone
});
const page = await context.newPage();
page.setDefaultTimeout(12000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));

await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js', route => route.fulfill({
  path:path.resolve('node_modules/suncalc/suncalc.js'), contentType:'application/javascript'
}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js', route => route.fulfill({
  path:path.resolve('node_modules/luxon/build/global/luxon.min.js'), contentType:'application/javascript'
}));
await page.route('https://api.bigdatacloud.net/**', route => route.fulfill({
  status:200,
  contentType:'application/json',
  body:JSON.stringify({
    locality:'Salt Lake City',
    principalSubdivision:'Utah',
    countryName:'United States'
  })
}));
await page.route('https://api.open-meteo.com/**', route => route.fulfill({
  status:200,
  contentType:'application/json',
  body:JSON.stringify({ timezone:currentLocation.timezone, current:{ temperature_2m:27 } })
}));

await page.addInitScript(({ a, b, fixed }) => {
  const NativeDate = Date;
  const fixedValue = new NativeDate(fixed).valueOf();
  class FixedDate extends NativeDate {
    constructor(...args) { super(...(args.length ? args : [fixedValue])); }
    static now() { return fixedValue; }
  }
  Object.setPrototypeOf(FixedDate, NativeDate);
  window.Date = FixedDate;
  localStorage.setItem('relphiSkyChartA', JSON.stringify(a));
  localStorage.setItem('relphiSkyChartB', JSON.stringify(b));
  localStorage.setItem('relphiSkyChartLastModeV1', 'comparison');
  sessionStorage.removeItem('relphiSkyWhereWhenViewV1');
  window.__skyBSnapshots = [];
  window.addEventListener('storage', event => {
    if (event.key !== 'relphiSkyChartB') return;
    try { window.__skyBSnapshots.push(JSON.parse(event.newValue || localStorage.getItem('relphiSkyChartB'))); }
    catch (_) {}
  });
}, { a:skyA, b:skyB, fixed:fixedInstant });

await page.goto('http://127.0.0.1:4173/sky-chart.html', { waitUntil:'domcontentloaded', timeout:15000 });
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]', { timeout:20000 });
await page.waitForFunction(() => document.documentElement.dataset.skyFinalPass === 'v2');
await page.waitForFunction(() => document.querySelectorAll('.sky-ph-heptagram').length === 2);
await page.waitForFunction(() => Array.from(document.querySelectorAll('.sky-ph-heptagram')).every(node => node.dataset.canonicalSourceReady === 'true' && node.dataset.canonicalHeptagramReady === 'true'));

assert.equal(await page.locator('#skyFoundationWheelMount .sky-axis-label').count(), 0, 'Comparison wheel must not contain chart-axis name labels.');

const ledgerAudit = await page.evaluate(() => Array.from(document.querySelectorAll('#skyFoundationA .sky-foundation-row svg,#skyFoundationB .sky-foundation-row svg')).map(svg => {
  const row = svg.closest('.sky-foundation-row');
  const art = svg.querySelector('.relphi-canonical-glyph');
  return {
    placement:row?.dataset.placement || '',
    name:row?.querySelector('.sky-foundation-row-name')?.textContent?.trim() || '',
    fit:svg.dataset.canonicalFit || '',
    committed:art?.dataset.relphiAtomicCommit || '',
    transform:art?.getAttribute('transform') || '',
    count:svg.querySelectorAll('.relphi-canonical-glyph').length,
    classes:art?.getAttribute('class') || ''
  };
}));
assert.ok(ledgerAudit.length > 20, 'Both placement ledgers must be populated.');
assert.equal(ledgerAudit.every(item => item.fit === 'registry-component'), true, 'Every ledger glyph must use the shared registry component.');
const ledgerStructuralAnomalies = ledgerAudit.filter(item => item.committed !== 'true' || !item.transform || item.count !== 1);
if (ledgerStructuralAnomalies.length) console.log('LEDGER_STRUCTURAL_ANOMALIES', JSON.stringify(ledgerStructuralAnomalies));
assert.equal(ledgerAudit.every(item => item.committed === 'true' && item.count >= 1), true, 'Every ledger glyph must contain committed canonical artwork.');

const initialHeptagramsStable = await page.evaluate(async () => {
  const beforeA = document.querySelector('#skyFoundationA .sky-ph-heptagram');
  const beforeB = document.querySelector('#skyFoundationB .sky-ph-heptagram');
  for (let index = 0; index < 12; index += 1) {
    window.dispatchEvent(new Event('relphi:sky-foundation-ready'));
    window.dispatchEvent(new Event('relphi:sky-foundation-interactions-ready'));
  }
  await new Promise(resolve => setTimeout(resolve, 750));
  return {
    sameA:beforeA === document.querySelector('#skyFoundationA .sky-ph-heptagram'),
    sameB:beforeB === document.querySelector('#skyFoundationB .sky-ph-heptagram'),
    count:document.querySelectorAll('.sky-ph-heptagram').length,
    ready:Array.from(document.querySelectorAll('.sky-ph-heptagram')).every(node => node.dataset.canonicalSourceReady === 'true' && node.dataset.canonicalHeptagramReady === 'true')
  };
});
assert.deepEqual(initialHeptagramsStable, { sameA:true, sameB:true, count:2, ready:true }, 'Repeated ready events must not rebuild or strand the heptagrams.');

await page.locator('#skyFoundationB [data-sky-drawer-tab="where"]').click();
const whereEditor = page.locator('#skyFoundationB .sky-where-when-editor');
await whereEditor.waitFor({ state:'visible' });
await whereEditor.locator('[data-ww-action="here-and-now"]').click();
await page.waitForFunction(({ canonical, latitude, longitude, timezone }) => {
  const value = JSON.parse(localStorage.getItem('relphiSkyChartB') || 'null');
  const profile = value?.calcProfile || {};
  const source = value?.placements || {};
  return profile.location === canonical &&
    profile.timeZone === timezone &&
    Math.abs(Number(profile.latitude) - latitude) < 1e-5 &&
    Math.abs(Number(profile.longitude) - longitude) < 1e-5 &&
    String(profile.dateTime || '').startsWith('2026-08-02T20:30') &&
    ['Descendant','IC','North Node','South Node','Part of Fortune','Chiron','Lilith','Vertex'].every(name => source[name]);
}, currentLocation, { timeout:25000 });

const updateAudit = await page.evaluate(() => {
  const value = JSON.parse(localStorage.getItem('relphiSkyChartB') || 'null');
  const first = window.__skyBSnapshots[0] || null;
  return {
    profile:value.calcProfile,
    names:Object.keys(value.placements || {}),
    firstNames:Object.keys(first?.placements || {}),
    snapshots:window.__skyBSnapshots.length
  };
});
assert.equal(updateAudit.profile.location, currentLocation.canonical);
assert.equal(Number(updateAudit.profile.latitude), currentLocation.latitude);
assert.equal(Number(updateAudit.profile.longitude), currentLocation.longitude);
assert.equal(updateAudit.profile.timeZone, currentLocation.timezone);
assert.match(updateAudit.profile.dateTime, /^2026-08-02T20:30/);
for (const name of ['Descendant','IC','North Node','South Node','Part of Fortune','Chiron','Lilith','Vertex']) {
  assert.ok(updateAudit.firstNames.includes(name), `${name} must exist in the first saved Now payload, not a later repair pass.`);
}
assert.ok(updateAudit.snapshots >= 1, 'Here and Now must dispatch a completed Sky B record.');

await page.waitForFunction(() => {
  const svg = document.querySelector('#skyFoundationB .sky-ph-heptagram');
  return svg?.dataset.canonicalSourceReady === 'true' && svg?.dataset.canonicalHeptagramReady === 'true';
});

const finalStability = await page.evaluate(async () => {
  const before = document.querySelector('#skyFoundationB .sky-ph-heptagram');
  const href = document.querySelector('#skyFoundationB .sky-ph-jump')?.getAttribute('href') || '';
  for (let index = 0; index < 12; index += 1) {
    window.dispatchEvent(new Event('relphi:sky-foundation-ready'));
    window.dispatchEvent(new Event('relphi:sky-foundation-interactions-ready'));
  }
  await new Promise(resolve => setTimeout(resolve, 750));
  return {
    same:before === document.querySelector('#skyFoundationB .sky-ph-heptagram'),
    hrefSame:href === (document.querySelector('#skyFoundationB .sky-ph-jump')?.getAttribute('href') || ''),
    count:document.querySelectorAll('#skyFoundationB .sky-ph-heptagram').length,
    ready:Array.from(document.querySelectorAll('#skyFoundationB .sky-ph-heptagram')).every(node => node.dataset.canonicalSourceReady === 'true' && node.dataset.canonicalHeptagramReady === 'true')
  };
});
assert.deepEqual(finalStability, { same:true, hrefSame:true, count:1, ready:true }, 'The updated heptagram must remain stable after event storms.');
assert.equal(await page.locator('#skyFoundationWheelMount .sky-axis-label').count(), 0);
assert.deepEqual(errors, []);

await page.screenshot({
  path:'sky-chart-stability-now.png',
  fullPage:true,
  animations:'disabled'
});
await browser.close();
console.log('Axis labels removed; heptagrams stable; ledger glyphs canonical; Here and Now saves current location and complete placements atomically.');
