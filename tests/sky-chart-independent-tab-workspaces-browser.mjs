import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import path from 'node:path';

const instant='2026-11-20T20:00:00.000Z';
function sky(name,offset){
  const points={Sun:195,Moon:118,Mercury:206,Venus:169,Mars:168,Jupiter:307,Saturn:235,Uranus:254,Neptune:271,Pluto:213,Ascendant:168,Midheaven:76};
  return{name,houseSystem:'equal-house',
    houseCusps:Array.from({length:12},(_,i)=>(168+offset+30*i)%360),
    calcProfile:{instant,dateTime:'2026-11-20T13:00',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891,location:'Salt Lake City, Utah',houseSystem:'equal-house'},
    placements:Object.fromEntries(Object.entries(points).map(([name,v])=>[name,{name,longitude:(v+offset)%360}]))};
}
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const pages=await Promise.all([context.newPage(),context.newPage()]);
  const errors=[[],[]];pages.forEach((p,i)=>p.on('pageerror',err=>errors[i].push(err.message)));
  for(const p of pages){
    await p.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
    await p.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  }
  const [first,second]=pages;
  await first.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
  },{a:sky('First tab Sky A',0),b:sky('First tab Sky B',7)});
  const url='http://127.0.0.1:4173/sky-chart.html';
  await first.goto(url,{waitUntil:'domcontentloaded'});
  await second.goto(url,{waitUntil:'domcontentloaded'});
  const ready=async page=>{
    await page.waitForFunction(()=>document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy')==='false'&&
      document.documentElement.dataset.skyBPresent==='true'&&!!window.RelphiSkyWorkingSlotStore&&
      !!window.RelphiSkySlotControls?.swapSkies,{timeout:45000});
  };
  await Promise.all(pages.map(ready));
  async function state(p){return p.evaluate(()=>{
    const st=window.RelphiSkyWorkingSlotStore;
    const a=JSON.parse(st.getItem('relphiSkyChartA')||'null'),b=JSON.parse(st.getItem('relphiSkyChartB')||'null');
    return{
      names:[a?.name,b?.name],positions:[a?.placements?.Sun?.longitude,b?.placements?.Sun?.longitude],
      present:document.documentElement.dataset.skyBPresent,
      mode:st.getItem('relphiSkyChartLastModeV1'),
      library:st.getItem('relphiSkyLibraryV1'),
      nativeSet:/\[native code\]/.test(Storage.prototype.setItem.toString()),
      storageArea:st.isTabScoped('relphiSkyChartA')&&st.isTabScoped('relphiSkyChartB')
    };
  })}
  const initial=await state(first);
  assert.deepEqual(initial.names,['First tab Sky A','First tab Sky B']);
  assert.equal(initial.nativeSet,true,'Do not change browser Storage.prototype');
  const different=[sky('Second tab Sky A',32),sky('Second tab Sky B',74)];
  await second.evaluate(([a,b])=>{
    const store=window.RelphiSkyWorkingSlotStore;
    for(const [slot,payload] of [['A',a],['B',b]]){
      const key='relphiSkyChart'+slot;
      store.setItem(key,JSON.stringify(payload));
      window.dispatchEvent(new StorageEvent('storage',{key,newValue:store.getItem(key),storageArea:sessionStorage}));
    }
  },different);
  await second.waitForFunction(()=>document.querySelector('#skyFoundationA .sky-foundation-name')?.textContent?.includes('Second tab'));
  assert.deepEqual((await state(first)).names,initial.names,'Another tab changing two skies must not overwrite the first tab');
  assert.deepEqual((await state(second)).names,['Second tab Sky A','Second tab Sky B']);
  assert.equal((await state(second)).nativeSet,true,'Global Storage prototype must stay native');
  const swapped=await second.evaluate(()=>window.RelphiSkySlotControls.swapSkies());
  assert.equal(swapped,true,'Existing Sky A/B swap UI must still work');
  assert.deepEqual((await state(second)).names,['Second tab Sky B','Second tab Sky A']);
  assert.deepEqual((await state(first)).names,initial.names,'Swapping in the second tab must not change the first wheel');

  // The named library remains browser-wide, not silently made per-tab.
  await second.evaluate(()=>window.RelphiSkyWorkingSlotStore.setItem('relphiSkyLibraryV1','[{"name":"Shared Reference","placements":{"Sun":{"longitude":15}}}]'));
  assert.match((await state(first)).library||'',/Shared Reference/);

  await Promise.all(pages.map(async p=>{await p.reload({waitUntil:'domcontentloaded'});await ready(p)}));
  const afterReload=await Promise.all(pages.map(state));
  assert.deepEqual(afterReload[0].names,initial.names,'Unsaved first-tab charts survive refresh');
  assert.deepEqual(afterReload[1].names,['Second tab Sky B','Second tab Sky A'],'Unsaved second-tab charts survive refresh');
  assert.equal(afterReload[0].present,'true');
  assert.equal(afterReload[1].present,'true');
  assert.ok(afterReload.every(x=>x.storageArea&&x.nativeSet));
  await first.screenshot({path:'two-independent-sky-tabs-first.png',fullPage:true});
  await second.screenshot({path:'two-independent-sky-tabs-second.png',fullPage:true});
  assert.deepEqual(errors,[[],[]],'No Sky Chart runtime errors across tabs and reloads');
  console.log('Independent tab workspaces acceptance PASS',JSON.stringify({initial,afterReload}));
}finally{await browser.close()}
