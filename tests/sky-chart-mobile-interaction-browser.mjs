import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30;return{name,longitude:value,sign:SIGNS[sign],degree:Math.floor(within),minute:Math.floor((within%1)*60),second:0}};
function sky(name,offset){const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360),raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,Chiron:74.48,'North Node':40.3,'South Node':220.3,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};return{name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,placement(k,v+offset)]))}}
await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b))},{a:sky('Sky A',0),b:sky('Sky B',6)});
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
console.log('HOUSE BEFORE',await house.evaluate(n=>({html:n.outerHTML.slice(0,500),interactive:n.dataset.interactive,focus:n.dataset.focusPiece})));
await house.evaluate(node=>{node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));});
console.log('HOUSE AFTER',await page.evaluate(()=>({wheel:document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel')?.className?.baseVal,selected:[...document.querySelectorAll('.is-selected')].map(n=>n.outerHTML.slice(0,120)),bound:document.querySelector('#skyFoundationRoot')?.dataset.foundationInteractionsV2Bound})));
assert.equal(await page.locator('#skyFoundationWheelMount .sky-foundation-wheel.has-isolation').count(),1,'house must isolate');
assert.ok(await page.locator('#skyFoundationWheelMount [data-focus-piece="house"].is-kept').count()>0,'house must stay lit');
await page.locator('#skyFoundationWheelMount .sky-foundation-wheel').evaluate(node=>node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window})));
assert.equal(await page.locator('#skyFoundationWheelMount .sky-foundation-wheel.has-isolation').count(),0,'empty wheel click must clear');

/* Physical touch, not dispatchEvent: detect tappable pixels from hit testing on
   the rendered SVG, then use Chromium's touchscreen on those pixels. */
await page.locator('#skyFoundationWheelMount .sky-foundation-wheel').scrollIntoViewIfNeeded();
const findTouchPoint=async(kind)=>page.evaluate((kind)=>{
  const wheel=document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel');
  const nodes=[...wheel.querySelectorAll('[data-interactive="'+kind+'"]')].filter(node=>node.getClientRects().length&&!node.classList.contains('sky-foundation-aspect-hit'));
  const width=window.innerWidth,height=window.innerHeight;
  for(const node of nodes){
    const rect=node.getBoundingClientRect(),minX=Math.max(2,rect.left),maxX=Math.min(width-2,rect.right),minY=Math.max(2,rect.top),maxY=Math.min(height-2,rect.bottom);
    if(minX>=maxX||minY>=maxY)continue;
    for(let iy=1;iy<=9;iy++)for(let ix=1;ix<=9;ix++){
      const x=minX+(maxX-minX)*ix/10,y=minY+(maxY-minY)*iy/10;
      const top=document.elementFromPoint(x,y)?.closest?.('[data-interactive]');
      if(top?.dataset.interactive!==kind)continue;
      if(kind==='house'){
        const slot=top.dataset.sky,h=top.dataset.house;
        const eligible=[...wheel.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')]
          .some(line=>line.dataset.leftSky===slot&&line.dataset.leftHouse===h||line.dataset.rightSky===slot&&line.dataset.rightHouse===h);
        if(!eligible)continue;
      }
      if(kind==='aspect'&&(!top.dataset.leftPlacement||!top.dataset.rightPlacement))continue;
      return{x,y,sky:top.dataset.sky,house:top.dataset.house,sign:top.dataset.sign,
        leftSky:top.dataset.leftSky,left:top.dataset.leftPlacement,aspect:top.dataset.aspect,
        rightSky:top.dataset.rightSky,right:top.dataset.rightPlacement};
    }
  }
  return null;
},kind);
const focus=()=>page.evaluate(()=>{
 const wheel=document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel');
 return{active:wheel?.classList.contains('has-isolation'),
 selected:[...wheel.querySelectorAll('[data-interactive].is-selected')].map(n=>({kind:n.dataset.interactive,sky:n.dataset.sky,house:n.dataset.house,sign:n.dataset.sign,aspect:n.dataset.aspect,left:n.dataset.leftPlacement,right:n.dataset.rightPlacement})),
 keptAspects:[...wheel.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect.is-kept:not(.sky-foundation-aspect-hit)')].map(n=>({aspect:n.dataset.aspect,left:n.dataset.leftPlacement,right:n.dataset.rightPlacement,leftSky:n.dataset.leftSky,rightSky:n.dataset.rightSky,leftHouse:n.dataset.leftHouse,rightHouse:n.dataset.rightHouse,leftSign:n.dataset.leftSign,rightSign:n.dataset.rightSign,hidden:getComputedStyle(n).display==='none'})),
 keptEndpoints:[...wheel.querySelectorAll('[data-layer="placements"] > g.is-kept')].map(n=>n.dataset.sky+':'+n.dataset.placement),
 dimmedVisible:[...wheel.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.is-kept):not(.sky-foundation-aspect-hit)')].filter(n=>getComputedStyle(n).display!=='none').length,
 eligibleHidden:[...wheel.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.is-kept):not(.sky-foundation-aspect-hit)')].filter(n=>!['sky-chart-orb-hidden','sky-orb-filter-hidden','sky-chart-filter-hidden','sky-chart-multiselect-hidden','sky-chart-aspect-multiselect-hidden','sky-chart-house-multiselect-hidden','sky-chart-sign-filter-hidden','sky-chart-semantic-hidden'].some(c=>n.classList.contains(c))&&getComputedStyle(n).display==='none').length};
});
const touchAspect=await findTouchPoint('aspect');
assert.ok(touchAspect,'a real aspect stroke must be hit-testable on mobile');
await page.touchscreen.tap(touchAspect.x,touchAspect.y);
await page.waitForTimeout(850);
let state=await focus();
console.log('PHYSICAL ASPECT STATE',touchAspect,state);
assert.ok(state.active,'touch aspect must persist after finger release and compatibility-click delay');
assert.ok(state.keptAspects.length>0,'touch aspect must keep an aspect line');
assert.ok(state.keptEndpoints.length>=2,'touch aspect must keep both endpoints');
assert.equal(state.eligibleHidden,0,'unmatched eligible lines must remain visible but dimmed (orb-excluded lines may stay hidden)');
console.log('PHYSICAL ASPECT',touchAspect,state);
await page.touchscreen.tap(touchAspect.x,touchAspect.y);
await page.waitForTimeout(250);
state=await focus();
assert.equal(state.active,false,'touching the selected aspect a second time clears');
const touchHouse=await findTouchPoint('house');
assert.ok(touchHouse,'a house sector with eligible aspects must be hit-testable on mobile');
await page.touchscreen.tap(touchHouse.x,touchHouse.y);
await page.waitForTimeout(850);
state=await focus();
console.log('PHYSICAL HOUSE STATE',touchHouse,state);
assert.ok(state.active,'touch house must persist after release');
assert.ok(state.selected.some(n=>n.kind==='house'&&n.sky===touchHouse.sky&&n.house===touchHouse.house),'correct house must be selected');
assert.ok(state.keptAspects.some(n=>n.leftSky===touchHouse.sky&&n.leftHouse===touchHouse.house||n.rightSky===touchHouse.sky&&n.rightHouse===touchHouse.house),'house must keep matching lines');
console.log('PHYSICAL HOUSE',touchHouse,state);
const touchSign=await findTouchPoint('sign');
assert.ok(touchSign,'a sign sector must be hit-testable on mobile');
await page.touchscreen.tap(touchSign.x,touchSign.y);
await page.waitForTimeout(850);
state=await focus();
assert.ok(state.active,'touch sign must persist after release');
assert.ok(state.selected.some(n=>n.kind==='sign'&&n.sign===touchSign.sign),'touch sign replaces house selection');
assert.ok(state.keptAspects.some(n=>n.leftSign===touchSign.sign||n.rightSign===touchSign.sign),'sign must keep its matching aspect lines');
console.log('PHYSICAL SIGN',touchSign,state);
const whitespace=await page.evaluate(()=>{
 const wheel=document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel'),svg=wheel.querySelector('svg');
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
console.log('PHYSICAL BLANK',whitespace,state);

assert.deepEqual(errors,[],'no browser errors');
console.log('Sky Chart mobile interaction browser smoke test passed',identity);
await browser.close();
