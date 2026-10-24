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
   leaderHits:wheel.dataset.placementLeaderGlyphHits},radius:spec.placementBubbleRadius,
   clearance:Math.max(6,Number(spec.placementClearance)||6),slots:{}};
  for(const slot of ['A','B']){
   const raw=[...wheel.querySelectorAll('[data-layer="placements"] > g[data-sky="'+slot+'"][data-placement]:not([data-angle-axis="true"]):not([data-placement="moon-range"])')];
   const parsed=raw.map(parse);const items=parsed.filter(g=>Number.isFinite(g.x)&&Number.isFinite(g.y));
   report.slots[slot]={rawCount:raw.length,sample:raw.slice(0,5).map(g=>({name:g.dataset.placement,transform:g.getAttribute('transform')})),parsed:parsed.slice(0,5)};
   // Isolated glyphs have no clearance reason to leave their exact notch.
   const signOf=item=>Math.floor(((item.exact%360)+360)%360/30);
   const exactDistance=(a,b)=>Math.hypot(
     a.authoredLane*Math.cos((a.exact-180)*Math.PI/180)-b.authoredLane*Math.cos((b.exact-180)*Math.PI/180),
     a.authoredLane*Math.sin((a.exact-180)*Math.PI/180)-b.authoredLane*Math.sin((b.exact-180)*Math.PI/180));
   const isolated=items.filter(item=>items.every(other=>other===item||
     (signOf(item)!==signOf(other)&&exactDistance(item,other)>2*spec.placementBubbleRadius+Math.max(6,Number(spec.placementClearance)||6)+.2)));
   const displacedIsolated=isolated.filter(item=>Math.abs(item.display-item.exact)>.06)
     .map(item=>({id:item.id,exact:item.exact,display:item.display,offset:item.offset}));
   const meanAbsOffset=items.reduce((sum,item)=>sum+Math.abs(item.display-item.exact),0)/items.length;
   const collisions=[];
   for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
    const a=items[i],b=items[j],distance=Math.hypot(a.x-b.x,a.y-b.y),
      needed=2*spec.placementBubbleRadius+Math.max(6,Number(spec.placementClearance)||6);
    if(distance<needed)collisions.push({a:a.id,b:b.id,distance:Number(distance.toFixed(2)),needed});
   }
   // Compare the actual SVG transform against the wheel center rather than
   // trusting only the lane attribute written by the solver.
   const offRing=items.filter(item=>Math.abs(Math.hypot(item.x-600,item.y-600)-item.authoredLane)>0.01)
     .map(item=>({name:item.id,radius:Math.hypot(item.x-600,item.y-600),authored:item.authoredLane}));
   const aries=slot==='B'?items.filter(item=>['neptune','moon','saturn'].includes(item.id)):[];
   const ariesPairs=[];
   for(let i=0;i<aries.length;i++)for(let j=i+1;j<aries.length;j++){
     const first=aries[i],second=aries[j],distance=Math.hypot(first.x-second.x,first.y-second.y);
     ariesPairs.push({a:first.id,b:second.id,distance:+distance.toFixed(3)});
   }
   report.slots[slot]={...report.slots[slot],ariesPairs,items:items.length,offRing,
     isolated:isolated.map(x=>x.id),displacedIsolated,meanAbsOffset:+meanAbsOffset.toFixed(3),fallBacks:items.filter(x=>x.fallback==='true').map(x=>x.id),
    collisions,collidingItems:items.filter(x=>collisions.some(c=>c.a===x.id||c.b===x.id))};
  }
  return report;
 });
 console.log('GLYPH_COLLISION_TRACE',JSON.stringify(result));
 assert.ok(result.slots.A.items>=14&&result.slots.B.items>=14,'Both crowded skies must render their ordinary placements');
 assert.equal(result.slots.A.collisions.length,0,'Sky A placement glyph orbs must not overlap');
 for(const slot of ['A','B'])assert.deepEqual(result.slots[slot].displacedIsolated,[],
   'An isolated glyph must remain centered on its exact zodiac notch in Sky '+slot);
 assert.equal(result.slots.B.collisions.length,0,'Sky B placement glyph orbs must not overlap');
 assert.equal(result.slots.B.ariesPairs.length,3,'The screenshot regression must include Moon, Neptune and Saturn');
 for(const pair of result.slots.B.ariesPairs)assert.ok(pair.distance>=2*result.radius+result.clearance-.1,
   'Moon/Neptune/Saturn must not overlap: '+JSON.stringify(pair));
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
     if(distance<2*window.RelphiSkyWheelSpec.comparison.placementBubbleRadius+
       Math.max(6,Number(window.RelphiSkyWheelSpec.comparison.placementClearance)||6)-.1)collisions.push({a:a.name,b:b.name,distance:Number(distance.toFixed(2))});
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
     if(distance<2*window.RelphiSkyWheelSpec.comparison.placementBubbleRadius+
       Math.max(6,Number(window.RelphiSkyWheelSpec.comparison.placementClearance)||6)-.1)bCollisions.push({a:p.name,b:q.name,distance:+distance.toFixed(3)});
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
     fallBacks:items.filter(x=>x.fallback==='true').map(x=>x.name),
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
 // Screenshot regression: five Sky B glyphs crowded around the seventh/eighth
 // HOUSE cusp. These placements are Aries placements; the blue division is
 // a house boundary, NOT the Pisces/Aries sign boundary. Keep the fixed ring.
 const boundaryPage=await browser.newPage({viewport:{width:1440,height:980}});
 const cuspB=fixture('B');
 // Aries degrees from the user's Oct 22 Sky B placements. Moon and Fortune
 // are within a degree, with Saturn and Neptune also close, while Chiron
 // occupies late Aries. Set the 8th-house cusp to Aries 7° to exercise the
 // house divider splitting these glyphs into adjacent houses.
 for(const [name,longitude] of Object.entries({
   Neptune:2.25,Chiron:28.4167,Moon:7.9667,Saturn:9.7833,'Part of Fortune':7.0667
 }))cuspB.placements[name].longitude=longitude;
 const cuspAsc=157;
 cuspB.houseCusps=Array.from({length:12},(_,i)=>(cuspAsc+i*30)%360);
 cuspB.calcProfile.houseCusps=[...cuspB.houseCusps];
 await boundaryPage.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
 await boundaryPage.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
 await boundaryPage.addInitScript(({a,b})=>{
   localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
   localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
   localStorage.setItem('relphiSkyChartLastModeV1','comparison');
 },{a:fixture('A'),b:cuspB});
 await boundaryPage.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
 await boundaryPage.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel')?.dataset.placementCollisionOrder?.includes('same-sign'),{timeout:30000});
 await boundaryPage.waitForTimeout(450);
 // Fortune is a derived point in the app, which can overwrite the test's
 // imported longitude. Position its actual rendered SVG group and leader at
 // the user's Aries 7°04′ BEFORE running the collision solver. This ensures
 // the regression really contains five Aries placements on the house cusp.
 await boundaryPage.evaluate(()=>{
   const source=document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel');
   // Work on an independent copy: the site's live-sky observer can rebuild
   // derived Fortune while this regression executes, hiding the real bug.
   const wheel=source.cloneNode(true);
   window.__skyBHouseCuspTestWheel=wheel;
   const group=wheel.querySelector('[data-layer="placements"] > g[data-sky="B"][data-placement="part-of-fortune"]');
   const leader=wheel.querySelector('[data-layer="leaders"] line[data-sky="B"][data-placement="part-of-fortune"]:not([data-angle])');
   if(!group||!leader)throw new Error('Missing Sky B Part of Fortune for screenshot regression');
   const degree=7.0667,rad=(degree-180)*Math.PI/180;
   const lane=Number(group.dataset.placementAuthoredLane||group.dataset.placementLane);
   const radius=Math.hypot(Number(leader.getAttribute('x2'))-600,Number(leader.getAttribute('y2'))-600);
   const point=r=>({x:600+r*Math.cos(rad),y:600+r*Math.sin(rad)}),a=point(lane),b=point(radius);
   group.dataset.exactLongitude=String(degree);
   group.dataset.displayLongitude=String(degree);
   group.setAttribute('transform','translate('+a.x+' '+a.y+')');
   leader.dataset.exactLongitude=String(degree);
   leader.setAttribute('x1',a.x);leader.setAttribute('y1',a.y);
   leader.setAttribute('x2',b.x);leader.setAttribute('y2',b.y);
   delete wheel.dataset.placementCollisionSignatureB;
   window.RelphiPlacementCollisionOrder.arrange(wheel);
 });
 const boundary=await boundaryPage.evaluate(()=>{
   const wheel=window.__skyBHouseCuspTestWheel;
   const bubble=Number(window.RelphiSkyWheelSpec.comparison.placementBubbleRadius),
     clearance=Math.max(6,Number(window.RelphiSkyWheelSpec.comparison.placementClearance)||6);
   const items=[...wheel.querySelectorAll('[data-layer="placements"] > g[data-sky="B"][data-placement]:not([data-angle-axis="true"]):not([data-placement="moon-range"])')]
     .map(g=>{const m=g.transform.baseVal.consolidate()?.matrix;
       return {id:g.dataset.placement,exact:Number(g.dataset.exactLongitude),display:Number(g.dataset.displayLongitude),
         x:m.e,y:m.f,lane:Number(g.dataset.placementAuthoredLane)}});
   const collisions=[];
   for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
     const a=items[i],b=items[j],dist=Math.hypot(a.x-b.x,a.y-b.y);
     if(dist<2*bubble+clearance-.1)collisions.push({a:a.id,b:b.id,distance:+dist.toFixed(3)});
   }
   const ringErrors=items.filter(a=>Math.abs(Math.hypot(a.x-600,a.y-600)-a.lane)>.1).map(a=>a.id);
   const signErrors=items.filter(a=>Math.floor(((a.display%360)+360)%360/30)!==Math.floor(((a.exact%360)+360)%360/30))
     .map(a=>a.id);
   const cluster=items.filter(a=>['neptune','chiron','moon','saturn','part-of-fortune'].includes(a.id))
     .map(a=>({id:a.id,exact:a.exact,display:a.display,offset:+((((a.display-a.exact+540)%360)-180).toFixed(3))}));
   const houseDividerAngles=[...wheel.querySelectorAll('[data-layer="b-houses"] line.sky-foundation-divider')]
     .map(line=>{
       const p=[{x:Number(line.getAttribute('x1')),y:Number(line.getAttribute('y1'))},
                {x:Number(line.getAttribute('x2')),y:Number(line.getAttribute('y2'))}]
          .sort((a,b)=>Math.hypot(b.x-600,b.y-600)-Math.hypot(a.x-600,a.y-600))[0];
       return ((Math.atan2(p.y-600,p.x-600)*180/Math.PI+180)%360+360)%360;
     });
   const ariesHouseCusps=houseDividerAngles.filter(a=>a>2.25&&a<28.4167);
   const splitAcrossHouses=ariesHouseCusps.some(cusp=>
     cluster.some(p=>p.exact<cusp)&&cluster.some(p=>p.exact>cusp));
   const isolated=items.filter(a=>['mercury','uranus','pluto'].includes(a.id));
   return {count:items.length,collisions,ringErrors,signErrors,cluster,ariesHouseCusps,splitAcrossHouses,
     otherOffsets:isolated.map(a=>({id:a.id,offset:+((((a.display-a.exact+540)%360)-180).toFixed(3))})),
     unresolved:wheel.dataset.placementUnresolvedBubbleOverlaps};
 });
 console.log('SKY_B_HOUSE_BOUNDARY_TRACE',JSON.stringify(boundary));
 assert.equal(boundary.cluster.length,5,'The screenshot fixture must contain all five Sky B glyphs');
 assert.ok(boundary.cluster.every(p=>p.exact>=0&&p.exact<30),
   'All five photographed Sky B glyphs must be Aries, split by houses rather than signs');
 assert.ok(boundary.ariesHouseCusps.length>0,'The fixture must draw a Sky B house divider within Aries, separating the five glyphs across houses');
 assert.equal(boundary.splitAcrossHouses,true,'The Sky B Aries placement glyphs must straddle the drawn house divider');
 assert.equal(boundary.count,17,'The crowded cusp fixture must include all Sky B placements');
 assert.deepEqual(boundary.collisions,[],'No blue orb may overlap around Sky B house 7/8 cusp');
 assert.deepEqual(boundary.ringErrors,[],'Even boundary-crowded orbs must remain on their original circle');
 assert.deepEqual(boundary.signErrors,[],'Every blue orb must remain in its true zodiac sign');
 assert.ok(boundary.otherOffsets.every(v=>Math.abs(v.offset)<.1),'Distant placements must stay on their exact notch');
 assert.equal(Number(boundary.unresolved),0,'A feasible five-body Sky B house-cusp cluster must have no unresolved collisions');
 await boundaryPage.close();
 // Probe the genuine five-body Aries/house-cusp cluster under small
 // longitude and house-division changes. Do NOT conflate houses with signs.
 const seamStress=await page.evaluate(()=>{
   const source=document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel');
   const spec=window.RelphiSkyWheelSpec.comparison,clearance=Math.max(6,Number(spec.placementClearance)||6),at=(r,deg)=>{
     const a=(deg-180)*Math.PI/180;return{x:600+r*Math.cos(a),y:600+r*Math.sin(a)};
   };
   const cases=[
     {neptune:2.25,moon:7.9667,'part-of-fortune':7.0667,saturn:9.7833,chiron:28.4167},
     {neptune:1.9,moon:7.5,'part-of-fortune':7.45,saturn:10.1,chiron:28.2},
     {neptune:2.5,moon:7.9,'part-of-fortune':8.0,saturn:8.9,chiron:28.4},
     {neptune:1.8,moon:6.8,'part-of-fortune':6.85,saturn:9.3,chiron:27.9},
     {neptune:3.2,moon:8.6,'part-of-fortune':8.5,saturn:10.0,chiron:28.8}
   ];
   return cases.map((positions,i)=>{
     const wheel=source.cloneNode(true);
     for(const [name,deg] of Object.entries(positions)){
       const group=wheel.querySelector('[data-layer="placements"] > g[data-sky="B"][data-placement="'+name+'"]');
       const leader=wheel.querySelector('[data-layer="leaders"] line[data-sky="B"][data-placement="'+name+'"]:not([data-angle])');
       if(!group||!leader)throw new Error('Missing SVG subject '+name);
       const lane=Number(group.dataset.placementAuthoredLane||group.dataset.placementLane);
       const exactRadius=Math.hypot(Number(leader.getAttribute('x2'))-600,Number(leader.getAttribute('y2'))-600);
       const point=at(lane,deg),exact=at(exactRadius,deg);
       group.dataset.exactLongitude=String(deg);
       group.dataset.displayLongitude=String(deg);
       group.setAttribute('transform','translate('+point.x+' '+point.y+')');
       leader.dataset.exactLongitude=String(deg);
       leader.setAttribute('x1',point.x);leader.setAttribute('y1',point.y);
       leader.setAttribute('x2',exact.x);leader.setAttribute('y2',exact.y);
     }
     // The SVG was cloned from an already solved wheel. Force a fresh solve.
     delete wheel.dataset.placementCollisionSignatureB;
     window.RelphiPlacementCollisionOrder.arrange(wheel);
     const items=[...wheel.querySelectorAll('[data-layer="placements"] > g[data-sky="B"][data-placement]:not([data-angle-axis="true"]):not([data-placement="moon-range"])')]
       .map(g=>{const m=g.transform.baseVal.consolidate()?.matrix;
         return {id:g.dataset.placement,x:m.e,y:m.f,exact:Number(g.dataset.exactLongitude),
           display:Number(g.dataset.displayLongitude),lane:Number(g.dataset.placementAuthoredLane)}});
     const overlaps=[];
     for(let a=0;a<items.length;a++)for(let b=a+1;b<items.length;b++){
       const left=items[a],right=items[b],d=Math.hypot(left.x-right.x,left.y-right.y);
       if(d<2*spec.placementBubbleRadius+clearance-.1)overlaps.push({a:left.id,b:right.id,d:+d.toFixed(2)});
     }
     const misplaced=items.filter(g=>Math.abs(Math.hypot(g.x-600,g.y-600)-g.lane)>.12||
       Math.floor(((g.display%360)+360)%360/30)!==Math.floor(((g.exact%360)+360)%360/30)).map(g=>g.id);
     return {case:i,overlaps,misplaced,unresolved:wheel.dataset.placementUnresolvedBubbleOverlaps,
       repaired:wheel.dataset.placementWholeCircleRepairs||'0'};
   });
 });
 console.log('SKY_B_HOUSE_CUSP_CLUSTER_TRACE',JSON.stringify(seamStress));
 for(const caseResult of seamStress){
   assert.deepEqual(caseResult.overlaps,[],'Sky B house-cusp cluster '+caseResult.case+' must have no touching blue orbs');
   assert.deepEqual(caseResult.misplaced,[],'Sky B house-cusp cluster '+caseResult.case+' must preserve radius and true zodiac sign');
 }
 // The user screenshot identifies the OUTER Sky B house dividers (not sign
 // borders): Saturn should keep a straight radial stalk; Neptune and the
 // South Node must clear the adjacent blue house edges with their full orbs.
 const houseBorder=await page.evaluate(()=>{
   const wheel=document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel').cloneNode(true);
   const ns='http://www.w3.org/2000/svg',c={x:600,y:600},rad=d=>(d-180)*Math.PI/180;
   const polar=(radius,degree)=>({x:c.x+radius*Math.cos(rad(degree)),y:c.y+radius*Math.sin(rad(degree))});
   const layer=wheel.querySelector('[data-layer="b-houses"]');
   // Isolate the two actual radial HOUSE edges at Libra 17.5° and 25°.
   for(const line of [...layer.querySelectorAll('line.sky-foundation-divider')])line.remove();
   const dividerAngles=[197.5,205];
   for(const angle of dividerAngles){
     const line=document.createElementNS(ns,'line');
     const a=polar(414,angle),b=polar(574,angle);
     line.classList.add('sky-foundation-divider');
     for(const [k,v] of Object.entries({x1:a.x,y1:a.y,x2:b.x,y2:b.y}))line.setAttribute(k,String(v));
     layer.appendChild(line);
   }
   const subjects={saturn:188,neptune:196,'south-node':202};
   for(const [id,exact] of Object.entries(subjects)){
     const group=wheel.querySelector('[data-layer="placements"] > g[data-sky="B"][data-placement="'+id+'"]'),
       line=wheel.querySelector('[data-layer="leaders"] line[data-sky="B"][data-placement="'+id+'"]:not([data-angle])');
     if(!group||!line)throw new Error('Missing Sky B '+id+' group or leader');
     const authored=Number(group.dataset.placementAuthoredLane||group.dataset.placementLane);
     const endRadius=Math.hypot(Number(line.getAttribute('x2'))-600,Number(line.getAttribute('y2'))-600);
     const a=polar(authored,exact),b=polar(endRadius,exact);
     group.dataset.exactLongitude=String(exact);group.dataset.displayLongitude=String(exact);
     group.setAttribute('transform','translate('+a.x+' '+a.y+')');
     line.dataset.exactLongitude=String(exact);
     line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);
     line.setAttribute('x2',b.x);line.setAttribute('y2',b.y);
   }
   delete wheel.dataset.placementCollisionSignatureB;
   window.RelphiPlacementCollisionOrder.arrange(wheel);
   const radius=Number(window.RelphiSkyWheelSpec.comparison.placementBubbleRadius);
   const threshold=radius+Math.max(6,Number(window.RelphiSkyWheelSpec.comparison.placementClearance)||6);
   const lines=[...layer.querySelectorAll('line.sky-foundation-divider')].map(line=>({
     a:{x:Number(line.getAttribute('x1')),y:Number(line.getAttribute('y1'))},
     b:{x:Number(line.getAttribute('x2')),y:Number(line.getAttribute('y2'))}
   }));
   const distance=(p,a,b)=>{
     const dx=b.x-a.x,dy=b.y-a.y,denom=dx*dx+dy*dy;
     const t=denom?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/denom)):0;
     return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
   };
   const measured={};
   for(const [id,exact] of Object.entries(subjects)){
     const group=wheel.querySelector('[data-layer="placements"] > g[data-sky="B"][data-placement="'+id+'"]'),
       leader=wheel.querySelector('[data-layer="leaders"] line[data-sky="B"][data-placement="'+id+'"]:not([data-angle])'),
       m=group.transform.baseVal.consolidate()?.matrix;
     const point={x:m.e,y:m.f},authored=Number(group.dataset.placementAuthoredLane),
       display=Number(group.dataset.displayLongitude);
     measured[id]={exact,display,offset:Math.abs(display-exact),
       radius:Math.hypot(point.x-600,point.y-600),authored,
       clearance:Math.min(...lines.map(l=>distance(point,l.a,l.b))),
       leaderStartDistance:Math.hypot(Number(leader.getAttribute('x1'))-point.x,Number(leader.getAttribute('y1'))-point.y),
       straight:Math.abs(display-exact)<.06};
   }
   const all=[...wheel.querySelectorAll('[data-layer="placements"] > g[data-sky="B"][data-placement]:not([data-angle-axis="true"]):not([data-placement="moon-range"])')]
     .map(g=>{const m=g.transform.baseVal.consolidate()?.matrix;return{id:g.dataset.placement,x:m.e,y:m.f}});
   const collisions=[];
   for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){
     const d=Math.hypot(all[i].x-all[j].x,all[i].y-all[j].y);
     if(d<2*radius+6-.1)collisions.push({a:all[i].id,b:all[j].id,d:+d.toFixed(2)});
   }
   return {measured,threshold,collisions};
 });
 console.log('LIBRA_HOUSE_STRAIGHT_LEADERS_TRACE',JSON.stringify(houseBorder));
 assert.deepEqual(houseBorder.collisions,[],'The three Libra placements must not overlap other orbs');
 assert.ok(houseBorder.measured.saturn.straight,'Saturn must keep its radial stalk when no collision needs a bend');
 for(const id of ['neptune','south-node']){
   assert.ok(houseBorder.measured[id].clearance>=houseBorder.threshold-.1,
     id+' orb must clear the blue Sky B house divider');
 }
 for(const [id,item] of Object.entries(houseBorder.measured)){
   assert.ok(Math.abs(item.radius-item.authored)<.12,id+' must stay on the assigned circumference');
   assert.ok(item.leaderStartDistance<.15,id+' leader must begin at the glyph center');
 }
 assert.deepEqual(errors,[]);
 console.log('PASS crowded Oct 23 A/B and five-body Sky B house-cusp cluster stay separated on fixed circles');
}finally{await browser.close()}
