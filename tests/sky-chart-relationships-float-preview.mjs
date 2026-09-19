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
const skyB=sample('Current sky',29.27,{dateTime:'2026-09-19T00:15',instant:'2026-09-19T06:15:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891});

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
    sessionStorage.removeItem('relphiSkyWhereWhenViewV1');
  },{a:skyA,b:skyB});

  await page.goto('http://127.0.0.1:4173/sky-chart.html?relationships=float',{waitUntil:'networkidle'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
  await page.waitForSelector('#skyFoundationRelationshipList .sky-foundation-relationship-row',{timeout:20000});
  await page.waitForSelector('[data-aspect-filter="combined"]',{timeout:20000});
  await page.waitForSelector('[data-placement-filter="combined"]',{timeout:20000});
  await page.waitForSelector('[data-house-filter="combined"]',{timeout:20000});
  await page.waitForSelector('[data-zodiac-filter]',{timeout:20000});
  await page.waitForSelector('[data-harmonic-window-input]',{timeout:20000});
  await page.waitForFunction(()=>document.documentElement.dataset.skyRelationshipsView==='float');

  const panel=page.locator('#skyFoundationRelationships');
  assert.equal(await panel.evaluate(node=>getComputedStyle(node).position),'fixed','Floating Relationships must be taken out of normal flow.');
  assert.equal(await page.locator('#skyRelationshipsFloatPreviewButton').getAttribute('aria-pressed'),'true');

  const wheel=page.locator('#skyFoundationWheelMount > .sky-foundation-wheel');
  const row=page.locator('#skyFoundationRelationshipList > .sky-foundation-relationship-row:visible').first();

  // Spatial keyboard navigation follows the rendered relationship grid.
  await row.focus();
  const startBox=await row.boundingBox();
  await page.keyboard.press('ArrowRight');
  const rightNav=await page.evaluate(()=>({
    active:document.activeElement?.classList.contains('sky-foundation-relationship-row')||false,
    rect:document.activeElement?.getBoundingClientRect?.()
      ? {left:document.activeElement.getBoundingClientRect().left,top:document.activeElement.getBoundingClientRect().top,width:document.activeElement.getBoundingClientRect().width,height:document.activeElement.getBoundingClientRect().height}
      : null
  }));
  assert.equal(rightNav.active,true,'ArrowRight must move focus to an adjacent relationship tile.');
  assert.ok(rightNav.rect.left>startBox.x+startBox.width*.5,'ArrowRight must move to the neighboring visual column.');

  const beforeDown=rightNav.rect;
  await page.keyboard.press('ArrowDown');
  const downNav=await page.evaluate(()=>({
    active:document.activeElement?.classList.contains('sky-foundation-relationship-row')||false,
    rect:document.activeElement?.getBoundingClientRect?.()
      ? {left:document.activeElement.getBoundingClientRect().left,top:document.activeElement.getBoundingClientRect().top,width:document.activeElement.getBoundingClientRect().width,height:document.activeElement.getBoundingClientRect().height}
      : null
  }));
  assert.equal(downNav.active,true,'ArrowDown must keep focus within relationship tiles.');
  assert.ok(downNav.rect.top>beforeDown.top+1,'ArrowDown must move to the next visual row.');

  await row.focus();
  await page.evaluate(()=>{
    window.__relphiFloatPreviewFoundationFilterEvents=0;
    window.addEventListener('relphi:sky-foundation-filter-changed',()=>{window.__relphiFloatPreviewFoundationFilterEvents+=1});
  });
  await row.hover();
  await page.waitForTimeout(80);
  assert.equal((await wheel.getAttribute('class')||'').includes('has-isolation'),true,'Relationship hover must dim unrelated wheel structure.');
  const hoverIsolation=await wheel.evaluate(node=>({
    kept:node.querySelectorAll('[data-focus-piece].is-kept').length,
    total:node.querySelectorAll('[data-focus-piece]').length
  }));
  assert.ok(hoverIsolation.kept>0&&hoverIsolation.kept<hoverIsolation.total,'Relationship hover must keep only the hovered relationship context.');
  assert.ok(await page.locator('.sky-foundation-aspect.is-row-hovered:not(.sky-foundation-aspect-hit)').count()>0,'Relationship hover must identify the matching wheel aspect.');
  assert.equal(await page.evaluate(()=>window.__relphiFloatPreviewFoundationFilterEvents),0,'Relationship hover isolation must stay on the wheel-only fast path and must not invoke the relationship-filter pipeline.');
  await page.locator('.sky-foundation-relationships-heading h2').hover();
  await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel')?.classList.contains('has-isolation')===false);

  await row.click({position:{x:18,y:18}});
  await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel')?.classList.contains('has-isolation')===true);
  const isolation=await wheel.evaluate(node=>({
    kept:node.querySelectorAll('[data-focus-piece].is-kept').length,
    total:node.querySelectorAll('[data-focus-piece]').length,
    selectedLines:node.querySelectorAll('[data-focus-piece="aspect"].is-selected').length
  }));
  assert.ok(isolation.kept>0&&isolation.kept<isolation.total,'Relationship click must dim unrelated wheel structure and keep only the selected relationship context.');
  assert.ok(isolation.selectedLines>=1,'Relationship click must mark the matching aspect line selected.');

  await row.click({position:{x:18,y:18}});
  await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel')?.classList.contains('has-isolation')===false);

  const visibleRows=()=>page.locator('#skyFoundationRelationshipList > .sky-foundation-relationship-row:visible');
  const baseline=await visibleRows().count();
  assert.ok(baseline>10,'Fixture must begin with a useful relationship set.');

  // Aspect filter
  await page.locator('[data-aspect-filter="combined"] [data-aspect-filter-toggle]').click();
  const aspectPopover=page.locator('#skyChartAspectPopover');
  await page.waitForSelector('#skyChartAspectPopover.is-portaled:not([hidden])');
  assert.equal(await aspectPopover.evaluate(node=>node.parentElement===document.body),true);
  assert.ok(Number(await aspectPopover.evaluate(node=>getComputedStyle(node).zIndex))>1200,'Aspect popover must render above the floating Relationships panel.');
  const square=aspectPopover.locator('[data-aspect-matrix-scope="all"][data-aspect-matrix-aspect="square"]');
  await square.uncheck();
  await page.waitForFunction(()=>![...document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row[data-aspect="square"]')].some(row=>getComputedStyle(row).display!=='none'&&!row.hidden));
  assert.ok(await visibleRows().count()<baseline,'Aspect filter must change the visible relationship set.');
  await square.check();
  await page.keyboard.press('Escape');

  // Placement filter
  await page.locator('[data-placement-filter="combined"] [data-placement-filter-toggle]').click();
  const placementPopover=page.locator('#skyChartPlacementPopover');
  await page.waitForSelector('#skyChartPlacementPopover.is-portaled:not([hidden])');
  assert.ok(Number(await placementPopover.evaluate(node=>getComputedStyle(node).zIndex))>1200,'Placement popover must render above the floating Relationships panel.');
  const placementAll=placementPopover.locator('[data-placement-scope="all"][data-placement-target="all"][data-placement-choice="all"]');
  const sunAll=placementPopover.locator('[data-placement-scope="placement"][data-placement-target="sun"][data-placement-choice="all"]');
  await placementAll.uncheck();
  await sunAll.check();
  await page.waitForFunction(()=>[...document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row')].some(row=>!row.hidden&&getComputedStyle(row).display!=='none'));
  const placementCount=await visibleRows().count();
  assert.ok(placementCount>0&&placementCount<baseline,'Placement filter must narrow the visible relationship set.');
  assert.equal(await visibleRows().evaluateAll(rows=>rows.every(row=>row.dataset.leftPlacement==='sun'||row.dataset.rightPlacement==='sun')),true,'With only Sun selected, every visible relationship must involve Sun.');
  await placementAll.check();
  await page.keyboard.press('Escape');

  // House filter
  const firstHouse=await visibleRows().first().getAttribute('data-left-house');
  await page.locator('[data-house-filter="combined"] [data-house-filter-toggle]').click();
  const housePopover=page.locator('#skyChartHousePopover');
  await page.waitForSelector('#skyChartHousePopover.is-portaled:not([hidden])');
  assert.ok(Number(await housePopover.evaluate(node=>getComputedStyle(node).zIndex))>1200,'House popover must render above the floating Relationships panel.');
  const houseAll=housePopover.locator('[data-house-scope="all"][data-house-target="all"][data-house-choice="all"]');
  await houseAll.uncheck();
  await housePopover.locator(`[data-house-scope="house"][data-house-target="${firstHouse}"][data-house-choice="all"]`).check();
  await page.waitForTimeout(120);
  const houseCount=await visibleRows().count();
  assert.ok(houseCount>0&&houseCount<baseline,'House filter must narrow the visible relationship set in floating mode.');
  await houseAll.check();
  await page.keyboard.press('Escape');

  // Zodiac filter
  await page.locator('[data-zodiac-summary]').click();
  const zodiacMenu=page.locator('#skyChartZodiacFilterMenu');
  await page.waitForSelector('#skyChartZodiacFilterMenu:not([hidden])');
  assert.ok(Number(await zodiacMenu.evaluate(node=>getComputedStyle(node).zIndex))>1200,'Zodiac popover must render above the floating Relationships panel.');
  const sign=await visibleRows().first().getAttribute('data-left-sign');
  await zodiacMenu.locator('[data-zodiac-none]').click();
  await zodiacMenu.locator(`.sky-chart-zodiac-filter-row input[value="${sign}"]`).click();
  await page.waitForTimeout(120);
  const zodiacCount=await visibleRows().count();
  assert.ok(zodiacCount>0&&zodiacCount<baseline,'Zodiac filter must narrow the visible relationship set.');
  assert.equal(await visibleRows().evaluateAll((rows,sign)=>rows.every(row=>row.dataset.leftSign===sign||row.dataset.rightSign===sign),sign),true,'Every visible relationship must match the selected Zodiac sign.');
  await zodiacMenu.locator('[data-zodiac-all]').click();
  await page.keyboard.press('Escape');

  // Harmonic Window filter
  const harmonic=page.locator('[data-harmonic-window-input]');
  await harmonic.fill('1');
  await page.waitForTimeout(120);
  const harmonicCount=await visibleRows().count();
  assert.ok(harmonicCount<baseline,'A tighter Harmonic Window must narrow the visible relationship set.');
  assert.equal(await visibleRows().evaluateAll(rows=>rows.every(row=>Number(row.dataset.phaseError)<=1+1e-9)),true,'Harmonic Window must hide relationships outside the chosen phase-error window.');
  await harmonic.fill('6');
  await page.waitForTimeout(120);

  await page.screenshot({path:'sky-chart-relationships-float-preview.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('Floating Relationships: hover/click isolation and Aspect, Placement, House, Zodiac, and Harmonic Window filters passed.');
}finally{
  await browser.close();
}
