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
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
page.setDefaultTimeout(20000);
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(({a,b})=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
  localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
  sessionStorage.removeItem('relphiSkyWhereWhenViewV1');
  window.__relphiGlyphPaintViolations=[];
  const selector='.relphi-canonical-glyph[data-relphi-atomic-identity]';
  const inspect=node=>{
    if(!(node instanceof Element))return;
    const glyphs=[];
    if(node.matches?.(selector))glyphs.push(node);
    glyphs.push(...node.querySelectorAll?.(selector)||[]);
    glyphs.forEach(art=>{
      if(art.parentElement?.closest(selector))return;
      if(art.closest('#relphiGlyphAtomicStage'))return;
      if(!art.closest('#skyFoundationRoot,#skySelectedRelationship'))return;
      if(art.dataset.relphiAtomicCommit!=='true'||art.dataset.relphiAtomicBuild!=='detached-final'){
        window.__relphiGlyphPaintViolations.push({identity:art.dataset.relphiAtomicIdentity||'',commit:art.dataset.relphiAtomicCommit||'',build:art.dataset.relphiAtomicBuild||''});
      }
    });
  };
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(inspect))).observe(document,{childList:true,subtree:true});
},{a:skyA,b:skyB});

await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>window.__relphiGlyphAtomicLoaderV3===true&&window.__relphiGlyphCanonBindingV4===true&&window.__relphiGlyphCopySerializerV1===true&&window.__relphiSelectedRelationshipScrollLockV1===true);
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]');
await page.waitForSelector('#skySelectedRelationship[data-glyphs-ready="true"]');
await page.waitForFunction(()=>typeof window.RelphiSkyGlyphAudit?.run==='function');
await page.waitForFunction(()=>document.querySelectorAll('.relphi-glyph-bubble[data-relphi-atomic-pending="true"]').length===0);

