import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0}};
function sample(name,asc,mc,offset){
  const raw={Sun:0,Moon:30,Mercury:90,Venus:120,Mars:150,Jupiter:180,Saturn:210,Uranus:240,Neptune:270,Pluto:300,'North Node':45,'South Node':225,Lilith:75,'Part of Fortune':135,Vertex:315};
  const houseCusps=Array.from({length:12},(_,index)=>(asc+index*30)%360);
  return{
    name,
    houseSystem:'equal-house',
    houseCusps,
    calcProfile:{
      dateTime:'2026-08-02T12:00',instant:'2026-08-02T18:00:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891,
      houseCusps,houseSystem:'equal-house',ascendant:asc,midheaven:mc
    },
    placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))
  };
}
const skyA=sample('Sky A angle test',0,90,0);
const skyB=sample('Sky B angle test',15,105,0);

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
await page.waitForSelector('html[data-sky-aspect-multiselect="ready"]',{timeout:20000});
await page.waitForFunction(()=>document.querySelectorAll('.sky-foundation-ledger-angle-heading').length===2,null,{timeout:20000});

const angleIds=['asc','dsc','mc','ic'];
const angleLabels={asc:'Asc.',dsc:'Desc.',mc:'MC',ic:'IC'};
for(const slot of ['A','B']){
  const panel=page.locator(`#skyFoundation${slot}`);
  assert.equal(await panel.locator('.sky-foundation-ledger-angle-heading').count(),1,`Sky ${slot} needs one Angles ledger heading.`);
  for(const id of angleIds){
    const row=panel.locator(`.sky-foundation-row[data-placement="${id}"]`);
    assert.equal(await row.count(),1,`Sky ${slot} must contain ${id} in its placement ledger.`);
    assert.equal((await row.locator('.sky-foundation-row-name').textContent())?.trim(),angleLabels[id]);
    assert.match((await row.locator('.sky-foundation-coordinate').textContent())||'',/\d+°\d{2}′/);
    assert.equal(await page.locator(`[data-layer="placements"] [data-sky="${slot}"][data-placement="${id}"]`).count(),1,`Sky ${slot} must render ${id} on the wheel.`);
    assert.equal(await page.locator(`[data-placement-option="${id}"][data-slot="${slot}"]`).count(),1,`${id} must be available in the Placements checklist for Sky ${slot}.`);
  }
}
assert.equal(await page.locator('[data-house-list-item="asc"],[data-house-list-item="dsc"],[data-house-list-item="mc"],[data-house-list-item="ic"]').count(),0,'Angles must not appear in the Houses checklist.');
assert.ok(await page.locator('.sky-foundation-relationship-row[data-left-placement="asc"],.sky-foundation-relationship-row[data-right-placement="asc"],.sky-foundation-relationship-row[data-left-placement="mc"],.sky-foundation-relationship-row[data-right-placement="mc"]').count()>0,'Angle placements must participate in aspect relationships.');

assert.equal(await page.locator('[data-filter="aspect"]').count(),0,'The singular aspect select must be removed.');
const aspectControl=page.locator('[data-aspect-filter="combined"]');
assert.equal(await aspectControl.count(),1,'Aspects must use one multi-select control.');
await aspectControl.locator('[data-aspect-filter-value]').click();
await page.waitForSelector('#skyChartAspectPopover.is-portaled:not([hidden])');
const aspectMenu=page.locator('#skyChartAspectPopover');
assert.equal(await aspectMenu.locator('[data-aspect-choice]').count(),12,'The aspect menu must contain All plus eleven aspects.');

const checkedAspect=aspectMenu.locator('[data-aspect-choice="conjunction"]');
const checkboxStyle=await checkedAspect.evaluate(input=>({
  background:getComputedStyle(input).backgroundColor,
  border:getComputedStyle(input).borderColor,
  mark:getComputedStyle(input,'::after').content
}));
assert.equal(checkboxStyle.background,'rgb(255, 255, 255)');
assert.ok(['rgb(33, 29, 25)','rgb(17, 17, 17)','rgb(0, 0, 0)'].includes(checkboxStyle.border));
assert.ok(checkboxStyle.mark.includes('✓'),'Checked filters must use a black check mark on white.');

