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
}
async function resetAndApplyQuestions(page,labels){
  await page.click('#drawingBoardOptionsButton');
  await page.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open',{state:'visible'});
  await page.click('#relphiResetBoard');
  await page.waitForFunction(()=>{
    const state=window.RelphiDrawingBoardPrefabsBridge?.getState?.();
    return state && !state.activeLayout && state.slotCount===0 && state.hasCards===false;
  });
  const first=page.locator('#relphiPositionLabels .relphi-label-row input').first();
  await first.fill(labels.join(', '));
  await first.dispatchEvent('change');
  await page.waitForFunction(count=>document.querySelectorAll('#relphiPositionLabels .relphi-label-row').length===count,labels.length);
  await page.click('#relphiApplyOptions');
  await page.waitForFunction(count=>{
    const state=window.RelphiDrawingBoardPrefabsBridge?.getState?.();
    return state?.activeLayout?.id==='custom-active' && state.slotCount===count;
  },labels.length);
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await waitReady(page);
    await openBoard(page);

    const labels=Array.from({length:20},(_,i)=>`Question ${i+1}`);
    await resetAndApplyQuestions(page,labels);

    await page.locator('.card-row-item[data-row-index="0"] .card-row-drop-card').click();
    await page.waitForSelector('.relphi-focus-reader',{state:'visible'});
    await page.waitForFunction(()=>Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===0);

    for(let next=1;next<=6;next++){
      await page.click('.relphi-focus-draw');
      await page.waitForFunction(index=>Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===index,next);
    }

    const before=await page.evaluate(()=>{
      const strip=document.querySelector('.relphi-focus-strip');
      const current=strip?.querySelector('.is-current');
      if(!strip||!current)return null;
      const max=Math.max(0,strip.scrollWidth-strip.clientWidth);
      strip.scrollLeft=Math.min(max,Math.max(90,current.offsetLeft-strip.clientWidth*.45));
      window.__relphiFilmstripNode=strip;
      window.__relphiFilmstripScrollBefore=strip.scrollLeft;
      return {
        scrollLeft:strip.scrollLeft,
        max,
        readerIndex:Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex),
        current:String(current.dataset.focusPosition||'')
      };
    });
    assert.ok(before,'focus filmstrip should exist');
    assert.ok(before.max>100,`fixture must overflow horizontally; max=${before.max}`);
    assert.ok(before.scrollLeft>50,`fixture must begin away from strip origin; scrollLeft=${before.scrollLeft}`);
    assert.equal(before.readerIndex,6);
    assert.equal(before.current,'6');

    await page.click('.relphi-focus-draw');
    await page.waitForFunction(()=>Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===7);
    await page.waitForTimeout(120);

    const after=await page.evaluate(()=>{
      const strip=document.querySelector('.relphi-focus-strip');
      const current=strip?.querySelector('.is-current');
      const sr=strip?.getBoundingClientRect();
      const cr=current?.getBoundingClientRect();
      return {
        sameNode:strip===window.__relphiFilmstripNode,
        before:Number(window.__relphiFilmstripScrollBefore)||0,
        scrollLeft:Number(strip?.scrollLeft)||0,
        current:String(current?.dataset.focusPosition||''),
        currentVisible:!!(sr&&cr&&cr.left>=sr.left-1&&cr.right<=sr.right+1)
      };
    });

    assert.equal(after.sameNode,true,'drawing in Focus View must update the existing filmstrip instead of replacing it');
    assert.equal(after.current,'7','newly drawn position must become the current filmstrip item');
    assert.ok(after.scrollLeft>50,`drawing a new card must not reset filmstrip scroll to the beginning; before=${after.before}, after=${after.scrollLeft}`);
    assert.ok(Math.abs(after.scrollLeft-after.before)<100,`filmstrip should move only as much as needed to reveal the next position; before=${after.before}, after=${after.scrollLeft}`);
    assert.equal(after.currentVisible,true,'new current position must remain visible after preserving filmstrip scroll');

    console.log('Focus View filmstrip keeps its scroll position while drawing new cards.');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1)});
