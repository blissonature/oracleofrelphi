// Regression: two cards must share one native transform target, not competing render owners.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');

const url = process.env.RELPHI_TEST_URL || 'http://127.0.0.1:8000/tarot.html?board=workflow-v2#tarot';
const out = path.resolve('test-results');
fs.mkdirSync(out,{recursive:true});
const snap = page => page.evaluate(() => window.RelphiDrawingBoardOptionsBridge?.capture?.());
const transform = (snapshot,index) => snapshot.rowCardTransforms?.[index] || {scale:1,rotation:0,zIndex:1};
const target = page => page.evaluate(() => window.RelphiDrawingBoardPrefabsBridge?.getState?.()?.transformTarget);

async function ready(page) {
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => window.RelphiDrawingBoardOptionsBridge?.capture &&
    window.RelphiDrawingBoardPrefabsBridge?.selectTransformTarget &&
    !!window.__relphiDrawingBoardUnifiedV3,null,{timeout:30000});
  // Seed the two actual native cards through the documented board-state bridge.
  // Do not open Browse / Show All Cards: its full Ledger rendering can dominate
  // Chromium's main thread and obscure transform ownership regressions.
  await page.evaluate(() => {
    const bridge=window.RelphiDrawingBoardOptionsBridge;
    const snapshot=bridge.capture();
    snapshot.shortList=['ace_of_wands','ace_of_cups'];
    snapshot.rowCardManual=[true,true];
    snapshot.shortListSelection=[];
    snapshot.rowActiveLayout=null;
    snapshot.rowPositionMeta=[];
    snapshot.rowEnvelopeLayout={0:{x:0,y:0},1:{x:195,y:0}};
    snapshot.rowCardTransforms={0:{scale:1,rotation:0,zIndex:1},1:{scale:1,rotation:0,zIndex:2}};
    snapshot.rowTransformTarget=0;
    snapshot.rowLayoutLocked=true;
    snapshot.rowLayoutDesignMode=false;
    snapshot.cardRowBoardOpen=true;
    bridge.restore(snapshot);
  });
  const trigger=page.locator('#relphiOpenDrawingBoardCurrent');
  if ((await trigger.getAttribute('aria-expanded'))!=='true') await trigger.click();
  await page.locator('#shortListPanel .card-row-board>.card-row-item[data-row-index="1"] [data-row-card]').waitFor({state:'visible',timeout:20000});
  await page.waitForFunction(() => document.querySelector('#shortListPanel')?.classList.contains('relphi-board-ready'),null,{timeout:20000});
  // Opening the board deliberately smooth-scrolls the page. Wait for that
  // animation before measuring a 13px handle for pointer hit testing.
  await page.waitForTimeout(1000);
  console.log('ready:',page.url(),await page.evaluate(() => ({count:document.querySelectorAll('#shortListPanel .card-row-item').length,controls:document.querySelector('#shortListPanel')?.className})));
}