const arrows=await page.evaluate(()=>{
  const selectors=[
    '[data-aspect-filter-toggle]',
    '[data-placement-filter-toggle]',
    '[data-house-filter-toggle]',
    '[data-house-system-filter]'
  ];
  return selectors.map(selector=>{
    const node=document.querySelector(selector);
    return node?getComputedStyle(node).backgroundImage:'missing';
  });
});
assert.ok(arrows.every(value=>value!=='missing'&&value!=='none'),'Every dropdown must display the shared chevron.');
assert.equal(new Set(arrows).size,1,'Aspects, Placements, Houses, and House System must use the exact same chevron artwork.');

const visibleRows=()=>page.locator('.sky-foundation-relationship-row:not([hidden]):not(.sky-foundation-single-sky-cross-hidden):not(.sky-chart-filter-hidden):not(.sky-chart-orb-hidden):not(.sky-orb-filter-hidden):not(.sky-chart-multiselect-hidden):not(.sky-chart-house-multiselect-hidden):not(.sky-chart-aspect-multiselect-hidden)');
const visibleLines=()=>page.locator('[data-layer="aspects"] > .sky-foundation-aspect:not(.sky-foundation-single-sky-cross-hidden):not(.sky-chart-multiselect-hidden):not(.sky-chart-house-multiselect-hidden):not(.sky-chart-aspect-multiselect-hidden)');

await aspectMenu.locator('[data-aspect-choice="all"]').uncheck();
await aspectMenu.locator('[data-aspect-choice="conjunction"]').check();
await aspectMenu.locator('[data-aspect-choice="square"]').check();
await page.waitForTimeout(150);
assert.ok(await visibleRows().count()>0,'Selecting two aspects must leave matching relationships visible.');
assert.equal(await visibleRows().evaluateAll(rows=>rows.every(row=>['conjunction','square'].includes(row.dataset.aspect))),true);
assert.equal(await visibleLines().evaluateAll(lines=>lines.every(line=>['conjunction','square'].includes(line.dataset.aspect))),true);
assert.equal((await aspectControl.locator('[data-aspect-filter-summary]').textContent())?.trim(),'2 of 11');
await page.screenshot({path:'sky-chart-aspect-multiselect-desktop.png',fullPage:true});

await aspectMenu.locator('[data-aspect-choice="all"]').check();
await aspectControl.locator('[data-aspect-filter-toggle]').click();
const placementControl=page.locator('[data-placement-filter="combined"]');
await placementControl.locator('[data-placement-filter-toggle]').click();
await page.waitForSelector('#skyChartPlacementPopover.is-portaled:not([hidden])');
const ascA=page.locator('#skyChartPlacementPopover [data-placement-scope="placement"][data-placement-target="asc"][data-placement-choice="a"]');
await ascA.uncheck();
await page.waitForTimeout(180);
assert.equal(await page.locator('[data-layer="placements"] [data-sky="A"][data-placement="asc"]:not(.sky-chart-angle-placement-hidden)').count(),0,'Turning off Sky A Asc. must hide its wheel bubble.');
assert.equal(await page.locator('#skyFoundationA .sky-foundation-row[data-placement="asc"]:not(.sky-chart-angle-placement-hidden)').count(),0,'Turning off Sky A Asc. must hide its ledger row.');
assert.equal(await visibleRows().evaluateAll(rows=>rows.every(row=>!(row.dataset.leftSky!=='B'&&row.dataset.leftPlacement==='asc'))),true,'Turning off Sky A Asc. must hide its relationships.');

await page.screenshot({path:'sky-chart-angle-placements-desktop.png',fullPage:true});
await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(250);
await placementControl.locator('[data-placement-filter-toggle]').click();
await aspectControl.locator('[data-aspect-filter-value]').click();
await page.waitForSelector('#skyChartAspectPopover.is-portaled:not([hidden])');
await page.screenshot({path:'sky-chart-aspect-multiselect-mobile.png',fullPage:true});
assert.deepEqual(errors,[]);
await browser.close();
console.log('Sky Chart angle placements, multi-select aspects, neutral checkboxes, and shared chevrons passed.');
