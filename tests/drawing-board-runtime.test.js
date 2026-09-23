const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const base = process.env.RELPHI_TEST_URL || 'http://127.0.0.1:8000/tarot.html?board=workflow-v2#tarot';
const out = path.resolve(__dirname,'..','test-results');
fs.mkdirSync(out,{recursive:true});
let browser;

async function waitReady(page) {
  await page.waitForSelector('#relphiOpenDrawingBoardCurrent',{timeout:20000});
  await page.waitForFunction(() => !!window.RelphiDrawingBoardSpreadPrefabs && !!window.RelphiDrawingBoardPrefabsBridge && !!window.RelphiDrawingBoardOptionsBridge && !!window.RelphiTarotLedgerBridge,{timeout:20000});
}
async function openBoard(page) {
  const panel=page.locator('#shortListPanel');
  if (!(await panel.isVisible())) await page.click('#relphiOpenDrawingBoardCurrent');
  await panel.waitFor({state:'visible'});
  await page.waitForSelector('#shortListPanel #zoomCardRowExtents',{timeout:10000});
}
async function applyCeltic(page) {
  await page.click('#drawingBoardOptionsButton');
  await page.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open #relphiSpreadTemplateSelect',{state:'visible'});
  await page.selectOption('#relphiSpreadTemplateSelect','celtic-cross-10');
  await page.click('#relphiApplyOptions');
  await page.waitForFunction(() => window.RelphiDrawingBoardPrefabsBridge?.getState?.()?.activeLayout?.id === 'celtic-cross-10');
  await page.click('#zoomCardRowExtents');
  await page.waitForTimeout(120);
}
async function boardState(page) {
  return page.evaluate(() => ({
    prefab:window.RelphiDrawingBoardPrefabsBridge?.getState?.(),
    snap:window.RelphiDrawingBoardOptionsBridge?.capture?.()
  }));
}
async function assertContained(page) {
  const result=await page.evaluate(() => {
    const root=document.querySelector('#shortListPanel');
    const workspace=root?.querySelector('.card-row-workspace');
    const toolbar=root?.querySelector('.card-row-workspace-toolbar');
    if (!workspace) return {ok:false,reason:'no workspace'};
    const w=workspace.getBoundingClientRect();
    const t=toolbar?.getBoundingClientRect();
    const failures=[];
    root.querySelectorAll('.card-row-board>.card-row-item').forEach((item,index)=>{
      const face=item.querySelector('.card-row-card-wrap,.card-row-drop-card');
      const label=item.querySelector('.card-row-position-panel');
      [face,label].filter(Boolean).forEach((node,nodeIndex)=>{
        const r=node.getBoundingClientRect();
        if (r.left < w.left-3 || r.right > w.right+3 || r.top < w.top-3 || r.bottom > w.bottom+3) failures.push({index,node:nodeIndex?'label':'face',rect:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},workspace:{left:w.left,right:w.right,top:w.top,bottom:w.bottom}});
        if (t && r.left < t.right && r.right > t.left && r.top < t.bottom && r.bottom > t.top) failures.push({index,node:nodeIndex?'label':'face',reason:'toolbar-overlap'});
      });
    });
    return {ok:failures.length===0,failures};
  });
  assert.equal(result.ok,true,JSON.stringify(result.failures));
}
async function assertReadableFocus(page) {
  const result=await page.evaluate(()=>{
    const reader=document.querySelector('.relphi-focus-reader');
    const art=reader?.querySelector('.relphi-focus-art');
    const entry=reader?.querySelector('.relphi-focus-entry');
    const positionPanel=reader?.querySelector('.relphi-focus-position-panel');
    const position=positionPanel?.querySelector('.relphi-focus-position');
    if (!reader || !art || !entry || !positionPanel || !position) return {ok:false};
    const index=Number(reader.dataset.focusIndex);
    const item=document.querySelector(`#shortListPanel .card-row-item[data-row-index="${index}"]`);
    const card=item?.querySelector('[data-row-card]');
    const reversed=!!item?.classList.contains('is-row-reversed') || card?.dataset.rowReversed==='true' || !!card?.classList.contains('is-row-reversed');
    const matrix=new DOMMatrix(getComputedStyle(art).transform);
    const ar=art.getBoundingClientRect(), er=entry.getBoundingClientRect();
    return {
      ok:true,reversed,
      naturalWidth:art.naturalWidth,
      matrixA:matrix.a,matrixD:matrix.d,
      position:position.textContent.trim(),
      positionPanelIsShellRow:positionPanel.parentElement?.classList.contains('relphi-focus-shell') || false,
      positionPanelInsideMain:!!positionPanel.closest('.relphi-focus-main'),
      positionPanelInsideEntry:!!positionPanel.closest('.relphi-focus-entry'),
      positionPanelCssPosition:getComputedStyle(positionPanel).position,
      entryText:entry.textContent.trim(),
      hasTitle:!!entry.querySelector('.full-entry-title-block h2'),
      duplicateArtVisible:!!entry.querySelector('.tarot-card-art') && getComputedStyle(entry.querySelector('.tarot-card-art')).display!=='none',
      reversedMeaning:entry.querySelectorAll('[data-relphi-focus-reversed]').length,
      reversedBadgeVisible:!!reader.querySelector('.relphi-focus-reversed-badge') && !reader.querySelector('.relphi-focus-reversed-badge').hidden,
      mobileStack:ar.bottom<=er.top+3,
      artChildren:reader.querySelector('.relphi-focus-art-frame')?.children.length || 0
    };
  });
  assert.equal(result.ok,true);
  assert.ok(result.naturalWidth>0,'focus art must load');
  assert.match(result.position,/\S/,'spread position must be visible outside the art');
  assert.equal(result.positionPanelIsShellRow,true,'question / position must be a dedicated focus-shell row');
  assert.equal(result.positionPanelInsideMain,false,'question / position must not scroll with focus main');
  assert.equal(result.positionPanelInsideEntry,false,'question / position must not belong to the Ledger entry');
  assert.equal(result.positionPanelCssPosition,'static','question / position panel must remain statically positioned');
  assert.ok(result.entryText.length>100,'focus view must contain the full Tarot Ledger entry');
  assert.equal(result.hasTitle,true,'full Ledger title block must be present');
  assert.equal(result.duplicateArtVisible,false,'Ledger entry must not duplicate or cover the dedicated card art');
  assert.equal(result.mobileStack,true,'mobile focus view must stack the full card above the Ledger entry');
  assert.equal(result.artChildren,1,'nothing may be layered over the card art');
  assert.equal(result.reversedBadgeVisible,result.reversed,'Reversed callout must exactly match the card orientation');
  if (result.reversed) {
    assert.ok(result.matrixA<-.8 && result.matrixD<-.8,'a reversed draw must show reversed card art');
    assert.equal(result.reversedMeaning,1,'reversed meaning must appear only for a reversed draw');
  } else {
    assert.ok(result.matrixA>.8 && result.matrixD>.8,'an upright draw must show upright card art');
    assert.equal(result.reversedMeaning,0,'upright draws must not be labeled or interpreted as reversed');
  }
}


