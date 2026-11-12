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

// The wheel's corner focus box must show canonical capitalized placement
// names, not lowercase dataset IDs used internally by the filter controls.
const cornerNames=await page.evaluate(()=>Object.fromEntries(
  ['sun','moon','saturn','north-node','south-node','part-of-fortune','anti-vertex']
    .map(id=>[id,window.RelphiSkyVocab.describeFocus('placement',id)?.name])
));
assert.deepEqual(cornerNames,{
  sun:'Sun',moon:'Moon',saturn:'Saturn','north-node':'North Node',
  'south-node':'South Node','part-of-fortune':'Part of Fortune','anti-vertex':'Anti-Vertex'
},'Corner-box placement labels must use the canonical capitalized names.');

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



/* Vocab draws from the same Focus Display state. No second dropdown owner. */
const sharedDisplay=page.locator('#skyFoundationFocus [data-relationship-display-value]');
await sharedDisplay.waitFor({state:'visible'});
assert.equal(await page.locator('#skyFoundationA [data-vocab-dropdown-toggle]').count(),0,'Vocab must not duplicate Focus display and filter controls.');
await sharedDisplay.click();
const sharedMenu=page.locator('#skyRelationshipDisplayPopover');
await sharedMenu.waitFor({state:'visible'});
for(const layer of ['glyphs','names','referents']){
  assert.equal(await sharedMenu.locator('[data-shared-display-layer="'+layer+'"]').count(),1,'Focus Display owns the '+layer+' layer');
}
const sharedName=sharedMenu.locator('[data-shared-display-layer="names"]');
await sharedName.uncheck();
await page.waitForFunction(()=>window.RelphiSkyVocab?.getDisplay?.().names===false);
await sharedName.check();
await page.waitForFunction(()=>window.RelphiSkyVocab?.getDisplay?.().names===true);
await page.keyboard.press('Escape');
await sharedMenu.waitFor({state:'hidden'});
const afterDisplayGlyphGeometry=await abstractGlyphGeometry();
assert.deepEqual(afterDisplayGlyphGeometry.map(({w,h,svgW,svgH})=>[Math.round(w*100),Math.round(h*100),Math.round(svgW*100),Math.round(svgH*100)]),
 initialAbstractGlyphGeometry.map(({w,h,svgW,svgH})=>[Math.round(w*100),Math.round(h*100),Math.round(svgW*100),Math.round(svgH*100)]),
 'Shared Focus Display changes must not resize canonical abstract Vocab glyphs.');


// Open all groups for the detailed interaction and geometry assertions below.
await vocabGroups.evaluateAll(nodes=>nodes.forEach(node=>{node.open=true}));
await page.waitForFunction(()=>[...document.querySelectorAll('#skyFoundationA details.sky-vocab-group')].every(node=>node.open));

// Rendered polarity lines are inside native collapsed details. Open those
// disclosures via their actual summary before testing hover and token actions.
await vocabGroups.evaluateAll(nodes=>nodes.forEach(node=>{node.open=true}));
await page.waitForFunction(()=>[...document.querySelectorAll('#skyFoundationA details.sky-vocab-group')].every(node=>node.open));
const vocabParagraph=page.locator('#skyFoundationA [data-sky-vocab-paragraph]');
assert.equal(await vocabParagraph.locator(':scope > :first-child').evaluate(node=>node.classList.contains('sky-vocab-structures-heading')),true,'Structures must be the first reading layer before Placements.');
const placementRows=vocabParagraph.locator('.sky-vocab-line[data-vocab-placement-colors="true"]');
assert.ok(await placementRows.count()>5,'Placements must remain a complete atomic reading layer beneath Structures.');
const firstPlacementRails=await placementRows.first().evaluate(node=>{const style=getComputedStyle(node);return{
  sign:style.getPropertyValue('--vocab-placement-signs').trim(),
  house:style.getPropertyValue('--vocab-placement-houses').trim(),
  backgroundImage:style.backgroundImage,
  backgroundSize:style.backgroundSize,
  system:node.dataset.vocabHouseSystem
}});
assert.ok(firstPlacementRails.sign,'Each placement row must expose a sign rail.');
assert.ok(firstPlacementRails.house,'Each placement row must expose a house rail.');
assert.notEqual(firstPlacementRails.backgroundImage,'none','The sign and house rails must actually paint on the Vocab row.');
assert.ok((firstPlacementRails.backgroundImage.match(/linear-gradient/g)||[]).length>=2,'A single-placement Vocab row must visibly paint both the sign rail and the house rail.');
assert.match(firstPlacementRails.backgroundSize,/3px 100%/,'Vocab rails must remain narrow visible sign and house stripes.');
assert.equal(firstPlacementRails.system,'equal-house','Placement rails must use the active house system.');
const ascDscPlacementRow=placementRows.filter({has:page.locator('[data-vocab-id="asc"]')}).filter({has:page.locator('[data-vocab-id="dsc"]')}).first();
assert.equal(await ascDscPlacementRow.count(),1,'Ascendant and Descendant must remain one paired placement sentence.');
const ascDscRail=await ascDscPlacementRow.evaluate(node=>getComputedStyle(node).getPropertyValue('--vocab-placement-signs').trim());
assert.match(ascDscRail,/linear-gradient/i,'A paired placement sentence must split its sign rail across both placements.');

