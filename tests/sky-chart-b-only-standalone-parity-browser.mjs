import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function placement(name,longitude){
 const within=((longitude%360)+360)%360,index=Math.floor(within/30),degree=within%30;
 return{name,longitude:within,sign:SIGNS[index],degree:Math.floor(degree),minute:Math.floor((degree%1)*60)};
}
function fixture(known){
 const cusps=Array.from({length:12},(_,i)=>(19.4+30*i)%360);
 const bodies={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,
 Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,
 Chiron:74.48,'North Node':40.3,'South Node':220.3,Lilith:44.23,
 'Part of Fortune':244.97,Vertex:330.33,Ascendant:19.4,Descendant:199.4,
 Midheaven:76.28,IC:256.28};
 const p={timeUnknown:!known,dateTime:known?'2026-10-27T04:05':'2026-10-27',timeZone:'America/Denver',houseSystem:'equal-house',location:'Salt Lake City, Utah'};
 if(known){p.instant='2026-10-27T10:05:00.000Z';p.houseCusps=cusps}
 const sky={name:'Standalone geometry parity',calcProfile:p,
   placements:Object.fromEntries(Object.entries(bodies).map(([name,lon])=>[name,placement(name,lon)]))};
 if(known)sky.houseCusps=cusps;
 else{
  delete sky.placements.Ascendant;delete sky.placements.Descendant;
  delete sky.placements.Midheaven;delete sky.placements.IC;
  sky.calcProfile.moonRange={start:placement('Moon',116),end:placement('Moon',121)};
 }
 return sky;
}
const browser=await chromium.launch({headless:true});
const round=n=>Number(Number(n).toFixed(3));
async function inspect(slot,known,width){
 const page=await browser.newPage({viewport:{width,height:960},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',r=>r.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
 await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',r=>r.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
 await page.route('https://nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
 await page.addInitScript(({slot,sky})=>{
  const empty={name:'Where and When',placements:{},calcProfile:{},metadata:{}};
  localStorage.setItem('relphiSkyChartA',JSON.stringify(slot==='A'?sky:empty));
  if(slot==='B')localStorage.setItem('relphiSkyChartB',JSON.stringify(sky));
  else localStorage.removeItem('relphiSkyChartB');
  localStorage.setItem('relphiSkyChartLastModeV1',slot==='B'?'comparison':'single');
  localStorage.setItem('relphiSkyHarmonicWindowV1','12');
  localStorage.setItem('relphiSkyAspectMatrixV1',JSON.stringify({'A-A':['conjunction','sextile','square','trine','opposition'],'B-B':['conjunction','sextile','square','trine','opposition'],'A-B':[]}));
 },{slot,sky:fixture(known)});
 await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
 await page.locator('#skyFoundationWheelMount>svg[data-single-sky="'+slot+'"]').waitFor({state:'visible',timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount>svg[data-single-sky]')?.dataset.singleSkySpacing==='ready',{timeout:30000});
 const data=await page.evaluate(slot=>{
  const svg=document.querySelector('#skyFoundationWheelMount>svg[data-single-sky]'),
        c=window.RelphiSkyWheelSpec.comparison.center,
        role=window.RelphiSkyWheelSpec.role('A');
  const circleR=line=>Math.hypot(Number(line.getAttribute('x1'))-c.x,Number(line.getAttribute('y1'))-c.y);
  const parseLine=line=>[...['x1','y1','x2','y2'].map(n=>Number(Number(line.getAttribute(n)).toFixed(3)))];
  const lines=[...svg.querySelectorAll('[data-layer="aspects"] > line[data-relationship-mode="'+slot+'-'+slot+'"]')];
  const actualLines=lines.filter(line=>getComputedStyle(line).display!=='none'&&!line.hidden);
  const leaders=[...svg.querySelectorAll('[data-layer="leaders"] > line.sky-foundation-leader[data-sky="'+slot+'"]')];
  const placements=[...svg.querySelectorAll('[data-layer="placements"] > g[data-sky="'+slot+'"][data-placement]')];
  const houses=[...svg.querySelectorAll('[data-layer="'+(slot==='A'?'a-houses':'b-houses')+'"] > path.sky-foundation-house-sector')];
  const houseNumbers=[...svg.querySelectorAll('[data-layer="'+(slot==='A'?'a-houses':'b-houses')+'"] > text.sky-foundation-house-number')];
  const signs=[...svg.querySelectorAll('[data-layer="zodiac"] > path.sky-foundation-sign-sector')];
  const signGlyphs=[...svg.querySelectorAll('[data-layer="zodiac"] > g.sky-foundation-sign-glyph')];
  const aspects=lines.map(l=>({id:l.dataset.leftPlacement+'|'+l.dataset.rightPlacement+'|'+l.dataset.aspect,
    from:parseLine(l).slice(0,2),to:parseLine(l).slice(2),mode:l.dataset.relationshipMode})).sort((a,b)=>a.id.localeCompare(b.id));
  const related=[...document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row')].map(el=>el.dataset.relationshipMode);
  const geom=v=>Number(Number(v).toFixed(3));
  return{
   slot:svg.dataset.singleSky,innerSky:svg.dataset.innerSky,
   wheelGeometry:svg.dataset.wheelGeometry,ringOrder:svg.dataset.ringOrder,
   degree:geom(svg.dataset.singleSkyDegreeRadius),placementLane:geom(svg.dataset.singleSkyPlacementLane),
   inner:geom(svg.dataset.singleSkyInnerRadius),outer:geom(svg.dataset.singleSkyOuterRadius),
   known:svg.dataset.wheelGeometry==='standalone',
   viewBox:svg.getAttribute('viewBox'),
   houses:houses.map(p=>p.getAttribute('d')),
   houseCount:houses.length,houseNumberCount:houseNumbers.length,
   signs:signs.map(p=>p.getAttribute('d')),signCount:signs.length,
   zodiacGlyphs:signGlyphs.map(el=>el.dataset.zodiacSign),
   leaders:leaders.map(l=>({id:l.dataset.placement,xy:parseLine(l),sky:l.dataset.sky})).sort((a,b)=>a.id.localeCompare(b.id)),
   placements:placements.map(g=>({id:g.dataset.placement,transform:g.getAttribute('transform'),sky:g.dataset.sky,
     lane:geom(g.dataset.placementLane),exact:g.dataset.exactLongitude})).sort((a,b)=>a.id.localeCompare(b.id)),
   allPlacements:[...svg.querySelectorAll('[data-layer="placements"] > g[data-sky]')].map(g=>g.dataset.sky),
   aspectCount:aspects.length,paintedLines:actualLines.length,aspects,
   related,aspectRadii:lines.slice(0,6).flatMap(l=>[circleR(l),Math.hypot(Number(l.getAttribute('x2'))-c.x,Number(l.getAttribute('y2'))-c.y)]).map(geom),
   expectedAspectRadius:geom(role.inner-1),expectedDegree:geom(role.degree),expectedPlacement:geom(role.placement[0]),
   bLeaderColors:leaders.map(l=>l.getAttribute('stroke')),
   outline:[...svg.querySelectorAll('[data-layer="outlines"] > circle')].map(c=>geom(c.getAttribute('r')))
  };
 },slot);
 assert.equal(data.slot,slot);
 assert.equal(data.innerSky,slot);
 assert.equal(data.houseCount,known?12:0,'Known-time sky must render houses; unknown time must not');
 assert.equal(data.houseNumberCount,known?12:0);
 assert.equal(data.signCount,12);
 assert.ok(data.placements.length>8,'All placements should render for the populated slot');
 assert.ok(data.allPlacements.every(s=>s===slot),'Never retain the cleared sky placements');
 assert.ok(data.aspectCount>0&&data.paintedLines>0,'Aspects must be drawn and painted');
 assert.ok(data.related.includes(slot+'-'+slot),'Other sky relationships must remain available');
 assert.equal(data.degree,data.expectedDegree);
 assert.equal(data.placementLane,data.expectedPlacement);
 assert.ok(data.aspectRadii.every(r=>Math.abs(r-data.expectedAspectRadius)<.01),'Aspect endpoints must stay in the original center');
 assert.deepEqual(data.bLeaderColors,[...data.bLeaderColors].fill(slot==='B'?'#2462d0':'#c9211e'));
 assert.deepEqual(errors,[],'Page must not raise exceptions');
 await page.close();
 return data;
}
try{
 for(const width of [390,1280]){
  for(const known of [true,false]){
   const a=await inspect('A',known,width);
   const b=await inspect('B',known,width);
   for(const key of ['wheelGeometry','degree','placementLane','inner','outer','viewBox','houses','signs','zodiacGlyphs','outline','aspectCount','paintedLines']){
    assert.deepEqual(b[key],a[key],'Sky B standalone should occupy precisely Sky A standalone '+key);
   }
   assert.deepEqual(b.leaders.map(x=>({id:x.id,xy:x.xy})),a.leaders.map(x=>({id:x.id,xy:x.xy})),'Leader start and finish coordinates cannot change');
   assert.deepEqual(b.placements.map(x=>({id:x.id,transform:x.transform,lane:x.lane,exact:x.exact})),
    a.placements.map(x=>({id:x.id,transform:x.transform,lane:x.lane,exact:x.exact})),
    'Actual placement bubbles must occupy the identical standalone positions');
   assert.deepEqual(b.aspects.map(x=>({id:x.id,from:x.from,to:x.to})),
    a.aspects.map(x=>({id:x.id,from:x.from,to:x.to})),
    'B↔B aspect geometry must equal A↔A aspect geometry');
   console.log('PASS_B_ONLY_STANDALONE_PARITY',width,known?'known-time':'unknown-time',
    JSON.stringify({houses:b.houseCount,aspects:b.aspectCount,placements:b.placements.length,inner:b.inner,outer:b.outer,
      placementLane:b.placementLane,aspectRadius:b.expectedAspectRadius,ringOrder:b.ringOrder}));
  }
 }
}finally{await browser.close()}
