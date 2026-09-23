import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function placement(name,longitude){
  const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);
  return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0};
}
function sky(){
  const asc=168.38,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,Chiron:74.48,'North Node':40.3,'South Node':220.3,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
  return{name:'Logic fixture',houseSystem:'equal-house',houseCusps:cusps,calcProfile:{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Malden, Massachusetts, United States',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662,houseSystem:'equal-house',houseCusps:cusps},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value)]))};
}

const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.addInitScript(value=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(value));
    localStorage.removeItem('relphiSkyChartB');
    localStorage.setItem('relphiSkyChartLastModeV1','single');
    sessionStorage.removeItem('relphiSkyPlacementLogicV1');
    sessionStorage.removeItem('relphiSkyWhereWhenViewV1');
  },sky());

  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle',timeout:30000});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
  await page.waitForSelector('.sky-foundation-relationship-row[data-relation-index]',{timeout:20000});
  await page.waitForFunction(()=>document.documentElement.dataset.skyPlacementFilterSemantics==='or-and-not');
  await page.locator('[data-placement-filter-toggle]').click();
  await page.waitForSelector('#skyChartPlacementPopover.is-portaled:not([hidden])',{timeout:10000});

  const menu=page.locator('#skyChartPlacementPopover');
  const angles=menu.locator('[data-placement-scope="group"][data-placement-target="chart-angles"][data-placement-choice="all"]');
  const asc=menu.locator('[data-placement-scope="placement"][data-placement-target="asc"][data-placement-choice="all"]');
  assert.equal(await angles.count(),1);
  assert.equal(await angles.getAttribute('data-logic-state'),'neutral');

  await angles.click();
  assert.equal(await angles.getAttribute('data-logic-state'),'or');
  await angles.click();
  assert.equal(await angles.getAttribute('data-logic-state'),'and');
  await angles.click();
  assert.equal(await angles.getAttribute('data-logic-state'),'not');
  assert.equal(await asc.getAttribute('data-logic-state'),'neutral','Category logic must not rewrite child placement states.');

  await page.waitForTimeout(120);
  const visibleAfterNot=await page.locator('.sky-foundation-relationship-row:not(.sky-chart-multiselect-hidden):not(.sky-chart-filter-hidden):not(.sky-chart-orb-hidden):not(.sky-orb-filter-hidden):not([hidden])').evaluateAll(rows=>rows.map(row=>({left:row.dataset.leftPlacement,right:row.dataset.rightPlacement})));
  assert.ok(visibleAfterNot.length>0,'Chart Angles NOT should leave ordinary relationships visible.');
  const angleIds=new Set(['asc','dsc','mc','ic']);
  assert.equal(visibleAfterNot.some(row=>angleIds.has(row.left)||angleIds.has(row.right)),false,'Chart Angles NOT must veto every relationship containing an angle in standalone mode.');

  await angles.click();
  assert.equal(await angles.getAttribute('data-logic-state'),'neutral');

  const planets=menu.locator('[data-placement-scope="group"][data-placement-target="planets"][data-placement-choice="all"]');
  await angles.click(); // OR
  await angles.click(); // AND
  await planets.click(); // OR
  await planets.click(); // AND
  const grouped=await page.evaluate(()=>{
    const api=window.RelphiSkyPlacementLogic;
    const make=(left,right)=>{const row=document.createElement('div');row.dataset.relationshipMode='A-A';row.dataset.leftPlacement=left;row.dataset.rightPlacement=right;return api.relationshipMatches(row)};
    return{anglePlanet:make('asc','mars'),angleLuminary:make('asc','sun'),planetPair:make('mars','venus')};
  });
  assert.equal(grouped.anglePlanet,true,'Chart Angles AND + Planets AND must match an angle–planet relationship.');
  assert.equal(grouped.angleLuminary,false,'Chart Angles AND + Planets AND must reject an angle–luminary relationship.');
  assert.equal(grouped.planetPair,false,'Chart Angles AND + Planets AND must reject a planet–planet relationship.');

  await menu.locator('[data-placement-logic-clear]').click();
  const sun=menu.locator('[data-placement-scope="placement"][data-placement-target="sun"][data-placement-choice="all"]');
  const moon=menu.locator('[data-placement-scope="placement"][data-placement-target="moon"][data-placement-choice="all"]');
  await sun.click();await sun.click(); // AND
  await moon.click();await moon.click(); // AND
  const exact=await page.evaluate(()=>{
    const api=window.RelphiSkyPlacementLogic;
    const make=(left,right)=>{const row=document.createElement('div');row.dataset.relationshipMode='A-A';row.dataset.leftPlacement=left;row.dataset.rightPlacement=right;return api.relationshipMatches(row)};
    return{sunMoon:make('sun','moon'),sunMars:make('sun','mars')};
  });
  assert.equal(exact.sunMoon,true,'Sun AND + Moon AND must match Sun–Moon.');
  assert.equal(exact.sunMars,false,'Sun AND + Moon AND must reject Sun–Mars.');

  await menu.locator('[data-placement-logic-clear]').click();
  const mercury=menu.locator('[data-placement-scope="placement"][data-placement-target="mercury"][data-placement-choice="all"]');
  const venus=menu.locator('[data-placement-scope="placement"][data-placement-target="venus"][data-placement-choice="all"]');
  await mercury.click(); // OR
  await venus.click(); // OR
  await angles.click();await angles.click();await angles.click(); // NOT
  const mixed=await page.evaluate(()=>{
    const api=window.RelphiSkyPlacementLogic;
    const make=(left,right)=>{const row=document.createElement('div');row.dataset.relationshipMode='A-A';row.dataset.leftPlacement=left;row.dataset.rightPlacement=right;return api.relationshipMatches(row)};
    return{
      mercuryMars:make('mercury','mars'),
      venusSaturn:make('venus','saturn'),
      mercuryAsc:make('mercury','asc'),
      moonSaturn:make('moon','saturn')
    };
  });
  assert.equal(mixed.mercuryMars,true);
  assert.equal(mixed.venusSaturn,true);
  assert.equal(mixed.mercuryAsc,false,'NOT must veto even when OR is satisfied.');
  assert.equal(mixed.moonSaturn,false,'At least one OR rule must match when OR rules exist.');

  const summary=(await page.locator('[data-placement-filter-summary]').textContent())?.trim()||'';
  assert.match(summary,/logic rules$/);
  assert.deepEqual(errors,[]);
  console.log('Placement blank/OR/AND/NOT logic regression passed.');
}finally{
  await browser.close();
}
