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
page.setDefaultTimeout(10000);
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
    glyphs.forEach(art=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(!art.isConnected||art.closest('#relphiGlyphAtomicStage'))return;
      if(!art.closest('#skyFoundationRoot,#skySelectedRelationship'))return;
      const style=getComputedStyle(art);
      const root=art.closest('.relphi-glyph-bubble');
      const artBox=art.getBoundingClientRect();
      const rootBox=root?.getBoundingClientRect();
      const visible=style.visibility!=='hidden'&&style.display!=='none'&&Number(style.opacity||1)>0;
      const oversized=!!rootBox&&rootBox.width>0&&rootBox.height>0&&(artBox.width>rootBox.width*1.65||artBox.height>rootBox.height*1.65);
      if(visible&&(art.dataset.relphiAtomicCommit!=='true'||oversized)){
        window.__relphiGlyphPaintViolations.push({
          id:art.className?.baseVal||art.className||'',
          committed:art.dataset.relphiAtomicCommit||'',
          guard:art.dataset.relphiSizeGuard||'',
          art:[artBox.width,artBox.height],
          root:[rootBox?.width||0,rootBox?.height||0]
        });
      }
    })));
  };
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(inspect))).observe(document,{childList:true,subtree:true});
},{a:skyA,b:skyB});

await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:12000});
await page.waitForFunction(()=>window.__relphiGlyphAtomicCommitActive===true&&window.__relphiSelectedRelationshipScrollLockV1===true&&window.__relphiSkyGlyphSizeGuardV1===true);
await page.waitForSelector('#skyFoundationRoot .relphi-canonical-glyph[data-relphi-atomic-commit="true"]');
await page.waitForTimeout(1200);
await page.waitForFunction(()=>Number(document.documentElement.dataset.skyGlyphSizeGuardPending||0)===0);

await page.waitForFunction(()=>['north-node','south-node'].every(id=>{
  const host=document.querySelector(`[data-layer="placements"] > g[data-sky="A"][data-placement="${id}"]`);
  const art=host?.querySelector(`.relphi-glyph-${id}[data-relphi-atomic-commit="true"]`);
  const box=art?.getBoundingClientRect();
  return !!art&&art.dataset.relphiAtomicRefit==='live-context'&&box.width>4&&box.height>4&&getComputedStyle(art).visibility!=='hidden';
}));

const initialNodes=await page.evaluate(()=>Object.fromEntries(['north-node','south-node'].map(id=>{
  const host=document.querySelector(`[data-layer="placements"] > g[data-sky="A"][data-placement="${id}"]`);
  const art=host.querySelector(`.relphi-glyph-${id}`);
  const box=art.getBoundingClientRect();
  return [id,{hostOpacity:Number(getComputedStyle(host).opacity),width:box.width,height:box.height,visibility:getComputedStyle(art).visibility,refit:art.dataset.relphiAtomicRefit||''}];
})));
for(const id of ['north-node','south-node']){
  assert.ok(initialNodes[id].width>4&&initialNodes[id].height>4,`${id} must render visible artwork inside its wheel bubble.`);
  assert.equal(initialNodes[id].visibility,'visible',`${id} wheel artwork must not be hidden.`);
  assert.equal(initialNodes[id].refit,'live-context',`${id} must be refitted in its live wheel context.`);
}

const southNodeRow=page.locator('#skyFoundationA .sky-foundation-row[data-placement="south-node"]');
await southNodeRow.waitFor();
await southNodeRow.click();
await page.waitForFunction(()=>{
  const wheel=document.querySelector('.sky-foundation-wheel');
  const selected=document.querySelector('[data-layer="placements"] > g[data-sky="A"][data-placement="south-node"]');
  return wheel?.classList.contains('has-isolation')&&selected?.classList.contains('is-selected');
});

