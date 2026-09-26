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
    assert.equal(await page.locator('[data-suggestion-toggle-all]').isChecked(),true,'Building Blocks bulk selector should reflect that all suggested questions start selected');
    await page.uncheck('[data-suggestion-toggle-all]');
    assert.equal(await page.locator('[data-suggestion-use]:checked').count(),0,'Building Blocks bulk selector should clear every suggested question');
    await page.check('[data-suggestion-toggle-all]');
    assert.equal(await page.locator('[data-suggestion-use]:checked').count(),3,'Building Blocks bulk selector should select every suggested question');
    await page.click('#relphiAcceptSuggestions');
    assert.equal(await page.locator('.relphi-referent-review').count(),0,'Referents should not repeat a second redundant question list');

    await page.click('[data-referent-path="surface"]');
    const choices=page.locator('[data-surface-choice]');
    assert.equal(await choices.count(),8,'See What Surfaces should expose Full Pack plus each specialist question type');
    assert.deepEqual(await page.locator('.relphi-surface-question-choice strong').allTextContents(),[
      'What should I see first?','What is happening at the root of this?','What is beginning here?','What is moving this from one state to another?','How is this unfolding?',
      'What need is asking for attention?','How is the situation being carried?','What condition has taken shape?'
    ]);
    assert.equal(await page.locator('[data-surface-choice="origin"]').count(),1,'Full Pack should be available as the open-ended starting route');
    assert.equal(await page.locator('#relphiSurfaceAll').count(),0,'See What Surfaces should not restore the old single-or-all restriction');
    assert.equal(await page.locator('[data-surface-draw]').count(),0,'Question types should be selected before entering the reading, not pre-drawn in Referents');
    assert.equal(await page.locator('#relphiApplyOptions').isDisabled(),true,'Start Reading should wait until at least one question type is chosen');
    assert.equal(await page.locator('[data-surface-toggle-all]').isChecked(),false,'Initial bulk selector should reflect that no starting questions are selected');
    await page.check('[data-surface-toggle-all]');
    assert.equal(await page.locator('[data-surface-choice]:checked').count(),8,'Initial bulk selector should select every starting question');
    assert.equal(await page.locator('#relphiApplyOptions').isDisabled(),false,'Selecting all should enable Start Reading');
    await page.uncheck('[data-surface-toggle-all]');
    assert.equal(await page.locator('[data-surface-choice]:checked').count(),0,'Initial bulk selector should clear every starting question');
    assert.equal(await page.locator('#relphiApplyOptions').isDisabled(),true,'Clearing all should disable Start Reading again');

    await page.check('[data-surface-choice="primordial"]');
    await page.check('[data-surface-choice="court"]');
    assert.equal(await page.locator('#relphiApplyOptions').isDisabled(),false,'Any chosen combination should be allowed');
    await page.click('#relphiApplyOptions');

    await page.waitForSelector('.relphi-referents-drawer',{state:'detached'});
    assert.equal(await page.locator('#drawingBoardBoardTab').getAttribute('aria-selected'),'true','Start Reading should return to Board mode');
    assert.equal(await page.locator('.drawing-board-board-mode').isVisible(),true,'Board actions should reappear after Start Reading');
    assert.equal(await page.locator('.relphi-focus-reader').count(),0,'No card should be revealed before attunement');
    assert.equal(await page.locator('.relphi-attune-reader').count(),0,'The board guidance toast should be visible before the attunement screen covers the board');
    assert.equal(await page.locator('#shortListPanel .card-row-board [data-row-card]').count(),0,'No card should be chosen before the reader reveals it');
    assert.ok((await page.locator('.relphi-board-toast').innerText()).includes('Attune to each referent'),'Board toast should explain the reading mode after settings are established');
    assert.equal(await page.locator('.relphi-board-toast-action').textContent(),'Begin reading');
    await page.click('.relphi-board-toast-close');
    await page.waitForSelector('.relphi-board-toast',{state:'detached'});
    const attuneScrollY=await page.evaluate(()=>{
      document.body.style.minHeight='2600px';
      window.scrollTo(0,640);
      return window.scrollY;
    });
    await page.evaluate(()=>document.querySelector('#shortListPanel .card-row-board>.card-row-item[data-row-index="0"]')?.click());
    await page.waitForSelector('.relphi-attune-reader',{state:'visible'});
    assert.equal(await page.locator('#shortListPanel .card-row-board [data-row-card]').count(),0,'Clicking an empty Surface position must enter Attune without drawing a card');
    assert.equal(await page.locator('.relphi-attune-shell h2').textContent(),'What is happening at the root of this?');
    const attuneViewport=await page.evaluate(()=>({
      bodyPosition:document.body.style.position,
      bodyTop:document.body.style.top,
      overlayTop:document.querySelector('.relphi-attune-reader')?.getBoundingClientRect().top,
      overlayBottom:document.querySelector('.relphi-attune-reader')?.getBoundingClientRect().bottom,
      viewportHeight:window.innerHeight
    }));
    assert.equal(attuneViewport.bodyPosition,'fixed','Attune should freeze the document at its current scroll position');
    assert.equal(attuneViewport.bodyTop,(-attuneScrollY)+'px','Attune should preserve the page offset instead of snapping to the top');
    assert.equal(Math.round(attuneViewport.overlayTop),0,'Attune should begin at the current viewport top');
    assert.equal(Math.round(attuneViewport.overlayBottom),Math.round(attuneViewport.viewportHeight),'Attune should cover the current viewport');
    await page.click('.relphi-attune-close');
    await page.waitForSelector('.relphi-attune-reader',{state:'detached'});
    assert.ok(Math.abs((await page.evaluate(()=>window.scrollY))-attuneScrollY)<=1,'Closing Attune should restore the exact page scroll position');
    await page.evaluate(()=>document.querySelector('#shortListPanel .card-row-board>.card-row-item[data-row-index="0"]')?.click());
    await page.waitForSelector('.relphi-attune-reader',{state:'visible'});

    const configured=await page.evaluate(()=>window.RelphiDrawingBoardOptionsBridge.capture());
    assert.deepEqual(configured.shortListPositionLabels.slice(0,2),['What is happening at the root of this?','How is the situation being carried?']);
    assert.deepEqual(configured.rowPositionMeta.slice(0,2).map(item=>item.drawScope),['primordial-majors','courts']);

    await page.click('[data-attune-random]');
    await page.waitForSelector('.relphi-focus-reader',{state:'visible'});
    const firstCard=await page.evaluate(()=>{
      const id=document.querySelector('#shortListPanel .card-row-board [data-row-card]')?.dataset?.rowCard;
      return window.RELPHI_TAROT_CARDS?.find(card=>card.card_id===id)||null;
    });
    assert.equal(firstCard?.card_type,'Major','primordial exploration should draw a Major');
    assert.ok(['Aleph','Mem','Shin'].includes(String(firstCard?.hebrew?.letter||'')),'primordial exploration should draw from the mother-letter Majors');
    assert.equal(await page.locator('.relphi-focus-position').textContent(),'What is happening at the root of this?');

    await page.click('.relphi-focus-next');
    await page.waitForSelector('.relphi-attune-reader',{state:'visible'});
    assert.equal(await page.locator('.relphi-attune-shell h2').textContent(),'How is the situation being carried?');
    await page.click('[data-attune-search]');
    await page.fill('.relphi-attune-search input','Queen');
    await page.waitForFunction(()=>document.querySelectorAll('.relphi-attune-search-results [data-attune-card]').length>0);
    const physicalChoice=page.locator('.relphi-attune-search-results [data-attune-card]').first();
    await physicalChoice.click();

    await page.waitForSelector('.relphi-focus-reader',{state:'visible'});
    assert.equal(await page.locator('.relphi-focus-position').textContent(),'How is the situation being carried?');
    const physicalType=await page.evaluate(()=>{
      const cards=[...document.querySelectorAll('#shortListPanel .card-row-board [data-row-card]')];
      const id=cards[1]?.dataset?.rowCard;
      return window.RELPHI_TAROT_CARDS?.find(card=>card.card_id===id)?.card_type||'';
    });
    assert.equal(physicalType,'Court','Physical-card search should stay within the referent\'s assigned pack');
    const beforeReview=await page.evaluate(()=>window.RelphiDrawingBoardOptionsBridge.capture());
    assert.equal(beforeReview.shortListPositionLabels.length,2,'Follow-ups must not be appended before the reader accepts them');

    await page.click('.relphi-focus-next');
    await page.waitForSelector('.relphi-surface-followup-review',{state:'visible'});
    assert.ok(await page.locator('[data-followup-use]').count()>=6,'Each surfaced card should offer several distinct card-linked follow-up choices');
    assert.ok((await page.locator('.relphi-followup-question-row small').first().textContent()).startsWith('From '),'Generated follow-ups must name the card that surfaced them');
    assert.ok((await page.locator('.relphi-followup-question-row small').first().textContent()).includes('What is happening at the root of this?'),'Follow-up provenance should retain the question the source card already answered');
    assert.equal(await page.locator('[data-followup-use]:checked').count(),0,'Generated follow-ups must require explicit acceptance');
    assert.equal(await page.locator('[data-followup-toggle-all]').isChecked(),false,'Follow-up bulk selector should begin with generated questions unselected');
    await page.check('[data-followup-toggle-all]');
    assert.equal(await page.locator('[data-followup-use]:checked').count(),await page.locator('[data-followup-use]').count(),'Follow-up bulk selector should select every generated question');
    assert.equal(await page.locator('[data-followup-confirm]').isDisabled(),false,'Selecting all generated questions should enable confirmation');
    await page.uncheck('[data-followup-toggle-all]');
    assert.equal(await page.locator('[data-followup-use]:checked').count(),0,'Follow-up bulk selector should clear every generated question');
    assert.equal(await page.locator('[data-followup-confirm]').isDisabled(),true,'Clearing all generated questions should disable confirmation when no custom question is selected');
    assert.equal(await page.locator('[data-followup-pack="0"]').inputValue(),'full','Follow-up pack selection must default from the new question, not inherit the source sub-pack');
    assert.equal(await page.locator('[data-followup-repeats]').isChecked(),false,'Follow-up settings should suggest Repeats off to avoid hereditary loops');
    assert.equal(await page.locator('[data-followup-custom-row]').count(),1,'Review should begin with one Write your own row');
    assert.equal((await page.locator('[data-followup-custom-row] small').first().textContent()).trim(),'Write your own');

    const acceptedGenerated=await page.locator('[data-followup-text="0"]').inputValue();
    const acceptedPack=await page.locator('[data-followup-pack="0"]').inputValue();
    await page.click('[data-followup-add-custom]');
    assert.equal(await page.locator('[data-followup-custom-row]').count(),2,'Plus must add an additional custom-question row');
    await page.fill('[data-followup-custom-text="0"]','What else do I need to ask here?');
    await page.selectOption('[data-followup-custom-pack="0"]','full');
    await page.check('[data-followup-use="0"]');
    assert.equal(await page.locator('[data-followup-confirm]').isDisabled(),false,'Selecting or writing a question should enable confirmation');
    await page.click('[data-followup-confirm]');

    await page.waitForSelector('.relphi-surface-followup-review',{state:'detached'});
    const afterExploration=await page.evaluate(()=>window.RelphiDrawingBoardOptionsBridge.capture());
    assert.equal(afterExploration.shortListPositionLabels.length,4,'Only accepted generated/custom follow-ups should be appended');
    assert.equal(afterExploration.shortListPositionLabels[2],acceptedGenerated,'Accepted generated question should be preserved exactly');
    assert.equal(afterExploration.rowPositionMeta[2].drawScope,acceptedPack,'Accepted follow-up should use the answer pack chosen for that question');
    assert.equal(acceptedPack,'full','The first unresolved-edge question should open into Full Pack rather than repeat the source sub-pack');
    assert.equal(afterExploration.shortListPositionLabels[3],'What else do I need to ask here?','Accepted Write your own question should become a real referent');
    assert.equal(afterExploration.rowPositionMeta[3].drawScope,'full','Write your own should default to Full Pack unless changed');

    await page.click('.relphi-board-toast-action');
    await page.waitForSelector('.relphi-attune-reader',{state:'visible'});
    assert.equal(await page.locator('.relphi-attune-shell h2').textContent(),acceptedGenerated,'Accepted follow-up question should enter the same sacred attune/reveal flow');

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