const primaryAxes=await vocabParagraph.locator('[data-vocab-structure="axis-polarity"]').evaluateAll(lines=>lines.map(line=>line.dataset.vocabAxis));
assert.deepEqual(primaryAxes.slice(0,4),['vertex-anti-vertex','asc-dsc','mc-ic','north-node-south-node'],'Primary structures must lead with Vertex/Anti-Vertex, chart angles, then nodes.');
for(const axis of primaryAxes.slice(0,4)){
  const row=page.locator(`#skyFoundationA [data-vocab-structure="axis-polarity"][data-vocab-axis="${axis}"]`);
  await row.dispatchEvent('pointerover',{pointerType:'mouse'});
  await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-vocab-axis-context'));
  const memberIds=await row.locator('.sky-vocab-token[data-vocab-kind="placement"]').evaluateAll(nodes=>[...new Set(nodes.map(node=>node.dataset.vocabId).filter(Boolean))]);
  const memberStates=await page.evaluate(ids=>ids.map(id=>{
    const node=document.querySelector(`#skyFoundationWheelMount [data-focus-piece="placement"][data-sky="A"][data-placement="${id}"]`);
    return{id,exists:!!node,kept:node?.classList.contains('is-vocab-context')||false,opacity:node?Number(getComputedStyle(node).opacity):null};
  }),memberIds);
  assert.ok(memberStates.length>=2,`Axis ${axis} must expose its placement members: ${JSON.stringify(memberStates)}`);
  memberStates.forEach(state=>{
    assert.equal(state.exists,true,`Axis member ${state.id} must exist on the wheel for ${axis}: ${JSON.stringify(memberStates)}`);
    assert.equal(state.kept,true,`Axis member ${state.id} must retain Vocab context for ${axis}: ${JSON.stringify(memberStates)}`);
    assert.equal(state.opacity,1,`Axis member ${state.id} must remain fully emphasized for ${axis}: ${JSON.stringify(memberStates)}`);
  });
  await row.dispatchEvent('pointerout',{pointerType:'mouse'});
  await page.waitForFunction(()=>!document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-vocab-context'));
}
const vertexAxis=page.locator('#skyFoundationA [data-vocab-structure="axis-polarity"][data-vocab-axis="vertex-anti-vertex"]');
await vertexAxis.dispatchEvent('pointerover',{pointerType:'mouse'});
await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-vocab-axis-context'));
const axisWheelEmphasis=await page.evaluate(()=>{
  const opacity=id=>Number(getComputedStyle(document.querySelector('#skyFoundationWheelMount [data-focus-piece="placement"][data-sky="A"][data-placement="'+id+'"]')).opacity);
  return{vertex:opacity('vertex'),antiVertex:opacity('anti-vertex'),moon:opacity('moon')};
});
assert.equal(axisWheelEmphasis.vertex,1,'The active Vertex axis endpoint must remain fully emphasized.');
assert.equal(axisWheelEmphasis.antiVertex,1,'The active Anti-Vertex axis endpoint must remain fully emphasized.');
assert.ok(axisWheelEmphasis.moon<=.1,'Placements outside the active axis must dim under the same isolation logic as comparison-wheel hover.');
await vertexAxis.dispatchEvent('pointerout',{pointerType:'mouse'});
await page.waitForFunction(()=>!document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-vocab-context'));
assert.equal(await vocabParagraph.locator('[data-vocab-structure="axis-polarity"][data-vocab-axis="vertex-anti-vertex"] .sky-vocab-token[data-vocab-id="anti-vertex"]').count(),1,'Vertex polarity must include a derived Anti-Vertex when the sky stores only Vertex.');
const antiVertexToken=vocabParagraph.locator('[data-vocab-structure="axis-polarity"][data-vocab-axis="vertex-anti-vertex"] .sky-vocab-token[data-vocab-id="anti-vertex"]').first();
await antiVertexToken.locator('.relphi-glyph-anti-vertex').waitFor({state:'attached'});
assert.equal(await antiVertexToken.locator('.sky-vocab-glyph.has-svg-glyph').count(),1,'Anti-Vertex must render through the canonical SVG glyph path.');
assert.equal((await antiVertexToken.textContent()).includes('AVx'),false,'Anti-Vertex must not expose the temporary AVx text fallback.');
assert.deepEqual(await page.evaluate(()=>{const entry=window.RelphiGlyphRegistry.get('anti-vertex');return{asset:entry?.asset,fitMode:entry?.fitMode,fallback:entry?.fallback??null}}),{asset:'assets/planet-glyphs/anti-vertex.svg',fitMode:'letter',fallback:'AVx'},'Anti-Vertex must resolve to its canonical SVG using the same letter mode as Asc.');
const antiVertexRenderState=await page.evaluate(()=>{
  const av=document.querySelector('#skyFoundationA [data-vocab-axis="vertex-anti-vertex"] .relphi-glyph-anti-vertex');
  if(!av)return null;
  const box=av.getBBox();
  return{width:box.width,height:box.height,visibility:getComputedStyle(av).visibility,fitState:av.dataset.fitState||''};
});
assert.ok(antiVertexRenderState&&antiVertexRenderState.width>0&&antiVertexRenderState.height>0,'Anti-Vertex canonical outlined geometry must render with measurable ink.');
assert.equal(antiVertexRenderState.visibility,'visible','Anti-Vertex canonical SVG must be revealed after its deterministic fit resolves.');
assert.equal(antiVertexRenderState.fitState,'resolved','Anti-Vertex canonical SVG must complete the shared glyph fitting path.');
const storedVertexPair=await page.evaluate(()=>{
  const value=JSON.parse(localStorage.getItem('relphiSkyChartA')),placements=value?.placements||{};
  const pick=name=>Object.values(placements).find(item=>String(item?.name||'').toLowerCase().replace(/[^a-z]/g,'')===name)||null;
  return{vertex:placements.Vertex||pick('vertex'),antiVertex:placements['Anti-Vertex']||pick('antivertex')};
});
assert.ok(storedVertexPair.antiVertex,'Anti-Vertex must be persisted as a real derived placement, not exist only inside Vocab.');
assert.ok(storedVertexPair.vertex,'Vertex must remain present when its Anti-Vertex is derived.');
const storedVertexOpposition=Math.abs(((((Number(storedVertexPair.antiVertex.longitude)-Number(storedVertexPair.vertex.longitude))-180)+180)%360+360)%360-180);
assert.ok(storedVertexOpposition<1e-6,'Stored Anti-Vertex must remain exactly 180° from the stored Vertex after any normal Vertex recalculation.');
const antiVertexWheel=page.locator('#skyFoundationWheelMount [data-focus-piece="placement"][data-sky="A"][data-placement="anti-vertex"]');
assert.equal(await antiVertexWheel.count(),1,'Anti-Vertex must render as a normal wheel placement.');
assert.equal(await page.locator('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relationship-mode="A-A"][data-aspect="opposition"]').evaluateAll(rows=>rows.filter(row=>[row.dataset.leftPlacement,row.dataset.rightPlacement].sort().join('|')==='anti-vertex|vertex').length),0,'Vertex–Anti-Vertex opposition must not count as an intrasky relationship because it is constitutive.');


const ariesLibra=page.locator('#skyFoundationA [data-vocab-structure="sign-polarity"][data-vocab-signs="Aries|Libra"]');
assert.equal(await ariesLibra.count(),1,'All sign polarities must be represented structurally.');
assert.match(await ariesLibra.textContent(),/Aries[^.]*no placements[^.]*default ruler Mars/i,'An empty Aries pole must state both the absence and Mars as its default ruler.');
assert.equal(await ariesLibra.locator('[data-vocab-context-kind="house"]').count(),1,'Placements sharing one house inside a sign pole must share one house context instead of repeating it after every placement.');
const ariesLibraHouseRail=await ariesLibra.evaluate(node=>getComputedStyle(node).getPropertyValue('--vocab-polarity-houses').trim());
assert.doesNotMatch(ariesLibraHouseRail,/rgba\(31\s*,\s*27\s*,\s*24\s*,\s*(?:\.18|0\.18)\)/i,'An empty sign pole must inherit the house territory colors instead of turning gray.');
assert.match(ariesLibraHouseRail,/(#43a85b|rgb\(67\s*,\s*168\s*,\s*91\)|#2ca69b|rgb\(44\s*,\s*166\s*,\s*155\))/i,'The empty Aries pole must still show the actual house colors crossed by Aries in the fixture.');

const houseFourTen=page.locator('#skyFoundationA [data-vocab-structure="house-polarity"][data-vocab-houses="4|10"]');
assert.equal(await houseFourTen.count(),1,'All house polarities must be represented structurally.');
assert.match(await houseFourTen.textContent(),/Tenth House[^.]*no placements[^.]*default ruler Mercury/i,'An empty Tenth House in the fixture must state its Gemini-cusp default ruler, Mercury.');
assert.equal(await houseFourTen.locator('[data-vocab-context-kind="sign"]').count(),2,'A house polarity must state each cusp sign once; occupants in that same sign must not repeat it.');

const meridianStructure=page.locator('#skyFoundationA [data-vocab-structure="axis-polarity"][data-vocab-axis="mc-ic"]');
const beforeHouseSystemRails=await meridianStructure.evaluate(node=>({
  sign:getComputedStyle(node).getPropertyValue('--vocab-polarity-signs').trim(),
  house:getComputedStyle(node).getPropertyValue('--vocab-polarity-houses').trim()
}));
const placementRailSnapshot=()=>page.locator('#skyFoundationA .sky-vocab-line[data-vocab-placement-colors="true"]').evaluateAll(rows=>rows.map(node=>({
  ids:[...node.querySelectorAll('.sky-vocab-token[data-vocab-kind="placement"]')].map(token=>token.dataset.vocabId).filter(Boolean).join('|'),
  house:getComputedStyle(node).getPropertyValue('--vocab-placement-houses').trim()
})));
const beforePlacementHouseRails=await placementRailSnapshot();
const alternateCusps=skyA.houseCusps.map((value,index)=>(value+(index%2===0?12:-8)+360)%360);
await page.evaluate(({cusps})=>{
  const key='relphiSkyChartA',value=JSON.parse(localStorage.getItem(key));
  value.houseSystem='placidus';
  value.houseCusps=cusps;
  value.calcProfile={...(value.calcProfile||{}),houseSystem:'placidus',houseCusps:cusps,cusps};
  localStorage.setItem(key,JSON.stringify(value));
  // This assertion is about Vocab rail derivation, not the app-wide house-system
  // transaction. Render Vocab from the stored fixture without inviting another
  // integration layer to normalize the synthetic test mutation.
  window.RelphiSkyVocab?.render?.();
},{cusps:alternateCusps});
await page.waitForFunction(()=>document.querySelector('#skyFoundationA [data-vocab-axis="mc-ic"]')?.dataset.vocabHouseSystem==='placidus');
const afterHouseSystemRails=await page.locator('#skyFoundationA [data-vocab-axis="mc-ic"]').evaluate(node=>({
  sign:getComputedStyle(node).getPropertyValue('--vocab-polarity-signs').trim(),
  house:getComputedStyle(node).getPropertyValue('--vocab-polarity-houses').trim(),
  system:node.dataset.vocabHouseSystem
}));
assert.equal(afterHouseSystemRails.system,'placidus','Vocab structure rails must rerender for a changed house system.');
assert.equal(afterHouseSystemRails.sign,beforeHouseSystemRails.sign,'Changing house system must not alter the zodiac-sign rail for fixed longitudes.');
assert.notEqual(afterHouseSystemRails.house,beforeHouseSystemRails.house,'Changing house cusps must be able to alter the house rail independently of the sign rail.');
const afterPlacementHouseRails=await placementRailSnapshot();
assert.ok(afterPlacementHouseRails.length>0&&await page.locator('#skyFoundationA .sky-vocab-line[data-vocab-placement-colors="true"]').first().getAttribute('data-vocab-house-system')==='placidus','Placement rails must rerender under the changed house system.');
const beforePlacementRailMap=new Map(beforePlacementHouseRails.map(item=>[item.ids,item.house]));
assert.ok(afterPlacementHouseRails.some(item=>beforePlacementRailMap.has(item.ids)&&beforePlacementRailMap.get(item.ids)!==item.house),'At least one placement whose house assignment changes must update its house rail.');

const rawLoadedSky={
  placements:{
    ...Object.fromEntries(Object.entries(skyA.placements)),
    _houseContext:{name:'_houseContext',longitude:255,sign:'Sagittarius',house:6}
  },
  calcProfile:skyA.calcProfile,
  houseCusps:skyA.houseCusps,
  houseSystem:skyA.houseSystem,
  name:'Loaded natal sky'
};
await page.evaluate(raw=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(raw));
  window.RelphiSkyVocab?.render?.();
},rawLoadedSky);
await page.waitForFunction(()=>document.querySelector('#skyFoundationA .sky-vocab-token[data-vocab-id="sun"]'));
assert.equal(await page.locator('#skyFoundationA .sky-vocab-token[data-vocab-id="_housecontext"]').count(),0,'Internal _houseContext metadata must never render as a Vocab placement after a sky load.');
assert.equal((await page.locator('#skyFoundationA [data-sky-vocab-paragraph]').textContent()).includes('_houseContext'),false,'Private sky metadata text must not leak into the Vocab paragraph.');



/* Relationship filters remain the sole filter owner. Vocab must not create a
   second Placements, Zodiac Signs, or Houses state. */
assert.equal(await page.locator('#skyFoundationA [data-vocab-dropdown-toggle]').count(),0);
const relationshipPlacementSummary=page.locator('#skyFoundationRelationships [data-placement-filter-summary]');
assert.ok(await relationshipPlacementSummary.count()===1,'Relationships provides the shared Placements filter');
const sharedPlacementButton=page.locator('#skyFoundationRelationships [data-placement-filter-toggle],#skyFoundationFocus [data-placement-filter-toggle]').first();
if(await sharedPlacementButton.count()){
  await sharedPlacementButton.click();
  const placementMenu=page.locator('#skyChartPlacementPopover');
  await placementMenu.waitFor({state:'visible'});
  assert.ok(await placementMenu.locator('[data-placement-choice]').count()>10,'Shared Placements retains its OR/AND/NOT controls');
  await page.keyboard.press('Escape');
}


const initialLines=page.locator('#skyFoundationA .sky-vocab-line');
assert.ok(await initialLines.count()>5,'Vocab must render multiple sentence lines.');
const lineStarts=await initialLines.evaluateAll(lines=>lines.map(line=>(line.textContent||'').trim()).filter(Boolean).map(text=>text.match(/[A-Za-z]/)?.[0]||''));
assert.equal(lineStarts.every(letter=>/[A-Z]/.test(letter)),true,'Every Vocab line must begin with a capital letter.');

const sunLine=page.locator('#skyFoundationA .sky-vocab-line:not([data-vocab-structure])').filter({has:page.locator('.sky-vocab-token[data-vocab-kind="placement"][data-vocab-id="sun"]')}).first();
const sunLineText=(await sunLine.textContent()).replace(/\s+/g,' ');
assert.match(sunLineText,/is in/i,'Ordinary placements must use the same “is in” grammar as Ascendant and MC.');

const firstHouseBridge=await page.locator('#skyFoundationA .sky-vocab-line:not([data-vocab-structure]) .sky-vocab-token[data-vocab-kind="house"] > .sky-vocab-symbol-label').first().evaluate(node=>({
  text:(node.textContent||'').trim(),
  whiteSpace:getComputedStyle(node).whiteSpace
}));
assert.match(firstHouseBridge.text,/^in\s+/,'The house preposition must live inside the house token’s medallion/name head.');
assert.equal(firstHouseBridge.whiteSpace,'nowrap','The house preposition, medallion, and parenthetical House name must move as one unit.');
assert.equal(await page.locator('#skyFoundationA .sky-vocab-token[data-vocab-kind="aspect"]').count(),0,'Vocab must not reproduce the raw aspect list already available in Relationships.');
const sunMercuryCluster=page.locator('#skyFoundationA [data-vocab-structure="cluster"][data-vocab-members*="sun"][data-vocab-members*="mercury"]');
assert.equal(await sunMercuryCluster.count(),1,'A natural non-axis Sun–Mercury concentration must be synthesized as one cluster.');
assert.equal(await sunMercuryCluster.getAttribute('data-vocab-cluster-type'),'mid-sign','A concentration wholly inside Libra must be marked as mid-sign.');
assert.equal(await sunMercuryCluster.getAttribute('data-vocab-signs'),'Libra','A mid-sign concentration must name its one affected sign.');
assert.match(await sunMercuryCluster.textContent(),/^Mid-sign · Libra:/i,'An ordinary concentration card must begin with its subtype and sign, not repeat Cluster.');
assert.doesNotMatch(await sunMercuryCluster.textContent(),/form one concentrated group/i,'An ordinary concentration card must not restate the section heading at the end.');
const relationshipCountBeforeVocabHover=await page.locator('#skyFoundationRelationshipList>.sky-foundation-relationship-row:visible').count();
await sunMercuryCluster.dispatchEvent('pointerover',{pointerType:'mouse'});
await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-vocab-context'));
const vocabWheelHighlight=await page.evaluate(()=>({
  isolated:document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-isolation')||false,
  placements:[...document.querySelectorAll('#skyFoundationWheelMount [data-focus-piece="placement"].is-vocab-context.is-kept')].map(node=>node.dataset.placement),
  signs:[...document.querySelectorAll('#skyFoundationWheelMount [data-focus-piece="sign"].is-vocab-context.is-kept')].map(node=>Number(node.dataset.sign)),
  houses:[...document.querySelectorAll('#skyFoundationWheelMount [data-focus-piece="house"].is-vocab-context.is-kept')].map(node=>({sky:node.dataset.sky,house:Number(node.dataset.house)}))
}));
assert.equal(vocabWheelHighlight.isolated,true,'Hovering a Vocab structure must use the comparison wheel isolation state.');
assert.ok(vocabWheelHighlight.placements.includes('sun')&&vocabWheelHighlight.placements.includes('mercury'),'Hovering a concentration must keep each member placement on the wheel.');
assert.ok(vocabWheelHighlight.signs.includes(6),'Hovering the Libra concentration must keep Libra on the wheel.');
const unrelatedMoonOpacity=Number(await page.locator('#skyFoundationWheelMount [data-focus-piece="placement"][data-sky="A"][data-placement="moon"]').evaluate(node=>getComputedStyle(node).opacity));
assert.ok(unrelatedMoonOpacity<=.1,'Unrelated placement glyphs must dim under Vocab isolation just as they do under wheel hover.');
assert.equal(await page.locator('#skyFoundationRelationshipList>.sky-foundation-relationship-row:visible').count(),relationshipCountBeforeVocabHover,'Vocab wheel isolation must remain visual-only and must not filter the Relationships list.');
await sunMercuryCluster.dispatchEvent('pointerout',{pointerType:'mouse'});
await page.waitForFunction(()=>!document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-vocab-context'));

// Individual Vocab components reuse the same native comparison-wheel isolate logic.
const sunToken=sunLine.locator('.sky-vocab-token[data-vocab-kind="placement"][data-vocab-id="sun"]').first();
await sunToken.dispatchEvent('pointerover',{pointerType:'mouse'});
await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-isolation'));
const nativeTokenState=await page.evaluate(()=> {
  const sun=document.querySelector('#skyFoundationWheelMount [data-focus-piece="placement"][data-sky="A"][data-placement="sun"]');
  const moon=document.querySelector('#skyFoundationWheelMount [data-focus-piece="placement"][data-sky="A"][data-placement="moon"]');
  return{
    sunKept:sun?.classList.contains('is-kept')||false,
    sunHovered:sun?.classList.contains('is-hovered')||false,
    sunOpacity:sun?Number(getComputedStyle(sun).opacity):null,
    moonOpacity:moon?Number(getComputedStyle(moon).opacity):null
  };
});
assert.equal(nativeTokenState.sunKept,true,'Hovered Vocab component must keep its corresponding wheel placement.');
assert.equal(nativeTokenState.sunHovered,true,'Hovered Vocab component must use the native wheel hover state.');
assert.equal(nativeTokenState.sunOpacity,1,'Hovered Vocab component must remain fully visible.');
assert.ok(nativeTokenState.moonOpacity<=.1,'Unrelated wheel components must dim under the same native isolation logic.');
assert.equal(await page.locator('#skyFoundationRelationshipList>.sky-foundation-relationship-row:visible').count(),relationshipCountBeforeVocabHover,'Native Vocab preview must not filter the Relationships list.');
await sunToken.dispatchEvent('pointerout',{pointerType:'mouse'});
await page.waitForFunction(()=>!document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-isolation'));

await sunToken.click();
await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-isolation'));
const pinnedState=await page.evaluate(()=>{
  const sun=document.querySelector('#skyFoundationWheelMount [data-focus-piece="placement"][data-sky="A"][data-placement="sun"]');
  return{selected:sun?.classList.contains('is-selected')||false,kept:sun?.classList.contains('is-kept')||false};
});
assert.equal(pinnedState.selected,true,'Clicking a Vocab token must pin the native wheel selection.');
assert.equal(pinnedState.kept,true,'Pinned Vocab selection must remain kept.');

const inlineGlyphPaintState=await page.locator('#skyFoundationA .sky-vocab-glyph.has-svg-glyph svg').evaluateAll(nodes=>nodes.slice(0,24).map(svg=>({
  ready:svg.dataset.vocabInlineGlyphReady==='true',
  visibility:getComputedStyle(svg).visibility,
  width:svg.getBoundingClientRect().width,
  height:svg.getBoundingClientRect().height
})));
assert.ok(inlineGlyphPaintState.length>0,'Expanded Vocab must expose canonical inline SVG glyphs.');
assert.equal(inlineGlyphPaintState.every(item=>item.ready||item.visibility==='hidden'),true,'An expanded Vocab glyph must never paint before its final fitted state is ready.');
assert.equal(inlineGlyphPaintState.every(item=>item.width>=18&&item.height>=18),true,'Expanded Vocab glyph frames must start and remain at their final inline geometry.');

const glyphMetrics=await page.locator('#skyFoundationA .sky-vocab-glyph svg').first().evaluate(node=>{
  const style=getComputedStyle(node);
  return{width:parseFloat(style.width),height:parseFloat(style.height)};
});
assert.ok(glyphMetrics.width>=18&&glyphMetrics.height>=18,'Vocab glyphs must render at the larger mobile-readable inline size.');
assert.ok(await page.locator('#skyFoundationA .sky-vocab-meta').count()>5,'Visible astrological detail must use the clean inline meta treatment.');
assert.ok(await page.locator('#skyFoundationA .sky-vocab-token[data-vocab-kind="house"] .relphi-house-medallion').count()>0,'Vocab house tokens must render the canonical Relphi House Medallion instead of a bare colored house number.');

const houseMedallionVisual=await page.locator('#skyFoundationA .sky-vocab-token[data-vocab-kind="house"] .relphi-house-medallion').first().evaluate(node=>{
  const style=getComputedStyle(node);
  return{
    text:(node.textContent||'').trim(),
    color:style.color,
    fill:style.webkitTextFillColor||style.color,
    background:style.backgroundColor,
    width:parseFloat(style.width),
    height:parseFloat(style.height)
  };
});
assert.match(houseMedallionVisual.text,/^\d{1,2}$/,'The canonical house number must remain inside the medallion.');
assert.ok(houseMedallionVisual.width>=19&&houseMedallionVisual.height>=19,'Inline House Medallions must be large enough to read on mobile.');
assert.notEqual(houseMedallionVisual.fill,houseMedallionVisual.background,'The house number ink must contrast with the medallion background instead of disappearing into it.');

const vocabAlignment=await page.locator('#skyFoundationA .sky-vocab-token').filter({has:page.locator('.sky-vocab-name')}).first().evaluate(node=>{
  const referent=node.querySelector('.sky-vocab-referent');
  const name=node.querySelector('.sky-vocab-name');
  if(!referent||!name)return null;
  const rr=referent.getBoundingClientRect(),nr=name.getBoundingClientRect();
  return{referentBottom:rr.bottom,nameBottom:nr.bottom,diff:Math.abs(rr.bottom-nr.bottom)};
});
assert.ok(vocabAlignment&&vocabAlignment.diff<=4,'Vocab names must sit on the same visual baseline as their referents.');

const opticalAlignment=await page.locator('#skyFoundationA .sky-vocab-token').filter({has:page.locator('.sky-vocab-glyph')}).first().evaluate(node=>{
  const glyph=node.querySelector('.sky-vocab-glyph');
  const name=node.querySelector('.sky-vocab-name');
  const referent=node.querySelector('.sky-vocab-referent');
  if(!glyph||!name||!referent)return null;
  const gr=glyph.getBoundingClientRect(),nr=name.getBoundingClientRect(),rr=referent.getBoundingClientRect();
  return{
    glyphCenter:(gr.top+gr.bottom)/2,
    nameCenter:(nr.top+nr.bottom)/2,
    referentCenter:(rr.top+rr.bottom)/2
  };
});
assert.ok(opticalAlignment,'Expanded Vocab must expose glyph, name, and referent geometry for visual checks.');
const svgGlyphLayout=await page.locator('#skyFoundationA .sky-vocab-glyph.has-svg-glyph').first().evaluate(node=>{const host=getComputedStyle(node),svg=getComputedStyle(node.querySelector('svg'));return{hostHeight:parseFloat(host.height),hostPosition:host.position,svgPosition:svg.position,svgTransform:svg.transform,lineHeight:parseFloat(getComputedStyle(node.closest('.sky-vocab-line')).lineHeight)}});
assert.equal(svgGlyphLayout.hostPosition,'relative','Canonical glyph host must provide a layout-neutral positioning context.');
assert.equal(svgGlyphLayout.svgPosition,'absolute','Canonical SVG artwork must be removed from line-box sizing.');
assert.ok(svgGlyphLayout.hostHeight<=svgGlyphLayout.lineHeight,'Canonical glyph host must not make the Vocab line taller than normal text.');
assert.notEqual(svgGlyphLayout.svgTransform,'none','Canonical SVG artwork must retain its independent optical vertical placement.');
assert.ok(opticalAlignment&&Math.abs(opticalAlignment.nameCenter-opticalAlignment.referentCenter)<=4,'Name and referent must sit on the same visual line.');

const housePairAlignment=await page.locator('#skyFoundationA .sky-vocab-token[data-vocab-kind="house"]').filter({has:page.locator('.sky-vocab-name')}).first().evaluate(node=>{
  const medallion=node.querySelector('.relphi-house-medallion');
  const name=node.querySelector('.sky-vocab-name');
  if(!medallion||!name)return null;
  const mr=medallion.getBoundingClientRect(),nr=name.getBoundingClientRect();
  return{diff:Math.abs((mr.top+mr.bottom)/2-(nr.top+nr.bottom)/2)};
});
assert.ok(housePairAlignment&&housePairAlignment.diff<=4,`House Medallion and House name must share the same optical center: ${JSON.stringify(housePairAlignment)}`);

const medallionLineImpact=await page.locator('#skyFoundationA .sky-vocab-token[data-vocab-kind="house"]').first().evaluate(node=>{
  const host=node.querySelector('.sky-vocab-glyph.is-house-medallion');
  const line=node.closest('.sky-vocab-line');
  if(!host||!line)return null;
  const hs=getComputedStyle(host),ls=getComputedStyle(line);
  return{
    hostHeight:parseFloat(hs.height),
    lineHeight:parseFloat(ls.lineHeight),
    hostPosition:hs.position
  };
});
assert.ok(medallionLineImpact&&medallionLineImpact.hostPosition==='relative','House Medallion host must provide a positioning context.');
assert.ok(medallionLineImpact&&medallionLineImpact.hostHeight<=medallionLineImpact.lineHeight,'House Medallion host must not make the Vocab line taller than its normal text line.');



const cuspSky=structuredClone(skyA);
cuspSky.placements.Venus=placement('Venus',179.2);
cuspSky.placements.Mars=placement('Mars',180.8);
cuspSky.placements.Mercury=placement('Mercury',180.1);
await page.evaluate(raw=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(raw));
  window.dispatchEvent(new CustomEvent('relphi:saved-sky-loaded',{detail:{slot:'A',source:'test'}}));
},cuspSky);
await page.waitForFunction(()=>document.querySelector('#skyFoundationA [data-vocab-structure="stellium"][data-vocab-cluster-type="cusp"][data-vocab-signs="Virgo|Libra"]'));
const cuspStellium=page.locator('#skyFoundationA [data-vocab-structure="stellium"][data-vocab-cluster-type="cusp"][data-vocab-signs="Virgo|Libra"]');
assert.equal(await cuspStellium.count(),1,'Cross-sign major-body stellium remains represented');
assert.match(await cuspStellium.textContent(),/Stellium · Cusp · Virgo–Libra/i);
assert.match(await cuspStellium.getAttribute('data-vocab-sign-distribution'),/Virgo:\d+\|Libra:\d+/);
assert.deepEqual(errors,[],'Vocab must not produce page errors');
await browser.close();
console.log('Vocab shared Focus, collapsed previews, canonical glyphs, polarity, house rails, and cusp-stellium acceptance passed.');
