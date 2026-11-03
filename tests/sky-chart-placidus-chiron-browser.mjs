import assert from 'node:assert/strict';
import path from 'node:path';
import {chromium} from 'playwright';

const natal={
 name:'Natal Placidus',
 placements:{
  Sun:{name:'Sun',longitude:195},Moon:{name:'Moon',longitude:118+25/60},
  Mercury:{name:'Mercury',longitude:206+10/60},
  Jupiter:{name:'Jupiter',longitude:307+9/60},Saturn:{name:'Saturn',longitude:235+34/60},
  Ascendant:{name:'Ascendant',longitude:168.383341031},
  Midheaven:{name:'Midheaven',longitude:76.287724834}
 },
 // Intentionally corrupted previous cusp values; startup must repair them.
 houseCusps:Array.from({length:12},(_,i)=>(168.383341031+i*30)%360),
 calcProfile:{
  instant:'1985-10-08T08:37:00.000Z',dateTime:'1985-10-08T04:37:00',
  latitude:42.427,longitude:-71.067,timeZone:'America/New_York',
  houseSystem:'placidus',houseCusps:Array.from({length:12},(_,i)=>(168.383341031+i*30)%360)
 }
};
const transit={
 name:'Transiting',placements:{
  Sun:{name:'Sun',longitude:220.78},
  Chiron:{name:'Chiron',longitude:27.9667,retrograde:true,source:'provided'},
  Ascendant:{name:'Ascendant',longitude:115.67},
  Midheaven:{name:'Midheaven',longitude:9.07}
 },
 calcProfile:{instant:'2026-11-03T05:10:00.000Z',dateTime:'2026-11-02T22:10:00',latitude:40.76,longitude:-111.89,timeZone:'America/Denver',houseSystem:'placidus'}
};
const browser=await chromium.launch({headless:true});
const results=[];
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport,acceptDownloads:true});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',r=>r.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',r=>r.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.addInitScript(({a,b})=>{
   localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
   localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
   localStorage.setItem('relphiSkySharedHouseSystemV1','placidus');
   localStorage.setItem('relphiSkyChartLastModeV1','comparison');
  },{a:natal,b:transit});
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
  await page.waitForFunction(()=>{
   const p=JSON.parse(localStorage.getItem('relphiSkyChartA')||'null');
   return !!p?.placements?.Chiron &&
     Math.abs(p.calcProfile.houseCusps[1]-193.01)<0.2 &&
     !!document.querySelector('#skyFoundationA .sky-foundation-row[data-placement="chiron"]');
  },null,{timeout:30000});
  const state=await page.evaluate(()=>{
   const a=JSON.parse(localStorage.getItem('relphiSkyChartA'));
   const b=JSON.parse(localStorage.getItem('relphiSkyChartB'));
   const sky=document.getElementById('skyFoundationA');
   const row=id=>sky.querySelector('.sky-foundation-row[data-placement="'+id+'"]');
   return {
    cusps:a.calcProfile.houseCusps,
    houses:Object.fromEntries(['sun','moon','mercury','jupiter','saturn','chiron'].map(id=>[id,row(id)?.dataset.house])),
    chiron:a.placements.Chiron,bChiron:b.placements.Chiron,
    chironVisible:!!row('chiron'),chironRx:!!row('chiron')?.querySelector('.sky-placement-rx'),
    wheel:!!document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel')
   }
  });
  assert.ok(state.wheel,'wheel must render');
  assert.ok(state.chironVisible,'missing natal Chiron must be visible in Sky A');
  assert.equal(state.chironRx,true,'restored natal Chiron should display Rx');
  assert.equal(state.bChiron.source,'provided','transit Chiron is preserved unchanged');
  assert.equal(state.houses.sun,'2');assert.equal(state.houses.moon,'11');
  assert.equal(state.houses.mercury,'2');assert.equal(state.houses.jupiter,'5');
  assert.equal(state.houses.saturn,'3');assert.equal(state.houses.chiron,'9');
  assert.ok(Math.abs(state.cusps[1]-193.01)<0.2);
  assert.equal(errors.length,0,'browser errors: '+errors.join('; '));
  results.push({viewport,house:state.houses,chironRx:state.chironRx});
  await page.close();
 }
 console.log('Placidus and Chiron desktop/mobile verified:',JSON.stringify(results));
}finally{await browser.close()}
