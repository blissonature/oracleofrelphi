const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const base = process.env.RELPHI_TEST_URL || 'http://127.0.0.1:8000/tarot.html?board=workflow-v2#tarot';
const out = path.resolve(__dirname,'..','test-results');
fs.mkdirSync(out,{recursive:true});

(async()=>{
  const browser=await chromium.launch({headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1180,height:900}});
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.waitForSelector('#relphiOpenDrawingBoardCurrent',{timeout:20000});
    await page.waitForFunction(() => !!window.RelphiDrawingBoardSpreadPrefabs && !!window.RelphiDrawingBoardPrefabsBridge && !!window.RelphiDrawingBoardOptionsBridge,{timeout:20000});
    if (!(await page.locator('#shortListPanel').isVisible())) await page.click('#relphiOpenDrawingBoardCurrent');
    await page.waitForSelector('#shortListPanel .card-row-workspace-toolbar.relphi-board-controller',{state:'visible'});

    // Magnet geometry is exercised in drawing-board-runtime.test.js on the actual
    // mobile toolbar. This test owns the visible description-layer title alignment.
    await page.click('#drawingBoardOptionsButton');
    await page.waitForSelector('#relphiSpreadTemplateSelect',{state:'visible'});
    await page.selectOption('#relphiSpreadTemplateSelect','focus-1');
    await page.click('#relphiApplyOptions');
    await page.waitForFunction(() => window.RelphiDrawingBoardPrefabsBridge?.getState?.()?.activeLayout?.id==='focus-1');
    await page.locator('.card-row-item[data-row-index="0"] .card-row-drop-card').click();
    await page.waitForSelector('.relphi-focus-reader',{state:'visible'});
    await page.click('.relphi-focus-close');
    const card=page.locator('.card-row-item[data-row-index="0"] [data-row-card]');
    await card.waitFor({state:'visible'});
    await card.hover();
    await page.waitForTimeout(120);

    const geometry=await card.evaluate(card=>{
      const layer=card.querySelector('.or-card-layer.relphi-info-layer');
      const head=layer?.querySelector('.or-layer-head.relphi-info-static');
      const title=layer?.querySelector('.or-card-title-banner.card-title-link');
      if (!layer || !head || !title) return null;
      const cr=card.getBoundingClientRect(), lr=layer.getBoundingClientRect(), hr=head.getBoundingClientRect(), tr=title.getBoundingClientRect();
      const style=getComputedStyle(layer);
      return {
        opacity:Number(style.opacity), visibility:style.visibility, display:style.display,
        cardDelta:(tr.left+tr.width/2)-(cr.left+cr.width/2),
        layerDelta:(tr.left+tr.width/2)-(lr.left+lr.width/2),
        headDelta:(tr.left+tr.width/2)-(hr.left+hr.width/2)
      };
    });
    assert.ok(geometry,'description layer/title must exist');
    assert.notEqual(geometry.display,'none','description layer must be rendered');
    assert.notEqual(geometry.visibility,'hidden','description layer must be visibly open on hover');
    assert.ok(geometry.opacity>.9,'description layer must be visibly open on hover: '+JSON.stringify(geometry));
    assert.ok(Math.abs(geometry.cardDelta)<1,'card-name banner must be centered on the card: '+JSON.stringify(geometry));
    assert.ok(Math.abs(geometry.layerDelta)<1 && Math.abs(geometry.headDelta)<1,'card-name banner must be centered in its description header: '+JSON.stringify(geometry));
    await page.screenshot({path:path.join(out,'drawing-board-desktop-description-title-centered.png'),fullPage:true});
    console.log('Drawing Board visible alignment checks passed');
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