const isolatedNodes=await page.evaluate(()=>Object.fromEntries(['north-node','south-node'].map(id=>{
  const host=document.querySelector(`[data-layer="placements"] > g[data-sky="A"][data-placement="${id}"]`);
  const art=host.querySelector(`.relphi-glyph-${id}`);
  const box=art.getBoundingClientRect();
  return [id,{hostOpacity:Number(getComputedStyle(host).opacity),width:box.width,height:box.height,visibility:getComputedStyle(art).visibility,selected:host.classList.contains('is-selected')}];
})));
assert.equal(isolatedNodes['south-node'].selected,true,'South Node must remain selected on the wheel.');
assert.ok(isolatedNodes['south-node'].hostOpacity>.95,'Selected South Node must remain fully visible.');
assert.ok(isolatedNodes['south-node'].width>4&&isolatedNodes['south-node'].height>4,'Selected South Node must retain visible glyph artwork.');
assert.ok(isolatedNodes['north-node'].hostOpacity>0&&isolatedNodes['north-node'].hostOpacity<.5,'North Node must remain present in the normal dimmed view.');
assert.ok(isolatedNodes['north-node'].width>4&&isolatedNodes['north-node'].height>4,'Dimmed North Node must retain visible glyph artwork.');
assert.equal(isolatedNodes['north-node'].visibility,'visible','Dimmed North Node artwork must not be hidden.');

const scrollCheck=await page.evaluate(()=>{
  let panel=document.getElementById('skySelectedRelationship');
  const temporary=!panel;
  if(!panel){panel=document.createElement('section');panel.id='skySelectedRelationship';panel.style.marginTop='3000px';document.body.appendChild(panel)}
  window.scrollTo(0,0);
  const before=window.scrollY;
  panel.scrollIntoView({behavior:'auto',block:'start'});
  const result={before,after:window.scrollY,suppressed:panel.dataset.automaticScrollSuppressed||''};
  if(temporary)panel.remove();
  return result;
});
assert.equal(scrollCheck.after,scrollCheck.before,'Selected Relationship scrollIntoView must not move the page.');
assert.equal(scrollCheck.suppressed,'true','The Selected Relationship scroll request must be explicitly suppressed.');

await page.screenshot({path:'sky-chart-atomic-glyphs-no-scroll.png',fullPage:true,animations:'disabled'});
await page.waitForTimeout(500);
await page.waitForFunction(()=>Number(document.documentElement.dataset.skyGlyphSizeGuardPending||0)===0);
const finalState=await page.evaluate(()=>({
  committed:document.querySelectorAll('#skyFoundationRoot .relphi-canonical-glyph[data-relphi-atomic-commit="true"]').length,
  pending:Number(document.documentElement.dataset.skyGlyphSizeGuardPending||0),
  withheld:Number(document.documentElement.dataset.skyGlyphSizeGuardWithheld||0),
  guardErrors:window.RelphiSkyGlyphSizeGuard?.errors||[],
  paintViolations:window.__relphiGlyphPaintViolations,
  visibleUncommitted:Array.from(document.querySelectorAll('#skyFoundationRoot .relphi-canonical-glyph,#skySelectedRelationship .relphi-canonical-glyph')).filter(art=>{
    const style=getComputedStyle(art);
    return style.visibility!=='hidden'&&style.display!=='none'&&art.dataset.relphiAtomicCommit!=='true';
  }).map(art=>art.className?.baseVal||art.className||'')
}));
assert.ok(finalState.committed>0,'The chart must contain an atomically committed canonical glyph.');
assert.equal(finalState.pending,0,'The glyph size guard must have no unfinished work.');
assert.deepEqual(finalState.paintViolations,[],'No raw or oversized canonical glyph may reach a visible paint frame.');
assert.deepEqual(finalState.visibleUncommitted,[],'Every visible canonical glyph must be fitted before it is committed.');
assert.deepEqual(errors,[]);
await browser.close();
console.log(`North and South Node stay visible when selected or dimmed, no source-sized glyph reaches a visible frame, Selected Relationship never auto-scrolls, and ${finalState.withheld} unresolved glyphs were safely withheld.`);
