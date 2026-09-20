const assert=require('node:assert/strict');
const { chromium }=require('playwright');

const base=process.env.RELPHI_TEST_URL || 'http://127.0.0.1:8000/tarot.html?board=workflow-v2#tarot';

async function waitReady(page){
  await page.waitForSelector('#relphiOpenDrawingBoardCurrent',{timeout:20000});
  await page.waitForFunction(()=>!!window.RelphiDrawingBoardPrefabsBridge && !!window.RelphiDrawingBoardOptionsBridge && !!window.RelphiTarotLedgerBridge,{timeout:20000});
}
async function openBoard(page){
  const panel=page.locator('#shortListPanel');
  if(!(await panel.isVisible())) await page.click('#relphiOpenDrawingBoardCurrent');
  await panel.waitFor({state:'visible'});
  await page.waitForSelector('#shortListPanel #drawingBoardOptionsButton',{state:'visible',timeout:10000});
}
async function applyCeltic(page){
  await page.click('#drawingBoardOptionsButton');
  await page.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open #relphiSpreadTemplateSelect',{state:'visible'});
  await page.selectOption('#relphiSpreadTemplateSelect','celtic-cross-10');
  await page.click('#relphiApplyOptions');
  await page.waitForFunction(()=>window.RelphiDrawingBoardPrefabsBridge?.getState?.()?.activeLayout?.id==='celtic-cross-10');
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1191,height:859}});
    await page.addInitScript(()=>{
      Object.defineProperty(navigator,'clipboard',{
        configurable:true,
        value:{writeText:async text=>{window.__relphiCopiedReading=String(text||'');}}
      });
    });
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await waitReady(page);
    await openBoard(page);
    await applyCeltic(page);

    await page.locator('.card-row-item[data-row-index="0"] .card-row-drop-card').click();
    await page.waitForSelector('.card-row-item[data-row-index="0"] [data-row-card]',{state:'visible'});
    if(await page.locator('.relphi-focus-reader').count()) await page.click('.relphi-focus-close');

    await page.waitForSelector('#drawing-board-reading-text:not([hidden])',{state:'visible',timeout:10000});
    let card=page.locator('#drawing-board-reading-text .relphi-reading-text-card').first();
    assert.equal(await card.count(),1,'reading text should render one entry for the drawn card');
    assert.match(await card.locator('.relphi-reading-text-position').innerText(),/What covers you/);
    assert.match(await card.locator('h3').innerText(),/\S/);
    assert.match(await card.locator('.relphi-reading-text-association').innerText(),/(Decan ruler|Sign association|Planetary association|Elemental association):/);
    assert.match(await card.locator('.relphi-reading-text-interpretation').innerText(),/\S/);

    await page.evaluate(()=>{
      const snap=window.RelphiDrawingBoardOptionsBridge.capture();
      snap.rowCardReversals={...(snap.rowCardReversals||{}),0:true};
      window.RelphiDrawingBoardOptionsBridge.restore(snap);
    });
    await page.waitForFunction(()=>document.querySelector('#drawing-board-reading-text .relphi-reading-text-card h3')?.textContent?.includes('reversed'));

    card=page.locator('#drawing-board-reading-text .relphi-reading-text-card').first();
    const visibleText=await card.innerText();
    assert.match(visibleText,/reversed/i,'reversed orientation should still be identified');
    assert.doesNotMatch(visibleText,/Same card, same ingredients, inverted orientation/i,'generic reversed boilerplate must not be shown');
    assert.doesNotMatch(visibleText,/Begin with the card.s raw symbolism/i,'orientation-method boilerplate must not be shown');
    assert.match(await card.locator('.relphi-reading-text-interpretation').innerText(),/\S/,'specific reversed interpretation must remain');

    const serialized=await page.evaluate(()=>window.RelphiTarotLedgerBridge.serializeDrawingBoardReading());
    assert.match(serialized,/What covers you/);
    assert.match(serialized,/· reversed/);
    assert.match(serialized,/(Decan ruler|Sign association|Planetary association|Elemental association):/);
    assert.match(serialized,/Relphi interpretation:/);
    assert.doesNotMatch(serialized,/Same card, same ingredients, inverted orientation/i);

    await page.click('#drawing-board-reading-text .relphi-copy-reading');
    await page.waitForFunction(()=>document.querySelector('#drawing-board-reading-text .relphi-copy-reading-status')?.textContent==='Copied.');
    const copied=await page.evaluate(()=>window.__relphiCopiedReading);
    assert.equal(copied,serialized,'Copy must use the same reading serializer shown below the board');

    console.log('Drawing Board reading text and copy serializer checks passed.');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1)});
