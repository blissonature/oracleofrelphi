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
const skyB=sample('Current sky',29.27,{dateTime:'2026-09-19T15:30',instant:'2026-09-19T21:30:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891});

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1536,height:960}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
  },{a:skyA,b:skyB});

  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
  await page.waitForSelector('#skyFoundationRelationshipList>.sky-foundation-relationship-row',{timeout:20000});
  await page.waitForFunction(()=>document.documentElement.dataset.skyRelationshipFilmstrip==='true');

  const root=page.locator('#skyFoundationRoot');
  const panel=page.locator('#skyFoundationRelationships');
  const list=page.locator('#skyFoundationRelationshipList');
  const wheel=page.locator('#skyFoundationWheelMount>.sky-foundation-wheel');
  assert.equal(await panel.evaluate(node=>node.parentElement?.id),'skyFoundationComparison','Desktop filmstrip must stay owned by Comparison directly beneath the wheel.');

  const comparison=page.locator('#skyFoundationComparison');
  const comparisonBox=await comparison.boundingBox(),panelBox=await panel.boundingBox(),wheelBox=await page.locator('#skyFoundationWheelMount').boundingBox();
  assert.ok(Math.abs(comparisonBox.width-panelBox.width)<=2,'Collapsed filmstrip should use the Comparison width.');
  assert.ok(Math.abs(panelBox.y-(wheelBox.y+wheelBox.height))<=2,'Collapsed filmstrip must begin immediately below the wheel.');
  assert.ok(panelBox.height<=82,'Collapsed filmstrip must fit in the compact shelf beneath the wheel.');

  const layout=await list.evaluate(node=>{const s=getComputedStyle(node);return{flow:s.gridAutoFlow,columns:s.gridTemplateColumns,overflowX:s.overflowX,overflowY:s.overflowY,height:s.height}});
  assert.ok(layout.flow.startsWith('column'),'Collapsed Relationships must be a horizontal filmstrip.');
  assert.notEqual(layout.overflowX,'hidden');
  assert.equal(layout.overflowY,'hidden');

  const visibleRows=()=>page.locator('#skyFoundationRelationshipList>.sky-foundation-relationship-row:visible');
  const baseline=await visibleRows().count();
  assert.ok(baseline>10,'Fixture must begin with a useful relationship set.');

  const first=visibleRows().nth(0);
  await first.focus();
  await page.waitForTimeout(60);
  assert.equal((await wheel.getAttribute('class')||'').includes('has-isolation'),true,'Focused filmstrip relationship must drive wheel isolation.');

  await page.evaluate(()=>{
    window.__filmstripFilterEvents=0;
    window.__filmstripClicks=0;
    window.addEventListener('relphi:sky-foundation-filter-changed',()=>{window.__filmstripFilterEvents+=1});
    document.getElementById('skyFoundationRelationshipList')?.addEventListener('click',()=>{window.__filmstripClicks+=1});
  });

  const firstIndex=await first.getAttribute('data-relation-index');
  await page.keyboard.press('ArrowRight');
  const afterArrow=await page.evaluate(()=>({
    index:document.activeElement?.dataset?.relationIndex||'',
    isRow:document.activeElement?.classList?.contains('sky-foundation-relationship-row')||false
  }));
  assert.equal(afterArrow.isRow,true);
  assert.notEqual(afterArrow.index,firstIndex,'ArrowRight must advance to the next filmstrip tile.');

  await page.locator('#skyFoundationRelationshipList>.sky-foundation-relationship-row:focus').hover();
  await page.mouse.wheel(0,120);
  await page.waitForTimeout(90);
  const afterWheel=await page.evaluate(()=>({
    index:document.activeElement?.dataset?.relationIndex||'',
    filterEvents:window.__filmstripFilterEvents,
    clicks:window.__filmstripClicks
  }));
  assert.notEqual(afterWheel.index,afterArrow.index,'Mouse wheel must scrub to the next relationship.');
  assert.equal(afterWheel.filterEvents,0,'Relationship scrubbing must stay off the expensive foundation filter pipeline.');
  assert.equal(afterWheel.clicks,0,'Mouse-wheel scrubbing must select/focus without activating the tile.');

  const kept=await wheel.evaluate(node=>({kept:node.querySelectorAll('[data-focus-piece].is-kept').length,total:node.querySelectorAll('[data-focus-piece]').length}));
  assert.ok(kept.kept>0&&kept.kept<kept.total,'Scrubbed relationship must keep only its wheel context.');

  const toggle=page.locator('#skyRelationshipFilmstripToggle');
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  await toggle.click();
  await page.waitForFunction(()=>document.getElementById('skyFoundationRelationships')?.dataset.filmstripExpanded==='true');
  assert.equal(await toggle.getAttribute('aria-expanded'),'true');

  const expandedRows=visibleRows();
  const r0=await expandedRows.nth(0).boundingBox(),r1=await expandedRows.nth(1).boundingBox();
  assert.ok(r1.y>r0.y+r0.height*.6,'Expanded Relationships must be a single vertical column.');
  assert.ok(Math.abs(r1.x-r0.x)<=2,'Expanded single-column relationship tiles must share one column.');

  const expandedPanelBox=await panel.boundingBox();
  const expandedWheelBox=await page.locator('#skyFoundationWheelMount').boundingBox();
  assert.ok(expandedPanelBox.y>=expandedWheelBox.y+expandedWheelBox.height-1,'Expanded picker must still begin below the wheel.');

  const focusedBeforeDown=await page.evaluate(()=>document.activeElement?.dataset?.relationIndex||'');
  await page.keyboard.press('ArrowDown');
  const focusedAfterDown=await page.evaluate(()=>document.activeElement?.dataset?.relationIndex||'');
  assert.notEqual(focusedAfterDown,focusedBeforeDown,'ArrowDown must advance within the expanded single-column picker.');

  await page.locator('[data-aspect-filter="combined"] [data-aspect-filter-toggle]').click();
  const aspectPopover=page.locator('#skyChartAspectPopover');
  await page.waitForSelector('#skyChartAspectPopover.is-portaled:not([hidden])');
  const square=aspectPopover.locator('[data-aspect-matrix-scope="all"][data-aspect-matrix-aspect="square"]');
  await square.uncheck();
  await page.waitForFunction(()=>![...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-aspect="square"]')].some(row=>!row.hidden&&!Array.from(row.classList).some(name=>/hidden$/.test(name))));
  assert.ok(await visibleRows().count()<baseline,'Aspect filter must still narrow the filmstrip/list.');
  await square.check();
  await page.keyboard.press('Escape');

  await page.locator('[data-placement-filter="combined"] [data-placement-filter-toggle]').click();
  const placementPopover=page.locator('#skyChartPlacementPopover');
  await page.waitForSelector('#skyChartPlacementPopover.is-portaled:not([hidden])');
  const placementAll=placementPopover.locator('[data-placement-scope="all"][data-placement-target="all"][data-placement-choice="all"]');
  const sunAll=placementPopover.locator('[data-placement-scope="placement"][data-placement-target="sun"][data-placement-choice="all"]');
  await placementAll.uncheck();
  await sunAll.check();
  await page.waitForTimeout(120);
  const placementCount=await visibleRows().count();
  assert.ok(placementCount>0&&placementCount<baseline,'Placement filter must still narrow Relationships.');
  assert.equal(await visibleRows().evaluateAll(rows=>rows.every(row=>row.dataset.leftPlacement==='sun'||row.dataset.rightPlacement==='sun')),true);
  await placementAll.check();
  await page.keyboard.press('Escape');

  const firstHouse=await visibleRows().first().getAttribute('data-left-house');
  await page.locator('[data-house-filter="combined"] [data-house-filter-toggle]').click();
  const housePopover=page.locator('#skyChartHousePopover');
  await page.waitForSelector('#skyChartHousePopover.is-portaled:not([hidden])');
  const houseAll=housePopover.locator('[data-house-scope="all"][data-house-target="all"][data-house-choice="all"]');
  await houseAll.uncheck();
  await housePopover.locator('[data-house-scope="house"][data-house-target="'+firstHouse+'"][data-house-choice="all"]').check();
  await page.waitForTimeout(120);
  assert.ok(await visibleRows().count()<baseline,'House filter must still narrow Relationships.');
  await houseAll.check();
  await page.keyboard.press('Escape');

  await page.locator('[data-zodiac-summary]').click();
  const zodiacMenu=page.locator('#skyChartZodiacFilterMenu');
  await page.waitForSelector('#skyChartZodiacFilterMenu:not([hidden])');
  const sign=await visibleRows().first().getAttribute('data-left-sign');
  await zodiacMenu.locator('[data-zodiac-none]').click();
  await zodiacMenu.locator('.sky-chart-zodiac-filter-row input[value="'+sign+'"]').click();
  await page.waitForTimeout(120);
  assert.ok(await visibleRows().count()<baseline,'Zodiac filter must still narrow Relationships.');
  await zodiacMenu.locator('[data-zodiac-all]').click();
  await page.keyboard.press('Escape');

  const harmonic=page.locator('[data-harmonic-window-input]');
  await harmonic.fill('1');
  await page.waitForTimeout(150);
  assert.ok(await visibleRows().count()<baseline,'Harmonic Window must still narrow Relationships.');
  await harmonic.fill('6');
  await page.waitForTimeout(120);

  await page.setViewportSize({width:800,height:960});
  await page.waitForFunction(()=>document.documentElement.dataset.skyRelationshipFilmstrip!=='true');
  assert.equal(await panel.evaluate(node=>node.parentElement?.id),'skyFoundationComparison');
  assert.equal(await page.locator('#skyRelationshipFilmstripToggle').count(),0);

  assert.deepEqual(errors,[]);
  await page.screenshot({path:'sky-chart-relationship-filmstrip.png',fullPage:true});
  console.log('Sky Chart Relationships filmstrip, downward single-column expansion, scrubbing, isolation, filters, and desktop-only fallback passed.');
}finally{
  await browser.close();
}
