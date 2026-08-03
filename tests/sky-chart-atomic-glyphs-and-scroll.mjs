import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0}};
function sample(name,offset,profile){
  const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,index)=>(asc+index*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,Chiron:74.48,'North Node':40.3,'South Node':220.3,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
  return{name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{...profile,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))};
}
const skyA=sample('My birth chart',0,{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Malden, Massachusetts, United States',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662});
const skyB=sample('Current sky',29.27,{dateTime:'2026-08-02T02:07',instant:'2026-08-02T08:07:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891});

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
page.setDefaultTimeout(15000);
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(({a,b})=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
  localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
  sessionStorage.removeItem('relphiSkyWhereWhenViewV1');
  window.__relphiGlyphPaintViolations=[];
  const identitySelector='.relphi-canonical-glyph[data-relphi-atomic-identity]';
  const inspect=node=>{
    if(!(node instanceof Element))return;
    const glyphs=[];
    if(node.matches?.(identitySelector))glyphs.push(node);
    glyphs.push(...node.querySelectorAll?.(identitySelector)||[]);
    glyphs.forEach(art=>{
      if(art.parentElement?.closest(identitySelector))return;
      if(art.closest('#relphiGlyphAtomicStage'))return;
      if(!art.closest('#skyFoundationRoot,#skySelectedRelationship'))return;
      if(art.dataset.relphiAtomicCommit!=='true'||art.dataset.relphiAtomicBuild!=='detached-final'){
        window.__relphiGlyphPaintViolations.push({identity:art.dataset.relphiAtomicIdentity||'',commit:art.dataset.relphiAtomicCommit||'',build:art.dataset.relphiAtomicBuild||''});
      }
    });
  };
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(inspect))).observe(document,{childList:true,subtree:true});
},{a:skyA,b:skyB});

await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:15000});
await page.waitForFunction(()=>window.__relphiGlyphAtomicLoaderV3===true&&window.__relphiGlyphCanonBindingV1===true&&window.__relphiGlyphCopySerializerV1===true&&window.__relphiSelectedRelationshipScrollLockV1===true);
await page.waitForSelector('#skyFoundationRoot .relphi-canonical-glyph[data-relphi-atomic-build="detached-final"]');
await page.waitForSelector('#skySelectedRelationship[data-glyphs-ready="true"]');

