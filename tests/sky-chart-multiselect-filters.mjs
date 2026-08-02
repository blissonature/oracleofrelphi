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

assert.equal(await page.locator('[data-filter="placement"]').count(),0);
assert.equal(await page.locator('[data-placement-filter-sky]').count(),0);
assert.equal(await page.locator('[data-placement-matrix]').count(),0);
assert.equal(await page.locator('[data-placement-filter="combined"]').count(),1);

const combined=page.locator('[data-placement-filter="combined"]');
const menu=page.locator('#skyChartPlacementPopover');
const summaryChoices=combined.locator('.sky-chart-placement-summary-choices');
assert.equal(await summaryChoices.locator('[data-placement-choice]').count(),3,'The closed placements cell must visibly contain All, A, and B checkboxes.');
assert.deepEqual(await summaryChoices.locator('[data-placement-choice]').evaluateAll(nodes=>nodes.map(node=>node.dataset.placementChoice)),['all','a','b']);
assert.equal(await summaryChoices.locator('[data-placement-choice="all"]').isVisible(),true);
assert.equal(await summaryChoices.locator('[data-placement-choice="a"]').isVisible(),true);
assert.equal(await summaryChoices.locator('[data-placement-choice="b"]').isVisible(),true);
assert.equal(await menu.isHidden(),true);

const list=menu.locator('[data-placement-list="combined"]');
assert.equal(await list.count(),1);
assert.equal(await list.locator('.sky-chart-placement-list-item-master').count(),1);
assert.equal(await list.locator('.sky-chart-placement-list-item-group').count(),3);
for(const item of await list.locator('.sky-chart-placement-list-item').all()){
  assert.deepEqual(await item.locator('[data-placement-choice]').evaluateAll(nodes=>nodes.map(node=>node.dataset.placementChoice)),['all','a','b']);
}

const availableCounts={};
for(const slot of ['A','B']){
  availableCounts[slot]=await list.locator(`[data-placement-option][data-slot="${slot}"]`).count();
  assert.ok(availableCounts[slot]>=15);
  assert.equal(await list.locator(`[data-placement-option][data-slot="${slot}"]:checked`).count(),availableCounts[slot]);
}
const placementIds=await list.locator('.sky-chart-placement-list-item-placement').evaluateAll(rows=>rows.map(row=>row.dataset.placementListItem));
assert.equal(new Set(placementIds).size,placementIds.length);
assert.equal((await combined.locator('[data-placement-filter-summary]').textContent())?.trim(),'All');

const desktopLayout=await page.locator('#skyFoundationRelationships .sky-chart-filter-bar').evaluate(bar=>{
  const controls=Array.from(bar.children).filter(child=>child.matches('label,[data-placement-filter]'));
  const boxes=controls.map(control=>control.getBoundingClientRect());
  return{count:controls.length,tops:boxes.map(box=>Math.round(box.top)),bottoms:boxes.map(box=>Math.round(box.bottom)),clientWidth:bar.clientWidth,scrollWidth:bar.scrollWidth,height:Math.round(bar.getBoundingClientRect().height)};
});
assert.equal(desktopLayout.count,6);
assert.ok(Math.max(...desktopLayout.bottoms)-Math.min(...desktopLayout.bottoms)<=2);
assert.ok(Math.max(...desktopLayout.tops)-Math.min(...desktopLayout.tops)<35);
assert.ok(desktopLayout.scrollWidth<=desktopLayout.clientWidth+1);
assert.ok(desktopLayout.height<90);

const visibleRows=()=>page.locator('.sky-foundation-relationship-row:not(.sky-chart-filter-hidden):not(.sky-chart-orb-hidden):not(.sky-orb-filter-hidden):not(.sky-chart-multiselect-hidden):not([hidden])');
assert.ok(await page.locator('.sky-foundation-relationship-row').count()>0);

