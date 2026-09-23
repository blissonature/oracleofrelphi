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
},{a:skyA,b:skyB});

await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
await page.waitForSelector('#skyFoundationA [data-sky-vocab-view-button="vocab"]');

const vocabButton=page.locator('#skyFoundationA [data-sky-vocab-view-button="vocab"]');
await vocabButton.click();
await page.waitForFunction(()=>{const panel=document.querySelector('#skyFoundationA [data-sky-vocab-panel="A"]');return panel&&!panel.hidden;});

assert.equal(await vocabButton.getAttribute('aria-selected'),'true','Vocab tab must become selected when clicked.');
assert.equal(await page.locator('#skyFoundationA [data-sky-drawer-mount="placements"]').evaluate(node=>node.hidden),true,'Placements ledger must hide while Vocab is active.');
assert.equal(await page.locator('#skyFoundationA [data-sky-vocab-panel="A"]').evaluate(node=>node.hidden),false,'Vocab panel must be visible after clicking Vocab.');

const vocabParagraph=page.locator('#skyFoundationA [data-sky-vocab-paragraph]');
assert.equal(await vocabParagraph.locator(':scope > :first-child').evaluate(node=>node.classList.contains('sky-vocab-structures-heading')),true,'Structures must be the first reading layer before Placements.');
const placementRows=vocabParagraph.locator('.sky-vocab-line[data-vocab-placement-colors="true"]');
assert.ok(await placementRows.count()>5,'Placements must remain a complete atomic reading layer beneath Structures.');
const firstPlacementRails=await placementRows.first().evaluate(node=>({
  sign:getComputedStyle(node).getPropertyValue('--vocab-placement-signs').trim(),
  house:getComputedStyle(node).getPropertyValue('--vocab-placement-houses').trim(),
  system:node.dataset.vocabHouseSystem
}));
assert.ok(firstPlacementRails.sign,'Each placement row must expose a sign rail.');
assert.ok(firstPlacementRails.house,'Each placement row must expose a house rail.');
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
assert.equal(axisWheelEmphasis.moon,1,'Placements outside the active axis must keep their native opacity; glow alone identifies Vocab context.');
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

const houseFourTen=page.locator('#skyFoundationA [data-vocab-structure="house-polarity"][data-vocab-houses="4|10"]');
assert.equal(await houseFourTen.count(),1,'All house polarities must be represented structurally.');
assert.match(await houseFourTen.textContent(),/Tenth House[^.]*no placements[^.]*default ruler Mercury/i,'An empty Tenth House in the fixture must state its Gemini-cusp default ruler, Mercury.');

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

async function clickBlankComparison(){
  await page.locator('#skyFoundationComparison').evaluate(node=>{
    const pointer={bubbles:true,cancelable:true,composed:true,pointerId:91,pointerType:'mouse',isPrimary:true,buttons:1};
    node.dispatchEvent(new PointerEvent('pointerdown',pointer));
    node.dispatchEvent(new PointerEvent('pointerup',{...pointer,buttons:0}));
    node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,composed:true}));
  });
}

const display=page.locator('#skyFoundationA [data-vocab-dropdown-toggle="layers"]');
await display.click();
const displayMenu=page.locator('[data-vocab-dropdown-menu="layers"][data-vocab-menu-slot="A"]');
await displayMenu.waitFor({state:'visible'});
assert.equal(await displayMenu.locator('.sky-vocab-filter-row').count(),3,'Display matrix must contain Glyphs, Names, and Referents.');
assert.equal(await displayMenu.locator('[data-vocab-layer-all="A"]').count(),1);
assert.equal(await displayMenu.locator('[data-vocab-layer-none="A"]').count(),1);
await page.keyboard.press('Escape');
await displayMenu.waitFor({state:'hidden'});

