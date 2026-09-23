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

    await page.locator('.card-row-item[data-row-index="0"] .card-row-drop-card').evaluate(node=>node.click());
    await page.waitForSelector('.relphi-focus-reader',{state:'visible'});
    await page.waitForFunction(()=>Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===0);

    for(let next=1;next<=6;next++){
      await page.click('.relphi-focus-next');
      await page.waitForFunction(index=>Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===index,next);
    }

    const fanBefore=await page.evaluate(()=>{
      const reader=document.querySelector('.relphi-focus-reader');
      const fan=reader?.querySelector('.relphi-focus-fan');
      const current=fan?.querySelector('.is-current');
      const visible=[...(fan?.querySelectorAll('[data-focus-position]')||[])].filter(button=>Number(getComputedStyle(button).opacity)>.25);
      return {
        mode:reader?.dataset.focusNavMode||'',
        visible:visible.length,
        current:String(current?.dataset.focusPosition||''),
        currentTransform:current?.style.transform||'',
        transition:getComputedStyle(current).transitionProperty
      };
    });
    assert.equal(fanBefore.mode,'fan','Card Focus should open in fan mode by default');
    assert.ok(fanBefore.visible>=3,`fan mode must juxtapose neighboring cards; visible=${fanBefore.visible}`);
    assert.equal(fanBefore.current,'6');
    assert.match(fanBefore.transition,/transform/,'fan cards must animate position changes');

    // Direct manipulation: one held drag may scrub across several cards before release.
    const dragStart=await page.locator('.relphi-focus-fan [data-focus-position="6"]').boundingBox();
    const dragNeighbor=await page.locator('.relphi-focus-fan [data-focus-position="5"]').boundingBox();
    assert.ok(dragStart&&dragNeighbor,'fan scrub fixture must expose adjacent drawn cards');
    const spacing=Math.abs((dragStart.x+dragStart.width/2)-(dragNeighbor.x+dragNeighbor.width/2));
    assert.ok(spacing>15,`fan scrub spacing must be measurable; spacing=${spacing}`);
    const startX=dragStart.x+dragStart.width/2;
    const startY=dragStart.y+dragStart.height*.42;
    await page.mouse.move(startX,startY);
    await page.mouse.down();
    await page.mouse.move(startX-spacing*3,startY,{steps:12});
    await page.waitForFunction(()=>Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===3);
    const heldAtThree=await page.evaluate(()=>({
      current:String(document.querySelector('.relphi-focus-fan .is-current')?.dataset.focusPosition||''),
      finger:String(document.querySelector('.relphi-focus-fan .is-under-finger')?.dataset.focusPosition||''),
      scrubbing:document.querySelector('.relphi-focus-fan')?.classList.contains('is-scrubbing')||false
    }));
    assert.equal(heldAtThree.current,'3','held fan drag must traverse multiple card positions before release');
    assert.equal(heldAtThree.finger,'3','the card beneath the held finger must identify itself immediately');
    assert.equal(heldAtThree.scrubbing,true,'fan must remain in direct-manipulation state while the pointer is held');
    await page.mouse.up();

    const dragBack=await page.locator('.relphi-focus-fan [data-focus-position="3"]').boundingBox();
    const dragBackNeighbor=await page.locator('.relphi-focus-fan [data-focus-position="4"]').boundingBox();
    assert.ok(dragBack&&dragBackNeighbor,'fan scrub return fixture must expose adjacent cards');
    const backSpacing=Math.abs((dragBackNeighbor.x+dragBackNeighbor.width/2)-(dragBack.x+dragBack.width/2));
    const backX=dragBack.x+dragBack.width/2;
    const backY=dragBack.y+dragBack.height*.42;
    await page.mouse.move(backX,backY);
    await page.mouse.down();
    await page.mouse.move(backX+backSpacing*3,backY,{steps:12});
    await page.waitForFunction(()=>Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===6);
    await page.mouse.up();

    await page.click('.relphi-focus-next');
    await page.waitForFunction(()=>Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===7);
    await page.waitForTimeout(120);
    const fanAfter=await page.evaluate(()=>({
      current:String(document.querySelector('.relphi-focus-fan .is-current')?.dataset.focusPosition||''),
      previousTransform:document.querySelector('.relphi-focus-fan [data-focus-position="6"]')?.style.transform||''
    }));
    assert.equal(fanAfter.current,'7','next arrow must advance the selected card through the fan');
    assert.notEqual(fanAfter.previousTransform,fanBefore.currentTransform,'the prior current card must animate into its neighboring fan position');

    await page.click('[data-focus-nav-mode="strip"]');
    await page.waitForFunction(()=>document.querySelector('.relphi-focus-reader')?.dataset.focusNavMode==='strip');
    assert.equal(await page.locator('.relphi-focus-strip').isVisible(),true,'Strip must remain available as an alternate navigation mode');

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
    assert.equal(before.readerIndex,7);
    assert.equal(before.current,'7');

    await page.click('.relphi-focus-next');
    await page.waitForFunction(()=>Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===8);
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
        currentVisible:!!(sr&&cr&&cr.left>=sr.left-1&&cr.right<=sr.right+1),
        mode:document.querySelector('.relphi-focus-reader')?.dataset.focusNavMode||''
      };
    });

    assert.equal(after.sameNode,true,'drawing in Focus View must update the existing filmstrip instead of replacing it');
    assert.equal(after.current,'8','newly drawn position must become the current filmstrip item');
    assert.equal(after.mode,'strip','the chosen navigation mode must persist while moving through cards');
    assert.ok(after.scrollLeft>50,`drawing a new card must not reset filmstrip scroll to the beginning; before=${after.before}, after=${after.scrollLeft}`);
    assert.ok(Math.abs(after.scrollLeft-after.before)<100,`filmstrip should move only as much as needed to reveal the next position; before=${after.before}, after=${after.scrollLeft}`);
    assert.equal(after.currentVisible,true,'new current position must remain visible after preserving filmstrip scroll');

    await page.click('.relphi-focus-prev');
    await page.waitForFunction(()=>Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===7);
    const artBeforeNext=await page.evaluate(()=>{
      const art=document.querySelector('.relphi-focus-art');
      window.__relphiFocusArtNode=art;
      window.__relphiFocusArtSrc=art?.currentSrc||art?.src||'';
      return {src:window.__relphiFocusArtSrc,alt:art?.alt||''};
    });
    assert.ok(artBeforeNext.src,'fixture must expose Focus card art before navigating next');

    await page.click('.relphi-focus-next');
    await page.waitForFunction(()=>Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===8);
    const artAfterNext=await page.evaluate(()=> {
      const art=document.querySelector('.relphi-focus-art');
      return {
        sameNode:art===window.__relphiFocusArtNode,
        beforeSrc:String(window.__relphiFocusArtSrc||''),
        src:art?.currentSrc||art?.src||'',
        alt:art?.alt||''
      };
    });
    assert.equal(artAfterNext.sameNode,false,'Focus View must replace the image node immediately when moving to the next question so the previous card cannot linger');
    assert.notEqual(artAfterNext.src,artAfterNext.beforeSrc,'next Focus question must point at its own card art');

    console.log('Focus View fan animates neighboring cards, Strip preserves scroll, and card art swaps immediately while navigating.');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1)});
