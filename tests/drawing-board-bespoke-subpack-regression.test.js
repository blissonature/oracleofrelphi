const assert=require('node:assert/strict');
const {chromium}=require('playwright');

const url=process.env.RELPHI_TEST_URL||'http://127.0.0.1:8000/tarot.html?board=workflow-v2#tarot';

async function configure(page,{saveTemplate=false}={}) {
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.RelphiTarotLedgerBridge?.drawCardForBoardScope && !!window.RelphiDrawingBoardOptionsBridge,{timeout:30000});
  const panel=page.locator('#shortListPanel');
  if(!(await panel.isVisible())) await page.locator('#relphiOpenDrawingBoardCurrent').click();
  await panel.waitFor({state:'visible',timeout:15000});
  await page.locator('#relphiBoardSettingsButton').click();
  await page.locator('#drawingBoardOptionsButton').click();
  await page.locator('[data-referent-path="bespoke"]').click();
  await page.locator('#relphiBulkReferents').fill('What is moving?, Which zodiac sign is relevant?');
  await page.locator('#relphiParseReferents').click();
  await page.waitForFunction(()=>document.querySelectorAll('#relphiPositionLabels [data-question-select]').length===2,{timeout:10000});
  await page.locator('[data-question-select="1"]').check();
  await page.locator('#relphiQuestionControllerPack').selectOption('zodiac-majors');

  assert.equal(await page.locator('#relphiQuestionControllerPack').inputValue(),'zodiac-majors','Question 2 must display its selected sub-pack');

  if(saveTemplate){
    await page.locator('#relphiTemplateName').fill('Zodiac Sub-pack Test');
    await page.locator('#relphiSaveTemplate').click();
    const saved=await page.evaluate(()=>{
      const all=JSON.parse(localStorage.getItem('relphiDrawingBoardSpreadTemplatesV3')||'[]');
      return all.find(p=>p.name==='Zodiac Sub-pack Test');
    });
    assert.equal(saved?.positions?.[1]?.drawScope,'zodiac-majors','saved template must persist Question 2 pack');
    assert.equal(saved?.positions?.[0]?.drawScope,'full','saved template must not overwrite Question 1 pack');
  }

  await page.locator('#relphiApplyOptions').click();
  await page.waitForFunction(()=>window.RelphiDrawingBoardOptionsBridge?.capture()?.rowPositionMeta?.length===2,{timeout:15000});
  const state=await page.evaluate(()=>window.RelphiDrawingBoardOptionsBridge.capture());
  assert.deepEqual(state.rowPositionMeta.map(m=>m.drawScope),['full','zodiac-majors'],'the layout must preserve distinct question sub-packs');
}

async function assertDrawnZodiac(page){
  await page.waitForSelector('.relphi-attune-reader[data-attune-scope="zodiac-majors"]',{state:'visible',timeout:15000});
  await page.locator('[data-attune-random]').click();
  await page.waitForFunction(()=>window.RelphiDrawingBoardOptionsBridge?.capture()?.shortList?.length===1,{timeout:15000});
  const card=await page.evaluate(()=>{
    const state=window.RelphiDrawingBoardOptionsBridge.capture();
    return window.RELPHI_TAROT_CARDS.find(c=>c.card_id===state.shortList[0]);
  });
  assert.equal(card?.card_type,'Major','zodiac-only question must never draw a pip');
  assert.ok(card?.astrology?.sign,'drawn card must have a zodiac sign correspondence');
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    // Regression: answering Question 2 first must not borrow the full-pack pool
    // from the native append slot allocated to Question 1.
    const page=await browser.newPage({viewport:{width:1100,height:850}});
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await configure(page);
    await page.evaluate(()=>document.querySelector('#shortListPanel .card-row-board>.card-row-item[data-row-index="1"]')?.click());
    await assertDrawnZodiac(page);
    assert.deepEqual(errors,[],'out-of-order drawing must have no runtime exceptions');
    await page.close();

    // Regression: saving the Bespoke template must not erase Question 2's pack.
    const savedPage=await browser.newPage({viewport:{width:1100,height:850}});
    const saveErrors=[];
    savedPage.on('pageerror',e=>saveErrors.push(String(e)));
    await configure(savedPage,{saveTemplate:true});
    await savedPage.locator('.relphi-board-toast-action').click();
    await savedPage.waitForSelector('.relphi-attune-reader',{state:'visible'});
    await savedPage.locator('.relphi-attune-close').click();
    await savedPage.evaluate(()=>document.querySelector('#shortListPanel .card-row-board>.card-row-item[data-row-index="1"]')?.click());
    await assertDrawnZodiac(savedPage);
    assert.deepEqual(saveErrors,[],'saved reading must have no runtime exceptions');
    await savedPage.close();
    console.log('Bespoke Question 2 zodiac sub-pack: saved and out-of-order draws verified.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
