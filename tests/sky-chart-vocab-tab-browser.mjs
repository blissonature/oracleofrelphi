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
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,'North Node':40.3,'South Node':220.3,Chiron:74.48,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
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

const display=page.locator('#skyFoundationA [data-vocab-dropdown-toggle="layers"]');
await display.click();
const displayMenu=page.locator('[data-vocab-dropdown-menu="layers"][data-vocab-menu-slot="A"]');
await displayMenu.waitFor({state:'visible'});
assert.equal(await displayMenu.locator('.sky-vocab-filter-row').count(),3,'Display matrix must contain Glyphs, Names, and Referents.');
assert.equal(await displayMenu.locator('[data-vocab-layer-all="A"]').count(),1);
assert.equal(await displayMenu.locator('[data-vocab-layer-none="A"]').count(),1);
await display.click();

const placements=page.locator('#skyFoundationA [data-vocab-dropdown-toggle="placements"]');
await placements.click();
const placementMenu=page.locator('[data-vocab-dropdown-menu="placements"][data-vocab-menu-slot="A"]');
await placementMenu.waitFor({state:'visible'});
assert.ok(await placementMenu.locator('[data-vocab-placement]').count()>10,'Placement matrix must expose the chart placements.');
assert.equal(await placementMenu.locator('.sky-chart-placement-list').count(),1,'Vocab Placement must reuse the Relationships Placement list.');
assert.ok(await placementMenu.locator('.sky-chart-placement-list-item-group').count()>=4,'Vocab Placement must use Relationships group rows.');
assert.equal(await placementMenu.locator('[data-vocab-dimension-master="placements"]').count(),1,'Placement list must use the Relationships-style All placements master row.');
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

const mercury=page.locator('#skyFoundationWheelMount [data-interactive="placement"][data-sky="A"][data-placement="mercury"]').first();
await mercury.click();
await page.waitForTimeout(100);
console.log('VOCAB_WHEEL_DEBUG',JSON.stringify(await page.evaluate(()=>({
  selectedMercury:Array.from(document.querySelectorAll('#skyFoundationWheelMount [data-interactive="placement"][data-sky="A"][data-placement="mercury"]')).map(node=>node.classList.contains('is-selected')),
  selectedNodes:Array.from(document.querySelectorAll('#skyFoundationWheelMount .is-selected')).map(node=>({kind:node.dataset.interactive,sky:node.dataset.sky,value:node.dataset.placement||node.dataset.house||node.dataset.sign||node.dataset.relationIndex})),
  vocabWheel:window.RelphiSkyVocab?.getWheelFilters?.(),
  placementSummary:document.querySelector('#skyFoundationA [data-vocab-dropdown-summary="placements"]')?.textContent,
  signSummary:document.querySelector('#skyFoundationA [data-vocab-dropdown-summary="signs"]')?.textContent,
  houseSummary:document.querySelector('#skyFoundationA [data-vocab-dropdown-summary="houses"]')?.textContent
}))));
await page.waitForFunction(()=> {
  const summary=document.querySelector('#skyFoundationA [data-vocab-dropdown-summary="placements"]');
  return /Mercury/i.test(summary?.textContent||'');
});
assert.equal(await page.locator('#skyFoundationA [data-vocab-dropdown-summary="signs"]').textContent(),'All','A placement click must drive Placement without pretending it was a Sign filter.');
assert.equal(await page.locator('#skyFoundationA [data-vocab-dropdown-summary="houses"]').textContent(),'All','A placement click must drive Placement without pretending it was a House filter.');

await mercury.click();
await page.waitForFunction(()=>document.querySelector('#skyFoundationA [data-vocab-dropdown-summary="placements"]')?.textContent==='All');

const libra=page.locator('#skyFoundationWheelMount [data-interactive="sign"][data-sign="6"]').first();
await libra.click();
await page.waitForFunction(()=>document.querySelector('#skyFoundationA [data-vocab-dropdown-summary="signs"]')?.textContent==='Libra');
assert.equal(await page.locator('#skyFoundationA [data-vocab-dropdown-summary="placements"]').textContent(),'All','A Sign wheel click must leave the Placement dimension at All.');
assert.equal(await page.locator('#skyFoundationA [data-vocab-sign="6"]').isChecked(),true,'Libra must be checked when the Libra wheel sector is selected.');
assert.equal(await page.locator('#skyFoundationA [data-vocab-sign="5"]').isChecked(),false,'Virgo must be unchecked when the Libra wheel sector is selected.');

await libra.click();
await page.waitForFunction(()=>document.querySelector('#skyFoundationA [data-vocab-dropdown-summary="signs"]')?.textContent==='All');

const houseNine=page.locator('#skyFoundationWheelMount [data-interactive="house"][data-sky="A"][data-house="9"]').first();
await houseNine.click();
await page.waitForFunction(()=>document.querySelector('#skyFoundationA [data-vocab-dropdown-summary="houses"]')?.textContent==='House 9');
assert.equal(await page.locator('#skyFoundationA [data-vocab-house="9"]').isChecked(),true,'House 9 must be checked when House 9 is selected on the wheel.');
assert.equal(await page.locator('#skyFoundationA [data-vocab-house="8"]').isChecked(),false,'House 8 must be unchecked when House 9 is selected on the wheel.');
assert.equal(await page.locator('#skyFoundationA [data-vocab-dropdown-summary="placements"]').textContent(),'All','A House wheel click must leave the Placement dimension at All.');
assert.equal(await page.locator('#skyFoundationA [data-vocab-dropdown-summary="signs"]').textContent(),'All','A House wheel click must leave the Zodiac Sign dimension at All.');

await houseNine.click();
await page.waitForFunction(()=>document.querySelector('#skyFoundationA [data-vocab-dropdown-summary="houses"]')?.textContent==='All');

assert.deepEqual(errors,[],'Opening Vocab and driving its filters from the wheel must not produce page errors.');
await browser.close();
console.log('Vocab opens; wheel clicks drive their matching filter dimensions; output is one capitalized sentence per line.');
