import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import path from 'node:path';

const instant='2026-09-19T18:30:00.000Z';
const profile={instant,dateTime:instant,timeZone:'America/Denver',latitude:40.7608,longitude:-111.8910,houseSystem:'whole-sign'};
function sky(name,offset){
  const angles={Sun:170,Moon:279,Mercury:195,Venus:215,Mars:118,
    Jupiter:142,Saturn:13,Uranus:65,Neptune:3,Pluto:303,
    Ascendant:180,Descendant:0,'Medium Coeli':285,'Imum Coeli':105,
    'North Node':328,'South Node':148};
  return{name,houseSystem:'whole-sign',calcProfile:profile,
    houseCusps:Array.from({length:12},(_,i)=>(168+offset+i*30)%360),
    placements:Object.fromEntries(Object.entries(angles).map(([id,longitude])=>[id,{name:id,longitude:(longitude+offset)%360}]))};
}
const browser=await chromium.launch({headless:true});
try{
  for(const [label,width,height] of [['desktop',1280,900],['mobile',390,844]]){
    const context=await browser.newContext({viewport:{width,height}});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',err=>errors.push(err.message));
    await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
    await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
    await page.addInitScript(({a,b})=>{
      localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
      localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
      localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    },{a:sky('A',0),b:sky('B',2)});
    await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy')==='false'&&
      document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row[data-relationship-mode="A-B"]').length>0&&
      document.querySelectorAll('#skyFoundationWheelMount .sky-foundation-aspect-hit').length>2&&
      !!window.RelphiSkyFoundationInteractions?.aspectLineEligible,{timeout:45000});
    const before=await page.evaluate(()=>{
      const lines=[...document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')];
      const eligible=lines.filter(l=>window.RelphiSkyFoundationInteractions.aspectLineEligible(l));
      return{total:lines.length,eligible:eligible.length};
    });
    assert.ok(before.eligible>3,label+': some relationship-backed wheel lines must start interactive');
    console.log(label+' filter UI diagnostics',JSON.stringify(await page.evaluate(()=>({
      hasPanel:!!document.getElementById('skyFoundationRelationships'),
      filters:document.querySelectorAll('.sky-chart-aspect-filter-toggle').length,
      siblings:document.querySelectorAll('[data-aspect-filter="combined"]').length,
      scripts:!!window.RelphiSkyAspectScopeMatrix,
      visibleRows:document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row:not([hidden])').length
    }))),JSON.stringify(errors));
    const button=page.locator('.sky-chart-aspect-filter-toggle').first();
    await button.click();
    const check=page.locator('#skyChartAspectPopover [data-aspect-matrix-scope="A-B"][data-aspect-matrix-aspect="all"]');
    await check.waitFor({state:'visible',timeout:12000});
    await check.uncheck();
    await page.waitForFunction(()=>{
      const rows=[...document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row[data-relationship-mode="A-B"]')];
      return rows.length>0&&rows.every(r=>r.classList.contains('sky-chart-aspect-multiselect-hidden'));
    },null,{timeout:15000});
    const filtered=await page.evaluate(()=>{
      const lines=[...document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')];
      const blocked=lines.filter(l=>l.dataset.relationshipMode==='A-B' || (l.dataset.leftSky==='A'&&l.dataset.rightSky==='B'))
        .filter(l=>l.classList.contains('sky-chart-aspect-multiselect-hidden'));
      const enabled=lines.filter(l=>window.RelphiSkyFoundationInteractions.aspectLineEligible(l));
      return{blocked:blocked.map(l=>({
        eligible:window.RelphiSkyFoundationInteractions.aspectLineEligible(l),
        sourcePointer:getComputedStyle(l).pointerEvents,
        hitPointer:getComputedStyle(l.nextElementSibling).pointerEvents,
        row:!!document.querySelector('#skyFoundationRelationshipList > .sky-foundation-relationship-row[data-relation-index="'+l.dataset.relationIndex+'"]')
      })),enabled:enabled.length};
    });
    console.log(label+' filtered line diagnostics',JSON.stringify({blocked:filtered.blocked.slice(0,12),enabled:filtered.enabled}));
    assert.ok(filtered.blocked.length>0,label+': A↔B filter must exclude actual aspect strokes');
    assert.ok(filtered.blocked.every(x=>!x.eligible&&x.hitPointer==='none'),label+': excluded strokes cannot retain invisible click targets');
    assert.ok(filtered.enabled>0,label+': A↔A remains actionable');
    await button.click();
    const marker=page.locator('#skyFoundationWheelMount [data-layer="placements"] > g[data-sky="A"][data-placement="jupiter"]').first();
    await marker.waitFor();
    await marker.dispatchEvent('click',{button:0});
    await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount svg.sky-foundation-wheel')?.classList.contains('has-isolation'));
    const markedBefore=await page.evaluate(()=>({
      selected:document.querySelectorAll('#skyFoundationWheelMount [data-layer="placements"] > g.is-selected').length,
      colored:document.querySelectorAll('#skyFoundationWheelMount .is-kept').length
    }));
    assert.ok(markedBefore.selected>0,'A deliberate placement selection is retained');
    const blockedLine=page.locator('#skyFoundationWheelMount [data-layer="aspects"] > line.sky-chart-aspect-multiselect-hidden:not(.sky-foundation-aspect-hit)').first();
    await blockedLine.dispatchEvent('click',{button:0});
    const after=await page.evaluate(()=>({
      selected:document.querySelectorAll('#skyFoundationWheelMount [data-layer="placements"] > g.is-selected').length,
      colored:document.querySelectorAll('#skyFoundationWheelMount .is-kept').length,
      active:document.querySelector('#skyFoundationWheelMount svg.sky-foundation-wheel')?.classList.contains('has-isolation')
    }));
    assert.ok(after.active&&after.selected>=markedBefore.selected&&after.colored>0,
      label+': clicking an excluded aspect must not erase a selected placement or grey the wheel');
    const valid=page.locator('#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')
      .filter({visible:true});
    const validIndex=await page.evaluate(()=>{
      const lines=[...document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')];
      return lines.findIndex(l=>window.RelphiSkyFoundationInteractions.aspectLineEligible(l));
    });
    assert.ok(validIndex>=0,label+': there must still be an eligible aspect line');
    const chosen=page.locator('#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)').nth(validIndex);
    const chosenBefore=await chosen.evaluate(l=>({id:l.dataset.relationIndex,scope:l.dataset.relationshipMode,aspect:l.dataset.aspect,eligible:window.RelphiSkyFoundationInteractions.aspectLineEligible(l),pointer:getComputedStyle(l).pointerEvents}));
    assert.ok(chosenBefore.eligible,label+': selected line must pass all filters');
    await chosen.dispatchEvent('click',{button:0});
    console.log(label+' valid wheel line',JSON.stringify(chosenBefore));
    await page.waitForTimeout(180);
    const state=await page.evaluate(()=>({
      enabled:[...document.querySelectorAll('#skyFoundationWheelMount .sky-foundation-aspect.is-selected')].length,
      matched:[...document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row[aria-current="true"]')]
        .filter(r=>!r.hidden&&!r.classList.contains('sky-chart-aspect-multiselect-hidden')).length
    }));
    assert.ok(state.enabled>0,label+': eligible aspect can still be selected');
    assert.ok(state.matched>0,label+': eligible aspect must resolve to its matching Relationships tile');
    await page.screenshot({path:'wheel-filter-and-focus-'+label+'.png',fullPage:true});
    assert.deepEqual(errors,[],label+': no runtime errors');
    console.log(label+' wheel filter acceptance PASS',JSON.stringify({before,filtered,markedBefore,after,state}));
    await context.close();
  }
}finally{await browser.close()}
