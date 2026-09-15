const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const base = process.env.RELPHI_TEST_URL || 'http://127.0.0.1:8000/tarot.html?board=workflow-v2#tarot';
const out = path.resolve(__dirname,'..','test-results');
fs.mkdirSync(out,{recursive:true});

async function openBoard(page){
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#relphiOpenDrawingBoardCurrent',{timeout:20000});
  await page.waitForFunction(() => !!window.RelphiDrawingBoardSpreadPrefabs && !!window.RelphiDrawingBoardPrefabsBridge && !!window.RelphiDrawingBoardOptionsBridge,{timeout:20000});
  if (!(await page.locator('#shortListPanel').isVisible())) await page.click('#relphiOpenDrawingBoardCurrent');
  await page.waitForSelector('#shortListPanel .card-row-workspace-toolbar.relphi-board-controller',{state:'visible'});
}

async function applyTemplate(page,id){
  await page.click('#drawingBoardOptionsButton');
  await page.waitForSelector('#relphiSpreadTemplateSelect',{state:'visible'});
  await page.selectOption('#relphiSpreadTemplateSelect',id);
  await page.click('#relphiApplyOptions');
  await page.waitForFunction(expected => window.RelphiDrawingBoardPrefabsBridge?.getState?.()?.activeLayout?.id===expected,id);
}

async function fillCustomQuestions(page,questions){
  if (!(await page.locator('#relphiBulkQuestions').isVisible().catch(()=>false))) {
    await page.click('#drawingBoardOptionsButton');
  }
  await page.waitForSelector('#relphiBulkQuestions',{state:'visible'});
  await page.fill('#relphiBulkQuestions',questions.join(', '));
  await page.click('#relphiApplyOptions');
  await page.waitForFunction(count => {
    const state=window.RelphiDrawingBoardPrefabsBridge?.getState?.();
    return state?.activeLayout?.id==='custom-active' && state.slotCount===count;
  },questions.length);
}

async function drawCards(page,count){
  for(let i=0;i<count;i+=1){
    await page.click('#drawRandomRowCard');
    await page.waitForFunction(expected => document.querySelectorAll('#shortListPanel .card-row-board [data-row-card]').length===expected,i+1);
    const focus=page.locator('.relphi-focus-reader');
    try {
      await focus.waitFor({state:'visible',timeout:1500});
      await page.click('.relphi-focus-close');
      await focus.waitFor({state:'detached',timeout:1500}).catch(()=>{});
    } catch (_) {}
  }
}

async function resetToBlank(page){
  if (!(await page.locator('#relphiResetBoard').isVisible().catch(()=>false))) {
    await page.click('#drawingBoardOptionsButton');
  }
  await page.waitForSelector('#relphiResetBoard',{state:'visible'});
  await page.click('#relphiResetBoard');
  await page.waitForFunction(() => {
    const state=window.RelphiDrawingBoardPrefabsBridge?.getState?.();
    return state && !state.activeLayout && state.slotCount===0 && state.hasCards===false;
  });
  if (await page.locator('#relphiApplyOptions').isVisible().catch(()=>false)) await page.click('#relphiApplyOptions');
}

async function boardState(page){
  return page.evaluate(() => ({
    rootHidden:document.querySelector('#shortListPanel')?.hidden,
    rootDisplay:getComputedStyle(document.querySelector('#shortListPanel')).display,
    workspaceVisible:!!document.querySelector('#shortListPanel .card-row-workspace') && getComputedStyle(document.querySelector('#shortListPanel .card-row-workspace')).display!=='none',
    layout:window.RelphiDrawingBoardPrefabsBridge?.getState?.()?.activeLayout?.id || '',
    slots:window.RelphiDrawingBoardPrefabsBridge?.getState?.()?.slotCount || 0,
    labels:(window.RelphiDrawingBoardOptionsBridge?.capture?.()?.shortListPositionLabels || []).slice(),
    placeholders:document.querySelectorAll('#shortListPanel .card-row-board .card-row-placeholder-item').length,
    cards:document.querySelectorAll('#shortListPanel .card-row-board [data-row-card]').length,
    drawerOpen:!!document.querySelector('#shortListPanel .card-row-drawing-board')?.open,
    triggerExpanded:document.querySelector('#relphiOpenDrawingBoardCurrent')?.getAttribute('aria-expanded')
  }));
}

