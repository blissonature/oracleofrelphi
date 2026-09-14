const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const base = process.env.RELPHI_TEST_URL || 'http://127.0.0.1:8000/tarot.html?board=workflow-v2#tarot';
const out = path.resolve(__dirname,'..','test-results');
fs.mkdirSync(out,{recursive:true});
let browser;

async function waitReady(page) {
  await page.waitForSelector('#relphiOpenDrawingBoardCurrent',{timeout:20000});
  await page.waitForFunction(() => !!window.RelphiDrawingBoardSpreadPrefabs && !!window.RelphiDrawingBoardPrefabsBridge && !!window.RelphiDrawingBoardOptionsBridge,{timeout:20000});
}
async function openBoard(page) {
  const panel=page.locator('#shortListPanel');
  if (!(await panel.isVisible())) await page.click('#relphiOpenDrawingBoardCurrent');
  await panel.waitFor({state:'visible'});
  await page.waitForSelector('#shortListPanel #zoomCardRowExtents',{timeout:10000});
}
async function applyCeltic(page) {
  await page.click('#drawingBoardOptionsButton');
  await page.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open #relphiSpreadTemplateSelect',{state:'visible'});
  await page.selectOption('#relphiSpreadTemplateSelect','celtic-cross-10');
  await page.click('#relphiApplyOptions');
  await page.waitForFunction(() => window.RelphiDrawingBoardPrefabsBridge?.getState?.()?.activeLayout?.id === 'celtic-cross-10');
  await page.click('#zoomCardRowExtents');
  await page.waitForTimeout(120);
}
async function boardState(page) {
  return page.evaluate(() => ({
    prefab:window.RelphiDrawingBoardPrefabsBridge?.getState?.(),
    snap:window.RelphiDrawingBoardOptionsBridge?.capture?.()
  }));
}
async function assertContained(page) {
  const result=await page.evaluate(() => {
    const root=document.querySelector('#shortListPanel');
    const workspace=root?.querySelector('.card-row-workspace');
    const toolbar=root?.querySelector('.card-row-workspace-toolbar');
    if (!workspace) return {ok:false,reason:'no workspace'};
    const w=workspace.getBoundingClientRect();
    const t=toolbar?.getBoundingClientRect();
    const failures=[];
    root.querySelectorAll('.card-row-board>.card-row-item').forEach((item,index)=>{
      const face=item.querySelector('.card-row-card-wrap,.card-row-drop-card');
      const label=item.querySelector('.card-row-position-panel');
      [face,label].filter(Boolean).forEach((node,nodeIndex)=>{
        const r=node.getBoundingClientRect();
        if (r.left < w.left-3 || r.right > w.right+3 || r.top < w.top-3 || r.bottom > w.bottom+3) failures.push({index,node:nodeIndex?'label':'face',rect:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},workspace:{left:w.left,right:w.right,top:w.top,bottom:w.bottom}});
        if (t && r.left < t.right && r.right > t.left && r.top < t.bottom && r.bottom > t.top) failures.push({index,node:nodeIndex?'label':'face',reason:'toolbar-overlap'});
      });
    });
    return {ok:failures.length===0,failures};
  });
  assert.equal(result.ok,true,JSON.stringify(result.failures));
}

