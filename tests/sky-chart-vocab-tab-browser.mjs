import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function placement(name,longitude){
  const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);
  return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0};
}
function sample(name,offset){
  const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,index)=>(asc+index*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:196.5,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,'North Node':40.3,'South Node':220.3,Chiron:74.48,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
  return{name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Malden, Massachusetts, United States',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))};
}
const skyA=sample('Sky A',0),skyB=sample('Sky B',29.27);
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:900,height:900},timezoneId:'America/Denver'});
const page=await context.newPage();
page.setDefaultTimeout(15000);
const errors=[];
page.on('pageerror',error=>errors.push(error.message));

await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.route('https://nominatim.openstreetmap.org/**',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
await page.route('https://api.open-meteo.com/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({timezone:'America/Denver',current:{temperature_2m:20}})}));

await page.addInitScript(({a,b})=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
  localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
  localStorage.removeItem('relphiSkyVocabDisplayV1');
  localStorage.removeItem('relphiSkyVocabFilterV1');
  sessionStorage.removeItem('relphiSkyVocabViewV1');
  sessionStorage.removeItem('relphiSkyPlacementLogicV1');
  sessionStorage.removeItem('relphiSkyVocabGroupOpenV1');
},{a:skyA,b:skyB});

await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
await page.waitForSelector('#skyFoundationA [data-sky-vocab-view-button="vocab"]');

const vocabButton=page.locator('#skyFoundationA [data-sky-vocab-view-button="vocab"]');
await vocabButton.click();
await page.waitForFunction(()=>{const panel=document.querySelector('#skyFoundationA [data-sky-vocab-panel="A"]');return panel&&!panel.hidden;});

assert.equal(await vocabButton.getAttribute('aria-selected'),'true','Vocab tab must become selected when clicked.');
const placementTabsStyle=await page.locator('#skyFoundationA .sky-placement-vocab-tabs').evaluate(node=>{const s=getComputedStyle(node),active=getComputedStyle(node.querySelector('.sky-placement-vocab-tab.is-active'));return{display:s.display,radius:s.borderRadius,background:s.backgroundColor,activeBackground:active.backgroundColor,activeRadius:active.borderRadius}});
assert.equal(placementTabsStyle.display,'grid','Placements / Vocab must use the same segmented-track layout as Rulers / Houses.');
assert.ok(parseFloat(placementTabsStyle.radius)>20,'Placements / Vocab must have the rounded shared tab track.');
assert.notEqual(placementTabsStyle.activeBackground,'rgba(0, 0, 0, 0)','The selected Vocab tab must be a filled pill inside the track.');
assert.ok(parseFloat(placementTabsStyle.activeRadius)>20,'The selected Vocab tab must keep the pill treatment.');
assert.equal(await page.locator('#skyFoundationA [data-sky-drawer-mount="placements"]').evaluate(node=>node.hidden),true,'Placements ledger must hide while Vocab is active.');
assert.equal(await page.locator('#skyFoundationA [data-sky-vocab-panel="A"]').evaluate(node=>node.hidden),false,'Vocab panel must be visible after clicking Vocab.');

const vocabGroups=page.locator('#skyFoundationA details.sky-vocab-group');
assert.ok(await vocabGroups.count()>=6,'Vocab results must be grouped into collapsed semantic disclosures.');
assert.equal(await vocabGroups.evaluateAll(nodes=>nodes.every(node=>!node.open)),true,'Vocab groups must default collapsed.');
assert.ok(await page.locator('#skyFoundationA .sky-vocab-group-preview-glyph').count()>4,'Collapsed Vocab summaries must preview their member glyphs.');
assert.equal(await page.locator('#skyFoundationA .sky-vocab-group-preview-text').count(),0,'Collapsed Vocab summaries must not duplicate names or referents.');
assert.ok(await page.locator('#skyFoundationA [data-vocab-preview-rail="sign"]').count()>0,'Collapsed Vocab summaries must restore horizontal sign rails.');
assert.ok(await page.locator('#skyFoundationA [data-vocab-preview-rail="house"]').count()>0,'Collapsed Vocab summaries must restore horizontal house rails.');
const collapsedPreview=await page.locator('#skyFoundationA .sky-vocab-group').first().evaluate(node=>({
  bodyDisplay:getComputedStyle(node.querySelector('.sky-vocab-group-body')).display,
  spatialCount:node.querySelectorAll('.sky-vocab-group-preview-spatial').length,
  glyphCount:node.querySelectorAll('.sky-vocab-group-preview-glyph').length,
  signRails:node.querySelectorAll('[data-vocab-preview-rail="sign"]').length,
  houseRails:node.querySelectorAll('[data-vocab-preview-rail="house"]').length,
  signRailHeight:node.querySelector('[data-vocab-preview-rail="sign"]')?getComputedStyle(node.querySelector('[data-vocab-preview-rail="sign"]')).height:'',
  houseRailOpacity:node.querySelector('[data-vocab-preview-rail="house"]')?getComputedStyle(node.querySelector('[data-vocab-preview-rail="house"]')).opacity:''
}));
assert.equal(collapsedPreview.bodyDisplay,'none','Collapsed Vocab group bodies must stay hidden while the abstract stripe remains visible.');
assert.equal(collapsedPreview.spatialCount,1,'Each collapsed Vocab group must show one abstract spatial stripe.');
assert.ok(collapsedPreview.glyphCount>0,'The collapsed spatial stripe must carry placement glyphs.');
assert.equal(collapsedPreview.signRails,1,'Each collapsed Vocab group must show one horizontal sign rail.');
assert.equal(collapsedPreview.houseRails,1,'Each collapsed Vocab group must show one horizontal house rail.');
assert.equal(collapsedPreview.signRailHeight,'3px','Collapsed Vocab rails must remain compact horizontal stripes.');
assert.equal(collapsedPreview.houseRailOpacity,'0.5','The horizontal house rail must retain the lighter house-rail treatment.');

await page.waitForFunction(()=>[...document.querySelectorAll('#skyFoundationA .sky-vocab-group-preview-glyph svg')].some(svg=>svg.dataset.vocabPreviewGlyphReady==='true'));
const abstractGlyphGeometry=async()=>page.locator('#skyFoundationA .sky-vocab-group-preview-glyph').evaluateAll(nodes=>nodes.slice(0,8).map(node=>{
  const box=node.getBoundingClientRect(),svg=node.querySelector('svg'),style=svg?getComputedStyle(svg):null;
  return{w:box.width,h:box.height,svgW:svg?.getBoundingClientRect().width||0,svgH:svg?.getBoundingClientRect().height||0,visible:style?.visibility!=='hidden',ready:svg?.dataset.vocabPreviewGlyphReady==='true'};
}));
const initialAbstractGlyphGeometry=await abstractGlyphGeometry();
assert.ok(initialAbstractGlyphGeometry.length>0,'Abstract Vocab must expose preview glyph geometry.');
assert.equal(initialAbstractGlyphGeometry.every(item=>Math.abs(item.w-15)<.25&&Math.abs(item.h-15)<.25&&Math.abs(item.svgW-15)<.25&&Math.abs(item.svgH-15)<.25),true,'Abstract preview glyph boxes must start at their final fixed 15px geometry.');
assert.equal(initialAbstractGlyphGeometry.every(item=>!item.visible||item.ready),true,'An abstract preview glyph must never paint before its canonical fitted state is ready.');

// Vocab now shares the native Relationships filtering system; its old
// standalone Display/Placements/Zodiac/Houses dropdowns are retired.
// Verify current presentation, wheel-preview interoperability and tab switching.
assert.equal(await page.locator('#skyFoundationA [data-vocab-dropdown-toggle]').count(),0,
  'Vocab must not revive duplicate controls after adopting the shared Relationships filters');
assert.ok(await page.locator('#skyFoundationRelationships [data-placement-filter-summary]').count()>0,
  'Relationships must remain the shared owner of Placement filter controls');

await vocabGroups.evaluateAll(nodes=>nodes.forEach(node=>{node.open=true}));
await page.waitForFunction(()=>[...document.querySelectorAll('#skyFoundationA details.sky-vocab-group')].every(node=>node.open));
const paragraph=page.locator('#skyFoundationA [data-sky-vocab-paragraph]');
assert.ok(await paragraph.locator('[data-vocab-structure="axis-polarity"]').count()>=4,
  'Vocab must render the four primary structural polarities');
const placementRows=paragraph.locator('.sky-vocab-line[data-vocab-placement-colors="true"]');
assert.ok(await placementRows.count()>5,'All eligible Placements must remain present as reading sentences');
const rails=await placementRows.first().evaluate(node=>{
  const s=getComputedStyle(node);
  return {sign:s.getPropertyValue('--vocab-placement-signs').trim(),
    house:s.getPropertyValue('--vocab-placement-houses').trim(),background:s.backgroundImage};
});
assert.ok(rails.sign&&rails.house,'Placement sentences must retain sign and house color rails');
assert.notEqual(rails.background,'none','Sign and house rails must actually paint');

const vertexAxis=paragraph.locator('[data-vocab-structure="axis-polarity"][data-vocab-axis="vertex-anti-vertex"]');
assert.equal(await vertexAxis.count(),1,'Vertex and Anti-Vertex must share a primary axis sentence');
await vertexAxis.dispatchEvent('pointerover',{pointerType:'mouse'});
await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-vocab-axis-context'));
const axisState=await page.evaluate(()=>{
  const root=document.querySelector('#skyFoundationWheelMount');
  return ['vertex','anti-vertex'].map(id=>({
    id,marked:root?.querySelector('[data-focus-piece="placement"][data-sky="A"][data-placement="'+id+'"]')?.classList.contains('is-vocab-context')||false
  }));
});
assert.equal(axisState.every(item=>item.marked),true,'Both axis endpoints must be illuminated on the wheel');
await vertexAxis.dispatchEvent('pointerout',{pointerType:'mouse'});
await page.waitForFunction(()=>!document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-vocab-context'));

const sunToken=paragraph.locator('.sky-vocab-token[data-vocab-kind="placement"][data-vocab-id="sun"]').first();
assert.equal(await sunToken.count(),1,'The Sun must remain an individual Vocab placement token');
const relationshipCount=await page.locator('#skyFoundationRelationshipList>.sky-foundation-relationship-row:visible').count();
await sunToken.hover();
await page.waitForFunction(()=>!!document.querySelector('#skyFoundationWheelMount [data-focus-piece="placement"][data-sky="A"][data-placement="sun"].is-hovered'));
const hoverWheel=await page.evaluate(()=>{
  const wheel=document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel');
  const sun=wheel?.querySelector('[data-focus-piece="placement"][data-sky="A"][data-placement="sun"]');
  const other=wheel?.querySelector('[data-focus-piece="placement"][data-sky="A"][data-placement="moon"]');
  return{isolation:!!wheel?.classList.contains('has-isolation'),selected:!!sun?.classList.contains('is-hovered'),
    moonOpacity:other?Number(getComputedStyle(other).opacity):null};
});
assert.equal(hoverWheel.isolation,true,'Vocab tokens must use native wheel isolation');
assert.equal(hoverWheel.selected,true,'The corresponding native placement must be highlighted');
assert.ok(hoverWheel.moonOpacity>0&&hoverWheel.moonOpacity<1,'Unrelated placements must dim, never disappear');
assert.equal(await page.locator('#skyFoundationRelationshipList>.sky-foundation-relationship-row:visible').count(),relationshipCount,
  'Wheel hover must not filter the Relationships list');
await sunToken.click();
await page.locator('#skyFoundationA .sky-vocab-structures-heading').hover();
await page.waitForFunction(()=>!!document.querySelector('#skyFoundationWheelMount [data-focus-piece="placement"][data-sky="A"][data-placement="sun"].is-selected'));
assert.equal(await page.locator('#skyFoundationRelationshipList>.sky-foundation-relationship-row:visible').count(),relationshipCount,
  'A Vocab click may pin the wheel without filtering the list');

const placementsButton=page.locator('#skyFoundationA [data-sky-vocab-view-button="placements"]');
await placementsButton.click();
assert.equal(await page.locator('#skyFoundationA [data-sky-vocab-panel="A"]').evaluate(node=>node.hidden),true,
  'Switching back to Placements must hide the Vocab reading');
await vocabButton.click();
await page.waitForFunction(()=>!document.querySelector('#skyFoundationA [data-sky-vocab-panel="A"]')?.hidden);
assert.equal(await page.locator('#skyFoundationA details.sky-vocab-group').count()>=6,true,
  'Vocab group navigation must survive a Placements/Vocab round trip');
assert.deepEqual(errors,[],'Vocab switching, native wheel highlighting, and shared controls must not cause page errors');
console.log('Vocab current-interface browser acceptance passed: segmented view, canonical glyphs, shared filters, structural rails, native hover/pin, and round-trip.');
await browser.close();
