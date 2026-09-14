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
  await page.waitForFunction(() => !!window.RelphiDrawingBoardSpreadPrefabs && !!window.RelphiDrawingBoardPrefabsBridge && !!window.RelphiDrawingBoardOptionsBridge,{timeout:20000});
}
async function openBoard(page) {
  const panel=page.locator('#shortListPanel');
  if (!(await panel.isVisible())) await page.click('#relphiOpenDrawingBoardCurrent');
  await panel.waitFor({state:'visible'});
  await page.waitForSelector('#shortListPanel .card-row-workspace-toolbar.relphi-board-controller',{state:'visible'});
  await page.waitForSelector('#drawing-board-post-export',{state:'visible'});
}
async function applyTemplate(page,id) {
  await page.click('#drawingBoardOptionsButton');
  await page.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open #relphiSpreadTemplateSelect',{state:'visible'});
  await page.selectOption('#relphiSpreadTemplateSelect',id);
  await page.click('#relphiApplyOptions');
  await page.waitForFunction(id => window.RelphiDrawingBoardPrefabsBridge?.getState?.()?.activeLayout?.id === id,id);
  await page.click('#zoomCardRowExtents');
  await page.waitForTimeout(120);
}
async function assertContained(page) {
  const result=await page.evaluate(() => {
    const root=document.querySelector('#shortListPanel');
    const workspace=root?.querySelector('.card-row-workspace');
    const toolbar=root?.querySelector('.card-row-workspace-toolbar.relphi-board-controller');
    if (!workspace) return {ok:false,failures:['no workspace']};
    const w=workspace.getBoundingClientRect();
    const t=toolbar?.getBoundingClientRect();
    const failures=[];
    root.querySelectorAll('.card-row-board>.card-row-item').forEach((item,index)=>{
      const face=item.querySelector('.card-row-card-wrap,.card-row-drop-card');
      const label=item.querySelector('.card-row-position-panel');
      [face,label].filter(Boolean).forEach((node,nodeIndex)=>{
        const r=node.getBoundingClientRect();
        if (r.left<w.left-3 || r.right>w.right+3 || r.top<w.top-3 || r.bottom>w.bottom+3) failures.push({index,node:nodeIndex?'label':'face',reason:'outside'});
        if (t && r.left<t.right && r.right>t.left && r.top<t.bottom && r.bottom>t.top) failures.push({index,node:nodeIndex?'label':'face',reason:'toolbar-overlap'});
      });
    });
    return {ok:failures.length===0,failures};
  });
  assert.equal(result.ok,true,JSON.stringify(result.failures));
}
async function assertFocusArtVisible(page) {
  const result=await page.evaluate(()=>{
    const card=document.querySelector('.relphi-focus-card-host>.or-card');
    const art=card?.querySelector('.or-card-art');
    const layer=card?.querySelector('.or-card-layer.relphi-info-layer');
    const scroll=card?.querySelector('.or-layer-scroll');
    if (!card || !art || !layer || !scroll) return {ok:false};
    const c=card.getBoundingClientRect();
    const a=art.getBoundingClientRect();
    const s=scroll.getBoundingClientRect();
    const bg=getComputedStyle(layer).backgroundColor;
    return {
      ok:true,
      naturalWidth:art.naturalWidth,
      artOpacity:Number(getComputedStyle(art).opacity),
      layerBackground:bg,
      exposedHeight:s.top-c.top,
      cardHeight:c.height,
      scrollHeight:s.height,
      artHeight:a.height
    };
  });
  assert.equal(result.ok,true,'focused reader should contain card art and interpretation');
  assert.ok(result.naturalWidth>0,'focused card artwork must load');
  assert.ok(result.artOpacity>.9,'focused card artwork must remain visible');
  assert.equal(result.layerBackground,'rgba(0, 0, 0, 0)','full-card interpretation layer must be transparent');
  assert.ok(result.exposedHeight>=result.cardHeight*.40,`focused reader should expose at least 40% of the art before interpretation; got ${Math.round(result.exposedHeight/result.cardHeight*100)}%`);
  assert.ok(result.scrollHeight<=result.cardHeight*.50,'interpretation panel must not swallow the card art');
}

