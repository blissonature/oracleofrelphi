import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0}};
function sample(name,offset,profile){
  const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,index)=>(asc+index*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Midheaven:76.28};
  return{name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{...profile,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))};
}
const skyA=sample('Alpha sky',0,{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Malden, Massachusetts, United States',locationQuery:'Malden, MA',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662});
const skyB=sample('Beta sky',29.27,{dateTime:'2026-09-09T21:00',instant:'2026-09-10T03:00:00.000Z',location:'Salt Lake City, Utah, United States',locationQuery:'Salt Lake City, UT',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891});

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b));localStorage.setItem('relphiSkyChartLastModeV1','comparison')},{a:skyA,b:skyB});
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
await page.waitForSelector('#skyFoundationRelationshipList .sky-foundation-relationship-row',{timeout:20000});
await page.waitForSelector('#skyChartAspectPopover .sky-chart-configuration-section',{state:'attached',timeout:10000});
await page.waitForSelector('#skyFoundationRelationships .sky-relationship-heading-actions #skyFoundationRelationshipCount',{timeout:10000});
await page.waitForTimeout(500);

const configurationUI=await page.evaluate(()=>{
  const section=document.querySelector('#skyChartAspectPopover .sky-chart-configuration-section');
  const labels=[...section.querySelectorAll('.sky-chart-configuration-name')].map(node=>node.textContent.trim());
  const api=window.RelphiAspectConfigurations;
  return{section:!!section,labels,typeCount:api?.types?.length||0};
});
assert.equal(configurationUI.section,true,'Configurations must remain mounted inside the Aspects popover.');
assert.equal(configurationUI.typeCount,10,'All ten configuration types must remain available.');
assert.ok(configurationUI.labels.includes('Grand Trine'),'Grand Trine must remain in Configurations.');
assert.ok(configurationUI.labels.includes('Grand Cross / Grand Square'),'Grand Cross / Grand Square must remain in Configurations.');
assert.equal(await page.locator('#skyChartAspectPopover .sky-chart-configuration-results').count(),0,'Detected configuration results do not belong inside the Aspects menu.');
assert.equal(await page.locator('#skyChartAspectPopover [data-configuration-pattern]').count(),0,'The Aspects menu must contain configuration controls only, never result buttons.');

for(const category of ['major','minor','harmonic']){
  const row=page.locator('#skyChartAspectPopover [data-aspect-category="'+category+'"]');
  assert.equal(await row.count(),1,category+' must have its own category master row.');
  assert.equal(await row.locator('[data-aspect-matrix-scope="all"]').count(),1,category+' must support All scopes.');
  assert.equal(await row.locator('[data-aspect-matrix-scope="A-A"]').count(),1,category+' must support A↔A.');
  assert.equal(await row.locator('[data-aspect-matrix-scope="B-B"]').count(),1,category+' must support B↔B.');
  assert.equal(await row.locator('[data-aspect-matrix-scope="A-B"]').count(),1,category+' must support A↔B.');
}
const majorAA=page.locator('#skyChartAspectPopover [data-aspect-category="major"] [data-aspect-matrix-scope="A-A"]');
await majorAA.uncheck();
assert.equal(await page.locator('#skyChartAspectPopover [data-aspect-matrix-row="trine"] [data-aspect-matrix-scope="A-A"]').isChecked(),false,'Major A↔A must drive its individual aspect checkboxes.');
assert.equal(await page.locator('#skyChartAspectPopover [data-aspect-matrix-row="trine"] [data-aspect-matrix-scope="B-B"]').isChecked(),true,'Major A↔A must not alter B↔B.');
await majorAA.check();

const grandTrineConfig=page.locator('#skyChartAspectPopover [data-configuration-row="grand-trine"]');
assert.equal(await grandTrineConfig.locator('[data-configuration-scope="all"]').count(),1,'Configurations must support All scopes.');
assert.equal(await grandTrineConfig.locator('[data-configuration-scope="A-A"]').count(),1,'Configurations must support A↔A.');
assert.equal(await grandTrineConfig.locator('[data-configuration-scope="B-B"]').count(),1,'Configurations must support B↔B.');
assert.equal(await grandTrineConfig.locator('[data-configuration-scope="A-B"]').count(),1,'Configurations must support A↔B.');
const configAA=grandTrineConfig.locator('[data-configuration-scope="A-A"]');
await configAA.check();
assert.ok((await page.evaluate(()=>window.RelphiAspectConfigurations?.matrix?.()['A-A']||[])).includes('grand-trine'),'A↔A configuration selection must be represented in the configuration matrix.');
assert.equal((await page.evaluate(()=>window.RelphiAspectConfigurations?.matrix?.()['B-B']||[])).includes('grand-trine'),false,'A↔A configuration selection must not select B↔B.');
await configAA.uncheck();

