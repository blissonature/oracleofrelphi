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
 // Clearing focus restores the original DOM rows without rebuilding or resorting.
 await page.evaluate(()=>document.getElementById('skyFoundationRoot').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
 await page.waitForTimeout(100);
 const restored=await page.evaluate(()=>[...document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row[data-relation-index]')].filter(row=>row.classList.contains('is-wheel-selection-excluded')).length);
 assert.equal(restored,0,'Clear lock restores every previously hidden relationship');
 console.log('PASS locked Moon B shows matching Relationships only, clear restores all');
  console.log('PASS helper popup -> Increase to HR 3 -> select Moon B -> leave remains selected');
  console.log('PASS Moon B wheel and side-panel clicks persist, including after Harmonic Window 2→3 transition');
}finally{await browser.close()}
