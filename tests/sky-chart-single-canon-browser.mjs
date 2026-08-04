import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0}};
function sky(name,offset){
  const asc=(168.38+offset)%360;
  const cusps=Array.from({length:12},(_,index)=>(asc+index*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,Chiron:74.48,'North Node':40.3,'South Node':220.3,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
  return{name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))};
}
const browser=await chromium.launch({headless:true});

async function inspect(width,height,suffix){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
  },{a:sky('Sky A',0),b:sky('Sky B',0)});
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy')==='false');
  await page.waitForFunction(()=>document.querySelectorAll('[data-layer="zodiac"] > g[data-zodiac-sign] .relphi-canonical-glyph').length===12);

  const state=await page.evaluate(async()=>{
    const geminiMarkup=await fetch('assets/zodiac-glyphs/gemini.svg?v=filled-silhouette-test').then(r=>r.text());
    const geminiSvg=new DOMParser().parseFromString(geminiMarkup,'image/svg+xml').documentElement;
    const sourcePath=geminiSvg.querySelector('path');
    const zodiac=Array.from(document.querySelectorAll('[data-layer="zodiac"] > g[data-zodiac-sign]')).map(host=>{
      const circle=host.querySelector(':scope > .relphi-glyph-bubble > circle');
      return{
        id:host.dataset.zodiacSign,
        radius:Number(host.dataset.wheelGlyphRadius),
        glyphCount:host.querySelectorAll('.relphi-canonical-glyph').length,
        circleDisplay:circle?getComputedStyle(circle).display:'missing',
        circleOpacity:circle?Number(getComputedStyle(circle).opacity):null
      };
    });
    const geminiPath=document.querySelector('[data-zodiac-sign="gemini"] .relphi-glyph-gemini path');
    const angleLines=Array.from(document.querySelectorAll('.sky-foundation-angle-axis')).map(line=>({
      sky:line.dataset.sky,
      edge:Number(line.dataset.axisEdgeRadius),
      x1:Number(line.getAttribute('x1')),y1:Number(line.getAttribute('y1')),
      x2:Number(line.getAttribute('x2')),y2:Number(line.getAttribute('y2'))
    }));
    const placementColors=Array.from(document.querySelectorAll('[data-layer="placements"] > [data-sky]')).map(host=>{
      const expected=host.dataset.sky==='A'?'rgb(201, 33, 30)':'rgb(36, 98, 208)';
      const art=host.querySelector('.relphi-canonical-glyph');
      const painted=art?Array.from(art.querySelectorAll('path,circle,ellipse,rect,polygon,polyline,line,text')).filter(node=>{
        if(node.matches('text'))return true;
        const fill=node.getAttribute('fill');
        const stroke=node.getAttribute('stroke');
        return(fill&&fill!=='none')||(stroke&&stroke!=='none');
      }):[];
      const wrong=painted.filter(node=>{
        const style=getComputedStyle(node);
        const usesFill=node.matches('text')||(node.getAttribute('fill')&&node.getAttribute('fill')!=='none');
        const usesStroke=node.getAttribute('stroke')&&node.getAttribute('stroke')!=='none';
        return(usesFill&&style.fill!==expected)||(usesStroke&&style.stroke!==expected);
      });
      return{sky:host.dataset.sky,id:host.dataset.placement,expected,painted:painted.length,wrong:wrong.length};
    });
    return{
      zodiac,
      sourceFill:sourcePath?.getAttribute('fill')||'',
      sourceStroke:sourcePath?.getAttribute('stroke')||'',
      sourceStrokeWidth:sourcePath?.getAttribute('stroke-width')||'',
      renderedFill:geminiPath?.getAttribute('fill')||'',
      renderedStroke:geminiPath?.getAttribute('stroke')||'',
      angleLines,
      angleCount:document.querySelectorAll('[data-angle-axis="true"]').length,
      diagnostics:document.querySelectorAll('[data-angle-collision-error],[data-canonical-glyph-error]').length,
      placementColors
    };
  });

  assert.equal(state.zodiac.length,12);
  assert.deepEqual(state.zodiac.map(item=>item.id),SIGNS.map(name=>name.toLowerCase()));
  assert.ok(state.zodiac.every(item=>item.radius===19));
  assert.ok(state.zodiac.every(item=>item.glyphCount===1));
  assert.ok(state.zodiac.every(item=>item.circleDisplay==='none'));
  assert.equal(state.sourceFill,'#111111');
  assert.equal(state.sourceStroke,'');
  assert.equal(state.sourceStrokeWidth,'');
  assert.equal(state.renderedFill,'#171717');
  assert.equal(state.renderedStroke,'');
  assert.equal(state.angleCount,8);
  assert.equal(state.angleLines.length,8);
  assert.ok(state.angleLines.every(line=>line.edge===(line.sky==='A'?574:166)));
  assert.ok(state.placementColors.length>=30);
  assert.ok(state.placementColors.every(item=>item.painted>0));
  assert.deepEqual(state.placementColors.filter(item=>item.wrong),[]);
  assert.equal(state.diagnostics,0);
  assert.deepEqual(errors,[]);
  await page.screenshot({path:`sky-chart-single-canon-${suffix}.png`,fullPage:true,animations:'disabled'});
  await page.close();
}

await inspect(1440,900,'desktop');
await inspect(390,844,'mobile');
await browser.close();
console.log('Placement glyphs are sky-owned red/blue; zodiac glyphs use uncircled canonical masters.');
