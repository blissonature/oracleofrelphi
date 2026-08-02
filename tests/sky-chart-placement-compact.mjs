import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);return{name,longitude:value,sign:signs[sign],degree,minute,second:0}};
function sample(name,offset,profile){
  const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
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
await page.waitForSelector('html[data-sky-placement-multiselect="ready"]',{timeout:20000});

const combined=page.locator('[data-placement-filter="combined"]');
await combined.locator('[data-placement-filter-toggle]').click();
await page.waitForSelector('#skyChartPlacementPopover.is-portaled:not([hidden])');
await page.waitForSelector('[data-placement-list-header="true"]');

const menu=page.locator('#skyChartPlacementPopover');
const list=menu.locator('[data-placement-list="combined"]');
const header=list.locator('[data-placement-list-header="true"]');
assert.deepEqual(await header.locator('span').evaluateAll(nodes=>nodes.map(node=>node.textContent.trim())),['Placement','All','A','B']);
assert.equal(await list.locator('.sky-chart-placement-list-item .sky-chart-placement-choice span:visible').count(),0,'All, A, and B labels must appear only in the header.');

const metrics=await page.evaluate(()=>{
  const menu=document.getElementById('skyChartPlacementPopover');
  const rows=Array.from(menu.querySelectorAll('.sky-chart-placement-list-item'));
  const labels=Array.from(menu.querySelectorAll('.sky-chart-placement-list-label'));
  const header=document.querySelector('[data-placement-list-header="true"]');
  return{
    menuWidth:menu.getBoundingClientRect().width,
    rowHeights:rows.map(row=>row.getBoundingClientRect().height),
    labelAlignments:labels.map(label=>getComputedStyle(label).textAlign),
    headerWidth:header.getBoundingClientRect().width,
    firstRowWidth:rows[0].getBoundingClientRect().width,
    choiceWidths:Array.from(rows[0].querySelectorAll('.sky-chart-placement-choice')).map(choice=>choice.getBoundingClientRect().width)
  };
});
assert.ok(metrics.menuWidth<=352,`Compact menu is too wide: ${metrics.menuWidth}px`);
assert.ok(metrics.rowHeights.every(height=>height<=36),`Rows are not compact: ${metrics.rowHeights.join(', ')}`);
assert.ok(metrics.labelAlignments.every(value=>value==='left'),'Every placement name must be left-aligned.');
assert.ok(Math.abs(metrics.headerWidth-metrics.firstRowWidth)<=1,'The header must align with the list rows.');
assert.ok(metrics.choiceWidths.every(width=>width<=35),'Checkbox columns must remain narrow.');

await page.screenshot({path:'sky-chart-placement-compact-desktop.png',fullPage:true});
await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(250);
assert.ok((await menu.boundingBox()).width<=332);
await page.screenshot({path:'sky-chart-placement-compact-mobile.png',fullPage:true});
assert.deepEqual(errors,[]);
await browser.close();
console.log('Sky Chart compact placement list passed.');
