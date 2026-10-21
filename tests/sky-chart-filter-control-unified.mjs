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
const skyB=sample('Current sky',29.27,{dateTime:'2026-08-02T02:07',instant:'2026-08-02T08:07:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891});

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:2});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b));sessionStorage.removeItem('relphiSkyWhereWhenViewV1')},{a:skyA,b:skyB});
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
// Relationships now owns the shared filter controls. Its old Orb-width input
// was replaced by Harmonic Window in Focus, so test the actual filter surfaces.
const filters={
  aspects:'[data-aspect-filter="combined"]',
  placements:'[data-placement-filter="combined"]',
  houses:'[data-house-filter="combined"]'
};
for(const selector of Object.values(filters))await page.waitForSelector(selector,{state:'visible',timeout:20000});
const geometry=await page.evaluate(filters=>Object.fromEntries(Object.entries(filters).map(([name,selector])=>{
  const node=document.querySelector(selector),rect=node.getBoundingClientRect(),style=getComputedStyle(node);
  const button=node.querySelector('button[data-aspect-filter-toggle],button[data-placement-filter-toggle],button[data-house-filter-toggle]');
  const toggle=button?.getBoundingClientRect();
  return[name,{height:rect.height,width:rect.width,display:style.display,
    toggleWidth:toggle?.width||0,toggleHeight:toggle?.height||0,
    labelled:!!node.querySelector('[class*="filter-label"]')}];
})),filters);
for(const [name,shape] of Object.entries(geometry)){
  assert.ok(shape.height>0&&shape.width>0,`${name} filter must have visible layout geometry: ${JSON.stringify(shape)}`);
  assert.ok(shape.toggleWidth>0&&shape.toggleHeight>0,`${name} filter must expose a usable dropdown toggle`);
  assert.equal(shape.labelled,true,`${name} filter must retain an accessible visible label`);
}

// Aspect glyphs keep their canonical identities and distinct colors.
await page.locator('[data-aspect-filter="combined"] [data-aspect-filter-toggle]').click();
await page.waitForSelector('#skyChartAspectPopover:not([hidden]) [data-aspect-list="matrix"]');
await page.waitForFunction(()=>document.querySelectorAll('#skyChartAspectPopover .sky-filter-symbol-aspect[data-glyph-color]').length===11);
const glyphs=await page.locator('#skyChartAspectPopover .sky-chart-aspect-list-item[data-aspect-list-item]:not([data-aspect-list-item="all"]):not([data-aspect-list-item^="group:"])').evaluateAll(rows=>rows.map(row=>{
  const host=row.querySelector('.sky-filter-symbol-aspect');
  return{aspect:row.dataset.aspectListItem,glyph:host?.dataset.canonicalGlyph||'',color:host?.dataset.glyphColor||''};
}));
assert.equal(glyphs.length,11);
assert.ok(glyphs.every(item=>item.glyph===item.aspect),`Aspect identity drift: ${JSON.stringify(glyphs)}`);
assert.equal(new Set(glyphs.map(item=>item.color)).size,11,'Each aspect must retain its own color cue');

// Switching aspects must not move the open popover horizontally.
const popover=page.locator('#skyChartAspectPopover');
const x=(await popover.boundingBox()).x;
const square=popover.locator('[data-aspect-matrix-scope="all"][data-aspect-matrix-aspect="square"]');
await square.click();
await page.waitForTimeout(150);
const off=(await popover.boundingBox()).x;
await square.click();
await page.waitForTimeout(150);
const on=(await popover.boundingBox()).x;
assert.ok(Math.abs(off-x)<=.5&&Math.abs(on-x)<=.5,
  `The aspect menu must retain horizontal anchoring: ${x}, ${off}, ${on}`);
assert.deepEqual(errors,[]);
await page.screenshot({path:'sky-chart-filter-controls-unified.png'});
await browser.close();
console.log('Current Relationship filter controls, canonical glyph identities and anchored Aspect popover passed.');
