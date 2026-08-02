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
const ANGLES=[
  {id:'asc',label:'Asc.',alias:'Ascendant',house:'1'},
  {id:'dsc',label:'Desc.',alias:'Descendant',house:'7'},
  {id:'mc',label:'MC',alias:'Midheaven',house:'10'},
  {id:'ic',label:'IC',alias:'IC',house:'4'}
];

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:2});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b));sessionStorage.removeItem('relphiSkyWhereWhenViewV1')},{a:skyA,b:skyB});
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
await page.waitForSelector('html[data-sky-house-angle-support="ready"]',{timeout:20000});

const combined=page.locator('[data-house-filter="combined"]');
await combined.locator('[data-house-filter-toggle]').click();
await page.waitForSelector('#skyChartHousePopover.is-portaled:not([hidden])');
const menu=page.locator('#skyChartHousePopover');
const list=menu.locator('[data-house-list="combined"][data-angle-support="true"]');
assert.equal(await list.locator('[data-house-scope="house"]').count(),12*3);
assert.equal(await list.locator('.sky-chart-house-list-item-angle-group[data-house-angle-list-item="angles"]').count(),1);
assert.equal(await list.locator('.sky-chart-house-list-item-angle').count(),4);
assert.deepEqual(await list.locator('.sky-chart-house-list-item-angle .sky-chart-house-list-label').allTextContents(),ANGLES.map(angle=>angle.label));
for(const angle of ANGLES){
  assert.equal(await list.locator(`[data-house-angle-scope="angle"][data-house-angle-target="${angle.id}"]`).count(),3);
}

await page.evaluate(angles=>{
  const aspectLayer=document.querySelector('[data-layer="aspects"]');
  angles.forEach(angle=>{
    const make=(slot)=>{
      const row=document.createElement('div');
      row.className='sky-foundation-relationship-row';
      row.dataset.testAngle=`${slot}-${angle.id}`;
      row.dataset.leftSky='A';
      row.dataset.rightSky='B';
      row.dataset.leftPlacement=slot==='A'?angle.alias:'Sun';
      row.dataset.rightPlacement=slot==='B'?angle.alias:'Sun';
      row.dataset.leftHouse=slot==='A'?angle.house:'5';
      row.dataset.rightHouse=slot==='B'?angle.house:'5';
      document.body.appendChild(row);
      if(aspectLayer){
        const line=document.createElementNS('http://www.w3.org/2000/svg','g');
        line.classList.add('sky-foundation-aspect');
        line.dataset.testAngleLine=`${slot}-${angle.id}`;
        Object.assign(line.dataset,{
          leftSky:'A',rightSky:'B',
          leftPlacement:slot==='A'?angle.alias:'Sun',
          rightPlacement:slot==='B'?angle.alias:'Sun',
          leftHouse:slot==='A'?angle.house:'5',
          rightHouse:slot==='B'?angle.house:'5'
        });
        aspectLayer.appendChild(line);
      }
    };
    make('A');
    make('B');
  });
},ANGLES);

const masterA=list.locator('[data-house-scope="all"][data-house-target="all"][data-house-choice="a"]');
const masterB=list.locator('[data-house-scope="all"][data-house-target="all"][data-house-choice="b"]');
const syntheticVisible=slot=>page.locator(`[data-test-angle^="${slot}-"]:not(.sky-chart-house-multiselect-hidden)`);
const syntheticLinesVisible=slot=>page.locator(`[data-test-angle-line^="${slot}-"]:not(.sky-chart-house-multiselect-hidden)`);

await masterA.uncheck();
for(const angle of ANGLES){
  const input=list.locator(`[data-house-angle-scope="angle"][data-house-angle-target="${angle.id}"][data-house-angle-choice="a"]`);
  await input.check();
  await page.waitForTimeout(120);
  assert.deepEqual(await syntheticVisible('A').evaluateAll(nodes=>nodes.map(node=>node.dataset.testAngle)),[`A-${angle.id}`]);
  assert.deepEqual(await syntheticLinesVisible('A').evaluateAll(nodes=>nodes.map(node=>node.dataset.testAngleLine)),[`A-${angle.id}`]);
  await input.uncheck();
}
await masterA.check();

await masterB.uncheck();
for(const angle of ANGLES){
  const input=list.locator(`[data-house-angle-scope="angle"][data-house-angle-target="${angle.id}"][data-house-angle-choice="b"]`);
  await input.check();
  await page.waitForTimeout(120);
  assert.deepEqual(await syntheticVisible('B').evaluateAll(nodes=>nodes.map(node=>node.dataset.testAngle)),[`B-${angle.id}`]);
  assert.deepEqual(await syntheticLinesVisible('B').evaluateAll(nodes=>nodes.map(node=>node.dataset.testAngleLine)),[`B-${angle.id}`]);
  await input.uncheck();
}
await masterB.check();
await page.waitForTimeout(120);

const ascInput=list.locator('[data-house-angle-scope="angle"][data-house-angle-target="asc"][data-house-angle-choice="a"]');
const neutral=await ascInput.evaluate(input=>({
  background:getComputedStyle(input).backgroundColor,
  border:getComputedStyle(input).borderTopColor,
  mark:getComputedStyle(input,'::after').content,
  markColor:getComputedStyle(input,'::after').color
}));
assert.equal(neutral.background,'rgb(255, 255, 255)');
assert.ok(['rgb(33, 29, 25)','rgb(0, 0, 0)'].includes(neutral.border));
assert.ok(neutral.mark.includes('✓'));
assert.equal(neutral.markColor,'rgb(17, 17, 17)');

await list.locator('.sky-chart-house-list-item-angle').first().scrollIntoViewIfNeeded();
await menu.screenshot({path:'sky-chart-house-angle-support-desktop.png'});
await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(250);
await list.locator('.sky-chart-house-list-item-angle').first().scrollIntoViewIfNeeded();
await menu.screenshot({path:'sky-chart-house-angle-support-mobile.png'});
assert.deepEqual(errors,[]);
await browser.close();
console.log('Sky Chart Houses supports Asc., Desc., MC, and IC with neutral black-and-white checkboxes.');
