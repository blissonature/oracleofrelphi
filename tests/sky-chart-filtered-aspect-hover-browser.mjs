import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Two distinct skies intentionally create aspects outside a narrow Harmonic
// Window. The visible line alone determines whether a hit is interactive.
const instant='2026-09-19T18:30:00.000Z';
const profile={instant,dateTime:instant,timeZone:'America/Denver',
  latitude:40.7608,longitude:-111.8910,houseSystem:'whole-sign'};
function sky(name,offset){
  const raw={Sun:170,Moon:279,Mercury:195,Venus:215,Mars:118,Jupiter:142,
    Saturn:13,Uranus:65,Neptune:3,Pluto:303,Ascendant:180,Descendant:0,
    'Medium Coeli':285,'Imum Coeli':105,'North Node':328,'South Node':148};
  return{name,houseSystem:'whole-sign',calcProfile:profile,
    houseCusps:Array.from({length:12},(_,i)=>(168+offset+i*30)%360),
    placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>
      [key,{name:key,longitude:value+offset}]))};
}
const browser=await chromium.launch({headless:true});
try{
  for(const [width,height,label] of [[1440,1000,'desktop'],[390,844,'mobile']]){
    const context=await browser.newContext({viewport:{width,height}});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(({a,b})=>{
      localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
      localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
      localStorage.setItem('relphiSkyChartLastModeV1','comparison');
      localStorage.setItem('relphiSkyRelationshipDisplayV1','glyphs');
      localStorage.setItem('relphiSkyHarmonicWindowV1','1');
    },{a:sky('A',0),b:sky('B',2)});
    await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:35000});
    await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:35000});
    await page.waitForFunction(()=>document.documentElement.dataset.skyBPresent==='true',null,{timeout:15000});
    await page.waitForFunction(()=>document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect-hit').length>8,null,{timeout:15000});
    // The active controller owns hover. Do not introduce a dormant second hover
    // controller to make the test pass.
    assert.ok(await page.evaluate(()=>!!window.RelphiSkyFoundationInteractions),'Existing foundation interaction owner loaded');
    const wheel=page.locator('#skyFoundationWheelMount .sky-foundation-wheel');
    await wheel.scrollIntoViewIfNeeded();
    await page.evaluate(()=>window.RelphiHarmonicOrb?.setWindow?.(1));
    await page.waitForFunction(()=>{
      const lines=[...document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')];
      return lines.some(l=>l.classList.contains('sky-chart-orb-hidden'))&&
        lines.some(l=>!l.hidden&&getComputedStyle(l).display!=='none');
    },null,{timeout:12000});
    await page.waitForTimeout(180);
    const initial=await page.evaluate(()=>{
      const lines=[...document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')];
      const hidden=lines.filter(l=>l.hidden||getComputedStyle(l).display==='none');
      const live=lines.filter(l=>!l.hidden&&getComputedStyle(l).display!=='none');
      const pairs=hidden.map(source=>({source,hit:source.nextElementSibling})).filter(p=>p.hit?.classList.contains('sky-foundation-aspect-hit'));
      return{hidden:hidden.length,live:live.length,pairs:pairs.length,
        exposed:pairs.filter(p=>getComputedStyle(p.hit).display!=='none').map(p=>p.source.dataset.relationIndex).slice(0,5),
        visibleHit:live.filter(l=>l.nextElementSibling?.classList.contains('sky-foundation-aspect-hit')&&getComputedStyle(l.nextElementSibling).display!=='none').length};
    });
    assert.ok(initial.hidden>0&&initial.live>0&&initial.pairs>0,label+' fixture has visible and harmonically excluded aspects');
    assert.deepEqual(initial.exposed,[],label+' hidden line cannot leave a pointer-catching 28px hit target');
    assert.ok(initial.visibleHit>0,label+' genuine visible aspect hit targets remain usable');

    // Place the source and hit of an excluded aspect at the same coordinates as
    // a valid line. It remains a real adjacent source/hit pair, merely moved to
    // the top of the aspect layer. Before this fix its invisible hit intercepted
    // the pointer and prevented the correct dim/isolate.
    const probe=await page.evaluate(()=>{
      const layer=document.querySelector('#skyFoundationWheelMount [data-layer="aspects"]');
      const active=[...layer.querySelectorAll(':scope > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')]
        .filter(l=>!l.hidden&&getComputedStyle(l).display!=='none'&&
          l.nextElementSibling?.classList.contains('sky-foundation-aspect-hit')&&
          getComputedStyle(l.nextElementSibling).display!=='none');
      const hidden=[...layer.querySelectorAll(':scope > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')]
        .filter(l=>l.hidden&&l.nextElementSibling?.classList.contains('sky-foundation-aspect-hit'));
      if(!active.length||!hidden.length)return null;
      const dist=(p,a,b)=>{
        const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;
        if(!den)return Math.hypot(p.x-a.x,p.y-a.y);
        const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/den));
        return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
      };
      const points=active.map(line=>{
        const m=line.getScreenCTM(),a=new DOMPoint(+line.getAttribute('x1'),+line.getAttribute('y1')).matrixTransform(m);
        const b=new DOMPoint(+line.getAttribute('x2'),+line.getAttribute('y2')).matrixTransform(m);
        return{line,a,b};
      });
      const rect=layer.getBoundingClientRect();
      let best=null;
      for(const segment of points){
        for(const t of [.3,.45,.6,.75]){
          const point={x:segment.a.x+(segment.b.x-segment.a.x)*t,
            y:segment.a.y+(segment.b.y-segment.a.y)*t};
          if(point.x<Math.max(1,rect.left+3)||point.y<Math.max(1,rect.top+3)||
            point.x>Math.min(innerWidth-2,rect.right-3)||point.y>Math.min(innerHeight-2,rect.bottom-3))continue;
          const distance=Math.min(...points.filter(s=>s!==segment).map(s=>dist(point,s.a,s.b)));
          if(!best||distance>best.clearance)best={line:segment.line,point,clearance:distance};
        }
      }
      if(!best)return null;
      const source=hidden.find(l=>l.dataset.relationIndex!==best.line.dataset.relationIndex);
      if(!source)return null;
      const occluder=source.nextElementSibling;
      for(const coord of ['x1','y1','x2','y2'])occluder.setAttribute(coord,best.line.getAttribute(coord));
      layer.append(source,occluder);
      return{point:best.point,index:best.line.dataset.relationIndex,
        expectedIdentity:[best.line.dataset.leftSky,best.line.dataset.leftPlacement,best.line.dataset.aspect,best.line.dataset.rightSky,best.line.dataset.rightPlacement].join(':'),
        excludedIndex:source.dataset.relationIndex,excludedHitDisplay:getComputedStyle(occluder).display,
        clearance:best.clearance};
    });
    assert.ok(probe,label+' visible segment and excluded overlaid hit found');
    assert.equal(probe.excludedHitDisplay,'none',label+' the overlaid inactive hit must be non-interactive');
    await page.mouse.move(2,Math.min(height-4,200));
    await page.mouse.move(probe.point.x,probe.point.y,{steps:4});
    await page.waitForTimeout(220);
    const hovered=await page.evaluate(expected=>{
      const wheel=document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel');
      const all=[...wheel.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')];
      const active=all.find(l=>l.dataset.relationIndex===expected);
      return{
        isolation:wheel.classList.contains('has-isolation'),
        expectedKept:active?.classList.contains('is-kept'),
        expectedHovered:active?.classList.contains('is-hovered'),
        dimmed:all.some(l=>!l.hidden&&getComputedStyle(l).display!=='none'&&!l.classList.contains('is-kept')),
        selectedSource:document.elementFromPoint(window.__aspectProbeX||0,window.__aspectProbeY||0)?.getAttribute('class')||''
      };
    },probe.index);
    console.log('FILTERED_HOVER_'+label,JSON.stringify({initial,probe,hovered}));
    assert.equal(hovered.isolation,true,label+' pointer hover triggers wheel isolation with overlapping inactive hit');
    assert.equal(hovered.expectedKept,true,label+' exact visible aspect remains illuminated');
    assert.equal(hovered.expectedHovered,true,label+' the correct aspect receives hover, not filtered geometry');
    assert.equal(hovered.dimmed,true,label+' other visible aspects dim');
    await page.screenshot({path:'aspect-hover-filtered-'+label+'.png'});

    // A second owner may filter the source without updating the wide hit clone.
    // Source eligibility always decides interactivity, including Focus scope.
    const filters=await page.evaluate(()=>{
      const layer=document.querySelector('#skyFoundationWheelMount [data-layer="aspects"]');
      const source=[...layer.querySelectorAll(':scope > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')].find(l=>!l.hidden&&getComputedStyle(l).display!=='none'&&l.nextElementSibling?.classList.contains('sky-foundation-aspect-hit'));
      if(!source)return null;
      const hit=source.nextElementSibling,results=[];
      for(const cls of ['sky-chart-filter-hidden','sky-chart-multiselect-hidden','sky-chart-house-multiselect-hidden',
        'sky-chart-aspect-multiselect-hidden','sky-chart-sign-filter-hidden','sky-chart-zodiac-filter-hidden',
        'sky-chart-semantic-hidden','sky-foundation-single-sky-cross-hidden']){
        source.classList.add(cls);
        results.push({cls,hidden:getComputedStyle(hit).display==='none'});
        source.classList.remove(cls);
      }
      return results;
    });
    assert.ok(filters?.length>0&&filters.every(x=>x.hidden),label+' every Focus filter suppresses the corresponding invisible hit target: '+JSON.stringify(filters));
    assert.deepEqual(errors.filter(x=>/TypeError|ReferenceError|SyntaxError/.test(x)),[],label+' has no critical JS errors');
    await context.close();
  }
}finally{await browser.close()}
console.log('Comparison-wheel filtered aspect hover and dim/isolate verified at desktop and mobile widths.');
