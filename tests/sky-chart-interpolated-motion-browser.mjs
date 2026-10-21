import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';

const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Denver'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.Astronomy&&window.RelphiSkyInterpolatedMotion&&document.querySelector('[data-motion-play]')),{timeout:25000});
  const saved=await page.evaluate(()=>{
    const at='2026-10-21T18:00:00.000Z',instant=new Date(at),A=window.Astronomy;
    const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
    function position(name,lon){
      const x=((lon%360)+360)%360,within=x%30;
      return{name,longitude:x,sign:signs[Math.floor(x/30)],degree:Math.floor(within),minute:Math.floor((within%1)*60),second:0};
    }
    const placements={};
    for(const name of ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto']){
      const lon=name==='Moon'?A.EclipticGeoMoon(instant).lon:A.Ecliptic(A.GeoVector(name,instant,true)).elon;
      placements[name]=position(name,lon);
    }
    const cusps=Array.from({length:12},(_,i)=>i*30);
    const data={name:'Motion test sky',placements,houseCusps:cusps,calcProfile:{instant:at,dateTime:'2026-10-21T12:00',timeZone:'America/Denver',location:'Salt Lake City, Utah',timeUnknown:false,source:'where-when-v3',houseCusps:cusps,houseSystem:'equal-house'}};
    const serialized=JSON.stringify(data);
    localStorage.setItem('relphiSkyChartA',serialized);
    localStorage.removeItem('relphiSkyChartB');
    window.dispatchEvent(new StorageEvent('storage',{key:'relphiSkyChartA',newValue:serialized,storageArea:localStorage}));
    return serialized;
  });
  await page.waitForFunction(()=>{
    const moon=document.querySelector('#skyFoundationWheelMount [data-layer="placements"] > g[data-sky="A"][data-placement="moon"]');
    return Boolean(moon&&document.querySelector('[data-motion-play]:not(:disabled)'));
  },null,{timeout:30000});
  const beforePlayback=await page.evaluate(()=>localStorage.getItem('relphiSkyChartA'));
  const original=await page.locator('#skyFoundationWheelMount [data-layer="placements"] > g[data-sky="A"][data-placement="moon"]').getAttribute('transform');
  await page.locator('[data-motion-play]').click();
  await page.waitForFunction(()=>Number(document.querySelector('[data-motion-slider]').value)>0.4,null,{timeout:10000});
  const first=await page.locator('[data-layer="motion-preview"] [data-motion-body="moon"]').getAttribute('transform');
  await page.waitForTimeout(450);
  const next=await page.locator('[data-layer="motion-preview"] [data-motion-body="moon"]').getAttribute('transform');
  assert.notEqual(first,next,'The Moon should advance visibly across the wheel between browser frames.');
  assert.equal(await page.locator('[data-motion-position]').isVisible(),true);
  assert.match(await page.locator('[data-motion-position]').innerText(),/Moon/);
  await page.locator('[data-motion-play]').click();
  assert.equal(await page.locator('[data-motion-play]').innerText(),'Play');
  const storedAfter=await page.evaluate(()=>localStorage.getItem('relphiSkyChartA'));
  assert.equal(storedAfter,beforePlayback,'Playback must not rewrite Sky A.');
  await page.locator('[data-motion-reset]').click();
  assert.equal(await page.locator('[data-motion-slider]').inputValue(),'0');
  assert.equal(await page.locator('[data-layer="motion-preview"]').count(),0,'Reset removes ghost markers.');
  assert.equal(await page.locator('#skyFoundationWheelMount [data-layer="placements"] > g[data-sky="A"][data-placement="moon"]').getAttribute('transform'),original,'Reference placement remains unmodified.');
  assert.deepEqual(errors.filter(e=>/InterpolatedMotion|skyMotion|sky-chart-interpolated-motion/i.test(e)),[]);
  console.log('Interpolated Moon motion, controls, reset, and storage isolation verified in mobile Chromium.');
}finally{
  await browser.close();
}
