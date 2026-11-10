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

  // The shared Focus header owns the single Harmonic Window control.
  // Vocab responds to that model and does not duplicate the control.
  const relationshipWindow=page.locator('#skyFoundationFocus [data-harmonic-window-input]');
  assert.equal(await relationshipWindow.count(),1,'Focus must expose one shared Harmonic Window controller.');
  assert.equal(await page.locator('#skyFoundationA [data-vocab-harmonic-window-input]').count(),0,'Vocab must not duplicate the shared Harmonic Window control.');
  const defaultWindow=await page.evaluate(()=>String(window.RelphiHarmonicOrb.defaultWindow));
  const initialWindows=await page.evaluate(()=>({
    live:String(window.RelphiHarmonicOrb.getWindow()),
    ceiling:String(document.querySelector('[data-orb-candidate-ceiling]')?.value||'')
  }));
  assert.equal(initialWindows.ceiling,String(await page.evaluate(()=>window.RelphiHarmonicOrb.maxWindow)),'Candidate ceiling remains maximum.');
  assert.equal(initialWindows.live,defaultWindow,'Candidate ceiling must not overwrite live window.');
  assert.equal(await relationshipWindow.inputValue(),defaultWindow);

  await relationshipWindow.fill('4');
  await page.waitForFunction(()=>document.documentElement.dataset.skyHarmonicWindow==='4');
  await relationshipWindow.press('ArrowUp');
  await page.waitForFunction(()=>document.documentElement.dataset.skyHarmonicWindow==='4.05');
  await relationshipWindow.press('ArrowDown');
  await page.waitForFunction(()=>document.documentElement.dataset.skyHarmonicWindow==='4');

  await relationshipWindow.fill('0');
  await page.waitForFunction(()=>document.documentElement.dataset.skyHarmonicWindow==='0');
  await page.waitForFunction(()=>{
    const row=document.querySelector('#skyFoundationA [data-vocab-structure="axis-polarity"][data-vocab-axis="vertex-anti-vertex"]');
    return row?.dataset.vocabHarmonicWindow==='0';
  });
  const narrowMembers=(await vertex.getAttribute('data-vocab-members')||'').split('|').filter(Boolean);
  assert.equal(narrowMembers.includes('south-node'),false,'Narrowing Focus must remove South Node from Vertex pole.');
  assert.equal(narrowMembers.includes('north-node'),false,'Narrowing Focus must remove North Node from Anti-Vertex pole.');
  assert.equal(await relationshipWindow.inputValue(),'0');

  const relationshipCountStatus=await page.locator('#skyFoundationRelationshipCount').evaluate(node=>({
    matchCount:node.dataset.matchCount||'',
    visibleNumber:getComputedStyle(node,'::after').content.replace(/["']/g,''),
    suffix:getComputedStyle(node,'::after').content
  }));
  assert.match(relationshipCountStatus.matchCount,/^\d+$/,'Relationship header must retain a stable matching-count state.');
  assert.equal(relationshipCountStatus.visibleNumber,relationshipCountStatus.matchCount+' matches','Visible relationship count must render N matches from stable match state.');
  assert.match(relationshipCountStatus.suffix,/matches/,'Relationship count must visibly identify the number as matches.');

  const showMore=page.locator('#skyFoundationRelationshipList [data-harmonic-show-more]');
  await showMore.waitFor({state:'visible'});
  const showMoreText=(await showMore.textContent()||'').trim();
  assert.match(showMoreText,/\d+ more beyond 0° · Increase to 1°/,'Narrow Harmonic Window must offer its next increment.');
  await showMore.click();
  await page.waitForFunction(()=>document.documentElement.dataset.skyHarmonicWindow==='1');
  assert.equal(await relationshipWindow.inputValue(),'1','The continuation widens the shared Harmonic Window one degree.');
  assert.equal(await page.locator('#skyFoundationA [data-vocab-harmonic-window-input]').count(),0,'Vocab must continue using the shared Focus Harmonic Window.');
  await page.waitForFunction(()=>{const node=document.querySelector('#skyFoundationRelationshipList [data-harmonic-show-more]');return !node||node.hidden||node.textContent.includes('more beyond 1°')});

  await relationshipWindow.fill(defaultWindow);
  await page.waitForFunction(value=>document.documentElement.dataset.skyHarmonicWindow===value,defaultWindow);
  await page.waitForFunction(value=>{
    const row=document.querySelector('#skyFoundationA [data-vocab-structure="axis-polarity"][data-vocab-axis="vertex-anti-vertex"]');
    return row?.dataset.vocabHarmonicWindow===value;
  },defaultWindow);
  const restoredMembers=(await vertex.getAttribute('data-vocab-members')||'').split('|').filter(Boolean);
  assert.ok(restoredMembers.includes('south-node'),`South Node must return when the shared Harmonic Window is restored: ${JSON.stringify(restoredMembers)}`);
  assert.ok(restoredMembers.includes('north-node'),`North Node must return when the shared Harmonic Window is restored: ${JSON.stringify(restoredMembers)}`);

  const structureGroup=vertex.locator('xpath=ancestor::details[contains(@class,"sky-vocab-group")]').first();
  if(await structureGroup.count()&&await structureGroup.getAttribute('open')===null){
    await structureGroup.locator(':scope > summary').click();
  }
  // Move the real pointer away from the previous filter/result target first.
  // Only then exercise the actual structure row, without aiming at its child tokens.
  await page.mouse.move(2,2);
  await page.waitForFunction(()=>!document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-isolation'));
  await vertex.dispatchEvent('pointerover',{pointerType:'mouse'});
  console.log('VOCAB_WHEEL_CONTEXT_DIAGNOSTIC',JSON.stringify(await page.evaluate(()=>({wheel:document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.className?.baseVal,clickedNode:document.querySelector('#skyFoundationA [data-vocab-axis="vertex-anti-vertex"]')?.className,context:document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.dataset.vocabIsolation,focus:window.RelphiSkyFoundationInteractions?.captureFocus?.()}))));
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
  assert.equal(sectorStyle.sign.filter,'none',`Structure sign must preserve the canonical sector treatment without a duplicate glow: ${JSON.stringify(sectorStyle)}`);
  assert.equal(sectorStyle.house.filter,'none',`Structure house must preserve the canonical sector treatment without a duplicate glow: ${JSON.stringify(sectorStyle)}`);
  const untouched=await page.evaluate(()=>({
    placement:Number(getComputedStyle(document.querySelector('#skyFoundationWheelMount [data-focus-piece="placement"][data-sky="A"][data-placement="moon"]:not(.is-vocab-context)')).opacity),
    sign:Number(getComputedStyle(document.querySelector('#skyFoundationWheelMount .sky-foundation-sign-sector:not(.is-vocab-context)')).opacity)
  }));
  assert.ok(untouched.placement<1&&untouched.sign<1,`Native wheel isolation must dim unrelated sectors without hiding them: ${JSON.stringify(untouched)}`);
  // The Vocab tokens now delegate to the canonical foundation focus owner.
  // There must be no second Vocab-only highlight/brightness or selection state.
  const tokenKinds={};
  for(const kind of ['placement','sign','house']){
    const token=vertex.locator('.sky-vocab-token[data-vocab-kind="'+kind+'"]').first();
    assert.equal(await token.count(),1,'Vertex polarity must expose a '+kind+' token');
    await token.hover();
    await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-isolation'));
    tokenKinds[kind]=await page.evaluate(kind=>{
      const wheel=document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel');
      const token=document.querySelector('#skyFoundationA [data-vocab-axis="vertex-anti-vertex"] .sky-vocab-token.is-wheel-token-active[data-vocab-kind="'+kind+'"]');
      const focused=wheel?.querySelectorAll('[data-focus-piece="'+kind+'"].is-kept').length||0;
      const dim=wheel?.querySelector('[data-focus-piece="placement"]:not(.is-kept)');
      return{isolated:wheel?.classList.contains('has-isolation')||false,
        active:!!token,focused,
        noParallelAxis:!wheel?.classList.contains('has-vocab-axis-context'),
        otherOpacity:dim?Number(getComputedStyle(dim).opacity):null};
    },kind);
    assert.equal(tokenKinds[kind].active,true,'The '+kind+' token is the active external focus target.');
    assert.equal(tokenKinds[kind].isolated,true,'The '+kind+' token shares foundation wheel isolation.');
    assert.ok(tokenKinds[kind].focused>=1,'The '+kind+' target is retained on the wheel.');
    assert.equal(tokenKinds[kind].noParallelAxis,true,'Token focus must not leave the old line focus active.');
    assert.ok(tokenKinds[kind].otherOpacity<1,'Unrelated placements dim using canonical focus.');
  }

  const placementLevel=vertex.locator('.sky-vocab-token[data-vocab-kind="placement"]').first().locator('[data-vocab-level]').first();
  await placementLevel.click();
  await page.locator('#skyFoundationA .sky-vocab-structures-heading').hover();
  const pinnedPlacement=await page.evaluate(()=>({
    focus:window.RelphiSkyFoundationInteractions?.captureFocus?.(),
    wheelIsolated:document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-isolation')||false,
    selected:document.querySelectorAll('#skyFoundationWheelMount [data-focus-piece="placement"].is-selected').length
  }));
  assert.equal(pinnedPlacement.focus?.lockedState?.kind,'placement','Pinned placement must use the canonical focus state.');
  assert.equal(pinnedPlacement.wheelIsolated,true,'Pinned placement remains visibly isolated.');
  assert.ok(pinnedPlacement.selected>=1,'Pinned placement must stay selected when pointer leaves Vocab.');
  console.log('Structural polarity member regression passed:',JSON.stringify({states,tokenKinds,pinnedPlacement}));
}finally{
  await browser.close();
}