await page.waitForSelector('#skyFoundationFocus [data-relationship-display-control]',{timeout:10000});
await page.waitForSelector('#skyFoundationFocus [data-harmonic-window-input]',{timeout:10000});
const focusControlOrder=await page.evaluate(()=>{
  const controls=document.querySelector('#skyFoundationFocus .sky-focus-heading-controls');
  const children=[...controls.children];
  const display=controls.querySelector(':scope>[data-relationship-display-control]');
  const harmonic=controls.querySelector(':scope>[data-orb-field="true"]');
  const actions=controls.querySelector(':scope>.sky-export-wheel-slot');
  const index=node=>children.indexOf(node);
  return{display:index(display),harmonic:index(harmonic),actions:index(actions)};
});
assert.ok(focusControlOrder.display>=0,'Display must stay in the Focus heading controls.');
assert.ok(focusControlOrder.harmonic>focusControlOrder.display,'Harmonic Window must sit to the right of Display.');
assert.ok(focusControlOrder.actions>focusControlOrder.harmonic,'Copy and Download must remain to the far right of Harmonic Window.');
const focusHeaderGap=await page.evaluate(()=>{
  const title=document.querySelector('#skyFoundationFocus>.sky-foundation-focus-heading h2')?.getBoundingClientRect();
  const first=document.querySelector('#skyFoundationFocus .sky-focus-heading-controls>[data-relationship-display-control]')?.getBoundingClientRect();
  return title&&first?first.left-title.right:null;
});
assert.ok(focusHeaderGap!==null&&focusHeaderGap>=98,'Focus needs a 100px visual break between its header and first control.');

await page.locator('#skyFoundationFocus [data-relationship-display-value]').click();
await page.waitForSelector('#skyRelationshipDisplayPopover:not([hidden])',{timeout:5000});
const displayChecks=page.locator('#skyRelationshipDisplayPopover [data-shared-display-layer]');
assert.equal(await displayChecks.count(),3,'Display must expose three individual layer checkboxes.');
await page.locator('#skyRelationshipDisplayPopover .sky-relationship-display-actions button',{hasText:'None'}).click();
assert.equal(await displayChecks.evaluateAll(inputs=>inputs.every(input=>!input.checked)),true,'Display None must clear every individual layer checkbox immediately.');
await page.locator('#skyRelationshipDisplayPopover .sky-relationship-display-actions button',{hasText:'All'}).click();
assert.equal(await displayChecks.evaluateAll(inputs=>inputs.every(input=>input.checked)),true,'Display All must check every individual layer checkbox immediately.');
await page.keyboard.press('Escape');

