import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const planetPositions={
 A:{Sun:50,Moon:200,Mercury:80,Venus:170,Mars:260,Jupiter:10,Saturn:350,Uranus:140,Neptune:310,Pluto:20},
 B:{Sun:170,Moon:350,Mercury:320,Venus:230,Mars:110,Jupiter:50,Saturn:140,Uranus:20,Neptune:260,Pluto:290}
};
function sky(slot){
 const asc=slot==='A'?168:185,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
 const placements=Object.fromEntries(Object.entries(planetPositions[slot]).map(([name,longitude])=>[name,{name,longitude}]));
 placements.Ascendant={name:'Ascendant',longitude:asc};
 placements.Descendant={name:'Descendant',longitude:(asc+180)%360};
 placements.Midheaven={name:'Midheaven',longitude:(asc+270)%360};
 placements.IC={name:'IC',longitude:(asc+90)%360};
 return{name:'Venus regression '+slot,houseSystem:'porphyry',houseCusps:cusps,placements,
  calcProfile:{dateTime:'2026-11-14T12:00',instant:'2026-11-14T19:00:00Z',
    timeZone:'America/Denver',latitude:40.7608,longitude:-111.891,
    location:'Salt Lake City, Utah, United States',houseSystem:'porphyry',houseCusps:cusps}};
}
const browser=await chromium.launch({headless:true});
try{
 for(const width of [1280,390]){
  const mobile=width===390;
  const ctx=await browser.newContext({viewport:{width,height:900},isMobile:mobile,hasTouch:mobile});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({
    path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({
    path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    localStorage.setItem('relphiSkyHarmonicWindowV1','4');
    localStorage.removeItem('relphiSkyAspectMatrixV1');
    sessionStorage.removeItem('relphiSkyWhereWhenViewV1');
  },{a:sky('A'),b:sky('B')});
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
  await page.locator('#skyFoundationRoot[aria-busy="false"]').waitFor({timeout:30000});
  await page.waitForFunction(()=>{
    const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
    return wheel?.getAttribute('data-outer-sky')==='B'&&
      document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)').length>5 &&
      !!document.querySelector('#skyFoundationA .sky-foundation-row[data-interactive="placement"][data-placement="venus"]')&&
      !!document.querySelector('#skyFoundationB .sky-foundation-row[data-interactive="placement"][data-placement="venus"]');
  },null,{timeout:25000});
  const wheelState=()=>page.evaluate(()=>{
    const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
    const selection=window.RelphiSkyFoundationInteractions?.captureFocus?.().lockedState||null;
    const lines=[...wheel.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')];
    const exclusions=['sky-chart-filter-hidden','sky-chart-orb-hidden','sky-orb-filter-hidden','sky-chart-multiselect-hidden','sky-chart-aspect-multiselect-hidden','sky-chart-house-multiselect-hidden','sky-chart-sign-filter-hidden','sky-chart-semantic-hidden'];
    const eligible=lines.filter(line=>!line.hidden&&getComputedStyle(line).display!=='none'&&!exclusions.some(c=>line.classList.contains(c)));
    const chosen=selection?.kind==='placement'?eligible.filter(line=>(line.dataset.leftSky===selection.sky&&line.dataset.leftPlacement===selection.value)||(line.dataset.rightSky===selection.sky&&line.dataset.rightPlacement===selection.value)):[];
    const kept=eligible.filter(l=>l.classList.contains('is-kept'));
    return{selection,isolated:wheel.classList.contains('has-isolation'),
      chosen:chosen.length,chosenKept:chosen.filter(l=>l.classList.contains('is-kept')).length,
      unrelatedKept:kept.filter(l=>!chosen.includes(l)).length,eligible:eligible.length,
      ownGlyphKept:!!wheel.querySelector('[data-layer="placements"] > g[data-sky="'+selection?.sky+'"][data-placement="'+selection?.value+'"]')?.classList.contains('is-kept'),
      scopes:[...new Set(chosen.map(l=>l.dataset.relationshipMode))]};
  });
  async function showPlacements(slot){
    const panel=page.locator('#skyFoundation'+slot);
    const tab=panel.locator('[data-ww-action="placements"]');
    if(await tab.count())await tab.click();
    const row=panel.locator('.sky-foundation-row[data-interactive="placement"][data-placement="venus"]');
    await row.waitFor({state:'visible',timeout:15000});
    await row.scrollIntoViewIfNeeded();
    return row;
  }
  async function assertVenusSelected(slot,ruler){
    const panel=page.locator('#skyFoundation'+slot);
    const row=panel.locator('.sky-foundation-row[data-interactive="placement"][data-placement="venus"]');
    assert.equal(await row.getAttribute('aria-expanded'),'true',slot+' Venus tile remains expanded');
    const decan=panel.locator('.sky-placement-expanded[data-placement-detail="venus"] .sky-placement-referent[data-referent-kind="decan"]');
    assert.equal(await decan.count(),1,'One decan block');
    assert.ok((await decan.innerText()).includes('Ruler: '+ruler),slot+' decan must name '+ruler+' from Chaldean rulership');
    const state=await wheelState();
    assert.deepEqual(state.selection,{kind:'placement',sky:slot,value:'venus'},slot+' selection');
    assert.equal(state.isolated,true,slot+' wheel is isolated');
    assert.ok(state.chosen>=3,slot+' Venus has visible relationships: '+JSON.stringify(state));
    assert.equal(state.chosenKept,state.chosen,'Every eligible Venus aspect line remains lit');
    assert.equal(state.unrelatedKept,0,'Unrelated aspect lines must not be lit');
    assert.equal(state.ownGlyphKept,true,'Venus glyph itself stays illuminated');
    assert.ok(state.scopes.includes('A-B'),'Intersky Venus connections remain highlighted');
    assert.ok(state.scopes.includes(slot+'-'+slot),'Intrasky Venus connections remain highlighted');
    console.log('PASS Venus wheel and decan',width,slot,JSON.stringify(state));
  }
  for(const [slot,ruler] of [['A','Mercury'],['B','Venus']]){
    const row=await showPlacements(slot);
    if(mobile)await row.tap();else await row.click();
    await page.waitForTimeout(130);
    await assertVenusSelected(slot,ruler);
    // A second click toggles off BOTH the referents tile and persistent wheel isolation.
    if(mobile)await row.tap();else await row.click();
    await page.waitForTimeout(110);
    const reset=await wheelState();
    assert.equal(reset.selection,null,'Second Venus click clears selected placement');
    assert.equal(await row.getAttribute('aria-expanded'),'false','Second Venus click collapses the referents tile');
    assert.equal(reset.isolated,false,'Second Venus click restores the unisolated comparison wheel');
    console.log('PASS Venus reset',width,slot);
  }
  const a=await showPlacements('A');
  await a.focus();
  await a.press('Enter');
  await assertVenusSelected('A','Mercury');
  const mars=page.locator('#skyFoundationA .sky-foundation-row[data-interactive="placement"][data-placement="mars"]');
  await mars.scrollIntoViewIfNeeded();
  if(mobile)await mars.tap();else await mars.click();
  await page.waitForTimeout(100);
  assert.equal((await wheelState()).selection?.value,'mars','Clicking Mars replaces Venus, without an extra click');
  assert.equal(await mars.getAttribute('aria-expanded'),'true','Mars detail expands');
  assert.equal(await a.getAttribute('aria-expanded'),'false','Venus detail collapses');
  assert.deepEqual(errors,[],'Browser has no uncaught exceptions');
  console.log('PASS placement click / keyboard / replacement',width);
  await ctx.close();
 }
}finally{await browser.close()}
