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
const skyA=sample('Alpha sky',0,{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Malden, Massachusetts, United States',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662});
const skyB=sample('Beta sky',29.27,{dateTime:'2026-08-02T02:07',instant:'2026-08-02T08:07:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891});
const ANGLES=new Set(['asc','ascendant','ac','rising','dsc','desc','descendant','dc','mc','midheaven','medium coeli','ic','imum coeli','imumcoeli']);
const norm=value=>String(value||'').trim().toLowerCase().replace(/[._-]+/g,' ').replace(/\s+/g,' ');

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1200,height:900}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b));localStorage.setItem('relphiSkyChartLastModeV1','comparison')},{a:skyA,b:skyB});
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
await page.waitForSelector('html[data-sky-house-multiselect="ready"]',{timeout:20000});
await page.waitForSelector('[data-house-filter="combined"] [data-house-choice="b"]',{timeout:10000});

const before=await page.locator('.sky-foundation-relationship-row').evaluateAll((rows,angles)=>{
  const angle=value=>angles.includes(String(value||'').trim().toLowerCase().replace(/[._-]+/g,' ').replace(/\s+/g,' '));
  return {total:rows.length,angleRows:rows.filter(row=>angle(row.dataset.leftPlacement)||angle(row.dataset.rightPlacement)).length};
},Array.from(ANGLES));
assert.ok(before.total>0,'Relationship rows must exist for the regression.');
assert.ok(before.angleRows>0,'The fixture must include at least one relationship with a chart angle.');

const summary=page.locator('[data-house-filter="combined"] .sky-chart-house-summary-choices');
await summary.locator('[data-house-choice="a"]').uncheck();
await summary.locator('[data-house-choice="b"]').uncheck();
await page.waitForTimeout(200);

const after=await page.locator('.sky-foundation-relationship-row').evaluateAll((rows,angles)=>{
  const angle=value=>angles.includes(String(value||'').trim().toLowerCase().replace(/[._-]+/g,' ').replace(/\s+/g,' '));
  const angleRows=rows.filter(row=>angle(row.dataset.leftPlacement)||angle(row.dataset.rightPlacement));
  return {
    unfiltered:rows.filter(row=>!row.classList.contains('sky-chart-house-multiselect-hidden')).length,
    angleUnfiltered:angleRows.filter(row=>!row.classList.contains('sky-chart-house-multiselect-hidden')).length,
    missingHouseOnAngles:angleRows.filter(row=>!row.dataset.leftHouse||!row.dataset.rightHouse).map(row=>[row.dataset.leftPlacement,row.dataset.leftHouse,row.dataset.rightPlacement,row.dataset.rightHouse])
  };
},Array.from(ANGLES));
assert.equal(after.unfiltered,0,'With all houses off for A and B, no relationship may bypass the Houses filter.');
assert.equal(after.angleUnfiltered,0,'Asc/Dsc/MC/IC relationships must obey their assigned houses.');
assert.deepEqual(after.missingHouseOnAngles,[],'Angle relationship rows must carry assigned house metadata on both endpoints.');
assert.deepEqual(errors,[]);
await browser.close();
console.log('House filter angle endpoint regression passed.');
