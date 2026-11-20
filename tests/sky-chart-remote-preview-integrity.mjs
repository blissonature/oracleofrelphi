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
 const points={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:asc,Midheaven:76.28};
 return {name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{dateTime:instant.slice(0,16),instant,location,locationQuery:location,timeZone:tz,latitude:lat,longitude:lon,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(points).map(([k,v])=>[k,{...point(k,v+offset),retrograde:k==='Saturn'&&offset===0}]))};
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
             text:[...art.querySelectorAll('text')].map(t=>({value:t.textContent,family:getComputedStyle(t).fontFamily,weight:getComputedStyle(t).fontWeight})),
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
     assert.equal(retro?.paths,0,'Retrograde uses live system-ui P+x, not Montserrat outlines');
     assert.deepEqual(retro.text.map(t=>t.value),['P','x']);
     assert.ok(retro.text.every(t=>t.family.includes('system-ui')&&t.weight==='700'));
     assert.equal(retro.internalRings,0);
     assert.equal(anti?.paths,3);
     assert.ok(anti.firstPath.startsWith('M27 57.623'));
     assert.equal(anti.internalRings,0);
     assert.ok(Math.abs(anti.dx)<1&&Math.abs(anti.dy)<1);
     assert.ok(anti.farthest<16.825);
     // SVG text logical bounding boxes include extra font ascent/descent.
     // The canonical gallery audit checks the actual P and x ink against its ring.
     await page.waitForFunction(()=>{
       const saturn=[...document.querySelectorAll('#skyFoundationA .sky-foundation-row')].find(row=>row.querySelector('.sky-foundation-row-name')?.textContent?.startsWith('Saturn'));
       return saturn?.querySelector('.sky-placement-rx .relphi-glyph-retrograde text');
     },null,{timeout:20000});
     const placementMark=await page.evaluate(()=>{
       const row=[...document.querySelectorAll('#skyFoundationA .sky-foundation-row')].find(row=>row.querySelector('.sky-foundation-row-name')?.textContent?.startsWith('Saturn'));
       const art=row.querySelector('.sky-placement-rx .relphi-glyph-retrograde');
       const mark=row.querySelector('.sky-placement-rx');
       const pluto=[...document.querySelectorAll('#skyFoundationA .sky-foundation-row')]
         .find(item=>item.querySelector('.sky-foundation-row-name')?.textContent?.startsWith('Pluto'));
       const plutoStyle=getComputedStyle(pluto.querySelector('.sky-foundation-row-name'));
       const p=art.querySelector('text'),pStyle=getComputedStyle(p);
       const effectiveSize=parseFloat(pStyle.fontSize)*Math.hypot(p.getScreenCTM().a,p.getScreenCTM().b);
       const ctx=document.createElement('canvas').getContext('2d'),ys=[];
       for(const t of art.querySelectorAll('text')){
         const cs=getComputedStyle(t);ctx.font=cs.font;
         const m=ctx.measureText(t.textContent),matrix=t.getScreenCTM(),x=+t.getAttribute('x'),y=+t.getAttribute('y');
         for(const yy of [y-m.actualBoundingBoxAscent,y+m.actualBoundingBoxDescent])
           ys.push(matrix.b*x+matrix.d*yy+matrix.f);
       }
       return {height:Math.max(...ys)-Math.min(...ys),source:art.dataset.canonicalGlyphId,
         rawImage:!!mark.querySelector('img'),plutoFont:plutoStyle.fontFamily,
         plutoWeight:plutoStyle.fontWeight,plutoSize:parseFloat(plutoStyle.fontSize),
         pFont:pStyle.fontFamily,pWeight:pStyle.fontWeight,pSize:effectiveSize};
     });
     assert.ok(placementMark.height>=9&&placementMark.height<=12,'Retrograde must stay compact with a true subscript');
     assert.equal(placementMark.pFont,placementMark.plutoFont,'P and Pluto must use identical font families');
     assert.equal(placementMark.pWeight,placementMark.plutoWeight,'P and Pluto must use identical bold weight');
     assert.ok(Math.abs(placementMark.pSize-placementMark.plutoSize)<.35,'Retrograde P must match Pluto 11.84px font size');
     assert.equal(placementMark.source,'retrograde');
     assert.equal(placementMark.rawImage,false,'Placements must not bypass component via image');
     const relationshipsRx=await page.evaluate(()=>[...document.querySelectorAll('#skyFoundationRelationshipList .sky-rx-glyph-overlay')].map(node=>({
       art:!!node.querySelector('.relphi-glyph-retrograde'),
       path:node.querySelector('.relphi-glyph-retrograde text')?.textContent,
       mask:getComputedStyle(node).maskImage,
        height:node.querySelector('.relphi-glyph-retrograde')?.getBoundingClientRect().height||0
     })));
     console.log('PREVIEW PLACEMENTS AND RELATIONSHIPS RETROGRADE',JSON.stringify({placementMark,relationshipsRx}));
     assert.ok(relationshipsRx.length>0,'Retrograde Saturn relationship must have motion indicator');
     assert.ok(relationshipsRx.every(r=>r.art&&r.path==='P'),'Relationships must render registry-owned SVG');
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
     assert.deepEqual(galleryRetro.letters,['P','x']);
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
  }catch(error){failed=true;console.error('PR MASTER GLYPH LIST PREVIEW FAILED '+error.message)}
  finally{await gallery.close();await new Promise(resolve=>server.close(resolve))}
}finally{await browser.close()}
if(failed)process.exitCode=1;
