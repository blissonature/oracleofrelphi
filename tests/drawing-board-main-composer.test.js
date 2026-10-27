const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const base=process.env.RELPHI_TEST_URL||'http://127.0.0.1:8000/tarot.html?board=workflow-v2#tarot';
const out=path.join(__dirname,'..','test-results');
fs.mkdirSync(out,{recursive:true});

async function openBoard(page){
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForSelector('#relphiOpenDrawingBoardCurrent',{state:'attached',timeout:20000});
  await page.waitForFunction(()=>!!window.RelphiDrawingBoardOptionsBridge&&!!window.RelphiTarotLedgerBridge,null,{timeout:20000});
  const panel=page.locator('#shortListPanel');
  if(!(await panel.isVisible()))await page.locator('#relphiOpenDrawingBoardCurrent').click();
  await page.locator('#relphiMainQuestion').waitFor({state:'visible',timeout:15000});
}
async function assertContained(page,label){
  const metrics=await page.evaluate(()=>{
    const host=document.querySelector('.relphi-main-composer'),outer=document.querySelector('#shortListPanel');
    const r=host?.getBoundingClientRect();
    const overflow=[...host.querySelectorAll('button,select,input,textarea,.relphi-main-question-row')].filter(e=>{
      const box=e.getBoundingClientRect(),style=getComputedStyle(e);
      return style.display!=='none'&&box.width>0&&(box.left<r.left-2||box.right>r.right+2);
    }).map(e=>({tag:e.tagName,outer:e.outerHTML.slice(0,150),rect:e.getBoundingClientRect().toJSON()}));
    return {width:host.clientWidth,scroll:host.scrollWidth,bodyScroll:document.documentElement.scrollWidth,viewport:window.innerWidth,
      within:!!r&&r.left>=-1&&r.right<=window.innerWidth+1,overflow,panel:outer?.getBoundingClientRect().toJSON()};
  });
  assert.equal(metrics.within,true,label+' composer must stay inside viewport: '+JSON.stringify(metrics));
  assert.equal(metrics.overflow.length,0,label+' composer controls must not overflow: '+JSON.stringify(metrics.overflow));
  assert.ok(metrics.scroll<=metrics.width+2,label+' compositor horizontal overflow: '+JSON.stringify(metrics));
}
(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const desktop=await browser.newContext({viewport:{width:1280,height:920}});
    const page=await desktop.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await openBoard(page);
    assert.equal(await page.locator('.relphi-main-composer').isVisible(),true);
    assert.equal(await page.locator('[data-main-default="repeats"]').isChecked(),true,'Repeats must default ON');
    assert.equal(await page.locator('.relphi-main-question-form').isVisible(),true,'composer is always visible');
    await page.locator('#relphiMainQuestion').fill('What is asking for my attention?');
    await page.locator('.relphi-main-question-form button').click();
    assert.equal(await page.locator('[data-main-text]').count(),1);
    await page.locator('#relphiMainQuestion').fill('What is my next step?');
    await page.locator('.relphi-main-question-form button').click();
    assert.equal(await page.locator('[data-main-text]').count(),2);
    await page.locator('[data-main-setting="cards"][data-main-index="0"]').fill('2');
    await page.locator('[data-main-setting="cards"][data-main-index="0"]').dispatchEvent('change');
    assert.equal(await page.locator('[data-main-setting="cards"][data-main-index="0"]').inputValue(),'2');
    await page.locator('[data-main-select="1"]').check();
    await page.locator('[data-main-action="up"]').click();
    assert.equal(await page.locator('[data-main-text="0"]').inputValue(),'What is my next step?');
    await assertContained(page,'Desktop');
    await page.screenshot({path:path.join(out,'drawing-board-main-desktop.png'),fullPage:true});
    await page.reload({waitUntil:'domcontentloaded'});
    const panel=page.locator('#shortListPanel');
    if(!(await panel.isVisible()))await page.locator('#relphiOpenDrawingBoardCurrent').click();
    await page.locator('#relphiMainQuestion').waitFor({state:'visible'});
    assert.equal(await page.locator('[data-main-default="repeats"]').isChecked(),true,'Repeats remains sticky');
    assert.equal(await page.locator('[data-main-text]').count(),2,'Questions survive refresh');
    await page.locator('[data-main-action="ready"]').click();
    await page.waitForFunction(()=>window.RelphiDrawingBoardOptionsBridge?.capture?.()?.shortListPositionLabels?.length===3,null,{timeout:20000});
    const snapshot=await page.evaluate(()=>window.RelphiDrawingBoardOptionsBridge.capture());
    assert.equal(snapshot.shortListPositionLabels.length,3);
    assert.equal(snapshot.rowAllowRepeats,true,'reading maintains Repeats ON');
    assert.equal(await page.locator('.relphi-main-question-text').count(),3,'question list remains in chrome after launch');
    await page.screenshot({path:path.join(out,'drawing-board-main-ready.png'),fullPage:true});
    assert.deepEqual(errors,[],'No browser exceptions on desktop');


    // Source controls must precede Questions and actually populate the same list.
    const sourcesContext=await browser.newContext({viewport:{width:1024,height:840}});
    const sources=await sourcesContext.newPage();
    const sourceErrors=[];sources.on('pageerror',error=>sourceErrors.push(String(error)));
    await openBoard(sources);
    const order=await sources.locator('.relphi-main-input-heading strong,.relphi-main-composer-heading strong').allTextContents();
    assert.deepEqual(order,['Templates','Building Blocks','Sky Connections','Questions'],
      'All source controls must appear in the main chrome before Questions');
    assert.equal(await sources.locator('#relphiMainTemplate').isVisible(),true,'Template selector directly visible');
    assert.equal(await sources.locator('[data-main-building="planet"]').isVisible(),true,'Building Block selectors directly visible');
    await sources.selectOption('#relphiMainTemplate','past-present-future-3');
    await sources.locator('[data-main-action="template-add"]').click();
    assert.deepEqual(await sources.locator('[data-main-text]').evaluateAll(nodes=>nodes.map(n=>n.value)),
      ['Past','Present','Future'],'Template must feed the question list without a mode switch');
    await sources.selectOption('[data-main-building="sign"]','Libra');
    await sources.locator('[data-main-action="blocks-add"]').click();
    assert.equal(await sources.locator('[data-main-text]').count(),6,'Building Block questions append to the same list');
    assert.equal(await sources.locator('[data-main-default="repeats"]').isChecked(),true);
    await sources.reload({waitUntil:'domcontentloaded'});
    if(!(await sources.locator('#shortListPanel').isVisible()))await sources.locator('#relphiOpenDrawingBoardCurrent').click();
    await sources.locator('#relphiMainTemplate').waitFor({state:'visible'});
    assert.equal(await sources.locator('#relphiMainTemplate').inputValue(),'past-present-future-3');
    assert.equal(await sources.locator('[data-main-building="sign"]').inputValue(),'Libra');
    assert.equal(await sources.locator('[data-main-text]').count(),6,'Template and Building Blocks questions persist');
    await sources.screenshot({path:path.join(out,'drawing-board-sources-first.png'),fullPage:true});
    await assertContained(sources,'Sources desktop');
    await sources.locator('[data-main-action="skies"]').click();
    await sources.locator('[data-referent-path="astro"]').waitFor({state:'visible'});
    assert.equal(await sources.locator('.relphi-reading-options-drawer').isVisible(),true,'Sky setup is reachable from main chrome');
    assert.deepEqual(sourceErrors,[]);
    await sourcesContext.close();

    const mobile=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const phone=await mobile.newPage();const mobileErrors=[];
    phone.on('pageerror',e=>mobileErrors.push(String(e)));
    await openBoard(phone);
    assert.equal(await phone.locator('[data-main-default="repeats"]').isChecked(),true);
    await phone.locator('#relphiMainQuestion').fill('What is unfolding?');
    await phone.locator('.relphi-main-question-form button').tap();
    assert.equal(await phone.locator('.relphi-main-question-row').count(),1);
    const mobileOrder=await phone.locator('.relphi-main-input-heading strong,.relphi-main-composer-heading strong').allTextContents();
    assert.deepEqual(mobileOrder,['Templates','Building Blocks','Sky Connections','Questions']);
        await assertContained(phone,'Mobile');
    await phone.screenshot({path:path.join(out,'drawing-board-main-mobile.png'),fullPage:true});
    await phone.locator('[data-main-action="ready"]').tap();
    await phone.waitForFunction(()=>window.RelphiDrawingBoardOptionsBridge?.capture?.()?.shortListPositionLabels?.length===1,null,{timeout:20000});
    assert.equal(await phone.locator('.relphi-main-question-text').count(),1);
    assert.deepEqual(mobileErrors,[],'No browser exceptions on mobile');
    console.log('PASS: permanent composer, sticky Repeats, editable questions, reorder, reload, desktop/mobile, launch');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
