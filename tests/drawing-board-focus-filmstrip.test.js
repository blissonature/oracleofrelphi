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

    const stripBefore=await page.evaluate(()=>{
      const strip=document.querySelector('.relphi-focus-strip');
      const current=strip?.querySelector('.is-current');
      const boxes={};
      strip?.querySelectorAll('[data-focus-position]').forEach(button=>{
        const r=button.getBoundingClientRect();
        boxes[button.dataset.focusPosition]={x:r.x,y:r.y,width:r.width,height:r.height,transform:getComputedStyle(button).transform};
      });
      return {
        current:String(current?.dataset.focusPosition||''),
        fanCount:document.querySelectorAll('.relphi-focus-fan').length,
        modeControlCount:document.querySelectorAll('[data-focus-nav-mode]').length,
        boxes
      };
    });
    assert.equal(stripBefore.current,'6');
    assert.equal(stripBefore.fanCount,0,'motion-heavy fan must be removed from Focus View');
    assert.equal(stripBefore.modeControlCount,0,'retired Fan / Strip mode switch must be removed');
    assert.equal(stripBefore.boxes['6']?.transform,'none','Focus strip cards must not be spatially animated');

    // Direct manipulation remains: one held drag can scrub across several stationary cards.
    const dragStart=await page.locator('.relphi-focus-strip [data-focus-position="6"]').boundingBox();
    const dragTarget=await page.locator('.relphi-focus-strip [data-focus-position="3"]').boundingBox();
    assert.ok(dragStart&&dragTarget,'stable strip scrub fixture must expose drawn cards three spaces apart');
    const startX=dragStart.x+dragStart.width/2;
    const startY=dragStart.y+dragStart.height*.5;
    const targetX=dragTarget.x+dragTarget.width/2;
    const targetY=dragTarget.y+dragTarget.height*.5;
    await page.mouse.move(startX,startY);
    await page.mouse.down();
    await page.mouse.move(targetX,targetY,{steps:12});
    await page.waitForFunction(()=>Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===3);
    const heldAtThree=await page.evaluate(()=>({
      current:String(document.querySelector('.relphi-focus-strip .is-current')?.dataset.focusPosition||''),
      finger:String(document.querySelector('.relphi-focus-strip .is-under-finger')?.dataset.focusPosition||''),
      scrubbing:document.querySelector('.relphi-focus-strip')?.classList.contains('is-scrubbing')||false,
      boxes:Object.fromEntries([...document.querySelectorAll('.relphi-focus-strip [data-focus-position="3"],.relphi-focus-strip [data-focus-position="4"],.relphi-focus-strip [data-focus-position="5"],.relphi-focus-strip [data-focus-position="6"]')].map(button=>{
        const r=button.getBoundingClientRect();
        return [button.dataset.focusPosition,{x:r.x,y:r.y}];
      }))
    }));
    assert.equal(heldAtThree.current,'3','held strip drag must traverse multiple card positions before release');
    assert.equal(heldAtThree.finger,'3','the stationary card beneath the held finger must identify itself immediately');
    assert.equal(heldAtThree.scrubbing,true,'strip must remain in direct-manipulation state while the pointer is held');
    for(const key of ['3','4','5','6']){
      assert.ok(Math.abs(heldAtThree.boxes[key].x-stripBefore.boxes[key].x)<1,'scrubbing must not slide card '+key+' horizontally');
      assert.ok(Math.abs(heldAtThree.boxes[key].y-stripBefore.boxes[key].y)<1,'scrubbing must not bob card '+key+' vertically');
    }
    await page.mouse.up();

    const dragBack=await page.locator('.relphi-focus-strip [data-focus-position="3"]').boundingBox();
    const dragBackTarget=await page.locator('.relphi-focus-strip [data-focus-position="6"]').boundingBox();
    assert.ok(dragBack&&dragBackTarget,'stable strip scrub return fixture must expose both cards');
    await page.mouse.move(dragBack.x+dragBack.width/2,dragBack.y+dragBack.height*.5);
    await page.mouse.down();
    await page.mouse.move(dragBackTarget.x+dragBackTarget.width/2,dragBackTarget.y+dragBackTarget.height*.5,{steps:12});
    await page.waitForFunction(()=>Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===6);
    await page.mouse.up();

    await page.click('.relphi-focus-next');
    await page.waitForFunction(()=>Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===7);
    assert.equal(await page.locator('.relphi-focus-strip .is-current').getAttribute('data-focus-position'),'7','next arrow must advance through the same stable strip');
    assert.equal(await page.locator('.relphi-focus-fan').count(),0,'Next must not resurrect the retired fan');

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
      };
    });

    assert.equal(after.sameNode,true,'drawing in Focus View must update the existing filmstrip instead of replacing it');
    assert.equal(after.current,'8','newly drawn position must become the current filmstrip item');
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

    console.log('Focus View keeps cards spatially stable, direct strip scrubbing traverses multiple cards, scroll is preserved, and card art swaps immediately.');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1)});
