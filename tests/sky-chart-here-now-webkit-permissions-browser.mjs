import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import path from 'node:path';

// Model a saved Here location in both slots; opening it should be read-only.
// iPhone Chrome uses WebKit, so run both engines with narrow iPhone viewport.
function savedSky(name){
  const names=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','Ascendant','Midheaven'];
  return{name,metadata:{whereWhenSource:'current-location'},calcProfile:{
    dateTime:'2026-11-13T17:47',instant:'2026-11-14T00:47:00.000Z',
    location:'Salt Lake City, Utah, United States',latitude:40.7608,longitude:-111.891,
    timeZone:'America/Denver',houseSystem:'porphyry',
    houseCusps:Array.from({length:12},(_,i)=>(168.38+i*30)%360)
  },placements:Object.fromEntries(names.map((name,index)=>[name,{name,longitude:(index*29+7)%360}]))};
}
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Denver'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    window.__geoCalls=0;
    window.__geoMode='denied';
    Object.defineProperty(navigator,'geolocation',{configurable:true,value:{
      getCurrentPosition(success,error){
        window.__geoCalls++;
        if(window.__geoMode==='denied')return error({code:1,message:'Location access denied'});
        if(window.__geoMode==='stalled')return;
        success({coords:{latitude:40.7608,longitude:-111.891,accuracy:45},timestamp:Date.now()});
      }
    }});
  },{a:savedSky('Saved A'),b:savedSky('Saved B')});
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',r=>r.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',r=>r.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.route('https://api.bigdatacloud.net/data/reverse-geocode-client**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({locality:'Salt Lake City',principalSubdivision:'Utah',countryName:'United States'})}));
  await page.route('https://api.open-meteo.com/v1/forecast**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({timezone:'America/Denver'})}));
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:35000});
  for(const slot of ['A','B']){
    const tab=page.locator('#skyFoundation'+slot+' [data-sky-drawer-tab="where"]');
    await tab.scrollIntoViewIfNeeded();await tab.click();
    const form=page.locator('#skyFoundation'+slot+' .sky-where-when-editor');
    await form.waitFor({state:'visible'});
    assert.equal(await form.locator('[data-ww-field="here"]').isChecked(),true,'Saved Here tag retained');
    assert.equal(await page.evaluate(()=>window.__geoCalls),slot==='A'?0:2,'Opening saved Here sky must not call geolocation');
    const oneClick=form.locator('[data-ww-action="here-and-now"]');
    await oneClick.click();
    await page.waitForFunction(slot=>{
      const f=document.querySelector('#skyFoundation'+slot+' .sky-where-when-editor');
      return f?.querySelector('.sky-where-when-status')?.textContent?.includes('permission was denied')&&
       !f.querySelector('[data-ww-action="here-and-now"]').disabled;
    },slot,{timeout:12000});
    assert.equal(await page.evaluate(()=>window.__geoCalls),slot==='A'?1:3,'One explicit click invokes one geolocation attempt');
    assert.equal(await form.locator('[data-copy-where-when]').count(),1);
    assert.equal(await oneClick.isEnabled(),true,'Denied permission must not lock editor');
    await page.evaluate(()=>window.__geoMode='working');
    await oneClick.click();
    await page.waitForFunction(slot=>JSON.parse(localStorage.getItem('relphiSkyChart'+slot)||'null')?.metadata?.capturedNowAt,slot,{timeout:15000});
    assert.equal(await page.evaluate(()=>window.__geoCalls),slot==='A'?2:4);
    console.log('PASS saved Here location, denied and successful retry on '+engine.name()+' '+slot);
    if(slot==='A')await page.evaluate(()=>{
      window.__geoMode='denied';window.RelphiSkyStartupMode.writeMode('comparison');window.RelphiSkyStartupMode.syncRoot();
    });
  }
  assert.deepEqual(errors.filter(msg=>/ReferenceError|TypeError|SyntaxError/.test(msg)),[]);
  await context.close();
 }finally{await browser.close()}
}
