import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

// Regression from the November 22 screenshot: Part of Fortune is 28°45′ Taurus,
// and the blue seventh/eighth house cusp is near 2° Gemini. The bubble belongs
// near 28°45′ Taurus; it must not be banished ~15° toward early Taurus just to
// give a house divider an excessive, arbitrary visual safety zone.
const B={
 Sun:240+11/60, Moon:30+1, Mercury:210+10+47/60,
 Venus:180+24+13/60, Mars:120+28+34/60, Jupiter:120+26+20/60,
 Saturn:8+14/60, Uranus:60+3+49/60, Neptune:1+44/60,
 Pluto:300+3+23/60, Chiron:27+10/60, Lilith:270+7+40/60,
 'Part of Fortune':30+28+45/60, Vertex:60+6+19/60,
 'Anti-Vertex':240+6+19/60, 'North Node':300+24+55/60,
 'South Node':120+24+55/60
};
const A={
 Sun:195,Moon:118.4167,Mercury:206.1667,Venus:169.8833,Mars:167.8667,
 Jupiter:307.15,Saturn:235.5667,Uranus:254.85,Neptune:271.0167,
 Pluto:213.8833,Chiron:74.4833,Lilith:44.2333,'Part of Fortune':244.95,
 Vertex:330.3,'Anti-Vertex':150.3,'North Node':40.3,'South Node':220.3,
 Ascendant:168.3667,Descendant:348.3667,Midheaven:76.2667,'Imum Coeli':256.2667
};
const origin=process.env.GLYPH_AUDIT_ORIGIN||'http://127.0.0.1:4173';
const base=process.env.SKY_PREVIEW_URL||origin+'/sky-chart.html';
const norm=v=>(v%360+360)%360;
const comparison={
 // The user's screenshot shows an outer-house division close to 2° Gemini,
 // with Moon on the previous side near 1° Taurus.
 asc:212,houseCusps:Array.from({length:12},(_,i)=>norm(212+i*30))
};
function fixture(name,positions,cusps){
 return{name,houseSystem:'porphyry',houseCusps:cusps,
  calcProfile:{instant:'2026-11-22T11:52:54Z',dateTime:'2026-11-22T04:52:54',
    timeZone:'America/Denver',latitude:40.76,longitude:-111.89,
    houseSystem:'porphyry',houseCusps:cusps},
  placements:Object.fromEntries(Object.entries(positions).map(([name,longitude])=>
    [name,{name,longitude}]))};
}
await mkdir('test-results/fortune-collision',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const [viewport,width,height] of [['desktop',1440,980],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height},serviceWorkers:'block'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(!process.env.SKY_PREVIEW_URL){
   await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>
     route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
   await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>
     route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  }
  await page.addInitScript(({a,b})=>{
   localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
   localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
   localStorage.setItem('relphiSkyChartLastModeV1','comparison');
  },{a:fixture('Audit A',A,Array.from({length:12},(_,i)=>norm(168.3667+i*30))),
     b:fixture('Screenshot Sky B',B,comparison.houseCusps)});
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel')?.dataset.placementCollisionOrder?.includes('same-sign')&&
   document.querySelectorAll('[data-layer="b-houses"] line.sky-foundation-divider').length>=10,
    null,{timeout:60000});

  const result=await page.evaluate(({B,houseCusps})=>{
   const original=document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel');
   // A detached copy prevents live ephemeris/derived-Fortune updates from
   // rewriting the provided regression data during this independent solve.
   const wheel=original.cloneNode(true);
   const center={x:600,y:600},rad=degree=>(degree-180)*Math.PI/180;
   const polar=(radius,degree)=>({x:center.x+radius*Math.cos(rad(degree)),
     y:center.y+radius*Math.sin(rad(degree))});
   const bgeometry=window.RelphiSkyWheelSpec.role('B');
   const ns='http://www.w3.org/2000/svg',layer=wheel.querySelector('[data-layer="b-houses"]');
   for(const l of [...layer.querySelectorAll('line.sky-foundation-divider')])l.remove();
   for(const degree of houseCusps){
    const line=document.createElementNS(ns,'line');
    const a=polar(bgeometry.inner,degree),b=polar(bgeometry.outer,degree);
    line.setAttribute('class','sky-foundation-divider');
    for(const [key,value] of Object.entries({x1:a.x,y1:a.y,x2:b.x,y2:b.y}))
      line.setAttribute(key,String(value));
    layer.appendChild(line);
   }
   for(const [name,degree] of Object.entries(B)){
    const normalized=name.toLowerCase().replaceAll(' ','-');
    const id={'anti-vertex':'anti-vertex','north-node':'north-node','south-node':'south-node'}[normalized]||normalized;
    const group=wheel.querySelector('[data-layer="placements"] > g[data-sky="B"][data-placement="'+id+'"]:not([data-angle-axis="true"])');
    if(!group)continue; // Asc/angles are separate; every ordinary subject must exist.
    const line=wheel.querySelector('[data-layer="leaders"] line[data-sky="B"][data-placement="'+id+'"]:not([data-angle])');
    if(!line)throw new Error('Missing exact leader for '+id);
    const lane=Number(group.dataset.placementAuthoredLane||group.dataset.placementLane);
    const endRadius=Math.hypot(Number(line.getAttribute('x2'))-center.x,
      Number(line.getAttribute('y2'))-center.y);
    if(!Number.isFinite(lane)||lane<400||endRadius<350)throw new Error('Unexpected source radius '+id);
    const p=polar(lane,degree),q=polar(endRadius,degree);
    group.setAttribute('transform','translate('+p.x+' '+p.y+')');
    group.dataset.exactLongitude=String(degree);
    group.dataset.displayLongitude=String(degree);
    group.dataset.placementAuthoredLane=String(lane);
    line.dataset.exactLongitude=String(degree);
    line.setAttribute('x1',p.x);line.setAttribute('y1',p.y);
    line.setAttribute('x2',q.x);line.setAttribute('y2',q.y);
   }
   delete wheel.dataset.placementCollisionSignatureB;
   window.RelphiPlacementCollisionOrder.arrange(wheel);
   const all=[...wheel.querySelectorAll('[data-layer="placements"] > g[data-sky="B"][data-placement]:not([data-angle-axis="true"]):not([data-placement="moon-range"])')].map(g=>{
    const m=g.transform.baseVal.consolidate()?.matrix;
    const exact=Number(g.dataset.exactLongitude);
    const display=Number(g.dataset.displayLongitude);
    return {id:g.dataset.placement,exact,display,offset:((display-exact+540)%360)-180,
      x:m.e,y:m.f,lane:Number(g.dataset.placementAuthoredLane),
      fallback:g.dataset.placementOrderFallback,radialRestored:g.dataset.placementRadialLeaderRestored};
   });
   const fortune=all.find(x=>x.id==='part-of-fortune');
   const relevant=all.filter(x=>['part-of-fortune','moon','uranus','vertex'].includes(x.id));
   const spec=window.RelphiSkyWheelSpec.comparison;
   const sep=2*spec.placementBubbleRadius+Math.max(6,spec.placementClearance);
   const collisions=[];
   for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++)
    if(Math.hypot(all[i].x-all[j].x,all[i].y-all[j].y)<sep-.1)
      collisions.push({a:all[i].id,b:all[j].id});
   const houseOf=value=>{
    const cusps=[...houseCusps].sort((a,b)=>a-b),v=((value%360)+360)%360;
    const i=cusps.findLastIndex(x=>x<=v+.00001);return i<0?cusps.length-1:i;
   };
   const wrongHouse=all.filter(x=>houseOf(x.exact)!==houseOf(x.display)).map(x=>x.id);
   const wrongSign=all.filter(x=>Math.floor(x.exact/30)!==Math.floor(x.display/30)).map(x=>x.id);
   const offCircle=all.filter(x=>Math.abs(Math.hypot(x.x-600,x.y-600)-x.lane)>.1).map(x=>x.id);
   const diff=(a,b)=>Math.abs((((a-b+540)%360)-180));
   const nearestCusp=Math.min(...houseCusps.map(d=>diff(d,fortune.exact)));
   return {fortune,relevant,items:all.length,collisions,wrongHouse,wrongSign,offCircle,
     nearestCusp,remaining:wheel.dataset.placementRemainingOverlapsB,
     unresolved:wheel.dataset.placementUnresolvedBubbleOverlaps,
     blocked:wheel.dataset.placementRadialLeaderBlocked,
     crossings:wheel.dataset.placementLeaderCrossings,
     leaderHits:wheel.dataset.placementLeaderGlyphHits};
  },{B,houseCusps:comparison.houseCusps});
  console.log('FORTUNE OPEN HOUSE SECTOR '+viewport.toUpperCase(),JSON.stringify(result));
  assert.ok(result.fortune,'Screenshot's Fortune must be present on the wheel');
  assert.ok(Math.abs(result.fortune.exact-58.75)<.001,'The exact screenshot longitude must be retained');
  assert.equal(result.items,17,'Entire outer wheel is present');
  assert.deepEqual(result.wrongHouse,[],'No placement enters another house');
  assert.deepEqual(result.wrongSign,[],'No placement enters another sign');
  assert.deepEqual(result.offCircle,[],'No placement leaves its original circumference');
  assert.deepEqual(result.collisions,[],'Outer-ring circles maintain 6px clearance');
  assert.ok(Math.abs(result.fortune.offset)<=3.5,
   'Part of Fortune must stay near 28°45 Taurus if its actual house sector has room');
  assert.deepEqual(errors,[],'No runtime errors');
  await page.screenshot({path:'test-results/fortune-collision/'+viewport+'.png',fullPage:true});
  await page.close();
 }
}finally{await browser.close()}
