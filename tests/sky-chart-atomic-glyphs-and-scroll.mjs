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
  const inspect=node=>{
    if(!(node instanceof Element))return;
    const glyphs=[];
    if(node.matches?.('.relphi-canonical-glyph'))glyphs.push(node);
    glyphs.push(...node.querySelectorAll?.('.relphi-canonical-glyph')||[]);
    glyphs.forEach(art=>{
      if(art.parentElement?.closest('.relphi-canonical-glyph'))return;
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
await page.waitForFunction(()=>window.__relphiGlyphAtomicLoaderV2===true&&window.__relphiSelectedRelationshipScrollLockV1===true);
await page.waitForSelector('#skyFoundationRoot .relphi-canonical-glyph[data-relphi-atomic-build="detached-final"]');
await page.waitForSelector('#skySelectedRelationship[data-glyphs-ready="true"]');

const state=await page.evaluate(()=>{
  const nodes=Object.fromEntries(['north-node','south-node'].map(id=>{
    const host=document.querySelector(`[data-layer="placements"] > g[data-sky="A"][data-placement="${id}"]`);
    const art=host?.querySelector(`.relphi-glyph-${id}[data-relphi-atomic-build="detached-final"]`);
    const box=art?.getBoundingClientRect();
    return [id,{width:box?.width||0,height:box?.height||0,text:art?.querySelector('text')?.textContent||'',transform:art?.getAttribute('transform')||''}];
  }));
  const cards=Array.from(document.querySelectorAll('#skySelectedRelationship .sky-selected-cards > .sky-selected-card[data-selected-card]')).map(card=>{
    const box=card.getBoundingClientRect();
    return{slot:card.dataset.selectedCard,left:box.left,right:box.right,top:box.top,bottom:box.bottom,border:getComputedStyle(card).borderColor,image:!!card.querySelector('img')};
  });
  return{
    nodes,
    cards,
    paintViolations:window.__relphiGlyphPaintViolations,
    guardLoaded:!!window.__relphiSkyGlyphSizeGuardV1,
    committed:document.querySelectorAll('#skyFoundationRoot .relphi-canonical-glyph[data-relphi-atomic-build="detached-final"]').length,
    selectedBubbles:document.querySelectorAll('#skySelectedRelationship .sky-selected-symbols .relphi-glyph-bubble[data-relphi-atomic-ready="true"][data-relphi-atomic-build="detached-final"]').length
  };
});

assert.equal(state.guardLoaded,false,'The repair-after-render size guard must not be loaded.');
assert.ok(state.committed>0,'The chart must contain detached-final glyphs.');
assert.equal(state.selectedBubbles,3,'The selected relationship must reveal only after all three finished glyph bubbles exist.');
assert.deepEqual(state.paintViolations,[],'No unfinished glyph may enter a visible chart subtree.');
for(const id of ['north-node','south-node']){
  assert.ok(state.nodes[id].width>4&&state.nodes[id].height>4,`${id} must have visible vector geometry.`);
  assert.equal(state.nodes[id].text,'',`${id} must not depend on a font-backed text glyph.`);
  assert.ok(state.nodes[id].transform,`${id} must receive its final transform before insertion.`);
}
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
console.log('Sky Chart inserts only detached-final glyphs, keeps both bordered sky cards separate, and preserves node visibility without a repair guard.');
