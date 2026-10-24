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
 // Hovering is preview-only: neither the visible list nor its match count changes.
 await page.waitForFunction(()=>document.querySelector('#skyFoundationRelationshipCount')?.dataset.countLabel==='matches');
 const hoverCountBefore=await page.locator('#skyFoundationRelationshipCount').getAttribute('data-match-count');
 await moon.hover({force:true});
 await page.waitForTimeout(100);
 assert.equal(await page.evaluate(()=>document.querySelectorAll('#skyFoundationRelationshipList > .is-wheel-selection-excluded').length),0,'Hover alone must not hide Relationships rows');
 assert.equal(await page.locator('#skyFoundationRelationshipCount').getAttribute('data-match-count'),hoverCountBefore,'Hover must not change the matching Relationships count');
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
   const count=document.getElementById('skyFoundationRelationshipCount');
   return {rows:window.__unfilteredRelationshipNodes.length,aspectLines:window.__unfilteredWheelGeometry.length,
     shown:window.__unfilteredRelationshipNodes.filter(row=>getComputedStyle(row).display!=='none').length,
     count:Number(count?.dataset.matchCount)};
 });
 assert.ok(baseline.rows>1,'Fixture must contain multiple Relationships tiles');
 assert.ok(baseline.aspectLines>0,'Fixture must show aspect lines on the comparison wheel');
 assert.equal(baseline.count,baseline.shown,'Unselected count must match the tiles actually displayed');
 await moon.click({force:true});
 await page.mouse.move(10,10);
 await page.waitForTimeout(150);
 assert.equal(await moon.evaluate(node=>node.classList.contains('is-selected')),true,'Moon B persists after actual helper Increase to 3');
 const focusRows=await page.evaluate(()=>{
   const rows=[...document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row[data-relation-index]')];
   const excluded=rows.filter(row=>row.classList.contains('is-wheel-selection-excluded'));
   const count=document.getElementById('skyFoundationRelationshipCount');
   return {total:rows.length,excluded:excluded.length,
     incorrectlyVisible:excluded.filter(row=>getComputedStyle(row).display!=='none').length,
     matches:rows.filter(row=>!row.classList.contains('is-wheel-selection-excluded')).length,
     shown:rows.filter(row=>getComputedStyle(row).display!=='none').length,
     count:Number(count.dataset.matchCount),countLabel:count.dataset.countLabel,
     ariaLabel:count.getAttribute('aria-label')};
 });
 assert.ok(focusRows.excluded>0,'Locked Moon B selection must temporarily hide unrelated relationships');
 assert.ok(focusRows.matches>0,'Locked Moon B selection must keep matching relationships visible');
 assert.equal(focusRows.incorrectlyVisible,0,'Unrelated relationships must be display:none');
 assert.ok(focusRows.shown>0,'At least one matching relationship must remain displayed');
 assert.equal(focusRows.count,focusRows.shown,'Locked Moon B match count must reflect only displayed Relationships tiles');
 assert.equal(focusRows.countLabel,'matches','The displayed number must retain the matches label');
 assert.equal(focusRows.ariaLabel,focusRows.shown+' matching relationships','Accessible match count must update with the selection');
 // Harmonic Window may re-apply after selection. It must not restore the unfiltered count.
 await page.evaluate(()=>window.dispatchEvent(new Event('relphi:sky-harmonic-window-model-changed')));
 await page.waitForTimeout(200);
 const reappliedCount=await page.evaluate(()=>({
   count:Number(document.getElementById('skyFoundationRelationshipCount').dataset.matchCount),
   shown:[...document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row')].filter(row=>getComputedStyle(row).display!=='none').length
 }));
 assert.equal(reappliedCount.count,reappliedCount.shown,'Harmonic Window re-apply must respect the temporary selection count');
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
   const count=document.getElementById('skyFoundationRelationshipCount');
   return {excluded:rows.filter(row=>row.classList.contains('is-wheel-selection-excluded')).length,
     sameRows:rows.length===window.__unfilteredRelationshipNodes.length&&rows.every((row,i)=>row===window.__unfilteredRelationshipNodes[i]),
     moonLocked:!!document.querySelector('#skyFoundationWheelMount [data-interactive="placement"][data-sky="B"][data-placement="moon"].is-selected'),
     shown:rows.filter(row=>getComputedStyle(row).display!=='none').length,
     count:Number(count.dataset.matchCount),ariaLabel:count.getAttribute('aria-label')};
 });
 assert.equal(restored.excluded,0,'Real blank-area click restores temporarily hidden Relationships tiles');
 assert.equal(restored.sameRows,true,'Blank-area clear restores the full list in its original order without rebuilding');
 assert.equal(restored.moonLocked,false,'Blank-area clear also removes the Moon B wheel selection');
 assert.equal(restored.count,restored.shown,'Clearing Moon B restores the normal displayed match count');
 assert.equal(restored.count,baseline.count,'Clearing Moon B restores the original count');
 assert.equal(restored.ariaLabel,restored.shown+' matching relationships','Accessible count must restore after clear');
 console.log('PASS Moon B temporarily updates match count and restores it after real blank-area click');
 // Regression: Sky B's Where and When drawer must not rewrite or flash
 // the existing dimmed comparison-wheel aspect lines while editing.
 await moon.click({force:true});
 await page.waitForTimeout(300);
 assert.equal(await moon.evaluate(node=>node.classList.contains('is-selected')),true,'Moon B should be locked for Where and When regression');
 const whereB=page.locator('#skyFoundationB [data-sky-drawer-tab="where"]');
 await whereB.waitFor({timeout:10000});
 await whereB.click();
 await page.locator('#skyFoundationB .sky-where-when-editor').waitFor();
 await page.waitForFunction(()=>document.documentElement.dataset.skyWhereWhenEditing==='true');
 await page.waitForTimeout(300); // allow opening transition and draft preview to settle
 const editingStability=await page.evaluate(async()=>{
   const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
   const lines=[...wheel.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')];
   const changes=[],before=lines.map(node=>({
     node,cls:node.getAttribute('class'),style:node.getAttribute('style'),hidden:node.hidden,
     display:getComputedStyle(node).display
   }));
   const observer=new MutationObserver(records=>records.forEach(r=>changes.push({
     attr:r.attributeName,id:r.target.dataset.relationIndex,old:r.oldValue,
     now:r.target.getAttribute(r.attributeName)
   })));
   for(const node of lines)observer.observe(node,{attributes:true,attributeFilter:['class','style','hidden','aria-hidden'],attributeOldValue:true});
   let samples=0,displayChanges=0;
   const prior=lines.map(line=>getComputedStyle(line).display);
   const deadline=performance.now()+1500;
   await new Promise(resolve=>{
     function sample(){
       samples++;
       lines.forEach((line,i)=>{
         const display=getComputedStyle(line).display;
         if(display!==prior[i]){displayChanges++;prior[i]=display}
       });
       if(performance.now()<deadline)requestAnimationFrame(sample);else resolve();
     }
     requestAnimationFrame(sample);
   });
   observer.disconnect();
   return {count:lines.length,mutations:changes.length,displayChanges,samples,
     changes:changes.slice(0,12),sameWheel:wheel===document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel'),
     sameLines:before.every(({node})=>node.isConnected),
     stillEditing:document.documentElement.dataset.skyWhereWhenEditing==='true'};
 });
 console.log('WHERE_WHEN_ASPECT_VISIBILITY_TRACE',JSON.stringify(editingStability));
 assert.ok(editingStability.count>0,'The fixture must have comparison-wheel aspects');
 assert.equal(editingStability.sameWheel,true,'Opening Where and When must preserve the wheel');
 assert.equal(editingStability.stillEditing,true,'The Where and When transaction must remain active');
 assert.equal(editingStability.displayChanges,0,'No aspect line can flash between hidden and visible during editing');
 assert.equal(editingStability.mutations,0,'No aspect line visibility writer should mutate a frozen wheel during editing');

 // Observe aspect-line visibility across real Sky B drawer switches.
 await page.evaluate(()=>{
   const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
   const lines=[...wheel.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')];
   const original=lines.map(line=>({display:getComputedStyle(line).display,opacity:getComputedStyle(line).opacity}));
   const records=[],frames=[];let previous=original.map(x=>x.display);
   const observer=new MutationObserver(items=>{
     for(const r of items)records.push({type:r.attributeName,old:r.oldValue,
       now:r.target.getAttribute(r.attributeName),index:lines.indexOf(r.target)});
   });
   lines.forEach(node=>observer.observe(node,{attributes:true,attributeOldValue:true,
     attributeFilter:['class','style','hidden','aria-hidden']}));
   window.__wwDrawerTransition={wheel,lines,original,records,frames,observer,active:true};
   const sample=()=>{
     const session=window.__wwDrawerTransition;if(!session?.active)return;
     let toggles=0;
     lines.forEach((line,i)=>{const next=getComputedStyle(line).display;
       if(next!==previous[i]){toggles++;previous[i]=next}});
     if(toggles)frames.push({time:performance.now(),toggles,where:document.documentElement.dataset.skyWhereWhenEditing,
       wheelIsolation:wheel.classList.contains('has-isolation')});
     requestAnimationFrame(sample);
   };
   requestAnimationFrame(sample);
 });
 const placementsB=page.locator('#skyFoundationB [data-sky-drawer-tab="placements"]');
 await placementsB.click();
 await page.waitForFunction(()=>document.documentElement.dataset.skyWhereWhenEditing==='false');
 await page.waitForTimeout(700);
 await whereB.click();
 await page.waitForFunction(()=>document.documentElement.dataset.skyWhereWhenEditing==='true');
 await page.waitForTimeout(700);
 await placementsB.click();
 await page.waitForFunction(()=>document.documentElement.dataset.skyWhereWhenEditing==='false');
 await page.waitForTimeout(700);
 const transition=await page.evaluate(()=>{
   const {wheel,lines,original,records,frames,observer}=window.__wwDrawerTransition;
   window.__wwDrawerTransition.active=false;observer.disconnect();
   const changed=lines.filter((line,i)=>getComputedStyle(line).display!==original[i].display);
   const classes=records.filter(x=>x.type==='class');
   const styles=records.filter(x=>x.type==='style');
   const visibility=records.filter(x=>x.type==='hidden'||x.type==='aria-hidden');
   return {count:lines.length,wheelPreserved:wheel===document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel'),
     sameLines:lines.every(x=>x.isConnected),changes:records.length,
     classChanges:classes.length,styleChanges:styles.length,visibilityChanges:visibility.length,
     displayTransitions:frames.reduce((n,x)=>n+x.toggles,0),displayFrames:frames.slice(0,16),
     finalDisplayDifference:changed.length,
     sampleChanges:records.slice(0,18)};
 });
 console.log('WHERE_WHEN_DRAWER_TRANSITION_TRACE',JSON.stringify(transition));
 assert.ok(transition.wheelPreserved&&transition.sameLines,'Drawer switching must keep the same comparison wheel and aspect lines');
 assert.equal(transition.displayTransitions,0,'Switching Where and When / Placements must never blank or reveal gray aspect lines');
 assert.equal(transition.finalDisplayDifference,0,'Returning to Placements must preserve the exact initial line display');
 assert.equal(transition.visibilityChanges,0,'Unchanged drawer switches must not rewrite any SVG visibility attributes');
 assert.equal(transition.classChanges,0,'Unchanged drawer switches must not mutate aspect-line classes');
 assert.equal(transition.styleChanges,0,'Unchanged drawer switches must not restyle aspect-line visibility');
 console.log('PASS Sky B Where and When / Placements drawer switching preserves gray aspects without flashing');
 console.log('PASS Sky B Where and When holds every existing gray aspect line steady');
 console.log('PASS locked Moon B shows matching Relationships only, clear restores all');
  console.log('PASS helper popup -> Increase to HR 3 -> select Moon B -> leave remains selected');
  console.log('PASS Moon B wheel and side-panel clicks persist, including after Harmonic Window 2→3 transition');
}finally{await browser.close()}