const placements=page.locator('#skyFoundationA [data-vocab-dropdown-toggle="placements"]');
await placements.click();
const placementMenu=page.locator('[data-vocab-dropdown-menu="placements"][data-vocab-menu-slot="A"]');
await placementMenu.waitFor({state:'visible'});
assert.ok(await placementMenu.locator('[data-vocab-placement]').count()>10,'Placement matrix must expose the chart placements.');
assert.equal(await placementMenu.locator('.sky-chart-placement-list').count(),1,'Vocab Placement must reuse the Relationships Placement list.');
assert.ok(await placementMenu.locator('.sky-chart-placement-list-item-group').count()>=4,'Vocab Placement must use Relationships group rows.');
assert.equal(await placementMenu.locator('[data-vocab-dimension-master="placements"]').count(),1,'Placement list must use the Relationships-style All placements master row.');
const placementScroll=await placementMenu.evaluate(async menu=>{
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const max=Math.max(0,menu.scrollHeight-menu.clientHeight);
  menu.scrollTop=max;
  const before=menu.scrollTop;
  menu.dispatchEvent(new Event('scroll',{bubbles:false}));
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  return{before,after:menu.scrollTop,max};
});
assert.ok(placementScroll.max>0,'The Placements dropdown test fixture must be scrollable.');
assert.ok(placementScroll.before>0&&placementScroll.after>=placementScroll.before-2,'Scrolling the Placements dropdown must not snap back to the top.');
await page.keyboard.press('Escape');
await placementMenu.waitFor({state:'hidden'});

const signs=page.locator('#skyFoundationA [data-vocab-dropdown-toggle="signs"]');
await signs.click();
const signMenu=page.locator('[data-vocab-dropdown-menu="signs"][data-vocab-menu-slot="A"]');
await signMenu.waitFor({state:'visible'});
assert.equal(await signMenu.locator('[data-vocab-sign]').count(),12,'Zodiac Sign matrix must contain twelve signs.');
assert.equal(await signMenu.locator('.sky-chart-zodiac-filter-row').count(),12,'Vocab Zodiac must reuse the Relationships Zodiac rows.');
assert.equal(await signMenu.locator('.sky-chart-zodiac-filter-glyph svg').count(),12,'Every Vocab Zodiac row must use the canonical Relationships glyph cell.');
assert.equal(await signMenu.locator('.sky-chart-sign-list-figure').count(),12,'Every Vocab Zodiac row must carry the Relationships figure label.');
await page.keyboard.press('Escape');
await signMenu.waitFor({state:'hidden'});

