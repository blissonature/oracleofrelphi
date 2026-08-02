import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0}};
function sample(name,offset,profile){
  const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,index)=>(asc+index*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,Chiron:74.48,'North Node':40.3,'South Node':220.3,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
  return{name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{...profile,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))};
}
const skyA=sample('My birth chart',0,{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Malden, Massachusetts, United States',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662});
const skyB=sample('Planetary Hours 2026-08-02 02:07',29.27,{dateTime:'2026-08-02T02:07',instant:'2026-08-02T08:07:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891});

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:2});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b));sessionStorage.removeItem('relphiSkyWhereWhenViewV1')},{a:skyA,b:skyB});
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
await page.waitForSelector('html[data-sky-placement-multiselect="ready"]',{timeout:20000});
await page.waitForSelector('html[data-sky-house-multiselect="ready"]',{timeout:20000});

assert.equal(await page.locator('[data-filter="houseA"],[data-filter="houseB"]').count(),0,'The two house selects must be replaced by one shared control.');
assert.equal(await page.locator('[data-house-filter="combined"]').count(),1);

const combined=page.locator('[data-house-filter="combined"]');
const summary=combined.locator('.sky-chart-house-summary-choices');
const menu=page.locator('#skyChartHousePopover');
assert.deepEqual(await summary.locator('[data-house-choice]').evaluateAll(nodes=>nodes.map(node=>node.dataset.houseChoice)),['all','a','b']);
assert.equal(await summary.locator('[data-house-choice="all"]').isVisible(),true);
assert.equal(await summary.locator('[data-house-choice="a"]').isVisible(),true);
assert.equal(await summary.locator('[data-house-choice="b"]').isVisible(),true);
assert.equal(await menu.isHidden(),true);

const headerPresentation=await page.evaluate(()=>{
  const label=document.querySelector('[data-house-filter="combined"] .sky-chart-house-filter-label');
  const choices=document.querySelector('[data-house-filter="combined"] .sky-chart-house-summary-choices');
  return{
    labelBackground:getComputedStyle(label).backgroundColor,
    choicesBackground:getComputedStyle(choices).backgroundColor,
    labelTop:label.getBoundingClientRect().top,
    choicesTop:choices.getBoundingClientRect().top
  };
});
assert.ok(['rgba(0, 0, 0, 0)','transparent'].includes(headerPresentation.labelBackground));
assert.equal(headerPresentation.choicesBackground,'rgb(255, 255, 255)');
assert.ok(headerPresentation.labelTop<headerPresentation.choicesTop);

const neutralCheckbox=await summary.locator('[data-house-choice="a"]').evaluate(input=>({
  appearance:getComputedStyle(input).appearance,
  background:getComputedStyle(input).backgroundColor,
  border:getComputedStyle(input).borderTopColor,
  mark:getComputedStyle(input,'::after').content,
  markColor:getComputedStyle(input,'::after').color
}));
assert.equal(neutralCheckbox.appearance,'none');
assert.equal(neutralCheckbox.background,'rgb(255, 255, 255)');
assert.ok(['rgb(33, 29, 25)','rgb(0, 0, 0)'].includes(neutralCheckbox.border));
assert.ok(neutralCheckbox.mark.includes('✓'));
assert.equal(neutralCheckbox.markColor,'rgb(17, 17, 17)');

const placementNeutral=await page.locator('.sky-chart-placement-summary-choices [data-placement-choice="a"]').evaluate(input=>({
  background:getComputedStyle(input).backgroundColor,
  mark:getComputedStyle(input,'::after').content,
  labelColor:getComputedStyle(input.closest('label')).color
}));
assert.equal(placementNeutral.background,'rgb(255, 255, 255)');
assert.ok(placementNeutral.mark.includes('✓'));
const placementBColor=await page.locator('.sky-chart-placement-summary-choices [data-placement-choice="b"]').evaluate(input=>getComputedStyle(input.closest('label')).color);
assert.equal(placementNeutral.labelColor,placementBColor,'Sky A and B checkbox labels must remain neutral rather than red and blue.');

