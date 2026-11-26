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
 return {name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{dateTime:instant.slice(0,16),instant,location,locationQuery:location,timeZone:tz,latitude:lat,longitude:lon,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(points).map(([k,v])=>[k,{...point(k,v+offset),retrograde:['Saturn','Uranus','Neptune','Chiron'].includes(k)&&offset===0}]))};
}
const a=sky('Test A',0,'1985-10-08T08:37:00Z','Malden, Massachusetts, United States',42.4251,-71.0662,'America/New_York');
const b=sky('Test B',29,'2026-10-17T12:00:00Z','Salt Lake City, Utah, United States',40.7608,-111.891,'America/Denver');
async function verifyPaintedStemAgainstChiron(page,screen){
  const png=await page.screenshot({path:'sky-remote-chiron-ink-'+screen+'.png',fullPage:true});
  const evidence=await page.evaluate(async encoded=>{
    const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
    const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
    const canvas=document.createElement('canvas');
    canvas.width=bitmap.width;canvas.height=bitmap.height;
    const context=canvas.getContext('2d',{willReadFrequently:true});
    context.drawImage(bitmap,0,0);bitmap.close();
    const rgba=context.getImageData(0,0,canvas.width,canvas.height).data;
    const row=[...document.querySelectorAll('#skyFoundationA .sky-foundation-row')]
      .find(n=>n.querySelector('.sky-foundation-row-name')?.firstChild?.textContent==='Chiron');
    const label=row?.querySelector('.sky-foundation-row-name');
    const p=label?.querySelector('.sky-placement-rx .relphi-glyph-retrograde text');
    if(!p)throw new Error('Cannot inspect painted Retrograde P stem');
    const range=document.createRange();range.selectNodeContents(label.firstChild);
    const name=range.getBoundingClientRect();
    // The P remains an unmodified font letter; measure its natural left stroke.
    const stem=new DOMPoint(50.15,66).matrixTransform(p.getScreenCTM());
    const xOffset=window.scrollX,yOffset=window.scrollY;
    const darkBottom=(from,to)=>{
      let lowest=-1,inkCount=0;
      const left=Math.max(0,Math.floor(from+xOffset));
      const right=Math.min(canvas.width,Math.ceil(to+xOffset));
      const top=Math.max(0,Math.floor(name.top+yOffset-2));
      const bottom=Math.min(canvas.height,Math.ceil(name.bottom+yOffset+3));
      for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
        const i=(y*canvas.width+x)*4;
        if(rgba[i]<155&&rgba[i+1]<155&&rgba[i+2]<155&&rgba[i+3]>200){
          lowest=y;inkCount++;
        }
      }
      return {bottom:lowest,count:inkCount,left,right};
    };
    const nameInk=darkBottom(name.right-6,name.right-.5);
    const pStemInk=darkBottom(stem.x-0.8,stem.x+0.8);
    return{screen,nameInk,pStemInk,pStemX:stem.x,
      difference:pStemInk.bottom-nameInk.bottom,originalTextRight:name.right};
  },png.toString('base64'));
  console.log('VISIBLE RASTER CHIRON VS P STEM',JSON.stringify(evidence));
  assert.ok(evidence.nameInk.count>0&&evidence.pStemInk.count>0,
    'Both Chiron n and Retrograde P stem must have measurable dark pixels');
  assert.ok(Math.abs(evidence.difference)<=1,
    'Natural P stem meets adjacent name baseline within one antialiased pixel');
}

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
   // CDN and ephemeris startup can exceed a fixed 15-second wait.
   // The existing Sky Chart root owns readiness; observe that contract.
   await page.waitForFunction(()=>{
     const root=document.getElementById('skyFoundationRoot');
     const mount=document.getElementById('skyFoundationWheelMount');
     const wheel=mount?.querySelector('.sky-foundation-wheel');
     // The parent mount may inherit 'hidden' during layout stabilization,
     // while the child SVG explicitly renders visible. Inspect the actual ink.
     return root?.getAttribute('aria-busy')==='false'&&
       !!wheel&&getComputedStyle(wheel).visibility==='visible'&&
       wheel.getBoundingClientRect().width>0&&wheel.getBoundingClientRect().height>0;
   },null,{timeout:60000}).catch(error=>{
     console.error(kind.toUpperCase()+' WHEEL READINESS DIAGNOSTIC',error.message);
   });
   const state=await page.evaluate(()=>{const mount=document.querySelector('#skyFoundationWheelMount'),root=document.querySelector('#skyFoundationRoot'),wheel=mount?.querySelector('.sky-foundation-wheel');return{
    href:location.href,base:document.baseURI,rootBusy:root?.getAttribute('aria-busy'),bodyWidth:document.body?.scrollWidth,
    mountVisibility:mount?getComputedStyle(mount).visibility:null,
     wheelVisibility:wheel?getComputedStyle(wheel).visibility:null,
     wheelArea:wheel?wheel.getBoundingClientRect().width*wheel.getBoundingClientRect().height:0,
    wheelCount:mount?.querySelectorAll('.sky-foundation-wheel').length??0,
    wheelOuter:wheel?.outerHTML.slice(0,240)??null,
    status:document.getElementById('previewStatus')?.textContent?.slice(0,250)??null,
    styles:[...document.styleSheets].length,scripts:document.scripts.length,
    text:document.body?.innerText?.slice(0,300)
   }});
   console.log(kind.toUpperCase(),JSON.stringify({state,errors:errors.slice(0,15),failures:failures.slice(0,30)}));
   await page.screenshot({path:`sky-remote-${kind}.png`,fullPage:true});
   if(kind==='preview'&&(!state.wheelCount||state.wheelVisibility!=='visible'||state.wheelArea<=0||state.rootBusy!=='false'||errors.length)){failed=true;console.error('FAILED: hosted exact-revision preview did not display a ready wheel');}
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
     assert.equal(retro?.paths,0,'Uploaded type design needs no synthetic paths');
     assert.equal(retro.text.length,3,'Uploaded Retrograde is three aligned text elements');
     assert.deepEqual(retro.text.map(t=>t.value),['P','l','x']);
     assert.ok(retro.text.every(t=>/Montserrat/i.test(t.family)),'Use original Montserrat Bold');
     assert.ok(retro.text.every(t=>t.weight==='700'));
     assert.equal(retro.firstPath,'');
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
       return !!row?.querySelector('.sky-placement-rx .relphi-glyph-retrograde text');
     },null,{timeout:20000});
     const placementMark=await page.evaluate(()=>{
       const row=[...document.querySelectorAll('#skyFoundationA .sky-foundation-row')]
         .find(x=>x.querySelector('.sky-foundation-row-name')?.textContent?.startsWith('Saturn'));
       const art=row.querySelector('.sky-placement-rx .relphi-glyph-retrograde');
       return{
         height:art.getBoundingClientRect().height,
         source:art.dataset.canonicalGlyphId,
         letters:[...art.querySelectorAll('text')].map(t=>t.textContent),
         textCount:art.querySelectorAll('text').length,
         rawImage:!!row.querySelector('.sky-placement-rx img')
       };
     });
     assert.ok(placementMark.height>=8&&placementMark.height<=16,'Original Retrograde must fit in name-row annotation');
     assert.equal(placementMark.textCount,3);
     assert.deepEqual(placementMark.letters,['P','l','x']);
     assert.equal(placementMark.source,'retrograde');
     assert.equal(placementMark.rawImage,false,'Placements must use shared canonical renderer');
     // Every retrograde body uses the exact three text layers from the uploaded SVG.
     // Chiron is a test case, not the specification or the owner of the symbol.
     async function inspectRetrogradePlacements(label){
       return page.evaluate(label=>{
         const bodies=['Saturn','Uranus','Neptune','Chiron'];
         const rows=[...document.querySelectorAll('#skyFoundationA .sky-foundation-row')];
         return bodies.map(name=>{
           const row=rows.find(r=>r.querySelector('.sky-foundation-row-name')?.firstChild?.textContent===name);
           const wrapper=row?.querySelector('.sky-placement-rx');
           const art=wrapper?.querySelector('.relphi-glyph-retrograde');
           const p=art?.querySelector('#text1');
           const elements=art?[...art.querySelectorAll('text')]:[];
           if(!p||elements.length!==3)throw Error('Missing uploaded Rx layers on '+name);
           const nameRange=document.createRange();
           nameRange.selectNodeContents(row.querySelector('.sky-foundation-row-name').firstChild);
           return{
             name,screen:label,letters:elements.map(t=>t.textContent),
             fonts:elements.map(t=>getComputedStyle(t).fontFamily),
             weights:elements.map(t=>getComputedStyle(t).fontWeight),
             colors:elements.map(t=>getComputedStyle(t).fill),
             expectedColor:getComputedStyle(row.querySelector('.sky-foundation-row-name')).color,
             gap:p.getBoundingClientRect().left-nameRange.getBoundingClientRect().right,
             height:art.getBoundingClientRect().height,
             widths:elements.map(t=>t.getBoundingClientRect().width),
             paths:art.querySelectorAll('path,rect,line,polygon,circle').length,
             originalLTransform:art.querySelector('#text2')?.getAttribute('transform'),
             staticMaster:art.dataset.staticMaster,
             source:art.dataset.canonicalGlyphId
           };
         });
       },label);
     }
     const placements=await inspectRetrogradePlacements('desktop');
     console.log('USER-UPLOADED RETROGRADE ALL PLACEMENTS',JSON.stringify(placements));
     for(const entry of placements){
       assert.deepEqual(entry.letters,['P','l','x'],'All retrograde marks use uploaded P–l–x');
       assert.ok(entry.fonts.every(x=>/Montserrat/i.test(x)),'Keep the authored Montserrat');
       assert.ok(entry.weights.every(w=>w==='700'),'Keep the authored Bold weight');
       assert.ok(entry.colors.every(x=>x===entry.expectedColor),'Use the existing placement color owner');
       assert.ok(entry.gap>=3,'Maintain separation from the placement name');
       assert.ok(entry.height>6&&entry.height<20,'Keep the mark compact in Placements');
       assert.equal(entry.paths,0,'No invented R strokes, P foot, or X geometry');
       assert.equal(entry.originalLTransform,'scale(1.0259205,0.97473437)');
       assert.equal(entry.staticMaster,'true');
       assert.equal(entry.source,'retrograde');
     }
     await page.screenshot({path:'sky-remote-preview-user-rx-desktop.png',fullPage:true});
     await page.setViewportSize({width:390,height:844});
     const mobilePlacements=await inspectRetrogradePlacements('mobile');
     console.log('USER-UPLOADED RETROGRADE MOBILE',JSON.stringify(mobilePlacements));
     for(const entry of mobilePlacements){
       assert.deepEqual(entry.letters,['P','l','x']);
       assert.ok(entry.colors.every(x=>x===entry.expectedColor));
       assert.ok(entry.gap>=3&&entry.height>6&&entry.height<20);
     }
     await page.screenshot({path:'sky-remote-preview-user-rx-mobile.png',fullPage:true});
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
       letters:[...node.querySelectorAll('.relphi-glyph-retrograde text')].map(t=>t.textContent),
       mask:getComputedStyle(node).maskImage,
        height:node.querySelector('.relphi-glyph-retrograde')?.getBoundingClientRect().height||0
     })));
     console.log('PREVIEW PLACEMENTS AND RELATIONSHIPS RETROGRADE',JSON.stringify({placementMark,relationshipsRx}));
     assert.ok(relationshipsRx.length>0,'Retrograde Saturn relationship must have motion indicator');
     assert.ok(relationshipsRx.every(r=>r.art&&r.letters.join('')==='Plx'),'Relationships must reuse all three uploaded text layers');
     assert.ok(relationshipsRx.every(r=>r.mask==='none'),'Relationships must not use raw asset CSS masks');
      const relationshipSizes=relationshipsRx.map(r=>r.height).filter(h=>h>0);
      assert.ok(relationshipSizes.length>0,'Relationships must display a visible motion marker');
      assert.ok(relationshipSizes.every(h=>h>=7&&h<=20),'Relationships Retrograde must stay compact beside planet glyphs');

     await page.locator('#skyFoundationA [data-sky-vocab-view-button="vocab"]').click();
     await page.waitForFunction(()=>!!document.querySelector('#skyFoundationA .sky-vocab-token[data-vocab-id="saturn"][data-vocab-retrograde="true"] .sky-vocab-rx .relphi-glyph-retrograde text'),null,{timeout:20000});
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
         relationshipMarks:document.querySelectorAll('#skyFoundationRelationshipList .sky-rx-glyph-overlay .relphi-glyph-retrograde text').length};
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
      return !!card('retrograde')?.querySelector('.relphi-glyph-retrograde text')
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
     assert.equal(galleryRetro.paths,0);
     assert.deepEqual(galleryRetro.letters,['P','l','x']);
      assert.equal(galleryRetro.firstPath,undefined);
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
