import {chromium} from 'playwright';
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
 if(await saturn.count()){await saturn.click();await page.waitForTimeout(800);await inspect('after reselecting Saturn following sky removal')}
}finally{await browser.close()}
