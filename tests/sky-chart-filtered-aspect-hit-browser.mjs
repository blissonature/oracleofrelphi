import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
try{
  for(const viewport of [{width:1360,height:900},{width:390,height:844}]){
    const context=await browser.newContext({viewport,hasTouch:viewport.width<500});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/sky-chart.html',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><head></head><body></body></html>'}));
    await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
    // Use a deterministic isolated fixture with the *actual* two production
    // owners. This proves SVG pointer routing, not only visibility attributes.
    await page.evaluate(()=>{
      document.body.replaceChildren();
      document.body.innerHTML=`
        <div id="skyFoundationFocus"><div class="sky-focus-heading-controls"></div></div>
        <section id="skyFoundationRelationships"><div id="skyFoundationRelationshipCount"></div>
          <p id="skyFoundationRelationshipEmpty"></p><div id="skyFoundationRelationshipList">
            <button class="sky-foundation-relationship-row" data-relation-index="1" data-relationship-mode="A-B"
              data-aspect="trine" data-phase-error="0.25"></button>
            <button class="sky-foundation-relationship-row" data-relation-index="2" data-relationship-mode="A-B"
              data-aspect="square" data-phase-error="8"></button>
          </div></section>
        <div id="skyFoundationWheelMount"><svg class="sky-foundation-wheel"
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"
          style="display:block;width:300px;height:300px">
          <g data-layer="aspects">
            <line class="sky-foundation-aspect" data-relation-index="1" data-relationship-mode="A-B"
              data-aspect="trine" data-phase-error="0.25" x1="40" y1="120" x2="260" y2="120"
              stroke="#2468aa" stroke-width="3"/>
            <line class="sky-foundation-aspect" data-relation-index="2" data-relationship-mode="A-B"
              data-aspect="square" data-phase-error="8" x1="40" y1="120" x2="260" y2="120"
              stroke="#e22" stroke-width="3"/>
          </g></svg></div>`;
      window.RelphiHarmonicOrb={
        defaultWindow:2,maxWindow:12,value:2,
        getWindow(){return this.value},
        setWindow(value){this.value=value;window.dispatchEvent(new Event('relphi:sky-harmonic-window-model-changed'))}
      };
      window.__lastPointerTarget=null;
      document.getElementById('skyFoundationWheelMount').addEventListener('pointermove',event=>{
        window.__lastPointerTarget=event.target.dataset.relationIndex||null;
      });
    });
    // Production scripts are loaded from the checkout, not synthetic duplicates.
    await page.addScriptTag({content:readFileSync('sky-chart-selected-relationship-wheel-bridge-v1.js','utf8')});
    await page.addScriptTag({content:readFileSync('sky-chart-orb-control-v1.js','utf8')});
    await page.evaluate(()=>window.dispatchEvent(new Event('relphi:sky-foundation-interactions-ready')));
    await page.waitForFunction(()=>document.querySelectorAll('.sky-foundation-aspect-hit').length===2);
    await page.waitForFunction(()=>{
      const hits=[...document.querySelectorAll('.sky-foundation-aspect-hit')];
      return !hits[0].hidden&&hits[1].hidden&&getComputedStyle(hits[1]).pointerEvents==='none';
    });
    const point=await page.evaluate(()=>{
      const rect=document.querySelector('.sky-foundation-wheel').getBoundingClientRect();
      return{x:rect.left+150,y:rect.top+120};
    });
    async function moveAndInspect(){
      await page.mouse.move(point.x,point.y);
      return page.evaluate(({x,y})=>{
        const node=document.elementFromPoint(x,y);
        const hits=[...document.querySelectorAll('.sky-foundation-aspect-hit')];
        return{
          target:node?.dataset?.relationIndex||null,
          lastMove:window.__lastPointerTarget,
          hits:hits.map(h=>({index:h.dataset.relationIndex,hidden:h.hidden,events:getComputedStyle(h).pointerEvents,display:getComputedStyle(h).display}))
        };
      },point);
    }
    let state=await moveAndInspect();
    assert.equal(state.target,'1','Filtered line must not obstruct the visible coincident line');
    assert.equal(state.lastMove,'1','Mouse hover must reach the visible aspect');
    assert.equal(state.hits[1].events,'none','Hidden envelope cannot catch pointer events');
    await page.evaluate(()=>window.RelphiHarmonicOrb.setWindow(10));
    await page.waitForFunction(()=>[...document.querySelectorAll('.sky-foundation-aspect-hit')].every(h=>!h.hidden));
    state=await moveAndInspect();
    assert.equal(state.target,'2','Re-enabled overlaid aspect becomes interactive');
    await page.evaluate(()=>window.RelphiHarmonicOrb.setWindow(2));
    await page.waitForFunction(()=>document.querySelectorAll('.sky-foundation-aspect-hit')[1].hidden);
    state=await moveAndInspect();
    assert.equal(state.target,'1','Filtering again restores visible-line hover');
    assert.deepEqual(errors,[],'No browser exceptions');
    if(viewport.width<500){
      await page.touchscreen.tap(point.x,point.y);
      const target=await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.dataset.relationIndex||null,point);
      assert.equal(target,'1','Mobile touch hit tests must also bypass filtered envelopes');
    }
    await page.screenshot({path:`aspect-hit-filter-${viewport.width}.png`});
    await context.close();
  }
  console.log('PASS: desktop mouse and mobile touch ignore filtered transparent aspect envelopes; restored filters remain interactive.');
}finally{await browser.close()}