(async()=>{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await waitReady(page);
  await openBoard(page);

  // Only the unified compact toolbar may ever be visible.
  const toolbarState=await page.locator('#shortListPanel .card-row-workspace-toolbar').evaluate(node=>({
    canonical:node.classList.contains('relphi-board-controller'),
    visibility:getComputedStyle(node).visibility,
    opacity:Number(getComputedStyle(node).opacity),
    helper:node.textContent.includes('Drag the table background to pan')
  }));
  assert.equal(toolbarState.canonical,true);
  assert.equal(toolbarState.helper,false,'obsolete native Zoom/Center helper must not survive enhancement');
  assert.equal(toolbarState.visibility,'visible');
  assert.ok(toolbarState.opacity>.9);

  // Export controls are permanent document chrome, not trapped in hidden Options.
  for (const id of ['snapshotCardRowArrangement','downloadRowHtml','downloadRowTextHtml','downloadRowJson','printCardRowImage']) {
    await page.waitForSelector(`#drawing-board-post-export #${id}`,{state:'visible',timeout:10000});
  }

  await applyTemplate(page,'celtic-cross-10');
  for (let i=0;i<10;i++) {
    await page.click('#drawRandomRowCard');
    await page.waitForSelector('.relphi-focus-reader',{state:'visible'});
    if (i===0) {
      await assertFocusArtVisible(page);
      await page.screenshot({path:path.join(out,'drawing-board-mobile-focus-art-visible.png'),fullPage:true});
    }
    await page.click('.relphi-focus-close');
    await page.waitForSelector('.relphi-focus-reader',{state:'detached'});
  }
  assert.equal(await page.locator('#shortListPanel .card-row-board [data-row-card]').count(),10,'full Celtic Cross should contain ten drawn cards');
  await page.click('#zoomCardRowExtents');
  await page.waitForTimeout(150);
  await assertContained(page);
  const allLabels=await page.locator('#shortListPanel .card-row-position-panel').evaluateAll(nodes=>nodes.map(node=>({text:node.textContent.trim(),visible:getComputedStyle(node).display!=='none'})));
  assert.equal(allLabels.filter(item=>item.visible).length,10,'all ten Celtic position labels must remain visible');
  await page.screenshot({path:path.join(out,'drawing-board-mobile-celtic-full.png'),fullPage:true});

  const jsonDownload=page.waitForEvent('download');
  await page.click('#drawing-board-post-export #downloadRowJson');
  const jsonFile=await jsonDownload;
  assert.match(jsonFile.suggestedFilename(),/\.json$/i,'board-data export should still download');

  // Reset leaves Options usable, including the last save-template control. Reset
  // intentionally re-renders the drawer, so query the replacement DOM only after
  // that asynchronous render has settled rather than retaining a stale locator.
  await page.click('#drawingBoardOptionsButton');
  await page.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open',{state:'visible'});
  await page.click('#relphiResetBoard');
  await page.waitForFunction(() => window.RelphiDrawingBoardPrefabsBridge?.getState?.()?.slotCount===0);
  await page.waitForTimeout(180);
  await page.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open #relphiSaveTemplate',{state:'attached'});
  const saveGeometry=await page.evaluate(()=>{
    const drawer=document.querySelector('.relphi-reading-options-drawer.is-reading-options-open');
    const button=drawer?.querySelector('#relphiSaveTemplate');
    const body=drawer?.querySelector('.relphi-options-body');
    const bar=drawer?.querySelector('.relphi-options-commitbar');
    if (!drawer || !button || !body || !bar) return {inside:false,overlap:true,missing:true};
    body.scrollTop=body.scrollHeight;
    const b=button.getBoundingClientRect(),d=drawer.getBoundingClientRect(),c=bar.getBoundingClientRect();
    return {inside:b.top>=d.top && b.bottom<=d.bottom,overlap:b.bottom>c.top && b.top<c.bottom,missing:false};
  });
  assert.equal(saveGeometry.missing,false,'Save template control must exist after Reset Board');
  assert.equal(saveGeometry.inside,true,'Save template must be reachable inside the mobile Options drawer');
  assert.equal(saveGeometry.overlap,false,'Save template must not be covered by the commit bar');

  await page.selectOption('#relphiSpreadTemplateSelect','six-polarities-houses-12');
  await page.click('#relphiApplyOptions');
  await page.waitForFunction(() => window.RelphiDrawingBoardPrefabsBridge?.getState?.()?.activeLayout?.id==='six-polarities-houses-12');
  await page.click('#zoomCardRowExtents');
  await page.waitForTimeout(120);
  await assertContained(page);
  const polarityGeometry=await page.evaluate(()=>{
    const snap=window.RelphiDrawingBoardOptionsBridge.capture();
    const points=Object.values(snap.rowEnvelopeLayout||{});
    return {xs:new Set(points.map(p=>Math.round(p.x))).size,ys:new Set(points.map(p=>Math.round(p.y))).size};
  });
  assert.deepEqual(polarityGeometry,{xs:4,ys:3},'Six Polarities should use the board as a four-column, three-row field');
  await page.screenshot({path:path.join(out,'drawing-board-mobile-six-polarities-verified.png'),fullPage:true});

  assert.deepEqual(errors,[]);
  console.log('Drawing Board iPhone regression checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();});
