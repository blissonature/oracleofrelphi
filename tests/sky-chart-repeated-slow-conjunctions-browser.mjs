import assert from 'node:assert/strict';
import path from 'node:path';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';

const ids=['conjunction','semi-sextile','octile','sextile','quintile','square','trine','tri-octile','bi-quintile','quincunx','opposition'];
// Reproduction: the user's two Salt Lake City skies are 5h27m apart.
const longitudes={Sun:221.05,Moon:142,Mercury:224,Venus:205,Mars:139,Jupiter:144.58,
 Saturn:9.1333,Uranus:64.5833,Neptune:2.0333,Pluto:303.1333,Chiron:27.9667,
 'North Node':325.95,'South Node':145.95,Lilith:275.5333,
 Descendant:4.99999,Dsc:5,
 Ascendant:185,Midheaven:95};
const make=(offset)=>({
 name:offset?'Nov 2, 2026, 10:10 PM':'Nov 3, 2026, 3:37 AM',houseSystem:'equal-house',
 houseCusps:Array.from({length:12},(_,i)=>((offset?117:185)+i*30)%360),
 calcProfile:{instant:offset?'2026-11-03T05:10:00Z':'2026-11-03T10:37:00Z',
 dateTime:offset?'2026-11-02T22:10:00':'2026-11-03T03:37:00',
 timeZone:'America/Denver',houseSystem:'equal-house',latitude:40.76,longitude:-111.89,
 houseCusps:Array.from({length:12},(_,i)=>((offset?117:185)+i*30)%360)},
 placements:Object.fromEntries(Object.entries(longitudes).filter(([name])=>!offset||(name!=='Descendant'&&name!=='Dsc')).map(([name,lon])=>[name,{name,longitude:name==='Midheaven'&&offset?9.0667:name==='Ascendant'&&offset?117:lon+(offset?.01:0)}]))
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
   localStorage.setItem('relphiSkyVocabDisplayV1',JSON.stringify({glyphs:true,names:false,referents:false}));
   localStorage.setItem('relphiSkyAspectMatrixV1',JSON.stringify({'A-A':[],'B-B':[],'A-B':ids}));
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
  assert.match(visibility.text,/Hide repeated same-passage relationships/);

  const audit=()=>page.evaluate(()=>{
   const select=(kind)=>[...document.querySelectorAll(kind==='row'?'#skyFoundationRelationshipList>.sky-foundation-relationship-row':'#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')];
   const visible=node=>!node.hidden&&!node.classList.contains('sky-chart-aspect-multiselect-hidden')&&getComputedStyle(node).display!=='none';
   const get=kind=>{
    const nodes=select(kind);
    const same=(id)=>nodes.filter(n=>n.dataset.relationshipMode==='A-B'&&n.dataset.aspect==='conjunction'&&n.dataset.leftPlacement===id&&n.dataset.rightPlacement===id);
    const sameSlow=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','chiron','north-node','south-node','lilith'].flatMap(same);
    const nodeAxis=nodes.filter(n=>n.dataset.relationshipMode==='A-B'&&n.dataset.aspect==='opposition'&&((n.dataset.leftPlacement==='north-node'&&n.dataset.rightPlacement==='south-node')||(n.dataset.leftPlacement==='south-node'&&n.dataset.rightPlacement==='north-node')));
    const saturnMC=nodes.filter(n=>n.dataset.relationshipMode==='A-B'&&n.dataset.aspect==='conjunction'&&n.dataset.leftPlacement==='saturn'&&n.dataset.rightPlacement==='mc');
    const sameFast=same('sun');
    const intra=nodes.filter(n=>n.dataset.relationshipMode==='A-A'&&n.dataset.aspect==='conjunction');
    return {slow:sameSlow.length,slowVisible:sameSlow.filter(visible).length,slowFiltered:sameSlow.filter(n=>n.classList.contains('sky-chart-aspect-multiselect-hidden')).length,fast:sameFast.length,fastVisible:sameFast.filter(visible).length,nodeAxis:nodeAxis.length,nodeAxisVisible:nodeAxis.filter(visible).length,nodeAxisFiltered:nodeAxis.filter(n=>n.classList.contains('sky-chart-aspect-multiselect-hidden')).length,saturnMC:saturnMC.length,saturnMCFiltered:saturnMC.filter(n=>n.classList.contains('sky-chart-aspect-multiselect-hidden')).length,intra:intra.length,intraVisible:intra.filter(visible).length,intraFiltered:intra.filter(n=>n.classList.contains('sky-chart-aspect-multiselect-hidden')).length};
   };
   return {rows:get('row'),lines:get('line'),setting:localStorage.getItem('relphiSkyHideRepeatedSlowConjunctionsV1')};
  });
  await page.waitForFunction(()=>[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row')].some(n=>n.dataset.relationshipMode==='A-B'&&n.dataset.aspect==='conjunction'&&n.dataset.leftPlacement==='saturn'&&n.dataset.rightPlacement==='saturn'),null,{timeout:25000});
  // Reproduce saved Sky A's duplicate Descendant aliases. Both can land at
  // Pisces 18°22′ but with H6/H7 metadata; their canonical ID is still dsc.
  const selfAspects=await page.evaluate(()=>({
    rows:[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row')].filter(n=>['A-A','B-B'].includes(n.dataset.relationshipMode)&&n.dataset.leftPlacement===n.dataset.rightPlacement).map(n=>({id:n.dataset.leftPlacement,aspect:n.dataset.aspect})),
    lines:[...document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"]>line.sky-foundation-aspect')].filter(n=>['A-A','B-B'].includes(n.dataset.relationshipMode)&&n.dataset.leftPlacement===n.dataset.rightPlacement).map(n=>({id:n.dataset.leftPlacement,aspect:n.dataset.aspect}))
  }));
  assert.deepEqual(selfAspects.rows,[],'an intrasky placement must not form any aspect with its own canonical identity');
  assert.deepEqual(selfAspects.lines,[],'self-aspects must not be rendered on the wheel');
  // One source alias is just shy of the Seventh cusp; the surviving Descendant
  // must still be H7 because it is the defining quadrant angle.
  const descendantHouses=await page.evaluate(()=>[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row')].flatMap(row=>{
    const scope=row.dataset.relationshipMode;
    return ['left','right'].filter(side=>row.dataset[side+'Placement']==='dsc' &&
      (scope==='A-A'||(scope==='A-B'&&side==='left'))).map(side=>Number(row.dataset[side+'House']));
  }));
  assert.ok(descendantHouses.length>0,'the fixture must contain Descendant relationships');
  assert.ok(descendantHouses.every(house=>house===7),
    'Sky A Descendant must retain house 7 at a rounded cusp boundary: '+descendantHouses.join(','));

  const before=await audit();
  assert.ok(before.rows.slow>=5,'fixture must generate repeated slow conjunctions');
  assert.equal(before.rows.slowVisible,before.rows.slow,'default includes repeated slow conjunctions');
  await page.locator('[data-relationship-limit-preset]').selectOption('5');
  await page.waitForTimeout(300);
  const baselineIntra=(await audit()).rows.intraFiltered;
  // Measure rendered wheel pixels, not only hidden DOM classes.
  await page.locator('[data-aspect-filter-toggle]').click();
  await page.waitForTimeout(300);
  const wheel=page.locator('#skyFoundationWheelMount > svg.sky-foundation-wheel');
  const renderedBefore=PNG.sync.read(await wheel.screenshot());
  await page.locator('[data-aspect-filter-toggle]').click();
  await toggle.check();
  await page.locator('[data-aspect-filter-toggle]').click();
  await page.waitForTimeout(350);
  const renderedAfter=PNG.sync.read(await wheel.screenshot());
  assert.equal(renderedBefore.width,renderedAfter.width);
  assert.equal(renderedBefore.height,renderedAfter.height);
  let changedPixels=0;
  for(let i=0;i<renderedBefore.data.length;i+=4){
    const delta=Math.abs(renderedBefore.data[i]-renderedAfter.data[i])+Math.abs(renderedBefore.data[i+1]-renderedAfter.data[i+1])+Math.abs(renderedBefore.data[i+2]-renderedAfter.data[i+2]);
    if(delta>50)changedPixels++;
  }
  assert.ok(changedPixels>75,'Checking the filter must physically change the painted wheel, not only mark DOM lines hidden: '+changedPixels+' pixels');
  await page.waitForTimeout(350);
  const hidden=await audit();
  assert.equal(hidden.setting,'true');
  assert.equal(hidden.rows.slowVisible,0,'repeated slow conjunction rows hidden');
  assert.equal(hidden.lines.slowVisible,0,'repeated slow conjunction lines hidden');
  const hiddenHitTargets=await page.evaluate(()=>{
    const hits=[...document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"]>.sky-foundation-aspect-hit')];
    const matching=hits.filter(n=>n.dataset.relationshipMode==='A-B'&&n.dataset.aspect==='conjunction'&&
      n.dataset.leftPlacement==='saturn'&&n.dataset.rightPlacement==='saturn');
    return {total:matching.length,hidden:matching.filter(n=>getComputedStyle(n).display==='none').length};
  });
  assert.ok(hiddenHitTargets.total>0,'the wheel must contain a hit target for suppressed Saturn conjunction');
  assert.equal(hiddenHitTargets.hidden,hiddenHitTargets.total,'excluded aspect must not retain clickable hit targets');
  assert.equal(hidden.rows.fastVisible,0,'same-pass Sun conjunction also suppressed');
  assert.ok(hidden.rows.nodeAxis>=2,'fixture must contain both nodal-axis cross oppositions');
  assert.equal(hidden.rows.nodeAxisFiltered,hidden.rows.nodeAxis,'both opposite node polarities suppressed');
  assert.equal(hidden.lines.nodeAxisFiltered,hidden.lines.nodeAxis,'nodal-axis lines suppressed');
  // Reciprocal observations of one pair and aspect are one encounter.
  // Same passage: A Venus sextile B Jupiter and A Jupiter sextile B Venus,
  // Sun-Mercury conjunction, Jupiter-South Node conjunction.
  const reciprocalAudit=await page.evaluate(()=>{
    const source=selector=>[...document.querySelectorAll(selector)];
    const groups=[
      ['venus','jupiter','sextile'],
      ['sun','mercury','conjunction'],
      ['jupiter','south-node','conjunction']
    ];
    const inspect=selector=>groups.map(([a,b,aspect])=>{
      const matches=source(selector).filter(n=>n.dataset.relationshipMode==='A-B'&&n.dataset.aspect===aspect&&
        ((n.dataset.leftPlacement===a&&n.dataset.rightPlacement===b)||
         (n.dataset.leftPlacement===b&&n.dataset.rightPlacement===a)));
      const eligible=matches.filter(n=>!n.classList.contains('sky-chart-aspect-multiselect-hidden'));
      return {group:a+'|'+b+'|'+aspect,total:matches.length,visible:eligible.length};
    });
    return {rows:inspect('#skyFoundationRelationshipList>.sky-foundation-relationship-row'),
      lines:inspect('#skyFoundationWheelMount [data-layer="aspects"]>line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')};
  });
  for(const kind of ['rows','lines'])for(const group of reciprocalAudit[kind]){
    assert.ok(group.total>=2,'reproduction must contain both directions for '+kind+' '+group.group);
    assert.equal(group.visible,1,'only one same-passage reciprocal observation should remain for '+kind+' '+group.group);
  }

  assert.ok(hidden.rows.saturnMC>0,'fixture must contain Saturn conjunct MC');
  assert.equal(hidden.rows.saturnMCFiltered,0,'Saturn-MC stays eligible');
  assert.equal(hidden.lines.saturnMCFiltered,0,'Saturn-MC wheel line stays eligible');
  assert.equal(hidden.rows.intraFiltered,baselineIntra,'intrasky aspect eligibility must remain unchanged');
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
  assert.match(copied,/Repeated relationships: Hide same passage/,
    'copied Relationships focus must report the active filter');
  for(const glyph of ['♇','♆','♅','⚷','♄','♀','♂','☊','☋','⚸'])
    assert.ok(!copied.split('\n').some(line=>line.includes(glyph)&&line.includes('☌')&&line.indexOf(glyph)!==line.lastIndexOf(glyph)),
      'Relationships Copy must exclude repeated '+glyph+' conjunctions');

  assert.match(copied,/♄.*☌.*MC/,'Saturn conjunct MC must remain in copied results');
  assert.ok(!copied.split('\n').some(line=>line.includes('☍')&&line.includes('☊')&&line.includes('☋')),'Node axis repetitions must be absent from Copy');
  // A reciprocal pair must NOT be collapsed when one body changes
  // retrograde state between the two observations.
  await page.evaluate(()=>{
    const key='relphiSkyChartB',payload=JSON.parse(localStorage.getItem(key));
    const initial=window.RelphiSkyRetrograde.forPlacement('A','jupiter');
    payload.placements.Jupiter.retrograde=!initial;
    localStorage.setItem(key,JSON.stringify(payload));
    window.dispatchEvent(new StorageEvent('storage',{key,newValue:localStorage.getItem(key)}));
  });
  await page.waitForTimeout(600);
  const changedJupiter=await page.evaluate(()=>{
    const selectors=['#skyFoundationRelationshipList>.sky-foundation-relationship-row','#skyFoundationWheelMount [data-layer="aspects"]>line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)'];
    return selectors.map(selector=>[...document.querySelectorAll(selector)].filter(n=>n.dataset.relationshipMode==='A-B'&&n.dataset.aspect==='sextile'&&
      ((n.dataset.leftPlacement==='venus'&&n.dataset.rightPlacement==='jupiter')||
       (n.dataset.leftPlacement==='jupiter'&&n.dataset.rightPlacement==='venus'))&&
       !n.classList.contains('sky-chart-aspect-multiselect-hidden')).length);
  });
  assert.deepEqual(changedJupiter,[2,2],'retrograde change preserves both directional observations for one pair');
  await page.evaluate(()=>{
    const key='relphiSkyChartB',payload=JSON.parse(localStorage.getItem(key));
    payload.placements.Jupiter.retrograde=window.RelphiSkyRetrograde.forPlacement('A','jupiter');
    localStorage.setItem(key,JSON.stringify(payload));
    window.dispatchEvent(new StorageEvent('storage',{key,newValue:localStorage.getItem(key)}));
  });
  await page.waitForTimeout(450);
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
  assert.ok(changedRx.rows.fast>=1);
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
  const newSolarRevolution=await page.evaluate(()=>[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row')].some(n=>
    n.dataset.relationshipMode==='A-B'&&n.dataset.aspect==='conjunction'&&
    n.dataset.leftPlacement==='sun'&&n.dataset.rightPlacement==='sun'&&
    !n.classList.contains('sky-chart-aspect-multiselect-hidden')));
  assert.equal(newSolarRevolution,true,'same Sun degree after a whole year must count as a different go-around');


  await toggle.evaluate(el=>{el.checked=false;el.dispatchEvent(new Event('change',{bubbles:true}))});
  await page.waitForTimeout(350);
  const restored=await audit();
  assert.equal(restored.setting,'false');
  assert.equal(restored.rows.slowFiltered,0,'unchecking must restore eligibility to every slow conjunction regardless of Max 10');
  const restoredHitTargets=await page.evaluate(()=>{
    const matches=[...document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"]>.sky-foundation-aspect-hit')].filter(n=>
      n.dataset.relationshipMode==='A-B'&&n.dataset.aspect==='conjunction'&&
      n.dataset.leftPlacement==='saturn'&&n.dataset.rightPlacement==='saturn');
    return {total:matches.length,shown:matches.filter(n=>getComputedStyle(n).display!=='none').length};
  });
  assert.ok(restoredHitTargets.total>0,'restored wheel requires a Saturn hit target');
  assert.equal(restoredHitTargets.shown,restoredHitTargets.total,'unchecking restores the wheel interaction target');
  assert.deepEqual(errors.filter(e=>/TypeError|ReferenceError|SyntaxError/.test(e)),[]);
  console.log('slow-body conjunction filter verified',width,JSON.stringify({changedPixels,before,hidden,restored}));
  await page.close();
 }
}finally{await browser.close()}