const state=await page.evaluate(()=>{
  const glyphText=art=>art?(art.matches?.('text')?art.textContent:(art.querySelector('text')?.textContent||'')):'';
  const hiddenCircle=root=>{const circle=root?.querySelector(':scope > circle');return !!circle&&(circle.getAttribute('opacity')==='0'||Number(getComputedStyle(circle).opacity)===0)};
  const masterSource=id=>`glyphs-unified-preview.html#${id}`;
  const nodes=Object.fromEntries([['north-node','☊'],['south-node','☋']].map(([id,expected])=>{
    const host=document.querySelector(`[data-layer="placements"] > g[data-sky="A"][data-placement="${id}"]`);
    const art=host?.querySelector(`.relphi-glyph-${id}[data-relphi-atomic-build="detached-final"]`);
    const box=art?.getBoundingClientRect();
    return[id,{width:box?.width||0,height:box?.height||0,text:glyphText(art),fallback:window.RelphiGlyphRegistry.get(id)?.fallback||'',source:art?.dataset.relphiCanonicalSource||'',expected}];
  }));
  const angles=Object.fromEntries(['asc','dsc','mc','ic'].map(id=>{
    const entry=window.RelphiGlyphRegistry.get(id);
    const instances=Array.from(document.querySelectorAll(`#skyFoundationRoot .relphi-glyph-${id},#skySelectedRelationship .relphi-glyph-${id}`)).map(art=>{
      const root=art.closest('.relphi-glyph-bubble');
      const box=art.getBoundingClientRect();
      return{width:box.width,height:box.height,text:glyphText(art),source:art.dataset.relphiCanonicalSource||'',hiddenCircle:hiddenCircle(root),rotation:/rotate\s*\(/i.test(art.getAttribute('transform')||'')};
    });
    return[id,{asset:entry?.asset??null,fallback:entry?.fallback||'',source:masterSource(id),instances}];
  }));
  const wheelAngles=Array.from(document.querySelectorAll('[data-layer="placements"] > g[data-angle-axis="true"]')).map(host=>{
    const id=host.dataset.placement;
    const slot=host.dataset.sky;
    const art=host.querySelector(`.relphi-glyph-${id}`);
    const root=art?.closest('.relphi-glyph-bubble');
    const lines=Array.from(document.querySelectorAll(`[data-layer="leaders"] .sky-foundation-angle-axis[data-sky="${slot}"][data-angle="${id}"]`));
    return{
      id,slot,lane:Number(host.dataset.angleLane),longitude:Number(host.dataset.angleLongitude),
      source:art?.dataset.relphiCanonicalSource||'',text:glyphText(art),hiddenCircle:hiddenCircle(root),
      master:host.dataset.canonicalMaster||'',viewBox:host.dataset.canonicalViewbox||'',
      lineSegments:lines.length,lineLongitudes:lines.map(line=>Number(line.dataset.exactLongitude))
    };
  });
  const neptunes=Array.from(document.querySelectorAll('#skyFoundationRoot .relphi-glyph-neptune,#skySelectedRelationship .relphi-glyph-neptune')).map(art=>({
    source:art.dataset.relphiCanonicalSource||'',viewBox:art.dataset.relphiCanonicalViewBox||'',
    path:art.querySelector('path')?.getAttribute('d')||'',text:glyphText(art),transform:art.getAttribute('transform')||''
  }));
  const cards=Array.from(document.querySelectorAll('#skySelectedRelationship .sky-selected-cards > .sky-selected-card[data-selected-card]')).map(card=>{
    const box=card.getBoundingClientRect();
    return{slot:card.dataset.selectedCard,left:box.left,right:box.right,border:getComputedStyle(card).borderColor,image:!!card.querySelector('img')};
  });
  const fragment=document.createDocumentFragment();
  const glyph=document.createElement('span');glyph.dataset.relphiCopyId='north-node';
  const name=document.createElement('span');name.textContent=' North Node';
  fragment.append(glyph,name);
  return{
    nodes,angles,wheelAngles,neptunes,cards,
    audit:window.RelphiSkyGlyphAudit.run(),
    copy:{node:window.RelphiGlyphCopySerializer.serializeGlyph('north-node'),angle:window.RelphiGlyphCopySerializer.serializeGlyph('asc'),aspect:window.RelphiGlyphCopySerializer.serializeGlyph('conjunction'),row:window.RelphiGlyphCopySerializer.serializeFragment(fragment).text},
    paintViolations:window.__relphiGlyphPaintViolations,
    guardLoaded:!!window.__relphiSkyGlyphSizeGuardV1,
    neptuneWrapperLoaded:!!window.__relphiNeptuneCrossConnectionInstalled,
    collisionState:document.querySelector('.sky-foundation-wheel')?.dataset.angleCollisionState||'',
    collisionErrors:document.querySelectorAll('[data-angle-collision-error]').length,
    selectedBubbles:document.querySelectorAll('#skySelectedRelationship .sky-selected-symbols .relphi-glyph-bubble[data-relphi-atomic-ready="true"][data-relphi-atomic-build="detached-final"]').length
  };
});

assert.equal(state.guardLoaded,false,'The repair-after-render size guard must not load.');
assert.equal(state.neptuneWrapperLoaded,false,'No Neptune-specific renderer may load.');
assert.deepEqual(state.paintViolations,[],'No unfinished identity-bearing glyph may enter the visible chart.');
assert.deepEqual(state.audit,[],'The runtime canonical/collision audit must pass.');
assert.equal(state.collisionState,'resolved');
assert.equal(state.collisionErrors,0);
assert.equal(state.selectedBubbles,3,'The selected relationship must wait for all three finished glyph bubbles.');

for(const id of ['north-node','south-node']){
  const node=state.nodes[id];
  assert.ok(node.width>4&&node.height>4,`${id} must remain visible.`);
  assert.equal(node.fallback,node.expected);
  assert.equal(node.text,node.expected);
  assert.equal(node.source,`glyphs-unified-preview.html#${id}`);
}

const expectedAngleText={asc:'Asc',dsc:'Dsc',mc:'MC',ic:'IC'};
for(const [id,record] of Object.entries(state.angles)){
  assert.equal(record.asset,null,`${id} must not be replaced with a feature-branch SVG.`);
  assert.equal(record.fallback,expectedAngleText[id]);
  assert.equal(record.source,`glyphs-unified-preview.html#${id}`);
  assert.ok(record.instances.length>=2,`${id} must render in multiple contexts.`);
  for(const instance of record.instances){
    assert.ok(instance.width>2&&instance.height>2,`${id} must be visible.`);
    assert.equal(instance.text,expectedAngleText[id]);
    assert.equal(instance.source,record.source);
    assert.equal(instance.rotation,false,`${id} must remain upright.`);
  }
}

assert.equal(state.wheelAngles.length,8,'Four Angle axes per sky are required.');
for(const slot of ['A','B']){
  assert.deepEqual(state.wheelAngles.filter(item=>item.slot===slot).map(item=>item.id).sort(),['asc','dsc','ic','mc']);
}
for(const angle of state.wheelAngles){
  assert.equal(angle.source,`glyphs-unified-preview.html#${angle.id}`);
  assert.equal(angle.text,expectedAngleText[angle.id]);
  assert.equal(angle.hiddenCircle,true,'Wheel Angles must use the uncircled state of the same master composition.');
  assert.equal(angle.master,'glyphs-unified-preview.html');
  assert.equal(angle.viewBox,'-32 -32 64 64');
  assert.equal(angle.lineSegments,2);
  assert.ok(angle.lineLongitudes.every(value=>Math.abs(value-angle.longitude)<1e-5));
  const [inner,outer]=angle.slot==='A'?[414,574]:[166,323];
  assert.ok(angle.lane>inner&&angle.lane<outer,`${angle.slot} ${angle.id} must remain in its sky band.`);
}

assert.ok(state.neptunes.length>=4,'Neptune must render in all relevant contexts.');
for(const neptune of state.neptunes){
  assert.equal(neptune.source,'assets/planet-glyphs/neptune.svg');
  assert.equal(neptune.viewBox,'0 0 100 100');
  assert.equal(neptune.text,'');
  assert.ok(neptune.path.includes('44 62H56'),'Neptune must use the sole repository asset unchanged.');
  assert.ok(neptune.transform);
}

assert.deepEqual(state.copy,{node:'☊ North Node',angle:'Ascendant',aspect:'☌ Conjunction',row:'☊ North Node'});
assert.equal(state.cards.length,2,'Both sky-owned tarot cards must exist.');
assert.equal(state.cards[0].slot,'A');
assert.equal(state.cards[1].slot,'B');
assert.ok(state.cards.every(card=>card.image));
assert.ok(state.cards[0].right<=state.cards[1].left||state.cards[1].right<=state.cards[0].left,'The cards must not overlap.');
assert.equal(state.cards[0].border,'rgb(201, 33, 30)');
assert.equal(state.cards[1].border,'rgb(36, 98, 208)');

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
  return[id,{opacity:Number(getComputedStyle(host).opacity),width:box?.width||0,selected:host.classList.contains('is-selected')}];
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
await page.screenshot({path:'sky-chart-atomic-glyphs-no-scroll.png',animations:'disabled',timeout:30000,fullPage:true});
await browser.close();
console.log('Sky Chart uses the Master Glyph List contract, the sole Neptune asset, collision-safe Angle axes, semantic copying, and separate bordered cards.');