const houses=page.locator('#skyFoundationA [data-vocab-dropdown-toggle="houses"]');
await houses.click();
const houseMenu=page.locator('[data-vocab-dropdown-menu="houses"][data-vocab-menu-slot="A"]');
await houseMenu.waitFor({state:'visible'});
assert.equal(await houseMenu.locator('[data-vocab-house]').count(),12,'House matrix must contain twelve houses.');
assert.equal(await houseMenu.locator('.sky-chart-house-list').count(),1,'Vocab Houses must reuse the Relationships House list.');
assert.equal(await houseMenu.locator('.sky-chart-house-menu-medallion').count(),12,'Every Vocab House row must use the Relationships house medallion.');
assert.match(await houseMenu.locator('.sky-chart-house-menu-description').nth(0).textContent(),/^self, body, approach$/,'House descriptions must match Relationships wording.');
await page.keyboard.press('Escape');
await houseMenu.waitFor({state:'hidden'});

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
  placements:[...document.querySelectorAll('#skyFoundationWheelMount [data-focus-piece="placement"].is-vocab-context')].map(node=>node.dataset.placement),
  signs:[...document.querySelectorAll('#skyFoundationWheelMount [data-focus-piece="sign"].is-vocab-context')].map(node=>Number(node.dataset.sign)),
  houses:[...document.querySelectorAll('#skyFoundationWheelMount [data-focus-piece="house"].is-vocab-context')].map(node=>({sky:node.dataset.sky,house:Number(node.dataset.house)})),
  exact:[...document.querySelectorAll('#skyFoundationWheelMount .is-vocab-context-exact')].map(node=>node.dataset.placement||'')
}));
assert.ok(vocabWheelHighlight.placements.includes('sun')&&vocabWheelHighlight.placements.includes('mercury'),'Hovering a concentration must highlight each member placement on the wheel.');
assert.ok(vocabWheelHighlight.signs.includes(6),'Hovering the Libra concentration must highlight Libra on the wheel.');
assert.ok(vocabWheelHighlight.exact.includes('sun')&&vocabWheelHighlight.exact.includes('mercury'),'Placement loci must receive the strongest Vocab-context emphasis.');
const unrelatedMoonOpacity=Number(await page.locator('#skyFoundationWheelMount [data-focus-piece="placement"][data-sky="A"][data-placement="moon"]').evaluate(node=>getComputedStyle(node).opacity));
assert.equal(unrelatedMoonOpacity,1,'Unrelated placement glyphs must keep native opacity while a Vocab row highlights its context.');
const selectedContextStrength=await page.evaluate(()=>{
  const sign=document.querySelector('#skyFoundationWheelMount .sky-foundation-sign-sector[data-sign="6"]');
  const house=document.querySelector('#skyFoundationWheelMount .sky-foundation-house-sector[data-sky="A"][data-house="1"]');
  const unrelatedSign=document.querySelector('#skyFoundationWheelMount .sky-foundation-sign-sector[data-sign="0"]');
  return{
    signFill:Number(getComputedStyle(sign).fillOpacity),
    houseFill:Number(getComputedStyle(house).fillOpacity),
    signOpacity:Number(getComputedStyle(sign).opacity),
    houseOpacity:Number(getComputedStyle(house).opacity),
    unrelatedSignOpacity:Number(getComputedStyle(unrelatedSign).opacity)
  };
});
assert.equal(selectedContextStrength.signFill,.82,'Matching sign sector must retain its native zodiac fill opacity while receiving the Vocab glow.');
assert.equal(selectedContextStrength.houseFill,.5,'Matching house sector must retain its native house fill opacity while receiving the Vocab glow.');
assert.equal(selectedContextStrength.signOpacity,1,'Matching sign sector must remain fully visible.');
assert.equal(selectedContextStrength.houseOpacity,1,'Matching house sector must remain fully visible.');
assert.equal(selectedContextStrength.unrelatedSignOpacity,1,'Unrelated sign sectors must keep native opacity; Vocab context must not dim them.');
assert.equal(await page.locator('#skyFoundationRelationshipList>.sky-foundation-relationship-row:visible').count(),relationshipCountBeforeVocabHover,'Vocab wheel highlighting must not filter the Relationships list.');
await sunMercuryCluster.dispatchEvent('pointerout',{pointerType:'mouse'});
await page.waitForFunction(()=>!document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-vocab-context'));

// Retained/touch-style context must clear on blank Vocab space.
await sunMercuryCluster.evaluate(node=>node.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch',pointerId:77,isPrimary:true})));
await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-vocab-context'));
await page.locator('#skyFoundationA .sky-vocab-placements-heading').dispatchEvent('pointerdown',{pointerType:'touch',pointerId:78,isPrimary:true});
await page.waitForFunction(()=>!document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-vocab-context'));

// Blank wheel space must clear the same retained context without requiring a second Vocab tap.
await sunMercuryCluster.evaluate(node=>node.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch',pointerId:79,isPrimary:true})));
await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-vocab-context'));
const wheelBlank=page.locator('#skyFoundationWheelMount>.sky-foundation-wheel');
await wheelBlank.dispatchEvent('pointerdown',{pointerType:'mouse',clientX:1,clientY:1,button:0});
await page.waitForFunction(()=>!document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-vocab-context'));


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
assert.ok(housePairAlignment&&housePairAlignment.diff<=4,'House Medallion and House name must share the same optical center.');

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

// Global Display choices are the baseline. Clicking one token may add its hidden layers,
// but must not alter what stays visible on neighboring tokens.
await display.click();
await displayMenu.waitFor({state:'visible'});
const glyphToggle=displayMenu.locator('[data-vocab-layer="glyphs"]');
const nameToggle=displayMenu.locator('[data-vocab-layer="names"]');
const referentToggle=displayMenu.locator('[data-vocab-layer="referents"]');
if(await glyphToggle.isChecked())await glyphToggle.uncheck();
if(await nameToggle.isChecked())await nameToggle.uncheck();
if(!(await referentToggle.isChecked()))await referentToggle.check();
await page.keyboard.press('Escape');
await displayMenu.waitFor({state:'hidden'});
const firstToken=page.locator('#skyFoundationA .sky-vocab-token').first();
const secondToken=page.locator('#skyFoundationA .sky-vocab-token').nth(1);
assert.equal(await firstToken.locator('.sky-vocab-referent').count(),1,'Referents-only display must keep the referent visible.');
assert.equal(await firstToken.locator('.sky-vocab-glyph').count(),0,'Referents-only display must initially hide the glyph.');
assert.equal(await firstToken.locator('.sky-vocab-name').count(),0,'Referents-only display must initially hide the name.');
await firstToken.locator('.sky-vocab-referent').click();
assert.equal(await firstToken.locator('.sky-vocab-glyph').count(),1,'First local reveal must add the next hidden layer: glyph.');
assert.equal(await firstToken.locator('.sky-vocab-name').count(),0,'First local reveal must not skip ahead to the name.');
assert.equal(await secondToken.locator('.sky-vocab-glyph').count(),0,'A local reveal must not alter neighboring tokens.');

const structureContextReferentOnly=page.locator('#skyFoundationA [data-vocab-structure] [data-vocab-context-kind="sign"]').first();
assert.equal(await structureContextReferentOnly.locator('.sky-vocab-name').count(),0,'Turning Names off must also remove sign names inside Structures.');
assert.equal(await structureContextReferentOnly.locator('.sky-vocab-referent').count(),1,'Turning Referents on must show the sign referent inside Structures.');

const hiddenGlyphSpacing=await structureContextReferentOnly.evaluate(node=>{
  const referent=node.querySelector('.sky-vocab-referent');
  if(!referent)return null;
  const prev=referent.previousSibling;
  return{
    glyphs:node.querySelectorAll('.sky-vocab-glyph').length,
    previousText:prev?.nodeType===Node.TEXT_NODE?prev.nodeValue:'',
    text:node.textContent
  };
});
assert.equal(hiddenGlyphSpacing.glyphs,0,'Glyphs-off Structure context must contain no glyph host at all.');
assert.equal(/\s{2,}$/.test(hiddenGlyphSpacing.previousText||''),false,'Glyphs-off Structure context must not leave doubled trailing spacing before the referent.');
await firstToken.locator('.sky-vocab-referent').click();
assert.equal(await firstToken.locator('.sky-vocab-name').count(),1,'Second local reveal must add the final hidden layer: name.');
const expandedOrder=await firstToken.evaluate(node=>Array.from(node.querySelectorAll(':scope .sky-vocab-glyph,:scope .sky-vocab-referent,:scope .sky-vocab-name')).map(child=>
  child.classList.contains('sky-vocab-glyph')?'glyph':child.classList.contains('sky-vocab-referent')?'referent':'name'
));
assert.deepEqual(expandedOrder,['glyph','referent','name'],'Expanded Vocab tokens must preserve Glyph → Referent → Name order.');
const parentheticalText=await firstToken.textContent();
assert.match(parentheticalText,/\([^)]*\)/,'Expanded Vocab name must be enclosed in parentheses.');

const parentheticalNameDisplay=await firstToken.locator('.sky-vocab-parenthetical .sky-vocab-name').evaluate(node=>getComputedStyle(node).display);
assert.equal(parentheticalNameDisplay,'inline','The revealed name must remain inline so the opening parenthesis stays attached to its content.');
assert.equal(await firstToken.locator('.sky-vocab-parenthetical .sky-vocab-referent').count(),0,'The referent must not be placed inside the parentheses.');
const visibleOrder=await firstToken.evaluate(node=>Array.from(node.querySelectorAll('.sky-vocab-referent,.sky-vocab-name,.sky-vocab-glyph')).map(child=>child.classList.contains('sky-vocab-referent')?'referent':child.classList.contains('sky-vocab-name')?'name':'glyph'));
assert.deepEqual(visibleOrder,['glyph','referent','name'],'Visible token order must be Glyph, Referent, Name.');
assert.equal(await firstToken.locator(':scope > .sky-vocab-referent').count(),1,'The referent must remain the unparenthesized readable first layer.');

const symbolLabelWrap=await firstToken.locator(':scope > .sky-vocab-symbol-label').evaluate(node=>getComputedStyle(node).whiteSpace);
assert.equal(symbolLabelWrap,'nowrap','Glyph and parenthetical name must behave as one unbreakable inline unit.');

const houseSymbolLabel=page.locator('#skyFoundationA .sky-vocab-token[data-vocab-kind="house"] .sky-vocab-symbol-label').first();
assert.equal(await houseSymbolLabel.evaluate(node=>getComputedStyle(node).whiteSpace),'nowrap','House medallion and parenthetical House name must never split across lines.');
await firstToken.locator('.sky-vocab-referent').click();
assert.equal(await firstToken.locator('.sky-vocab-glyph').count(),0,'After all hidden layers are shown, the next click must return to the global Display baseline.');
assert.equal(await firstToken.locator('.sky-vocab-referent').count(),1,'Returning to baseline must preserve the globally enabled referent.');
await display.click();
await displayMenu.waitFor({state:'visible'});
await displayMenu.locator('[data-vocab-layer-all="A"]').click();
await page.keyboard.press('Escape');
await displayMenu.waitFor({state:'hidden'});

const houseNine=page.locator('#skyFoundationWheelMount [data-interactive="house"][data-sky="A"][data-house="9"]').first();
await houseNine.evaluate(node=>node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,composed:true})));
await page.waitForFunction(()=>document.querySelector('#skyFoundationA [data-vocab-dropdown-summary="houses"]')?.textContent==='House 9');
assert.equal(await page.locator('#skyFoundationA [data-vocab-house="9"]').isChecked(),true,'House 9 must be checked when House 9 is selected on the wheel.');
assert.equal(await page.locator('#skyFoundationA [data-vocab-house="8"]').isChecked(),false,'House 8 must be unchecked when House 9 is selected on the wheel.');
assert.equal(await page.locator('#skyFoundationA [data-vocab-dropdown-summary="placements"]').textContent(),'All','A House wheel click must leave the Placement dimension at All.');
assert.equal(await page.locator('#skyFoundationA [data-vocab-dropdown-summary="signs"]').textContent(),'All','A House wheel click must leave the Zodiac Sign dimension at All.');

const houseNinePlacements=await page.locator('#skyFoundationA .sky-vocab-line:not([data-vocab-structure]) .sky-vocab-token[data-vocab-kind="placement"]').evaluateAll(tokens=>Array.from(new Set(tokens.map(token=>token.dataset.vocabId))));
assert.ok(houseNinePlacements.length>0,'House 9 must retain its own placement statements.');
assert.equal(await page.locator('#skyFoundationA .sky-vocab-token[data-vocab-kind="aspect"]').count(),0,'House filtering must still avoid reopening the raw relationship list.');

const houseNinePolarity=await page.locator('#skyFoundationA [data-vocab-structure="axis-polarity"][data-vocab-axis="mc-ic"]').evaluateAll(lines=>lines.map(line=>
  Array.from(line.querySelectorAll('.sky-vocab-token[data-vocab-kind="placement"]'),token=>token.dataset.vocabId)
));
assert.equal(houseNinePolarity.length,1,'Selecting the MC/Chiron house must preserve the single higher-order MC–IC polarity structure.');
assert.deepEqual(
  new Set(houseNinePolarity[0]),
  new Set(['mc','chiron','ic','uranus']),
  'The preserved meridian polarity must carry the whole MC + Chiron ↔ IC + Uranus structure without reopening unrelated relationships.'
);

const meridianStripe=await meridianStructure.evaluate(node=>({
  enabled:node.dataset.vocabPolarityColors,
  sign:getComputedStyle(node).getPropertyValue('--vocab-polarity-signs').trim(),
  house:getComputedStyle(node).getPropertyValue('--vocab-polarity-houses').trim(),
  system:node.dataset.vocabHouseSystem,
  borderLeft:getComputedStyle(node).borderLeftWidth
}));
assert.equal(meridianStripe.enabled,'true','Primary polarity cards must opt into dual sign/house rails.');
assert.match(meridianStripe.sign,/linear-gradient/i,'Outer primary-polarity rail must encode signs.');
assert.match(meridianStripe.house,/linear-gradient/i,'Inner primary-polarity rail must encode houses.');
assert.equal(meridianStripe.system,'equal-house','Structure rails must record the house system used by the fixture.');
assert.equal(meridianStripe.borderLeft,'0px','Colored structure rails must replace, not sit on top of, the old gray border.');

const signStripe=page.locator('#skyFoundationA [data-vocab-structure="sign-polarity"]').first();
assert.equal(await signStripe.getAttribute('data-vocab-polarity-colors'),'true','Sign polarity cards must use the two-color stripe.');
assert.doesNotMatch(await signStripe.textContent(),/^Sign polarity:/i,'Sign-polarity cards must not repeat their section heading.');

const houseStripe=page.locator('#skyFoundationA [data-vocab-structure="house-polarity"]').first();
assert.equal(await houseStripe.getAttribute('data-vocab-polarity-colors'),'true','House polarity cards must use the two-color stripe.');
assert.doesNotMatch(await houseStripe.textContent(),/^House polarity:/i,'House-polarity cards must not repeat their section heading.');

const concentrationStripe=page.locator('#skyFoundationA [data-vocab-structure="cluster"],#skyFoundationA [data-vocab-structure="stellium"]').first();
if(await concentrationStripe.count()){
  assert.equal(await concentrationStripe.getAttribute('data-vocab-polarity-colors'),null,'Concentrations must not masquerade as two-ended polarity stripes.');
  assert.equal(await concentrationStripe.getAttribute('data-vocab-concentration-colors'),'true','Concentrations must expose sign and house occupancy rails.');
  assert.equal(await concentrationStripe.getAttribute('data-vocab-house-system'),'equal-house','Concentration rails must record the active house system used for their house distribution.');
  const gradients=await concentrationStripe.evaluate(node=>({
    sign:getComputedStyle(node).getPropertyValue('--vocab-concentration-signs').trim(),
    house:getComputedStyle(node).getPropertyValue('--vocab-concentration-houses').trim()
  }));
  assert.match(gradients.sign,/linear-gradient/i,'Concentration sign occupancy must render as a segmented gradient rail.');
  assert.match(gradients.house,/linear-gradient/i,'Concentration house occupancy must render as a segmented gradient rail.');
}
assert.equal(await meridianStructure.locator('[data-vocab-context-kind="sign"]').count(),2,'MC + Chiron and IC + Uranus must each share one sign context instead of repeating it per member.');
assert.equal(await meridianStructure.locator('[data-vocab-context-kind="house"]').count(),2,'MC + Chiron and IC + Uranus must each share one house context instead of repeating it per member.');
assert.equal(await meridianStructure.locator('[data-vocab-structure-context-group]').count(),2,'The meridian polarity fixture must collapse its four members into two shared-location groups.');

const meridianText=(await meridianStructure.textContent()).replace(/\s+/g,' ').trim();
assert.match(meridianText,/are in/i,'A grouped structural pole must read as prose using “are in”.');
assert.match(meridianText,/At one end of the polarity,/,'Primary polarity prose must give the first side an explicit grammatical role.');
assert.match(meridianText,/; at the other,/,'Primary polarity prose must give the second side an equal grammatical role.');
assert.equal(meridianText.includes('form one pole, opposite'),false,'Primary polarity prose must not use the old asymmetric wording.');
assert.match(meridianText,/concerning/i,'Structure house context must be introduced with “concerning” instead of a bare separator.');

const structureTypography=await meridianStructure.evaluate(line=>{
  const refs=Array.from(line.querySelectorAll('.sky-vocab-referent'));
  const connective=line.querySelector('.sky-vocab-structure-member-context');
  const label=line.querySelector('.sky-vocab-structure-label');
  return{
    referents:refs.map(node=>{const s=getComputedStyle(node);return[s.fontSize,s.fontWeight,s.lineHeight,s.color]}),
    connective:connective?(()=>{const s=getComputedStyle(connective);return[s.fontSize,s.fontWeight,s.lineHeight,s.color]})():null,
    label:label?(()=>{const s=getComputedStyle(label);return[s.fontSize,s.fontWeight,s.lineHeight,s.color]})():null
  };
});
assert.ok(structureTypography.referents.length>=4,'Structure typography fixture must expose several referents.');
assert.equal(new Set(structureTypography.referents.map(v=>v.join('|'))).size,1,'Placement, sign, and house referents in Structures must use one typography.');
assert.deepEqual(structureTypography.connective,structureTypography.referents[0],'Connective prose such as “concerning” must use the same body typography as Structure referents.');
assert.deepEqual(structureTypography.label,structureTypography.referents[0],'Structure labels must use exactly the same body typography as the rest of the card.');

const structureSignSize=await meridianStructure.locator('[data-vocab-context-kind="sign"] .sky-vocab-glyph').first().evaluate(node=>({
  width:parseFloat(getComputedStyle(node).width),
  normal:parseFloat(getComputedStyle(document.querySelector('#skyFoundationA .sky-vocab-token[data-vocab-kind="sign"]:not(.sky-vocab-structure-context) .sky-vocab-glyph')).width)
}));
assert.ok(Math.abs(structureSignSize.width-structureSignSize.normal)<=1,'Structure sign glyphs must use the same mark size as ordinary Vocab sign glyphs.');
assert.ok(await meridianStructure.locator('[data-vocab-context-kind="sign"] .sky-vocab-name').filter({hasText:'Gemini'}).count()>=1,'MC/Chiron pole must expose its Gemini context.');
assert.ok(await meridianStructure.locator('[data-vocab-context-kind="sign"] .sky-vocab-name').filter({hasText:'Sagittarius'}).count()>=1,'IC/Uranus pole must expose its Sagittarius context.');
assert.equal(await meridianStructure.locator('[data-vocab-context-kind="house"] .relphi-house-medallion').count(),2,'Grouped structure house context must reuse one canonical House Medallion per shared location.');

await clickBlankComparison();
await page.waitForFunction(()=>document.querySelector('#skyFoundationA [data-vocab-dropdown-summary="houses"]')?.textContent==='All');
assert.equal(await page.locator('#skyFoundationA [data-vocab-dropdown-summary="placements"]').textContent(),'All','Blank space must restore the Vocab Placement filter after a House selection.');
assert.equal(await page.locator('#skyFoundationA [data-vocab-dropdown-summary="signs"]').textContent(),'All','Blank space must restore the Vocab Zodiac filter after a House selection.');
assert.equal(await page.evaluate(()=>window.RelphiSkyVocab?.getWheelFilterSpec?.()??null),null,'Blank space must drop the Vocab wheel-filter selection itself.');
await page.waitForFunction(()=>document.querySelector('[data-house-filter="combined"] input[data-house-choice="a"][data-house-scope="all"][data-house-target="all"]')?.checked===true);

const libra=page.locator('#skyFoundationWheelMount [data-interactive="sign"][data-sign="6"]').first();
await libra.evaluate(node=>node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,composed:true})));
await page.waitForFunction(()=>document.querySelector('#skyFoundationA [data-vocab-dropdown-summary="signs"]')?.textContent==='Libra');
assert.equal(await page.locator('#skyFoundationA [data-vocab-sign="6"]').isChecked(),true,'Libra must be checked when the Libra wheel sector is selected.');
assert.equal(await page.locator('#skyFoundationA [data-vocab-sign="5"]').isChecked(),false,'Virgo must be unchecked when the Libra wheel sector is selected.');
assert.equal(await page.locator('#skyFoundationA [data-vocab-dropdown-summary="placements"]').textContent(),'All','A Sign wheel click must leave the Placement dimension at All.');