const relationshipHeaderOrder=await page.evaluate(()=>{
  const actions=document.querySelector('#skyFoundationRelationships .sky-relationship-heading-actions');
  const children=[...actions.children];
  const index=node=>children.indexOf(node);
  const sort=actions.querySelector('.sky-relationship-sort-control');
  const limit=actions.querySelector('.sky-relationship-limit-control');
  const count=actions.querySelector('#skyFoundationRelationshipCount');
  const copy=actions.querySelector('.sky-relationship-copy-button');
  const download=actions.querySelector('#skyChartRelationshipsExport');
  return{
    sort:index(sort),limit:index(limit),count:index(count),copy:index(copy),download:index(download),
    countParent:count?.parentElement===actions
  };
});
const relationshipHeaderGap=await page.evaluate(()=>{
  const heading=document.querySelector('#skyFoundationRelationships>.sky-foundation-relationships-heading');
  const title=heading?.querySelector('[data-relationship-vocab-tabs],h2:not([hidden])')?.getBoundingClientRect();
  const first=heading?.querySelector('.sky-relationship-heading-actions>[data-relationship-sort],.sky-relationship-heading-actions>.sky-relationship-sort-control')?.getBoundingClientRect();
  return title&&first?first.left-title.right:null;
});
assert.ok(relationshipHeaderGap!==null&&relationshipHeaderGap>=98,'Relationships needs a 100px visual break between its header and first control.');
assert.equal(relationshipHeaderOrder.countParent,true,'Match count must live on the Relationships action line, not between the header and controls.');
assert.ok(relationshipHeaderOrder.sort>=0&&relationshipHeaderOrder.limit>relationshipHeaderOrder.sort,'Sort must precede Max.');
assert.ok(relationshipHeaderOrder.count>relationshipHeaderOrder.limit,'Match count must come after the controls.');
assert.ok(relationshipHeaderOrder.copy>relationshipHeaderOrder.count,'Copy pill must come after the match count.');
assert.ok(relationshipHeaderOrder.download>relationshipHeaderOrder.copy,'Download pill must follow Copy.');
const rightCluster=await page.evaluate(()=>{
  const actions=document.querySelector('#skyFoundationRelationships .sky-relationship-heading-actions');
  const max=actions?.querySelector('.sky-relationship-limit-control')?.getBoundingClientRect();
  const count=actions?.querySelector('#skyFoundationRelationshipCount')?.getBoundingClientRect();
  const copy=actions?.querySelector('.sky-relationship-copy-button')?.getBoundingClientRect();
  const download=actions?.querySelector('#skyChartRelationshipsExport')?.getBoundingClientRect();
  const ar=actions?.getBoundingClientRect();
  return{
    maxToCount:max&&count?count.left-max.right:null,
    countToCopy:count&&copy?copy.left-count.right:null,
    copyToDownload:copy&&download?download.left-copy.right:null,
    rightGap:download&&ar?ar.right-download.right:null
  };
});
assert.ok(rightCluster.maxToCount!==null&&rightCluster.maxToCount>=18,'The match count must break away from Sort/Max into the right-aligned action cluster.');
assert.ok(rightCluster.countToCopy!==null&&rightCluster.countToCopy<=9,'The match count must sit directly beside Copy.');
assert.ok(rightCluster.copyToDownload!==null&&rightCluster.copyToDownload<=9,'Copy and Download must remain a compact pair.');
assert.ok(rightCluster.rightGap!==null&&rightCluster.rightGap<=2,'Matches, Copy, and Download must terminate at the far-right edge of the Relationships action line.');

assert.equal(await page.locator('#skyFoundationRelationships .sky-relationship-sort-control>span').count(),0,'Sort must not restore a visible Sort header.');
assert.equal(await page.locator('#skyFoundationRelationships .sky-relationship-limit-control>span').count(),0,'Max must not restore a visible Max header.');

const maxSelect=page.locator('#skyFoundationRelationships [data-relationship-limit]');
await maxSelect.evaluate(select=>{window.__relphiMaxOpenIdentity={select,parent:select.parentElement,control:select.closest('.sky-relationship-limit-control'),next:select.closest('.sky-relationship-limit-control')?.nextElementSibling}});
await maxSelect.click();
await page.keyboard.press('Escape');
await page.waitForTimeout(80);
const maxStable=await maxSelect.evaluate(select=>{
  const before=window.__relphiMaxOpenIdentity||{};
  return{
    sameSelect:select===before.select,
    sameParent:select.parentElement===before.parent,
    sameControl:select.closest('.sky-relationship-limit-control')===before.control,
    sameNext:select.closest('.sky-relationship-limit-control')?.nextElementSibling===before.next,
    nextId:select.closest('.sky-relationship-limit-control')?.nextElementSibling?.id||''
  };
});
assert.equal(maxStable.sameSelect,true,'Opening Max must keep the same native select node.');
assert.equal(maxStable.sameParent,true,'Opening Max must not reparent the native select.');
assert.equal(maxStable.sameControl,true,'Opening Max must not replace its control wrapper.');
assert.equal(maxStable.sameNext,true,'Opening Max must not trigger header reordering that closes the native dropdown.');
assert.equal(maxStable.nextId,'skyFoundationRelationshipCount','Max must stay immediately before the match count.');
await maxSelect.selectOption('20');
await page.waitForFunction(()=>document.documentElement.dataset.skyRelationshipLimit==='20');
assert.equal(await maxSelect.inputValue(),'20','Max must remain functional after opening.');
await maxSelect.selectOption('all');
await page.waitForFunction(()=>document.documentElement.dataset.skyRelationshipLimit==='all');

