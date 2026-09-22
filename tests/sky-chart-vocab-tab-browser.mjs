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

const sunLine=page.locator('#skyFoundationA .sky-vocab-line').filter({has:page.locator('.sky-vocab-token[data-vocab-kind="placement"][data-vocab-id="sun"]')}).first();
assert.match(await sunLine.textContent(),/is in/i,'Ordinary placements must use the same “is in” grammar as Ascendant and MC.');

const sunBridge=await sunLine.evaluate(line=>{
  const sign=line.querySelector('.sky-vocab-token[data-vocab-kind="sign"]');
  const previous=sign?.previousSibling;
  return previous?.nodeType===Node.TEXT_NODE?previous.nodeValue:'';
});
assert.match(sunBridge,/is\u00A0in\u00A0$/,'The “is in” bridge must use non-breaking spaces so it cannot be stranded before the sign token.');

const firstHouseBridge=await page.locator('#skyFoundationA .sky-vocab-token[data-vocab-kind="house"]').first().evaluate(token=>{
  const previous=token.previousSibling;
  return previous?.nodeType===Node.TEXT_NODE?previous.nodeValue:'';
});
assert.match(firstHouseBridge,/in\u00A0$/,'The house preposition must be glued to the following medallion/name unit.');
assert.equal(await page.locator('#skyFoundationA .sky-vocab-token[data-vocab-kind="aspect"]').count(),0,'Vocab must not reproduce the raw aspect list already available in Relationships.');
const sunMercuryCluster=page.locator('#skyFoundationA [data-vocab-structure="cluster"][data-vocab-members*="sun"][data-vocab-members*="mercury"]');
assert.equal(await sunMercuryCluster.count(),1,'A natural non-axis Sun–Mercury concentration must be synthesized as one cluster.');

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
const svgGlyphTransform=await page.locator('#skyFoundationA .sky-vocab-glyph.has-svg-glyph').first().evaluate(node=>getComputedStyle(node).transform);
assert.notEqual(svgGlyphTransform,'none','Canonical SVG glyphs must carry their own lowered optical offset instead of sharing the House Medallion lift.');
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
await firstToken.locator('.sky-vocab-referent').click();
assert.equal(await firstToken.locator('.sky-vocab-name').count(),1,'Second local reveal must add the next hidden layer: name.');
const expandedOrder=await firstToken.evaluate(node=>Array.from(node.querySelectorAll(':scope .sky-vocab-glyph,:scope .sky-vocab-name,:scope .sky-vocab-referent')).map(child=>
  child.classList.contains('sky-vocab-glyph')?'glyph':child.classList.contains('sky-vocab-name')?'name':'referent'
));
assert.deepEqual(expandedOrder,['glyph','name','referent'],'Expanded Vocab tokens must preserve glyph → name → referent order.');
const parentheticalText=await firstToken.textContent();
assert.match(parentheticalText,/\([^)]*\)/,'Expanded Vocab name must be enclosed in parentheses.');

const parentheticalNameDisplay=await firstToken.locator('.sky-vocab-parenthetical .sky-vocab-name').evaluate(node=>getComputedStyle(node).display);
assert.equal(parentheticalNameDisplay,'inline','The revealed name must remain inline so the opening parenthesis stays attached to its content.');
assert.equal(await firstToken.locator('.sky-vocab-parenthetical .sky-vocab-referent').count(),0,'The referent must not be placed inside the parentheses.');
assert.equal(await firstToken.locator(':scope > .sky-vocab-referent').count(),1,'The referent must remain the unparenthesized readable layer after the glyph/name.');

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

assert.deepEqual(errors,[],'Opening Vocab and driving its filters from the wheel must not produce page errors.');
await browser.close();
console.log('Vocab opens; House, Sign, and Placement wheel selections drive their matching filters; output is one capitalized sentence per line.');
