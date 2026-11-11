import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

// Reproduce the user's comparison-wheel workflow with real mouse and touch input.
const names=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function placement(name,longitude){
  const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30;
  return {name,longitude:value,sign:names[sign],degree:Math.floor(within),minute:Math.floor((within%1)*60),second:0};
}
function sky(name,offset,instant){
  const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
  const values={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Midheaven:76.28};
  return {name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{instant,dateTime:instant.slice(0,16),houseCusps:cusps,houseSystem:'equal-house',timeZone:'America/Denver',location:'Salt Lake City, Utah, United States',latitude:40.7608,longitude:-111.891},
    placements:Object.fromEntries(Object.entries(values).map(([key,value])=>[key,placement(key,value+offset)]))};
}
const fixture={a:sky('Comparison A',0,'1985-10-08T04:37:00.000Z'),b:sky('Comparison B',29.27,'2026-09-09T21:00:00.000Z')};
const browser=await chromium.launch({headless:true});
try{
  for(const config of [{name:'desktop',width:1440,height:1000,hasTouch:false,prefer:'A-B',next:'B-B'},
                       {name:'mobile',width:390,height:844,hasTouch:true,prefer:'B-B',next:'A-B'}]){
    const page=await browser.newPage({viewport:{width:config.width,height:config.height},hasTouch:config.hasTouch,isMobile:config.hasTouch});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
    await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
    await page.addInitScript(data=>{
      localStorage.setItem('relphiSkyChartA',JSON.stringify(data.a));
      localStorage.setItem('relphiSkyChartB',JSON.stringify(data.b));
      localStorage.setItem('relphiSkyChartLastModeV1','comparison');
      localStorage.setItem('relphiSkyAspectBySignV2','[]');
    },fixture);
    await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
    await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
    await page.waitForFunction(()=>[...document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')].filter(n=>!n.hidden&&getComputedStyle(n).display!=='none').length>4,null,{timeout:30000});
    await page.locator('#skyFoundationWheelMount').scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);

    const identity=node=>{
      if(!node)return'';
      const d=node.dataset,mode=String(d.relationshipMode||'A-B').toUpperCase(),leftSky=d.leftSky||(mode==='B-B'?'B':'A'),rightSky=d.rightSky||(mode==='A-A'?'A':'B'),left=d.leftPlacement,right=d.rightPlacement;
      if(leftSky===rightSky){const sorted=[left,right].sort();return leftSky+':'+sorted[0]+'|'+d.aspect+'|'+rightSky+':'+sorted[1]}
      return leftSky+':'+left+'|'+d.aspect+'|'+rightSky+':'+right;
    };

    async function snapshot(){
      return page.evaluate(()=>{
        const key=node=>{const d=node.dataset,mode=String(d.relationshipMode||'A-B').toUpperCase(),a=d.leftSky||(mode==='B-B'?'B':'A'),b=d.rightSky||(mode==='A-A'?'A':'B'),left=d.leftPlacement,right=d.rightPlacement;if(a===b){const [x,y]=[left,right].sort();return a+':'+x+'|'+d.aspect+'|'+b+':'+y}return a+':'+left+'|'+d.aspect+'|'+b+':'+right};
        const lines=[...document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')];
        return {active:!!document.querySelector('#skyFoundationWheelMount .has-isolation'),
          visible:lines.filter(n=>!n.hidden&&getComputedStyle(n).display!=='none').length,
          selected:lines.filter(n=>n.classList.contains('is-selected')).map(key),
          kept:lines.filter(n=>n.classList.contains('is-kept')&&!n.hidden&&getComputedStyle(n).display!=='none').map(key),
          unselectable:lines.filter(n=>!n.hidden&&getComputedStyle(n).display!=='none'&&getComputedStyle(n).pointerEvents==='none').length,
          rows:document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]').length};
      });
    }
    // Locate the actual topmost aspect hit target at a visible stroke segment.
    // This is a physical-pointer test, not dispatchEvent('click') on an SVG node.
    async function pointerLocation(exclude='',preferredMode=config.prefer){
      return page.evaluate(({exclude,prefer})=>{
        const key=node=>{const d=node.dataset,mode=String(d.relationshipMode||'A-B').toUpperCase(),a=d.leftSky||(mode==='B-B'?'B':'A'),b=d.rightSky||(mode==='A-A'?'A':'B'),left=d.leftPlacement,right=d.rightPlacement;if(a===b){const [x,y]=[left,right].sort();return a+':'+x+'|'+d.aspect+'|'+b+':'+y}return a+':'+left+'|'+d.aspect+'|'+b+':'+right};
        const lines=[...document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')]
          .filter(n=>!n.hidden&&getComputedStyle(n).display!=='none');
        lines.sort((a,b)=>Number(b.dataset.relationshipMode===prefer)-Number(a.dataset.relationshipMode===prefer));
        for(const line of lines){
          const m=line.getScreenCTM();if(!m)continue;
          const x1=Number(line.getAttribute('x1')),y1=Number(line.getAttribute('y1')),x2=Number(line.getAttribute('x2')),y2=Number(line.getAttribute('y2'));
          for(const t of [.25,.35,.45,.55,.65,.75]){
            const p=new DOMPoint(x1+(x2-x1)*t,y1+(y2-y1)*t).matrixTransform(m);
            if(p.x<2||p.y<2||p.x>innerWidth-2||p.y>innerHeight-2)continue;
            const top=document.elementFromPoint(p.x,p.y)?.closest?.('[data-interactive="aspect"]');
            if(!top||top.dataset.relationshipMode!==prefer||!top.dataset.leftPlacement||!top.dataset.rightPlacement||getComputedStyle(top).pointerEvents==='none')continue;
            const id=key(top);
            if(id&&id!==exclude)return{x:p.x,y:p.y,id,mode:top.dataset.relationshipMode||'A-B'};
          }
        }
        return null;
      },{exclude,prefer:preferredMode});
    }
    async function activate(point){
      if(config.hasTouch)await page.touchscreen.tap(point.x,point.y);
      else await page.mouse.click(point.x,point.y);
      await page.waitForTimeout(300);
    }
    const initial=await snapshot();
    assert.ok(initial.visible>4,config.name+' fixture requires multiple visible aspect chords');
    const first=await pointerLocation();
    assert.ok(first,config.name+' must physically hit a '+config.prefer+' comparison-wheel aspect');
    await activate(first);
    const afterFirst=await snapshot();
    assert.equal(afterFirst.active,true,config.name+' must lock wheel isolation on click/tap');
    assert.equal(afterFirst.visible,initial.visible,config.name+' must not erase unrelated aspect lines after first selection');
    assert.ok(afterFirst.kept.includes(first.id),config.name+' must keep selected chord visible');
    assert.equal(afterFirst.unselectable,0,config.name+' other visible chords must remain clickable');

    const second=await pointerLocation(first.id,config.next);
    assert.ok(second,config.name+' must physically switch from '+config.prefer+' to '+config.next+' without clearing focus');
    await activate(second);
    const afterSecond=await snapshot();
    assert.equal(afterSecond.active,true,config.name+' must allow direct switching between aspect lines');
    assert.equal(afterSecond.visible,initial.visible,config.name+' must keep the original visible aspect count after switching');
    assert.ok(afterSecond.kept.includes(second.id),config.name+' must keep the second chord, not the first');
    assert.equal(afterSecond.unselectable,0,config.name+' must not disable further clicks');

    // The Relationships-header Clear button is intentionally not displayed in
    // every layout. The established wheel interaction clears by tapping the
    // already-selected aspect again, using the same physical input path.
    await activate(second);
    const afterClear=await snapshot();
    assert.equal(afterClear.active,false,config.name+' selecting the same line again must clear isolation');
    assert.equal(afterClear.visible,initial.visible,config.name+' clearing must restore all aspect strokes');
    assert.deepEqual(errors.filter(Boolean),[],config.name+' should not generate page errors');
    console.log('PASS '+config.name+': '+initial.visible+' aspect lines retained; '+first.mode+' -> '+second.mode+' switched; clear restored');
    await page.close();
  }
}finally{await browser.close()}
