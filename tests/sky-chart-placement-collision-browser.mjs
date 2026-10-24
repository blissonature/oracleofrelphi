import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

// Positions transcribed from the crowded Oct 23 comparison (degrees of longitude).
// Both signs and house cusps are seeded so the real foundation/collision renderer runs.
const A={Sun:195,Moon:118.4167,Mercury:206.1667,Venus:169.8833,Mars:167.8667,
 Jupiter:307.15,Saturn:235.5667,Uranus:254.85,Neptune:271.0167,Pluto:213.8833,
 Chiron:74.4833,Lilith:44.2333,'Part of Fortune':244.95,Vertex:330.3,
 'Anti-Vertex':150.3,'North Node':40.3,'South Node':220.3,
 Ascendant:168.3667,Descendant:348.3667,Midheaven:76.2667,'Imum Coeli':256.2667};
const B={Sun:210.75,Moon:4.5833,Mercury:230.9667,Venus:210.7333,Mars:134.5667,
 Jupiter:143.3,Saturn:9.8,Uranus:64.9333,Neptune:2.25,Pluto:303.0833,
 Chiron:28.4333,Lilith:274.4,'Part of Fortune':298.6167,Vertex:231.0167,
 'Anti-Vertex':51.0167,'North Node':326.4833,'South Node':146.4833,
 Ascendant:130,Descendant:310,Midheaven:40,'Imum Coeli':220};
function fixture(slot){
 const positions=slot==='A'?A:B,asc=slot==='A'?168.3667:130;
 const houseCusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
 return{name:slot==='A'?'Marisa':'Oct 23, 2026',houseSystem:'porphyry',houseCusps,
 calcProfile:{instant:'2026-10-24T00:28:12.000Z',dateTime:'2026-10-23T18:28:12',timeZone:'America/Denver',latitude:40.76,longitude:-111.89,houseSystem:'porphyry',houseCusps},
 placements:Object.fromEntries(Object.entries(positions).map(([name,longitude])=>[name,{name,longitude}]))};
}
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:980}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
 await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
 await page.addInitScript(({a,b})=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
  localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
  localStorage.setItem('relphiSkyChartLastModeV1','comparison');
 },{a:fixture('A'),b:fixture('B')});
 await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel')?.dataset.placementCollisionOrder?.includes('same-sign'),{timeout:30000});
 await page.waitForTimeout(650);
 const result=await page.evaluate(()=>{
  const wheel=document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel'),spec=window.RelphiSkyWheelSpec.comparison;
  const parse=(group)=>{
   const match=group.getAttribute('transform')?.match(/translate\(\s*(-?[0-9.eE+]+)[ ,]+(-?[0-9.eE+]+)/);
   const x=match?Number(match[1]):NaN,y=match?Number(match[2]):NaN;
   return {id:group.dataset.placement,exact:Number(group.dataset.exactLongitude),display:Number(group.dataset.displayLongitude),
     x,y,fallback:group.dataset.placementOrderFallback,offset:Number(group.dataset.placementTangentialOffset),
     lane:Number(group.dataset.placementLane)};
  };
  const report={metadata:{order:wheel.dataset.placementCollisionOrder,crossings:wheel.dataset.placementLeaderCrossings,
   leaderHits:wheel.dataset.placementLeaderGlyphHits},radius:spec.placementBubbleRadius,slots:{}};
  for(const slot of ['A','B']){
   const raw=[...wheel.querySelectorAll('[data-layer="placements"] > g[data-sky="'+slot+'"][data-placement]:not([data-angle-axis="true"]):not([data-placement="moon-range"])')];
   const items=raw.map(parse).filter(g=>Number.isFinite(g.x)&&Number.isFinite(g.y));
   report.slots[slot]={rawCount:raw.length,sample:raw.slice(0,5).map(g=>({name:g.dataset.placement,transform:g.getAttribute('transform')}))};
   const collisions=[];
   for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
    const a=items[i],b=items[j],distance=Math.hypot(a.x-b.x,a.y-b.y),
      needed=2*spec.placementBubbleRadius+2;
    if(distance<needed)collisions.push({a:a.id,b:b.id,distance:Number(distance.toFixed(2)),needed});
   }
   report.slots[slot]={...report.slots[slot],items:items.length,fallBacks:items.filter(x=>x.fallback==='true').map(x=>x.id),
    collisions,items:items.filter(x=>collisions.some(c=>c.a===x.id||c.b===x.id))};
  }
  return report;
 });
 console.log('GLYPH_COLLISION_TRACE',JSON.stringify(result));
 assert.ok(result.slots.A.items>=14&&result.slots.B.items>=14,'Both crowded skies must render their ordinary placements');
 assert.equal(result.slots.A.collisions.length,0,'Sky A placement glyph orbs must not overlap');
 assert.equal(result.slots.B.collisions.length,0,'Sky B placement glyph orbs must not overlap');
 assert.deepEqual(errors,[]);
 console.log('PASS crowded Oct 23 A/B placement glyph orbs do not overlap');
}finally{await browser.close()}
