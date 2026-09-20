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
async function resetBoard(page){
  await page.click('#drawingBoardOptionsButton');
  await page.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open',{state:'visible'});
  await page.click('#relphiResetBoard');
  await page.waitForFunction(()=>{
    const state=window.RelphiDrawingBoardPrefabsBridge?.getState?.();
    return state && !state.activeLayout && state.slotCount===0 && state.hasCards===false;
  });
}
async function applyQuestions(page,labels){
  if(!(await page.locator('.relphi-reading-options-drawer.is-reading-options-open').count())) {
    await page.click('#drawingBoardOptionsButton');
    await page.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open',{state:'visible'});
  }
  const first=page.locator('#relphiPositionLabels .relphi-label-row input').first();
  await first.fill(labels.join(', '));
  await first.dispatchEvent('change');
  await page.waitForFunction(count=>document.querySelectorAll('#relphiPositionLabels .relphi-label-row').length===count,labels.length);
  await page.click('#relphiApplyOptions');
  await page.waitForFunction(count=>{
    const state=window.RelphiDrawingBoardPrefabsBridge?.getState?.();
    return state?.activeLayout?.id==='custom-active' && state.slotCount===count;
  },labels.length);
  await page.click('#zoomCardRowExtents');
  await page.waitForTimeout(180);
}

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await waitReady(page);
    await openBoard(page);

    await resetBoard(page);
    const dense=Array.from({length:50},(_,i)=>`Question ${i+1}: what relationship or pattern is most important to understand in this position now`);
    await applyQuestions(page,dense);

    const denseAudit=await page.evaluate(()=>{
      const snap=window.RelphiDrawingBoardOptionsBridge.capture();
      const xs=[...new Set(Object.values(snap.rowEnvelopeLayout||{}).map(p=>Math.round(Number(p.x))))];
      const ys=[...new Set(Object.values(snap.rowEnvelopeLayout||{}).map(p=>Math.round(Number(p.y))))];
      const rects=[...document.querySelectorAll('#shortListPanel .card-row-board>.card-row-item')].map((item,index)=>{
        const face=item.querySelector('.card-row-drop-card,.card-row-card-wrap');
        const label=item.querySelector(':scope>.card-row-position-panel');
        const pieces=[face,label].filter(Boolean).map(node=>node.getBoundingClientRect());
        return {
          index,
          left:Math.min(...pieces.map(r=>r.left)),
          right:Math.max(...pieces.map(r=>r.right)),
          top:Math.min(...pieces.map(r=>r.top)),
          bottom:Math.max(...pieces.map(r=>r.bottom))
        };
      });
      const overlaps=[];
      for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
        const a=rects[i],b=rects[j];
        const w=Math.min(a.right,b.right)-Math.max(a.left,b.left);
        const h=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
        if(w>1&&h>1) overlaps.push({a:a.index,b:b.index,w,h});
      }
      const scales=Object.values(snap.rowCardTransforms||{}).map(item=>Number(item?.scale)).filter(Number.isFinite);
      return {xs:xs.length,ys:ys.length,overlaps,zoom:Number(snap.rowZoom)||0,minScale:scales.length?Math.min(...scales):1,maxScale:scales.length?Math.max(...scales):1};
    });
    assert.equal(denseAudit.xs,10,`50-position automatic layout should use a 10-column comfortable pack; columns=${denseAudit.xs}`);
    assert.equal(denseAudit.ys,5,`50-position automatic layout should use five rows; rows=${denseAudit.ys}`);
    assert.deepEqual(denseAudit.overlaps,[],'automatic 50-position layout must not overlap card/label envelopes');
    assert.ok(denseAudit.zoom>=.45,'dense layout should remain within supported board zoom');
    assert.ok(denseAudit.minScale>=.32 && denseAudit.maxScale<.45,`50-position pack should use the dense prefab scale band without being clamped back to .45; scales=${denseAudit.minScale}–${denseAudit.maxScale}`);

    await page.click('#drawingBoardOptionsButton');
    await page.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open',{state:'visible'});
    assert.equal(await page.locator('#relphiAddPosition').isDisabled(),true,'Add position must stop at the comfortable 50-position cap');
    await page.click('#relphiCancelOptions');

    await page.evaluate(()=>{
      const bridge=window.RelphiDrawingBoardOptionsBridge;
      const snap=bridge.capture();
      const positions=snap.rowActiveLayout.positions.slice().sort((a,b)=>Number(a.drawOrder)-Number(b.drawOrder));
      const rows=Math.ceil(positions.length/4);
      const xs=[.015,.25,.485,.72];
      const ys=Array.from({length:rows},(_,i)=>.015+i*(.93/Math.max(1,rows-1)));
      positions.forEach((item,index)=>{
        item.transform={x:xs[index%4],y:ys[Math.floor(index/4)],scale:.52,rotation:0,zIndex:1};
        snap.rowEnvelopeLayout[index]={x:item.transform.x*900,y:item.transform.y*760};
        snap.rowCardTransforms[index]={scale:.52,rotation:0,zIndex:1};
      });
      snap.rowActiveLayout.positions=positions;
      bridge.restore(snap);
    });
    await page.waitForFunction(()=>{
      const snap=window.RelphiDrawingBoardOptionsBridge?.capture?.();
      const xs=new Set(Object.values(snap?.rowEnvelopeLayout||{}).map(point=>Math.round(Number(point.x))));
      return xs.size>=8;
    },null,{timeout:5000});
    const migrated=await page.evaluate(()=>{
      const snap=window.RelphiDrawingBoardOptionsBridge.capture();
      return {
        columns:new Set(Object.values(snap.rowEnvelopeLayout||{}).map(point=>Math.round(Number(point.x)))).size,
        activeId:snap.rowActiveLayout?.id||''
      };
    });
    assert.ok(migrated.columns>=8,'legacy locked four-column dense custom readings should migrate to the dense pack in place');
    assert.equal(migrated.activeId,'custom-active','dense migration must preserve the active reading identity');

    await resetBoard(page);
    const short='What matters here?';
    const long='Is the apparent world governed by an intelligence that mistakes itself for ultimate reality and then generates a secondary ordering principle that preserves the illusion through memory and repetition and symbolic inheritance and the apparent continuity of individual experience while also reproducing the conditions under which consciousness mistakes inherited structures for independent beings and mistakes patterned recurrence for evidence of an external governing agency and if so what part of that process is actually objective rather than projected or culturally transmitted?';
    assert.ok(long.length>400,'long-question fixture must exceed every former 90 96 and 240 character clamp');
    await applyQuestions(page,[short,long]);

    const storedQuestions=await page.evaluate(()=> {
      const snap=window.RelphiDrawingBoardOptionsBridge.capture();
      return {
        labels:(snap.shortListPositionLabels||[]).slice(),
        layout:(snap.rowActiveLayout?.positions||[]).slice().sort((a,b)=>Number(a.drawOrder)-Number(b.drawOrder)).map(item=>String(item.label||''))
      };
    });
    assert.equal(storedQuestions.labels[1],long,'applied Drawing Board state must retain the complete long question');
    assert.equal(storedQuestions.layout[1],long,'active layout must retain the complete long question');

    await page.locator('.card-row-item[data-row-index="0"] .card-row-drop-card').click();
    await page.waitForSelector('.card-row-item[data-row-index="0"] [data-row-card]',{state:'visible'});
    await page.waitForSelector('.relphi-focus-reader',{state:'visible'});
    await page.click('.relphi-focus-close');

    const duplicate=await page.evaluate(()=>{
      const bridge=window.RelphiDrawingBoardOptionsBridge;
      const snap=bridge.capture();
      const cardId=String(snap.shortList?.[0]||'');
      if(!cardId)return false;
      snap.shortList=[cardId,cardId];
      snap.shortListPositionCardIds=['',''];
      snap.rowCardReversals={0:false,1:false};
      snap.rowAllowRepeats=true;
      bridge.restore(snap);
      return cardId;
    });
    assert.ok(duplicate,'fixture must draw one card before duplicating it');
    await page.waitForFunction(()=>document.querySelectorAll('#shortListPanel .card-row-board [data-row-card]').length===2);
    await page.waitForSelector('#drawing-board-reading-text:not([hidden])',{state:'visible'});

    const resultQuestion=page.locator('#drawing-board-reading-text .relphi-reading-text-card').nth(1).locator('.relphi-reading-text-position');
    const resultAudit=await resultQuestion.evaluate(node=>({
      text:node.textContent.trim(),
      clientWidth:node.clientWidth,
      scrollWidth:node.scrollWidth,
      clientHeight:node.clientHeight,
      scrollHeight:node.scrollHeight,
      whiteSpace:getComputedStyle(node).whiteSpace,
      overflow:getComputedStyle(node).overflow
    }));
    assert.equal(resultAudit.text,long,'results must preserve the complete question');
    assert.ok(resultAudit.scrollWidth<=resultAudit.clientWidth+1,'results question must wrap instead of clipping horizontally');
    assert.ok(resultAudit.scrollHeight<=resultAudit.clientHeight+1,'results question must expose its full wrapped height');
    assert.equal(resultAudit.whiteSpace,'normal');

    await page.locator('.card-row-item[data-row-index="0"] [data-row-card]').click();
    await page.waitForSelector('.relphi-focus-reader',{state:'visible'});
    const firstArt=await page.locator('.relphi-focus-art-frame').evaluate(node=>{const r=node.getBoundingClientRect();return{width:r.width,height:r.height}});
    assert.equal(await page.locator('.relphi-focus-position').innerText(),short);

    await page.click('.relphi-focus-next');
    await page.waitForFunction(()=>Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===1);
    const secondAudit=await page.evaluate(()=>{
      const frame=document.querySelector('.relphi-focus-art-frame');
      const position=document.querySelector('.relphi-focus-position');
      const panel=document.querySelector('.relphi-focus-position-panel');
      const r=frame.getBoundingClientRect();
      return {
        art:{width:r.width,height:r.height},
        text:position.textContent.trim(),
        positionClientWidth:position.clientWidth,
        positionScrollWidth:position.scrollWidth,
        panelClientHeight:panel.clientHeight,
        panelScrollHeight:panel.scrollHeight
      };
    });
    assert.equal(secondAudit.text,long,'focus view must preserve the complete question');
    assert.ok(secondAudit.positionScrollWidth<=secondAudit.positionClientWidth+1,'focus question must wrap instead of clipping horizontally');
    assert.ok(secondAudit.panelScrollHeight>=secondAudit.panelClientHeight,'long Focus questions may scroll vertically but must not be truncated from the stored/displayed text');
    assert.ok(Math.abs(secondAudit.art.width-firstArt.width)<=1 && Math.abs(secondAudit.art.height-firstArt.height)<=1,
      `same card/orientation must keep the same focus art scale regardless of question length: short=${JSON.stringify(firstArt)} long=${JSON.stringify(secondAudit.art)}`);

    console.log('Drawing Board dense packing and question-layout checks passed.');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1)});
