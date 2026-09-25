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
    assert.equal(await paths.count(),5,'Referents should expose five starting paths');
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
    await page.waitForTimeout(150);
    const surfaceDiagnostic=await page.evaluate(()=>{
      const cards=Array.isArray(window.RELPHI_TAROT_CARDS)?window.RELPHI_TAROT_CARDS:[];
      return {
        cardCount:cards.length,
        planet:cards.filter(card=>card?.card_type==='Major' && String(card?.astrology?.attribution_type||'').startsWith('Planet') && String(card?.astrology?.planet||'').trim()).length,
        sign:cards.filter(card=>card?.card_type==='Major' && card?.astrology?.attribution_type==='Sign' && card?.astrology?.sign).length,
        pip:cards.filter(card=>card?.card_type==='Pip' && Number(card?.number)>=2 && Number(card?.number)<=10).length,
        articleCount:document.querySelectorAll('.relphi-surface-draws article').length,
        suggestionCount:document.querySelectorAll('[data-suggestion-text]').length,
        surfaceText:document.querySelector('.relphi-referent-panel')?.textContent || ''
      };
    });
    assert.equal(surfaceDiagnostic.articleCount,3,'See What Surfaces draw failed: '+JSON.stringify(surfaceDiagnostic));
    assert.equal(surfaceDiagnostic.suggestionCount,3,'See What Surfaces should translate the draw into candidate referents');
    assert.equal(await page.locator('#shortListPanel .card-row-board [data-row-card]').count(),0,'idea cards must not become reading cards');

    assert.deepEqual(errors,[]);
  } finally {
    await browser.close();
  }
  console.log('Drawing Board Referents checks passed.');
})().catch(error=>{console.error(error);process.exit(1);});
