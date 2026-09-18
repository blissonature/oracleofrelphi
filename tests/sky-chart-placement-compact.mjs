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
const skyB=sample('Comparison sky',29.27,{dateTime:'2026-08-02T02:07',instant:'2026-08-02T08:07:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891});

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(a=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
  localStorage.removeItem('relphiSkyChartB');
  localStorage.setItem('relphiSkyChartLastModeV1','single');
  sessionStorage.removeItem('relphiSkyWhereWhenViewV1');
},skyA);
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
await page.waitForSelector('html[data-sky-placement-multiselect="v4"]',{timeout:20000});
await page.waitForSelector('#skyFoundationWheelMount > .sky-foundation-wheel[data-single-sky="A"]',{timeout:20000});

const combined=page.locator('[data-placement-filter="combined"]');
const menu=page.locator('#skyChartPlacementPopover');
async function openMenu(){
  if(!(await menu.isVisible()))await combined.locator('[data-placement-filter-toggle]').click();
  await page.waitForSelector('#skyChartPlacementPopover.is-portaled:not([hidden])');
  await page.waitForSelector('[data-placement-list-header="true"]');
}
async function closeMenu(){
  if(await menu.isVisible())await combined.locator('[data-placement-filter-toggle]').click();
  await page.waitForFunction(()=>document.getElementById('skyChartPlacementPopover')?.hidden===true);
}
async function menuMetrics(){
  return page.evaluate(()=>{
    const menu=document.getElementById('skyChartPlacementPopover');
    const list=menu.querySelector('[data-placement-list="combined"]');
    const rows=Array.from(list.querySelectorAll('.sky-chart-placement-list-item'));
    const labels=Array.from(list.querySelectorAll('.sky-chart-placement-list-label'));
    const header=list.querySelector('[data-placement-list-header="true"]');
    const headerChoices=Array.from(header.querySelectorAll('.sky-chart-placement-list-header-choice'));
    const rowChoices=Array.from(rows[0].querySelectorAll('.sky-chart-placement-choice'));
    const box=node=>node.getBoundingClientRect();
    return{
      menuWidth:box(menu).width,
      rowMetrics:rows.map(row=>({height:box(row).height,placement:row.classList.contains('sky-chart-placement-list-item-placement')})),
      labelAlignments:labels.map(label=>getComputedStyle(label).textAlign),
      headerWidth:box(header).width,
      firstRowWidth:box(rows[0]).width,
      headerLabels:headerChoices.map(node=>node.textContent.trim()),
      rowChoiceCount:rowChoices.length,
      choiceWidths:rowChoices.map(node=>box(node).width),
      headerChoiceCenters:headerChoices.map(node=>Math.round((box(node).left+box(node).right)/2)),
      rowChoiceCenters:rowChoices.map(node=>Math.round((box(node).left+box(node).right)/2)),
      headerLabelRight:Math.round(box(header.querySelector('.sky-chart-placement-list-header-label')).right),
      headerChoicesLeft:Math.round(box(header.querySelector('.sky-chart-placement-list-header-choices')).left)
    };
  });
}

await openMenu();
let metrics=await menuMetrics();
assert.deepEqual(metrics.headerLabels,['A'],'A single Sky must have exactly one placement checkbox column.');
assert.equal(metrics.rowChoiceCount,1,'A single Sky must not render a redundant All column.');
assert.deepEqual(metrics.headerChoiceCenters,metrics.rowChoiceCenters,'The A heading must sit directly over its checkbox column.');
assert.ok(Math.abs(metrics.headerLabelRight-metrics.headerChoicesLeft)<=1,'The label and A columns must meet without an uneven gap.');
assert.ok(metrics.choiceWidths.every(width=>width<=35),'The single A checkbox column must remain narrow.');
assert.ok(metrics.menuWidth<=352,`Compact single-Sky menu is too wide: ${metrics.menuWidth}px`);
assert.ok(metrics.rowMetrics.filter(row=>row.placement).every(row=>row.height<=36),`Placement rows are not compact: ${JSON.stringify(metrics.rowMetrics)}`);
assert.ok(metrics.rowMetrics.every(row=>row.height<=44),`Section rows are unexpectedly tall: ${JSON.stringify(metrics.rowMetrics)}`);
assert.ok(metrics.labelAlignments.every(value=>value==='left'),'Every placement name must be left-aligned.');
assert.ok(Math.abs(metrics.headerWidth-metrics.firstRowWidth)<=1,'The header must align with the list rows.');
await page.screenshot({path:'sky-chart-placement-single-desktop.png',fullPage:true});
await closeMenu();

// Reproduce the real Add Sky B lifecycle: the B payload arrives while the slot is
// still in editing state, then Where and When commits it.
await page.evaluate(b=>{
  const root=document.documentElement;
  root.dataset.skyBEditing='true';
  window.RelphiSkyStartupMode?.writeMode?.('comparison');
  window.RelphiSkyStartupMode?.syncRoot?.();
  localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
  window.dispatchEvent(new CustomEvent('relphi:sky-where-when-committed',{detail:{slots:['B']}}));
},skyB);

await page.waitForFunction(()=>{
  const root=document.documentElement;
  const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel:not([data-single-sky])');
  return root.dataset.skyBPresent==='true'&&root.dataset.skyBEditing!=='true'&&wheel&&getComputedStyle(wheel).visibility==='visible';
},null,{timeout:20000});

const comparisonWheel=await page.evaluate(()=>{
  const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel:not([data-single-sky])');
  const visible=node=>{const style=getComputedStyle(node),box=node.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity||1)>0&&box.width>0&&box.height>0};
  return{
    visible:visible(wheel),
    aHousePaths:wheel.querySelectorAll('[data-layer="a-houses"] path').length,
    bHousePaths:wheel.querySelectorAll('[data-layer="b-houses"] path').length,
    zodiacPaths:wheel.querySelectorAll('[data-layer="zodiac"] > path').length,
    outlineCircles:wheel.querySelectorAll('[data-layer="outlines"] circle').length,
    leaders:wheel.querySelectorAll('[data-layer="leaders"] line').length,
    aPlacements:wheel.querySelectorAll('[data-layer="placements"] > g[data-sky="A"]').length,
    bPlacements:wheel.querySelectorAll('[data-layer="placements"] > g[data-sky="B"]').length
  };
});
assert.equal(comparisonWheel.visible,true,'The comparison wheel must remain visible after adding Sky B.');
assert.equal(comparisonWheel.aHousePaths,12,'Sky A house sectors must remain painted in comparison mode.');
assert.equal(comparisonWheel.bHousePaths,12,'Sky B house sectors must be painted in comparison mode.');
assert.equal(comparisonWheel.zodiacPaths,12,'The zodiac ring must remain painted in comparison mode.');
assert.ok(comparisonWheel.outlineCircles>=4,'Comparison ring outlines must remain painted.');
assert.ok(comparisonWheel.leaders>0,'Comparison placement leaders must exist.');
assert.ok(comparisonWheel.aPlacements>0&&comparisonWheel.bPlacements>0,'Both skies must retain visible placement hosts.');

await openMenu();
metrics=await menuMetrics();
assert.deepEqual(metrics.headerLabels,['All','A','B'],'Comparison mode must expose All, A, and B placement columns.');
assert.equal(metrics.rowChoiceCount,3);
assert.deepEqual(metrics.headerChoiceCenters,metrics.rowChoiceCenters,'All / A / B headings must sit directly over their checkbox columns.');
assert.ok(Math.abs(metrics.headerLabelRight-metrics.headerChoicesLeft)<=1,'Comparison label and checkbox columns must meet without an uneven gap.');
assert.ok(metrics.choiceWidths.every(width=>width<=35),'Comparison checkbox columns must remain narrow.');
await page.screenshot({path:'sky-chart-placement-compact-desktop.png',fullPage:true});

await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(250);
assert.ok((await menu.boundingBox()).width<=332);
metrics=await menuMetrics();
assert.deepEqual(metrics.headerChoiceCenters,metrics.rowChoiceCenters,'Mobile All / A / B headings must remain aligned.');
await page.screenshot({path:'sky-chart-placement-compact-mobile.png',fullPage:true});

assert.deepEqual(errors,[]);
await browser.close();
console.log('Sky Chart single/comparison placement columns and Add Sky B wheel lifecycle passed.');
