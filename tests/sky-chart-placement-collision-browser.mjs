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
   const matrix=group.transform.baseVal.consolidate()?.matrix;
   const x=matrix?.e,y=matrix?.f;
   return {id:group.dataset.placement,exact:Number(group.dataset.exactLongitude),display:Number(group.dataset.displayLongitude),
     x,y,fallback:group.dataset.placementOrderFallback,offset:Number(group.dataset.placementTangentialOffset),
     lane:Number(group.dataset.placementLane),authoredLane:Number(group.dataset.placementAuthoredLane)};
  };
  const report={metadata:{order:wheel.dataset.placementCollisionOrder,crossings:wheel.dataset.placementLeaderCrossings,
   leaderHits:wheel.dataset.placementLeaderGlyphHits,
   ariesSearch:wheel.dataset.placementCrowdedTraceB0||''},radius:spec.placementBubbleRadius,slots:{}};
  for(const slot of ['A','B']){
   const raw=[...wheel.querySelectorAll('[data-layer="placements"] > g[data-sky="'+slot+'"][data-placement]:not([data-angle-axis="true"]):not([data-placement="moon-range"])')];
   const parsed=raw.map(parse);const items=parsed.filter(g=>Number.isFinite(g.x)&&Number.isFinite(g.y));
   report.slots[slot]={rawCount:raw.length,sample:raw.slice(0,5).map(g=>({name:g.dataset.placement,transform:g.getAttribute('transform')})),parsed:parsed.slice(0,5)};
   const collisions=[];
   for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
    const a=items[i],b=items[j],distance=Math.hypot(a.x-b.x,a.y-b.y),
      needed=2*spec.placementBubbleRadius+2;
    if(distance<needed)collisions.push({a:a.id,b:b.id,distance:Number(distance.toFixed(2)),needed});
   }
   // Compare the actual SVG transform against the wheel center rather than
   // trusting only the lane attribute written by the solver.
   const offRing=items.filter(item=>Math.abs(Math.hypot(item.x-600,item.y-600)-item.authoredLane)>0.01)
     .map(item=>({name:item.id,radius:Math.hypot(item.x-600,item.y-600),authored:item.authoredLane}));
   report.slots[slot]={...report.slots[slot],items:items.length,offRing,fallBacks:items.filter(x=>x.fallback==='true').map(x=>x.id),
    collisions,collidingItems:items.filter(x=>collisions.some(c=>c.a===x.id||c.b===x.id))};
  }
  return report;
 });
 console.log('GLYPH_COLLISION_TRACE',JSON.stringify(result));
 assert.ok(result.slots.A.items>=14&&result.slots.B.items>=14,'Both crowded skies must render their ordinary placements');
 assert.equal(result.slots.A.collisions.length,0,'Sky A placement glyph orbs must not overlap');
 assert.equal(result.slots.B.collisions.length,0,'Sky B placement glyph orbs must not overlap');
 for(const slot of ['A','B'])assert.deepEqual(result.slots[slot].offRing,[],
   'A placement orb in Sky '+slot+' left its assigned circumference');
 // A house boundary can force an adjusted leader back onto its exact
 // longitude. The resolver must *still* maintain bubble clearance afterward.
 const stressed=await page.evaluate(()=>{
   const source=document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel');
   const wheel=source.cloneNode(true),ns='http://www.w3.org/2000/svg';
   const layer=wheel.querySelector('[data-layer="a-houses"]');
   const line=document.createElementNS(ns,'line'),angle=(171-180)*Math.PI/180;
   const at=r=>({x:600+r*Math.cos(angle),y:600+r*Math.sin(angle)});
   const a=at(170),b=at(323);
   line.classList.add('sky-foundation-divider');
   for(const [k,v] of Object.entries({x1:a.x,y1:a.y,x2:b.x,y2:b.y}))line.setAttribute(k,String(v));
   layer.appendChild(line);
   delete wheel.dataset.placementTangentialClearanceRepairs;
   // Capture the initial geometry; only Sky A's cusp was changed.
   const originalB=[...wheel.querySelectorAll('[data-layer="placements"] > g[data-sky="B"][data-placement]:not([data-angle-axis="true"]):not([data-placement="moon-range"])')]
     .map(g=>{const m=g.transform.baseVal.consolidate()?.matrix;return {name:g.dataset.placement,x:m?.e,y:m?.f}});
   const savedB=wheel.dataset.placementCollisionSignatureB||'';
   window.RelphiPlacementCollisionOrder.arrange(wheel);
   const nodes=[...wheel.querySelectorAll('[data-layer="placements"] > g[data-sky="A"][data-placement]:not([data-angle-axis="true"]):not([data-placement="moon-range"])')];
   const items=nodes.map(group=>{
     const m=group.transform.baseVal.consolidate()?.matrix;
     return {name:group.dataset.placement,x:m?.e,y:m?.f,fallback:group.dataset.placementOrderFallback,
       lane:Number(group.dataset.placementLane),authoredLane:Number(group.dataset.placementAuthoredLane)};
   });
   const collisions=[];
   for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
     const a=items[i],b=items[j],distance=Math.hypot(a.x-b.x,a.y-b.y);
     if(distance<41.4)collisions.push({a:a.name,b:b.name,distance:Number(distance.toFixed(2))});
   }
   const positions=items.map(x=>[x.name,x.x,x.y]);
   const skyBItems=[...wheel.querySelectorAll('[data-layer="placements"] > g[data-sky="B"][data-placement]:not([data-angle-axis="true"]):not([data-placement="moon-range"])')]
     .map(g=>{const m=g.transform.baseVal.consolidate()?.matrix;return {name:g.dataset.placement,
       x:m.e,y:m.f,authored:Number(g.dataset.placementAuthoredLane)}});
   const bOffRing=skyBItems.filter(x=>Math.abs(Math.hypot(x.x-600,x.y-600)-x.authored)>0.01);
   const bMoved=skyBItems.filter(item=>{
     const prior=originalB.find(x=>x.name===item.name);
     return !prior||Math.hypot(prior.x-item.x,prior.y-item.y)>.1;
   }).map(item=>item.name);
   const bSignatureChanged=wheel.dataset.placementCollisionSignatureB!==savedB;
   const bCollisions=[];
   for(let i=0;i<skyBItems.length;i++)for(let j=i+1;j<skyBItems.length;j++){
     const p=skyBItems[i],q=skyBItems[j],distance=Math.hypot(p.x-q.x,p.y-q.y);
     if(distance<41.4)bCollisions.push({a:p.name,b:q.name,distance:+distance.toFixed(3)});
   }
   window.RelphiPlacementCollisionOrder.arrange(wheel);
   const again=[...wheel.querySelectorAll('[data-layer="placements"] > g[data-sky="A"][data-placement]:not([data-angle-axis="true"]):not([data-placement="moon-range"])')]
     .map(g=>{const m=g.transform.baseVal.consolidate()?.matrix;return[g.dataset.placement,m.e,m.f]});
   const leaderHits=[];
   const lines=[...wheel.querySelectorAll('[data-layer="leaders"] line[data-sky="A"][data-placement]:not([data-angle])')];
   for(const line of lines){
     const xa=Number(line.getAttribute('x1')),ya=Number(line.getAttribute('y1'));
     const xb=Number(line.getAttribute('x2')),yb=Number(line.getAttribute('y2'));
     const dx=xb-xa,dy=yb-ya,l2=dx*dx+dy*dy;
     for(const item of items){
       if(item.name===line.dataset.placement)continue;
       const t=l2>1e-9?Math.max(0,Math.min(1,((item.x-xa)*dx+(item.y-ya)*dy)/l2)):0;
       const d=Math.hypot(item.x-(xa+t*dx),item.y-(ya+t*dy));
       if(d<23.7)leaderHits.push({line:line.dataset.placement,orb:item.name,d:+d.toFixed(2)});
     }
   }
   const repeatedMovement=Math.max(0,...positions.map(([name,x,y])=>{
     const match=again.find(v=>v[0]===name);
     return match?Math.hypot(match[1]-x,match[2]-y):Infinity;
   }));
   const offRing=items.filter(item=>Math.abs(Math.hypot(item.x-600,item.y-600)-item.authoredLane)>0.01)
     .map(item=>({name:item.name,radius:Math.hypot(item.x-600,item.y-600),authored:item.authoredLane}));
   return {collisions,offRing,bOffRing,bCollisions,bMoved,bSignatureChanged,
     reuseCheckB:wheel.dataset.placementReuseCheckB||'',fallBacks:items.filter(x=>x.fallback==='true').map(x=>x.name),
     repairs:Number(wheel.dataset.placementTangentialClearanceRepairs||0),
     unresolved:Number(wheel.dataset.placementUnresolvedBubbleOverlaps||0),leaderHitPairs:leaderHits,
     repeatedMovement:Number(repeatedMovement.toFixed(4)),
     crossings:wheel.dataset.placementLeaderCrossings,leaderHits:wheel.dataset.placementLeaderGlyphHits};
 });
 console.log('GLYPH_CUSP_STRESS_TRACE',JSON.stringify(stressed));
 assert.equal(stressed.collisions.length,0,'House-divider leader fallback must not reintroduce glyph-orb overlaps');
 assert.deepEqual(stressed.offRing,[],'The cusp-stress repair must keep every orb on its original circumference');
 assert.deepEqual(stressed.leaderHitPairs,[],'No actual SVG leader may intersect an unrelated glyph bubble in the stress case');
 assert.deepEqual(stressed.bOffRing,[],'Sky B must remain on its exact circumference during Sky A house-divider stress');
 assert.deepEqual(stressed.bCollisions,[],'Sky A house-divider changes must not reintroduce Sky B glyph overlap');
 // A synthetic house boundary does not necessarily require a second adjustment:
 // do not demand gratuitous movement merely to register a repair counter.
 assert.ok(stressed.repeatedMovement<0.25,'Repeated collision layout passes must not move glyphs again');
 assert.deepEqual(errors,[]);
 console.log('PASS crowded Oct 23 A/B orbs stay on exact same circumference with no overlaps');
}finally{await browser.close()}