(async()=>{
  browser=await chromium.launch({headless:true});

  const mobile=await browser.newPage({viewport:{width:390,height:844}});
  const mobileErrors=[];
  mobile.on('pageerror',error=>mobileErrors.push(String(error)));
  await mobile.goto(base,{waitUntil:'domcontentloaded'});
  await waitReady(mobile);
  await openBoard(mobile);
  assert.equal(await mobile.locator('#zoomCardRowExtents').count(),1);
  assert.equal(await mobile.locator('.relphi-tool-trigger[data-tool="snaps"]').count(),1);
  assert.equal(await mobile.locator('.relphi-tool-trigger[data-tool="background"]').count(),1);
  const bg=await mobile.locator('.card-row-workspace').evaluate(node=>getComputedStyle(node).backgroundColor);
  assert.notEqual(bg,'rgba(0, 0, 0, 0)');

  await applyCeltic(mobile);
  let state=await boardState(mobile);
  assert.equal(state.prefab.slotCount,10);
  assert.equal(state.snap.rowCardTransforms['1']?.rotation ?? state.snap.rowCardTransforms[1]?.rotation,0);
  const p0=state.snap.rowEnvelopeLayout['0'] || state.snap.rowEnvelopeLayout[0];
  const p1=state.snap.rowEnvelopeLayout['1'] || state.snap.rowEnvelopeLayout[1];
  assert.ok(p1.x > p0.x + 100,'crossing card should begin to the right of covering card');
  const ys=[6,7,8,9].map(i=>(state.snap.rowEnvelopeLayout[String(i)]||state.snap.rowEnvelopeLayout[i]).y);
  for(let i=1;i<ys.length;i++) assert.ok(Math.abs(ys[i]-ys[i-1])>=200,'Celtic staff spacing should remain readable');
  await assertContained(mobile);
  await mobile.screenshot({path:path.join(out,'drawing-board-mobile-celtic-before.png'),fullPage:true});

  await mobile.click('#drawRandomRowCard');
  await mobile.waitForSelector('.card-row-item[data-row-index="0"] [data-row-card]',{state:'visible'});
  if (await mobile.locator('.relphi-focus-reader').count()) await mobile.click('.relphi-focus-close');
  await mobile.locator('.card-row-item[data-row-index="0"]>.card-row-card-wrap').click();
  await mobile.waitForSelector('.relphi-focus-reader',{state:'visible'});
  assert.equal(await mobile.locator('.relphi-focus-strip>button').count(),10);
  const infoVisible=await mobile.locator('.relphi-focus-card-host .or-card-layer.relphi-info-layer').evaluate(node=>{
    const s=getComputedStyle(node); return s.visibility==='visible' && Number(s.opacity)>.9;
  });
  assert.equal(infoVisible,true);
  await mobile.click('.relphi-focus-close');

  await mobile.click('#drawRandomRowCard');
  await mobile.waitForSelector('.card-row-item[data-row-index="1"] [data-row-card]',{state:'visible'});
  if (await mobile.locator('.relphi-focus-reader').count()) await mobile.click('.relphi-focus-close');
  await mobile.locator('.card-row-item[data-row-index="1"]>.card-row-card-wrap').click();
  await mobile.waitForSelector('.relphi-focus-reader',{state:'visible'});
  await mobile.click('.relphi-focus-next');
  await mobile.waitForFunction(() => window.RelphiDrawingBoardOptionsBridge?.capture?.()?.rowPositionMeta?.[1]?.celticCrossAcknowledged === true);
  state=await boardState(mobile);
  const crossed0=state.snap.rowEnvelopeLayout['0']||state.snap.rowEnvelopeLayout[0];
  const crossed1=state.snap.rowEnvelopeLayout['1']||state.snap.rowEnvelopeLayout[1];
  assert.equal(Math.round(crossed1.x),Math.round(crossed0.x));
  assert.equal(Math.round(crossed1.y),Math.round(crossed0.y));
  assert.equal(state.snap.rowCardTransforms['1']?.rotation ?? state.snap.rowCardTransforms[1]?.rotation,90);
  assert.equal(await mobile.locator('#shortListPanel.relphi-celtic-crossed').count(),1);
  await mobile.screenshot({path:path.join(out,'drawing-board-mobile-celtic-crossed.png'),fullPage:true});
  if (await mobile.locator('.relphi-focus-reader').count()) await mobile.click('.relphi-focus-close');

  await mobile.click('#drawingBoardOptionsButton');
  await mobile.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open',{state:'visible'});
  await mobile.click('#relphiResetBoard');
  await mobile.waitForFunction(() => {
    const state=window.RelphiDrawingBoardPrefabsBridge?.getState?.();
    return state && !state.activeLayout && state.slotCount===0 && state.hasCards===false;
  });
  await mobile.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open',{state:'visible'});
  await mobile.waitForTimeout(100);
  assert.equal(await mobile.locator('.relphi-reading-options-drawer.is-reading-options-open').count(),1);
  await mobile.screenshot({path:path.join(out,'drawing-board-mobile-reset-options.png'),fullPage:true});
  assert.deepEqual(mobileErrors,[]);

  const desktop=await browser.newPage({viewport:{width:1440,height:1000}});
  const desktopErrors=[];
  desktop.on('pageerror',error=>desktopErrors.push(String(error)));
  await desktop.goto(base,{waitUntil:'domcontentloaded'});
  await waitReady(desktop);
  await openBoard(desktop);
  await applyCeltic(desktop);
  await assertContained(desktop);
  await desktop.screenshot({path:path.join(out,'drawing-board-desktop-celtic.png'),fullPage:true});
  assert.deepEqual(desktopErrors,[]);
  console.log('Drawing Board browser acceptance checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();});