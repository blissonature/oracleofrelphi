import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';

const positions={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Midheaven:76.28};
const fixture=(name,offset=0)=>({
  name,placements:Object.fromEntries(Object.entries(positions).map(([key,val])=>[key,{name:key,longitude:(val+offset)%360}])),
  calcProfile:{dateTime:'2026-11-14T12:00',instant:'2026-11-14T19:00:00Z',
    location:'Salt Lake City, Utah, United States',locationQuery:'Salt Lake City',
    latitude:40.7608,longitude:-111.891,timeZone:'America/Denver',houseSystem:'porphyry'}
});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const photon={features:[
  {type:'Feature',geometry:{type:'Point',coordinates:[-74.1,40.1]},
    properties:{housenumber:'1500',street:'Pennsylvania Avenue',city:'Other City',country:'United States'}},
  {type:'Feature',geometry:{type:'Point',coordinates:[-77.03655,38.89768]},
    properties:{housenumber:'1600',street:'Pennsylvania Avenue NW',city:'Washington',
      state:'District of Columbia',country:'United States',name:'White House'}}
],type:'FeatureCollection'};
const browser=await chromium.launch({headless:true});
try{
 for(const width of [1280,390]){
  const context=await browser.newContext({viewport:{width,height:850},isMobile:width===390,hasTouch:width===390});
  const page=await context.newPage(),errors=[];
  let photonMode='ok',photonCalls=0,zoneCalls=0,cityCalls=0;
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({
    path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({
    path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.route('https://photon.komoot.io/api/**',async route=>{
    photonCalls++;
    if(photonMode==='fail')return route.abort('failed');
    if(photonMode==='slow'){
      await sleep(4500);
      try{await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(photon)})}catch{}
      return;
    }
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(photon)});
  });
  await page.route('https://geocoding-api.open-meteo.com/v1/search**',route=>{
    cityCalls++;
    return route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({results:[{name:'Malden',admin1:'Massachusetts',country:'United States',
        latitude:42.4251,longitude:-71.0662,timezone:'America/New_York'}]})});
  });
  await page.route('https://api.open-meteo.com/v1/forecast**',route=>{
    zoneCalls++;
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({timezone:'America/New_York'})});
  });
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
  },{a:fixture('A'),b:fixture('B',7)});
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
  await page.locator('#skyFoundationRoot[aria-busy="false"]').waitFor({timeout:30000});
  const prompt=page.locator('#skyWhereWhenNamePrompt:not([hidden])');
  if(await prompt.count())await prompt.locator('[data-sky-name-cancel]').click();
  assert.equal(await page.evaluate(()=>window.__relphiSkyLocationSearchV2===true),false,
    'No parallel location-search owner is installed');
  for(const slot of ['A','B']){
    const panel=page.locator('#skyFoundation'+slot);
    await panel.locator('[data-sky-drawer-tab="where"]').click();
    const editor=panel.locator('.sky-where-when-editor');
    await editor.waitFor();
    const input=editor.locator('[data-ww-field="location-query"]'),
      search=editor.locator('[data-ww-action="search-location"]'),
      results=editor.locator('.sky-location-result');
    await input.fill('1600 pennsylvania ave');
    const before=Date.now(),priorCalls=photonCalls,priorZones=zoneCalls;
    await search.click();
    await results.first().waitFor({timeout:2000});
    assert.ok(Date.now()-before<2000,'Address candidates must appear promptly');
    assert.equal(photonCalls-priorCalls,1,'Search performs exactly one forward lookup');
    assert.equal(zoneCalls-priorZones,0,'No time-zone lookups before selection');
    assert.equal(await results.count(),1,'Approximate house-number matches must be excluded');
    assert.match(await results.first().textContent(),/1600 Pennsylvania Avenue NW, Washington/);
    assert.equal(await editor.locator('.sky-location-results').getAttribute('aria-busy'),null);
    await results.first().click();
    await editor.locator('.sky-location-confirmation:not([hidden])').waitFor();
    assert.equal(zoneCalls-priorZones,1,'Only selected address resolves its time zone');
    assert.match(await editor.locator('.sky-location-confirmation').textContent(),/1600 pennsylvania ave/);
    assert.equal(await editor.locator('[data-ww-field="timezone"]').inputValue(),'America/New_York');
    await input.fill('Malden');
    const priorCities=cityCalls,priorZoneCount=zoneCalls;
    await search.click();
    await results.first().waitFor();
    assert.match(await results.first().textContent(),/Malden, Massachusetts, United States/);
    assert.equal(cityCalls-priorCities,1,'City searches retain the original canonical provider');
    await results.first().click();
    assert.equal(zoneCalls-priorZoneCount,0,'Canonical city time zone is reused without another request');
    console.log('PASS exact address and city search',slot,width);
  }
  const a=page.locator('#skyFoundationA .sky-where-when-editor');
  const input=a.locator('[data-ww-field="location-query"]'),search=a.locator('[data-ww-action="search-location"]');
  photonMode='fail';
  await input.fill('1600 pennsylvania ave');
  const before=Date.now();
  await search.click();
  await page.waitForFunction(()=>document.querySelector('#skyFoundationA .sky-where-when-status')?.textContent?.includes('unavailable'),null,{timeout:2000});
  assert.ok(Date.now()-before<2000,'Failure must be surfaced promptly');
  assert.equal(await a.locator('.sky-location-results').getAttribute('aria-busy'),null,'Spinner clears on failure');
  assert.equal(await search.isDisabled(),false,'Search is reusable after failure');
  photonMode='slow';
  await search.click();
  const timeoutStarted=Date.now();
  await page.waitForFunction(()=>document.querySelector('#skyFoundationA .sky-where-when-status')?.textContent?.includes('timed out'),null,{timeout:4700});
  assert.ok(Date.now()-timeoutStarted<4200,'Hung provider must have bounded waiting');
  assert.equal(await a.locator('.sky-location-results').getAttribute('aria-busy'),null,'Spinner clears on timeout');
  photonMode='ok';
  await search.click();
  await a.locator('.sky-location-result').first().waitFor({timeout:2000});
  await sleep(1600);
  assert.equal(await a.locator('.sky-location-result').count(),1,'Late stale response cannot replace current candidates');
  assert.deepEqual(errors,[],'Unexpected browser errors');
  console.log('PASS bounded failure, timeout, recovery, and stale response',width);
  await context.close();
 }
}finally{await browser.close()}