(async()=>{
  browser=await chromium.launch({headless:true});

  const mobile=await browser.newPage({viewport:{width:390,height:844}});
  const mobileErrors=[];
  mobile.on('pageerror',error=>mobileErrors.push(String(error)));
  await mobile.goto(base,{waitUntil:'domcontentloaded'});
  await waitReady(mobile);
  await openBoard(mobile);
  assert.equal(await mobile.locator('#zoomCardRowExtents').count(),1);
  assert.equal(await mobile.locator('.relphi-tool-trigger[data-tool="more"]').count(),1,'advanced board tools should live behind one ellipsis button');
  assert.equal(await mobile.locator('.relphi-tool-trigger[data-tool="snaps"]').count(),0,'Snaps should not occupy the main zoom toolbar');
  assert.equal(await mobile.locator('.relphi-tool-trigger[data-tool="background"]').count(),0,'Background should not occupy the main zoom toolbar');
  const zoomOrder=await mobile.evaluate(()=>{
    const plus=document.querySelector('.relphi-zoom-step[aria-label="Zoom in"]');
    const fit=document.querySelector('#zoomCardRowExtents');
    return !!plus && !!fit && !!(plus.compareDocumentPosition(fit)&Node.DOCUMENT_POSITION_FOLLOWING);
  });
  assert.equal(zoomOrder,true,'Zoom Extents must sit after the + button');
  await mobile.click('.relphi-tool-trigger[data-tool="more"]');
  await mobile.waitForSelector('.relphi-tool-flyout:not([hidden])',{state:'visible'});
  assert.equal(await mobile.locator('#rowSnapEnabled').count(),1,'ellipsis menu should contain Snaps');
  assert.equal(await mobile.locator('#rowTableColor').count(),1,'ellipsis menu should contain Background controls');
  assert.equal(await mobile.locator('#relphiToggleTransformEditing').getAttribute('aria-pressed'),'false','rotation and scale editing must begin locked');
  await mobile.click('.relphi-tool-trigger[data-tool="more"]');
  await mobile.waitForSelector('#drawing-board-post-export #downloadRowHtml',{state:'visible'});
  await mobile.waitForSelector('#drawing-board-post-export #downloadRowJson',{state:'visible'});
  assert.equal(await mobile.locator('.card-row-action-staging').evaluate(node=>getComputedStyle(node).display),'none');
  const bg=await mobile.locator('.card-row-workspace').evaluate(node=>getComputedStyle(node).backgroundColor);
  assert.notEqual(bg,'rgba(0, 0, 0, 0)');

  await applyCeltic(mobile);
  let state=await boardState(mobile);
  assert.equal(state.prefab.slotCount,10);
  assert.equal(state.snap.rowCardTransforms['1']?.rotation ?? state.snap.rowCardTransforms[1]?.rotation,0);
  const p0=state.snap.rowEnvelopeLayout['0'] || state.snap.rowEnvelopeLayout[0];
  const p1=state.snap.rowEnvelopeLayout['1'] || state.snap.rowEnvelopeLayout[1];
  assert.ok(p1.x > p0.x + 100,'crossing card should begin to the right of covering card');
  const ys=[6,7,8,9].map(i=>(state.snap.rowEnvelopeLayout[String(i)]||state.snap.rowEnvelopeLayout[i]).y);
  for(let i=1;i<ys.length;i++) assert.ok(Math.abs(ys[i]-ys[i-1])>=160,'Celtic staff spacing should remain readable');
  await assertContained(mobile);
  await mobile.screenshot({path:path.join(out,'drawing-board-mobile-celtic-before.png'),fullPage:true});

  await mobile.locator('.card-row-item[data-row-index="0"] .card-row-drop-card').click();
  await mobile.waitForSelector('.card-row-item[data-row-index="0"] [data-row-card]',{state:'visible'});
  await mobile.waitForSelector('.relphi-focus-reader',{state:'visible'});
  assert.equal(await mobile.locator('.relphi-focus-strip>button').count(),10);
  assert.equal(await mobile.locator('.relphi-focus-fan>button').count(),10,'Fan navigation must represent every reading position');
  assert.equal(await mobile.locator('.relphi-focus-reader').getAttribute('data-focus-nav-mode'),'fan','Fan navigation should be the default Card Focus mode');
  assert.ok(await mobile.locator('.relphi-focus-fan>button').evaluateAll(buttons=>buttons.filter(button=>Number(getComputedStyle(button).opacity)>.25).length)>=3,'Fan navigation must keep neighboring cards visible together');
  const focusIngredientTabs=mobile.locator('.relphi-focus-entry [data-ingredient-tab]');
  assert.ok(await focusIngredientTabs.count()>=2,'Focused full Ledger entry must expose multiple ingredient tabs for the drawn card');
  const firstFocusTab=focusIngredientTabs.nth(0), secondFocusTab=focusIngredientTabs.nth(1);
  const firstTarget=await firstFocusTab.getAttribute('data-ingredient-tab');
  const secondTarget=await secondFocusTab.getAttribute('data-ingredient-tab');
  assert.equal(await firstFocusTab.getAttribute('aria-selected'),'true','Focused Ledger entry must start on its first ingredient');
  await secondFocusTab.click();
  assert.equal(await secondFocusTab.getAttribute('aria-selected'),'true','Clicking an ingredient tab in Card Focus must select it');
  assert.equal(await firstFocusTab.getAttribute('aria-selected'),'false','Selecting another ingredient must clear the prior focused tab');
  assert.equal(await mobile.locator(`.relphi-focus-entry [data-ingredient-panel="${firstTarget}"]`).isHidden(),true,'Prior ingredient panel must hide when another tab is selected');
  assert.equal(await mobile.locator(`.relphi-focus-entry [data-ingredient-panel="${secondTarget}"]`).isVisible(),true,'Selected ingredient panel must become visible in Card Focus');
  await secondFocusTab.press('ArrowLeft');
  assert.equal(await firstFocusTab.getAttribute('aria-selected'),'true','Ingredient tabs in Card Focus must support arrow-key navigation');
  assert.equal(await mobile.locator('.relphi-focus-draw').count(),0,'Card Focus must not duplicate drawing in a separate top-row button');
  assert.equal(await mobile.locator('.relphi-focus-position-panel>.relphi-focus-close').count(),1,'Card Focus close control must live beside the question');
  assert.equal(await mobile.locator('#shortListPanel [data-row-reverse]').count(),0,'randomly drawn cards must not show the manual card flipper');
  await assertReadableFocus(mobile);
  const transformDisplay=await mobile.locator('.card-row-item[data-row-index="0"] .card-row-transform-box').evaluate(node=>getComputedStyle(node).display);
  assert.equal(transformDisplay,'none','rotation/scale gizmos must start hidden');
  await mobile.screenshot({path:path.join(out,'drawing-board-mobile-focus.png'),fullPage:true});
  await mobile.click('.relphi-focus-next');
  await mobile.waitForFunction(() => Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===1);
  assert.equal(await mobile.locator('.card-row-item[data-row-index="1"] [data-row-card]').count(),1,'Draw in Card Focus must draw the next position');
  const titleGeometry=await mobile.locator('.card-row-item[data-row-index="0"] [data-row-card]').evaluate(card=>{
    card.classList.add('relphi-description-open');
    const layer=card.querySelector('.or-card-layer.relphi-info-layer');
    const title=layer?.querySelector('.or-card-title-banner.card-title-link');
    const head=layer?.querySelector('.or-layer-head.relphi-info-static');
    if (!layer || !title || !head) return null;
    const lr=layer.getBoundingClientRect(), tr=title.getBoundingClientRect(), hr=head.getBoundingClientRect();
    return {layerDelta:(tr.left+tr.width/2)-(lr.left+lr.width/2),headDelta:(tr.left+tr.width/2)-(hr.left+hr.width/2)};
  });
  assert.ok(titleGeometry && Math.abs(titleGeometry.layerDelta)<=1.25 && Math.abs(titleGeometry.headDelta)<=1.25,'description-layer title must be centered on the card within subpixel rendering tolerance: '+JSON.stringify(titleGeometry));
  await mobile.screenshot({path:path.join(out,'drawing-board-mobile-description-title-centered.png'),fullPage:true});
  await mobile.locator('.card-row-item[data-row-index="0"] [data-row-card]').evaluate(card=>card.classList.remove('relphi-description-open'));

  await mobile.waitForSelector('.relphi-focus-reader',{state:'visible'});
  await assertReadableFocus(mobile);
  await mobile.keyboard.press('ArrowLeft');
  await mobile.waitForFunction(() => Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===0);
  await mobile.keyboard.press('ArrowRight');
  await mobile.waitForFunction(() => Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===1);
  await mobile.evaluate(()=>{
    window.__relphiFocusGap=false;
    window.__relphiFocusGapObserver=new MutationObserver(()=>{
      if (!document.querySelector('.relphi-focus-reader')) window.__relphiFocusGap=true;
    });
    window.__relphiFocusGapObserver.observe(document.body,{childList:true,subtree:true});
  });
  await mobile.click('.relphi-focus-next');
  await mobile.waitForFunction(() => Number(document.querySelector('.relphi-focus-reader')?.dataset.focusIndex)===2);
  const focusGap=await mobile.evaluate(()=>{
    window.__relphiFocusGapObserver?.disconnect();
    return !!window.__relphiFocusGap;
  });
  assert.equal(focusGap,false,'drawing the next card from focus view must not expose a frame without the focus reader');
  await mobile.waitForFunction(() => window.RelphiDrawingBoardOptionsBridge?.capture?.()?.rowPositionMeta?.some?.(meta => meta?.celticCrossAcknowledged === true));
  state=await boardState(mobile);
  const crossingIndex=state.snap.rowPositionMeta.findIndex(meta=>meta?.id==='crossing');
  const coveringIndex=state.snap.rowPositionMeta.findIndex(meta=>meta?.id==='covering');
  const crossed0=state.snap.rowEnvelopeLayout[String(coveringIndex)]||state.snap.rowEnvelopeLayout[coveringIndex];
  const crossed1=state.snap.rowEnvelopeLayout[String(crossingIndex)]||state.snap.rowEnvelopeLayout[crossingIndex];
  assert.equal(Math.round(crossed1.x),Math.round(crossed0.x));
  assert.equal(Math.round(crossed1.y),Math.round(crossed0.y));
  assert.equal(state.snap.rowCardTransforms[String(crossingIndex)]?.rotation ?? state.snap.rowCardTransforms[crossingIndex]?.rotation,90);
  assert.equal(await mobile.locator('#shortListPanel.relphi-celtic-crossed').count(),1);
  await assertContained(mobile);
  await mobile.screenshot({path:path.join(out,'drawing-board-mobile-celtic-crossed.png'),fullPage:true});
  if (await mobile.locator('.relphi-focus-reader').count()) await mobile.click('.relphi-focus-close');
  await mobile.click('.relphi-tool-trigger[data-tool="more"]');
  await mobile.click('#relphiToggleTransformEditing');
  const unlockedDisplay=await mobile.locator('.card-row-item[data-row-index="0"] .card-row-transform-box').evaluate(node=>getComputedStyle(node).display);
  assert.notEqual(unlockedDisplay,'none','explicit unlock should reveal rotation/scale editing');
  await mobile.click('#relphiToggleTransformEditing');
  assert.equal(await mobile.locator('#relphiToggleTransformEditing').getAttribute('aria-pressed'),'false');
  await mobile.click('.relphi-tool-trigger[data-tool="more"]');

  await mobile.click('#drawingBoardOptionsButton');
  await mobile.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open',{state:'visible'});
  await mobile.click('#relphiResetBoard');
  await mobile.waitForFunction(() => {
    const state=window.RelphiDrawingBoardPrefabsBridge?.getState?.();
    return state && !state.activeLayout && state.slotCount===0 && state.hasCards===false;
  });
  await mobile.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open',{state:'visible'});
  await mobile.waitForTimeout(100);
  assert.equal(await mobile.locator('#shortListPanel').isVisible(),true,'Reset Board must keep the Drawing Board visible');
  assert.equal(await mobile.locator('#relphiOpenDrawingBoardCurrent').getAttribute('aria-expanded'),'true','Reset Board must keep the outer Drawing Board toggle open');
  assert.equal(await mobile.locator('#shortListPanel .card-row-drawing-board').evaluate(node=>node.open),true,'Reset Board must keep the Drawing Board drawer expanded');
  assert.equal(await mobile.locator('.relphi-reading-options-drawer.is-reading-options-open').count(),1);
  await mobile.locator('#relphiTemplateName').scrollIntoViewIfNeeded();
  const drawerGeometry=await mobile.locator('.relphi-reading-options-drawer.is-reading-options-open').evaluate(drawer=>{
    const body=drawer.querySelector('.relphi-options-body');
    const field=drawer.querySelector('#relphiTemplateName');
    const bar=drawer.querySelector('.relphi-options-commitbar');
    const f=field.getBoundingClientRect(), b=bar.getBoundingClientRect(), d=drawer.getBoundingClientRect();
    return {fieldVisible:f.bottom>d.top && f.top<d.bottom,overlap:f.bottom>b.top && f.top<b.bottom,bodyOverflow:getComputedStyle(body).overflowY};
  });
  assert.equal(drawerGeometry.fieldVisible,true,'last options field should remain reachable');
  assert.equal(drawerGeometry.overlap,false,'options commit bar must not cover the last field');
  assert.ok(['auto','scroll'].includes(drawerGeometry.bodyOverflow),'options body should own scrolling');
  await mobile.screenshot({path:path.join(out,'drawing-board-mobile-reset-options.png'),fullPage:true});

  const bulkQuestions=['What is changing?','What needs release?','What supports me?'];
  const firstQuestion=mobile.locator('#relphiPositionLabels .relphi-label-row input').first();
  await firstQuestion.fill(bulkQuestions.join(', '));
  await firstQuestion.dispatchEvent('change');
  await mobile.waitForFunction(count => document.querySelectorAll('#relphiPositionLabels .relphi-label-row').length===count,bulkQuestions.length);
  assert.equal(await mobile.locator('#relphiPositionLabels').count(),1,'Options must show the individual label editor');
  assert.equal(await mobile.locator('#relphiPositionLabels .relphi-label-row').count(),3,'comma-separated questions should create three individual label fields');
  assert.deepEqual(await mobile.locator('#relphiPositionLabels .relphi-label-row input').evaluateAll(nodes=>nodes.map(node=>node.value)),bulkQuestions,'individual label fields must mirror the comma-separated first field');
  await mobile.screenshot({path:path.join(out,'drawing-board-mobile-comma-list-questions.png'),fullPage:true});
  await mobile.click('#relphiApplyOptions');
  await mobile.waitForFunction(() => {
    const state=window.RelphiDrawingBoardPrefabsBridge?.getState?.();
    return state?.activeLayout?.id==='custom-active' && state.slotCount===3;
  });
  state=await boardState(mobile);
  assert.deepEqual(state.snap.shortListPositionLabels,bulkQuestions,'comma-separated questions should become board position labels');

  await mobile.click('#drawingBoardOptionsButton');
  await mobile.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open',{state:'visible'});
  await mobile.click('#relphiResetBoard');
  await mobile.waitForFunction(() => {
    const state=window.RelphiDrawingBoardPrefabsBridge?.getState?.();
    return state && !state.activeLayout && state.slotCount===0 && state.hasCards===false;
  });
  await mobile.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open',{state:'visible'});
  await mobile.selectOption('#relphiSpreadTemplateSelect','six-polarities-houses-12');
  await mobile.click('#relphiApplyOptions');
  await mobile.waitForFunction(() => window.RelphiDrawingBoardPrefabsBridge?.getState?.()?.activeLayout?.id === 'six-polarities-houses-12');
  await mobile.click('#zoomCardRowExtents');
  await mobile.waitForTimeout(120);
  state=await boardState(mobile);
  const polarityX=new Set(Object.values(state.snap.rowEnvelopeLayout).map(point=>Math.round(point.x)));
  const polarityY=new Set(Object.values(state.snap.rowEnvelopeLayout).map(point=>Math.round(point.y)));
  assert.equal(polarityX.size,4,'Six Polarities should use four columns');
  assert.equal(polarityY.size,3,'Six Polarities should use three rows');
  await assertContained(mobile);
  await mobile.screenshot({path:path.join(out,'drawing-board-mobile-six-polarities.png'),fullPage:true});
  assert.deepEqual(mobileErrors,[]);


  const compact=await browser.newPage({viewport:{width:390,height:700}});
  const compactErrors=[];
  compact.on('pageerror',error=>compactErrors.push(String(error)));
  await compact.goto(base,{waitUntil:'domcontentloaded'});
  await waitReady(compact);
  await openBoard(compact);
  await applyCeltic(compact);
  await assertContained(compact);
  await compact.screenshot({path:path.join(out,'drawing-board-mobile-compact-celtic.png'),fullPage:true});
  assert.deepEqual(compactErrors,[]);
  await compact.close();

  const desktop=await browser.newPage({viewport:{width:1440,height:1000}});
  const desktopErrors=[];
  desktop.on('pageerror',error=>desktopErrors.push(String(error)));
  await desktop.goto(base,{waitUntil:'domcontentloaded'});
  await waitReady(desktop);
  await openBoard(desktop);
  await desktop.click('#drawingBoardOptionsButton');
  await desktop.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open',{state:'visible'});
  const desktopOptions=await desktop.locator('.relphi-reading-options-drawer.is-reading-options-open').evaluate(drawer=>{
    const r=drawer.getBoundingClientRect();
    const host=drawer.parentElement.getBoundingClientRect();
    const firstSection=drawer.querySelector('.relphi-options-body>:first-child');
    return {left:r.left,right:r.right,viewport:innerWidth,hostLeft:host.left,firstIsLabels:firstSection?.classList.contains('relphi-labels-section') && !!firstSection?.querySelector('#relphiPositionLabels')};
  });
  assert.ok(desktopOptions.left>=desktopOptions.hostLeft-1 && desktopOptions.left<=desktopOptions.hostLeft+20,'Options must open against the left side of its Drawing Board host');
  assert.ok(desktopOptions.left>=0 && desktopOptions.right<=desktopOptions.viewport,'Options must not be cut off horizontally');
  const optionsOverflow=await desktop.locator('.relphi-reading-options-drawer.is-reading-options-open').evaluate(drawer=>{
    const dr=drawer.getBoundingClientRect();
    const offenders=[];
    drawer.querySelectorAll('input,textarea,select,button,label,.relphi-draw-options,.relphi-template-save').forEach(node=>{
      const r=node.getBoundingClientRect();
      if (r.width>0 && (r.left < dr.left-1 || r.right > dr.right+1)) offenders.push({tag:node.tagName,id:node.id||'',cls:node.className||'',left:r.left,right:r.right,drawerLeft:dr.left,drawerRight:dr.right});
    });
    return offenders;
  });
  assert.deepEqual(optionsOverflow,[],'no Options control may overflow or be clipped by the drawer');
  assert.equal(desktopOptions.firstIsLabels,true,'Questions / position labels must be the first Options section');
  assert.equal(await desktop.locator('#relphiPositionLabels').count(),1,'Options must expose the individual position-label editor');
  await desktop.screenshot({path:path.join(out,'drawing-board-desktop-options-left.png'),fullPage:true});
  await desktop.click('#relphiCancelOptions');
  await applyCeltic(desktop);
  await assertContained(desktop);
  await desktop.screenshot({path:path.join(out,'drawing-board-desktop-celtic.png'),fullPage:true});

  await desktop.locator('.card-row-item[data-row-index="9"] .card-row-drop-card').click();
  await desktop.waitForSelector('.relphi-focus-reader',{state:'visible'});
  const desktopFocus=await desktop.evaluate(()=>{
    const artEl=document.querySelector('.relphi-focus-art');
    const art=artEl?.getBoundingClientRect();
    const entry=document.querySelector('.relphi-focus-entry')?.getBoundingClientRect();
    const paneEl=document.querySelector('.relphi-focus-art-pane');
    const pane=paneEl?.getBoundingClientRect();
    if (!artEl || !art || !entry || !pane) return null;
    const nw=artEl.naturalWidth||1, nh=artEl.naturalHeight||1;
    const scale=Math.min(art.width/nw,art.height/nh);
    const renderedW=nw*scale, renderedH=nh*scale;
    const rendered={left:art.left+(art.width-renderedW)/2,right:art.left+(art.width+renderedW)/2,top:art.top+(art.height-renderedH)/2,bottom:art.top+(art.height+renderedH)/2};
    return {
      sideBySide:art.right<=entry.left+3,
      entryText:document.querySelector('.relphi-focus-entry')?.textContent?.trim().length||0,
      objectFit:getComputedStyle(artEl).objectFit,
      paneOverflow:getComputedStyle(paneEl).overflow,
      paneScrollable:paneEl.scrollHeight>=paneEl.clientHeight&&paneEl.scrollWidth>=paneEl.clientWidth,
      rendered,pane:{left:pane.left,right:pane.right,top:pane.top,bottom:pane.bottom}
    };
  });
  await desktop.screenshot({path:path.join(out,'drawing-board-desktop-focus-full-entry.png'),fullPage:true});
  assert.ok(desktopFocus?.sideBySide,'desktop focus view must show full art beside the Ledger entry: '+JSON.stringify(desktopFocus));
  assert.equal(desktopFocus?.objectFit,'contain','desktop focus art must use contain rather than crop');
  assert.equal(desktopFocus?.paneOverflow,'auto','desktop focus art pane must remain a bounded scroll container if a long question reduces available height');
  assert.ok(desktopFocus?.paneScrollable,'desktop focus art must remain reachable without shrinking when available height is reduced: '+JSON.stringify(desktopFocus));
  assert.ok(desktopFocus.entryText>100,'desktop focus view must show the full Ledger entry');
  let semantic=await boardState(desktop);
  const outcomeIndex=semantic.snap.rowPositionMeta.findIndex(meta=>meta?.id==='outcome');
  assert.equal(outcomeIndex,0,'targeted draw should occupy the next native slot while preserving the requested semantic position');
  assert.equal(await desktop.locator(`.card-row-item[data-row-index="${outcomeIndex}"] [data-row-card]`).count(),1);
  assert.deepEqual(semantic.prefab.activeLayout.positions.map(position=>position.id),['covering','crossing','crowning','beneath','behind','before','self','house','hopes-fears','outcome']);
  await desktop.click('.relphi-focus-close');

  await desktop.click('#drawRandomRowCard');
  await desktop.waitForSelector('.relphi-focus-reader',{state:'visible'});
  semantic=await boardState(desktop);
  const nextCoveringIndex=semantic.snap.rowPositionMeta.findIndex(meta=>meta?.id==='covering');
  assert.equal(nextCoveringIndex,1,'Draw should fill the next canonical position after an out-of-order targeted draw');
  assert.equal(await desktop.locator(`.card-row-item[data-row-index="${nextCoveringIndex}"] [data-row-card]`).count(),1);
  const focusTitles=await desktop.locator('.relphi-focus-strip>button').evaluateAll(buttons=>buttons.map(button=>button.title));
  assert.match(focusTitles[0],/covers/i);
  assert.match(focusTitles[9],/come/i);
  await desktop.click('.relphi-focus-close');

  await desktop.click('#drawRandomRowCard');
  await desktop.waitForSelector('.relphi-focus-reader',{state:'visible'});
  semantic=await boardState(desktop);
  let semanticCrossingIndex=semantic.snap.rowPositionMeta.findIndex(meta=>meta?.id==='crossing');
  assert.equal(semanticCrossingIndex,2,'the crossing position should be resolved semantically after out-of-order draws');
  assert.match(await desktop.locator('.relphi-focus-position').textContent(),/crosses/i);
  await desktop.click('.relphi-focus-next');
  await desktop.waitForFunction(() => window.RelphiDrawingBoardOptionsBridge?.capture?.()?.rowPositionMeta?.some?.(meta => meta?.id === 'crossing' && meta?.celticCrossAcknowledged === true));
  semantic=await boardState(desktop);
  semanticCrossingIndex=semantic.snap.rowPositionMeta.findIndex(meta=>meta?.id==='crossing');
  assert.equal(semanticCrossingIndex,2);
  const crossingVisual=await desktop.locator('.card-row-item[data-relphi-position-id="crossing"]').evaluate(item=>{
    const face=item.querySelector('.card-row-card-wrap');
    const itemMatrix=new DOMMatrix(getComputedStyle(item).transform);
    const faceMatrix=new DOMMatrix(getComputedStyle(face).transform);
    return {index:Number(item.dataset.rowIndex),itemB:itemMatrix.b,itemC:itemMatrix.c,faceB:faceMatrix.b,faceC:faceMatrix.c};
  });
  assert.equal(crossingVisual.index,2);
  assert.ok(Math.abs(crossingVisual.itemB)<.01 && Math.abs(crossingVisual.itemC)<.01,'crossing position label should remain upright');
  assert.ok(Math.abs(crossingVisual.faceB)>.9 && Math.abs(crossingVisual.faceC)>.9,'crossing card face should rotate ninety degrees');
  if (await desktop.locator('.relphi-focus-reader').count()) await desktop.click('.relphi-focus-close');

  assert.deepEqual(desktopErrors,[]);

  const manual=await browser.newPage({viewport:{width:1024,height:768}});
  await manual.goto(base,{waitUntil:'domcontentloaded'});
  await waitReady(manual);
  await manual.click('#showAllCards');
  await manual.waitForSelector('[data-shortlist]',{state:'visible'});
  const manualAdd=manual.locator('[data-shortlist][aria-pressed="false"]').first();
  await manualAdd.click();
  await openBoard(manual);
  await manual.waitForSelector('#shortListPanel [data-row-card]',{state:'visible'});
  assert.equal(await manual.locator('#shortListPanel [data-row-reverse]').count(),1,'a card explicitly added from the Ledger must expose the manual flip control');
  assert.equal(await manual.locator('#shortListPanel .card-row-transform-box').evaluate(node=>getComputedStyle(node).display),'none','manually-added cards must still start with transform gizmos locked');
  await manual.screenshot({path:path.join(out,'drawing-board-desktop-manual-card-flipper.png'),fullPage:true});
  await manual.close();

  console.log('Drawing Board browser acceptance checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();});
