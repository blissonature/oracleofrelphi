const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const base='http://127.0.0.1:8000/tarot.html';

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:430,height:860}});
    const errors=[];
    page.on('pageerror',error=>errors.push(error?.stack||String(error)));
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>!!window.RelphiDrawingBoardOptionsBridge && !!document.querySelector('#drawingBoardOptionsButton'),null,{timeout:20000});
    const panel=page.locator('#shortListPanel');
    if(!(await panel.isVisible())) await page.click('#relphiOpenDrawingBoardCurrent');
    await panel.waitFor({state:'visible'});
    await page.click('#drawingBoardOptionsButton');
    await page.waitForSelector('.relphi-referents-drawer',{state:'visible'});

    assert.equal(await page.locator('.drawing-board-mode-tabs').getAttribute('role'),'tablist','Board and Referents should be the top-level mode tabs');
    assert.equal(await page.locator('#drawingBoardOptionsButton').getAttribute('aria-selected'),'true','Referents tab should be active while editing referents');
    assert.equal(await page.locator('.drawing-board-board-mode').isVisible(),false,'Board controls should be hidden while Referents is active');

    const paths=page.locator('[data-referent-path]');
    assert.equal(await paths.count(),4,'Referents should expose exactly four paths');
    assert.deepEqual(await paths.locator('strong').allTextContents(),['Bespoke','Templates','Building Blocks','See What Surfaces']);
    assert.equal(await page.locator('.relphi-referent-paths').getAttribute('role'),'list');
    assert.equal(await page.locator('[data-referent-path="draw"]').count(),0,'Drawing is the Board itself and must not be a Referents path');
    const pathBoxes=await paths.evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect()).map(rect=>({top:rect.top,left:rect.left,width:rect.width})));
    assert.ok(pathBoxes.every((box,index)=>index===0 || box.top>pathBoxes[index-1].top),'Referent paths should stack vertically');
    assert.ok(pathBoxes.every(box=>Math.abs(box.left-pathBoxes[0].left)<2 && Math.abs(box.width-pathBoxes[0].width)<2),'Vertical path buttons should share one mobile-friendly column');
    assert.equal(await page.locator('.relphi-referent-settings').evaluate(node=>node.tagName),'SECTION','Draw settings should not be a collapsed details control');
    assert.equal(await page.locator('.relphi-referent-settings .relphi-draw-options').isVisible(),true,'Draw settings controls should always be visible');
    const referentsBox=await page.locator('.relphi-referents-drawer').evaluate(node=>{
      const r=node.getBoundingClientRect();
      return {height:r.height,position:getComputedStyle(node).position};
    });
    assert.equal(referentsBox.position,'relative','Referents must stay in normal document flow rather than becoming an absolute overlay');
    assert.ok(referentsBox.height>=450,'Referents must have a usable working height instead of collapsing to roughly 100 px');

    await page.click('[data-referent-path="bespoke"]');
    await page.fill('#relphiBulkReferents','Situation, Challenge, Strategy');
    await page.click('#relphiParseReferents');
    await page.waitForFunction(()=>document.querySelectorAll('#relphiPositionLabels .relphi-label-row').length===3);
    assert.deepEqual(
      await page.locator('#relphiPositionLabels .relphi-label-row input').evaluateAll(nodes=>nodes.map(node=>node.value)),
      ['Situation','Challenge','Strategy']
    );

    await page.click('[data-referent-path="blocks"]');
    await page.selectOption('[data-building-key="element"]','Water');
    await page.selectOption('[data-building-key="planet"]','Moon');
    await page.selectOption('[data-building-key="house"]','11');
    await page.click('#relphiBuildQuestions');
    await page.waitForFunction(()=>document.querySelectorAll('[data-suggestion-text]').length===3);
    const built=await page.locator('[data-suggestion-text]').evaluateAll(nodes=>nodes.map(node=>node.value));
    assert.equal(built.length,3);
    assert.ok(built.every(value=>value.endsWith('?')),'Building Blocks suggestions should be reviewable questions');
    await page.click('#relphiAcceptSuggestions');
    assert.equal(await page.locator('.relphi-referent-review').count(),0,'Referents should not repeat a second redundant question list');

    await page.click('[data-referent-path="surface"]');
    const choices=page.locator('[data-surface-choice]');
    assert.equal(await choices.count(),7,'See What Surfaces should expose one checkbox per question type');
    assert.deepEqual(await page.locator('.relphi-surface-question-choice strong').allTextContents(),[
      'Which primordial force?','What is taking root?','What is at work?','How is it showing up?',
      'What is needed?','How is it being carried?','What form is it taking?'
    ]);
    assert.equal(await page.locator('#relphiSurfaceAll').count(),0,'See What Surfaces should not force a single-or-all control');
    assert.equal(await page.locator('[data-surface-draw]').count(),0,'Question types should be selected before entering the reading, not pre-drawn in Referents');
    assert.equal(await page.locator('#relphiApplyOptions').isDisabled(),true,'Start Reading should wait until at least one question type is chosen');

    await page.check('[data-surface-choice="primordial"]');
    await page.check('[data-surface-choice="court"]');
    assert.equal(await page.locator('#relphiApplyOptions').isDisabled(),false,'Any chosen combination should be allowed');
    await page.click('#relphiApplyOptions');

    await page.waitForSelector('.relphi-referents-drawer',{state:'detached'});
    await page.waitForSelector('.relphi-attune-reader',{state:'visible'});
    assert.equal(await page.locator('#drawingBoardBoardTab').getAttribute('aria-selected'),'true','Start Reading should return to Board mode');
    assert.equal(await page.locator('.drawing-board-board-mode').isVisible(),true,'Board actions should reappear after Start Reading');
    assert.equal(await page.locator('.relphi-focus-reader').count(),0,'Attunement should happen before the card is revealed');
    assert.equal(await page.locator('#shortListPanel .card-row-board [data-row-card]').count(),0,'No card should be chosen before the reader reveals it');
    assert.equal(await page.locator('.relphi-attune-shell h2').textContent(),'Which primordial force?');
    assert.ok((await page.locator('.relphi-board-toast').innerText()).includes('Attune to each referent'),'Board toast should explain the reading mode after settings are established');

    const configured=await page.evaluate(()=>window.RelphiDrawingBoardOptionsBridge.capture());
    assert.deepEqual(configured.shortListPositionLabels.slice(0,2),['Which primordial force?','How is it being carried?']);
    assert.deepEqual(configured.rowPositionMeta.slice(0,2).map(item=>item.drawScope),['primordial-majors','courts']);

    await page.click('[data-attune-random]');
    await page.waitForSelector('.relphi-focus-reader',{state:'visible'});
    const firstCard=await page.evaluate(()=>{
      const id=document.querySelector('#shortListPanel .card-row-board [data-row-card]')?.dataset?.rowCard;
      return window.RELPHI_TAROT_CARDS?.find(card=>card.card_id===id)||null;
    });
    assert.equal(firstCard?.card_type,'Major','primordial exploration should draw a Major');
    assert.ok(['Aleph','Mem','Shin'].includes(String(firstCard?.hebrew?.letter||'')),'primordial exploration should draw from the mother-letter Majors');
    assert.equal(await page.locator('.relphi-focus-position').textContent(),'Which primordial force?');

    await page.click('.relphi-focus-next');
    await page.waitForSelector('.relphi-attune-reader',{state:'visible'});
    assert.equal(await page.locator('.relphi-attune-shell h2').textContent(),'How is it being carried?');
    await page.click('[data-attune-search]');
    await page.fill('.relphi-attune-search input','Queen');
    await page.waitForFunction(()=>document.querySelectorAll('.relphi-attune-search-results [data-attune-card]').length>0);
    const physicalChoice=page.locator('.relphi-attune-search-results [data-attune-card]').first();
    await physicalChoice.click();

    await page.waitForSelector('.relphi-focus-reader',{state:'visible'});
    assert.equal(await page.locator('.relphi-focus-position').textContent(),'How is it being carried?');
    const physicalType=await page.evaluate(()=>{
      const cards=[...document.querySelectorAll('#shortListPanel .card-row-board [data-row-card]')];
      const id=cards[1]?.dataset?.rowCard;
      return window.RELPHI_TAROT_CARDS?.find(card=>card.card_id===id)?.card_type||'';
    });
    assert.equal(physicalType,'Court','Physical-card search should stay within the referent\'s assigned pack');
    await page.waitForFunction(()=>{
      const state=window.RelphiDrawingBoardOptionsBridge?.capture?.();
      return (state?.shortListPositionLabels?.length||0)>2;
    });
    const afterExploration=await page.evaluate(()=>window.RelphiDrawingBoardOptionsBridge.capture());
    assert.ok(afterExploration.shortListPositionLabels[2].startsWith('What does the primordial '),'After the initial exploration, a new question should be made from what surfaced');
    assert.equal(afterExploration.rowPositionMeta[2].drawScope,'primordial-majors','Follow-up should retain the symbolic pack that surfaced it');

    await page.click('.relphi-focus-next');
    await page.waitForSelector('.relphi-attune-reader',{state:'visible'});
    assert.ok((await page.locator('.relphi-attune-shell h2').textContent()).startsWith('What does the primordial '),'Follow-up question should enter the same sacred attune/reveal flow');

    await page.click('.relphi-attune-close');
    await page.click('#drawingBoardOptionsButton');
    await page.waitForSelector('.relphi-referents-drawer',{state:'visible'});
    await page.click('#relphiResetBoard');
    await page.click('#drawingBoardBoardTab');
    await page.waitForSelector('.relphi-referents-drawer',{state:'detached'});
    assert.equal(await page.locator('#drawingBoardBoardTab').getAttribute('aria-selected'),'true','Board tab should restore Board mode');
    assert.equal(await page.locator('.drawing-board-board-mode').isVisible(),true,'Board mode should contain the board controls');
    assert.deepEqual(
      await page.locator('.drawing-board-board-mode .drawing-board-top-actions > button').evaluateAll(nodes=>nodes.map(node=>node.id)),
      ['drawRandomRowCard','undoShortList','redoShortList','clearShortListCardsOnly'],
      'Draw Undo Redo and Clear Cards belong inside Board mode'
    );

    assert.deepEqual(errors,[]);
  } finally {
    await browser.close();
  }
  console.log('Drawing Board Referents checks passed.');
})().catch(error=>{console.error(error);process.exit(1);});
