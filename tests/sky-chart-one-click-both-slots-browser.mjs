import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function placement(name,longitude){const value=((longitude%360)+360)%360,within=value%30;return{name,longitude:value,sign:SIGNS[Math.floor(value/30)],degree:Math.floor(within),minute:Math.floor((within%1)*60),second:0}}
function sky(name,shift){
  const positions={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Midheaven:76.28};
  const cusps=Array.from({length:12},(_,i)=>(168.38+shift+i*30)%360);
  return{name,placements:Object.fromEntries(Object.entries(positions).map(([k,v])=>[k,placement(k,v+shift)])),houseCusps:cusps,calcProfile:{dateTime:'2026-11-01T12:00',instant:'2026-11-01T18:00:00Z',location:'Salt Lake City, Utah, United States',latitude:40.7608,longitude:-111.891,timeZone:'America/Denver',houseSystem:'equal-house',houseCusps:cusps}};
}
const initialA=sky('A seed',0),initialB=sky('B seed',7);
const browser=await chromium.launch({headless:true});
try{
  for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
    const context=await browser.newContext({viewport,permissions:['geolocation'],geolocation:{latitude:40.7608,longitude:-111.891},timezoneId:'America/Denver'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',r=>r.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
    await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',r=>r.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
    await page.route('https://api.bigdatacloud.net/data/reverse-geocode-client**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({locality:'Salt Lake City',principalSubdivision:'Utah',countryName:'United States'})}));
    await page.route('https://api.open-meteo.com/v1/forecast**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({timezone:'America/Denver'})}));
    await page.addInitScript(({a,b})=>{
      localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
      localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
      localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    },{a:initialA,b:initialB});
    await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
    await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
    for(const slot of ['A','B']){
      const namePrompt=page.locator('#skyWhereWhenNamePrompt:not([hidden])');
      if(await namePrompt.count())await namePrompt.locator('[data-sky-name-cancel]').click();
      await page.locator('#skyFoundation'+slot+' [data-sky-drawer-tab="where"]').click();
      const form=page.locator('#skyFoundation'+slot+' .sky-where-when-editor');
      await form.waitFor();
      const action=form.locator('[data-ww-action="here-and-now"]');
      assert.equal(await action.count(),1);
      const reverseUrl='https://api.bigdatacloud.net/data/reverse-geocode-client**';
      const stallReverse=()=>new Promise(()=>{});
      // Simulate an unavailable optional address service while the time-zone service succeeds.
      if(viewport.width===1280&&slot==='A')await page.route(reverseUrl,stallReverse);
      const zoneUrl='https://api.open-meteo.com/v1/forecast**';
      const failZone=route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:true,reason:'Service unavailable'})});
      // The reported live failure: coordinate time-zone provider does not resolve.
      // Both slots and both viewports must still calculate with an explicitly marked browser fallback.
      await page.route(zoneUrl,failZone);
      const stallZone=()=>new Promise(()=>{});
      // Network lookup that never responds must not delay the chart.
      if(viewport.width===390&&slot==='B')await page.route(zoneUrl,stallZone);
      const startedAt=Date.now();
      await action.click();
      await page.waitForFunction(slot=>{
        const sky=JSON.parse(localStorage.getItem('relphiSkyChart'+slot)||'null');
        return sky?.metadata?.capturedNowAt&&sky?.calcProfile?.timeZone==='America/Denver'&&sky?.metadata?.whereWhenSource==='current-location';
      },slot,{timeout:30000});
      const elapsed=Date.now()-startedAt;
      assert.ok(elapsed<4500,'Here and Now should calculate promptly despite broken geocoding: '+elapsed+'ms for '+slot+' '+viewport.width);
      if(viewport.width===1280&&slot==='A')await page.unroute(reverseUrl,stallReverse);
      if(viewport.width===390&&slot==='B')await page.unroute(zoneUrl,stallZone);
      const actual=await page.evaluate(slot=>JSON.parse(localStorage.getItem('relphiSkyChart'+slot)),slot);
      assert.equal(actual.calcProfile.timeZoneSource,'browser-fallback','Browser timezone fallback must be recorded');
      assert.ok(actual.placements.Ascendant&&actual.placements.Midheaven,slot+' must calculate known-time angles');
      assert.ok(Date.now()-Date.parse(actual.calcProfile.instant)<120000,slot+' must capture present instant');
      console.log('PASS fast Here and Now '+slot+' '+viewport.width+' '+elapsed+'ms');
    }
    // Permission dialogs may leave native getCurrentPosition pending without invoking
    // either callback. Confirm the authoritative controller releases the busy UI.
    await page.locator('#skyFoundationA [data-sky-drawer-tab="where"]').click();
    const retryForm=page.locator('#skyFoundationA .sky-where-when-editor');
    await retryForm.waitFor();
    await page.waitForTimeout(250);
    await page.evaluate(()=>{
      Object.defineProperty(navigator.geolocation,'getCurrentPosition',{
        configurable:true,value:()=>{}
      });
    });
    const retry=retryForm.locator('[data-ww-action="here-and-now"]');
    await retry.click();
    await page.waitForFunction(()=>{
      const form=document.querySelector('#skyFoundationA .sky-where-when-editor');
      return (form?.querySelector('.sky-where-when-status')?.textContent||'').includes('did not provide a location');
    },null,{timeout:12000});
    assert.equal(await retry.isDisabled(),false,'A stalled geolocation request must release the action');
    await page.evaluate(()=>delete navigator.geolocation.getCurrentPosition);
    const capturedBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartA')||'null')?.metadata?.capturedNowAt||'');
    await retry.click();
    await page.waitForFunction(previous=>{
      const sky=JSON.parse(localStorage.getItem('relphiSkyChartA')||'null');
      return sky?.metadata?.capturedNowAt&&sky.metadata.capturedNowAt!==previous&&
        Date.now()-Date.parse(sky.calcProfile.instant)<120000;
    },capturedBefore,{timeout:30000});
    console.log('PASS stalled permission deadline and retry '+viewport.width);
    assert.ok(!errors.some(e=>/Uncaught|TypeError|ReferenceError/.test(e)),errors.join('\n'));
    await context.close();
  }
} finally {await browser.close()}
