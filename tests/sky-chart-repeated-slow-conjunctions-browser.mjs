import assert from 'node:assert/strict';
import path from 'node:path';
import {chromium} from 'playwright';

const ids=['conjunction','semi-sextile','octile','sextile','quintile','square','trine','tri-octile','bi-quintile','quincunx','opposition'];
const longitudes={Sun:195,Moon:118,Mercury:206,Venus:169,Mars:167,Jupiter:307,Saturn:235,Uranus:255,Neptune:271,Pluto:213,Chiron:74.5,Ascendant:168,Midheaven:76};
const make=(offset)=>({
 name:'Close comparison',houseSystem:'equal-house',
 houseCusps:Array.from({length:12},(_,i)=>(168+i*30)%360),
 calcProfile:{instant:offset?'2026-11-04T12:00:00Z':'2026-11-03T12:00:00Z',
 dateTime:'2026-11-03T05:00:00',houseSystem:'equal-house',latitude:40.76,longitude:-111.89,
 houseCusps:Array.from({length:12},(_,i)=>(168+i*30)%360)},
 placements:Object.fromEntries(Object.entries(longitudes).map(([name,lon])=>[name,{name,longitude:lon+(offset?.25:0)}]))
});
const browser=await chromium.launch({headless:true});
try{
 for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:920}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.addInitScript(({a,b,ids})=>{
   localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
   localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
   localStorage.setItem('relphiSkyChartLastModeV1','comparison');
   localStorage.setItem('relphiSkySharedHouseSystemV1','equal-house');
   localStorage.setItem('relphiSkyHarmonicWindowV1','4');
   localStorage.setItem('relphiSkyAspectMatrixV1',JSON.stringify({'A-A':ids,'B-B':ids,'A-B':ids}));
   localStorage.removeItem('relphiSkyHideRepeatedSlowConjunctionsV1');
  },{a:make(0),b:make(1),ids});
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:35000});
  const toggle=page.locator('[data-hide-repeated-slow-conjunctions]');
  await toggle.waitFor({state:'attached',timeout:20000});
  const audit=()=>page.evaluate(()=>{
   const select=(kind)=>[...document.querySelectorAll(kind==='row'?'#skyFoundationRelationshipList>.sky-foundation-relationship-row':'#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')];
   const visible=node=>!node.hidden&&!node.classList.contains('sky-chart-aspect-multiselect-hidden')&&getComputedStyle(node).display!=='none';
   const get=kind=>{
    const nodes=select(kind);
    const same=(id)=>nodes.filter(n=>n.dataset.relationshipMode==='A-B'&&n.dataset.aspect==='conjunction'&&n.dataset.leftPlacement===id&&n.dataset.rightPlacement===id);
    const sameSlow=['jupiter','saturn','uranus','neptune','pluto','chiron'].flatMap(same);
    const sameFast=same('sun');
    const intra=nodes.filter(n=>n.dataset.relationshipMode==='A-A'&&n.dataset.aspect==='conjunction');
    return {slow:sameSlow.length,slowVisible:sameSlow.filter(visible).length,fast:sameFast.length,fastVisible:sameFast.filter(visible).length,intra:intra.length,intraVisible:intra.filter(visible).length};
   };
   return {rows:get('row'),lines:get('line'),setting:localStorage.getItem('relphiSkyHideRepeatedSlowConjunctionsV1')};
  });
  await page.waitForFunction(()=>[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row')].some(n=>n.dataset.relationshipMode==='A-B'&&n.dataset.aspect==='conjunction'&&n.dataset.leftPlacement==='saturn'&&n.dataset.rightPlacement==='saturn'),null,{timeout:25000});
  const before=await audit();
  assert.ok(before.rows.slow>=5,'fixture must generate repeated slow conjunctions');
  assert.equal(before.rows.slowVisible,before.rows.slow,'default includes repeated slow conjunctions');
  await toggle.evaluate(el=>{el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}))});
  await page.waitForTimeout(350);
  const hidden=await audit();
  assert.equal(hidden.setting,'true');
  assert.equal(hidden.rows.slowVisible,0,'repeated slow conjunction rows hidden');
  assert.equal(hidden.lines.slowVisible,0,'repeated slow conjunction lines hidden');
  assert.equal(hidden.rows.fastVisible,hidden.rows.fast,'fast Sun conjunction preserved');
  assert.equal(hidden.rows.intraVisible,hidden.rows.intra,'intrasky conjunction preserved');
  await toggle.evaluate(el=>{el.checked=false;el.dispatchEvent(new Event('change',{bubbles:true}))});
  await page.waitForTimeout(350);
  const restored=await audit();
  assert.equal(restored.setting,'false');
  assert.equal(restored.rows.slowVisible,restored.rows.slow,'all original slow conjunction rows restored');
  assert.deepEqual(errors.filter(e=>/TypeError|ReferenceError|SyntaxError/.test(e)),[]);
  console.log('slow-body conjunction filter verified',width,JSON.stringify({before,hidden,restored}));
  await page.close();
 }
}finally{await browser.close()}
