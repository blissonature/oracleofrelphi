const assert=require('node:assert/strict');
const {chromium}=require('playwright');

const url=process.env.RELPHI_TEST_URL||'http://127.0.0.1:8000/tarot.html?board=workflow-v2#tarot';

async function configure(page) {
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.RelphiTarotLedgerBridge?.drawCardForBoardScope && !!window.RelphiDrawingBoardOptionsBridge,{timeout:30000});
  const panel=page.locator('#shortListPanel');
  if(!(await panel.isVisible())) await page.locator('#relphiOpenDrawingBoardCurrent').click();
  await panel.waitFor({state:'visible',timeout:15000});
  await page.locator('#relphiBoardSettingsButton').click();
  await page.locator('#drawingBoardOptionsButton').click();
  await page.locator('[data-referent-path="bespoke"]').click();
  await page.locator('[data-position-label="0"]').fill('What is moving?, Which zodiac sign is relevant?');
  await page.locator('[data-position-label="0"]').press('Tab');
  await page.waitForFunction(()=>document.querySelectorAll('#relphiPositionLabels [data-question-select]').length===2,{timeout:10000});
  await page.locator('[data-question-select="1"]').check();
  assert.equal(await page.locator('#relphiQuestionControllerPack').isEnabled(),true,'checking Question 2 alone must enable its sub-pack control');
  assert.equal(await page.locator('[data-question-select="0"]').isChecked(),false,'Question 1 must stay unselected');
  await page.locator('#relphiQuestionControllerPack').selectOption('zodiac-majors');

  assert.equal(await page.locator('#relphiQuestionControllerPack').inputValue(),'zodiac-majors','Question 2 must display its selected sub-pack');


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

    console.log('Bespoke Question 2 zodiac sub-pack: individual selection and out-of-order draw verified.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
