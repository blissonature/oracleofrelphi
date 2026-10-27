import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';

const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const v=((longitude%360)+360)%360,i=Math.floor(v/30),within=v%30;return{name,longitude:v,sign:signs[i],degree:Math.floor(within),minute:Math.floor((within%1)*60)}};
const makeSky=(name,raw,asc)=>({
  name,houseSystem:'equal-house',houseCusps:Array.from({length:12},(_,i)=>(asc+i*30)%360),
  calcProfile:{houseCusps:Array.from({length:12},(_,i)=>(asc+i*30)%360),houseSystem:'equal-house',dateTime:'2026-10-25T10:00',instant:'2026-10-25T16:00:00.000Z',timeZone:'America/Denver',latitude:40.76,longitude:-111.89},
  placements:Object.fromEntries(Object.entries(raw).map(([name,long])=>[name,placement(name,long)]))
});
const a=makeSky('Sky A',{Sun:195,Moon:118,Mercury:206,Venus:169,Mars:167,Jupiter:307,Saturn:235,Uranus:255,Neptune:271,Pluto:213,Ascendant:168,Midheaven:76},168);
const b=makeSky('Sky B',{Sun:34.18,Moon:94.27,Mercury:43.62,Venus:8.4,Mars:357.55,Jupiter:64.32,Saturn:130.1,Uranus:220,Neptune:255.77,Pluto:192.22,Chiron:31.6},10);
b.calcProfile.timeUnknown=true;
delete b.houseCusps;delete b.calcProfile.houseCusps;
b.calcProfile.dateTime='2026-10-25';delete b.calcProfile.instant;
const ids=['conjunction','semi-sextile','octile','sextile','quintile','square','trine','tri-octile','bi-quintile','quincunx','opposition'];

