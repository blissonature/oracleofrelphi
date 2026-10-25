import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function placement(name,longitude){
  const value=((longitude%360)+360)%360,within=value%30;
  return {name,longitude:value,sign:SIGNS[Math.floor(value/30)],
    degree:Math.floor(within),minute:Math.floor((within%1)*60),second:0};
}
function sample(name,shift){
  const asc=(168.38+shift)%360,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
  const positions={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,
    Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,
    Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,
    Chiron:74.48,'North Node':40.3,'South Node':220.3,
    Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
  return {name,houseSystem:'equal-house',houseCusps:cusps,
    calcProfile:{dateTime:'2026-10-24T20:00',instant:'2026-10-25T02:00:00.000Z',
      location:'Salt Lake City, Utah',timeZone:'America/Denver',
      latitude:40.7608,longitude:-111.891,houseSystem:'equal-house',houseCusps:cusps},
    placements:Object.fromEntries(Object.entries(positions).map(([id,value])=>[id,placement(id,value+shift)]))};
}

const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:1280,height:960},timezoneId:'America/Denver'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>
    route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>
    route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.route('https://nominatim.openstreetmap.org/**',route=>
    route.fulfill({status:200,contentType:'application/json',body:'[]'}));
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    window.__copySuccessCount=0;
    Object.defineProperty(window,'ClipboardItem',{configurable:true,value:class ClipboardItem{
      constructor(entries){this.entries=entries}
    }});
    Object.defineProperty(navigator,'clipboard',{configurable:true,
      value:{write:async items=>{if(!items.length)throw new Error('No image to copy');window.__copySuccessCount++}}});
    // Export a tiny valid fixture PNG; this test covers clipboard UI lifecycle,
    // not PNG pixels or export image rendering fidelity.
    window.htmlToImage={toPng:async()=> 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP+B6zszwAAAABJRU5ErkJggg=='};
  },{a:sample('Marisa',0),b:sample('Comparison',29.27)});

  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
  await page.waitForSelector('#skyChartWheelCopy',{timeout:30000});
  await page.waitForSelector('#skyFoundationWheelMount > svg.sky-foundation-wheel',{timeout:30000});
  await page.clock.install();
  const status=page.locator('#skyChartExportStatus');
  const button=page.locator('#skyChartWheelCopy');
  const success='Wheel copied to clipboard.';
  const copy=async()=> {
    await button.click();
    await page.waitForFunction(expected=>
      document.getElementById('skyChartExportStatus')?.textContent===expected,
      success,{timeout:30000});
    assert.equal(await status.getAttribute('data-busy'),'false');
  };

  await copy();
  assert.equal(await page.evaluate(()=>window.__copySuccessCount),1,'Copy must succeed before a confirmation appears.');
  await page.clock.runFor(2900);
  assert.equal(await status.textContent(),success,'Confirmation should remain visible before three seconds.');
  await page.clock.runFor(150);
  assert.equal(await status.textContent(),'','Success confirmation should disappear after three seconds.');

  await copy();
  await page.clock.runFor(1400);
  await copy();
  await page.clock.runFor(1700);
  assert.equal(await status.textContent(),success,'An old timer must not erase a new confirmation.');
  await page.clock.runFor(1400);
  assert.equal(await status.textContent(),'','Most recent confirmation must dismiss three seconds after its own copy.');
  assert.equal(await page.evaluate(()=>window.__copySuccessCount),3,'Three successful clipboard writes expected.');
  assert.deepEqual(errors,[],'Copy and dismissal must not create browser page errors.');
  console.log('PASS: wheel copy confirmation clears after three seconds; repeated copies restart the timer.');
}finally{await browser.close()}