async function exercise(page,label) {
  const panel=page.locator('#shortListPanel');
  console.log('exercise:',label,page.url(),await panel.count());
  assert.equal(await panel.evaluate(el=>el.classList.contains('relphi-transform-editing-unlocked')),true,
    label+': Free-mode controls should be enabled');
  assert.equal(await target(page),0,label+': initial card should be selected');

  const card=page.locator('#shortListPanel .card-row-item[data-row-index="1"] .card-row-card-wrap');
  await card.click({position:{x:50,y:95},force:true});
  assert.equal(await target(page),1,label+': first click on another card must select it');
  assert.equal(await page.locator('#shortListPanel .card-row-item.is-transform-target').count(),1,
    label+': exactly one card can own handles');
  assert.equal(await page.locator('#shortListPanel .card-row-item[data-row-index="1"].is-transform-target').count(),1);
  assert.equal(await page.locator('.relphi-focus-reader').count(),0,
    label+': selecting another transform target must not force Card Focus');

  const first=page.locator('.card-row-item[data-row-index="0"] .card-row-transform-box');
  const second=page.locator('.card-row-item[data-row-index="1"] .card-row-transform-box');
  // CSS intentionally fades the handles; inspect them after the transition.
  await page.waitForFunction(() => {
    const boxes=Array.from(document.querySelectorAll('#shortListPanel .card-row-item .card-row-transform-box'));
    return boxes.length===2 && Number(getComputedStyle(boxes[0]).opacity)<.01 &&
      Number(getComputedStyle(boxes[1]).opacity)>.99;
  },null,{timeout:5000});
  assert.ok(Number(await first.evaluate(el=>getComputedStyle(el).opacity))<.01,label+': first handles hidden');
  assert.ok(Number(await second.evaluate(el=>getComputedStyle(el).opacity))>.99,label+': second handles shown');

  const before=await snap(page);
  const scaleHandle=page.locator('.card-row-item[data-row-index="1"] [data-row-transform-handle="scale"][data-corner="se"]');
  assert.equal(await scaleHandle.evaluate(el=>getComputedStyle(el).touchAction),'none',
    label+': touch gestures cannot be swallowed by board pan');
  const scaleBox=await scaleHandle.boundingBox();
  assert.ok(scaleBox,label+': scale handle has a visible hit area');
  const x=scaleBox.x+scaleBox.width/2, y=scaleBox.y+scaleBox.height/2;
  console.log(label+': scale hit:',await page.evaluate(([x,y])=>{
    const el=document.elementFromPoint(x,y);
    const h=document.querySelector('.card-row-item[data-row-index="1"] [data-row-transform-handle="scale"][data-corner="se"]');
    const item=h?.closest('.card-row-item');
    return {x,y,tag:el?.tagName,classes:el?.getAttribute('class'),target:el?.getAttribute('data-row-transform-handle'),withinHandle:el===h||h?.contains(el),itemClass:item?.className,box:getComputedStyle(h).pointerEvents,rect:h?.getBoundingClientRect().toJSON(),itemRect:item?.getBoundingClientRect().toJSON(),scrollY:window.scrollY,docHeight:document.documentElement.scrollHeight};
  },[x,y]));
  await page.evaluate(() => {
    window.__relphiTransformTrace=[];
    const h=document.querySelector('.card-row-item[data-row-index="1"] [data-row-transform-handle="scale"][data-corner="se"]');
    h?.addEventListener('pointerdown',ev=>window.__relphiTransformTrace.push({kind:'handle-down',pointerId:ev.pointerId,target:ev.target.className,defaultPrevented:ev.defaultPrevented}),true);
    window.addEventListener('pointerdown',ev=>window.__relphiTransformTrace.push({kind:'window-down',pointerId:ev.pointerId,target:ev.target.className}),true);
    window.addEventListener('pointermove',ev=>{
      const t=window.RelphiDrawingBoardOptionsBridge?.capture?.()?.rowCardTransforms?.[1];
      window.__relphiTransformTrace.push({kind:'move',pointerId:ev.pointerId,scale:t?.scale,rotation:t?.rotation});
    },true);
    window.addEventListener('pointerup',ev=>window.__relphiTransformTrace.push({kind:'up',pointerId:ev.pointerId}),true);
  });
  await page.mouse.move(x,y);
  console.log(label+': hit after hover:',await page.evaluate(([x,y])=>{
    const h=document.querySelector('.card-row-item[data-row-index="1"] [data-row-transform-handle="scale"][data-corner="se"]');
    const item=h?.closest('.card-row-item'), el=document.elementFromPoint(x,y);
    return {actual:el?.getAttribute('class'),expected:h?.getAttribute('class'),hit:el===h,handleRect:h?.getBoundingClientRect().toJSON(),itemRect:item?.getBoundingClientRect().toJSON(),scrollY:window.scrollY,docHeight:document.documentElement.scrollHeight};
  },[x,y]));
  await page.mouse.down();
  await page.mouse.move(x+22,y+22,{steps:10});
  await page.mouse.up();
  const afterScale=await snap(page);
  console.log(label+': trace',JSON.stringify(await page.evaluate(()=>window.__relphiTransformTrace)));
  console.log(label+': after scale',JSON.stringify({before:transform(before,1),after:transform(afterScale,1)}));
  assert.ok(Math.abs(transform(afterScale,1).scale-transform(before,1).scale)>.02,
    label+': mouse drag should change second card scale');
  assert.ok(Math.abs(transform(afterScale,0).scale-transform(before,0).scale)<.001,
    label+': scale of first card must remain untouched');

  // Rotate the same card on its own handle.
  const rotateHandle=page.locator('.card-row-item[data-row-index="1"] [data-row-transform-handle="rotate"]');
  const item=page.locator('.card-row-item[data-row-index="1"]');
  const handleBox=await rotateHandle.boundingBox(), itemBox=await item.boundingBox();
  assert.ok(handleBox&&itemBox,label+': rotate handle has a visible hit area');
  const cx=itemBox.x+itemBox.width/2,cy=itemBox.y+itemBox.height/2;
  const sx=handleBox.x+handleBox.width/2,sy=handleBox.y+handleBox.height/2;
  const angle=Math.PI/4,dx=sx-cx,dy=sy-cy;
  const rx=cx+dx*Math.cos(angle)-dy*Math.sin(angle),ry=cy+dx*Math.sin(angle)+dy*Math.cos(angle);
  console.log(label+': rotate prehit:',await page.evaluate(([x,y])=>{
    const el=document.elementFromPoint(x,y);
    const h=document.querySelector('.card-row-item[data-row-index="1"] [data-row-transform-handle="rotate"]');
    return {x,y,hit:el===h,actual:el?.className,handle:h?.getBoundingClientRect().toJSON(),scrollY:window.scrollY};
  },[sx,sy]));
  await page.mouse.move(sx,sy);
  console.log(label+': rotate hoverhit:',await page.evaluate(([x,y])=>{
    const el=document.elementFromPoint(x,y);
    const h=document.querySelector('.card-row-item[data-row-index="1"] [data-row-transform-handle="rotate"]');
    return {x,y,hit:el===h,actual:el?.className,handle:h?.getBoundingClientRect().toJSON(),scrollY:window.scrollY};
  },[sx,sy]));
  await page.mouse.down();
  await page.mouse.move(rx,ry,{steps:10});
  await page.mouse.up();
  const afterRotate=await snap(page);
  console.log(label+': rotate result',JSON.stringify({before:transform(afterScale,1),after:transform(afterRotate,1),events:await page.evaluate(()=>window.__relphiTransformTrace?.slice(-18))}));
  assert.ok(Math.abs(transform(afterRotate,1).rotation-transform(afterScale,1).rotation)>5,
    label+': second card must rotate independently');
  assert.equal(transform(afterRotate,0).rotation||0,transform(afterScale,0).rotation||0,
    label+': first card rotation must remain unchanged');

  const windowScreenshot=path.join(out,'drawing-board-transform-'+label+'.png');
  await page.screenshot({path:windowScreenshot,fullPage:true});
  await page.evaluate(() => window.RelphiDrawingBoardPrefabsBridge.refresh());
  const afterRerender=await snap(page);
  assert.ok(Math.abs(transform(afterRerender,1).scale-transform(afterRotate,1).scale)<.001,
    label+': scale must persist through a full native and workflow rerender');
  assert.ok(Math.abs(transform(afterRerender,1).rotation-transform(afterRotate,1).rotation)<.001,
    label+': rotation must persist through a full rerender');
  assert.equal(await target(page),1,label+': rerender must preserve selected target');

  await page.locator('.card-row-item[data-row-index="1"] .card-row-card-wrap').click({position:{x:50,y:95},force:true});
  await page.locator('.relphi-focus-reader').waitFor({state:'visible'});
  await page.locator('.relphi-focus-close').click();
  assert.equal(await target(page),1,label+': Card Focus must not take ownership of transforms');
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    for (const test of [
      {name:'desktop',viewport:{width:1280,height:900},hasTouch:false},
      {name:'mobile',viewport:{width:390,height:844},hasTouch:true}
    ]){
      const context=await browser.newContext({viewport:test.viewport,hasTouch:test.hasTouch});
      await context.addInitScript(()=>{
        localStorage.removeItem('relphiDrawingBoardSessionV1');
        localStorage.setItem('relphiBoardCardControlsFreeV1','true');
        localStorage.setItem('relphiBoardTransformLocksV1',JSON.stringify({drag:true,rotation:true,scale:true}));
      });
      const page=await context.newPage();
      page.on('framenavigated',frame=>{if(frame===page.mainFrame())console.log('navigation:',test.name,frame.url());});
      page.on('pageerror',error=>console.log('pageerror:',test.name,String(error)));
      try{
        await ready(page);
        await exercise(page,test.name);
      }finally{await context.close();}
    }
    console.log('Transform ownership desktop/mobile Chromium regression passed.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
