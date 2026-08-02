import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);return{name,longitude:value,sign:signs[sign],degree,minute,second:0}};
function sample(name,offset,profile){
  const asc=(168.38+offset)%360,mc=(76.28+offset)%360,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,Chiron:74.48,'North Node':40.3,'South Node':220.3,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
  return{name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{...profile,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))};
}
const skyA=sample('My birth chart',0,{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Malden, Massachusetts, United States',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662});
const skyB=sample('Planetary Hours 2026-08-02 02:07',29.27,{dateTime:'2026-08-02T02:07',instant:'2026-08-02T08:07:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891});

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b));sessionStorage.removeItem('relphiSkyWhereWhenViewV1')},{a:skyA,b:skyB});
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
await page.waitForSelector('.sky-foundation-relationship-row[data-relation-index]',{timeout:20000});
await page.waitForSelector('html[data-sky-placement-multiselect="ready"]',{timeout:20000});

assert.equal(await page.locator('[data-filter="placement"]').count(),0,'The old singular placement select must be removed.');
assert.equal(await page.locator('[data-placement-filter-sky]').count(),2,'Each sky needs its own placement checklist.');
const availableCounts={};
for(const slot of ['A','B']){
  const control=page.locator(`[data-placement-filter-sky="${slot}"]`);
  assert.equal(await control.locator('[data-placement-preset="all"]').count(),1);
  assert.equal(await control.locator('[data-placement-preset="none"]').count(),1);
  for(const group of ['luminaries','planets','angles-points']) assert.equal(await control.locator(`[data-placement-group-toggle="${group}"]`).count(),1);
  availableCounts[slot]=await control.locator('[data-placement-option]').count();
  assert.ok(availableCounts[slot]>=15,'Each chart should expose its available canonical placements.');
  assert.equal(await control.locator('[data-placement-option]:checked').count(),availableCounts[slot]);
  assert.equal((await control.locator('[data-placement-filter-summary]').textContent())?.trim(),'All');
}

const desktopLayout=await page.locator('#skyFoundationRelationships .sky-chart-filter-bar').evaluate(bar=>{
  const controls=Array.from(bar.children).filter(child=>child.matches('label,details'));
  const boxes=controls.map(control=>control.getBoundingClientRect());
  return{
    count:controls.length,
    tops:boxes.map(box=>Math.round(box.top)),
    bottoms:boxes.map(box=>Math.round(box.bottom)),
    clientWidth:bar.clientWidth,
    scrollWidth:bar.scrollWidth,
    height:Math.round(bar.getBoundingClientRect().height)
  };
});
assert.equal(desktopLayout.count,7,'The desktop utility bar must contain seven controls.');
assert.ok(Math.max(...desktopLayout.tops)-Math.min(...desktopLayout.tops)<=2,'All desktop filter controls must occupy one row.');
assert.ok(desktopLayout.scrollWidth<=desktopLayout.clientWidth+1,'The one-line desktop filter bar must not overflow horizontally.');
assert.ok(desktopLayout.height<90,'The desktop filter bar must remain compact.');

const visibleRows=()=>page.locator('.sky-foundation-relationship-row:not(.sky-chart-filter-hidden):not(.sky-chart-orb-hidden):not(.sky-orb-filter-hidden):not(.sky-chart-multiselect-hidden):not([hidden])');
const total=await page.locator('.sky-foundation-relationship-row').count();
assert.ok(total>0);

const skyAControl=page.locator('[data-placement-filter-sky="A"]');
await skyAControl.locator('summary').click();
await skyAControl.locator('[data-placement-preset="none"]').click();
await page.waitForTimeout(100);
assert.equal(await skyAControl.locator('[data-placement-option]:checked').count(),0);
assert.equal((await skyAControl.locator('[data-placement-filter-summary]').textContent())?.trim(),'None');
assert.equal(await visibleRows().count(),0,'None must uncheck the entire sky in one action.');

await skyAControl.locator('[data-placement-group-toggle="luminaries"]').check();
await page.waitForTimeout(100);
assert.deepEqual((await skyAControl.locator('[data-placement-option]:checked').evaluateAll(nodes=>nodes.map(node=>node.value).sort())),['moon','sun']);
assert.equal((await skyAControl.locator('[data-placement-filter-summary]').textContent())?.trim(),'Luminaries');
const visibleAfterLuminaries=await visibleRows().evaluateAll(rows=>rows.map(row=>row.dataset.leftPlacement));
assert.ok(visibleAfterLuminaries.length>0);
assert.ok(visibleAfterLuminaries.every(id=>id==='sun'||id==='moon'));

const skyBControl=page.locator('[data-placement-filter-sky="B"]');
await skyBControl.locator('summary').click();
await skyBControl.locator('[data-placement-preset="none"]').click();
await skyBControl.locator('[data-placement-group-toggle="planets"]').check();
await page.waitForTimeout(100);
const expectedPlanets=['jupiter','mars','mercury','neptune','pluto','saturn','uranus','venus'];
assert.deepEqual((await skyBControl.locator('[data-placement-option]:checked').evaluateAll(nodes=>nodes.map(node=>node.value).sort())),expectedPlanets);
assert.equal((await skyBControl.locator('[data-placement-filter-summary]').textContent())?.trim(),'Planets');
const visiblePairings=await visibleRows().evaluateAll(rows=>rows.map(row=>[row.dataset.leftPlacement,row.dataset.rightPlacement]));
assert.ok(visiblePairings.every(([left,right])=>(left==='sun'||left==='moon')&&['mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'].includes(right)));

await skyAControl.locator('summary').click();
await skyAControl.locator('[data-placement-option="mercury"]').check();
await skyAControl.locator('[data-placement-option="sun"]').uncheck();
await page.waitForTimeout(100);
assert.deepEqual((await skyAControl.locator('[data-placement-option]:checked').evaluateAll(nodes=>nodes.map(node=>node.value).sort())),['mercury','moon']);
assert.equal((await skyAControl.locator('[data-placement-filter-summary]').textContent())?.trim(),`2 of ${availableCounts.A}`);
assert.ok((await visibleRows().evaluateAll(rows=>rows.map(row=>row.dataset.leftPlacement))).every(id=>id==='mercury'||id==='moon'));

await skyAControl.locator('[data-placement-preset="all"]').click();
await skyBControl.locator('summary').click();
await skyBControl.locator('[data-placement-preset="all"]').click();
await page.waitForTimeout(100);
assert.equal(await skyAControl.locator('[data-placement-option]:checked').count(),availableCounts.A);
assert.equal(await skyBControl.locator('[data-placement-option]:checked').count(),availableCounts.B);
assert.equal((await skyAControl.locator('[data-placement-filter-summary]').textContent())?.trim(),'All');
assert.equal((await skyBControl.locator('[data-placement-filter-summary]').textContent())?.trim(),'All');

await skyAControl.locator('summary').click();
await page.screenshot({path:'sky-chart-multiselect-filters-desktop.png',fullPage:true});
await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(250);
if(!(await skyAControl.getAttribute('open'))) await skyAControl.locator('summary').click();
await page.screenshot({path:'sky-chart-multiselect-filters-mobile.png',fullPage:true});
assert.deepEqual(errors,[]);
await browser.close();
console.log('Sky Chart per-sky checkbox placement filters passed with a single-line desktop utility bar.');
