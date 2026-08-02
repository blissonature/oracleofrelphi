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
const ANGLES=['asc','dsc','mc','ic'];

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:2});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b));sessionStorage.removeItem('relphiSkyWhereWhenViewV1')},{a:skyA,b:skyB});
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
await page.waitForSelector('html[data-sky-house-multiselect="ready"]',{timeout:20000});
await page.waitForSelector('html[data-sky-placement-multiselect="ready"]',{timeout:20000});
await page.waitForFunction(()=>document.querySelectorAll('.sky-foundation-ledger-angle-heading').length===2,null,{timeout:20000});

const houseControl=page.locator('[data-house-filter="combined"]');
await houseControl.locator('[data-house-filter-toggle]').click();
await page.waitForSelector('#skyChartHousePopover.is-portaled:not([hidden])');
const houseMenu=page.locator('#skyChartHousePopover');
const houseList=houseMenu.locator('[data-house-list="combined"]');
assert.equal(await houseList.locator('[data-house-scope="house"]').count(),12*3,'Houses must contain only House 1 through House 12 with All/A/B controls.');
assert.equal(await houseList.locator('[data-house-angle-scope],[data-house-list-item="asc"],[data-house-list-item="dsc"],[data-house-list-item="mc"],[data-house-list-item="ic"]').count(),0,'Asc., Desc., MC, and IC must not be housed in the Houses filter.');
await houseControl.locator('[data-house-filter-toggle]').click();

const placementControl=page.locator('[data-placement-filter="combined"]');
await placementControl.locator('[data-placement-filter-toggle]').click();
await page.waitForSelector('#skyChartPlacementPopover.is-portaled:not([hidden])');
const placementMenu=page.locator('#skyChartPlacementPopover');
for(const id of ANGLES){
  assert.equal(await placementMenu.locator(`[data-placement-scope="placement"][data-placement-target="${id}"]`).count(),3,`${id} must have All/A/B controls in Placements.`);
  for(const slot of ['A','B']){
    assert.equal(await page.locator(`#skyFoundation${slot} .sky-foundation-row[data-placement="${id}"]`).count(),1,`${id} must appear in Sky ${slot}'s placement ledger.`);
    assert.equal(await page.locator(`[data-layer="placements"] [data-sky="${slot}"][data-placement="${id}"]`).count(),1,`${id} must appear on the comparison wheel for Sky ${slot}.`);
  }
}
assert.ok(await page.locator('.sky-foundation-relationship-row[data-left-placement="asc"],.sky-foundation-relationship-row[data-right-placement="asc"],.sky-foundation-relationship-row[data-left-placement="mc"],.sky-foundation-relationship-row[data-right-placement="mc"]').count()>0,'Angles must participate in relationship calculations.');

await placementMenu.screenshot({path:'sky-chart-house-angle-support-desktop.png'});
await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(250);
await placementMenu.screenshot({path:'sky-chart-house-angle-support-mobile.png'});
assert.deepEqual(errors,[]);
await browser.close();
console.log('Sky Chart keeps Houses to 1–12 and supports Asc., Desc., MC, and IC as first-class placements.');
