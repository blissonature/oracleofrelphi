import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import pngjs from 'pngjs';
const {PNG}=pngjs;

/**
 * Reproducible 95/95 rendered audit of the one canonical Master Glyph List.
 * This is an observational test, not a replacement renderer or design approval.
 * A declared CSS font stack is not proof of which font Chromium actually used:
 * CDP CSS.getPlatformFontsForNode is captured for each text glyph.
 */
const origin=process.env.GLYPH_AUDIT_ORIGIN||'http://127.0.0.1:4173';
const dest='test-results/glyph-audit';
await mkdir(dest,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined});
const report={commit:process.env.GITHUB_SHA||null,origin,generatedAt:new Date().toISOString(),screens:{},issues:[],observations:[],method:'getBoundingClientRect captures layout bounds, not precise painted-ink extents; inspect saved screenshots before judging clipping'};
const checkpoints=[['desktop',1280,900],['mobile',390,844]];
try{
  for(const [screen,width,height] of checkpoints){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/glyphs-unified-preview.html',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>{
      const registry=window.RelphiGlyphRegistry?.entries||[];
      const cards=[...document.querySelectorAll('#ugGrid .ug-card')];
      const status=document.querySelector('#ugStatus')?.textContent||'';
      return registry.length===95&&cards.length===registry.length&&
        cards.every(card=>!!card.querySelector('.relphi-canonical-glyph'))&&
        /95 canonical glyph masters loaded/.test(status);
    },null,{timeout:60000});
    await page.evaluate(()=>document.fonts.ready);
    const source=await page.evaluate(()=>{
      const entries=window.RelphiGlyphRegistry.entries;
      const cards=[...document.querySelectorAll('#ugGrid .ug-card')];
      const radius=(x,y)=>Math.hypot(x,y);
      return{
        status:document.querySelector('#ugStatus').textContent,
        total:entries.length,
        fonts:[...document.fonts].map(f=>({family:f.family,weight:f.weight,status:f.status})),
        data:entries.map((entry,i)=>{
          const card=cards[i],art=card.querySelector('.relphi-canonical-glyph');
          const host=card.querySelector('.ug-stage svg');
          const bubble=card.querySelector('.relphi-glyph-bubble');
          const ring=bubble?.querySelector(':scope > circle');
          const box=art?.getBoundingClientRect(),circle=ring?.getBoundingClientRect();
          const text=art?.tagName.toLowerCase()==='text'?art:art?.querySelector('text');
          const cs=text?getComputedStyle(text):null;
          const center={x:circle.x+circle.width/2,y:circle.y+circle.height/2};
          const centerError={x:box.x+box.width/2-center.x,y:box.y+box.height/2-center.y};
          const farthest=Math.max(...[[box.left,box.top],[box.left,box.bottom],[box.right,box.top],[box.right,box.bottom]]
            .map(([x,y])=>radius(x-center.x,y-center.y)));
          return{
            index:i+1,id:entry.id,name:entry.name,mode:entry.fitMode,asset:entry.asset,
            rawScale:entry.scale,dx:entry.dx,dy:entry.dy,
            artTag:art.tagName.toLowerCase(),owner:art.dataset.canonicalGlyphId,hostOwner:bubble.dataset.canonicalGlyphId,
            fitted:art.dataset.relphiAtomicCommit,viewBox:host.getAttribute('viewBox'),
            outerCircleOpacity:ring.style.opacity,
            rect:{x:box.x,y:box.y,width:box.width,height:box.height},
            centerError,farthest,ringRadius:circle.width/2,
            shapes:art.querySelectorAll('path,circle,rect,ellipse,polygon,polyline,line').length,
            literalText:text?.textContent||null,
            font:cs?{family:cs.fontFamily,size:cs.fontSize,weight:cs.fontWeight,letterSpacing:cs.letterSpacing}:null,
            clipped:getComputedStyle(host).overflow==='hidden'&&farthest>32,
            visible:getComputedStyle(art).visibility!=='hidden'&&box.width>0&&box.height>0
          };
        })
      };
    });
    assert.equal(source.total,95,'Render and inspect all 95 canonical identities');
    assert.equal(source.data.length,95);
    assert.ok(source.data.every(d=>d.visible),'Every glyph must render a non-empty visible shape');
    assert.ok(source.data.every(d=>d.owner===d.id&&d.hostOwner===d.id),'All glyph identities must retain canonical ownership');
    assert.ok(source.data.every(d=>d.fitted==='true'),'All glyph renders must finish atomic commit');
    assert.ok(source.data.every(d=>d.viewBox==='-32 -32 64 64'),'Master gallery artboards must match');
    assert.ok(source.data.every(d=>d.outerCircleOpacity==='1'),'Every circle starts visible');
    assert.ok(source.data.every(d=>!d.clipped),'No glyph can be clipped by gallery artboard');

    // The original Retrograde master used a -32,-32 viewBox and translated its
    // artwork toward (0,0). The shared staticMaster owner expects 0..100 source
    // geometry centered around (50,50). Keep the approved path unchanged.
    const rx=source.data.find(d=>d.id==='retrograde');
    assert.ok(rx&&rx.mode==='static-master'&&rx.shapes===1&&rx.literalText===null,
      'Retrograde retains the single original outlined shape');
    assert.ok(Math.abs(rx.centerError.x)<1.2&&Math.abs(rx.centerError.y)<1.2,
      'Retrograde artwork must be centered in the existing master bubble');
    assert.ok(rx.farthest<18,'Retrograde artwork must stay within the existing ring');
    const rxAsset=await page.evaluate(async()=>{
      const response=await fetch('assets/planet-glyphs/retrograde.svg');
      if(!response.ok)throw Error('Retrograde master unavailable');
      const xml=new DOMParser().parseFromString(await response.text(),'image/svg+xml').documentElement;
      return{viewBox:xml.getAttribute('viewBox'),paths:xml.querySelectorAll('path').length,
        texts:xml.querySelectorAll('text').length,circles:xml.querySelectorAll('circle').length,
        originalPath:xml.querySelector('path')?.getAttribute('d')?.startsWith('m 50.066711,43.626278')};
    });
    assert.deepEqual(rxAsset,{viewBox:'0 0 100 100',paths:1,texts:0,circles:0,originalPath:true},
      'Normalize only the coordinate system, preserving original glyph geometry');

    assert.deepEqual(errors,[],'No browser exceptions in master gallery');
    // Read Chromium's actual platform font, not merely the requested CSS stack.
    const session=await page.context().newCDPSession(page);
    await session.send('DOM.enable');await session.send('CSS.enable');
    const root=await session.send('DOM.getDocument');
    for(const glyph of source.data.filter(d=>d.font)){
      const selector='#ugGrid > .ug-card:nth-child('+glyph.index+') .relphi-canonical-glyph';
      try{
        const q=await session.send('DOM.querySelector',{nodeId:root.root.nodeId,selector});
        const platform=await session.send('CSS.getPlatformFontsForNode',{nodeId:q.nodeId});
        glyph.platformFonts=platform.fonts.map(x=>({family:x.familyName,postScriptName:x.postScriptName,
          glyphCount:x.glyphCount,custom:x.isCustomFont}));
      }catch(e){
        glyph.platformFontsError=String(e.message).slice(0,180);
      }
    }
    // Control behavior and identical geometry with vs. without the ring.
    await page.locator('[data-circle="false"]').click();
    await page.waitForFunction(()=>[...document.querySelectorAll('#ugGrid .ug-card')].length===95&&
      [...document.querySelectorAll('#ugGrid .ug-card .relphi-glyph-bubble > circle')].every(c=>c.style.opacity==='0')&&
      document.querySelectorAll('#ugGrid .ug-card .relphi-canonical-glyph').length===95&&
      /95 canonical glyph masters loaded/.test(document.querySelector('#ugStatus')?.textContent||''));
    const after=await page.evaluate(()=>[...document.querySelectorAll('#ugGrid .ug-card')].map(card=>{
      const art=card.querySelector('.relphi-canonical-glyph'),box=art.getBoundingClientRect();
      return {width:box.width,height:box.height};
    }));
    for(let i=0;i<95;i++){
      assert.ok(Math.abs(after[i].width-source.data[i].rect.width)<0.55,
        source.data[i].id+' circle toggle altered width');
      assert.ok(Math.abs(after[i].height-source.data[i].rect.height)<0.55,
        source.data[i].id+' circle toggle altered height');
    }
    const uncircled=await page.screenshot({path:dest+'/95-glyphs-'+screen+'-uncircled.png',fullPage:true});
    const bitmap=PNG.sync.read(uncircled);
    const paintedInk=source.data.map(glyph=>{
      // Only the glyph stage: omit name labels (beneath it) and card borders.
      // Pixel inspection avoids mistaking invisible font ascent/descent for ink.
      const cx=glyph.rect.x+glyph.rect.width/2-glyph.centerError.x;
      const cy=glyph.rect.y+glyph.rect.height/2-glyph.centerError.y;
      let pixels=0,farthest=0;
      for(let y=Math.max(0,Math.round(cy)-42);y<Math.min(bitmap.height,Math.round(cy)+34);y++){
        for(let x=Math.max(0,Math.round(cx)-44);x<Math.min(bitmap.width,Math.round(cx)+45);x++){
          const i=(y*bitmap.width+x)*4;
          if(Math.max(bitmap.data[i],bitmap.data[i+1],bitmap.data[i+2])>=95)continue;
          pixels++;
          farthest=Math.max(farthest,Math.hypot(x+0.5-cx,y+0.5-cy));
        }
      }
      return{id:glyph.id,paintedPixels:pixels,inkRadius:Number(farthest.toFixed(3)),ringRadius:glyph.ringRadius};
    });
    assert.equal(paintedInk.length,95);
    assert.ok(paintedInk.every(x=>x.paintedPixels>0),'Every canonical master must have visible painted pixels');
    assert.ok(paintedInk.every(x=>x.inkRadius<=x.ringRadius+0.5),
      'Painted glyph ink must remain inside the existing circle: '+JSON.stringify(paintedInk.filter(x=>x.inkRadius>x.ringRadius+0.5)));
    report.screens[screen+'PaintedInk']=paintedInk;

    await page.locator('[data-circle="true"]').click();
    await page.waitForFunction(()=>[...document.querySelectorAll('#ugGrid .ug-card .relphi-glyph-bubble > circle')].length===95&&
      [...document.querySelectorAll('#ugGrid .ug-card .relphi-glyph-bubble > circle')].every(c=>c.style.opacity==='1')&&
      document.querySelectorAll('#ugGrid .ug-card .relphi-canonical-glyph').length===95&&
      /95 canonical glyph masters loaded/.test(document.querySelector('#ugStatus')?.textContent||''));
    await page.screenshot({path:dest+'/95-glyphs-'+screen+'-circled.png',fullPage:true});
    // A numerical discrepancy isn't necessarily a defect; preserve evidence for review.
    const issues=[];
    for(const glyph of source.data){
      if(Math.abs(glyph.centerError.x)>2.5||Math.abs(glyph.centerError.y)>2.5)
        issues.push({id:glyph.id,kind:'visual-centering',error:glyph.centerError});
      if(glyph.farthest>glyph.ringRadius)
        // Browser element bounds include font ascent/descent. This is a review flag, not proof of ink overflow.
        issues.push({id:glyph.id,kind:'layout-bbox-exceeds-ring-needs-ink-review',farthest:glyph.farthest,ring:glyph.ringRadius});
      if(glyph.platformFontsError)issues.push({id:glyph.id,kind:'unverified-platform-font',error:glyph.platformFontsError});
    }
    const latin=source.data.filter(x=>['asc','dsc','mc','ic','vertex'].includes(x.id));
    assert.equal(latin.length,5);

    const symbols=source.data.filter(d=>d.mode==='symbol');
    assert.equal(symbols.length,3,'Chiron and both lunar nodes use the canonical symbol treatment');
    assert.ok(symbols.every(d=>d.font?.family.includes('Apple Symbols')&&
      d.font?.family.includes('Noto Sans Symbols 2')),
      'Symbol fonts must use valid family tokens, not silently inherit the body font');

    report.screens[screen]={width,height,status:source.status,glyphs:source.data,installedFontFaces:source.fonts,
      latin:latin.map(({id,font,platformFonts,platformFontsError})=>({id,font,platformFonts,platformFontsError})),
      issues,consoleErrors:errors,circleToggleValidated:95};
    console.log('GLYPH AUDIT '+screen.toUpperCase(),JSON.stringify({rendered:source.data.length,
      fontFaces:source.fonts.length,latin:report.screens[screen].latin,issues:issues.slice(0,20),issueCount:issues.length}));
    await page.close();
  }
  // A semantic collision, not an intentional design exception: both aliases normalize to 'tau'.
  const page=await browser.newPage();
  await page.goto(origin+'/glyphs-unified-preview.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.RelphiGlyphRegistry?.entries?.length);
  report.registry=await page.evaluate(()=>{
    const entries=window.RelphiGlyphRegistry.entries,aliases=new Map();
    const normalize=x=>String(x).replace(/[\uFE0E\uFE0F]/g,'').trim().toLowerCase();
    for(const entry of entries)for(const alias of [entry.id,entry.name,...entry.aliases]){
      const key=normalize(alias),existing=aliases.get(key)||new Set();existing.add(entry.id);aliases.set(key,existing);
    }
    return {identities:entries.length,files:[...new Set(entries.map(x=>x.asset).filter(Boolean))].length,
      collisions:[...aliases].filter(([,ids])=>ids.size>1).map(([alias,ids])=>({alias,ids:[...ids],
        resolverWinner:window.RelphiGlyphRegistry.resolve(alias)?.id||null})),
      sharedAssets:[...new Set(entries.map(x=>x.asset).filter(Boolean))]
        .map(asset=>({asset,ids:entries.filter(e=>e.asset===asset).map(e=>e.id)}))
        .filter(x=>x.ids.length>1)};
  });
  await page.close();
  assert.equal(report.registry.identities,95);
  assert.equal(report.registry.files,40);
  // Document existing exception, do not silently rewrite aliases.
  assert.ok(report.registry.collisions.some(x=>x.alias==='tau'&&x.ids.includes('hebrew-tav')&&x.ids.includes('greek-tau')));
  await writeFile(dest+'/95-glyph-rendering-audit.json',JSON.stringify(report,null,2)+'\n');
  console.log('PASS: 95/95 gallery identities, both viewports, all ring toggles, source/owner contracts.');
  console.log('AUDIT COLLISIONS',JSON.stringify(report.registry.collisions));
}finally{await browser.close()}
