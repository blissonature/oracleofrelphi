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
    !!document.querySelector('#showAllCards'),{timeout:30000});
  await page.locator('#showAllCards').click();
  for (let i=0; i<2; i++) {
    const add=page.locator('[data-shortlist][aria-pressed="false"]').first();
    await add.waitFor({state:'visible'});
    await add.click();
  }
  await page.locator('#relphiOpenDrawingBoardCurrent').click();
  await page.locator('#shortListPanel .card-row-board>.card-row-item[data-row-index="1"] [data-row-card]').waitFor({state:'visible'});
  await page.waitForFunction(() => document.querySelector('#shortListPanel')?.classList.contains('relphi-board-ready'));
  await page.waitForTimeout(200);
}

async function exercise(page,label) {
  const panel=page.locator('#shortListPanel');
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
  assert.equal(await first.evaluate(el=>getComputedStyle(el).opacity),'0',label+': first handles hidden');
  assert.equal(await second.evaluate(el=>getComputedStyle(el).opacity),'1',label+': second handles shown');

  const before=await snap(page);
  const scaleHandle=page.locator('.card-row-item[data-row-index="1"] [data-row-transform-handle="scale"][data-corner="se"]');
  assert.equal(await scaleHandle.evaluate(el=>getComputedStyle(el).touchAction),'none',
    label+': touch gestures cannot be swallowed by board pan');
  const scaleBox=await scaleHandle.boundingBox();
  assert.ok(scaleBox,label+': scale handle has a visible hit area');
  const x=scaleBox.x+scaleBox.width/2, y=scaleBox.y+scaleBox.height/2;
  await page.mouse.move(x,y);
  await page.mouse.down();
  await page.mouse.move(x+65,y+65,{steps:10});
  await page.mouse.up();
  const afterScale=await snap(page);
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
  await page.mouse.move(sx,sy);
  await page.mouse.down();
  await page.mouse.move(rx,ry,{steps:10});
  await page.mouse.up();
  const afterRotate=await snap(page);
  assert.ok(Math.abs(transform(afterRotate,1).rotation-transform(afterScale,1).rotation)>5,
    label+': second card must rotate independently');
  assert.equal(transform(afterRotate,0).rotation||0,transform(afterScale,0).rotation||0,
    label+': first card rotation must remain unchanged');

  windowScreenshot=path.join(out,'drawing-board-transform-'+label+'.png');
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
      try{
        await ready(page);
        await exercise(page,test.name);
      }finally{await context.close();}
    }
    console.log('Transform ownership desktop/mobile Chromium regression passed.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