async function assertClearCardsPreservesBoard(page,expectedSlots,expectedLayout,label){
  const before=await boardState(page);
  assert.equal(before.layout,expectedLayout,`${label}: expected layout before clear`);
  assert.equal(before.slots,expectedSlots,`${label}: expected slots before clear`);
  assert.equal(before.rootHidden,false,`${label}: board should be visible before clear`);

  await page.click('#clearShortListCardsOnly');
  await page.waitForFunction(() => document.querySelectorAll('#shortListPanel .card-row-board [data-row-card]').length===0);
  await page.waitForTimeout(100);

  const after=await boardState(page);
  assert.equal(after.rootHidden,false,`${label}: Clear Cards must not hide Drawing Board`);
  assert.notEqual(after.rootDisplay,'none',`${label}: Drawing Board must remain rendered`);
  assert.equal(after.workspaceVisible,true,`${label}: workspace must remain visible`);
  assert.equal(after.drawerOpen,true,`${label}: Drawing Board drawer must remain open`);
  assert.equal(after.triggerExpanded,'true',`${label}: Drawing Board trigger must remain open`);
  assert.equal(after.layout,expectedLayout,`${label}: Clear Cards must preserve active layout`);
  assert.equal(after.slots,expectedSlots,`${label}: Clear Cards must preserve slot count`);
  assert.equal(after.labels.length,expectedSlots,`${label}: Clear Cards must preserve position labels`);
  assert.equal(after.placeholders,expectedSlots,`${label}: cleared cards must become placeholders`);
}

async function assertFreeformClearCardsPreservesBoard(page,expectedSlots){
  const before=await boardState(page);
  assert.equal(before.layout,'','freeform: no active layout before clear');
  assert.equal(before.labels.length,0,'freeform: no position labels before clear');
  assert.equal(before.slots,expectedSlots,'freeform: cards establish the slot count before clear');

  await page.click('#clearShortListCardsOnly');
  await page.waitForFunction(() => document.querySelectorAll('#shortListPanel .card-row-board [data-row-card]').length===0);
  await page.waitForTimeout(100);

  const after=await boardState(page);
  assert.equal(after.rootHidden,false,'freeform: Clear Cards must not hide Drawing Board');
  assert.notEqual(after.rootDisplay,'none','freeform: Drawing Board must remain rendered');
  assert.equal(after.workspaceVisible,true,'freeform: workspace must remain visible');
  assert.equal(after.drawerOpen,true,'freeform: Drawing Board drawer must remain open');
  assert.equal(after.triggerExpanded,'true','freeform: Drawing Board trigger must remain open');
  assert.equal(after.layout,'','freeform: Clear Cards must not invent a spread');
  assert.equal(after.slots,expectedSlots,'freeform: Clear Cards must preserve the occupied positions as empty slots');
  assert.equal(after.placeholders,expectedSlots,'freeform: cleared cards must become placeholders');
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  try {
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await openBoard(page);

    await applyTemplate(page,'past-present-future-3');
    await drawCards(page,3);
    await assertClearCardsPreservesBoard(page,3,'past-present-future-3','shipped spread');
    await page.screenshot({path:path.join(out,'drawing-board-mobile-clear-cards-shipped.png'),fullPage:true});

    await resetToBlank(page);
    const questions=['What is changing?','What needs release?','What supports me?'];
    await fillCustomQuestions(page,questions);
    await drawCards(page,3);
    await assertClearCardsPreservesBoard(page,3,'custom-active','custom questions');
    const labels=await page.evaluate(() => window.RelphiDrawingBoardOptionsBridge?.capture?.()?.shortListPositionLabels || []);
    assert.deepEqual(labels,questions,'custom questions must remain after Clear Cards');
    await page.screenshot({path:path.join(out,'drawing-board-mobile-clear-cards-custom.png'),fullPage:true});

    await resetToBlank(page);
    await drawCards(page,3);
    await assertFreeformClearCardsPreservesBoard(page,3);
    await page.screenshot({path:path.join(out,'drawing-board-mobile-clear-cards-freeform.png'),fullPage:true});

    console.log('Drawing Board Clear Cards preservation checks passed');
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