const state=await page.evaluate(()=>{
  const glyphText=art=>art?(art.matches?.('text')?art.textContent:(art.querySelector('text')?.textContent||'')):'';
  const nodes=Object.fromEntries([['north-node','☊'],['south-node','☋']].map(([id,expected])=>{
    const host=document.querySelector(`[data-layer="placements"] > g[data-sky="A"][data-placement="${id}"]`);
    const art=host?.querySelector(`.relphi-glyph-${id}[data-relphi-atomic-build="detached-final"]`);
    const box=art?.getBoundingClientRect();
    return [id,{width:box?.width||0,height:box?.height||0,text:glyphText(art),fallback:window.RelphiGlyphRegistry.get(id)?.fallback||'',transform:art?.getAttribute('transform')||'',source:art?.dataset.relphiCanonicalSource||'',expected}];
  }));
  const expectedAngles={
    asc:'assets/angle-glyphs/asc.svg',
    dsc:'assets/angle-glyphs/dsc.svg',
    mc:'assets/angle-glyphs/mc.svg',
    ic:'assets/angle-glyphs/ic.svg'
  };
  const angles=Object.fromEntries(Object.entries(expectedAngles).map(([id,source])=>{
    const instances=Array.from(document.querySelectorAll(`#skyFoundationRoot .relphi-glyph-${id},#skySelectedRelationship .relphi-glyph-${id}`)).map(art=>{
      const box=art.getBoundingClientRect();
      const host=art.closest('.relphi-glyph-bubble')||art.parentElement;
      const hostBox=host?.getBoundingClientRect();
      return{
        width:box.width||0,
        height:box.height||0,
        hostWidth:hostBox?.width||0,
        hostHeight:hostBox?.height||0,
        text:glyphText(art),
        source:art.dataset.relphiCanonicalSource||'',
        viewBox:art.dataset.relphiCanonicalViewBox||'',
        transform:art.getAttribute('transform')||'',
        rotation:art.dataset.relphiCanonicalRotation||''
      };
    });
    return[id,{source,instances}];
  }));
  const wheelAngles=Array.from(document.querySelectorAll('[data-layer="placements"] > g[data-angle-axis="true"]')).map(host=>{
    const id=host.dataset.placement;
    const slot=host.dataset.sky;
    const art=host.querySelector(`.relphi-glyph-${id}`);
    const circle=host.querySelector('.relphi-glyph-bubble > circle');
    const circleStyle=circle?getComputedStyle(circle):null;
    const match=/translate\(([-\d.]+)\s+([-\d.]+)\)/.exec(host.getAttribute('transform')||'');
    const x=match?Number(match[1]):NaN;
    const y=match?Number(match[2]):NaN;
    return{
      id,
      slot,
      source:art?.dataset.relphiCanonicalSource||'',
      uncircled:host.dataset.uncircledCanonical||'',
      lineSegments:document.querySelectorAll(`[data-layer="leaders"] .sky-foundation-angle-axis[data-sky="${slot}"][data-angle="${id}"]`).length,
      visibleCircleOpacity:circleStyle?Number(circleStyle.opacity):1,
      radius:Number.isFinite(x)&&Number.isFinite(y)?Math.hypot(x-600,y-600):NaN
    };
  });
  const neptunes=Array.from(document.querySelectorAll('#skyFoundationRoot .relphi-glyph-neptune,#skySelectedRelationship .relphi-glyph-neptune')).map(art=>{
    const box=art.getBoundingClientRect();
    const host=art.closest('.relphi-glyph-bubble')||art.parentElement;
    const hostBox=host?.getBoundingClientRect();
    return{
      width:box.width||0,
      height:box.height||0,
      hostWidth:hostBox?.width||0,
      hostHeight:hostBox?.height||0,
      source:art.dataset.relphiCanonicalSource||'',
      transform:art.getAttribute('transform')||'',
      path:art.querySelector('path')?.getAttribute('d')||''
    };
  });
  const cards=Array.from(document.querySelectorAll('#skySelectedRelationship .sky-selected-cards > .sky-selected-card[data-selected-card]')).map(card=>{
    const box=card.getBoundingClientRect();
    return{slot:card.dataset.selectedCard,left:box.left,right:box.right,top:box.top,bottom:box.bottom,border:getComputedStyle(card).borderColor,image:!!card.querySelector('img')};
  });
  const fragment=document.createDocumentFragment();
  const glyph=document.createElement('span');glyph.dataset.relphiCopyId='north-node';
  const name=document.createElement('span');name.textContent=' North Node';
  fragment.append(glyph,name);
  return{
    nodes,
    angles,
    wheelAngles,
    neptunes,
    cards,
    copy:{
      node:window.RelphiGlyphCopySerializer.serializeGlyph('north-node'),
      angle:window.RelphiGlyphCopySerializer.serializeGlyph('asc'),
      aspect:window.RelphiGlyphCopySerializer.serializeGlyph('conjunction'),
      row:window.RelphiGlyphCopySerializer.serializeFragment(fragment).text
    },
    paintViolations:window.__relphiGlyphPaintViolations,
    guardLoaded:!!window.__relphiSkyGlyphSizeGuardV1,
    lateNeptuneWrapperLoaded:!!window.__relphiNeptuneCrossConnectionInstalled,
    committed:document.querySelectorAll('#skyFoundationRoot .relphi-canonical-glyph[data-relphi-atomic-build="detached-final"]').length,
    selectedBubbles:document.querySelectorAll('#skySelectedRelationship .sky-selected-symbols .relphi-glyph-bubble[data-relphi-atomic-ready="true"][data-relphi-atomic-build="detached-final"]').length
  };
});

