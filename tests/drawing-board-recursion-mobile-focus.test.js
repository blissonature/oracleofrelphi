const assert=require('node:assert/strict');
const { chromium }=require('playwright');

const base='http://127.0.0.1:8000/tarot.html?board=workflow-v2#tarot';

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const page=await context.newPage();
    page.setDefaultTimeout(20000);
    const errors=[];
    page.on('pageerror',error=>errors.push(String(error)));

    await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>!!window.RelphiDrawingBoardOptionsBridge&&!!window.RelphiTarotLedgerBridge,null,{timeout:20000});

    const panel=page.locator('#shortListPanel');
    if(!(await panel.isVisible())) await page.locator('#relphiOpenDrawingBoardCurrent').tap();
    await panel.waitFor({state:'visible'});
    await page.locator('#relphiBoardSettingsButton').tap();
    await page.waitForSelector('#drawingBoardOptionsButton',{state:'visible'});
    await page.locator('#drawingBoardOptionsButton').tap();
    await page.locator('[data-referent-path="templates"]').tap();
    await page.waitForSelector('#relphiSpreadTemplateSelect',{state:'visible'});
    await page.selectOption('#relphiSpreadTemplateSelect','relphi-recursion-22');
    await page.locator('#relphiApplyOptions').tap();

    await page.waitForFunction(()=>document.querySelector('#shortListPanel')?.classList.contains('relphi-recursion-reading'));
    const visibleRecursiveLabels=await page.locator('#shortListPanel .card-row-board>.card-row-item.is-recursion-level-active>.card-row-position-panel').evaluateAll(nodes=>nodes.filter(node=>getComputedStyle(node).display!=='none').length);
    assert.equal(visibleRecursiveLabels,0,'recursive board must not float ordinary position stickers over the logo');

    const enter=page.locator('.relphi-board-toast-action');
    if(await enter.count()) await enter.tap();
    else await page.locator('#shortListPanel .card-row-board>.card-row-item.is-recursion-level-active').first().tap();

    await page.waitForSelector('.relphi-attune-reader',{state:'visible'});
    await page.locator('[data-attune-random]').tap();
    await page.waitForSelector('.relphi-focus-reader',{state:'visible'});

    const focus=await page.evaluate(()=>{
      const reader=document.querySelector('.relphi-focus-reader');
      const nav=document.querySelector('.relphi-focus-reader .relphi-focus-navigator');
      const strip=document.querySelector('.relphi-focus-reader .relphi-focus-strip');
      const vv=window.visualViewport;
      const r=reader?.getBoundingClientRect();
      const topHit=document.elementFromPoint((vv?.width||window.innerWidth)/2,2)?.closest?.('.relphi-focus-reader');
      const bottomHit=document.elementFromPoint((vv?.width||window.innerWidth)/2,(vv?.height||window.innerHeight)-2)?.closest?.('.relphi-focus-reader');
      return {
        position:reader?getComputedStyle(reader).position:'',
        top:r?.top,bottom:r?.bottom,left:r?.left,right:r?.right,
        viewportWidth:vv?.width||window.innerWidth,
        viewportHeight:vv?.height||window.innerHeight,
        bodyPosition:getComputedStyle(document.body).position,
        navDisplay:nav?getComputedStyle(nav).display:'',
        stripChildren:strip?.children.length||0,
        topCovered:!!topHit,
        bottomCovered:!!bottomHit
      };
    });

    assert.equal(focus.position,'fixed','Focus must be viewport-fixed');
    assert.equal(focus.bodyPosition,'fixed','Focus must lock the page underneath it on iPhone');
    assert.ok(focus.top<=1 && focus.left<=1,'Focus must begin at the viewport edge');
    assert.ok(focus.right>=focus.viewportWidth-1,'Focus must cover the viewport width');
    assert.ok(focus.bottom>=focus.viewportHeight-1,'Focus must cover the viewport height');
    assert.equal(focus.topCovered,true,'Focus must own the top of the viewport');
    assert.equal(focus.bottomCovered,true,'Focus must own the bottom of the viewport');
    assert.equal(focus.navDisplay,'none','recursive Focus must not render the duplicate miniature logo navigator');
    assert.equal(focus.stripChildren,0,'recursive Focus strip must stay empty');

    assert.deepEqual(errors,[]);
    console.log('Recursive mobile Focus owns the viewport and does not duplicate the board map.');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
