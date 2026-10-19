import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30;return{name,longitude:value,sign:SIGNS[sign],degree:Math.floor(within),minute:Math.floor((within%1)*60),second:0}};
function sky(name,offset){const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360),raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,Chiron:74.48,'North Node':40.3,'South Node':220.3,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};return{name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,placement(k,v+offset)]))}}
await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b));localStorage.setItem('relphiSkyChartLastModeV1','comparison')},{a:sky('Sky A',0),b:sky('Sky B',6)});
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy')==='false',{timeout:30000});
await page.waitForFunction(()=>document.querySelectorAll('#skyFoundationWheelMount [data-interactive="aspect"]').length>0,{timeout:30000});
const lines=page.locator('#skyFoundationWheelMount [data-interactive="aspect"]:not(.sky-foundation-aspect-hit)');
const line=lines.first();
const identity=await line.evaluate(n=>[n.dataset.leftSky,n.dataset.leftPlacement,n.dataset.aspect,n.dataset.rightSky,n.dataset.rightPlacement].join(':'));
const bounds=await line.boundingBox();assert.ok(bounds,'Aspect line has geometry');
await line.dispatchEvent('click');
assert.equal(await page.locator('#skyFoundationWheelMount .sky-foundation-wheel.has-isolation').count(),1,'aspect click must isolate');
assert.ok(await page.locator('#skyFoundationWheelMount [data-focus-piece="aspect"].is-kept').count()>0,'an aspect must remain illuminated');
await line.dispatchEvent('click');
assert.equal(await page.locator('#skyFoundationWheelMount .sky-foundation-wheel.has-isolation').count(),0,'second click must clear');
const house=page.locator('#skyFoundationWheelMount [data-interactive="house"]').first();
await house.evaluate(node=>{node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));});
assert.equal(await page.locator('#skyFoundationWheelMount .sky-foundation-wheel.has-isolation').count(),1,'house must isolate');
assert.ok(await page.locator('#skyFoundationWheelMount [data-focus-piece="house"].is-kept').count()>0,'house must stay lit');
await page.locator('#skyFoundationWheelMount .sky-foundation-wheel').evaluate(node=>node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window})));
assert.equal(await page.locator('#skyFoundationWheelMount .sky-foundation-wheel.has-isolation').count(),0,'empty wheel click must clear');

/* Physical touch, not dispatchEvent: detect tappable pixels from hit testing on
   the rendered SVG, then use Chromium's touchscreen on those pixels. */
