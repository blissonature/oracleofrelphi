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
    assert.equal(await page.locator('.relphi-referent-review li').count(),3,'accepted suggestions should become current referents');

    await page.click('[data-referent-path="surface"]');
    const surfaceButtons=await page.locator('[data-surface-draw]').allTextContents();
    assert.deepEqual(surfaceButtons,[
      'Which primordial force?','What is taking root?','What is at work?','How is it showing up?',
      'What is needed?','How is it being carried?','What form is it taking?'
    ],'See What Surfaces should label sub-packs by what they tell the reader rather than technical pack names');
    await page.click('#relphiSurfaceAll');
    await page.waitForFunction(()=>document.querySelectorAll('.relphi-surface-draws article').length===7);
    assert.ok(await page.locator('[data-suggestion-text]').count()>=7,'See What Surfaces should translate all surfaced layers into candidate referents');
    assert.ok((await page.locator('.relphi-surface-draws').innerText()).includes('three-element layer before Earth'),'Mother-letter Majors should be identified as the primordial three-element layer');
    assert.ok((await page.locator('.relphi-surface-draws').innerText()).includes('four-element layer with Earth included'),'Aces should be identified as the four-element quaternion');

    await page.evaluate(()=>{Math.random=()=>0.999999;});
    await page.click('[data-surface-draw="court"]');
    await page.waitForFunction(()=>document.querySelector('.relphi-surface-draws .is-princess-page'));
    const princessText=await page.locator('.relphi-surface-draws .is-princess-page').innerText();
    assert.match(princessText,/Next-generation embodiment/,'Princess/Page should surface with its special embodiment status');
    assert.match(princessText,/Page\/Princess/,'Princess/Page should preserve both court names');
    assert.match(princessText,/Earth of Earth|Earth of (Fire|Water|Air)/,'Princess/Page should expose its Earth-of-X formula');
    assert.equal(await page.locator('#shortListPanel .card-row-board [data-row-card]').count(),0,'idea cards must not become reading cards');

    // User flow: edit a surfaced referent and go straight to Start Reading.
    // It must become a real board position without requiring the extra "Use selected referents" click.
    await page.click('#relphiResetBoard');
    await page.click('[data-referent-path="surface"]');
    await page.click('[data-surface-draw="court"]');
    await page.waitForFunction(()=>document.querySelectorAll('[data-suggestion-text]').length===1);
    const question='How is this being carried into tangible form?';
    await page.fill('[data-suggestion-text="0"]',question);
    await page.click('#relphiApplyOptions');
    await page.waitForSelector('.relphi-referents-drawer',{state:'detached'});
    assert.equal(await page.locator('#drawingBoardBoardTab').getAttribute('aria-selected'),'true','Start Reading should return to Board mode');
    assert.equal(await page.locator('.drawing-board-board-mode').isVisible(),true,'Board actions should reappear after Start Reading');
    await page.waitForFunction(expected=>{
      const state=window.RelphiDrawingBoardOptionsBridge?.capture?.();
      return state?.shortListPositionLabels?.[0]===expected &&
        state?.rowPositionMeta?.[0]?.drawScope==='courts' &&
        document.querySelectorAll('#shortListPanel .card-row-placeholder-item').length===1;
    },question);
    assert.equal(await page.locator('[data-row-position-label-editor="0"]').textContent(),question,'surfaced referent should become the visible position sticker');

    await page.click('#drawRandomRowCard');
    await page.waitForSelector('.relphi-focus-reader',{state:'visible'});
    const drawnType=await page.evaluate(()=>{
      const id=document.querySelector('#shortListPanel .card-row-board [data-row-card]')?.dataset?.rowCard;
      return window.RELPHI_TAROT_CARDS?.find(card=>card.card_id===id)?.card_type||'';
    });
    assert.equal(drawnType,'Court','a court-sourced referent should draw its reading card from the Courts sub-pack');
    assert.equal(await page.locator('.relphi-focus-position').textContent(),question,'focus view should show the actual referent rather than Position 1');
    await page.click('.relphi-focus-close');

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
