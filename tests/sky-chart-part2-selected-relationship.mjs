import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const sample = (name, offset) => {
  const asc = (165 + offset) % 360;
  const mc = (82 + offset) % 360;
  const houseCusps = Array.from({length:12}, (_, index)=>(Math.floor(asc / 30) * 30 + index * 30) % 360);
  return {
    name,
    houseSystem:'whole-sign',
    houseCusps,
    calcProfile:{
      dateTime:'1985-10-08T12:15',
      instant:'1985-10-08T16:15:00.000Z',
      location:'Malden, Massachusetts, United States',
      timeZone:'America/New_York',
      latitude:42.4251,
      longitude:-71.0662,
      houseSystem:'whole-sign',
      houseCusps
    },
    placements:{
      Sun:{name:'Sun',longitude:(195+offset)%360},
      Moon:{name:'Moon',longitude:(118.4+offset)%360},
      Mercury:{name:'Mercury',longitude:(206.1+offset)%360},
      Venus:{name:'Venus',longitude:(169.8+offset)%360},
      Mars:{name:'Mars',longitude:(167.8+offset)%360},
      Jupiter:{name:'Jupiter',longitude:(307.1+offset)%360},
      Saturn:{name:'Saturn',longitude:(235.5+offset)%360},
      Uranus:{name:'Uranus',longitude:(254.8+offset)%360},
      Neptune:{name:'Neptune',longitude:(271+offset)%360},
      Pluto:{name:'Pluto',longitude:(213.8+offset)%360},
      Ascendant:{name:'Ascendant',longitude:asc},
      Midheaven:{name:'Midheaven',longitude:mc},
      Chiron:{name:'Chiron',longitude:(49+offset)%360},
      'North Node':{name:'North Node',longitude:(10+offset)%360}
    }
  };
};

const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1440,height:1300}});
const errors=[];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (message.type()==='error' && !/favicon/i.test(message.text())) errors.push(message.text());
});
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js', route => route.fulfill({
  path:path.resolve('node_modules/suncalc/suncalc.js'), contentType:'application/javascript'
}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js', route => route.fulfill({
  path:path.resolve('node_modules/luxon/build/global/luxon.min.js'), contentType:'application/javascript'
}));
await page.addInitScript(({a,b}) => {
  localStorage.setItem('relphiSkyChartA', JSON.stringify(a));
  localStorage.setItem('relphiSkyChartB', JSON.stringify(b));
  sessionStorage.removeItem('relphiSkyWhereWhenViewV1');
}, {a:sample('Sky A test',0),b:sample('Sky B test',73)});

await page.goto('http://127.0.0.1:4173/part2/sky-chart.html', {waitUntil:'networkidle'});
await page.waitForSelector('.sky-foundation-relationship-row[data-relation-index]', {timeout:15000});
await page.waitForSelector('.sky-chart-filter-bar [data-house-system-filter]', {timeout:10000});
await page.waitForSelector('.sky-ph-heptagram[data-canonical-heptagram-v1="true"]', {timeout:10000});
const heptagramGlyphs = await page.locator('.sky-ph-heptagram').evaluateAll(nodes => nodes.map(svg => ({
  planets:svg.querySelectorAll('.sky-ph-planet').length,
  bubbles:svg.querySelectorAll('.sky-ph-node-glyph > .relphi-glyph-bubble').length,
  duplicateMounts:Array.from(svg.querySelectorAll('.sky-ph-node-glyph')).filter(mount => mount.children.length !== 1).length,
  oldNodes:svg.querySelectorAll('.sky-ph-node,.sky-ph-node-label').length
})));
assert.ok(heptagramGlyphs.length >= 2);
assert.ok(heptagramGlyphs.every(result => result.planets===7 && result.bubbles===7 && result.duplicateMounts===0 && result.oldNodes===0));

const filterLabels = await page.locator('.sky-chart-filter-bar label').evaluateAll(nodes => nodes.map(node => node.childNodes[0].textContent.trim()));
assert.deepEqual(filterLabels, ['Orb','Aspects','Placements','Sky A House','Sky B House','House System']);
assert.equal(await page.locator('.sky-chart-filter-bar > :first-child input[data-filter="orb"]').count(), 1);
const desktopFilterBoxes = await page.locator('.sky-chart-filter-bar > *').evaluateAll(nodes => nodes.map(node => {const box=node.getBoundingClientRect();return {top:Math.round(box.top),height:Math.round(box.height)}}));
assert.equal(new Set(desktopFilterBoxes.map(box => box.top)).size, 1);
assert.ok(Math.max(...desktopFilterBoxes.map(box => box.height))-Math.min(...desktopFilterBoxes.map(box => box.height)) <= 1);
assert.equal(await page.locator('.sky-chart-filter-bar').evaluate(node => node.scrollWidth <= node.clientWidth), true);
assert.equal(await page.locator('[data-filter="aspect"] option[value="semi-sextile"]').count(), 1);
assert.equal(await page.locator('[data-filter="aspect"] option[value="quincunx"]').count(), 1);

