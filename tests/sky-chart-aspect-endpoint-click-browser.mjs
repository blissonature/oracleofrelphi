import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

// Exercise the actual Sky A/B comparison wheel, including its legacy 28px
// transparent hit envelopes and the existing Placements referent tile owner.
const positions={
 A:{Sun:50,Moon:200,Mercury:80,Venus:170,Mars:260,Jupiter:10,Saturn:350,Uranus:140,Neptune:310,Pluto:20},
 B:{Sun:170,Moon:350,Mercury:320,Venus:230,Mars:110,Jupiter:50,Saturn:140,Uranus:20,Neptune:260,Pluto:290}
};
function sky(slot){
 const asc=slot==='A'?168:185,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
 const placements=Object.fromEntries(Object.entries(positions[slot]).map(([name,longitude])=>[name,{name,longitude}]));
 Object.assign(placements,{
  Ascendant:{name:'Ascendant',longitude:asc},
  Descendant:{name:'Descendant',longitude:(asc+180)%360},
  Midheaven:{name:'Midheaven',longitude:(asc+270)%360},
  IC:{name:'IC',longitude:(asc+90)%360}
 });
 return{name:'Aspect endpoint regression '+slot,houseSystem:'porphyry',houseCusps:cusps,placements,
  calcProfile:{dateTime:'2026-11-14T12:00',instant:'2026-11-14T19:00:00Z',
   timeZone:'America/Denver',latitude:40.7608,longitude:-111.891,
   location:'Salt Lake City, Utah, United States',houseSystem:'porphyry',houseCusps:cusps}};
}
const browser=await chromium.launch({headless:true});
try{
 for(const width of [1280,390]){
  const mobile=width===390;
  const ctx=await browser.newContext({viewport:{width,height:900},isMobile:mobile,hasTouch:mobile});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({
   path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({
   path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.addInitScript(({a,b})=>{
   localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
   localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
   localStorage.setItem('relphiSkyChartLastModeV1','comparison');
   localStorage.setItem('relphiSkyHarmonicWindowV1','4');
   localStorage.removeItem('relphiSkyAspectMatrixV1');
   sessionStorage.removeItem('relphiSkyWhereWhenViewV1');
  },{a:sky('A'),b:sky('B')});
  for(const mode of ['A-B','A-A']){
   await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
   await page.locator('#skyFoundationRoot[aria-busy="false"]').waitFor({timeout:30000});
   await page.waitForFunction(()=>{
    const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
    return wheel?.getAttribute('data-outer-sky')==='B'&&
      document.querySelectorAll('#skyFoundationWheelMount .sky-foundation-aspect-hit').length>10&&
      document.querySelectorAll('#skyFoundationA .sky-foundation-row[data-interactive="placement"]').length>10&&
      document.querySelectorAll('#skyFoundationB .sky-foundation-row[data-interactive="placement"]').length>10;
   },null,{timeout:25000});
   await page.locator('#skyFoundationWheelMount > .sky-foundation-wheel').scrollIntoViewIfNeeded();
   await page.waitForTimeout(180);
   const probe=await page.evaluate((wanted)=>{
    const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
    const root=wheel.querySelector('[data-layer="aspects"]');
    const lines=[...root.querySelectorAll('line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')].filter(line=>{
     const s=getComputedStyle(line);
     return line.dataset.relationshipMode===wanted&&!line.hidden&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>.1;
    });
    const all=[...root.querySelectorAll('line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')].filter(line=>{
     const s=getComputedStyle(line);
     return !line.hidden&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>.1;
    });
    const p=(line,x,y)=>{const out=new DOMPoint(x,y).matrixTransform(line.getScreenCTM());return{x:out.x,y:out.y}};
    const segment=line=>{
     const a=p(line,+line.getAttribute('x1'),+line.getAttribute('y1')),
           b=p(line,+line.getAttribute('x2'),+line.getAttribute('y2'));
     return{line,a,b,length:Math.hypot(b.x-a.x,b.y-a.y)};
    };
    const segments=all.map(segment).filter(s=>s.length>60),bounds=wheel.getBoundingClientRect();
    const distance=(pt,s)=>{
     const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,d=dx*dx+dy*dy;
     const t=d?Math.max(0,Math.min(1,((pt.x-s.a.x)*dx+(pt.y-s.a.y)*dy)/d)):0;
     return Math.hypot(pt.x-(s.a.x+t*dx),pt.y-(s.a.y+t*dy));
    };
    let best=null;
    for(const s of segments.filter(s=>s.line.dataset.relationshipMode===wanted)){
     for(const t of [.32,.47,.63,.72]){
      const at={x:s.a.x+(s.b.x-s.a.x)*t,y:s.a.y+(s.b.y-s.a.y)*t};
      if(at.x<Math.max(0,bounds.left)+20||at.x>Math.min(innerWidth,bounds.right)-20||
         at.y<Math.max(0,bounds.top)+20||at.y>Math.min(innerHeight,bounds.bottom)-20)continue;
      const clearance=Math.min(...segments.filter(o=>o!==s).map(o=>distance(at,o)));
      if(!best||clearance>best.clearance)best={line:s.line,at,clearance};
     }
    }
    if(!best)return null;
    const source=best.line,ghost=all.find(line=>line!==source&&
      (line.dataset.leftPlacement!==source.dataset.leftPlacement||
       line.dataset.rightPlacement!==source.dataset.rightPlacement||
       line.dataset.relationshipMode!==source.dataset.relationshipMode));
    if(!ghost)return null;
    // Deliberately reproduce the defect: a source line is invisible, but its
    // transparent hit envelope is still above a different, *visible* aspect.
    ghost.style.opacity='0';
    const overlay=ghost.cloneNode(false);
    overlay.removeAttribute('class');
    overlay.classList.add('sky-foundation-aspect-hit');
    overlay.removeAttribute('style');
    overlay.removeAttribute('hidden');
    overlay.setAttribute('stroke','transparent');
    overlay.setAttribute('stroke-width','28');
    overlay.setAttribute('pointer-events','stroke');
    overlay.setAttribute('tabindex','-1');
    overlay.setAttribute('aria-hidden','true');
    overlay.dataset.interactive='aspect';
    overlay.dataset.focusPiece='aspect';
    overlay.dataset.testGhost='true';
    for(const key of ['x1','y1','x2','y2'])overlay.setAttribute(key,source.getAttribute(key));
    root.appendChild(overlay);
    const under=document.elementFromPoint(best.at.x,best.at.y);
    const getIdentity=line=>{
     const m=line.dataset.relationshipMode,left=line.dataset.leftPlacement,right=line.dataset.rightPlacement,aspect=line.dataset.aspect;
     if(m==='A-A'||m==='B-B'){
      const ids=[left,right].sort();
      return m[0]+':'+ids[0]+'|'+aspect+'|'+m[0]+':'+ids[1];
     }
     return 'A:'+left+'|'+aspect+'|B:'+right;
    };
    return{
     at:best.at,clearance:best.clearance,overlayHit:under===overlay,
     identity:getIdentity(source),ghostIdentity:getIdentity(ghost),mode:wanted,
     left:{sky:source.dataset.leftSky,id:source.dataset.leftPlacement},
     right:{sky:source.dataset.rightSky,id:source.dataset.rightPlacement}
    };
   },mode);
   assert.ok(probe,mode+' visible wheel aspect should provide an on-screen test point');
   assert.equal(probe.overlayHit,true,'Invisible envelope actually intercepts the visible stroke');
   assert.notEqual(probe.identity,probe.ghostIdentity,'Ghost is another relationship');
   if(mobile)await page.touchscreen.tap(probe.at.x,probe.at.y);
   else await page.mouse.click(probe.at.x,probe.at.y);
   await page.waitForTimeout(260);
   const selected=await page.evaluate(()=>{
    const active=window.RelphiSkyFoundationInteractions?.captureFocus?.()?.lockedState||null;
    const endpointRows=[...document.querySelectorAll('#skyFoundationA .sky-foundation-row.is-aspect-endpoint,#skyFoundationB .sky-foundation-row.is-aspect-endpoint')];
    const expanded=[...document.querySelectorAll('#skyFoundationA .sky-placement-expanded,#skyFoundationB .sky-placement-expanded')];
    return{
     active,endpointRows:endpointRows.map(row=>({sky:row.closest('#skyFoundationA')?'A':'B',id:row.dataset.placement,expanded:row.getAttribute('aria-expanded'),kept:row.classList.contains('is-kept'),selected:row.classList.contains('is-selected')})),
     expanded:expanded.map(tile=>({sky:tile.closest('#skyFoundationA')?'A':'B',id:tile.dataset.placementDetail})),
     ghostSelected:!!document.querySelector('[data-test-ghost].is-selected')
    };
   });
   assert.deepEqual(selected.active,{kind:'aspect',sky:null,value:probe.identity},mode+' clicked visible line, not invisible hit');
   const expected=[probe.left,probe.right].map(x=>x.sky+':'+x.id).sort();
   const actual=selected.endpointRows.map(x=>x.sky+':'+x.id).sort();
   assert.deepEqual(actual,expected,mode+' both endpoint rows highlighted, including same-sky pairs');
   assert.deepEqual(selected.expanded.map(x=>x.sky+':'+x.id).sort(),expected,mode+' both referent tiles expanded');
   assert.ok(selected.endpointRows.every(x=>x.expanded==='true'&&x.kept&&x.selected),'Endpoint tiles are not just silently expanded');
   assert.equal(selected.ghostSelected,false,'Ghost envelope not selected');
   console.log('PASS visible aspect over invisible hit',width,mode,JSON.stringify({probe,selected}));

   // Keyboard and ordinary placement selection must still use the same owner.
   await page.locator('#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')
    .filter({hasNot:page.locator('.not-used')}).first().evaluate(node=>node.focus());
   await page.keyboard.press('Escape');
   const clear=await page.evaluate(()=>({
    selected:window.RelphiSkyFoundationInteractions?.captureFocus?.()?.lockedState||null,
    expanded:document.querySelectorAll('.sky-placement-expanded').length
   }));
   assert.equal(clear.selected,null,'Escape clears aspect wheel focus');
   assert.equal(clear.expanded,0,'Escape closes aspect endpoint referents');
   if(mode==='A-B'){
    const venus=page.locator('#skyFoundationA .sky-foundation-row[data-interactive="placement"][data-placement="venus"]');
    await venus.scrollIntoViewIfNeeded();
    if(mobile)await venus.tap();else await venus.click();
    assert.equal(await venus.getAttribute('aria-expanded'),'true','Original single-placement action still expands its tile');
    assert.deepEqual(await page.evaluate(()=>window.RelphiSkyFoundationInteractions?.captureFocus?.()?.lockedState),
      {kind:'placement',sky:'A',value:'venus'});
   }
  }
  assert.deepEqual(errors,[],'No browser exceptions');
  await ctx.close();
 }
}finally{await browser.close()}