await combined.locator('[data-house-filter-toggle]').click();
await page.waitForSelector('#skyChartHousePopover.is-portaled:not([hidden])');
const list=menu.locator('[data-house-list="combined"]');
assert.equal(await list.locator('.sky-chart-house-list-header').count(),1);
assert.equal(await list.locator('.sky-chart-house-list-item-master').count(),1);
assert.equal(await list.locator('.sky-chart-house-list-item-house').count(),12);
for(const item of await list.locator('.sky-chart-house-list-item').all()){
  assert.deepEqual(await item.locator('[data-house-choice]').evaluateAll(nodes=>nodes.map(node=>node.dataset.houseChoice)),['all','a','b']);
}

const visibleRows=()=>page.locator('.sky-foundation-relationship-row:not(.sky-chart-filter-hidden):not(.sky-chart-orb-hidden):not(.sky-orb-filter-hidden):not(.sky-chart-multiselect-hidden):not(.sky-chart-house-multiselect-hidden):not([hidden])');
const masterA=list.locator('[data-house-scope="all"][data-house-target="all"][data-house-choice="a"]');
const masterB=list.locator('[data-house-scope="all"][data-house-target="all"][data-house-choice="b"]');
const firstCross=page.locator('.sky-foundation-relationship-row[data-relation-index]').first();
const firstAHouse=await firstCross.getAttribute('data-left-house');
const firstBHouse=await firstCross.getAttribute('data-right-house');

await masterA.uncheck();
await list.locator(`[data-house-scope="house"][data-house-target="${firstAHouse}"][data-house-choice="a"]`).check();
await page.waitForTimeout(120);
assert.ok(await visibleRows().count()>0);
assert.equal(await visibleRows().evaluateAll((rows,house)=>rows.every(row=>row.dataset.leftHouse===house),firstAHouse),true,'Sky A house selections must filter the Sky A endpoint.');
await masterA.check();

await masterB.uncheck();
await list.locator(`[data-house-scope="house"][data-house-target="${firstBHouse}"][data-house-choice="b"]`).check();
await page.waitForTimeout(120);
assert.ok(await visibleRows().count()>0);
assert.equal(await visibleRows().evaluateAll((rows,house)=>rows.every(row=>row.dataset.rightHouse===house),firstBHouse),true,'Sky B house selections must filter the Sky B endpoint.');
await masterB.check();
await page.waitForTimeout(120);

await page.screenshot({path:'sky-chart-house-multiselect-desktop.png',fullPage:true});

const placementSummary=page.locator('[data-placement-filter="combined"] .sky-chart-placement-summary-choices');
await placementSummary.locator('[data-placement-choice="b"]').uncheck();
await page.waitForFunction(()=>document.documentElement.dataset.skyRelationshipMode==='A-A',null,{timeout:10000});
await page.waitForSelector('.sky-foundation-single-sky-row[data-single-sky="A"]',{timeout:10000});
const firstSelf=page.locator('.sky-foundation-single-sky-row[data-single-sky="A"]').first();
const selfHouses=Array.from(new Set([await firstSelf.getAttribute('data-left-house'),await firstSelf.getAttribute('data-right-house')]));
await masterA.uncheck();
for(const house of selfHouses){
  await list.locator(`[data-house-scope="house"][data-house-target="${house}"][data-house-choice="a"]`).check();
}
await page.waitForTimeout(150);
const visibleSelf=page.locator('.sky-foundation-single-sky-row[data-single-sky="A"]:not(.sky-chart-house-multiselect-hidden)');
assert.ok(await visibleSelf.count()>0,'House selections must continue working while viewing Sky A alone.');
assert.equal(await visibleSelf.evaluateAll((rows,houses)=>rows.every(row=>houses.includes(row.dataset.leftHouse)&&houses.includes(row.dataset.rightHouse)),selfHouses),true);
assert.ok(await page.locator('.sky-foundation-single-sky-aspect[data-single-sky="A"]:not(.sky-chart-house-multiselect-hidden)').count()>0);

await masterA.check();
await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(250);
assert.equal(await menu.isVisible(),true);
await page.screenshot({path:'sky-chart-house-multiselect-mobile.png',fullPage:true});
assert.deepEqual(errors,[]);
await browser.close();
console.log('Sky Chart shared Houses checklist and neutral black-and-white checkboxes passed.');