const row = page.locator('.sky-foundation-relationship-row[data-relation-index]').first();
const relationIndex = Number(await row.getAttribute('data-relation-index'));
const listCountBeforeSelection = await page.locator('.sky-foundation-relationship-row:visible').count();
await row.click();
const panel = page.locator('#skySelectedRelationship');
await panel.waitFor({state:'visible', timeout:10000});
assert.equal(await page.locator('.sky-foundation-relationship-row:visible').count(), listCountBeforeSelection);
assert.equal(Number(await panel.getAttribute('data-relation-index')), relationIndex);
assert.equal(await panel.getAttribute('data-selection-source'), 'relationship-list');
assert.equal(await panel.locator('.sky-selected-graphic').count(), 1);
assert.equal(await panel.locator('.sky-selected-facts').count(), 1);
assert.equal(await panel.locator('.sky-selected-cards').count(), 1);
assert.equal(await panel.locator('.sky-selected-progressive').count(), 1);
assert.equal(await panel.locator('.sky-selected-card').count(), 2);
assert.equal(await panel.locator('.sky-selected-aspect-symbol').count(), 0);
assert.equal(await panel.locator('.sky-selected-aspect-diagram').count(), 1);
assert.equal(await panel.locator('.sky-selected-aspect-orbit').count(), 1);
assert.equal(await panel.locator('.sky-selected-aspect-center').count(), 1);
assert.equal(await panel.locator('.sky-selected-aspect-point.sky-a').count(), 1);
assert.equal(await panel.locator('.sky-selected-aspect-point.sky-b').count(), 1);
assert.equal(await panel.locator('.sky-selected-reveal').count(), 3);
assert.equal(await panel.locator('[data-missing-canonical-glyph]').count(), 0);

