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
    Pluto:{name:'Pluto',longitude:(213.8+offset)%360}
  }
});

const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1440,height:1100}});
const errors=[];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (message.type()==='error' && !/favicon/i.test(message.text())) errors.push(message.text());
});

await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js', route => route.fulfill({
  path:path.resolve('node_modules/suncalc/suncalc.js'),
  contentType:'application/javascript'
}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js', route => route.fulfill({
  path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),
  contentType:'application/javascript'
}));
await page.route('https://geocoding-api.open-meteo.com/v1/search**', route => route.fulfill({
  status:200,
  contentType:'application/json',
  body:JSON.stringify({results:[{
    name:'Malden',
    admin1:'Massachusetts',
    country:'United States',
    latitude:42.4251,
    longitude:-71.0662,
    timezone:'America/New_York'
  }]})
}));

await page.addInitScript(({a,b}) => {
  localStorage.setItem('relphiSkyChartA', JSON.stringify(a));
  localStorage.setItem('relphiSkyChartB', JSON.stringify(b));
  sessionStorage.removeItem('relphiSkyWhereWhenViewV1');
}, {a:sample('Sky A test',0),b:sample('Sky B test',73)});

await page.goto('http://127.0.0.1:4173/part2/sky-chart.html', {waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationA [data-ww-action="edit"]', {timeout:15000});
await page.locator('#skyFoundationA [data-ww-action="edit"]').click();
const editor = page.locator('#skyFoundationA .sky-where-when-editor');
await editor.locator('[data-ww-field="location-query"]').fill('Malden');
await editor.locator('[data-ww-action="search-location"]').click();
await editor.locator('.sky-location-result').click();
await editor.locator('[data-ww-field="date"]').fill('1990-04-15');
await editor.locator('[data-ww-field="time"]').fill('13:30');
await editor.locator('button[type="submit"]').click();

const jump = page.locator('#skyFoundationA .sky-ph-jump');
await jump.waitFor({timeout:15000});
await page.waitForFunction(() => document.querySelectorAll('#skyFoundationA .sky-ph-node-glyph path').length > 0);
assert.equal(await jump.evaluate(node => node.tagName), 'A');
assert.equal(await jump.locator('a').count(), 0);
assert.equal((await jump.locator('.sky-ph-jump-title').textContent()).trim(), 'Jump to this time in Planetary Hours');
assert.equal(await jump.locator('.sky-ph-node').count(), 7);
assert.equal(await jump.locator('.sky-ph-jump-title').count(), 1);
assert.equal((await jump.textContent()).includes('Check the PH'), false);
assert.ok((await page.locator('#skyFoundationA').boundingBox()).height < 760);
await page.screenshot({path:'sky-chart-part2-confirmed-desktop.png',fullPage:true});

await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(150);
assert.equal(await jump.isVisible(), true);
assert.ok((await page.locator('#skyFoundationA').boundingBox()).width <= 390);
assert.equal(await page.locator('body').evaluate(node => node.scrollWidth <= node.clientWidth), true);
await page.screenshot({path:'sky-chart-part2-confirmed-mobile.png',fullPage:true});

assert.deepEqual(errors, []);
await browser.close();
