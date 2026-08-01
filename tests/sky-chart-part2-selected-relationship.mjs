import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const sample = (name, offset) => ({
  name,
  houseSystem:'whole-sign',
  houseCusps:Array.from({length:12}, (_, index)=>(165 + offset + index * 30) % 360),
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
    Chiron:{name:'Chiron',longitude:(49+offset)%360},
    'North Node':{name:'North Node',longitude:(10+offset)%360}
  }
});

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
const row = page.locator('.sky-foundation-relationship-row[data-relation-index]').first();
const relationIndex = Number(await row.getAttribute('data-relation-index'));
await row.click();
const panel = page.locator('#skySelectedRelationship');
await panel.waitFor({state:'visible', timeout:10000});
assert.equal(Number(await panel.getAttribute('data-relation-index')), relationIndex);
assert.equal(await panel.getAttribute('data-selection-source'), 'relationship-list');
assert.equal(await panel.locator('.sky-selected-graphic').count(), 1);
assert.equal(await panel.locator('.sky-selected-facts').count(), 1);
assert.equal(await panel.locator('.sky-selected-cards').count(), 1);
assert.equal(await panel.locator('.sky-selected-progressive').count(), 1);
assert.equal(await panel.locator('.sky-selected-card').count(), 2);
assert.equal(await panel.locator('.sky-selected-aspect-symbol').count(), 1);
assert.equal(await panel.locator('.sky-selected-reveal').count(), 3);
assert.equal(await panel.locator('[data-missing-canonical-glyph]').count(), 0);

const order = await panel.locator('.sky-selected-body > *').evaluateAll(nodes => nodes.map(node => node.className));
assert.deepEqual(order, ['sky-selected-graphic','sky-selected-facts','sky-selected-cards','sky-selected-progressive']);
const cardImagesLoaded = await panel.locator('.sky-selected-card img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0));
assert.equal(cardImagesLoaded, true);
const titleFromRow = (await panel.locator('.sky-selected-facts h3').textContent()).trim();
const cardTitlesFromRow = await panel.locator('.sky-selected-card h4').allTextContents();

const line = page.locator(`.sky-foundation-aspect[data-relation-index="${relationIndex}"]`);
const hit = page.locator(`.sky-foundation-aspect-hit[data-relation-index="${relationIndex}"]`);
await hit.waitFor({state:'attached', timeout:10000});
await hit.click({force:true});
await page.waitForFunction(index => document.querySelector('#skySelectedRelationship')?.dataset.selectionSource === 'comparison-wheel' && Number(document.querySelector('#skySelectedRelationship')?.dataset.relationIndex) === index, relationIndex);
assert.equal((await panel.locator('.sky-selected-facts h3').textContent()).trim(), titleFromRow);
assert.deepEqual(await panel.locator('.sky-selected-card h4').allTextContents(), cardTitlesFromRow);
assert.equal(await page.locator(`.sky-foundation-relationship-row[data-relation-index="${relationIndex}"]`).getAttribute('aria-current'), 'true');
assert.equal(await line.getAttribute('data-selected-relation'), 'true');

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
