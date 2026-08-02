import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const sample = (name, offset) => ({
  name,
  houseSystem:'whole-sign',
  houseCusps:Array.from({length:12}, (_,i)=>(165 + offset + i*30)%360),
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
    Ascendant:{name:'Ascendant',longitude:(165+offset)%360},
    Midheaven:{name:'Midheaven',longitude:(83+offset)%360}
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
    id:4943629,
    name:'Malden',
    admin1:'Massachusetts',
    country:'United States',
    latitude:42.4251,
    longitude:-71.0662,
    timezone:'America/New_York'
  }]})
}));
await page.route('https://api.bigdatacloud.net/data/reverse-geocode-client**', route => route.fulfill({
  status:200,
  contentType:'application/json',
  body:JSON.stringify({locality:'Malden',principalSubdivision:'Massachusetts',countryName:'United States'})
}));
await page.route('https://api.open-meteo.com/v1/forecast**', route => route.fulfill({
  status:200,
  contentType:'application/json',
  body:JSON.stringify({timezone:'America/New_York'})
}));

await page.addInitScript(({a,b}) => {
  localStorage.setItem('relphiSkyChartA', JSON.stringify(a));
  localStorage.setItem('relphiSkyChartB', JSON.stringify(b));
  sessionStorage.removeItem('relphiSkyWhereWhenViewV1');
}, {a:sample('Sky A test',0),b:sample('Sky B test',73)});

await page.goto('http://127.0.0.1:4173/part2/sky-chart.html', {waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]', {timeout:15000});
await page.waitForSelector('#skyFoundationA [data-ww-action="edit"]', {timeout:15000});

assert.equal(await page.locator('#skyFoundationRoot > .sky-foundation-panel').count(), 3);
const initialPlacementRows = await page.locator('#skyFoundationA .sky-foundation-row').count();
assert.ok(initialPlacementRows >= 10);

await page.locator('#skyFoundationA [data-ww-action="edit"]').click();
const editor = page.locator('#skyFoundationA .sky-where-when-editor');
await editor.waitFor();
assert.equal(await editor.locator('[data-ww-when]').evaluate(node => node.disabled), true);
assert.equal(await editor.locator('[data-ww-field="date"]').isDisabled(), true);
assert.equal(await editor.locator('[data-ww-field="timezone"]').isVisible(), false);

await editor.locator('[data-ww-field="location-query"]').fill('Malden');
await editor.locator('[data-ww-action="search-location"]').click();
await editor.locator('.sky-location-result').waitFor();
assert.match(await editor.locator('.sky-location-result strong').textContent(), /Malden, Massachusetts, United States/);
await editor.locator('.sky-location-result').click();

const confirmation = editor.locator('.sky-location-confirmation');
assert.match(await confirmation.textContent(), /You searched:\s*Malden/);
assert.match(await confirmation.textContent(), /Location found:\s*Malden, Massachusetts, United States/);
assert.equal(await editor.locator('[data-ww-field="date"]').isDisabled(), false);
assert.equal(await editor.locator('button[type="submit"]').isDisabled(), false);

await editor.locator('.sky-where-when-advanced summary').click();
const timezone = editor.locator('[data-ww-field="timezone"]');
assert.notEqual(await timezone.getAttribute('readonly'), null);
assert.equal(await timezone.inputValue(), 'America/New_York');
assert.equal(await editor.locator('[data-ww-field="latitude"]').inputValue(), '42.42510');
assert.equal(await editor.locator('[data-ww-field="longitude"]').inputValue(), '-71.06620');

await editor.locator('[data-ww-field="date"]').fill('1990-04-15');
await editor.locator('[data-ww-field="time"]').fill('13:30');
await editor.locator('button[type="submit"]').click();

await page.locator('#skyFoundationA .sky-ph-jump').waitFor({timeout:15000});
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('relphiSkyChartA')));
assert.equal(saved.calcProfile.location, 'Malden, Massachusetts, United States');
assert.equal(saved.calcProfile.locationQuery, 'Malden');
assert.equal(saved.calcProfile.timeZone, 'America/New_York');
assert.equal(saved.calcProfile.dateTime, '1990-04-15T13:30');
assert.match(saved.calcProfile.instant, /Z$/);
assert.ok([
  'Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'
].every(name => saved.placements[name]));
assert.equal(saved.houseCusps.length, 12);

const jump = page.locator('#skyFoundationA .sky-ph-jump');
assert.equal((await jump.locator('.sky-ph-jump-title').textContent()).trim(), 'Jump to this time in Planetary Hours');
assert.equal(await jump.locator('.sky-ph-heptagram').count(), 1);
await page.waitForFunction(() => document.querySelector('#skyFoundationA .sky-ph-heptagram')?.dataset.canonicalHeptagramV1 === 'true');
assert.equal(await jump.locator('.sky-ph-planet').count(), 7);
assert.equal(await jump.locator('.sky-ph-canonical-bubble').count(), 7);
const href = await jump.getAttribute('href');
assert.match(href, /^planetaryhours\.html#phShare=1&/);
assert.match(href, /tz=America%2FNew_York/);
assert.match(href, /loc=Malden%2C\+Massachusetts%2C\+United\+States/);
assert.match(href, /dt=/);
assert.equal((await jump.textContent()).includes('Check the PH'), false);

await page.locator('#skyFoundationA [data-ww-action="placements"]').click();
assert.equal(await page.locator('#skyFoundationA .sky-where-when-placement-view').isVisible(), true);
assert.ok(await page.locator('#skyFoundationA .sky-foundation-row').count() >= initialPlacementRows);

await page.locator('#skyFoundationA [data-ww-action="edit"]').click();
const reopened = page.locator('#skyFoundationA .sky-where-when-editor');
await reopened.locator('.sky-where-when-advanced summary').click();
await reopened.locator('[data-ww-action="infer"]').click();
await reopened.locator('.sky-inference-card:not([hidden])').waitFor();
assert.match(await reopened.locator('.sky-inference-card').textContent(), /High — recovered from the saved Sky record/);
await reopened.locator('[data-ww-action="apply-inference"]').click();
assert.match(await reopened.locator('.sky-location-confirmation').textContent(), /Location found:\s*Malden, Massachusetts, United States/);

await reopened.locator('[data-ww-field="latitude"]').fill('42.4251');
await reopened.locator('[data-ww-field="longitude"]').fill('-71.0662');
await reopened.locator('[data-ww-action="resolve-coordinates"]').click();
await page.waitForFunction(() => document.querySelector('#skyFoundationA [data-ww-field="timezone"]')?.value === 'America/New_York');
assert.match(await reopened.locator('.sky-location-confirmation').textContent(), /Malden, Massachusetts, United States/);

await page.screenshot({path:'sky-chart-part2-desktop.png',fullPage:true});
await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(150);
assert.equal((await page.locator('#skyFoundationRoot').evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').filter(Boolean).length)), 1);
assert.ok((await page.locator('#skyFoundationA').boundingBox()).width <= 390);
await page.screenshot({path:'sky-chart-part2-mobile.png',fullPage:true});

assert.deepEqual(errors, []);
await browser.close();