assert.equal(state.guardLoaded,false,'The repair-after-render size guard must not be loaded.');
assert.equal(state.lateNeptuneWrapperLoaded,false,'The late Neptune redraw/refit wrapper must not load.');
assert.ok(state.committed>0,'The chart must contain detached-final glyphs.');
assert.equal(state.selectedBubbles,3,'The selected relationship must reveal only after all three finished glyph bubbles exist.');
assert.deepEqual(state.paintViolations,[],'No unfinished identity-bearing glyph may enter a visible chart subtree.');
for(const id of ['north-node','south-node']){
  assert.ok(state.nodes[id].width>4&&state.nodes[id].height>4,`${id} must remain visibly present.`);
  assert.equal(state.nodes[id].fallback,state.nodes[id].expected,`${id} must retain the canonical registry character.`);
  assert.equal(state.nodes[id].text,state.nodes[id].expected,`${id} must render the canonical registry character.`);
  assert.equal(state.nodes[id].source,`unicode:${state.nodes[id].expected}`,`${id} must identify its canonical Unicode source.`);
  assert.ok(state.nodes[id].transform,`${id} must receive its final canonical fit before insertion.`);
}
for(const [id,record] of Object.entries(state.angles)){
  assert.ok(record.instances.length>=2,`${id} must render in more than one Sky Chart context.`);
  for(const instance of record.instances){
    assert.ok(instance.width>2&&instance.height>2,`${id} must remain visible.`);
    assert.equal(instance.text,'',`${id} must use authored paths rather than browser lettering.`);
    assert.equal(instance.source,record.source,`${id} must use its own authored upright asset.`);
    assert.equal(instance.viewBox,'0 0 100 100',`${id} must preserve the canon's intentional whitespace.`);
    assert.equal(instance.rotation,'0',`${id} must remain upright.`);
    assert.ok(!/rotate\s*\(\s*180/i.test(instance.transform),`${id} must not be upside down.`);
    if(instance.hostWidth>0&&instance.hostHeight>0){
      assert.ok(instance.width<=instance.hostWidth*1.1,`${id} must not overflow its canonical host width.`);
      assert.ok(instance.height<=instance.hostHeight*1.1,`${id} must not overflow its canonical host height.`);
    }
  }
}
assert.equal(state.wheelAngles.length,8,'The wheel must contain four axis labels for each sky.');
for(const slot of ['A','B']){
  assert.deepEqual(state.wheelAngles.filter(item=>item.slot===slot).map(item=>item.id).sort(),['asc','dsc','ic','mc'],`Sky ${slot} must contain all four axis labels.`);
}
for(const angle of state.wheelAngles){
  assert.equal(angle.source,state.angles[angle.id].source,`${angle.id} must use its authored canon on the wheel.`);
  assert.equal(angle.uncircled,'true',`${angle.id} must be committed as an uncircled wheel label.`);
  assert.equal(angle.lineSegments,2,`${angle.id} must sit in the gap between two sky-colored axis-line segments.`);
  assert.equal(angle.visibleCircleOpacity,0,`${angle.id} must not show a glyph bubble on the wheel.`);
  const expectedRadius=angle.slot==='A'?494:244.5;
  assert.ok(Math.abs(angle.radius-expectedRadius)<0.2,`${angle.id} must sit inside Sky ${angle.slot}'s own house band.`);
}
assert.ok(state.neptunes.length>=4,'Neptune must render in ledgers, wheel/relationship contexts, and selected detail when present.');
for(const instance of state.neptunes){
  assert.ok(instance.width>2&&instance.height>2,'Every Neptune instance must remain visible.');
  assert.equal(instance.source,'assets/planet-glyphs/neptune.svg','Every Neptune must come from the authored connected-trident asset.');
  assert.ok(instance.path.includes('H56'),'Neptune must use the connected canonical trident path.');
  assert.ok(instance.transform,'Neptune must receive its final transform before insertion.');
  if(instance.hostWidth>0&&instance.hostHeight>0){
    assert.ok(instance.width<=instance.hostWidth*1.1,'Neptune must not overflow its canonical host width.');
    assert.ok(instance.height<=instance.hostHeight*1.1,'Neptune must not overflow its canonical host height.');
  }
}
assert.deepEqual(state.copy,{node:'☊ North Node',angle:'Ascendant',aspect:'☌ Conjunction',row:'☊ North Node'});
assert.equal(state.cards.length,2,'Both sky-owned tarot cards must exist.');
assert.equal(state.cards[0].slot,'A');
assert.equal(state.cards[1].slot,'B');
assert.ok(state.cards.every(card=>card.image),'Each sky card must contain its own image.');
assert.ok(state.cards[0].right<=state.cards[1].left||state.cards[1].right<=state.cards[0].left,'The two sky cards must not overlap.');
assert.equal(state.cards[0].border,'rgb(201, 33, 30)','Sky A card must have its red border.');
assert.equal(state.cards[1].border,'rgb(36, 98, 208)','Sky B card must have its blue border.');

const southNodeRow=page.locator('#skyFoundationA .sky-foundation-row[data-placement="south-node"]');
await southNodeRow.evaluate(row=>row.click());
await page.waitForFunction(()=>{
  const wheel=document.querySelector('.sky-foundation-wheel');
  const selected=document.querySelector('[data-layer="placements"] > g[data-sky="A"][data-placement="south-node"]');
  return wheel?.classList.contains('has-isolation')&&selected?.classList.contains('is-selected');
});
const isolated=await page.evaluate(()=>Object.fromEntries(['north-node','south-node'].map(id=>{
  const host=document.querySelector(`[data-layer="placements"] > g[data-sky="A"][data-placement="${id}"]`);
  const art=host?.querySelector(`.relphi-glyph-${id}`);
  const box=art?.getBoundingClientRect();
  return[id,{opacity:Number(getComputedStyle(host).opacity),width:box?.width||0,height:box?.height||0,selected:host.classList.contains('is-selected')}];
})));
assert.equal(isolated['south-node'].selected,true);
assert.ok(isolated['south-node'].opacity>.95);
assert.ok(isolated['north-node'].opacity>0&&isolated['north-node'].opacity<.5);
assert.ok(isolated['north-node'].width>4&&isolated['south-node'].width>4);

const scrollCheck=await page.evaluate(()=>{
  const panel=document.getElementById('skySelectedRelationship');
  window.scrollTo(0,0);
  const before=window.scrollY;
  panel.scrollIntoView({behavior:'auto',block:'start'});
  return{before,after:window.scrollY,suppressed:panel.dataset.automaticScrollSuppressed||''};
});
assert.equal(scrollCheck.after,scrollCheck.before);
assert.equal(scrollCheck.suppressed,'true');
assert.deepEqual(errors,[]);
await page.screenshot({path:'sky-chart-atomic-glyphs-no-scroll.png',animations:'disabled',timeout:30000});
await browser.close();
console.log('Sky Chart uses authored upright Angles as uncircled axis labels, one atomic connected Neptune source, semantic copying, and two separate bordered sky cards.');
