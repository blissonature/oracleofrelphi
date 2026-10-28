import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const fixture=(offset=0)=>{
 const houseCusps=Array.from({length:12},(_,i)=>(168+offset+i*30)%360);
 return {
 name:offset?'Comparison B':'Birth A',
 houseSystem:'porphyry',
 calcProfile:{instant:'2026-10-20T12:00:00.000Z',dateTime:'2026-10-20T06:00:00',timeZone:'America/Denver',latitude:40.76,longitude:-111.89,houseSystem:'porphyry',houseCusps},
 houseCusps,
 placements:{
  Sun:{name:'Sun',longitude:170+offset},Moon:{name:'Moon',longitude:279+offset},
  Mercury:{name:'Mercury',longitude:195+offset},Venus:{name:'Venus',longitude:215+offset},
  Mars:{name:'Mars',longitude:118+offset},Jupiter:{name:'Jupiter',longitude:142+offset},
  Saturn:{name:'Saturn',longitude:13+offset},Uranus:{name:'Uranus',longitude:65+offset},
  Neptune:{name:'Neptune',longitude:3+offset},Pluto:{name:'Pluto',longitude:303+offset},
  Ascendant:{name:'Ascendant',longitude:168+offset},Descendant:{name:'Descendant',longitude:348+offset},
  'Medium Coeli':{name:'Medium Coeli',longitude:258+offset},'Imum Coeli':{name:'Imum Coeli',longitude:78+offset}
 }
}};
const browser=await chromium.launch({headless:true});
const errors=[];
const boot=async(page,compare,harmonicWindow=1)=>{
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({a,b,compare,harmonicWindow})=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
  if(compare)localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
  else localStorage.removeItem('relphiSkyChartB');
  localStorage.setItem('relphiSkyChartLastModeV1',compare?'comparison':'standalone');
  localStorage.setItem('relphiSkyHarmonicWindowV1',String(harmonicWindow));
 },{a:fixture(),b:fixture(17),compare,harmonicWindow});
 await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:40000});
 await page.locator('#skyFoundationRoot[aria-busy="false"]').waitFor({timeout:25000});
 await page.waitForFunction(compare?
  ()=>!!document.querySelector('#skyFoundationWheelMount > svg[data-outer-sky="B"] [data-layer="b-houses"] path[data-house-cusp-start]'):
  ()=>!!document.querySelector('#skyFoundationWheelMount > svg[data-single-sky="A"] [data-layer="a-houses"] path[data-house-cusp-start]'),null,{timeout:20000});
};
async function locationFor(page,slot,house){
 return page.evaluate(({slot,house})=>{
  const layer=slot==='A'?'a-houses':'b-houses';
  const path=document.querySelector('#skyFoundationWheelMount [data-layer="'+layer+'"] > path[data-house="'+house+'"]');
  if(!path)throw new Error('No sector '+slot+house);
  const svg=path.ownerSVGElement,ctm=svg.getScreenCTM();
  // Test real hit targets, not bounding-box centers or assumed house cusp
  // ordering, because overlapping paths can catch a visually wrong point.
  for(const radius of (slot==='A'?[190,235,285,300]:[435,462,495,535,560])){
   for(let deg=0;deg<360;deg+=3){
    const p=svg.createSVGPoint(),rad=deg*Math.PI/180;
    p.x=600+radius*Math.cos(rad);p.y=600+radius*Math.sin(rad);
    const at=p.matrixTransform(ctm);
    if(at.x<15||at.y<15||at.x>innerWidth-15||at.y>innerHeight-15)continue;
    const element=document.elementFromPoint(at.x,at.y);
    const found=element?.closest?.('[data-interactive="house"][data-house][data-sky]');
    if(found?.dataset.house===String(house)&&found?.dataset.sky===slot){
     return{x:at.x,y:at.y,angle:deg,radius,house:found.dataset.house,sky:found.dataset.sky};
    }
   }
  }
  const sectors=[...svg.querySelectorAll('[data-layer="'+layer+'"] > path[data-house]')].map(el=>({house:el.dataset.house,start:el.dataset.houseCuspStart,end:el.dataset.houseCuspEnd,d:el.getAttribute('d')?.slice(0,95)}));
  const hist={};for(const radius of (slot==='A'?[190,235,285,300]:[435,462,495,535,560])){
   for(let deg=0;deg<360;deg+=15){
    const p=svg.createSVGPoint(),rad=deg*Math.PI/180;p.x=600+radius*Math.cos(rad);p.y=600+radius*Math.sin(rad);
    const at=p.matrixTransform(ctm);
    if(at.x<0||at.y<0||at.x>=innerWidth||at.y>=innerHeight)continue;
    const el=document.elementFromPoint(at.x,at.y);
    const found=el?.closest?.('[data-interactive="house"][data-house][data-sky]');
    const key=found?found.dataset.sky+found.dataset.house:(el?.tagName||'none');
    hist[key]=(hist[key]||0)+1;
   }
  }
  throw new Error('No actual hit point for '+slot+' house '+house+' '+JSON.stringify({sectors,hist}));
 },{slot,house});
}
const flash=(page)=>page.evaluate(()=>{
 const layer=document.querySelector('#skyFoundationWheelMount > svg > [data-house-flashlight]');
 return {sky:layer?.dataset.sky,house:layer?.dataset.house,pinned:layer?.dataset.pinned,
  lines:[...(layer?.querySelectorAll('line.sky-house-flashlight-edge')||[])].map(l=>({
   kind:l.dataset.segment,edge:l.dataset.boundary,
   x1:Number(l.getAttribute('x1')),y1:Number(l.getAttribute('y1')),
   x2:Number(l.getAttribute('x2')),y2:Number(l.getAttribute('y2')),
   events:getComputedStyle(l).pointerEvents
  }))};
});
const main=await browser.newPage({viewport:{width:1390,height:1060}});
try{
 await boot(main,true);
 assert.equal((await flash(main)).lines.length,0,'default wheel must have no flashlight strokes');
 const a=await locationFor(main,'A',11);
 console.log('A house target',JSON.stringify(a));
 assert.equal(a.house,'11','Real pointer must land in A house wedge');
 await main.mouse.move(a.x,a.y);
 await main.waitForTimeout(100);
 const hovered=await flash(main);
 console.log('A hovered',JSON.stringify(hovered));
 assert.equal(hovered.sky,'A');assert.equal(hovered.house,'11');
 assert.equal(hovered.lines.length,6,'Two cusps, 3 continuous ring segments each');
 assert.deepEqual(hovered.lines.filter(l=>l.edge==='0').map(l=>l.kind),['home','zodiac','other']);
 assert.ok(hovered.lines.every(l=>l.events==='none'));
 await main.mouse.move(15,15);
 await main.waitForTimeout(100);
 assert.equal((await flash(main)).lines.length,0,'Pointer exit must extinguish temporary light');

 await main.mouse.click(a.x,a.y);
 await main.mouse.move(15,15);
 await main.waitForTimeout(150);
 const pinned=await flash(main);
 console.log('A tapped',JSON.stringify(pinned));
 assert.equal(pinned.sky,'A');assert.equal(pinned.pinned,'true');
 assert.equal(pinned.lines.length,6,'Tap should hold illumination after the pointer leaves');
 await main.mouse.click(a.x,a.y);
 await main.mouse.move(15,15);
 await main.waitForTimeout(150);
 assert.equal((await flash(main)).lines.length,0,'Tapping the same house again must clear it');

 const b=await locationFor(main,'B',12);
 console.log('B house target',JSON.stringify(b));
 assert.equal(b.house,'12','Real pointer must land in B house wedge');
 await main.mouse.click(b.x,b.y);
 await main.mouse.move(15,15);
 await main.waitForTimeout(150);
 const bResult=await flash(main);
 assert.equal(bResult.sky,'B');
 assert.equal(bResult.pinned,'true');
 assert.equal(bResult.lines.length,6);
 assert.deepEqual(bResult.lines.filter(l=>l.edge==='0').map(l=>l.kind),['other','zodiac','home']);
 console.log('B tapped',JSON.stringify(bResult));


 // A house 10: 78–108°. B Uranus: 82° (B house 9, not B house 10).
 const overlap=await browser.newPage({viewport:{width:1390,height:1060}});
 try{
  await boot(overlap,true,4);
  const a10=await locationFor(overlap,'A',10);
  await overlap.mouse.click(a10.x,a10.y);
  await overlap.mouse.move(15,15);
  await overlap.waitForTimeout(180);
  const focus=await overlap.evaluate(()=>{
   const wheel=document.querySelector('#skyFoundationWheelMount > svg');
   const bU=wheel.querySelector('[data-layer="placements"] > g[data-sky="B"][data-placement="uranus"]');
   const bJ=wheel.querySelector('[data-layer="placements"] > g[data-sky="B"][data-placement="jupiter"]');
   const leader=wheel.querySelector('[data-layer="leaders"] > line[data-sky="B"][data-placement="uranus"]');
   const linked=[...wheel.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')]
    .filter(line=>{
      const mode=line.dataset.relationshipMode;
      return ((line.dataset.leftSky==='B'||mode==='B-B')&&line.dataset.leftPlacement==='uranus')||
             ((line.dataset.rightSky==='B'||mode==='B-B')&&line.dataset.rightPlacement==='uranus');
    }).filter(line=>!line.hidden&&line.style.display!=='none');
   const rows=[...document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row')]
    .filter(row=>(row.dataset.leftSky==='B'&&row.dataset.leftPlacement==='uranus')||
                 (row.dataset.rightSky==='B'&&row.dataset.rightPlacement==='uranus'));
   return {house:bU?.dataset.house,uranusKept:bU?.classList.contains('is-kept'),
    leaderKept:leader?.classList.contains('is-kept'),jupiterKept:bJ?.classList.contains('is-kept'),
    linkedCount:linked.length,linkedKept:linked.every(line=>line.classList.contains('is-kept')),
    matchingRows:rows.length,rowsUnexcluded:rows.filter(row=>!row.classList.contains('is-wheel-selection-excluded')).length};
  });
  console.log('Cross-sky house focus',JSON.stringify(focus));
  assert.equal(focus.house,'9','B placement must retain its native house index');
  assert.equal(focus.uranusKept,true,'B Uranus inside A house 10 rays must stay lit');
  assert.equal(focus.leaderKept,true,'B Uranus leader must stay lit');
  assert.equal(focus.jupiterKept,false,'unrelated B placement stays dim');
  assert.ok(focus.linkedCount>0,'fixture requires a visible aspect involving B Uranus');
  assert.equal(focus.linkedKept,true,'visible aspects incident to B Uranus stay lit');
  assert.ok(focus.matchingRows>0&&focus.rowsUnexcluded>0,'linked comparison relationships stay included');
  await overlap.mouse.click(a10.x,a10.y);
  await overlap.mouse.move(15,15);
  await overlap.waitForTimeout(150);
  assert.equal(await overlap.evaluate(()=>document.querySelector('#skyFoundationWheelMount > svg').classList.contains('has-isolation')),false);
 }finally{await overlap.close()}

 const standalone=await browser.newPage({viewport:{width:1200,height:960}});
 try{
  await boot(standalone,false);
  const onlyA=await locationFor(standalone,'A',10);
  await standalone.mouse.move(onlyA.x,onlyA.y);
  await standalone.waitForTimeout(100);
  const only=await flash(standalone);
  assert.equal(only.sky,'A');assert.equal(only.lines.length,4,'No invented comparison ring');
  assert.deepEqual(only.lines.filter(l=>l.edge==='0').map(l=>l.kind),['home','zodiac']);
 }finally{await standalone.close()}
 const mobile=await browser.newContext({viewport:{width:390,height:850},isMobile:true,hasTouch:true});
 try{
  const screen=await mobile.newPage();
  await boot(screen,true);
  await screen.locator('#skyFoundationWheelMount').scrollIntoViewIfNeeded();
  const target=await locationFor(screen,'A',11);
  console.log('Mobile touch target',JSON.stringify(target));
  assert.ok(target.x>=0&&target.x<=390&&target.y>=0&&target.y<=850,'Mobile tap coordinates must be visible');
  await screen.touchscreen.tap(target.x,target.y);
  await screen.waitForTimeout(180);
  const result=await flash(screen);
  console.log('Mobile tap result',JSON.stringify(result));
  assert.equal(result.sky,'A');assert.equal(result.pinned,'true');
  assert.equal(result.lines.length,6);
  assert.equal(await screen.evaluate(()=>document.querySelector('[data-layer="placements"] > g[data-sky="B"][data-placement="mars"]')?.classList.contains('is-kept')),true,
    'Mobile A house 11 must illuminate B Mars at 135° inside its 108°–138° sector');
 }finally{await mobile.close()}
 assert.deepEqual(errors,[],'No browser uncaught exceptions: '+errors);
 console.log('PASS: A/B hover, tap, un-tap, comparison and standalone geometry, mobile house flashlight');
}finally{await browser.close()}
