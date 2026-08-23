const assert = require('node:assert/strict');
const { chromium } = require('playwright');

let browser;

(async () => {
  const executablePath = process.env.RELPHI_BROWSER_EXECUTABLE || undefined;
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    screen: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);

  await page.goto('http://127.0.0.1:8000/drawing-board/tarot.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.RelphiDrawingBoardPrefabsBridge && !!window.RelphiDrawingBoardSpreadPrefabs && window.__relphiDrawingBoardCelticMobileV1 === true);

  console.log('Applying the shipped eleven-card Celtic Cross on an iPhone viewport');
  await page.evaluate(() => {
    localStorage.removeItem('relphiDrawingBoardCelticCenterViewV1');
    localStorage.removeItem('relphiDrawingBoardExtendedZoomV1');
    const layout = window.RelphiDrawingBoardSpreadPrefabs.shipped.find(item => item.id === 'celtic-cross-11');
    if (!layout) throw new Error('Missing shipped eleven-card Celtic Cross');
    if (!window.RelphiDrawingBoardPrefabsBridge.applyLayout(JSON.parse(JSON.stringify(layout)), { designMode:false })) {
      throw new Error('Could not apply shipped eleven-card Celtic Cross');
    }
  });
  await page.waitForFunction(() => window.RelphiDrawingBoardPrefabsBridge.getState().activeLayout?.id === 'celtic-cross-11');
  await page.locator('#shortListPanel .card-row-item[data-row-index="10"]').waitFor({ state: 'attached' });

  console.log('Drawing one card so the real board viewport is visible for measurement');
  await page.locator('#drawRandomRowCard').click();
  await page.locator('#shortListPanel [data-row-card]').first().waitFor({ state: 'visible' });
  await page.locator('#shortListPanel .card-row-item[data-row-index="10"]').waitFor({ state: 'visible' });

  const control = page.locator('#shortListPanel .relphi-celtic-view-control');
  await control.waitFor({ state: 'visible' });

  assert.equal(await control.evaluate(node => !!node.closest('.card-row-board')), false, 'Cross/Uncross must not live inside the movable card board');
  assert.equal((await control.innerText()).trim(), 'Uncross');

  const center = async () => page.evaluate(() => [0,1,2].map(index => {
    const item = document.querySelector('#shortListPanel .card-row-item[data-row-index="' + index + '"]');
    return {
      index,
      role:item?.dataset.relphiCelticRole || '',
      left:parseFloat(item?.style.left || '0'),
      top:parseFloat(item?.style.top || '0'),
      z:Number(item?.style.zIndex || 0),
      rotation:parseFloat(item?.style.getPropertyValue('--row-card-rotation') || '0')
    };
  }));

  console.log('Confirming the canonical crossed stack is significator, covering, then clockwise crossing');
  const crossed = await center();
  assert.deepEqual(crossed.map(item => item.role), ['significator','covering','crossing']);
  assert.equal(crossed[0].left, crossed[1].left);
  assert.equal(crossed[1].left, crossed[2].left);
  assert.equal(crossed[0].top, crossed[1].top);
  assert.equal(crossed[1].top, crossed[2].top);
  assert.ok(crossed[0].z < crossed[1].z && crossed[1].z < crossed[2].z, 'Significator must be bottom, covering middle, crossing top');
  assert.equal(crossed[0].rotation, 0);
  assert.equal(crossed[1].rotation, 0);
  assert.equal(crossed[2].rotation, 90, 'Crossing card must rotate ninety degrees clockwise');

  console.log('Uncrossing the center and forcing the same live redraw used by pinch zoom');
  await control.click();
  await page.waitForFunction(() => window.RelphiDrawingBoardPrefabsBridge.getState().centerOpen === true);
  await page.waitForFunction(() => document.querySelector('.relphi-celtic-view-control')?.textContent.trim() === 'Cross');
  const openBeforeZoom = await center();
  assert.ok(openBeforeZoom[0].left < openBeforeZoom[1].left && openBeforeZoom[1].left < openBeforeZoom[2].left);
  assert.deepEqual(openBeforeZoom.map(item => item.rotation), [0,0,0]);

  const controlBoxBefore = await control.boundingBox();
  await page.locator('#rowZoom').evaluate(input => {
    input.value = '0.60';
    input.dispatchEvent(new Event('input', { bubbles:true }));
  });
  await page.waitForTimeout(80);
  const openAfterZoomRedraw = await center();
  assert.ok(openAfterZoomRedraw[0].left < openAfterZoomRedraw[1].left && openAfterZoomRedraw[1].left < openAfterZoomRedraw[2].left, 'Zoom redraw must not visually restore the crossed stack');
  assert.equal(await page.evaluate(() => window.RelphiDrawingBoardPrefabsBridge.getState().centerOpen), true, 'Pinch/zoom must preserve Uncrossed state');
  assert.equal((await control.innerText()).trim(), 'Cross');

  console.log('Zooming all the way out below the old forty-five-percent floor');
  await page.locator('#rowZoom').evaluate(input => {
    input.value = '0.20';
    input.dispatchEvent(new Event('input', { bubbles:true }));
    input.dispatchEvent(new Event('change', { bubbles:true }));
  });
  await page.waitForTimeout(100);
  assert.equal(await page.locator('#rowZoom').getAttribute('min'), '0.2');
  assert.equal(Number(await page.locator('#rowZoom').inputValue()), 0.2);
  assert.equal((await page.locator('#rowZoomValue').innerText()).trim(), '20%');
  assert.match(await page.locator('.relphi-celtic-zoom-layer').getAttribute('style'), /scale\(/);

  const controlBoxAfter = await control.boundingBox();
  assert.ok(controlBoxBefore && controlBoxAfter);
  assert.ok(Math.abs(controlBoxBefore.x - controlBoxAfter.x) < 1.5, 'Cross/Uncross control must not move horizontally with board zoom');
  assert.ok(Math.abs(controlBoxBefore.y - controlBoxAfter.y) < 1.5, 'Cross/Uncross control must not move vertically with board zoom');

  console.log('Confirming both the cross cluster and ladder cluster fit in the mobile viewport at maximum zoom-out');
  const visibility = await page.evaluate(() => {
    const workspace = document.querySelector('#shortListPanel .card-row-workspace').getBoundingClientRect();
    const rect = index => document.querySelector('#shortListPanel .card-row-item[data-row-index="' + index + '"]').getBoundingClientRect();
    const cross = rect(5); // What is behind you: left edge of central cross cluster.
    const ladder = rect(10); // What will come: top card of right-side staff/ladder.
    const inside = box => box.left >= workspace.left - 2 && box.right <= workspace.right + 2 && box.top >= workspace.top - 2 && box.bottom <= workspace.bottom + 2;
    return {
      workspace:{ left:workspace.left, right:workspace.right, top:workspace.top, bottom:workspace.bottom },
      cross:{ left:cross.left, right:cross.right, top:cross.top, bottom:cross.bottom },
      ladder:{ left:ladder.left, right:ladder.right, top:ladder.top, bottom:ladder.bottom },
      crossInside:inside(cross),
      ladderInside:inside(ladder)
    };
  });
  assert.equal(visibility.crossInside, true, 'Central Celtic Cross cluster must be visible at maximum zoom-out');
  assert.equal(visibility.ladderInside, true, 'Right-side Celtic ladder/staff must be visible at maximum zoom-out');

  console.log('Restoring Crossed and re-checking the canonical three-card stack');
  await control.click();
  await page.waitForFunction(() => window.RelphiDrawingBoardPrefabsBridge.getState().centerOpen === false);
  const restored = await center();
  assert.equal(restored[0].left, restored[1].left);
  assert.equal(restored[1].left, restored[2].left);
  assert.equal(restored[0].top, restored[1].top);
  assert.equal(restored[1].top, restored[2].top);
  assert.ok(restored[0].z < restored[1].z && restored[1].z < restored[2].z);
  assert.deepEqual(restored.map(item => item.rotation), [0,0,90]);

  console.log('iPhone Celtic Cross viewport regression passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  if (browser) await browser.close();
});
