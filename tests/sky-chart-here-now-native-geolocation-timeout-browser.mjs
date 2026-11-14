import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

// Regression for browsers that never invoke either native geolocation callback.
// A native timeout option is insufficient when the API itself hangs.
function seedSky(name,shift){
  const longitudes={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Midheaven:76.28};
  return{name,calcProfile:{dateTime:'2026-11-01T12:00',instant:'2026-11-01T18:00:00.000Z',location:'Salt Lake City, Utah, United States',latitude:40.7608,longitude:-111.891,timeZone:'America/Denver',houseSystem:'porphyry',houseCusps:Array.from({length:12},(_,i)=>(168.38+shift+i*30)%360)},placements:Object.fromEntries(Object.entries(longitudes).map(([k,v])=>[k,{name:k,longitude:(v+shift)%360}]))};
}
const browser=await chromium.launch({headless:true});
try{
 for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport,permissions:['geolocation'],geolocation:{latitude:40.7608,longitude:-111.891},timezoneId:'America/Denver'});
  const page=await context.newPage(),errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    window.__testGeolocationMode='stalled';
    Object.defineProperty(navigator,'geolocation',{configurable:true,value:{
      getCurrentPosition(success,error,options){
        window.__testGeoCalls=(window.__testGeoCalls||0)+1;
        if(window.__testGeolocationMode==='stalled')return;
        if(window.__testGeolocationMode==='denied'){error({code:1,message:'Denied'});return}
        success({coords:{latitude:40.7608,longitude:-111.891,accuracy:40},timestamp:Date.now()});
      }
    }});
  },{a:seedSky('Seed A',0),b:seedSky('Seed B',9)});
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.route('https://api.bigdatacloud.net/data/reverse-geocode-client**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({locality:'Salt Lake City',principalSubdivision:'Utah',countryName:'United States'})}));
  await page.route('https://api.open-meteo.com/v1/forecast**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({timezone:'America/Denver'})}));
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
  for(const slot of ['A','B']){
    await page.locator('#skyFoundation'+slot+' [data-sky-drawer-tab="where"]').click();
    const form=page.locator('#skyFoundation'+slot+' .sky-where-when-editor');
    await form.waitFor({state:'visible'});
    const oneClick=form.locator('[data-ww-action="here-and-now"]');
    await oneClick.click();
    await page.waitForFunction(slot=>{
      const form=document.querySelector('#skyFoundation'+slot+' .sky-where-when-editor');
      const status=form?.querySelector('.sky-where-when-status');
      return !!form&&!form.querySelector('[data-ww-action="here-and-now"]').disabled&&
        !!status?.textContent?.includes('Current location took too long');
    },slot,{timeout:10000});
    const errorText=await form.locator('.sky-where-when-status').textContent();
    assert.match(errorText,/Current location took too long/);
    assert.equal(await oneClick.isEnabled(),true,'Here and Now must recover from missing native callback');
    assert.equal(await form.locator('[data-ww-action="search-location"]').isEnabled(),true,'Editor usable after timeout');
    assert.equal(await form.locator('[data-copy-where-when]').count(),1,'Copy button must remain present');
    assert.equal(await page.evaluate(()=>window.__testGeoCalls),slot==='A'?1:3,'Native geolocation must not be called repeatedly by duplicate owners');
    // Retry is a fresh user gesture, not an automatic background loop.
    await page.evaluate(()=>window.__testGeolocationMode='working');
    const elapsedStart=Date.now();
    await oneClick.click();
    await page.waitForFunction(slot=>JSON.parse(localStorage.getItem('relphiSkyChart'+slot)||'null')?.metadata?.capturedNowAt,slot,{timeout:12000});
    assert.ok(Date.now()-elapsedStart<4500,'Retry must be fast with responsive native geolocation');
    console.log('PASS stalled native geolocation recovery and retry '+slot+' '+viewport.width);
    if(slot==='A')await page.evaluate(()=>{
      window.__testGeolocationMode='stalled';
      window.RelphiSkyStartupMode.writeMode('comparison');
      window.RelphiSkyStartupMode.syncRoot();
    });
  }
  assert.deepEqual(errors.filter(x=>/ReferenceError|TypeError|SyntaxError/.test(x)),[]);
  await context.close();
 }
}finally{await browser.close()}