await clickBlankComparison();
await page.waitForFunction(()=>document.querySelector('#skyFoundationA [data-vocab-dropdown-summary="signs"]')?.textContent==='All');
assert.equal(await page.locator('#skyFoundationA [data-vocab-dropdown-summary="placements"]').textContent(),'All','Blank space must restore Placement after a Zodiac selection.');
assert.equal(await page.locator('#skyFoundationA [data-vocab-dropdown-summary="houses"]').textContent(),'All','Blank space must restore Houses after a Zodiac selection.');

const mercury=page.locator('#skyFoundationWheelMount [data-interactive="placement"][data-sky="A"][data-placement="mercury"]').first();
await mercury.click({force:true});
await page.waitForFunction(()=>/Mercury/i.test(document.querySelector('#skyFoundationA [data-vocab-dropdown-summary="placements"]')?.textContent||''));
assert.equal(await page.locator('#skyFoundationA [data-vocab-dropdown-summary="signs"]').textContent(),'All','A Placement wheel click must not rewrite the Sign filter.');
assert.equal(await page.locator('#skyFoundationA [data-vocab-dropdown-summary="houses"]').textContent(),'All','A Placement wheel click must not rewrite the House filter.');
await clickBlankComparison();
await page.waitForFunction(()=>document.querySelector('#skyFoundationA [data-vocab-dropdown-summary="placements"]')?.textContent==='All');
assert.equal(await page.locator('#skyFoundationA [data-vocab-dropdown-summary="signs"]').textContent(),'All','Blank space must restore Zodiac after a Placement selection.');
assert.equal(await page.locator('#skyFoundationA [data-vocab-dropdown-summary="houses"]').textContent(),'All','Blank space must restore Houses after a Placement selection.');

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
assert.equal(await cuspStellium.count(),1,'Three major bodies crossing Virgo–Libra must be surfaced as one cusp stellium.');
assert.match(await cuspStellium.textContent(),/Stellium · Cusp · Virgo–Libra/i,'A cusp stellium must explicitly name both affected signs without repeating Concentration or Cluster.');
const cuspDistribution=await cuspStellium.getAttribute('data-vocab-sign-distribution');
assert.match(cuspDistribution,/Virgo:\d+\|Libra:\d+/,'Cusp concentration must expose member counts for both signs so stripe lengths follow occupancy.');
const cuspGradient=await cuspStellium.evaluate(node=>getComputedStyle(node).getPropertyValue('--vocab-concentration-signs').trim());
assert.match(cuspGradient,/%/,'Cusp concentration sign rail must encode proportional percentage stops rather than an even split.');

assert.deepEqual(errors,[],'Opening Vocab and driving its filters from the wheel must not produce page errors.');
await browser.close();
console.log('Vocab opens; House, Sign, and Placement wheel selections drive their matching filters; output is one capitalized sentence per line.');