const inlineA=summaryChoices.locator('[data-placement-choice="a"]');
await inlineA.uncheck();
await page.waitForTimeout(100);
assert.equal(await list.locator('[data-placement-option][data-slot="A"]:checked').count(),0);
assert.equal((await combined.locator('[data-placement-filter-summary]').textContent())?.trim(),'Sky A off');
assert.equal(await visibleRows().count(),0,'The visible A checkbox in the filter bar must clear Sky A.');
await inlineA.check();
await page.waitForTimeout(100);
assert.equal(await list.locator('[data-placement-option][data-slot="A"]:checked').count(),availableCounts.A);

await combined.locator('[data-placement-filter-toggle]').click();
await page.waitForSelector('#skyChartPlacementPopover.is-portaled:not([hidden])');
assert.equal(await menu.evaluate(node=>node.parentElement===document.body),true);

const globalA=list.locator('[data-placement-scope="all"][data-placement-target="all"][data-placement-choice="a"]');
await globalA.uncheck();
await list.locator('[data-placement-scope="group"][data-placement-target="luminaries"][data-placement-choice="a"]').check();
await page.waitForTimeout(100);
assert.deepEqual((await list.locator('[data-placement-option][data-slot="A"]:checked').evaluateAll(nodes=>nodes.map(node=>node.value).sort())),['moon','sun']);
assert.ok((await visibleRows().evaluateAll(rows=>rows.map(row=>row.dataset.leftPlacement))).every(id=>id==='sun'||id==='moon'));

const globalB=list.locator('[data-placement-scope="all"][data-placement-target="all"][data-placement-choice="b"]');
await globalB.uncheck();
await list.locator('[data-placement-scope="group"][data-placement-target="planets"][data-placement-choice="b"]').check();
await page.waitForTimeout(100);
assert.deepEqual((await list.locator('[data-placement-option][data-slot="B"]:checked').evaluateAll(nodes=>nodes.map(node=>node.value).sort())),['jupiter','mars','mercury','neptune','pluto','saturn','uranus','venus']);

await list.locator('[data-placement-scope="placement"][data-placement-target="mercury"][data-placement-choice="a"]').check();
await list.locator('[data-placement-scope="placement"][data-placement-target="sun"][data-placement-choice="a"]').uncheck();
await page.waitForTimeout(100);
assert.deepEqual((await list.locator('[data-placement-option][data-slot="A"]:checked').evaluateAll(nodes=>nodes.map(node=>node.value).sort())),['mercury','moon']);

const globalAll=list.locator('[data-placement-scope="all"][data-placement-target="all"][data-placement-choice="all"]');
await globalAll.check();
await page.waitForTimeout(100);
assert.equal(await list.locator('[data-placement-option][data-slot="A"]:checked').count(),availableCounts.A);
assert.equal(await list.locator('[data-placement-option][data-slot="B"]:checked').count(),availableCounts.B);

const moonAll=list.locator('[data-placement-scope="placement"][data-placement-target="moon"][data-placement-choice="all"]');
const moonA=list.locator('[data-placement-scope="placement"][data-placement-target="moon"][data-placement-choice="a"]');
const moonB=list.locator('[data-placement-scope="placement"][data-placement-target="moon"][data-placement-choice="b"]');
await moonAll.uncheck();
assert.equal(await moonA.isChecked(),false);
assert.equal(await moonB.isChecked(),false);
await moonA.check();
assert.equal(await moonAll.isChecked(),false);
assert.equal(await moonAll.evaluate(node=>node.indeterminate),true);
await moonB.check();
assert.equal(await moonAll.isChecked(),true);
assert.equal(await moonAll.evaluate(node=>node.indeterminate),false);
await globalAll.check();
assert.equal((await combined.locator('[data-placement-filter-summary]').textContent())?.trim(),'All');

await page.screenshot({path:'sky-chart-multiselect-filters-desktop.png',fullPage:true});
await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(250);
assert.equal(await summaryChoices.locator('[data-placement-choice="all"]').isVisible(),true);
assert.equal(await menu.isVisible(),true);
await page.screenshot({path:'sky-chart-multiselect-filters-mobile.png',fullPage:true});
assert.deepEqual(errors,[]);
await browser.close();
console.log('Sky Chart visible All/A/B placement controls and one-column list passed.');
