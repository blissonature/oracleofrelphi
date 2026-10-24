import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const fixture=offset=>{
 const houseCusps=Array.from({length:12},(_,i)=>(168+offset+i*30)%360);
 return {name:offset?'Sky B':'Sky A',houseSystem:'porphyry',
 calcProfile:{instant:'2026-10-20T12:00:00.000Z',dateTime:'2026-10-20T06:00:00',timeZone:'America/Denver',latitude:40.76,longitude:-111.89,houseSystem:'porphyry',houseCusps},
 houseCusps,placements:{
 Moon:{name:'Moon',longitude:279+offset},Sun:{name:'Sun',longitude:170+offset},
 Mercury:{name:'Mercury',longitude:195+offset},Venus:{name:'Venus',longitude:215+offset},
 Mars:{name:'Mars',longitude:118+offset},Jupiter:{name:'Jupiter',longitude:142+offset},
 Saturn:{name:'Saturn',longitude:13+offset},Uranus:{name:'Uranus',longitude:65+offset},
 Neptune:{name:'Neptune',longitude:3+offset},Pluto:{name:'Pluto',longitude:303+offset},
 Ascendant:{name:'Ascendant',longitude:168+offset},Descendant:{name:'Descendant',longitude:348+offset},
 'Medium Coeli':{name:'Medium Coeli',longitude:258+offset},
 'Imum Coeli':{name:'Imum Coeli',longitude:78+offset}}};
};
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:880}});
 await page.addInitScript(({a,b})=>{
 localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
 localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
 localStorage.setItem('relphiSkyChartLastModeV1','comparison');
 },{a:fixture(0),b:fixture(17)});
 await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
 const moon=page.locator('#skyFoundationWheelMount [data-interactive="placement"][data-sky="B"][data-placement="moon"]').first();
 await moon.waitFor({timeout:15000});
 await page.evaluate(()=>{
   window.__moonTrace=[];
   for(const name of ['pointerdown','pointerup','click','pointerout']){
     document.addEventListener(name,e=>{
       const m=e.target.closest?.('[data-sky="B"][data-placement="moon"]');
       if(m)window.__moonTrace.push({name,phase:e.eventPhase,target:m.tagName,classes:m.getAttribute('class'),cancel:e.defaultPrevented});
     },true);
   }
 });
 // Moving over Moon B must remain preview-only: no Relationships rows disappear.
 await moon.hover({force:true});
 await page.waitForTimeout(100);
 assert.equal(await page.evaluate(()=>document.querySelectorAll('#skyFoundationRelationshipList > .is-wheel-selection-excluded').length),0,'Hover alone must not hide Relationships rows');
 await moon.click({force:true});
 await page.waitForTimeout(100);
 const trace=await page.evaluate(()=>({
  events:window.__moonTrace,
  moon:document.querySelector('#skyFoundationWheelMount [data-interactive="placement"][data-sky="B"][data-placement="moon"]')?.outerHTML.slice(0,700),
  wheel:document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel')?.getAttribute('class'),
  root:document.getElementById('skyFoundationRoot')?.dataset
 }));
 console.log('MOON_CLICK_TRACE',JSON.stringify(trace));
 assert.equal(await moon.evaluate(node=>node.classList.contains('is-selected')),true,'Click locks Sky B Moon');
 await page.mouse.move(10,10);
 await page.waitForTimeout(100);
 assert.equal(await moon.evaluate(node=>node.classList.contains('is-selected')),true,'Pointer leave must preserve Sky B Moon lock');
 await page.evaluate(()=>{const list=document.getElementById('skyFoundationRelationshipList');if(list)list.scrollTop=200});
 await page.waitForTimeout(100);
 assert.equal(await moon.evaluate(node=>node.classList.contains('is-selected')),true,'Relationship panel scroll must preserve Sky B Moon lock');
 const ledger=page.locator('#skyFoundationB .sky-foundation-row[data-interactive="placement"][data-placement="moon"]').first();
 await ledger.waitFor({timeout:15000});
 // Clear the existing wheel lock and select Moon B from the side panel.
 await page.evaluate(()=>document.getElementById('skyFoundationRoot').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
 assert.equal(await ledger.evaluate(node=>node.classList.contains('is-selected')),false,'Escape clears prior selection');
 await ledger.click({force:true});
 await page.mouse.move(10,10);
 await page.waitForTimeout(150);
 assert.equal(await ledger.evaluate(node=>node.classList.contains('is-selected')),true,'Sky B ledger Moon click must persist after mouse leave');
 // Regression for Harmonic Window model transition (the source of the user's report).
 await page.evaluate(()=>{
   document.getElementById('skyFoundationRoot').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
   window.RelphiHarmonicOrb.setWindow(2);
 });
 await page.waitForTimeout(300);
 await page.evaluate(()=>window.RelphiHarmonicOrb.setWindow(3));
 await page.waitForTimeout(800);
 await moon.click({force:true});
 await page.mouse.move(10,10);
 await page.waitForTimeout(150);
 assert.equal(await moon.evaluate(node=>node.classList.contains('is-selected')),true,'Moon B must lock after Harmonic Window increases from 2 to 3');
 // Exercise the actual helper dialog: one Moon B relationship is just outside HR 2.
 await page.evaluate(()=>window.RelphiHarmonicOrb.setWindow(2));
 await page.waitForTimeout(650);
 const setup=await page.evaluate(()=>{
   const rows=[...document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]')];
   const target=rows.find(row=>(row.dataset.leftSky==='B'&&row.dataset.leftPlacement==='moon')||
     (row.dataset.rightSky==='B'&&row.dataset.rightPlacement==='moon')||
     (row.dataset.relationshipMode==='B-B'&&(row.dataset.leftPlacement==='moon'||row.dataset.rightPlacement==='moon')));
   if(!target)return {error:'No Moon B relationship row',count:rows.length};
   for(const row of rows)row.classList.add('sky-chart-filter-hidden');
   target.classList.remove('sky-chart-filter-hidden');
   target.classList.add('sky-chart-orb-hidden');
   target.dataset.phaseError='2.5';
   document.getElementById('skyFoundationRoot').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
   window.dispatchEvent(new Event('relphi:sky-placement-multiselect-changed'));
   return {count:rows.length,target:target.dataset.relationIndex};
 });
 assert.ok(!setup.error,JSON.stringify(setup));
 await page.waitForSelector('#skyFoundationWheelMount [data-sky="B"][data-placement="moon"].is-filter-intermediate',{timeout:10000});
 await moon.click({force:true});
 await page.waitForSelector('.sky-focus-hidden-aspect-popover',{timeout:5000});
 await page.getByRole('button',{name:'Increase to 3°'}).click();
 assert.equal(await page.evaluate(()=>window.RelphiHarmonicOrb.getWindow()),3);
 await page.waitForTimeout(300);
 // Snapshot DOM identity, exact row order, and aspect geometry *before* selecting.
 // Temporarily narrowing Relationships must not rebuild data or redraw the wheel.
 const baseline=await page.evaluate(()=>{
   const list=document.getElementById('skyFoundationRelationshipList');
   window.__unfilteredRelationshipNodes=[...list.querySelectorAll(':scope > .sky-foundation-relationship-row')];
   const geometry=()=>[...document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')]
      .map(line=>['data-left-sky','data-left-placement','data-aspect','data-right-sky','data-right-placement','x1','y1','x2','y2'].map(name=>line.getAttribute(name)).join('|')).sort();
   window.__unfilteredWheelGeometry=geometry();
   return {rows:window.__unfilteredRelationshipNodes.length,aspectLines:window.__unfilteredWheelGeometry.length};
 });
 assert.ok(baseline.rows>1,'Fixture must contain multiple Relationships tiles');
 assert.ok(baseline.aspectLines>0,'Fixture must show aspect lines on the comparison wheel');
 await moon.click({force:true});
 await page.mouse.move(10,10);
 await page.waitForTimeout(150);
 assert.equal(await moon.evaluate(node=>node.classList.contains('is-selected')),true,'Moon B persists after actual helper Increase to 3');
 const focusRows=await page.evaluate(()=>{
   const rows=[...document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row[data-relation-index]')];
   const excluded=rows.filter(row=>row.classList.contains('is-wheel-selection-excluded'));
   return {total:rows.length,excluded:excluded.length,
     incorrectlyVisible:excluded.filter(row=>getComputedStyle(row).display!=='none').length,
     matches:rows.filter(row=>!row.classList.contains('is-wheel-selection-excluded')).length};
 });
 assert.ok(focusRows.excluded>0,'Locked Moon B selection must temporarily hide unrelated relationships');
 assert.ok(focusRows.matches>0,'Locked Moon B selection must keep matching relationships visible');
 assert.equal(focusRows.incorrectlyVisible,0,'Unrelated relationships must be display:none');
 const snapshot=await page.evaluate(()=>{
   const rows=[...document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row')];
   const lines=[...document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')]
     .map(line=>['data-left-sky','data-left-placement','data-aspect','data-right-sky','data-right-placement','x1','y1','x2','y2'].map(name=>line.getAttribute(name)).join('|')).sort();
   return {sameRows:rows.length===window.__unfilteredRelationshipNodes.length&&rows.every((row,i)=>row===window.__unfilteredRelationshipNodes[i]),
     sameGeometry:JSON.stringify(lines)===JSON.stringify(window.__unfilteredWheelGeometry),
     moonLocked:!!document.querySelector('#skyFoundationWheelMount [data-interactive="placement"][data-sky="B"][data-placement="moon"].is-selected')};
 });
 assert.equal(snapshot.sameRows,true,'Selection must not delete, rebuild, or reorder Relationships tiles');
 assert.equal(snapshot.sameGeometry,true,'Filtering Relationships must leave comparison-wheel aspect geometry untouched');
 assert.equal(snapshot.moonLocked,true,'Relationships filtering must preserve the Moon B wheel lock');
 // Use a REAL Chromium pointer click in the empty 8px list padding, not an artificial DOM click.
 // That blank surface is the promised way to clear the selection.
 await page.locator('#skyFoundationRelationshipList').click({position:{x:3,y:3}});
 await page.waitForTimeout(150);
 const restored=await page.evaluate(()=>{
   const rows=[...document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row')];
   return {excluded:rows.filter(row=>row.classList.contains('is-wheel-selection-excluded')).length,
     sameRows:rows.length===window.__unfilteredRelationshipNodes.length&&rows.every((row,i)=>row===window.__unfilteredRelationshipNodes[i]),
     moonLocked:!!document.querySelector('#skyFoundationWheelMount [data-interactive="placement"][data-sky="B"][data-placement="moon"].is-selected')};
 });
 assert.equal(restored.excluded,0,'Real blank-area click restores temporarily hidden Relationships tiles');
 assert.equal(restored.sameRows,true,'Blank-area clear restores the full list in its original order without rebuilding');
 assert.equal(restored.moonLocked,false,'Blank-area clear also removes the Moon B wheel selection');
 console.log('PASS locked Moon B shows matching Relationships only, clear restores all');
  console.log('PASS helper popup -> Increase to HR 3 -> select Moon B -> leave remains selected');
  console.log('PASS Moon B wheel and side-panel clicks persist, including after Harmonic Window 2→3 transition');
}finally{await browser.close()}
