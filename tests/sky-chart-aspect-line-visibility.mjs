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
assert.equal(relationshipHeaderOrder.countParent,true,'Match count must live on the Relationships action line, not between the header and controls.');
assert.ok(relationshipHeaderOrder.sort>=0&&relationshipHeaderOrder.limit>relationshipHeaderOrder.sort,'Sort must precede Max.');
assert.ok(relationshipHeaderOrder.count>relationshipHeaderOrder.limit,'Match count must come after the controls.');
assert.ok(relationshipHeaderOrder.copy>relationshipHeaderOrder.count,'Copy pill must come after the match count.');
assert.ok(relationshipHeaderOrder.download>relationshipHeaderOrder.copy,'Download pill must follow Copy.');

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