const browser=await chromium.launch({headless:true});
const getCounts=()=>({
 rows:[...document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row')].reduce((out,node)=>{
  const mode=node.dataset.relationshipMode||'unknown';out[mode]=(out[mode]||0)+1;return out;
 },{}),
 lines:[...document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > *')].reduce((out,node)=>{
  const mode=node.dataset.relationshipMode||'unknown';out[mode]=(out[mode]||0)+1;return out;
 },{}),
 count:document.getElementById('skyFoundationRelationshipCount')?.textContent,
 selectedVisible:!document.getElementById('skySelectedRelationship')?.hidden,
 clearedSlot:document.documentElement.dataset.skyRelationshipResetSlot
});
async function makePage({withB,width,bKnownTime=false}){
 const page=await browser.newPage({viewport:{width,height:940}});
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
 await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
 await page.route('https://nominatim.openstreetmap.org/**',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
 await page.addInitScript(({a,b,ids})=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
  if(b)localStorage.setItem('relphiSkyChartB',JSON.stringify(b));else localStorage.removeItem('relphiSkyChartB');
  localStorage.setItem('relphiSkyChartLastModeV1',b?'comparison':'single');
  localStorage.setItem('relphiSkyHarmonicWindowV1','3');
  localStorage.setItem('relphiSkyAspectMatrixV1',JSON.stringify({'A-A':ids,'B-B':ids,'A-B':ids}));
 },{a,b:withB?(bKnownTime?(()=>{
   const known=structuredClone(b);
   known.calcProfile.timeUnknown=false;
   known.calcProfile.dateTime='2026-10-25T10:00';
   known.calcProfile.instant='2026-10-25T16:00:00.000Z';
   known.houseCusps=Array.from({length:12},(_,i)=>(10+i*30)%360);
   known.calcProfile.houseCusps=[...known.houseCusps];
   return known;
  })():b):null,ids});
 await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
 await page.waitForSelector('#skyFoundationRelationshipList > .sky-intrasky-generated',{timeout:30000});
 if(withB)await page.waitForSelector('#skyFoundationRelationshipList > .sky-intrasky-b-generated',{timeout:30000});
 return{page,errors};
}
async function action(page,slot,command){
 if(command==='remove'&&slot==='B'){
  // Use the same slot-controls command called by the Sky B Remove button.
  const button=page.locator('#skyFoundationB [data-remove-sky-b]').first();
  if(await button.isVisible())await button.click();
  else await page.evaluate(()=>window.RelphiSkySlotControls.removeSkyB());
  return;
 }
 // Navigate through the real Sky Card commands, not a synthetic reset event.
 const open=page.locator('#skyFoundation'+slot+' [data-saved-sky-trigger]').first();
 await open.waitFor({state:'visible'});
 await open.click();
 const button=page.locator('#skySavedSkiesPopover [data-sky-command="'+command+'"]');
 await button.waitFor({state:'visible'});
 await button.click();
}
async function audit(page,slot,remaining){
 const data=await page.evaluate(getCounts);
 const modes=slot==='A'?['A-A','A-B']:['B-B','A-B'];
 for(const mode of modes){
  assert.equal(data.rows[mode]||0,0,'Stale '+mode+' rows after clearing Sky '+slot+': '+JSON.stringify(data));
  assert.equal(data.lines[mode]||0,0,'Stale '+mode+' SVG segments after clearing Sky '+slot+': '+JSON.stringify(data));
 }
 if(remaining)assert.ok((data.rows[remaining]||0)>0,'Other Sky '+remaining+' intrasky relationships must remain');
 else{
  assert.equal(Object.values(data.rows).reduce((a,c)=>a+c,0),0,'No relationships should remain');
  assert.ok(data.count==='0/0'||data.count==='0','Empty relationship count must be zero: '+data.count);
 }
 assert.equal(data.clearedSlot,slot,'Expected slot-specific reset notification');
 assert.equal(data.selectedVisible,false,'Old selected-relationship detail must be hidden');
 return data;
}
try{
 for(const width of [390,1280]){
  for(const cfg of [
   {name:'A New Sky without B',withB:false,slot:'A',command:'new',remaining:null},
   {name:'A New Sky with B',withB:true,slot:'A',command:'new',remaining:'B-B'},
   {name:'A New Sky with B known time',withB:true,bKnownTime:true,slot:'A',command:'new',remaining:'B-B'},
   {name:'B New Sky with A',withB:true,slot:'B',command:'new',remaining:'A-A'},
   {name:'B Remove Sky with A',withB:true,slot:'B',command:'remove',remaining:'A-A'}
  ]){
   const{page,errors}=await makePage({withB:cfg.withB,width,bKnownTime:cfg.bKnownTime});
   try{
    const before=await page.evaluate(getCounts);
    assert.ok((before.rows['A-A']||0)>0,'Fixture needs A-A relationships');
    if(cfg.withB)assert.ok((before.rows['B-B']||0)>0,'Fixture needs B-B relationships');
    // Activate a relationship before clearing to catch orphaned details.
    const first=page.locator('#skyFoundationRelationshipList > .sky-foundation-relationship-row').first();
    await first.click({force:true});
    await action(page,cfg.slot,cfg.command);
    const after=await audit(page,cfg.slot,cfg.remaining);
    const value=await page.evaluate(slot=>localStorage.getItem('relphiSkyChart'+slot),cfg.slot);
    if(cfg.command==='new'&&cfg.slot==='A'){
     assert.equal(Object.keys(JSON.parse(value)?.placements||{}).length,0,'New A payload must be blank');
    }else if(cfg.command==='new'&&cfg.slot==='B'||cfg.command==='remove'){
     assert.equal(value,null,'Sky B must no longer have stored activations');
    }
    await page.waitForTimeout(450);
    const settled=await audit(page,cfg.slot,cfg.remaining);
    // An empty A must leave B's visual wheel, with real B placements
    // and B↔B aspect strokes. Covers both known- and unknown-time B.
    if(cfg.slot==='A'&&cfg.withB){
     await page.locator('#skyFoundationWheelMount > svg.sky-foundation-wheel[data-single-sky="B"]').waitFor({state:'visible',timeout:20000});
     const wheel=await page.evaluate(()=>{
       const chart=document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel');
       const bNodes=[...chart?.querySelectorAll('[data-layer="placements"] > g[data-sky="B"][data-placement]')||[]];
       const aNodes=[...chart?.querySelectorAll('[data-layer="placements"] > g[data-sky="A"][data-placement]')||[]];
       const bAspects=[...chart?.querySelectorAll('[data-layer="aspects"] > line[data-relationship-mode="B-B"]')||[]];
       const shown=bAspects.filter(line=>line.getAttribute('stroke')!=='none'&&!line.hidden&&getComputedStyle(line).display!=='none');
       const bLine=chart?.querySelector('[data-layer="aspects"] > line[data-relationship-mode="B-B"]');
       const center=window.RelphiSkyWheelSpec?.comparison?.center;
       const originalAspectRadius=window.RelphiSkyWheelSpec?.role('A')?.inner-1;
       const endpointRadius=coord=>bLine&&center
         ?Math.hypot(Number(bLine.getAttribute('x'+coord))-center.x,Number(bLine.getAttribute('y'+coord))-center.y)
         :null;
       const aspectStartRadius=endpointRadius(1),aspectEndRadius=endpointRadius(2);
       const bHouses=chart?.querySelectorAll('[data-layer="b-houses"] > path[data-house]').length||0;
       const interactiveBHouses=chart?.querySelectorAll('[data-layer="b-houses"] > path[data-interactive="house"]').length||0;
       return{single:chart?.dataset.singleSky,inner:chart?.dataset.innerSky,
         bPlacements:bNodes.length,aPlacements:aNodes.length,bAspects:bAspects.length,
         paintedBAspects:shown.length,aspectStartRadius,aspectEndRadius,originalAspectRadius,bHouses,interactiveBHouses,
         viewBoxWidth:chart?.viewBox.baseVal.width,
          expectedStandaloneWidth:2*(window.RelphiSkyWheelSpec.comparison.zodiac.outer+24),
          innerRadius:Number(chart?.dataset.singleSkyInnerRadius),
          expectedStandaloneInner:Number(window.RelphiSkyWheelSpec.role('A').inner),
          html:document.getElementById('skyFoundationWheelMount')?.textContent?.slice(0,150)};
     });
     assert.equal(wheel.single,'B','Empty Sky A must display standalone Sky B wheel: '+JSON.stringify(wheel));
     assert.equal(wheel.inner,'B','B identity must control standalone wheel');
     assert.ok(wheel.bPlacements>8,'Retained B placements must be visible: '+JSON.stringify(wheel));
     assert.equal(wheel.aPlacements,0,'Blank A cannot contribute placements');
     assert.ok(wheel.bAspects>0&&wheel.paintedBAspects>0,'Retained B↔B relationships must draw aspects');
     // In the original two-sky wheel every aspect begins and ends at the
     // canonical inner-circle radius, regardless of which sky its planets occupy.
     // The B-only path must not relocate endpoints onto B's outer house ring.
     assert.ok(Math.abs(wheel.aspectStartRadius-wheel.originalAspectRadius)<.01,
       'Aspect start must use the original inner circle: '+JSON.stringify(wheel));
     assert.ok(Math.abs(wheel.aspectEndRadius-wheel.originalAspectRadius)<.01,
       'Aspect end must use the original inner circle: '+JSON.stringify(wheel));
     assert.equal(wheel.bHouses,cfg.bKnownTime?12:0,'Use B house cusps only when B time is known');
     if(cfg.bKnownTime){
       assert.equal(wheel.interactiveBHouses,12,'B houses remain explorable while A editor is open');
       assert.ok(Math.abs(wheel.viewBoxWidth-wheel.expectedStandaloneWidth)<1,
          'B-only should use the compact A standalone viewBox instead of the former B outer comparison ring: '+JSON.stringify(wheel));
        assert.equal(wheel.innerRadius,wheel.expectedStandaloneInner,
          'B-only houses must begin at the canonical A standalone inner radius');
     }
     console.log('PASS_B_ONLY_WHEEL',width,cfg.name,JSON.stringify(wheel));
    }
    assert.deepEqual(errors.filter(e=>/TypeError|ReferenceError|SyntaxError/.test(e)),[],'No uncaught errors');
    console.log('PASS_WORKING_SKY_CLEAR',width,cfg.name,JSON.stringify({before:before.rows,after:after.rows,settled:settled.rows,count:settled.count}));
   }finally{await page.close()}
  }
 }
}finally{await browser.close()}
