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

    const paths=page.locator('[data-referent-path]');
    assert.equal(await paths.count(),5,'Referents should expose five tabs');
    assert.equal(await page.locator('.relphi-referent-paths').getAttribute('role'),'tablist');
    assert.equal(await paths.first().getAttribute('role'),'tab');
    assert.equal(await page.locator('#relphiUseBlankDraw').count(),0,'Draw must not add a second gate in front of the native board');
    assert.equal(await page.locator('[data-referent-path].is-active').getAttribute('data-referent-path'),'templates');

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
    await page.click('#relphiSurfaceAll');
    await page.waitForFunction(()=>document.querySelectorAll('.relphi-surface-draws article').length===3);
    assert.equal(await page.locator('[data-suggestion-text]').count(),3,'See What Surfaces should translate the draw into candidate referents');
    assert.equal(await page.locator('#shortListPanel .card-row-board [data-row-card]').count(),0,'idea cards must not become reading cards');

    await page.click('[data-referent-path="draw"]');
    await page.waitForSelector('.relphi-referents-drawer',{state:'detached'});
    assert.equal(await page.locator('#relphiUseBlankDraw').count(),0,'Draw tab itself should return to the native board');

    assert.deepEqual(errors,[]);
  } finally {
    await browser.close();
  }
  console.log('Drawing Board Referents checks passed.');
})().catch(error=>{console.error(error);process.exit(1);});
