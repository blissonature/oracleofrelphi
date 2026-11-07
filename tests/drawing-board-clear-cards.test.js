// Chromium acceptance for Clear Cards under the persistent Drawing Board chrome.
// Tests existing native state restoration, not obsolete Free/Crafted settings tabs.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.RELPHI_TEST_URL||'http://127.0.0.1:8000/tarot.html?board=workflow-v2#tarot';
async function openBoard(page){
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator('#relphiOpenDrawingBoardCurrent').waitFor({timeout:20000});
 await page.waitForFunction(()=>!!window.RelphiDrawingBoardOptionsBridge&&!!window.RelphiDrawingBoardPrefabsBridge,null,{timeout:20000});
 if(!(await page.locator('#shortListPanel').isVisible()))await page.locator('#relphiOpenDrawingBoardCurrent').click();
 await page.locator('#relphiMainQuestion').waitFor({state:'visible',timeout:15000});
 assert.equal(await page.locator('#relphiBoardSettingsButton').count(),0,'Permanent composer replaces Settings button');
}
async function snapshot(page){
 return page.evaluate(()=>{
  const board=document.getElementById('shortListPanel');
  const state=window.RelphiDrawingBoardOptionsBridge.capture();
  return {open:board&&!board.hidden&&getComputedStyle(board).display!=='none',
   labels:state.shortListPositionLabels||[],
   cards:board.querySelectorAll('.card-row-board [data-row-card]').length,
   placeholders:board.querySelectorAll('.card-row-board .card-row-placeholder-item').length,
   layout:state.rowActiveLayout?.id||null};
 });
}
async function draw(page){
 const before=(await snapshot(page)).cards;
 await page.locator('#drawRandomRowCard').click();
 const random=page.locator('.relphi-attune-reader [data-attune-random]');
 if(await random.waitFor({state:'visible',timeout:3000}).then(()=>true).catch(()=>false))await random.click();
 await page.waitForFunction(before=>document.querySelectorAll('#shortListPanel .card-row-board [data-row-card]').length>before,before,{timeout:20000});
 if(await page.locator('.relphi-focus-close').count())await page.locator('.relphi-focus-close').first().click().catch(()=>{});
}
async function clear(page,expected){
 await page.locator('#clearShortListCardsOnly').click();
 await page.waitForFunction(()=>document.querySelectorAll('#shortListPanel .card-row-board [data-row-card]').length===0,null,{timeout:20000});
 const state=await snapshot(page);
 assert.equal(state.open,true,'Clearing cards keeps Drawing Board open');
 assert.equal(state.cards,0,'Clearing cards removes drawn cards');
 assert.deepEqual(state.labels,expected,'Clearing cards preserves the configured questions');
 assert.equal(state.placeholders,expected.length,'Clearing cards restores configured placeholders');
 return state;
}
async function reset(page){
 await page.locator('#relphiResetBoard').click();
 await page.waitForFunction(()=>{const s=window.RelphiDrawingBoardOptionsBridge.capture();return !s.rowActiveLayout&&!(s.shortList||[]).length&&!(s.shortListPositionLabels||[]).length;},null,{timeout:20000});
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:1280,height:920},{width:390,height:844}]){
   const context=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:viewport.width<600});
   const page=await context.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await openBoard(page);
   await draw(page);
   await clear(page,[]);
   await draw(page);
   await reset(page);
   for(const question of ['What is changing?','What supports me?']){
    await page.locator('#relphiMainQuestion').fill(question);
    await page.locator('[data-main-action="append"]').click();
   }
   await page.locator('[data-main-action="ready"]').click();
   await page.waitForFunction(()=>window.RelphiDrawingBoardOptionsBridge.capture().shortListPositionLabels?.length===2,null,{timeout:20000});
   await draw(page);
   await clear(page,['What is changing?','What supports me?']);
   assert.deepEqual(errors,[],'No desktop/mobile JavaScript exceptions');
   await context.close();
  }
  console.log('PASS Clear Cards: Free and Bespoke after actual draws; desktop and mobile; questions/placeholders retained');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
