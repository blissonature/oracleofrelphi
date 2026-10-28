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

async function tipPoint(page){
 return page.evaluate(()=>{
  const cursor=document.getElementById('relphiMobileExplorationCursor'),host=document.getElementById('skyFoundationComparison'),tip=window.RelphiMobileExplorationPointer?.getTip?.();
  const b=host?.getBoundingClientRect();
  if(!tip||!b||!cursor)throw new Error('Cursor tip unavailable');
  return{x:tip.x+b.left,y:tip.y+b.top,dragging:cursor.dataset.dragging};
 });
}
async function gripPoint(page){
 const g=page.locator('#relphiMobileExplorationCursor .relphi-mobile-cursor-cross');
 await g.waitFor({state:'visible'});
 const b=await g.boundingBox();
 if(!b)throw Error('No draggable cross bounds');
 return{x:b.x+b.width/2,y:b.y+b.height/2};
}
async function ringPoint(page,slot,house){
 return page.evaluate(({slot,house})=>{
  const path=document.querySelector('[data-layer="'+(slot==='A'?'a-houses':'b-houses')+'"] > path[data-house="'+house+'"]');
  if(!path)throw Error('Missing '+slot+' house '+house);
  const start=Number(path.dataset.houseCuspStart),end=Number(path.dataset.houseCuspEnd);
  const span=((end-start)%360+360)%360||30;
  const angle=(start+span/2-180)*Math.PI/180,radius=slot==='A'?225:460;
  const svg=path.ownerSVGElement,p=svg.createSVGPoint(),matrix=svg.getScreenCTM();
  p.x=600+radius*Math.cos(angle);p.y=600+radius*Math.sin(angle);
  const q=p.matrixTransform(matrix);
  return {x:q.x,y:q.y};
 },{slot,house});
}
async function zodiacPoint(page,sign){
 return page.evaluate(sign=>{
  const a=(sign*30+15-180)*Math.PI/180,svg=document.querySelector('#skyFoundationWheelMount > svg');
  const p=svg.createSVGPoint();p.x=600+367*Math.cos(a);p.y=600+367*Math.sin(a);
  const q=p.matrixTransform(svg.getScreenCTM());return{x:q.x,y:q.y};
 },sign);
}
async function bodyPoint(page,sky,id){
 const b=await page.locator('[data-layer="placements"] > g[data-sky="'+sky+'"][data-placement="'+id+'"]').boundingBox();
 if(!b)throw Error('No placement '+sky+id);
 return{x:b.x+b.width/2,y:b.y+b.height/2};
}
async function aspectPoint(page){
 return page.evaluate(()=>{
  const wheel=document.querySelector('#skyFoundationWheelMount > svg');
  const lines=[...wheel.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')]
   .filter(line=>!line.hidden&&getComputedStyle(line).display!=='none');
  for(const line of lines){
   const m=line.getScreenCTM(),svg=line.ownerSVGElement;
   if(!m)continue;
   for(const fraction of [.27,.5,.73]){
    const q=svg.createSVGPoint();
    q.x=Number(line.getAttribute('x1'))*(1-fraction)+Number(line.getAttribute('x2'))*fraction;
    q.y=Number(line.getAttribute('y1'))*(1-fraction)+Number(line.getAttribute('y2'))*fraction;
    const p=q.matrixTransform(m);
    if(p.x<55||p.x>innerWidth-55||p.y<45||p.y>innerHeight-45)continue;
    const found=document.elementsFromPoint(p.x,p.y).find(n=>wheel.contains(n));
    if(found?.closest?.('[data-interactive="placement"]'))continue;
    if(found?.closest?.('[data-interactive="aspect"]')||found?.closest?.('[data-layer="aspects"]'))return{x:p.x,y:p.y};
   }
  }
  throw Error('No reachable visible aspect line');
 });
}
async function dragPointer(page,target,commit=true){
 const before=await tipPoint(page),handle=await gripPoint(page);
 const session=page.__relphiTouchSession||(page.__relphiTouchSession=await page.context().newCDPSession(page));
 const pointerTrace=await page.evaluate(({x,y})=>{
  const g=document.querySelector('#relphiMobileExplorationCursor .relphi-mobile-cursor-cross');
  const find=n=>n?{tag:n.tagName,cls:n.getAttribute?.('class')||'',id:n.id||'',
    role:n.getAttribute?.('role')||'',pointerEvents:getComputedStyle(n).pointerEvents,touchAction:getComputedStyle(n).touchAction}:null;
  window.__pointerTouchTrace=[];
  for(const name of ['pointerdown','pointermove','pointerup','pointercancel','gotpointercapture','lostpointercapture']){
    g.addEventListener(name,event=>window.__pointerTouchTrace.push({name,id:event.pointerId,type:event.pointerType,x:event.clientX,y:event.clientY}),{capture:true});
  }
  return {target:find(document.elementFromPoint(x,y)),
   stack:document.elementsFromPoint(x,y).slice(0,6).map(find),
   grip:find(g),svg:find(g.ownerSVGElement),container:find(g.ownerSVGElement.parentElement)};
 },handle);
 console.log('TOUCH_GRIP_HIT_TEST',JSON.stringify(pointerTrace));
 const steps=12,deltaX=target.x-before.x,deltaY=target.y-before.y;
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:handle.x,y:handle.y,id:1}]});
 for(let i=1;i<=steps;i++){
  await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:handle.x+deltaX*i/steps,y:handle.y+deltaY*i/steps,id:1}]});
 }
 await page.waitForTimeout(125);
 const live=await page.evaluate(()=>({
  focus:document.querySelector('#skyFoundationWheelMount svg')?.classList.contains('has-isolation'),
  dragging:document.getElementById('relphiMobileExplorationCursor')?.dataset.dragging,
  flashlight:document.querySelector('#skyFoundationWheelMount [data-house-flashlight]')?.dataset.pinned,
  state:document.querySelector('#skyFoundationWheelMount [data-house-flashlight]')?.dataset.house,
  trace:(window.__pointerTouchTrace||[]).slice(-35),
  tip:(()=>{
   const t=window.RelphiMobileExplorationPointer?.getTip?.(),b=document.getElementById('skyFoundationComparison')?.getBoundingClientRect();
   if(!t||!b)return null;return{x:t.x+b.left,y:t.y+b.top}
  })(),
  hit:(()=>{
   const t=window.RelphiMobileExplorationPointer?.getTip?.(),b=document.getElementById('skyFoundationComparison')?.getBoundingClientRect();
   if(!t||!b)return null;
   const x=t.x+b.left,y=t.y+b.top,svg=document.querySelector('#skyFoundationWheelMount > svg');
   return{coords:{x,y},wheel:svg?.getBoundingClientRect().toJSON(),stack:document.elementsFromPoint(x,y).slice(0,7).map(n=>({tag:n.tagName,cls:n.getAttribute?.('class')||'',layer:n.getAttribute?.('data-layer')||'',interactive:n.getAttribute?.('data-interactive')||'',house:n.getAttribute?.('data-house')||''}))}
  })()
 }));
 if(commit)await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 else await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
 // Keep one CDP touch session for all drags; detaching can disable touch emulation.
 await page.waitForTimeout(150);
 return live;
}
const mobile=await browser.newContext({viewport:{width:390,height:850},isMobile:true,hasTouch:true});
try{
 const page=await mobile.newPage();
 await boot(page,true);
 await page.locator('#skyFoundationWheelMount').scrollIntoViewIfNeeded();
 const startup=await page.evaluate(()=>({
   width:innerWidth,coarse:matchMedia('(max-width: 650px) and (pointer: coarse)').matches,
   pointerFine:matchMedia('(pointer: fine)').matches,
   mediaMax:matchMedia('(max-width:650px)').matches,
   script:!!window.__relphiMobileExplorePointerV1,
   api:!!window.RelphiMobileExplorationPointer,
   root:!!document.getElementById('skyFoundationWheelMount'),
   buttonCount:document.querySelectorAll('.relphi-mobile-pointer-toggle').length,
   cursor:document.querySelector('#relphiMobileExplorationCursor')?.outerHTML.slice(0,350),
   cursorDisplay:document.getElementById('relphiMobileExplorationCursor')&&getComputedStyle(document.getElementById('relphiMobileExplorationCursor')).display,
   toggleDisplay:'absent'
 }));
 console.log('MOBILE_POINTER_STARTUP',JSON.stringify({startup,errors}));
 await page.locator('#relphiMobileExplorationCursor .relphi-mobile-cursor-cross').waitFor({timeout:7000});
 assert.equal(await page.locator('.relphi-mobile-pointer-toggle').count(),0,'No pointer hide/show button should exist');
 assert.equal(await page.evaluate(()=>window.RelphiMobileExplorationPointer?.isEnabled?.()),true);
 assert.equal(await page.locator('#relphiMobileExplorationCursor .relphi-mobile-cursor-arrow').count(),1);
 const visual=await page.evaluate(()=>{
   const cursor=document.getElementById('relphiMobileExplorationCursor'),
     svg=cursor?.querySelector('svg'),grip=cursor?.querySelector('.relphi-mobile-pointer-touch-area'),
     arrow=cursor?.querySelector('.relphi-mobile-cursor-arrow');
   const bounds=cursor?.getBoundingClientRect(),tip=window.RelphiMobileExplorationPointer?.getTip?.();
   return{width:bounds?.width,height:bounds?.height,svgWidth:svg?.getAttribute('width'),
     hitDiameter:Number(grip?.getAttribute('r'))*2*(bounds?.width/150),
     arrow:!!arrow,tip,visualLeft:parseFloat(cursor?.style.left),visualTop:parseFloat(cursor?.style.top)};
 });
 assert.equal(visual.width,75,'Pointer canvas must accommodate offset thumb grip');
 assert.equal(visual.height,73,'Pointer canvas must accommodate offset thumb grip');
 assert.equal(visual.svgWidth,'75');
 const detail=await page.evaluate(()=>{
  const grip=document.querySelector('#relphiMobileExplorationCursor .relphi-mobile-cursor-cross');
  const arrow=document.querySelector('#relphiMobileExplorationCursor .relphi-mobile-cursor-arrow');
  const crossPath=grip.querySelector('path');
  return{center:grip.getAttribute('transform'),crossPath:crossPath.getAttribute('d'),
    arrowWeight:getComputedStyle(arrow).strokeWidth,crossWeight:getComputedStyle(grip).strokeWidth,
    draggable:grip.getAttribute('role')};
 });
 assert.equal(detail.center,'translate(54 111)','Cross must align with the arrow tail at a short visible gap');
 assert.match(detail.crossPath,/M0 -15 V15 M-15 0 H15/,'Navigation cross arms stay clear and have short arrowhead caps');
 assert.equal(detail.arrowWeight,'2.5px','Arrow outline should be thinner');
 assert.equal(detail.crossWeight,'2.4px','Navigation cross should have finer strokes');
 assert.equal(detail.draggable,'button');
 const separation=Math.hypot((54-5)*.5,(111-6)*.5);
 assert.ok(separation>56&&separation<65,'Thumb grip must follow the diagonal and stay close to the tail');
 console.log('PASS_THUMB_TIP_CLEARANCE',separation);

 console.log('PASS_POINTER_VISUAL_DETAIL',JSON.stringify(detail));
 assert.ok(visual.hitDiameter>=40,'Touch grip must keep a comfortable target');
 assert.ok(Math.abs(visual.visualLeft+2.5-visual.tip.x)<.1&&Math.abs(visual.visualTop+3-visual.tip.y)<.1,'Arrow tip remains accurately registered');
 console.log('PASS_COMPACT_POINTER',JSON.stringify(visual));
 const initial=await page.evaluate(()=>{
  const wheel=document.querySelector('#skyFoundationWheelMount > svg').getBoundingClientRect(),
    mount=document.getElementById('skyFoundationComparison').getBoundingClientRect(),
    tip=window.RelphiMobileExplorationPointer.getTip(),
    description=document.createElement('div');
  description.className='sky-wheel-sector-description';
  const wheelHost=document.getElementById('skyFoundationWheelMount');
  wheelHost.append(description);
  const layer=getComputedStyle(description).zIndex;
  description.remove();
  return{tipX:tip.x,tipY:tip.y,expectedX:wheel.right-mount.left-69,
    expectedY:wheel.top-mount.top+25,textZ:Number(layer),
    cursorZ:Number(getComputedStyle(document.getElementById('relphiMobileExplorationCursor')).zIndex)};
 });
 console.log('UPPER_RIGHT_DIAGNOSTIC',JSON.stringify(initial));
 assert.ok(Math.abs(initial.tipX-initial.expectedX)<1&&Math.abs(initial.tipY-initial.expectedY)<30,
  'Pointer must begin at upper-right wheel corner');
 assert.ok(initial.textZ>initial.cursorZ,'Text box must layer above cursor');
 console.log('PASS_POINTER_UPPER_RIGHT_AND_TEXT_OVERLAY',JSON.stringify(initial));
 // A stationary tap is instruction, not a selection; the hint dismisses on blank clicks.
 const grip=await gripPoint(page);
 const session=await page.context().newCDPSession(page);
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:grip.x,y:grip.y,id:7}]});
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.waitForFunction(()=>!document.querySelector('.relphi-mobile-pointer-hint')?.hidden);
 assert.equal(await page.locator('.relphi-mobile-pointer-hint').innerText(),'Drag the cursor to explore the wheel');
 await page.locator('#skyFoundationComparison').click({position:{x:8,y:8},force:true});
 assert.equal(await page.locator('.relphi-mobile-pointer-hint').isVisible(),false);
 console.log('PASS_POINTER_TAP_HELPER');



 const h=await locationFor(page,'A',11);
 console.log('MOBILE_HOUSE_TARGET',JSON.stringify(h));
 const hover=await dragPointer(page,h);
 console.log('MOBILE_HOUSE_HOVER',JSON.stringify(hover));
 assert.equal(hover.dragging,'true','A real touch drag must hold the cross');
 assert.equal(hover.focus,true,'Dragging must illuminate the current house');
 assert.equal(hover.flashlight,'false','Dragging previews house before pinning');
 const pinned=await page.evaluate(()=>{
  const layer=document.querySelector('#skyFoundationWheelMount [data-house-flashlight]');
  const wheel=document.querySelector('#skyFoundationWheelMount > svg');
  return{sky:layer?.dataset.sky,house:layer?.dataset.house,pinned:layer?.dataset.pinned,
   bMars:wheel.querySelector('[data-layer="placements"] > g[data-sky="B"][data-placement="mars"]')?.classList.contains('is-kept'),
   lines:layer?.querySelectorAll('line.sky-house-flashlight-edge').length};
 });
 console.log('MOBILE_HOUSE_PIN',JSON.stringify(pinned));
 const afterFirstTouch=await page.evaluate(()=>{
  const p=document.querySelector('#relphiMobileExplorationCursor'),g=p?.querySelector('.relphi-mobile-cursor-cross');
  return {coarse:matchMedia('(pointer:coarse)').matches,fine:matchMedia('(pointer:fine)').matches,
   pointerHidden:p?.hidden,pointerDisplay:p&&getComputedStyle(p).display,
   gripDisplay:g&&getComputedStyle(g).display,gripBox:g?.getBoundingClientRect().toJSON(),
   pointerConnected:p?.isConnected,aria:document.querySelector('.relphi-mobile-pointer-toggle')?.getAttribute('aria-pressed')};
 });
 console.log('AFTER_FIRST_TOUCH',JSON.stringify(afterFirstTouch));
 assert.deepEqual([pinned.sky,pinned.house,pinned.pinned],['A','11','true']);
 assert.equal(pinned.lines,6);
 assert.equal(pinned.bMars,true,'Comparison-sky Mars inside A H11 rays must stay bright');
 const placement=await bodyPoint(page,'B','venus');
 const dragB=await dragPointer(page,placement);
 const afterPlacement=await page.evaluate(()=>({
  kept:document.querySelector('[data-layer="placements"] > g[data-sky="B"][data-placement="venus"]')?.classList.contains('is-kept'),
  selected:document.querySelector('[data-layer="placements"] > g[data-sky="B"][data-placement="venus"]')?.classList.contains('is-selected')
 }));
 console.log('MOBILE_PLACEMENT',JSON.stringify({hover:dragB,...afterPlacement}));
 assert.equal(afterPlacement.kept,true);
 assert.equal(afterPlacement.selected,true,'Releasing over a placement must pin that placement');
 const sign=await zodiacPoint(page,4);
 await dragPointer(page,sign);
 const afterSign=await page.evaluate(()=>document.querySelector('[data-layer="zodiac"] > path[data-sign="4"]')?.classList.contains('is-selected'));
 assert.equal(afterSign,true,'Arrow tip must select zodiac signs');
 const aspect=await aspectPoint(page);
 await dragPointer(page,aspect);
 const afterAspect=await page.evaluate(()=>({
  origin:window.RelphiSkyFoundationInteractions?.getSelectionOrigin?.(),
  selectedLines:document.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect.is-selected').length
 }));
 console.log('MOBILE_ASPECT',JSON.stringify(afterAspect));
 assert.ok(afterAspect.origin?.kind==='aspect'&&afterAspect.selectedLines>0,'Arrow tip must pin aspect lines');
 assert.equal(await page.locator('.relphi-mobile-pointer-toggle').count(),0,'No hide/show button');
 assert.equal(await page.locator('#relphiMobileExplorationCursor').isVisible(),true,'Pointer stays available');
 assert.deepEqual(errors,[],'No uncaught browser exceptions');
 console.log('PASS mobile real touch: house preview/pin + flashlight, cross-sky endpoints, placements, zodiac, aspects, always-on cursor');
}finally{await mobile.close()}
const desktop=await browser.newPage({viewport:{width:1280,height:900}});
try{
 await boot(desktop,true);
 assert.equal(await desktop.locator('.relphi-mobile-pointer-toggle').isVisible(),false);
 assert.equal(await desktop.locator('#relphiMobileExplorationCursor').isVisible(),false);
 console.log('PASS desktop: mobile cursor hidden, native wheel retained');
}finally{await desktop.close();await browser.close()}
