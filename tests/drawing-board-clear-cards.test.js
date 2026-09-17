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
    workspaceHeight:document.querySelector('#shortListPanel .card-row-workspace')?.getBoundingClientRect().height || 0,
    layout:window.RelphiDrawingBoardPrefabsBridge?.getState?.()?.activeLayout?.id || '',
    slots:window.RelphiDrawingBoardPrefabsBridge?.getState?.()?.slotCount || 0,
    labels:(window.RelphiDrawingBoardOptionsBridge?.capture?.()?.shortListPositionLabels || []).slice(),
    placeholders:document.querySelectorAll('#shortListPanel .card-row-board .card-row-placeholder-item').length,
    cards:document.querySelectorAll('#shortListPanel .card-row-board [data-row-card]').length,
    drawerOpen:!!document.querySelector('#shortListPanel .card-row-drawing-board')?.open,
    triggerExpanded:document.querySelector('#relphiOpenDrawingBoardCurrent')?.getAttribute('aria-expanded'),
    drawDisabled:!!document.querySelector('#drawRandomRowCard')?.disabled
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
  assert.ok(after.workspaceHeight>=300,`${label}: workspace must retain usable height`);
  assert.equal(after.drawerOpen,true,`${label}: Drawing Board drawer must remain open`);
  assert.equal(after.triggerExpanded,'true',`${label}: Drawing Board trigger must remain open`);
  assert.equal(after.layout,expectedLayout,`${label}: Clear Cards must preserve active layout`);
  assert.equal(after.slots,expectedSlots,`${label}: Clear Cards must preserve spread slot count`);
  assert.equal(after.labels.length,expectedSlots,`${label}: Clear Cards must preserve position labels`);
  assert.equal(after.placeholders,expectedSlots,`${label}: spread cards must clear back to their spread positions`);
}

async function assertFreeformClearCardsLeavesZeroSlotBoard(page,expectedCards){
  const before=await boardState(page);
  assert.equal(before.layout,'','freeform: no active layout before clear');
  assert.equal(before.labels.length,0,'freeform: no position labels before clear');
  assert.equal(before.slots,expectedCards,'freeform: cards establish the transient slot count before clear');

  await page.click('#clearShortListCardsOnly');
  await page.waitForFunction(() => document.querySelectorAll('#shortListPanel .card-row-board [data-row-card]').length===0);
  await page.waitForTimeout(100);

  const after=await boardState(page);
  assert.equal(after.rootHidden,false,'freeform: Clear Cards must not hide Drawing Board');
  assert.notEqual(after.rootDisplay,'none','freeform: Drawing Board must remain rendered');
  assert.equal(after.workspaceVisible,true,'freeform: zero-slot workspace must remain visible');
  assert.ok(after.workspaceHeight>=300,'freeform: zero-slot workspace must retain usable height');
  assert.equal(after.drawerOpen,true,'freeform: Drawing Board drawer must remain open');
  assert.equal(after.triggerExpanded,'true','freeform: Drawing Board trigger must remain open');
  assert.equal(after.layout,'','freeform: Clear Cards must not invent a spread');
  assert.equal(after.slots,0,'freeform: Clear Cards must leave zero slots when there were no configured positions');
  assert.equal(after.labels.length,0,'freeform: Clear Cards must not invent position stickers');
  assert.equal(after.placeholders,0,'freeform: Clear Cards must not invent placeholders');
  assert.equal(after.drawDisabled,false,'freeform: Draw must remain usable with zero slots');
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
    await assertFreeformClearCardsLeavesZeroSlotBoard(page,3);
    await page.screenshot({path:path.join(out,'drawing-board-mobile-clear-cards-freeform-zero.png'),fullPage:true});

    await drawCards(page,1);
    const redrawn=await boardState(page);
    assert.equal(redrawn.cards,1,'freeform: Draw must create a card directly from the zero-slot board');
    assert.equal(redrawn.rootHidden,false,'freeform: board must remain visible after drawing again');
    assert.equal(redrawn.workspaceVisible,true,'freeform: workspace must remain visible after drawing again');

    // Saved/restored sessions open through the hidden native landing control.
    // That path must synchronize the public Drawing Board open state before any
    // rerender, or Clear Cards can make the enhancement layer hide the panel.
    const restored=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    await restored.goto(base,{waitUntil:'domcontentloaded'});
    await restored.waitForSelector('#relphiOpenDrawingBoardCurrent',{timeout:20000});
    await restored.waitForFunction(() => !!window.RelphiDrawingBoardSpreadPrefabs && !!window.RelphiDrawingBoardPrefabsBridge && !!window.RelphiDrawingBoardOptionsBridge,{timeout:20000});
    await restored.evaluate(() => document.getElementById('landingOpenBoard')?.click());
    await restored.waitForSelector('#shortListPanel .card-row-workspace-toolbar.relphi-board-controller',{state:'visible'});
    assert.equal(await restored.locator('#relphiOpenDrawingBoardCurrent').getAttribute('aria-expanded'),'true','native/restored opening must synchronize the public Drawing Board open state');
    await drawCards(restored,1);
    const clearButton=restored.locator('#clearShortListCardsOnly');
    const clearHit=await clearButton.evaluate(button=>{
      const r=button.getBoundingClientRect();
      return document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.id || '';
    });
    assert.equal(clearHit,'clearShortListCardsOnly','Clear Cards must be the actual touch target');
    await clearButton.tap();
    await restored.waitForFunction(() => document.querySelectorAll('#shortListPanel .card-row-board [data-row-card]').length===0);
    await restored.waitForTimeout(150);
    const restoredAfter=await boardState(restored);
    assert.equal(restoredAfter.rootHidden,false,'restored board: Clear Cards must not hide Drawing Board');
    assert.notEqual(restoredAfter.rootDisplay,'none','restored board: Drawing Board must remain rendered');
    assert.equal(restoredAfter.workspaceVisible,true,'restored board: workspace must remain visible');
    assert.equal(restoredAfter.drawerOpen,true,'restored board: drawer must remain open');
    assert.equal(restoredAfter.triggerExpanded,'true','restored board: public open state must remain true');
    assert.equal(restoredAfter.slots,0,'restored freeform board: Clear Cards must leave zero slots');
    assert.equal(restoredAfter.placeholders,0,'restored freeform board: Clear Cards must not invent placeholders');
    await restored.screenshot({path:path.join(out,'drawing-board-mobile-clear-cards-restored-zero.png'),fullPage:true});
    await restored.close();

    const desktop=await browser.newPage({viewport:{width:1024,height:768}});
    await openBoard(desktop);
    await drawCards(desktop,3);
    await assertFreeformClearCardsLeavesZeroSlotBoard(desktop,3);
    await desktop.screenshot({path:path.join(out,'drawing-board-desktop-clear-cards-freeform-zero.png'),fullPage:true});
    await desktop.close();

    console.log('Drawing Board Clear Cards preservation checks passed');
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