const audit=await page.evaluate(()=>{
  const rows=[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]')];
  const lines=[...document.querySelectorAll('[data-layer="aspects"]>line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')];
  const visible=node=>{
    const s=getComputedStyle(node);
    return !node.hidden&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&s.stroke!=='rgba(0, 0, 0, 0)'&&s.stroke!=='transparent';
  };
  const identity=node=>{
    const mode=String(node.dataset.relationshipMode||'A-B').toUpperCase();
    const leftSky=node.dataset.leftSky||(mode==='B-B'?'B':'A');
    const rightSky=node.dataset.rightSky||(mode==='A-A'?'A':'B');
    let left=String(node.dataset.leftPlacement||'');
    let right=String(node.dataset.rightPlacement||'');
    if(leftSky===rightSky)[left,right]=[left,right].sort();
    return `${leftSky}:${left}|${node.dataset.aspect}|${rightSky}:${right}`;
  };
  const visibleRows=rows.filter(visible);
  const visibleLines=lines.filter(visible);
  const visibleLineIds=new Set(visibleLines.map(identity));
  return {
    totalRows:rows.length,
    visibleRows:visibleRows.length,
    totalLines:lines.length,
    indexedLines:lines.filter(line=>line.dataset.relationIndex).length,
    visibleLines:visibleLines.length,
    sampleLines:lines.slice(0,12).map(line=>({id:identity(line),index:line.dataset.relationIndex||'',hidden:line.hidden,display:getComputedStyle(line).display,opacity:getComputedStyle(line).opacity,stroke:getComputedStyle(line).stroke,classes:line.getAttribute('class')})),
    missingVisibleRowLines:visibleRows.map(identity).filter(id=>!visibleLineIds.has(id)).slice(0,20),
    htmlVisibleRows:document.documentElement.dataset.skyVisibleRelationshipRows||'',
    htmlVisibleLines:document.documentElement.dataset.skyVisibleRelationshipLines||''
  };
});
console.log('ASPECT_LINE_AUDIT',JSON.stringify(audit));
assert.ok(audit.visibleRows>0,'Fixture must produce visible relationship rows.');
assert.equal(audit.indexedLines,audit.totalLines,'Every rendered aspect line must retain a relationship address.');
assert.equal(audit.visibleLines,audit.visibleRows,'Visible relationship rows and wheel aspect lines must stay in one-to-one visibility parity.');
assert.ok(audit.missingVisibleRowLines.length===0,`Every visible relationship row needs a visible wheel line; missing ${audit.missingVisibleRowLines.join(', ')}`);

// Relationship-list hover owns only the row/line highlight. It must never dim or isolate the wheel,
// including A↔A and B↔B rows generated after the comparison relationships.
const intraskyRow=page.locator('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relationship-mode="B-B"]:visible, #skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relationship-mode="A-A"]:visible').first();
assert.ok(await intraskyRow.count()>0,'Fixture must produce at least one visible intrasky relationship row.');
await intraskyRow.hover();
const rowHoverIsolationSamples=await page.evaluate(async()=>{
  const samples=[];
  for(let frame=0;frame<24;frame+=1){
    await new Promise(resolve=>requestAnimationFrame(resolve));
    samples.push(document.querySelector('.sky-foundation-wheel')?.classList.contains('has-isolation')||false);
  }
  return samples;
});
assert.equal(rowHoverIsolationSamples.some(Boolean),false,'Relationship-row hover must keep the wheel fully illuminated on every sampled frame.');
assert.equal(await intraskyRow.evaluate(row=>row.classList.contains('is-row-hovered')),true,'Hovered relationship row should retain its row-highlight state.');
assert.ok(await page.locator('.sky-foundation-aspect.is-row-hovered:not(.sky-foundation-aspect-hit)').count()>0,'Relationship-row hover should highlight its matching wheel line.');

// A screen-capture overlay can take pointer ownership away from the browser with no
// relatedTarget. That handoff must freeze the visible hover instead of repainting the chart.
await intraskyRow.dispatchEvent('pointerout',{pointerType:'mouse',relatedTarget:null});
await page.waitForTimeout(50);
assert.equal(await intraskyRow.evaluate(row=>row.classList.contains('is-row-hovered')),true,'External pointer handoff must preserve the relationship tile hover for screenshots.');
assert.ok(await page.locator('.sky-foundation-aspect.is-row-hovered:not(.sky-foundation-aspect-hit)').count()>0,'External pointer handoff must preserve the matching wheel line for screenshots.');

await page.locator('.sky-foundation-relationships-heading h2').hover();
await page.waitForTimeout(50);
assert.equal(await page.locator('.sky-foundation-wheel').evaluate(wheel=>wheel.classList.contains('has-isolation')),false);
assert.equal(await page.locator('.sky-foundation-aspect.is-row-hovered:not(.sky-foundation-aspect-hit)').count(),0);

await page.screenshot({path:'sky-chart-aspect-line-visibility.png',fullPage:true});
assert.deepEqual(errors,[]);
await browser.close();
console.log('Sky Chart visible relationship rows have visible wheel aspect lines, and row hover never owns isolation.');
