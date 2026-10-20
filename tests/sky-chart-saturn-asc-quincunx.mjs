import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const sky={
 name:'Saturn–Ascendant quincunx',
 houseSystem:'porphyry',
 calcProfile:{dateTime:'2026-10-20T09:30:00',instant:'2026-10-20T15:30:00.000Z',location:'Salt Lake City, Utah',latitude:40.7608,longitude:-111.8910,timeZone:'America/Denver',houseSystem:'porphyry',houseCusps:Array.from({length:12},(_,i)=>(160.05+i*30)%360)},
 houseCusps:Array.from({length:12},(_,i)=>(160.05+i*30)%360),
 placements:{
  Sun:{name:'Sun',longitude:207},Moon:{name:'Moon',longitude:316.1833},
  Mercury:{name:'Mercury',longitude:230.0667},Venus:{name:'Venus',longitude:213},
  Mars:{name:'Mars',longitude:132.5667},Jupiter:{name:'Jupiter',longitude:142.7667},
  Saturn:{name:'Saturn',longitude:10.066667,retrograde:true},
  Uranus:{name:'Uranus',longitude:65.05},Neptune:{name:'Neptune',longitude:2.35},
  Pluto:{name:'Pluto',longitude:303.0667},Chiron:{name:'Chiron',longitude:28.6},
  Ascendant:{name:'Ascendant',longitude:160.05},
  Descendant:{name:'Descendant',longitude:340.05},
  'Medium Coeli':{name:'Medium Coeli',longitude:66.65},
  'Imum Coeli':{name:'Imum Coeli',longitude:246.65},
  Lilith:{name:'Lilith',longitude:273.9667},
  'Part of Fortune':{name:'Part of Fortune',longitude:50.8667},
  Vertex:{name:'Vertex',longitude:310.8667},
  'North Node':{name:'North Node',longitude:326.6833},
  'South Node':{name:'South Node',longitude:146.6833}
 }
};
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1300,height:950}});
try{
 await page.addInitScript(fixture=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(fixture));
  localStorage.removeItem('relphiSkyChartB');
  localStorage.setItem('relphiSkyChartLastModeV1','standalone');
  localStorage.setItem('relphiSkyHarmonicWindowV1','1');
 },sky);
 page.on('pageerror',e=>console.log('PAGE ERROR',e.message));
 await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:40000});
 await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
 await page.waitForTimeout(1700);
 async function inspect(stage){
  const out=await page.evaluate(()=>{
   const rows=[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]')];
   const lines=[...document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > line[data-aspect]')];
   const relevant=rows.filter(r=>(r.dataset.leftPlacement==='saturn'&&r.dataset.rightPlacement==='asc')||(r.dataset.leftPlacement==='asc'&&r.dataset.rightPlacement==='saturn')).map(r=>({index:r.dataset.relationIndex,aspect:r.dataset.aspect,orb:r.dataset.sourceOrb,phase:r.dataset.phaseError,cls:r.className,hidden:r.hidden,mode:r.dataset.relationshipMode,display:getComputedStyle(r).display}));
   return{
    wheel:document.querySelector('.sky-foundation-wheel')?.dataset.singleSky,
    rowCount:rows.length,aspectLineCount:lines.length,
    aspectLabels:[...new Set(rows.map(r=>r.dataset.aspect))],
    saturnAsc:relevant,
    saLines:lines.filter(l=>l.dataset.leftPlacement==='saturn'&&l.dataset.rightPlacement==='asc'||l.dataset.leftPlacement==='asc'&&l.dataset.rightPlacement==='saturn').map(l=>({aspect:l.dataset.aspect,orb:l.dataset.orb,cls:l.getAttribute('class')})),
    saturnRows:rows.filter(r=>r.dataset.leftPlacement==='saturn'||r.dataset.rightPlacement==='saturn').slice(0,15).map(r=>[r.dataset.leftPlacement,r.dataset.aspect,r.dataset.rightPlacement,r.dataset.relationshipMode,r.dataset.phaseError,r.className]),
    selected:document.querySelectorAll('.sky-foundation-row.is-selected').length,
    root:{window:document.documentElement.dataset.skyHarmonicWindow,semantics:document.documentElement.dataset.skyRelationshipSemantics,selection:document.documentElement.dataset.skyWheelRelationshipScope,candidates:document.documentElement.dataset.skyWheelRelationshipCandidates},
    empty:document.querySelector('#skyFoundationRelationshipEmpty')?.textContent?.trim(),
    count:document.querySelector('#skyFoundationRelationshipCount')?.textContent
   };
  });
  console.log('DIAGNOSTIC '+stage+' '+JSON.stringify(out));
 }
 await inspect('before');
 // Reproduce the real gesture: pointer lands on the visible, near-exact
 // Saturn/Ascendant aspect line. Dispatching a fake click without coordinates
 // misses nearestAspect() and conceals touch/mouse hit-test regressions.
 const aspectCoordinates=await page.evaluate(()=>{
  const line=[...document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')]
    .find(el=>el.dataset.aspect==='quincunx'&&[el.dataset.leftPlacement,el.dataset.rightPlacement].includes('saturn')&&[el.dataset.leftPlacement,el.dataset.rightPlacement].includes('asc'));
  if(!line)throw new Error('missing Saturn / asc quincunx aspect line');
  const point=line.ownerSVGElement.createSVGPoint(),ctm=line.getScreenCTM();
  point.x=(Number(line.getAttribute('x1'))+Number(line.getAttribute('x2')))/2;
  point.y=(Number(line.getAttribute('y1'))+Number(line.getAttribute('y2')))/2;
  const client=point.matrixTransform(ctm);
  return {x:client.x,y:client.y,identity:[line.dataset.leftSky,line.dataset.leftPlacement,line.dataset.aspect,line.dataset.rightSky,line.dataset.rightPlacement],index:line.dataset.relationIndex,cls:line.getAttribute('class')};
 });
 console.log('LINE CLICK POSITION',JSON.stringify(aspectCoordinates));
 await page.mouse.click(aspectCoordinates.x,aspectCoordinates.y);
 await page.waitForTimeout(650);
 await inspect('after real mouse aspect-line click');
 const clickedState=await page.evaluate(()=>({
   focus:window.RelphiSkyFoundationInteractions?.captureFocus?.(),
   count:document.querySelector('#skyFoundationRelationshipCount')?.textContent,
   lines:[...document.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')].filter(el=>el.dataset.aspect==='quincunx'&&[el.dataset.leftPlacement,el.dataset.rightPlacement].includes('saturn')&&[el.dataset.leftPlacement,el.dataset.rightPlacement].includes('asc')).map(el=>({cls:el.getAttribute('class'),display:getComputedStyle(el).display,opacity:getComputedStyle(el).opacity})),
 }));
 console.log('AFTER REAL CLICK STATE',JSON.stringify(clickedState));
 const candidate=page.locator('#skyFoundationRelationshipList > .sky-foundation-relationship-row[data-relationship-mode="A-A"][data-aspect="quincunx"][data-left-placement="saturn"][data-right-placement="asc"]');
 assert.equal(await candidate.count(),1,'Near-exact A↔A Saturn–Ascendant quincunx should be generated');
 assert.equal(await candidate.isVisible(),true,'Quincunx must pass the 1° harmonic window');
 assert.ok(Math.abs(Number(await candidate.getAttribute('data-source-orb'))-1/60)<.001);

 const saturn=page.locator('#skyFoundationA .sky-foundation-row[data-placement="saturn"]').first();
 console.log('SATURN LEDGER LOCATOR '+await saturn.count());
 if(await saturn.count()){await saturn.click();await page.waitForTimeout(700);await inspect('after Saturn selected');}
 const asc=page.locator('#skyFoundationA .sky-foundation-row[data-placement="asc"]').first();
 console.log('ASC LEDGER LOCATOR '+await asc.count());
 if(await asc.count()){await asc.click();await page.waitForTimeout(700);await inspect('after asc selected');}
 const sort=page.locator('select[data-relationship-sort]');
 if(await sort.count()){
  await sort.selectOption('most-challenging');
  await page.waitForTimeout(450);await inspect('after most challenging sort');
 }
 for(const selector of ['#skyFoundationWheelMount [data-interactive="placement"][data-sky="A"][data-placement="saturn"]','#skyFoundationWheelMount [data-interactive="placement"][data-sky="A"][data-placement="asc"]','#skyFoundationWheelMount [data-layer="aspects"] > line[data-aspect="quincunx"][data-left-placement="saturn"][data-right-placement="asc"]:not(.sky-foundation-aspect-hit)']){
  const locator=page.locator(selector).first();
  console.log('WHEEL TARGET',selector,await locator.count());
  if(!await locator.count())continue;
  await locator.dispatchEvent('click',{button:0,clientX:380,clientY:320});
  await page.waitForTimeout(500);
  await inspect('after wheel click '+selector);
 }

 console.log('TRANSITION comparison -> standalone');
 await page.evaluate(fixture=>{
  const b=JSON.parse(JSON.stringify(fixture));b.name='Sky B';for(const item of Object.values(b.placements))item.longitude=(Number(item.longitude)+1)%360;
  localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
  window.dispatchEvent(new Event('storage'));
 },sky);
 await page.waitForTimeout(900);
 await inspect('in comparison');
 await page.evaluate(()=>{
   localStorage.removeItem('relphiSkyChartB');
   window.dispatchEvent(new Event('relphi:sky-b-removed'));
   window.dispatchEvent(new Event('storage'));
 });
 await page.waitForTimeout(1200);
 await inspect('after removing Sky B');
 const stale=page.locator('#skyFoundationRelationshipList > .sky-foundation-relationship-row[data-relationship-mode="A-B"]');
 assert.equal(await stale.count(),0,'Removing Sky B must remove stale A↔B relationships');
 assert.equal(await candidate.count(),1,'Removing Sky B must preserve generated A↔A aspects');
 assert.equal(await candidate.isVisible(),true,'Nearly exact Saturn–Ascendant quincunx remains available');

 if(await saturn.count()){await saturn.click();await page.waitForTimeout(800);await inspect('after reselecting Saturn following sky removal')}
 assert.equal(await candidate.isVisible(),true,'Clicking Saturn after returning to standalone must not blank its quincunx');
 assert.ok(Number(await page.locator('html').getAttribute('data-sky-wheel-relationship-candidates'))>=1,'At least one candidate must survive selected Saturn');
 console.log('PASS: exact A↔A quincunx remains visible across sorting, wheel activation, and Sky B removal.');
}finally{await browser.close()}
