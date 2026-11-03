import assert from 'node:assert/strict';
import path from 'node:path';
import {chromium} from 'playwright';

const ids=['conjunction','semi-sextile','octile','sextile','quintile','square','trine','tri-octile','bi-quintile','quincunx','opposition'];
// Reproduction: the user's two Salt Lake City skies are 5h27m apart.
const longitudes={Sun:221.05,Moon:142,Mercury:224,Venus:205,Mars:139,Jupiter:144.58,
 Saturn:9.1333,Uranus:64.5833,Neptune:2.0333,Pluto:303.1333,Chiron:27.9667,
 'North Node':325.95,'South Node':145.95,Lilith:275.5333,
 Ascendant:185,Midheaven:95};
const make=(offset)=>({
 name:offset?'Nov 2, 2026, 10:10 PM':'Nov 3, 2026, 3:37 AM',houseSystem:'equal-house',
 houseCusps:Array.from({length:12},(_,i)=>(185+i*30)%360),
 calcProfile:{instant:offset?'2026-11-03T05:10:00Z':'2026-11-03T10:37:00Z',
 dateTime:offset?'2026-11-02T22:10:00':'2026-11-03T03:37:00',
 timeZone:'America/Denver',houseSystem:'equal-house',latitude:40.76,longitude:-111.89,
 houseCusps:Array.from({length:12},(_,i)=>(185+i*30)%360)},
 placements:Object.fromEntries(Object.entries(longitudes).map(([name,lon])=>[name,{name,longitude:lon+(offset?.01:0)}]))
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
  // Acceptance: opening the real Aspect menu must expose the option without
  // scrolling, including on a narrow mobile viewport.
  await page.locator('[data-aspect-filter-toggle]').click();
  await page.waitForFunction(()=>{
    const panel=document.getElementById('skyChartAspectPopover');
    return panel&&!panel.hidden&&getComputedStyle(panel).display!=='none';
  });
  const option=page.locator('.sky-chart-slow-conjunction-option');
  await option.waitFor({state:'visible'});
  const visibility=await page.evaluate(()=>{
    const menu=document.getElementById('skyChartAspectPopover');
    const option=menu.querySelector('.sky-chart-slow-conjunction-option');
    const first=menu.querySelector('.sky-chart-aspect-filter-body')?.firstElementChild;
    const r=option.getBoundingClientRect(),p=menu.getBoundingClientRect();
    return {first:first===option,within:r.top>=p.top&&r.bottom<=p.bottom,
      withinViewport:r.top>=0&&r.bottom<=innerHeight,text:option.textContent.trim()};
  });
  assert.equal(visibility.first,true,'the slow-conjunction choice must be first in the Aspect menu');
  assert.equal(visibility.within,true,'the choice must be inside the visible menu without scrolling');
  assert.equal(visibility.withinViewport,true,'the choice must be visible in the viewport');
  assert.match(visibility.text,/Hide same-passage slow-body conjunctions/);

  const audit=()=>page.evaluate(()=>{
   const select=(kind)=>[...document.querySelectorAll(kind==='row'?'#skyFoundationRelationshipList>.sky-foundation-relationship-row':'#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')];
   const visible=node=>!node.hidden&&!node.classList.contains('sky-chart-aspect-multiselect-hidden')&&getComputedStyle(node).display!=='none';
   const get=kind=>{
    const nodes=select(kind);
    const same=(id)=>nodes.filter(n=>n.dataset.relationshipMode==='A-B'&&n.dataset.aspect==='conjunction'&&n.dataset.leftPlacement===id&&n.dataset.rightPlacement===id);
    const sameSlow=['jupiter','saturn','uranus','neptune','pluto','chiron','north-node','south-node','lilith'].flatMap(same);
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
  const baselineIntra=before.rows.intraVisible;
  await page.locator('[data-relationship-limit-preset]').selectOption('10');
  await toggle.check();
  await page.locator('[data-aspect-filter-toggle]').click();
  await page.waitForTimeout(350);
  const hidden=await audit();
  assert.equal(hidden.setting,'true');
  assert.equal(hidden.rows.slowVisible,0,'repeated slow conjunction rows hidden');
  assert.equal(hidden.lines.slowVisible,0,'repeated slow conjunction lines hidden');
  assert.equal(hidden.rows.fastVisible,hidden.rows.fast,'fast Sun conjunction preserved');
  assert.equal(hidden.rows.intraVisible,baselineIntra,'intrasky conjunction visibility unchanged');
  await page.waitForTimeout(800);
  const afterSettling=await audit();
  assert.equal(afterSettling.rows.slowVisible,0,'slow conjunctions must remain suppressed after resort/limit refresh');
  await page.evaluate(()=>{
    window.__slowConjunctionCopied='';
    document.execCommand=()=>false;
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
      writeText:async text=>{window.__slowConjunctionCopied=String(text)}
    }});
  });
  await page.locator('.sky-relationship-copy-button').click();
  await page.waitForFunction(()=>!!window.__slowConjunctionCopied,null,{timeout:10000});
  const copied=await page.evaluate(()=>window.__slowConjunctionCopied);
  assert.match(copied,/Repeated slow-body conjunctions: Hide same passage/,
    'copied Relationships focus must report the active filter');
  for(const glyph of ['♇','♆','♅','⚷','♄','☊','☋','⚸'])
    assert.ok(!copied.split('\\n').some(line=>line.includes(glyph)&&line.includes('☌')&&line.indexOf(glyph)!==line.lastIndexOf(glyph)),
      'Relationships Copy must exclude repeated '+glyph+' conjunctions');

  // An explicit retrograde-state change makes the same-body conjunction
  // meaningful even across nearby skies.
  await page.evaluate(()=>{
   const key='relphiSkyChartB',b=JSON.parse(localStorage.getItem(key));
   const a=window.RelphiSkyRetrograde.forPlacement('A','saturn');
   b.placements.Saturn.retrograde=!a;
   localStorage.setItem(key,JSON.stringify(b));
   window.dispatchEvent(new StorageEvent('storage',{key,newValue:localStorage.getItem(key)}));
  });
  await page.waitForTimeout(500);
  const changedRx=await audit();
  assert.ok(changedRx.rows.fastVisible>0);
  const saturnVisible=await page.evaluate(()=>[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row')].some(n=>n.dataset.relationshipMode==='A-B'&&n.dataset.aspect==='conjunction'&&n.dataset.leftPlacement==='saturn'&&n.dataset.rightPlacement==='saturn'&&!n.hidden&&!n.classList.contains('sky-chart-aspect-multiselect-hidden')));
  assert.equal(saturnVisible,true,'retrograde-state change must preserve Saturn conjunction');

  // A later pass must remain visible despite the same degree and the same
  // retrograde flag: direct -> retrograde -> direct is a distinct passage.
  await page.evaluate(()=>{
   const ka='relphiSkyChartA',kb='relphiSkyChartB';
   const a=JSON.parse(localStorage.getItem(ka)),b=JSON.parse(localStorage.getItem(kb));
   const rx=window.RelphiSkyRetrograde.forPlacement('A','saturn');
   a.placements.Saturn.retrograde=rx;b.placements.Saturn.retrograde=rx;
   b.calcProfile.instant='2027-11-03T12:00:00Z';
   localStorage.setItem(ka,JSON.stringify(a));localStorage.setItem(kb,JSON.stringify(b));
   window.dispatchEvent(new StorageEvent('storage',{key:kb,newValue:localStorage.getItem(kb)}));
  });
  await page.waitForTimeout(600);
  const afterReturn=await page.evaluate(()=>[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row')].some(n=>n.dataset.relationshipMode==='A-B'&&n.dataset.aspect==='conjunction'&&n.dataset.leftPlacement==='saturn'&&n.dataset.rightPlacement==='saturn'&&!n.hidden&&!n.classList.contains('sky-chart-aspect-multiselect-hidden')));
  assert.equal(afterReturn,true,'same degree on different retrograde passage must remain visible');

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
