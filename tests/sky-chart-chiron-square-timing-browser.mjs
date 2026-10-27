import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';

const placement=(name,longitude,options={})=>({
 name,glyphId:name.toLowerCase().replace(/\s+/g,'-'),longitude,
 ...options
});
const B_INSTANT='2026-10-27T10:05:00.000Z';
const a={
 name:'Sky A natal Moon',houseSystem:'porphyry',
 houseCusps:[168,198,228,258,288,318,348,18,48,78,108,138],
 calcProfile:{instant:'1985-10-08T08:37:00.000Z',dateTime:'1985-10-08T04:37:00',timeZone:'America/New_York',latitude:42.425,longitude:-71.067,houseSystem:'porphyry'},
 placements:{
  Moon:placement('Moon',118+25/60),
  Sun:placement('Sun',195),
  Venus:placement('Venus',169.88)
 }
};
const b={
 name:'Sky B October 27 2026',houseSystem:'porphyry',
 houseCusps:[358,28,58,88,118,148,178,208,238,268,298,328],
 calcProfile:{instant:B_INSTANT,dateTime:'2026-10-27T04:05:00',timeZone:'America/Denver',latitude:40.7608,longitude:-111.8910,houseSystem:'porphyry'},
 placements:{
  Chiron:placement('Chiron',28+15/60), // Rx must be inferred from the dated Chiron ephemeris.
  Sun:placement('Sun',214),
  Mars:placement('Mars',136.3)
 }
};
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:920},hasTouch:width===390,isMobile:width===390});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',r=>r.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',r=>r.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.route('https://nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
  await page.addInitScript(({a,b})=>{
   localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
   localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
   localStorage.setItem('relphiSkyChartLastModeV1','comparison');
   localStorage.setItem('relphiSkyHarmonicWindowV1','1');
   localStorage.setItem('relphiSkyRelationshipDisplayV1','names');
  },{a,b});
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
  const selector='#skyFoundationRelationshipList > .sky-foundation-relationship-row[data-left-sky="A"][data-left-placement="moon"][data-right-sky="B"][data-right-placement="chiron"][data-aspect="square"]';
  await page.locator(selector).waitFor({state:'visible',timeout:25000});
  const row=page.locator(selector);
  assert.equal(await page.evaluate(()=>window.RelphiSkyRetrograde?.forPlacement?.('B','chiron')),true);
  const source=await page.evaluate(()=>({
   method:typeof window.RelphiChironEphemeris?.longitudeAt,
   ephemeris:window.RelphiChironEphemeris?.longitudeAt?.(new Date('2026-10-27T10:05:00Z')),
   backwards:window.RelphiChironEphemeris?.motionAt?.(new Date('2026-10-27T10:05:00Z')).retrograde
  }));
  assert.equal(source.method,'function','Existing local JPL Chiron ephemeris should be used');
  assert.equal(source.backwards,true,'Chiron must be retrograde on supplied transit date');
  await row.click({force:true});
  await row.locator('.inline-rel-detail').waitFor({state:'visible',timeout:10000});
  await row.locator('[data-inline-progressive-token="left-placement"]').waitFor({state:'attached'});
  const timing=await page.waitForFunction(sel=>{
   const row=document.querySelector(sel),slot=row?.querySelector('.inline-rel-transit-window');
   return slot?.dataset.transitKind==='dynamic'&&slot.querySelectorAll('.inline-rel-transit-row').length>=4;
  },selector,{timeout:30000}).then(()=>page.evaluate(sel=>{
   const row=document.querySelector(sel),slot=row.querySelector('.inline-rel-transit-window');
   const fields=[...slot.querySelectorAll('.inline-rel-transit-row')].map(x=>({
     key:x.querySelector('b')?.textContent.trim(),value:x.querySelector('span')?.textContent.trim()
   }));
   const t=window.RelphiRelationshipTransitMeta.exportTimingForRow(row);
   return{kind:slot.dataset.transitKind,fields,model:t};
  },selector));
  assert.equal(timing.kind,'dynamic');
  assert.equal(timing.model.kind,'dynamic');
  assert.ok(Number.isFinite(timing.model.startMs)&&Number.isFinite(timing.model.endMs));
  assert.ok(timing.model.endMs>timing.model.startMs);
  const expected=['Start','Exact','End','Duration','Passes'];
  for(const key of expected)assert.ok(timing.fields.some(f=>f.key===key),'Missing '+key+' in rendered timing');
  assert.ok(!timing.fields.some(f=>/could not|unavailable/i.test(f.value)),'Timing must not say unavailable');
  const labels=await page.evaluate(sel=>{
   const row=document.querySelector(sel);
   return{
    left:row.querySelector('[data-inline-progressive-token="left-placement"] [data-inline-progressive-level="name"]')?.textContent,
    right:row.querySelector('[data-inline-progressive-token="right-placement"] [data-inline-progressive-level="name"]')?.textContent,
    serialized:window.RelphiRelationshipCopySerializer.serialize(row,{level:2}),
    cardA:row.querySelector('.inline-rel-card.sky-a small')?.textContent,
    cardB:row.querySelector('.inline-rel-card.sky-b small')?.textContent
   };
  },selector);
  assert.equal(labels.left,"Sky A's Moon");
  assert.equal(labels.right,"Sky B's Chiron Rx");
  assert.ok(labels.serialized.includes("Sky A's Moon in Cancer"),'Full-detail copy must show source of Moon');
  assert.ok(labels.serialized.includes("Sky B's Chiron Rx in Aries"),'Full-detail copy must show source and Rx');
  assert.ok(labels.serialized.includes('Start ')&&labels.serialized.includes('Duration '),'Semantic copy must include calculated timing');
  assert.equal(labels.cardA,'Sky A');assert.equal(labels.cardB,'Sky B');
  // The progressive name revealed by selecting the placement glyph must match
  // the semantic/copy label and must not create the Rx glyph on direct objects.
  await row.locator('.sky-foundation-relationship-glyph--right').click({force:true});
  const revealed=await row.locator('[data-inline-progressive-token="right-placement"] [data-inline-progressive-level="name"]').innerText();
  assert.equal(revealed,"Sky B's Chiron Rx");
  await page.evaluate(()=>{
   window.__relphiTileCopy='';
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__relphiTileCopy=text}}});
  });
  await row.locator('.inline-rel-tile-copy').click({force:true});
  await page.waitForFunction(()=>!!window.__relphiTileCopy,null,{timeout:5000});
  const copied=await page.evaluate(()=>window.__relphiTileCopy);
  assert.ok(copied.includes("Sky A's Moon")&&copied.includes("Sky B's Chiron Rx"),'Tile copy should be sky-specific and Rx-correct');
  assert.ok(!copied.includes('Timing could not be calculated'),'Tile copy should have transit window data');
  assert.deepEqual(errors,[],'Browser console must have no exceptions');
  console.log('PASS_CHIRON_SQUARE_TIMING_LABELS',width,JSON.stringify({
    orb:'0.16',retrograde:source.backwards,ephemerisLongitude:source.ephemeris,
    labels:[labels.left,labels.right],timing:timing.fields,passes:timing.model.exacts.length,
    copyOK:copied.includes("Sky B's Chiron Rx")
  }));
  await page.close();
 }
}finally{await browser.close()}
