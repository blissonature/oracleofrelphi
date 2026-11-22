import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

// The currently deployed self-hosted loader serves Sky Chart even when the
// optional gallery page selector is supplied. Test its supported Sky Chart
// route, not a gallery that the deployed loader does not currently display.
const ref=process.env.PREVIEW_REF;
assert.match(ref||'',/^[a-f0-9]{40}$/i,'PREVIEW_REF must specify the exact commit');
const url='https://oracleofrelphi.com/sky-chart-preview/sky-chart.html?ref='+ref;
const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function point(name,lon,rx=false){const x=(lon%360+360)%360;return{name,longitude:x,sign:signs[Math.floor(x/30)],
  degree:Math.floor(x%30),minute:Math.floor((x%1)*60),retrograde:rx};}
function sky(name,offset){
  const asc=168.38+offset,cusps=Array.from({length:12},(_,i)=>(asc+30*i)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,
    Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,
    Chiron:74.48,'North Node':40.3,'South Node':220.3,Ascendant:asc,Midheaven:76.28+offset};
  return{name,houseCusps:cusps,houseSystem:'equal-house',
    calcProfile:{houseCusps:cusps,houseSystem:'equal-house',instant:'2026-11-21T12:00:00Z'},
    placements:Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,point(k,v+offset,k==='Saturn')]))};
}
await mkdir('test-results/glyph-audit',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const [name,width,height] of [['desktop',1280,900],['mobile',390,844]]){
   const page=await browser.newPage({viewport:{width,height},serviceWorkers:'block'});
   const errors=[],failures=[],consoleErrors=[];
   page.on('pageerror',error=>errors.push(error.message));
   page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text());});
   page.on('requestfailed',req=>failures.push({url:req.url().slice(0,180),failure:req.failure()?.errorText}));
   page.on('response',r=>{if(r.status()>=400)failures.push({url:r.url().slice(0,180),status:r.status()});});
   await page.addInitScript(({a,b})=>{
     localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
     localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
     localStorage.setItem('relphiSkyChartLastModeV1','comparison');
   },{a:sky('Audit A',0),b:sky('Audit B',29)});
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
   try{
     await page.waitForFunction(()=>window.RelphiGlyphRegistry?.entries?.length===95&&
       window.RelphiGlyphComponent?.createBubble&&
       document.querySelector('#skyFoundationRoot')?.getAttribute('aria-busy')==='false'&&
       !!document.querySelector('.sky-foundation-wheel'),null,{timeout:85000});
   }catch(error){
     const state=await page.evaluate(()=>({url:location.href,base:document.baseURI,title:document.title,
       status:document.querySelector('#previewStatus')?.textContent,
       wheelCount:document.querySelectorAll('.sky-foundation-wheel').length,
       rootBusy:document.querySelector('#skyFoundationRoot')?.getAttribute('aria-busy'),
       registryCount:window.RelphiGlyphRegistry?.entries?.length,
       text:document.body?.innerText?.slice(0,650)}));
     await page.screenshot({path:'test-results/glyph-audit/hosted-'+name+'-failed.png',fullPage:true});
     console.error('HOSTED SKY PREVIEW DIAGNOSTICS',JSON.stringify({state,errors,
       consoleErrors:consoleErrors.slice(0,10),failures:failures.slice(0,25)}));
     throw error;
   }
   const state=await page.evaluate(async()=>{
     const NS='http://www.w3.org/2000/svg';
     const svg=document.createElementNS(NS,'svg');
     svg.setAttribute('viewBox','-32 -32 64 64');
     svg.style.cssText='position:fixed;left:12px;top:12px;width:64px;height:64px;z-index:9999';
     document.body.appendChild(svg);
     const bubble=window.RelphiGlyphComponent.createBubble(svg,'retrograde',{radius:19,padding:1,color:'#111'});
     await bubble.ready;
     const art=svg.querySelector('.relphi-glyph-retrograde');
     const b=art.getBoundingClientRect(),r=bubble.circle.getBoundingClientRect();
     const cx=r.x+r.width/2,cy=r.y+r.height/2;
     const chord=Math.max(...[[b.left,b.top],[b.left,b.bottom],[b.right,b.top],[b.right,b.bottom]]
       .map(([x,y])=>Math.hypot(x-cx,y-cy)));
     const chr=document.querySelector('.relphi-glyph-chiron');
     const state={title:document.title,base:document.baseURI,
       registryCount:window.RelphiGlyphRegistry.entries.length,
       wheelCount:document.querySelectorAll('.sky-foundation-wheel').length,
       placementRows:document.querySelectorAll('#skyFoundationA .sky-foundation-row').length,
       retrograde:{centerX:b.x+b.width/2-cx,centerY:b.y+b.height/2-cy,
         farthest:chord,paths:art.querySelectorAll('path').length,texts:art.querySelectorAll('text').length,
         source:art.dataset.canonicalGlyphId},
       symbolFont:chr?getComputedStyle(chr).fontFamily:null};
     svg.remove();
     return state;
   });
   assert.ok(state.base.includes(ref),'All assets must resolve from the exact requested commit');
   assert.equal(state.registryCount,95);
   assert.ok(state.wheelCount>=1&&state.placementRows>=10,'Real Sky Chart and Placements must render');
   assert.ok(Math.abs(state.retrograde.centerX)<1.2&&Math.abs(state.retrograde.centerY)<1.2,
      'Original Retrograde must be centered in the shared renderer');
   assert.ok(state.retrograde.farthest<18,'Original Retrograde fits within the circle');
   assert.deepEqual([state.retrograde.paths,state.retrograde.texts],[1,0],
      'The glyph remains its original single outline');
   assert.equal(state.retrograde.source,'retrograde');
   assert.ok(state.symbolFont?.includes('Apple Symbols'),'Chiron must use the intended valid symbol font stack');
   assert.deepEqual(errors,[],'No application JavaScript errors');
   await page.screenshot({path:'test-results/glyph-audit/hosted-'+name+'.png',fullPage:true});
   console.log('HOSTED COMMIT SKY PREVIEW '+name.toUpperCase(),JSON.stringify({url,state,
     decorativeRequestsFailed:failures.filter(x=>/relphi-icons\.svg|google-analytics/.test(x.url)).length}));
   await page.close();
 }
}finally{await browser.close()}
