import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';

const ref=process.env.PREVIEW_REF;
assert.match(ref||'',/^[0-9a-f]{40}$/,'A commit SHA is required');
const urls=[
  ['preview',`https://oracleofrelphi.com/sky-chart-preview/sky-chart.html?ref=${ref}`],
  ['deployed', 'https://oracleofrelphi.com/sky-chart.html']
];
const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function point(name,degree){const value=((degree%360)+360)%360;return{name,longitude:value,sign:signs[Math.floor(value/30)],degree:Math.floor(value%30),minute:Math.floor((value%1)*60)}}
function sky(name,offset,instant,location,lat,lon,tz){
 const asc=168.38+offset,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
 const points={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Chiron:74.48,Ascendant:asc,Midheaven:76.28};
 return {name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{dateTime:instant.slice(0,16),instant,location,locationQuery:location,timeZone:tz,latitude:lat,longitude:lon,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(points).map(([k,v])=>[k,{...point(k,v+offset),retrograde:(k==='Saturn'||k==='Chiron')&&offset===0}]))};
}
const a=sky('Test A',0,'1985-10-08T08:37:00Z','Malden, Massachusetts, United States',42.4251,-71.0662,'America/New_York');
const b=sky('Test B',29,'2026-10-17T12:00:00Z','Salt Lake City, Utah, United States',40.7608,-111.891,'America/Denver');
const browser=await chromium.launch({headless:true});
let failed=false;
try{
 for(const [kind,url] of urls){
  const ctx=await browser.newContext({viewport:{width:1200,height:820},serviceWorkers:'block'});
  const page=await ctx.newPage(),failures=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>failures.push({url:r.url(),error:r.failure()?.errorText}));
  page.on('response',response=>{if(response.status()>=400)failures.push({status:response.status(),url:response.url()})});
  await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b));localStorage.setItem('relphiSkyChartLastModeV1','comparison')},{a,b});
  try{
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});
   await page.waitForTimeout(15000);
   const state=await page.evaluate(()=>{const mount=document.querySelector('#skyFoundationWheelMount'),root=document.querySelector('#skyFoundationRoot'),wheel=mount?.querySelector('.sky-foundation-wheel');return{
    href:location.href,base:document.baseURI,rootBusy:root?.getAttribute('aria-busy'),bodyWidth:document.body?.scrollWidth,
    mountVisible:mount?getComputedStyle(mount).visibility:null,
    wheelCount:mount?.querySelectorAll('.sky-foundation-wheel').length??0,
    wheelOuter:wheel?.outerHTML.slice(0,240)??null,
    status:document.getElementById('previewStatus')?.textContent?.slice(0,250)??null,
    styles:[...document.styleSheets].length,scripts:document.scripts.length,
    text:document.body?.innerText?.slice(0,300)
   }});
   console.log(kind.toUpperCase(),JSON.stringify({state,errors:errors.slice(0,15),failures:failures.slice(0,30)}));
   await page.screenshot({path:`sky-remote-${kind}.png`,fullPage:true});
   if(kind==='preview'&&(!state.wheelCount||state.mountVisible==='hidden'||state.rootBusy!=='false'||errors.length)){failed=true;console.error('FAILED: hosted exact-revision preview did not display a ready wheel');}
   if(kind==='preview'&&!failed){
     // The commit-specific preview must resolve its updated glyph asset, not just display a wheel.
     const marks=await page.evaluate(async()=>{
       const NS='http://www.w3.org/2000/svg';
       const component=window.RelphiGlyphComponent;
       if(!component)throw new Error('Canonical glyph component unavailable in exact preview');
       const results=[];
       for(const id of ['retrograde','anti-vertex']){
         const svg=document.createElementNS(NS,'svg');
         svg.setAttribute('viewBox','-32 -32 64 64');
         svg.style.cssText='position:fixed;right:12px;top:12px;width:64px;height:64px;z-index:99999';
         document.body.appendChild(svg);
         try{
           const bubble=component.createBubble(svg,id,{radius:19,padding:1,color:'#111'});
           await bubble.ready;
           const art=svg.querySelector('.relphi-glyph-'+id);
           if(!art)throw new Error(id+' artwork failed to mount');
           const box=art.getBoundingClientRect(),ring=bubble.circle.getBoundingClientRect();
           const cx=ring.x+ring.width/2,cy=ring.y+ring.height/2;
           results.push({
             id,
             paths:art.querySelectorAll('path').length,
             text:[...art.querySelectorAll('text')].map(t=>({value:t.textContent,family:getComputedStyle(t).fontFamily,weight:getComputedStyle(t).fontWeight,x:Number(t.getAttribute('x')),y:Number(t.getAttribute('y'))})),
             internalRings:art.querySelectorAll('circle').length,
             dx:box.x+box.width/2-cx,
             dy:box.y+box.height/2-cy,
             farthest:Math.max(...[[box.left,box.top],[box.left,box.bottom],[box.right,box.top],[box.right,box.bottom]].map(([x,y])=>Math.hypot(x-cx,y-cy))),
             firstPath:art.querySelector('path')?.getAttribute('d')?.slice(0,25)||''
           });
         }finally{svg.remove()}
       }
       return results;
     });
     console.log('PREVIEW MONTSERRAT LETTER MASTERS',JSON.stringify(marks));
     const retro=marks.find(g=>g.id==='retrograde'),anti=marks.find(g=>g.id==='anti-vertex');
     assert.equal(retro?.paths,1,'Retrograde retains the single X outline in the canonical master');
     assert.equal(retro.text.length,1,'Retrograde must use one P letter from the planet-name font');
     assert.equal(retro.text[0].value,'P');
     assert.match(retro.text[0].family,/system-ui/i);
     assert.equal(retro.text[0].weight,'700');
     assert.ok(retro.firstPath.startsWith('M60.1246'));
     assert.equal(retro.internalRings,0);
     assert.ok(Math.abs(retro.dx)<1&&Math.abs(retro.dy)<1,'Centered in the existing circle');
     assert.ok(retro.farthest<16.825,'Original artwork stays inside existing ring');
     assert.equal(anti?.paths,3);
     assert.ok(anti.firstPath.startsWith('M27 57.623'));
     assert.equal(anti.internalRings,0);
     assert.ok(Math.abs(anti.dx)<1&&Math.abs(anti.dy)<1);
     assert.ok(anti.farthest<16.825);
     await page.waitForFunction(()=>{
       const row=[...document.querySelectorAll('#skyFoundationA .sky-foundation-row')]
         .find(x=>x.querySelector('.sky-foundation-row-name')?.textContent?.startsWith('Saturn'));
       return !!row?.querySelector('.sky-placement-rx .relphi-glyph-retrograde path');
     },null,{timeout:20000});
     const placementMark=await page.evaluate(()=>{
       const row=[...document.querySelectorAll('#skyFoundationA .sky-foundation-row')]
         .find(x=>x.querySelector('.sky-foundation-row-name')?.textContent?.startsWith('Saturn'));
       const art=row.querySelector('.sky-placement-rx .relphi-glyph-retrograde');
       return{
         height:art.getBoundingClientRect().height,
         source:art.dataset.canonicalGlyphId,
         original:art.querySelector('path')?.getAttribute('d')?.slice(0,12),
         textCount:art.querySelectorAll('text').length,
         rawImage:!!row.querySelector('.sky-placement-rx img')
       };
     });
     assert.ok(placementMark.height>=8&&placementMark.height<=16,'Original Retrograde must fit in name-row annotation');
     assert.equal(placementMark.textCount,1);
     assert.ok(placementMark.original.startsWith('M60.1246'));
     assert.equal(placementMark.source,'retrograde');
     assert.equal(placementMark.rawImage,false,'Placements must use shared canonical renderer');
     // Match the live planet-name P exactly, including its baseline and its separation from the name.
     const letterMetrics=await page.evaluate(()=>{
       const rows=[...document.querySelectorAll('#skyFoundationA .sky-foundation-row')];
       const saturn=rows.find(row=>row.querySelector('.sky-foundation-row-name')?.firstChild?.textContent==='Saturn');
       const pluto=rows.find(row=>row.querySelector('.sky-foundation-row-name')?.firstChild?.textContent==='Pluto');
       const label=saturn?.querySelector('.sky-foundation-row-name');
       const name=pluto?.querySelector('.sky-foundation-row-name');
       const mark=label?.querySelector('.sky-placement-rx');
       const p=mark?.querySelector('.relphi-glyph-retrograde text');
       if(!p||!name||!label)throw Error('Missing Saturn Retrograde P or Pluto name');
       const probe=document.createElement('span');probe.style.cssText='display:inline-block;width:0;height:0;padding:0;margin:0;border:0;vertical-align:baseline';
       label.insertBefore(probe,mark);
       const nameBaseline=probe.getBoundingClientRect().top;
       probe.remove();
       const matrix=p.getScreenCTM();
       const pBaseline=matrix.b*Number(p.getAttribute('x'))+matrix.d*Number(p.getAttribute('y'))+matrix.f;
       const s=getComputedStyle(name),c=document.createElement('canvas').getContext('2d');
       c.font=s.fontWeight+' '+s.fontSize+' '+s.fontFamily;
       const namePWidth=c.measureText('P').width;
       const glyphPWidth=p.getComputedTextLength()*Math.hypot(matrix.a,matrix.b);
       const range=document.createRange();range.selectNodeContents(label.firstChild);
       const nameRight=range.getBoundingClientRect().right;
       return{baselineError:pBaseline-nameBaseline,widthError:glyphPWidth-namePWidth,gap:p.getBoundingClientRect().left-nameRight,
         font:getComputedStyle(p).fontFamily,nameFont:s.fontFamily,weight:getComputedStyle(p).fontWeight,nameWeight:s.fontWeight};
     });
     console.log('PREVIEW RETROGRADE PLUTO FONT AND CHIRON NAME BASELINE',JSON.stringify(letterMetrics));
     assert.equal(letterMetrics.font,letterMetrics.nameFont,'Retrograde P must use Pluto name typeface');
     assert.equal(letterMetrics.weight,letterMetrics.nameWeight,'Retrograde P must use Pluto name font weight');
     assert.ok(Math.abs(letterMetrics.widthError)<0.25,'Retrograde P must match Pluto P at rendered name size');
     assert.ok(Math.abs(letterMetrics.baselineError)<0.65,'Retrograde P stem must end on the planet-name baseline');
     assert.ok(letterMetrics.gap>=3,'Retrograde must have visible separation from the planet name');
     // The reported defect concerns Chiron specifically, not the x within Rx.
     // Verify the P's painted capital height against Chiron's baseline.
     // SVG getBBox() includes font descent, including blank space below P.
     // Use canvas actualBoundingBoxAscent/Descent for real glyph ink; CSS
     // declarations and the SVG text layout box alone are insufficient.
     const chironInk=await page.evaluate(()=>{
       const row=[...document.querySelectorAll('#skyFoundationA .sky-foundation-row')]
         .find(node=>node.querySelector('.sky-foundation-row-name')?.firstChild?.textContent==='Chiron');
       const label=row?.querySelector('.sky-foundation-row-name');
       const p=label?.querySelector('.sky-placement-rx .relphi-glyph-retrograde text');
       const stem=label?.querySelector('.sky-placement-rx .relphi-glyph-retrograde path');
       if(!p)throw new Error('Chiron Rx must display a real canonical P');
       const baselineProbe=document.createElement('span');
       baselineProbe.style.cssText='display:inline-block;width:0;height:0;padding:0;margin:0;border:0;vertical-align:baseline';
       label.insertBefore(baselineProbe,label.querySelector('.sky-placement-rx'));
       const baseline=baselineProbe.getBoundingClientRect().top;
       baselineProbe.remove();
       const font=getComputedStyle(label),actual=getComputedStyle(p),
         canvas=document.createElement('canvas'),context=canvas.getContext('2d');
       context.font=font.fontWeight+' '+font.fontSize+' '+font.fontFamily;
       const nameP=context.measureText('P');
       const ctm=p.getScreenCTM();
       const pBaseline=ctm.b*Number(p.getAttribute('x'))+ctm.d*Number(p.getAttribute('y'))+ctm.f;
       const pScale=p.getComputedTextLength()*Math.hypot(ctm.a,ctm.b)/nameP.width;
       const paintedBottom=pBaseline+nameP.actualBoundingBoxDescent*pScale;
       const paintedHeight=(nameP.actualBoundingBoxAscent+nameP.actualBoundingBoxDescent)*pScale;
       const stemInkBottom=new DOMPoint(53.45,70).matrixTransform(stem.getScreenCTM()).y;
       const marker=p.getBoundingClientRect(),labelBox=label.getBoundingClientRect();
       return{
         baseline,
         pInkBottom:paintedBottom,
         stemInkBottom,stemInkGap:stemInkBottom-baseline,
         pInkGap:paintedBottom-baseline,
         pCapHeight:paintedHeight,
         nameCapHeight:nameP.actualBoundingBoxAscent+nameP.actualBoundingBoxDescent,
         namePDescent:nameP.actualBoundingBoxDescent,
         namePAscent:nameP.actualBoundingBoxAscent,
         font:actual.fontFamily,nameFont:font.fontFamily,
         weight:actual.fontWeight,nameWeight:font.fontWeight,
         pWidth:p.getComputedTextLength()*Math.hypot(ctm.a,ctm.b),
         namePWidth:nameP.width,
         labelRight:(()=>{const range=document.createRange();range.selectNodeContents(label.firstChild);return range.getBoundingClientRect().right})(),
         markerLeft:marker.left,
         labelBoxHeight:labelBox.height,
         glyphWidth:marker.width
       };
     });
     console.log('CHIRON RX VISIBLE P STEM VS NAME BASELINE',JSON.stringify(chironInk));
     assert.equal(chironInk.font,chironInk.nameFont,'Chiron P matches the actual name font');
     assert.equal(chironInk.weight,chironInk.nameWeight,'Chiron P matches the actual name weight');
     assert.ok(Math.abs(chironInk.pWidth-chironInk.namePWidth)<.25,'Chiron P has the same width as Pluto P');
     assert.ok(Math.abs(chironInk.pCapHeight-chironInk.nameCapHeight)<.6,'Retrograde P cap height matches Pluto letter height');
     assert.ok(Math.abs(chironInk.pInkGap-chironInk.namePDescent)<1.1,
       'Painted P stem must reach Chiron baseline, not merely the declared SVG baseline');
     assert.ok(chironInk.stemInkGap>.15&&chironInk.stemInkGap<1.5,
       'Actual P stem extension must reach Chiron painted baseline, beyond the undershooting font ink');
     assert.ok(chironInk.markerLeft-chironInk.labelRight>=3,
       'Chiron name and retrograde letter must have comfortable separation');
     await page.screenshot({path:'chiron-retrograde-visible-baseline.png',fullPage:true});
     // The reported screenshot was captured on an iPhone. Recheck the actual
     // Chiron ink on the narrow Sky Chart—not merely the Master Glyph gallery.
     await page.setViewportSize({width:390,height:844});
     const mobileChiron=await page.evaluate(()=>{
       const row=[...document.querySelectorAll('#skyFoundationA .sky-foundation-row')]
         .find(n=>n.querySelector('.sky-foundation-row-name')?.firstChild?.textContent==='Chiron');
       const label=row?.querySelector('.sky-foundation-row-name');
       const p=label?.querySelector('.sky-placement-rx .relphi-glyph-retrograde text');
       const stem=label?.querySelector('.sky-placement-rx .relphi-glyph-retrograde path');
       if(!p)throw new Error('Mobile Chiron P not rendered');
       const probe=document.createElement('span');
       probe.style.cssText='display:inline-block;width:0;height:0;padding:0;margin:0;border:0;vertical-align:baseline';
       label.insertBefore(probe,label.querySelector('.sky-placement-rx'));
       const baseline=probe.getBoundingClientRect().top;
       probe.remove();
       const matrix=p.getScreenCTM(),name=getComputedStyle(label),
         font=getComputedStyle(p),range=document.createRange(),
         canvas=document.createElement('canvas'),context=canvas.getContext('2d');
       context.font=name.fontWeight+' '+name.fontSize+' '+name.fontFamily;
       const nameP=context.measureText('P');
       const pBaseline=matrix.b*Number(p.getAttribute('x'))+matrix.d*Number(p.getAttribute('y'))+matrix.f;
       const width=p.getComputedTextLength()*Math.hypot(matrix.a,matrix.b);
       const paintedBottom=pBaseline+nameP.actualBoundingBoxDescent*width/nameP.width;
       const stemInkBottom=new DOMPoint(53.45,70).matrixTransform(stem.getScreenCTM()).y;
       range.selectNodeContents(label.firstChild);
       return{
         pInkBottom:paintedBottom,stemInkBottom,stemInkGap:stemInkBottom-baseline,
         baseline,pWidth:width,namePWidth:nameP.width,font:font.fontFamily,nameFont:name.fontFamily,
         nameGap:p.getBoundingClientRect().left-range.getBoundingClientRect().right
       };
     });
     console.log('MOBILE CHIRON RX VISIBLE STEM',JSON.stringify(mobileChiron));
     assert.equal(mobileChiron.font,mobileChiron.nameFont,'Mobile name and retrograde P use the same font');
     assert.ok(Math.abs(mobileChiron.pWidth-mobileChiron.namePWidth)<.25,'Mobile P matches Pluto P width');
     assert.ok(Math.abs(mobileChiron.pInkBottom-mobileChiron.baseline)<1.1,
       'Mobile painted P stem must meet the neighboring Chiron baseline');
     assert.ok(mobileChiron.stemInkGap>.15&&mobileChiron.stemInkGap<1.5,
       'Mobile P stem extension must reach the actual Chiron ink line');
     assert.ok(mobileChiron.nameGap>=3,'Mobile Rx must remain clearly separate from name');
     await page.screenshot({path:'chiron-retrograde-mobile-visible-baseline.png',fullPage:true});
     await page.setViewportSize({width:1200,height:820});


     const saturnIdentity=await page.evaluate(()=>{
       const row=[...document.querySelectorAll('#skyFoundationA .sky-foundation-row')]
         .find(node=>node.querySelector('.sky-foundation-row-name')?.firstChild?.textContent==='Saturn');
       return {label:row?.querySelector('.sky-foundation-row-name')?.firstChild?.textContent,
         duplicateLabel:row?.dataset.placementLabel,
         id:row?.dataset.placement,interactive:row?.dataset.interactive};
     });
     assert.equal(saturnIdentity.label,'Saturn','The glyph artwork must not become semantic placement name');
     assert.equal(saturnIdentity.duplicateLabel,undefined,'Name must have one DOM source, not parallel dataset state');
     assert.equal(saturnIdentity.id,'saturn','Retrograde must not break placement selection identity');
     assert.equal(saturnIdentity.interactive,'placement','Retrograde must preserve placement interactions');
     await page.evaluate(()=>{
       window.__retrogradeCopied='';
       Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
         writeText:async value=>{window.__retrogradeCopied=String(value)}
       }});
     });
     const placementsCopy=page.locator('#skyFoundationA [data-copy-placements]').first();
     assert.equal(await placementsCopy.count(),1,'Use the actual Sky A Placements Copy control');
     await placementsCopy.click();
     await page.waitForFunction(()=>!!window.__retrogradeCopied,null,{timeout:6000});
     const copiedPlacements=await page.evaluate(()=>window.__retrogradeCopied);
     assert.match(copiedPlacements,/\*\*Saturn Rx\*\*/,'Placements Copy must contain Saturn Rx once');
     assert.doesNotMatch(copiedPlacements,/SaturnPx|Saturn P x/,'Canonical SVG text must not pollute copy');
     console.log('PREVIEW PLACEMENTS COPY',JSON.stringify({saturnIdentity,
       saturnLine:copiedPlacements.split('\n').find(line=>line.includes('Saturn'))}));

     const relationshipsRx=await page.evaluate(()=>[...document.querySelectorAll('#skyFoundationRelationshipList .sky-rx-glyph-overlay')].map(node=>({
       art:!!node.querySelector('.relphi-glyph-retrograde'),
       path:node.querySelector('.relphi-glyph-retrograde path')?.getAttribute('d')?.slice(0,12),
       mask:getComputedStyle(node).maskImage,
        height:node.querySelector('.relphi-glyph-retrograde')?.getBoundingClientRect().height||0
     })));
     console.log('PREVIEW PLACEMENTS AND RELATIONSHIPS RETROGRADE',JSON.stringify({placementMark,relationshipsRx}));
     assert.ok(relationshipsRx.length>0,'Retrograde Saturn relationship must have motion indicator');
     assert.ok(relationshipsRx.every(r=>r.art&&r.path?.startsWith('M60.1246')),'Relationships must render registry-owned SVG');
     assert.ok(relationshipsRx.every(r=>r.mask==='none'),'Relationships must not use raw asset CSS masks');
      const relationshipSizes=relationshipsRx.map(r=>r.height).filter(h=>h>0);
      assert.ok(relationshipSizes.length>0,'Relationships must display a visible motion marker');
      assert.ok(relationshipSizes.every(h=>h>=7&&h<=20),'Relationships Retrograde must stay compact beside planet glyphs');

     await page.locator('#skyFoundationA [data-sky-vocab-view-button="vocab"]').click();
     await page.waitForFunction(()=>!!document.querySelector('#skyFoundationA .sky-vocab-token[data-vocab-id="saturn"][data-vocab-retrograde="true"] .sky-vocab-rx .relphi-glyph-retrograde path'),null,{timeout:20000});
     const vocab=await page.evaluate(()=>{
       const node=document.querySelector('#skyFoundationA .sky-vocab-token[data-vocab-id="saturn"][data-vocab-retrograde="true"]');
       const mark=node?.querySelector('.sky-vocab-rx');
       const text=node?window.RelphiVocabCopySerializer?.serializeToken?.(node):null;
       return {visible:!!mark,source:mark?.querySelector('.relphi-glyph-retrograde')?.dataset.canonicalGlyphId,text};
     });
     console.log('PREVIEW VOCAB RETROGRADE',JSON.stringify(vocab));
     assert.equal(vocab.visible,true);
     assert.equal(vocab.source,'retrograde');
     assert.match(vocab.text||'',/ Rx/);
     const vocabSize=await page.evaluate(()=>{
       const mark=document.querySelector('#skyFoundationA .sky-vocab-token[data-vocab-id="saturn"][data-vocab-retrograde="true"] .sky-vocab-rx');
       mark.closest('details.sky-vocab-group')?.setAttribute('open','');
       return mark.querySelector('.relphi-glyph-retrograde').getBoundingClientRect().height;
     });
     console.log('PREVIEW VOCAB RETROGRADE HEIGHT',vocabSize);
     assert.ok(vocabSize>=8&&vocabSize<=20,'Vocab Retrograde must stay proportional to the surrounding text');
     await page.screenshot({path:'sky-remote-preview-vocab.png',fullPage:true});
     await page.locator('#skyFoundationA [data-sky-vocab-view-button="placements"]').click();

     await page.setViewportSize({width:390,height:844});
     await page.waitForTimeout(350);
     const mobileRx=await page.evaluate(()=>{
       const row=[...document.querySelectorAll('#skyFoundationA .sky-foundation-row')].find(node=>node.querySelector('.sky-foundation-row-name')?.textContent?.startsWith('Saturn'));
       const mark=row?.querySelector('.sky-placement-rx .relphi-glyph-retrograde');
       return {placementsHeight:mark?.getBoundingClientRect().height||0,
         relationshipMarks:document.querySelectorAll('#skyFoundationRelationshipList .sky-rx-glyph-overlay .relphi-glyph-retrograde path').length};
     });
     console.log('PREVIEW MOBILE RETROGRADE',JSON.stringify(mobileRx));
     assert.ok(mobileRx.placementsHeight>=8&&mobileRx.placementsHeight<=22,'Mobile Placements must retain compact Retrograde');
     assert.ok(mobileRx.relationshipMarks>0,'Mobile Relationships must retain canonical Retrograde');
     await page.screenshot({path:'sky-remote-preview-mobile.png',fullPage:true});
     await page.setViewportSize({width:1200,height:820});

     await page.locator('#skyFoundationB [data-sky-drawer-tab="where"]').click();
     await page.waitForSelector('#skyFoundationB .sky-where-when-editor [data-ww-action="refresh-now"]',{timeout:15000});
     await page.waitForSelector('#skyFoundationB [data-draft-heptagram-ready="true"] .sky-where-when-draft-heptagram',{timeout:20000});
     const detail=await page.evaluate(()=>{
       const hepta=document.querySelector('#skyFoundationB .sky-where-when-draft-heptagram');
       const future=hepta?.querySelector('.sky-ph-week-segment.future');
       const current=hepta?.querySelector('.sky-ph-week-segment.current');
       const read=n=>{if(!n)return null;const cs=getComputedStyle(n);return{color:cs.stroke,width:cs.strokeWidth,dash:cs.strokeDasharray}};
       const mount=document.getElementById('skyFoundationWheelMount');
       return{canonical:hepta?.dataset.canonicalHeptagramReady,nowRefresh:!!document.querySelector('#skyFoundationB .sky-where-when-editor [data-ww-action="refresh-now"]'),liveToggle:!!document.querySelector('#skyFoundationB .sky-where-when-editor [data-ww-field="live"]'),
         future:read(future),current:read(current),wheelVisible:getComputedStyle(mount).visibility};
     });
     console.log('PREVIEW WHERE/WHEN DESIGN',JSON.stringify(detail));
     assert.equal(detail.canonical,'true');
     assert.equal(detail.nowRefresh,true);
     assert.equal(detail.liveToggle,false);
     assert.equal(detail.wheelVisible,'visible');
     assert.equal(detail.future?.dash,'none');
     assert.equal(detail.current?.dash,'none');
     assert.equal(parseFloat(detail.future?.width),5);
     assert.equal(parseFloat(detail.current?.width),5);
     await page.screenshot({path:'sky-remote-preview-open.png',fullPage:true});
   }
  }catch(e){failed=true;console.error(kind+' FAILED '+e.message);await page.screenshot({path:`sky-remote-${kind}.png`,fullPage:true}).catch(()=>{})}
  await ctx.close();
 }
  // The deployed host still runs the previous loader until approval and merge.
  // Validate the modified self-hosted loader from this PR on a local HTTP server,
  // resolving the original canonical page and its assets directly from the SHA.
  // This does not install a second glyph source or claim the live host was updated.
  const loader=await readFile(new URL('../sky-chart-preview/sky-chart.html',import.meta.url),'utf8');
  const masterPage=await readFile(new URL('../glyphs-unified-preview.html',import.meta.url),'utf8');
  const server=createServer((request,response)=>{
    const pathname=new URL(request.url,'http://localhost').pathname;
    const body=pathname==='/sky-chart-preview/sky-chart.html'?loader:
      pathname==='/glyphs-unified-preview.html'?masterPage:null;
    if(body===null){response.writeHead(404).end('Not Found');return}
    response.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
    response.end(body);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const gallery=await browser.newPage({viewport:{width:1100,height:900}});
  try{
    const url=`http://127.0.0.1:${server.address().port}/glyphs-unified-preview.html?ref=${ref}`;
    await gallery.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    await gallery.waitForURL(url=>url.pathname==='/sky-chart-preview/sky-chart.html'&&url.searchParams.get('page')==='glyphs-unified-preview.html',{timeout:30000});
    await gallery.waitForFunction(()=>{
      const card=id=>[...document.querySelectorAll('#ugGrid .ug-card')].find(node=>node.querySelector('.ug-id')?.textContent===id);
      return !!card('retrograde')?.querySelector('.relphi-glyph-retrograde path')
        && !!card('anti-vertex')?.querySelector('.relphi-glyph-anti-vertex path');
    },null,{timeout:45000});
    const galleryState=await gallery.evaluate(()=>{
      const card=id=>[...document.querySelectorAll('#ugGrid .ug-card')].find(node=>node.querySelector('.ug-id')?.textContent===id);
      return {
        title:document.title,
        status:document.getElementById('ugStatus')?.textContent||'',
        masters:window.RelphiGlyphRegistry?.entries?.length||0,
        marks:['retrograde','anti-vertex'].map(id=>{
          const node=card(id),art=node?.querySelector('.relphi-glyph-'+id);
          return {id,paths:art?.querySelectorAll('path').length,letters:[...art?.querySelectorAll('text')||[]].map(t=>t.textContent),firstPath:art?.querySelector('path')?.getAttribute('d')?.slice(0,14),
            source:art?.dataset.canonicalGlyphId,ring:node?.querySelector('.relphi-glyph-bubble>circle')?.style.opacity};
        })
      };
    });
    console.log('COMMIT MASTER GLYPH LIST',JSON.stringify(galleryState));
    assert.match(galleryState.title,/Master Glyph List/);
    assert.ok(galleryState.masters>80,'Original canonical master list must load');
    const galleryRetro=galleryState.marks.find(g=>g.id==='retrograde');
     assert.equal(galleryRetro?.source,'retrograde');
     assert.equal(galleryRetro.paths,1);
     assert.deepEqual(galleryRetro.letters,['P']);
      assert.ok(galleryRetro.firstPath.startsWith('M60.1246'));
     assert.equal(galleryRetro.ring,'1');
     const galleryAnti=galleryState.marks.find(g=>g.id==='anti-vertex');
     assert.equal(galleryAnti?.source,'anti-vertex');
     assert.equal(galleryAnti.paths,3);
     assert.ok(galleryAnti.firstPath.startsWith('M27 57.623'));
     assert.equal(galleryAnti.ring,'1');
     await gallery.locator('[data-circle="false"]').click();
    await gallery.waitForFunction(()=>[...document.querySelectorAll('#ugGrid .ug-card .relphi-glyph-bubble>circle')].every(c=>c.style.opacity==='0'),null,{timeout:30000});
    await gallery.locator('[data-circle="true"]').click();
    await gallery.waitForFunction(()=>[...document.querySelectorAll('#ugGrid .ug-card .relphi-glyph-bubble>circle')].every(c=>c.style.opacity==='1'),null,{timeout:30000});
    await gallery.screenshot({path:'sky-remote-master-glyphs.png',fullPage:true});

    const typefaceURL='http://127.0.0.1:'+server.address().port+'/sky-chart-preview/sky-chart.html?ref='+ref+'&page=glyphs-unified-preview.html&mock=rx-typeface';
    await gallery.goto(typefaceURL,{waitUntil:'domcontentloaded',timeout:30000});
    await gallery.waitForFunction(()=>document.getElementById('ugTypefaceStudy')?.dataset.mockReady==='true',null,{timeout:45000});
    for(const width of [1100,390]){
      await gallery.setViewportSize({width,height:900});
      const state=await gallery.evaluate(()=>{
        const root=document.getElementById('ugTypefaceStudy');
        const reference=root.querySelector('[data-typeface-source="vertex"] text');
        const alternative=root.querySelector('[data-typeface-source="mock"] text');
        const label=root.querySelector('.ug-typeface-placement span:first-child');
        const mark=root.querySelector('.ug-typeface-placement [data-typeface-inline]');
        const font=node=>{const style=getComputedStyle(node);return{family:style.fontFamily,size:style.fontSize,weight:style.fontWeight}};
        return{ready:root.dataset.mockReady,reference:font(reference),alternative:font(alternative),text:alternative.textContent,
          customPaths:root.querySelectorAll('[data-typeface-source="mock"] path').length,
          canonicalSaturn:!!root.querySelector('[data-typeface-planet] .relphi-glyph-saturn'),
          gap:mark.getBoundingClientRect().left-label.getBoundingClientRect().right};
      });
      console.log('HOSTED RETROGRADE TYPEFACE '+width,JSON.stringify(state));
      assert.equal(state.ready,'true');
      assert.equal(state.text,'Px');
      assert.deepEqual(state.alternative,state.reference);
      assert.equal(state.alternative.size,'16px');
      assert.equal(state.customPaths,0);
      assert.equal(state.canonicalSaturn,true);
      assert.ok(state.gap>=4);
      await gallery.screenshot({path:'sky-remote-retrograde-typeface-'+width+'.png',fullPage:true});
    }
  }catch(error){failed=true;console.error('PR MASTER GLYPH LIST PREVIEW FAILED '+error.message)}
  finally{await gallery.close();await new Promise(resolve=>server.close(resolve))}
}finally{await browser.close()}
if(failed)process.exitCode=1;