await page.locator('#skyFoundationWheelMount .sky-foundation-wheel').scrollIntoViewIfNeeded();
await page.evaluate(()=>window.addEventListener('relphi:sky-foundation-filter-changed',e=>{window.__mobileTestLastFilter=e.detail?.state}));
const findTouchPoint=async(kind,scope=null)=>page.evaluate(({kind,scope})=>{
  const wheel=document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel');
  const nodes=[...wheel.querySelectorAll('[data-interactive="'+kind+'"]')].filter(node=>node.getClientRects().length&&!node.classList.contains('sky-foundation-aspect-hit'));
  const width=window.innerWidth,height=window.innerHeight;
  const markers=[...wheel.querySelectorAll('[data-layer="placements"] [data-interactive="placement"]')].map(n=>n.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0);
  for(const node of nodes){
    const rect=node.getBoundingClientRect(),minX=Math.max(2,rect.left),maxX=Math.min(width-2,rect.right),minY=Math.max(2,rect.top),maxY=Math.min(height-2,rect.bottom);
    if(minX>=maxX||minY>=maxY)continue;
    for(let iy=1;iy<=9;iy++)for(let ix=1;ix<=9;ix++){
      const x=minX+(maxX-minX)*ix/10,y=minY+(maxY-minY)*iy/10;
      const top=document.elementFromPoint(x,y)?.closest?.('[data-interactive]');
      if(top?.dataset.interactive!==kind)continue;
      if(kind==='aspect'&&scope&&top.dataset.relationshipMode!==scope)continue;
      if(kind==='house'){
        // Chromium intentionally touch-adjusts a finger toward nearby glyphs.
        // Do not call a glyph-targeting gesture a failed house-sector tap.
        const nearGlyph=markers.some(r=>x>=r.left-25&&x<=r.right+25&&y>=r.top-25&&y<=r.bottom+25);
        if(nearGlyph)continue;
        const slot=top.dataset.sky,h=top.dataset.house;
        const eligible=[...wheel.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')]
          .some(line=>line.dataset.leftSky===slot&&line.dataset.leftHouse===h||line.dataset.rightSky===slot&&line.dataset.rightHouse===h);
        if(!eligible)continue;
      }
      if(kind==='sign'){
        const sign=top.dataset.sign;
        const eligible=[...wheel.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')]
          .some(line=>(line.dataset.leftSign===sign||line.dataset.rightSign===sign)&&getComputedStyle(line).display!=='none');
        if(!eligible)continue;
      }
      if(kind==='aspect'&&(!top.dataset.leftPlacement||!top.dataset.rightPlacement))continue;
      return{x,y,sky:top.dataset.sky,house:top.dataset.house,sign:top.dataset.sign,
        leftSky:top.dataset.leftSky,left:top.dataset.leftPlacement,aspect:top.dataset.aspect,
        rightSky:top.dataset.rightSky,right:top.dataset.rightPlacement};
    }
  }
  return null;
},{kind,scope});
const focus=()=>page.evaluate(()=>{
 const wheel=document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel');
 return{active:wheel?.classList.contains('has-isolation'),
 selected:[...wheel.querySelectorAll('[data-interactive].is-selected')].map(n=>({kind:n.dataset.interactive,sky:n.dataset.sky,house:n.dataset.house,sign:n.dataset.sign,aspect:n.dataset.aspect,left:n.dataset.leftPlacement,right:n.dataset.rightPlacement})),
 keptAspects:[...wheel.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect.is-kept:not(.sky-foundation-aspect-hit)')].map(n=>({aspect:n.dataset.aspect,left:n.dataset.leftPlacement,right:n.dataset.rightPlacement,leftSky:n.dataset.leftSky,rightSky:n.dataset.rightSky,leftHouse:n.dataset.leftHouse,rightHouse:n.dataset.rightHouse,leftSign:n.dataset.leftSign,rightSign:n.dataset.rightSign,hidden:getComputedStyle(n).display==='none'})),
 keptEndpoints:[...wheel.querySelectorAll('[data-layer="placements"] > g.is-kept')].map(n=>n.dataset.sky+':'+n.dataset.placement),
 dimmedVisible:[...wheel.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.is-kept):not(.sky-foundation-aspect-hit)')].filter(n=>getComputedStyle(n).display!=='none').length,
 eligibleHidden:[...wheel.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.is-kept):not(.sky-foundation-aspect-hit)')].filter(n=>!['sky-chart-orb-hidden','sky-orb-filter-hidden','sky-chart-filter-hidden','sky-chart-multiselect-hidden','sky-chart-aspect-multiselect-hidden','sky-chart-house-multiselect-hidden','sky-chart-sign-filter-hidden','sky-chart-semantic-hidden'].some(c=>n.classList.contains(c))&&getComputedStyle(n).display==='none').length};
});
await page.evaluate(()=>{window.__focusTrace=[];window.addEventListener('relphi:sky-foundation-filter-changed',e=>{window.__focusTrace.push({event:'filter',state:e.detail?.state});});for(const type of ['click','pointerdown','pointerup','pointercancel'])window.addEventListener(type,e=>window.__focusTrace.push({event:type,kind:e.target.closest?.('[data-interactive]')?.dataset.interactive,what:e.target.closest?.('[data-interactive]')?.getAttribute('aria-label'),trusted:e.isTrusted,pointer:e.pointerType}),true);});
const touchAspect=await findTouchPoint('aspect');
assert.ok(touchAspect,'a real aspect stroke must be hit-testable on mobile');
await page.touchscreen.tap(touchAspect.x,touchAspect.y);
await page.waitForTimeout(850);
let state=await focus();
console.log('FIRST ASPECT TOUCH TRANSITIONS',touchAspect,state.selected,await page.evaluate(()=>window.__focusTrace.slice(-15)));
assert.ok(state.active,'touch aspect must persist after finger release and compatibility-click delay');
assert.ok(state.keptAspects.length>0,'touch aspect must keep an aspect line');
assert.ok(state.keptEndpoints.length>=2,'touch aspect must keep both endpoints');
assert.equal(state.eligibleHidden,0,'unmatched eligible lines must remain visible but dimmed (orb-excluded lines may stay hidden)');
console.log('Touch aspect: persistent selection and endpoints verified');
await page.touchscreen.tap(touchAspect.x,touchAspect.y);
await page.waitForTimeout(250);
state=await focus();
console.log('SECOND ASPECT TAP STATE',touchAspect,state.selected,state.keptAspects.slice(0,3));
assert.equal(state.active,false,'touching the selected aspect a second time clears');
await page.evaluate(()=>{window.__touchTrace=[];for(const type of ['pointerdown','pointerup','click'])document.addEventListener(type,e=>{if(e.clientX>240&&e.clientX<300&&e.clientY>380&&e.clientY<430)window.__touchTrace.push({type,phase:'capture',kind:e.target.closest?.('[data-interactive]')?.dataset.interactive,what:e.target.closest?.('[data-interactive]')?.getAttribute('aria-label'),trusted:e.isTrusted,pointer:e.pointerType,x:e.clientX,y:e.clientY})},true)});
const touchHouse=await findTouchPoint('house');
assert.ok(touchHouse,'a house sector with eligible aspects must be hit-testable on mobile');
await page.touchscreen.tap(touchHouse.x,touchHouse.y);
await page.waitForTimeout(850);
state=await focus();
assert.ok(state.active,'touch house must persist after release');
console.log('HOUSE COMPARE DEBUG',touchHouse,JSON.stringify({active:state.active,selected:state.selected,keptAspects:state.keptAspects.length}),await page.evaluate(({x,y})=>({last:window.__mobileTestLastFilter,hit:document.elementFromPoint(x,y)?.outerHTML.slice(0,220),trace:window.__touchTrace}),touchHouse));
assert.ok(state.selected.some(n=>n.kind==='house'&&n.sky===touchHouse.sky&&n.house===touchHouse.house),'correct house must be selected');
assert.ok(state.keptAspects.some(n=>n.leftSky===touchHouse.sky&&n.leftHouse===touchHouse.house||n.rightSky===touchHouse.sky&&n.rightHouse===touchHouse.house),'house must keep matching lines');
console.log('Touch house: matching lines including conjunctions verified');
const touchSign=await findTouchPoint('sign');
assert.ok(touchSign,'a sign sector must be hit-testable on mobile');
await page.touchscreen.tap(touchSign.x,touchSign.y);
await page.waitForTimeout(850);
state=await focus();
assert.ok(state.active,'touch sign must persist after release');
assert.ok(state.selected.some(n=>n.kind==='sign'&&n.sign===touchSign.sign),'touch sign replaces house selection');
assert.ok(state.keptAspects.some(n=>n.leftSign===touchSign.sign||n.rightSign===touchSign.sign),'sign must keep its matching aspect lines');
console.log('Touch sign: replacement and matching lines verified');
const whitespace=await page.evaluate(()=>{
 const wheel=document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel'),svg=wheel.matches('svg')?wheel:wheel.querySelector('svg');
 const r=svg.getBoundingClientRect();
 for(let iy=2;iy<=18;iy++)for(let ix=2;ix<=18;ix++){
   const x=r.left+r.width*ix/20,y=r.top+r.height*iy/20;
   if(x<2||y<2||x>innerWidth-2||y>innerHeight-2)continue;
   const node=document.elementFromPoint(x,y);
   if(wheel.contains(node)&&!node.closest?.('[data-interactive]'))return{x,y};
 }
 return null;
});
assert.ok(whitespace,'a blank point within the wheel must exist');
await page.touchscreen.tap(whitespace.x,whitespace.y);
await page.waitForTimeout(250);
state=await focus();
assert.equal(state.active,false,'touching blank wheel space must clear isolation');
assert.equal(state.keptAspects.length,0,'blank wheel clear removes kept marks');
console.log('Touch whitespace: cleared without hiding wheel verified');


/* Verify explicit replacements and toggle-off are exact, across all three
   relationship scopes, not just the A-A stroke first hit by the finger. */
const scopeCounts=await page.evaluate(()=>{
 const wheel=document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel');
 return Object.fromEntries(['A-A','A-B','B-B'].map(mode=>[mode,[...wheel.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')].filter(n=>n.dataset.relationshipMode===mode).length]));
});
console.log('Rendered relationship scopes',scopeCounts);
assert.ok(scopeCounts['A-A']>0,'A-A wheel geometry must exist');
assert.ok(scopeCounts['A-B']>0,'A-B wheel geometry must exist with two skies');
assert.ok(scopeCounts['B-B']>0,'B-B wheel geometry must exist with two skies');

const activateScope=async(mode)=>{
  const hit=await findTouchPoint('aspect',mode);
  assert.ok(hit,'a physical '+mode+' aspect stroke must be hit-testable on mobile');
  await page.touchscreen.tap(hit.x,hit.y);
  await page.waitForTimeout(850);
  const selection=await focus();
  const identity=[hit.leftSky,hit.left,hit.aspect,hit.rightSky,hit.right].join('|');
  assert.ok(selection.active,mode+' physical touch must lock isolation');
  assert.ok(selection.keptAspects.some(n=>[n.leftSky,n.left,n.aspect,n.rightSky,n.right].join('|')===identity),mode+' correct line must be kept');
  for(const endpoint of [hit.leftSky+':'+hit.left,hit.rightSky+':'+hit.right])assert.ok(selection.keptEndpoints.includes(endpoint),mode+' must keep '+endpoint);
  assert.ok(selection.keptAspects.every(n=>[n.leftSky,n.left,n.aspect,n.rightSky,n.right].join('|')===identity),mode+' touch must isolate exact relationship');
  console.log(mode+' physical relationship selection verified');
  return {id:identity,hit};
};
const ab=await activateScope('A-B');
const bb=await activateScope('B-B');
assert.notEqual(ab.id,bb.id,'tapping a different relationship must replace the old one');
const aa=await activateScope('A-A');
assert.notEqual(aa.id,bb.id,'A-A must replace B-B without residual endpoints');
console.log('Exact A-A, A-B and B-B replacement verified');

// Keyboard interaction must use the same authoritative lock and toggle logic.
const keyboardHouse=page.locator('#skyFoundationWheelMount [data-interactive="house"][data-sky="B"][data-house="2"]').first();
await keyboardHouse.focus();
await page.keyboard.press('Enter');
state=await focus();
assert.ok(state.active&&state.selected.some(n=>n.kind==='house'&&n.sky==='B'&&n.house==='2'),'Enter activates Sky B house');
await page.keyboard.press('Enter');
state=await focus();
assert.equal(state.active,false,'second Enter clears the same Sky B house');
console.log('Keyboard House activation and toggle-off verified');

// A dragged finger must not trigger click selection on pointerup.
const gesture=await findTouchPoint('house');
assert.ok(gesture,'touch drag needs an available house sector');
const session=await page.context().newCDPSession(page);
await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:gesture.x,y:gesture.y}]});
await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:gesture.x+30,y:gesture.y+34}]});
await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
await page.waitForTimeout(850);
state=await focus();
assert.equal(state.active,false,'a finger drag must not turn into a persistent wheel selection');
console.log('Touch pan threshold verified');

assert.deepEqual(errors,[],'no browser errors');
console.log('Sky Chart mobile interaction browser smoke test passed',identity);
await browser.close();
