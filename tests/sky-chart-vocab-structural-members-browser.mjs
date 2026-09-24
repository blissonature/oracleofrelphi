import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function placement(name,longitude){
  const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);
  return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0};
}
function sky(){
  const asc=168.38,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
  const raw={
    Sun:195,Moon:118.42,Mercury:196.5,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,
    Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,
    'North Node':135.4,'South Node':315.4,Chiron:74.48,Lilith:44.23,'Part of Fortune':244.97,Vertex:310.983333
  };
  // This fixture tests Vocab's structure grouping after the chart's normal derived-point
  // pipeline runs. The instant is chosen so the recalculated mean nodes still occupy the
  // intended Vertex/Anti-Vertex poles, while the supplied Vertex remains authoritative.
  return{name:'Structural polarity fixture',houseSystem:'equal-house',houseCusps:cusps,calcProfile:{dateTime:'1980-11-01T00:00',instant:'1980-11-01T00:00:00.000Z',location:'Structural fixture',timeZone:'UTC',houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value)]))};
}

const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:1100,height:900},timezoneId:'America/Denver'});
  const page=await context.newPage();
  page.setDefaultTimeout(15000);
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.route('https://nominatim.openstreetmap.org/**',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
  await page.route('https://api.open-meteo.com/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({timezone:'America/Denver',current:{temperature_2m:20}})}));
  await page.addInitScript(value=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(value));
    localStorage.removeItem('relphiSkyChartB');
    localStorage.removeItem('relphiSkyVocabDisplayV1');
    localStorage.removeItem('relphiSkyVocabScopeFilterV1');
    sessionStorage.removeItem('relphiSkyVocabViewV1');
  },sky());

  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
  await page.locator('#skyFoundationA [data-sky-vocab-view-button="vocab"]').click();
  await page.waitForFunction(()=>!document.querySelector('#skyFoundationA [data-sky-vocab-panel="A"]')?.hidden);

  const vertex=page.locator('#skyFoundationA [data-vocab-structure="axis-polarity"][data-vocab-axis="vertex-anti-vertex"]');
  assert.equal(await vertex.count(),1,'Vertex polarity must render.');
  const members=(await vertex.getAttribute('data-vocab-members')||'').split('|').filter(Boolean);
  assert.ok(members.includes('south-node'),`South Node must attach to Vertex pole: ${JSON.stringify(members)}`);
  assert.ok(members.includes('north-node'),`North Node must attach to Anti-Vertex pole: ${JSON.stringify(members)}`);

  const vocabWindow=page.locator('#skyFoundationA [data-vocab-harmonic-window-input="A"]');
  const relationshipWindow=page.locator('#skyFoundationRelationships [data-harmonic-window-input]');
  assert.equal(await vocabWindow.count(),1,'Vocab must expose one Harmonic Window controller for Sky A.');
  assert.equal(await relationshipWindow.count(),1,'Relationships must retain one Harmonic Window controller.');
  const defaultWindow=await page.evaluate(()=>String(window.RelphiHarmonicOrb.defaultWindow));
  const initialWindows=await page.evaluate(()=>({
    live:String(window.RelphiHarmonicOrb.getWindow()),
    ceiling:String(document.querySelector('[data-orb-candidate-ceiling]')?.value||'')
  }));
  assert.equal(initialWindows.ceiling,String(await page.evaluate(()=>window.RelphiHarmonicOrb.maxWindow)),'The hidden relationship candidate ceiling must remain at the model maximum.');
  assert.equal(initialWindows.live,defaultWindow,'The hidden candidate ceiling must not overwrite the live Harmonic Window.');
  assert.equal(await relationshipWindow.inputValue(),defaultWindow,'Relationships must initialize from the shared Harmonic Window default.');
  assert.equal(await vocabWindow.inputValue(),defaultWindow,'Vocab must initialize from the same shared Harmonic Window default.');

  await relationshipWindow.fill('4');
  await page.waitForFunction(()=>document.documentElement.dataset.skyHarmonicWindow==='4');
  await page.waitForFunction(()=>document.querySelector('#skyFoundationA [data-vocab-harmonic-window-input="A"]')?.value==='4');
  assert.equal(await vocabWindow.inputValue(),'4','Changing Relationships Harmonic Window must update Vocab.');

  await relationshipWindow.press('ArrowUp');
  await page.waitForFunction(()=>document.documentElement.dataset.skyHarmonicWindow==='4.05');
  assert.equal(await relationshipWindow.inputValue(),'4.05','ArrowUp on Relationships must increase the Harmonic Window by 0.05°.');
  assert.equal(await vocabWindow.inputValue(),'4.05','Relationships arrow stepping must mirror into Vocab.');
  await relationshipWindow.press('ArrowDown');
  await page.waitForFunction(()=>document.documentElement.dataset.skyHarmonicWindow==='4');
  assert.equal(await vocabWindow.inputValue(),'4','ArrowDown must restore the shared Harmonic Window by 0.05°.');

  await vocabWindow.press('ArrowDown');
  await page.waitForFunction(()=>document.documentElement.dataset.skyHarmonicWindow==='3.95');
  assert.equal(await relationshipWindow.inputValue(),'3.95','Vocab arrow stepping must mirror into Relationships.');
  await vocabWindow.press('ArrowUp');
  await page.waitForFunction(()=>document.documentElement.dataset.skyHarmonicWindow==='4');
  assert.equal(await relationshipWindow.inputValue(),'4','ArrowUp in Vocab must restore the shared Harmonic Window by 0.05°.');

  await vocabWindow.fill('0');
  await page.waitForFunction(()=>document.documentElement.dataset.skyHarmonicWindow==='0');
  await page.waitForFunction(()=>{
    const row=document.querySelector('#skyFoundationA [data-vocab-structure="axis-polarity"][data-vocab-axis="vertex-anti-vertex"]');
    return row?.dataset.vocabHarmonicWindow==='0';
  });
  const narrowMembers=(await vertex.getAttribute('data-vocab-members')||'').split('|').filter(Boolean);
  assert.equal(narrowMembers.includes('south-node'),false,`South Node must leave the Vertex pole when the shared Harmonic Window narrows to zero: ${JSON.stringify(narrowMembers)}`);
  assert.equal(narrowMembers.includes('north-node'),false,`North Node must leave the Anti-Vertex pole when the shared Harmonic Window narrows to zero: ${JSON.stringify(narrowMembers)}`);
  assert.equal(await relationshipWindow.inputValue(),'0','Changing Vocab Harmonic Window must update Relationships.');

  const relationshipCountStatus=await page.locator('#skyFoundationRelationshipCount').evaluate(node=>({
    text:(node.textContent||'').trim(),
    suffix:getComputedStyle(node,'::after').content
  }));
  assert.match(relationshipCountStatus.text,/^\d+$/,'Relationship header must report the number of relationships matching the current scope.');
  assert.match(relationshipCountStatus.suffix,/matches/,'Relationship count must visibly identify the number as matches.');

  const showMore=page.locator('#skyFoundationRelationshipList [data-harmonic-show-more]');
  await showMore.waitFor({state:'visible'});
  const showMoreText=(await showMore.textContent()||'').trim();
  assert.match(showMoreText,/\d+ more beyond 0° Harmonic Window · Show more/,'Narrow Harmonic Window must end with an actionable continuation item.');
  await showMore.click();
  const maxWindow=await page.evaluate(()=>String(window.RelphiHarmonicOrb.maxWindow));
  await page.waitForFunction(value=>document.documentElement.dataset.skyHarmonicWindow===value,maxWindow);
  assert.equal(await relationshipWindow.inputValue(),maxWindow,'Show more must widen the shared Harmonic Window immediately.');
  assert.equal(await vocabWindow.inputValue(),maxWindow,'Show more must mirror the widened Harmonic Window into Vocab.');
  await showMore.waitFor({state:'hidden'});

  await vocabWindow.fill(defaultWindow);
  await page.waitForFunction(value=>document.documentElement.dataset.skyHarmonicWindow===value,defaultWindow);
  await page.waitForFunction(value=>{
    const row=document.querySelector('#skyFoundationA [data-vocab-structure="axis-polarity"][data-vocab-axis="vertex-anti-vertex"]');
    return row?.dataset.vocabHarmonicWindow===value;
  },defaultWindow);
  const restoredMembers=(await vertex.getAttribute('data-vocab-members')||'').split('|').filter(Boolean);
  assert.ok(restoredMembers.includes('south-node'),`South Node must return when the shared Harmonic Window is restored: ${JSON.stringify(restoredMembers)}`);
  assert.ok(restoredMembers.includes('north-node'),`North Node must return when the shared Harmonic Window is restored: ${JSON.stringify(restoredMembers)}`);

  // Dispatch from the structure row itself so the test exercises row context rather
  // than accidentally landing on one of the many child tokens at the row's center.
  await vertex.dispatchEvent('pointerover',{pointerType:'mouse'});
  await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-vocab-axis-context'));
  const states=await page.evaluate(()=>Object.fromEntries(['vertex','anti-vertex','north-node','south-node'].map(id=>{
    const node=document.querySelector(`#skyFoundationWheelMount [data-focus-piece="placement"][data-sky="A"][data-placement="${id}"]`);
    return[id,{exists:!!node,kept:node?.classList.contains('is-vocab-context')||false,opacity:node?Number(getComputedStyle(node).opacity):null}];
  })));
  for(const id of ['vertex','anti-vertex','north-node','south-node']){
    assert.equal(states[id].exists,true,`${id} must exist on the wheel: ${JSON.stringify(states)}`);
    assert.equal(states[id].kept,true,`${id} must remain in active Vertex polarity context: ${JSON.stringify(states)}`);
    assert.equal(states[id].opacity,1,`${id} must remain fully emphasized: ${JSON.stringify(states)}`);
  }
  const sectorStyle=await page.evaluate(()=>{
    const sign=document.querySelector('#skyFoundationWheelMount .sky-foundation-sign-sector.is-vocab-context');
    const house=document.querySelector('#skyFoundationWheelMount .sky-foundation-house-sector.is-vocab-context');
    const s=sign?getComputedStyle(sign):null,h=house?getComputedStyle(house):null;
    return{
      sign:sign?{fillOpacity:Number(s.fillOpacity),filter:s.filter,opacity:Number(s.opacity)}:null,
      house:house?{fillOpacity:Number(h.fillOpacity),filter:h.filter,opacity:Number(h.opacity)}:null
    };
  });
  assert.ok(sectorStyle.sign&&sectorStyle.house,`Active polarity must expose sign and house sectors: ${JSON.stringify(sectorStyle)}`);
  assert.equal(sectorStyle.sign.fillOpacity,.82,`Structure highlight must retain native zodiac fill opacity: ${JSON.stringify(sectorStyle)}`);
  assert.equal(sectorStyle.house.fillOpacity,.5,`Structure highlight must retain native house fill opacity: ${JSON.stringify(sectorStyle)}`);
  assert.notEqual(sectorStyle.sign.filter,'none',`Structure sign must receive a subtle glow: ${JSON.stringify(sectorStyle)}`);
  assert.notEqual(sectorStyle.house.filter,'none',`Structure house must receive a subtle glow: ${JSON.stringify(sectorStyle)}`);
  const untouched=await page.evaluate(()=>({
    placement:Number(getComputedStyle(document.querySelector('#skyFoundationWheelMount [data-focus-piece="placement"][data-sky="A"][data-placement="moon"]:not(.is-vocab-context)')).opacity),
    sign:Number(getComputedStyle(document.querySelector('#skyFoundationWheelMount .sky-foundation-sign-sector:not(.is-vocab-context)')).opacity)
  }));
  assert.deepEqual(untouched,{placement:1,sign:1},`Structure highlight must not dim unrelated wheel content: ${JSON.stringify(untouched)}`);
  const tokenKinds={};
  for(const kind of ['placement','sign','house']){
    const token=vertex.locator(`.sky-vocab-token[data-vocab-kind="${kind}"]`).first();
    assert.equal(await token.count(),1,`Vertex polarity must expose a ${kind} token`);
    await token.hover();
    await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-vocab-token-context'));
    tokenKinds[kind]=await page.evaluate(()=>{
      const wheel=document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel');
      const visiblePlacement=wheel?.querySelector('[data-focus-piece="placement"]:not(.is-vocab-token-context)');
      return{
        rowContext:wheel?.classList.contains('has-vocab-context')||false,
        axisMode:wheel?.classList.contains('has-vocab-axis-context')||false,
        tokenPlacements:wheel?.querySelectorAll('[data-focus-piece="placement"].is-vocab-token-context').length||0,
        tokenSigns:wheel?.querySelectorAll('.sky-foundation-sign-sector.is-vocab-token-context').length||0,
        tokenHouses:wheel?.querySelectorAll('.sky-foundation-house-sector.is-vocab-token-context').length||0,
        unrelatedPlacementOpacity:visiblePlacement?Number(getComputedStyle(visiblePlacement).opacity):null
      };
    });
  }
  assert.deepEqual(tokenKinds.placement,{rowContext:false,axisMode:false,tokenPlacements:1,tokenSigns:0,tokenHouses:0,unrelatedPlacementOpacity:1},`Placement token hover must add only placement highlight with no dimming: ${JSON.stringify(tokenKinds)}`);
  assert.deepEqual(tokenKinds.sign,{rowContext:false,axisMode:false,tokenPlacements:0,tokenSigns:1,tokenHouses:0,unrelatedPlacementOpacity:1},`Sign token hover must add only sign highlight with no dimming: ${JSON.stringify(tokenKinds)}`);
  assert.deepEqual(tokenKinds.house,{rowContext:false,axisMode:false,tokenPlacements:0,tokenSigns:0,tokenHouses:1,unrelatedPlacementOpacity:1},`House token hover must add only house highlight with no dimming: ${JSON.stringify(tokenKinds)}`);

  const placementLevel=vertex.locator('.sky-vocab-token[data-vocab-kind="placement"]').first().locator('[data-vocab-level]').first();
  await placementLevel.click();
  await page.locator('#skyFoundationA .sky-vocab-structures-heading').hover();
  const pinnedPlacement=await page.evaluate(()=>({
    rowContext:document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-vocab-context')||false,
    token:document.querySelectorAll('#skyFoundationWheelMount [data-focus-piece].is-vocab-token-context').length,
    unrelatedOpacity:Number(getComputedStyle(document.querySelector('#skyFoundationWheelMount [data-focus-piece="placement"]:not(.is-vocab-token-context)')).opacity)
  }));
  assert.equal(pinnedPlacement.rowContext,false,`Pinned token must not restore structure whiteout: ${JSON.stringify(pinnedPlacement)}`);
  assert.ok(pinnedPlacement.token>=1&&pinnedPlacement.unrelatedOpacity===1,`Pinned token must highlight without dimming anything else: ${JSON.stringify(pinnedPlacement)}`);

  console.log('Structural polarity member regression passed:',JSON.stringify({states,tokenKinds,pinnedPlacement}));
}finally{
  await browser.close();
}
