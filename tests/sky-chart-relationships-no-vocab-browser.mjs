import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function placement(name,longitude){
  const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);
  return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0};
}
function sample(name,offset){
  const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,index)=>(asc+index*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:196.5,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,'North Node':40.3,'South Node':220.3,Chiron:74.48,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
  return{name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Malden, Massachusetts, United States',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))};
}
const skyA=sample('Sky A',0),skyB=sample('Sky B',29.27);
const browser=await chromium.launch({headless:true,channel:'chrome'});
const context=await browser.newContext({viewport:{width:900,height:900},timezoneId:'America/Denver'});
const page=await context.newPage();
page.setDefaultTimeout(15000);
const errors=[];
page.on('pageerror',error=>errors.push(error.message));

await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.route('https://nominatim.openstreetmap.org/**',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
await page.route('https://api.open-meteo.com/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({timezone:'America/Denver',current:{temperature_2m:20}})}));

await page.addInitScript(({a,b})=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
  localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
  localStorage.removeItem('relphiSkyVocabDisplayV1');
  localStorage.removeItem('relphiSkyVocabFilterV1');
  sessionStorage.removeItem('relphiSkyVocabViewV1');
  sessionStorage.removeItem('relphiSkyPlacementLogicV1');
  sessionStorage.removeItem('relphiSkyVocabGroupOpenV1');
},{a:skyA,b:skyB});


await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
await page.waitForSelector('#skyFoundationRelationships .sky-foundation-relationships-heading>h2');
const verify=async(width)=>{
  await page.setViewportSize({width,height:900});
  await page.waitForTimeout(180);
  assert.equal(await page.locator('#skyFoundationRelationships .sky-foundation-relationships-heading>h2').textContent(),'Relationships');
  assert.equal(await page.locator('[data-relationship-vocab-tabs],#skyRelationshipVocabPanel').count(),0,'Unauthorized Relationship Vocab remains absent');
  assert.equal(await page.locator('#skyFoundationRelationships .sky-relationship-sort-select').count(),1,'Relationship sort is preserved');
  assert.equal(await page.locator('#skyFoundationRelationships .sky-relationship-limit-control').count(),1,'Relationship Max is preserved');
  assert.equal(await page.locator('#skyFoundationRelationships .sky-relationship-copy-button').count(),1,'Relationship Copy is preserved');
  assert.equal(await page.locator('#skyChartRelationshipsExport').count(),1,'Relationship Download is preserved');
  for(const slot of ['A','B']){
    const tab=page.locator('#skyFoundation'+slot+' [data-sky-vocab-view-button="vocab"]');
    assert.equal(await tab.count(),1,'Original '+slot+' Vocab tab is preserved');
    await tab.click();
    await page.waitForFunction(slot=>document.querySelector('#skyFoundation'+slot+' [data-sky-vocab-panel="'+slot+'"]')?.hidden===false,slot);
    assert.equal(await page.locator('#skyFoundationRelationships .sky-foundation-relationships-heading>h2').isVisible(),true,'Relationship heading stays visible after placement Vocab selection');
    assert.equal(await page.locator('[data-relationship-vocab-tabs],#skyRelationshipVocabPanel').count(),0,'Placement Vocab cannot recreate unauthorized Relationship Vocab');
  }
  await page.screenshot({path:'relationships-no-vocab-'+width+'.png',fullPage:true});
};
await verify(1280);
await verify(390);
assert.deepEqual(errors,[],'Relationships removal must not introduce browser page errors');
await browser.close();
console.log('PASS: Relationships retains heading, sort, max, copy, download; no Vocab peer tab; both placement Vocab tabs work on desktop and mobile.');
