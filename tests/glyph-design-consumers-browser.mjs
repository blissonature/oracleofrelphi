import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';
import {mkdir} from 'node:fs/promises';

const origin=process.env.GLYPH_AUDIT_ORIGIN||'http://127.0.0.1:4173';
const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function placement(name,longitude,retrograde=false){
  const x=(longitude%360+360)%360;
  return{name,longitude:x,sign:signs[Math.floor(x/30)],degree:Math.floor(x%30),
    minute:Math.floor((x%1)*60),retrograde};
}
function sky(name,offset){
  const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,i)=>(asc+30*i)%360);
  const points={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,
    Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,
    Chiron:74.48,'North Node':40.3,'South Node':220.3,
    Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33,
    Ascendant:asc,Descendant:348.38+offset,Midheaven:76.28+offset,IC:256.28+offset};
  return{name,houseSystem:'equal-house',houseCusps:cusps,
    calcProfile:{houseCusps:cusps,houseSystem:'equal-house',instant:'2026-11-21T12:00:00Z'},
    placements:Object.fromEntries(Object.entries(points).map(([id,lon])=>
      [id,placement(id,lon+offset,id==='Saturn'||id==='Chiron')]))};
}
await mkdir('test-results/glyph-audit',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
  for(const [name,width,height] of [['desktop',1280,900],['mobile',390,844]]){
    const page=await browser.newPage({viewport:{width,height}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',r=>
      r.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'text/javascript'}));
    await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',r=>
      r.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'text/javascript'}));
    await page.addInitScript(({a,b})=>{
      localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
      localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
      localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    },{a:sky('Audit A',0),b:sky('Audit B',29)});
    await page.goto(origin+'/sky-chart.html',{waitUntil:'domcontentloaded',timeout:40000});
    await page.waitForFunction(()=>document.querySelector('#skyFoundationRoot')?.getAttribute('aria-busy')==='false'&&
      document.querySelectorAll('#skyFoundationA .sky-foundation-row').length>=12,null,{timeout:65000});
    const actual=await page.evaluate(async()=>{
      const rows=[...document.querySelectorAll('#skyFoundationA .sky-foundation-row')];
      const saturn=rows.find(x=>x.querySelector('.sky-foundation-row-name')?.firstChild?.textContent==='Saturn');
      const chiron=rows.find(x=>x.querySelector('.sky-foundation-row-name')?.firstChild?.textContent==='Chiron');
      const mark=saturn?.querySelector('img.sky-rx-master');
      const img=chiron?.querySelector('img.sky-rx-master');
      if(mark?.decode)await mark.decode();
      if(img?.decode)await img.decode();
      const cs=getComputedStyle(chiron?.querySelector('.relphi-glyph-chiron'));
      const actualMarkup=await fetch('assets/planet-glyphs/retrograde.svg').then(x=>x.text());
      const source=new DOMParser().parseFromString(actualMarkup,'image/svg+xml').documentElement;
      const overlays=[...document.querySelectorAll('.sky-rx-glyph-overlay')];
      return{rows:rows.length,retrograde:{
        present:!!mark,naturalWidth:mark?.naturalWidth,naturalHeight:mark?.naturalHeight,
        renderedWidth:mark?.getBoundingClientRect().width,renderedHeight:mark?.getBoundingClientRect().height,
        url:mark?.getAttribute('src')},
        chiron:{present:!!img,fontFamily:cs.fontFamily,glyphVisible:!!chiron?.querySelector('.relphi-glyph-chiron')},
        originalMaster:{viewBox:source.getAttribute('viewBox'),paths:source.querySelectorAll('path').length,
          hasText:!!source.querySelector('text'),hasCircle:!!source.querySelector('circle')},
        relationshipRxOverlays:overlays.length,
        actualOverlayGlyphs:overlays.filter(x=>!!x.querySelector('.relphi-glyph-retrograde')).length,
        wheel:document.querySelectorAll('.sky-foundation-wheel').length};
    });
    assert.ok(actual.rows>=12,'Placements must remain available');
    assert.equal(actual.retrograde.present,true,'Retrograde remains beside the Saturn name');
    assert.ok(actual.retrograde.naturalWidth>0&&actual.retrograde.renderedWidth>0,
      'The direct-image consumer must preserve its working source geometry');
    assert.equal(actual.chiron.present,true,'Chiron Retrograde remains beside the Chiron name');
    assert.ok(actual.chiron.fontFamily.includes('Apple Symbols'),'Chiron uses the intended symbol font stack');
    assert.deepEqual(actual.originalMaster,{viewBox:'-32 -32 64 64',paths:1,hasText:false,hasCircle:false},
      'Direct-image canonical Retrograde remains unchanged');
    assert.ok(actual.wheel>=1,'Wheel remains rendered');
    assert.ok(actual.actualOverlayGlyphs<=actual.relationshipRxOverlays);
    assert.deepEqual(errors,[],'No JavaScript errors in the real Sky Chart consumer');
    await page.screenshot({path:'test-results/glyph-audit/sky-consumers-'+name+'.png',fullPage:true});
    console.log('SKY CONSUMERS '+name.toUpperCase(),JSON.stringify(actual));
    await page.close();
  }
}finally{await browser.close()}