const order = await panel.locator('.sky-selected-body > *').evaluateAll(nodes => nodes.map(node => node.className));
assert.deepEqual(order, ['sky-selected-graphic','sky-selected-facts','sky-selected-cards','sky-selected-progressive']);
const cardImagesLoaded = await panel.locator('.sky-selected-card img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0));
assert.equal(cardImagesLoaded, true);
const titleFromRow = (await panel.locator('.sky-selected-facts h3').textContent()).trim();
const cardTitlesFromRow = await panel.locator('.sky-selected-card h4').allTextContents();

// Hovering another relationship must not mutate or blink the retained list.
const visibleBeforeHover = await page.locator('.sky-foundation-relationship-row:visible').count();
const secondRow = page.locator('.sky-foundation-relationship-row[data-relation-index]').nth(1);
await secondRow.hover();
await page.waitForTimeout(250);
assert.equal(await page.locator('.sky-foundation-relationship-row:visible').count(), visibleBeforeHover);
assert.equal(Number(await panel.getAttribute('data-relation-index')), relationIndex);

// Wheel hover owns dim/isolate and marks related rows without reducing the list.
const leftPlacement = await row.getAttribute('data-left-placement');
const wheelPlacement = page.locator(`[data-layer="placements"] > g[data-sky="A"][data-placement="${leftPlacement}"]`).first();
await wheelPlacement.hover();
await page.waitForTimeout(100);
const visibleFromWheel = await page.locator('.sky-foundation-relationship-row:visible').count();
const wheelState = await page.locator('.sky-foundation-wheel').evaluate(node => ({className:node.getAttribute('class'),hovered:node.querySelectorAll('.is-hovered').length,kept:node.querySelectorAll('.is-kept').length}));
assert.equal(visibleFromWheel, visibleBeforeHover);
const hoveredStyle = await wheelPlacement.evaluate(node => ({opacity:getComputedStyle(node).opacity,filter:getComputedStyle(node).filter}));
const dimmedOpacity = Number(await page.locator('.sky-foundation-wheel [data-focus-piece]:not(.is-kept)').first().evaluate(node => getComputedStyle(node).opacity));
const dimmedSignOpacity = Number(await page.locator('.sky-foundation-wheel [data-layer="zodiac"] [data-focus-piece]:not(.is-kept)').first().evaluate(node => getComputedStyle(node).opacity));
assert.equal(Number(hoveredStyle.opacity), 1);
assert.notEqual(hoveredStyle.filter, 'none');
assert.ok(dimmedOpacity <= .16, `Unrelated wheel opacity was ${dimmedOpacity}.`);
assert.ok(dimmedSignOpacity >= .45, `Unrelated zodiac glyph opacity was ${dimmedSignOpacity}.`);
const relatedFromWheel = await page.locator('.sky-foundation-relationship-row.is-wheel-related').count();
assert.ok(relatedFromWheel > 0 && relatedFromWheel < visibleBeforeHover, `Wheel hover marked ${relatedFromWheel} of ${visibleBeforeHover} relationships; state ${JSON.stringify(wheelState)}.`);
assert.equal(await page.locator('.sky-foundation-wheel').getAttribute('class').then(value => value.includes('has-isolation')), true);
await page.locator('.sky-foundation-relationships-heading h2').hover();
await page.waitForTimeout(100);
assert.equal(await page.locator('.sky-foundation-relationship-row:visible').count(), visibleBeforeHover);
assert.equal(await page.locator('.sky-foundation-relationship-row.is-wheel-related').count(), 0);

// Wheel click/tap retains isolation and updates the list; a row click does not change it.
await wheelPlacement.click({force:true});
await page.waitForTimeout(100);
const visibleFromWheelSelection = await page.locator('.sky-foundation-relationship-row:visible').count();
assert.ok(visibleFromWheelSelection > 0 && visibleFromWheelSelection < visibleBeforeHover);
await page.locator('.sky-foundation-relationship-row:visible').first().click();
await page.waitForTimeout(100);
assert.equal(await page.locator('.sky-foundation-relationship-row:visible').count(), visibleFromWheelSelection);
await page.locator('#skyFoundationClearIsolation').click();
await page.waitForTimeout(100);
assert.equal(await page.locator('.sky-foundation-relationship-row:visible').count(), visibleBeforeHover);

const line = page.locator(`.sky-foundation-aspect[data-relation-index="${relationIndex}"]`);
const hit = page.locator(`.sky-foundation-aspect-hit[data-relation-index="${relationIndex}"]`);
await hit.waitFor({state:'attached', timeout:10000});
await hit.click({force:true});
await page.waitForTimeout(100);
assert.equal(Number(await panel.getAttribute('data-relation-index')), relationIndex);
assert.equal((await panel.locator('.sky-selected-facts h3').textContent()).trim(), titleFromRow);
assert.deepEqual(await panel.locator('.sky-selected-card h4').allTextContents(), cardTitlesFromRow);
assert.equal(await page.locator(`.sky-foundation-relationship-row[data-relation-index="${relationIndex}"]`).getAttribute('aria-current'), 'true');
assert.equal(await line.getAttribute('data-selected-relation'), 'true');

// Derived points are completed and assigned houses.
const completed = await page.evaluate(() => JSON.parse(localStorage.getItem('relphiSkyChartA')));
for (const name of ['North Node','South Node','Lilith','Vertex','Part of Fortune']) {
  assert.ok(completed.placements[name], `${name} should be present`);
  assert.ok(Number.isFinite(Number(completed.placements[name].longitude)), `${name} should have longitude`);
  assert.ok(Number(completed.placements[name].house) >= 1, `${name} should have a house`);
}
assert.ok(completed.placements.Chiron, 'provided Chiron should be preserved');

// House-system changes recalculate both skies rather than changing only a label.
const beforeCusps = completed.calcProfile.houseCusps.slice();
await page.locator('[data-house-system-filter]').selectOption('equal-house');
await page.waitForFunction(previous => {
  const a=JSON.parse(localStorage.getItem('relphiSkyChartA'));
  const b=JSON.parse(localStorage.getItem('relphiSkyChartB'));
  return a?.calcProfile?.houseSystem==='equal-house' && b?.calcProfile?.houseSystem==='equal-house' && JSON.stringify(a.calcProfile.houseCusps)!==JSON.stringify(previous);
}, beforeCusps, {timeout:10000});
const afterHouseChange = await page.evaluate(() => JSON.parse(localStorage.getItem('relphiSkyChartA')));
assert.notDeepEqual(afterHouseChange.calcProfile.houseCusps, beforeCusps);
assert.ok(Object.values(afterHouseChange.placements).every(item => !Number.isFinite(Number(item.longitude)) || Number(item.house) >= 1));

await panel.locator('[data-reveal-level="symbol"] summary').click();
await panel.locator('[data-reveal-level="cards"] summary').click();
await panel.locator('[data-reveal-level="synthesis"] summary').click();
assert.equal(await panel.locator('.sky-selected-reveal[open]').count(), 3);
await page.screenshot({path:'sky-chart-selected-relationship-desktop.png',fullPage:true});

await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(200);
assert.equal(await panel.isVisible(), true);
assert.equal(await page.locator('body').evaluate(node => node.scrollWidth <= node.clientWidth), true);
const cardsBox = await panel.locator('.sky-selected-cards').boundingBox();
const firstCardBox = await panel.locator('.sky-selected-card').first().boundingBox();
const secondCardBox = await panel.locator('.sky-selected-card').nth(1).boundingBox();
assert.ok(firstCardBox.x < secondCardBox.x);
assert.ok(Math.abs(firstCardBox.y - secondCardBox.y) < 20);
assert.ok(cardsBox.width <= 390);
await page.screenshot({path:'sky-chart-selected-relationship-mobile.png',fullPage:true});

assert.deepEqual(errors, []);
await browser.close();
