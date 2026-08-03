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
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(({a,b})=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
  localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
  sessionStorage.removeItem('relphiSkyWhereWhenViewV1');
  window.__relphiAtomicGlyphViolations=[];
  const inspect=node=>{
    if(!(node instanceof Element))return;
    const glyphs=[];
    if(node.matches?.('.relphi-canonical-glyph'))glyphs.push(node);
    glyphs.push(...node.querySelectorAll?.('.relphi-canonical-glyph')||[]);
    glyphs.forEach(art=>{
      if(art.closest('#relphiGlyphAtomicStage'))return;
      if(!art.closest('#skyFoundationRoot,#skySelectedRelationship'))return;
      if(art.dataset.relphiAtomicCommit!=='true'||!art.getAttribute('transform')){
        window.__relphiAtomicGlyphViolations.push({
          id:art.className?.baseVal||art.className||'',
          committed:art.dataset.relphiAtomicCommit||'',
          transform:art.getAttribute('transform')||''
        });
      }
    });
  };
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(inspect))).observe(document,{childList:true,subtree:true});
},{a:skyA,b:skyB});

await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
await page.waitForFunction(()=>window.__relphiGlyphAtomicCommitActive===true,null,{timeout:20000});
await page.waitForSelector('[data-layer="placements"] .relphi-canonical-glyph[data-relphi-atomic-commit="true"]',{timeout:20000});
await page.waitForFunction(()=>document.querySelectorAll('.relphi-glyph-bubble[data-relphi-atomic-pending="true"]').length===0,null,{timeout:20000});
assert.ok(await page.locator('#skyFoundationRoot .relphi-canonical-glyph[data-relphi-atomic-commit="true"]').count()>20,'The initial chart must contain atomically committed glyphs.');

const row=page.locator('.sky-foundation-relationship-row[data-relation-index]:not([hidden])').first();
await row.scrollIntoViewIfNeeded();
const before=await page.evaluate(()=>window.scrollY);
await row.click();
await page.waitForSelector('#skySelectedRelationship:not([hidden])',{timeout:20000});
await page.waitForSelector('#skySelectedRelationship .relphi-canonical-glyph[data-relphi-atomic-commit="true"]',{timeout:20000});
await page.waitForFunction(()=>document.querySelectorAll('.relphi-glyph-bubble[data-relphi-atomic-pending="true"]').length===0,null,{timeout:20000});
await page.waitForTimeout(1300);
const after=await page.evaluate(()=>window.scrollY);
assert.ok(Math.abs(after-before)<=2,`Selected Relationship changed scroll position from ${before} to ${after}.`);
assert.equal(await page.getAttribute('#skySelectedRelationship','data-automatic-scroll-suppressed'),'true','The Selected Relationship scroll request must be suppressed.');

const finalState=await page.evaluate(()=>({
  violations:window.__relphiAtomicGlyphViolations,
  stageChildren:document.querySelectorAll('#relphiGlyphAtomicStage > g').length,
  visibleUncommitted:Array.from(document.querySelectorAll('#skyFoundationRoot .relphi-canonical-glyph,#skySelectedRelationship .relphi-canonical-glyph')).filter(art=>art.dataset.relphiAtomicCommit!=='true'||!art.getAttribute('transform')).map(art=>art.className?.baseVal||art.className||'')
}));
assert.deepEqual(finalState.violations,[],'No raw source-sized canonical glyph may enter the visible chart.');
assert.equal(finalState.stageChildren,0,'The atomic glyph staging area must be empty after rendering.');
assert.deepEqual(finalState.visibleUncommitted,[],'Every visible canonical glyph must be fitted before it is committed.');
assert.deepEqual(errors,[]);
await page.screenshot({path:'sky-chart-atomic-glyphs-no-scroll.png',fullPage:true});
await browser.close();
console.log('Canonical glyphs commit only after fitting, and Selected Relationship never auto-scrolls.');
