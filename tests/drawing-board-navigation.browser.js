const assert = require('node:assert/strict');
const { chromium } = require('playwright');

let browser;

(async () => {
  const executablePath = process.env.RELPHI_BROWSER_EXECUTABLE || undefined;
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);
  const pageErrors = [];
  page.on('pageerror', error => {
    if (page.url().includes('/tarot.html')) pageErrors.push(String(error));
  });

  const drawingBoardPath = () => new URL(page.url()).pathname;
  const key = 'relphiDrawingBoardSessionV1';
  const snapshot = {
    version: 1,
    savedAt: new Date().toISOString(),
    shortList: ['ace_of_wands'],
    shortListPositionLabels: ['Message', 'Choice'],
    shortListPositionCardIds: ['ace_of_wands', ''],
    shortListSelection: [],
    shortListSelectMode: false,
    shortListName: 'Navigation persistence test',
    shortListNotes: 'This editable board should survive a trip to Sky Chart.',
    rowCardReversals: {},
    rowEnvelopeLayout: {},
    rowCardTransforms: {},
    rowSenseSelections: {},
    rowSenseNotes: {},
    rowTransformTarget: 0,
    cardRowBoardOpen: true,
    cardRowSettingsOpen: false
  };

  const visibleLedgerIds = () => page.locator('#cardList .or-card[data-id]').evaluateAll(nodes => nodes
    .filter(node => !node.hidden && getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden')
    .map(node => node.dataset.id));
  const visibleHelpfulTipCount = () => page.locator('.drawing-board-helpful-tip').evaluateAll(nodes => nodes
    .filter(node => !node.hidden && getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden')
    .length);
  const waitForTarotFirstUi = () => page.waitForFunction(() => window.__relphiDrawingBoardTarotUxV1 === true);

  console.log('Confirming an empty mobile Drawing Board immediately reads as a tarot tool');
  await page.goto('http://127.0.0.1:8000/drawing-board/tarot.html', { waitUntil: 'domcontentloaded' });
  await waitForTarotFirstUi();
  const emptyState = page.locator('#drawingBoardTarotEmptyState');
  await emptyState.waitFor({ state: 'visible' });
  assert.match((await emptyState.innerText()).trim(), /Tarot card workspace/i);
  assert.match((await emptyState.innerText()).trim(), /Draw or choose a tarot card/i);
  assert.equal(await visibleHelpfulTipCount(), 0);
  assert.equal((await page.locator('#drawRandomRowCard').innerText()).trim(), 'Draw card');
  assert.equal((await page.locator('#addCardPlaceholder').innerText()).trim(), 'Add card slot');
  await page.locator('#relphiLabelsToggle').waitFor({ state: 'visible' });
  assert.equal((await page.locator('#relphiLabelsToggle').innerText()).trim(), 'Spreads');
  const emptyBox = await emptyState.boundingBox();
  assert.ok(emptyBox && emptyBox.y < 844, 'Tarot empty state should appear in the first mobile viewport');

  console.log('Seeding Drawing Board storage from Sky Chart');
  await page.goto('http://127.0.0.1:8000/sky-chart.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ storageKey, value }) => localStorage.setItem(storageKey, JSON.stringify(value)), { storageKey: key, value: snapshot });

  console.log('Confirming Tarot Ledger no longer exposes Drawing Board');
  await page.goto('http://127.0.0.1:8000/tarot.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#shortListPanel').waitFor({ state: 'attached' });
  await page.waitForFunction(() => document.documentElement.dataset.relphiTarotLedgerNoBoard === 'true');
  assert.equal(await page.locator('#shortListPanel').isVisible(), false);
  assert.equal(await page.locator('#landingOpenBoard').count(), 0);
  assert.equal(await page.locator('[data-shortlist]').count(), 0);

  console.log('Opening standalone Drawing Board with Drawing Board identity from first DOM paint');
  await page.goto('http://127.0.0.1:8000/drawing-board/tarot.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.relphiStandaloneDrawingBoardV2 === 'true');
  await waitForTarotFirstUi();
  assert.equal(await page.title(), 'Drawing Board · Oracle of Relphi');
  assert.equal((await page.locator('.tarot-hero h1').innerText()).trim(), 'Drawing Board');
  assert.equal(drawingBoardPath(), '/drawing-board/tarot.html');
  assert.equal(await page.locator('.tarot-mode-bar').isVisible(), false);
  await page.locator('#shortListPanel [data-row-card="ace_of_wands"]').first().waitFor({ state: 'visible' });
  await page.locator('#browsePanel').waitFor({ state: 'visible' });
  await page.locator('#cardList .or-card[data-id="ace_of_wands"]').waitFor({ state: 'visible' });
  await page.locator('#cardDetail [data-shortlist="ace_of_wands"]').waitFor({ state: 'attached' });
  assert.match((await page.locator('#browsePanel .cards-heading').innerText()).trim(), /^Cards in this Drawing/);
  assert.deepEqual(await visibleLedgerIds(), ['ace_of_wands']);
  assert.equal(await page.locator('#drawingBoardTarotEmptyState').count(), 0);
  assert.equal(await visibleHelpfulTipCount(), 0);

  console.log('Refreshing Drawing Board and confirming the route and native Ledger bottom remain Drawing Board');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.relphiStandaloneDrawingBoardV2 === 'true');
  await waitForTarotFirstUi();
  assert.equal(await page.title(), 'Drawing Board · Oracle of Relphi');
  assert.equal((await page.locator('.tarot-hero h1').innerText()).trim(), 'Drawing Board');
  assert.equal(drawingBoardPath(), '/drawing-board/tarot.html');
  await page.locator('#shortListPanel [data-row-card="ace_of_wands"]').first().waitFor({ state: 'visible' });
  await page.locator('#browsePanel').waitFor({ state: 'visible' });
  await page.locator('#cardDetail [data-shortlist="ace_of_wands"]').waitFor({ state: 'attached' });
  assert.equal(await visibleHelpfulTipCount(), 0);

  console.log('Confirming board description layers are suppressed while the native Ledger entry remains intact below');
  const boardInfoLayers = page.locator('#shortListPanel .card-row-board .or-card-layer.relphi-info-layer, #shortListPanel .card-row-board .or-layer-scroll');
  const infoLayerCount = await boardInfoLayers.count();
  for (let index = 0; index < infoLayerCount; index += 1) {
    assert.equal(await boardInfoLayers.nth(index).evaluate(node => getComputedStyle(node).display), 'none');
  }
  assert.equal(await page.locator('#drawingBoardInspector').count(), 0);
  assert.equal(await page.locator('#drawingBoardSelectedCardEntry').count(), 0);

  console.log('Using mini search to select The Fool into an empty position');
  const placeholder = page.locator('#shortListPanel .card-row-item.card-row-placeholder-item').last();
  await placeholder.waitFor({ state: 'visible' });
  await placeholder.locator('[data-relphi-placeholder-search]').click();
  await placeholder.locator('[data-relphi-placeholder-query]').fill('The Fool');
  const foolResult = placeholder.locator('[data-relphi-placeholder-result="the_fool"]');
  await foolResult.waitFor({ state: 'visible' });
  await foolResult.click();
  await page.locator('#shortListPanel [data-row-card="the_fool"]').first().waitFor({ state: 'visible' });
  await page.locator('#cardList .or-card[data-id="the_fool"]').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.getElementById('resultInlineCount')?.textContent?.includes('2 cards'));
  assert.deepEqual(await visibleLedgerIds(), ['ace_of_wands', 'the_fool']);

  console.log('Selecting The Fool on the board and confirming the real Tarot Ledger detail switches below');
  await page.locator('#shortListPanel [data-row-card="the_fool"]').first().click();
  await page.locator('#cardDetail [data-shortlist="the_fool"]').waitFor({ state: 'attached' });
  assert.equal(await page.locator('#cardList .or-card[data-id="the_fool"]').evaluate(node => node.classList.contains('is-detail-selected')), true);
  assert.doesNotMatch((await page.locator('#cardDetail').innerText()).trim(), /could not be rendered/i);

  const savedBeforeNavigation = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)), key);
  assert.ok(savedBeforeNavigation.shortList.includes('ace_of_wands'));
  assert.ok(savedBeforeNavigation.shortList.includes('the_fool'));
  assert.equal(savedBeforeNavigation.shortListName, 'Navigation persistence test');

  console.log('Navigating away to Sky Chart');
  await page.goto('http://127.0.0.1:8000/sky-chart.html', { waitUntil: 'domcontentloaded' });
  const savedWhileAway = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)), key);
  assert.ok(savedWhileAway.shortList.includes('ace_of_wands'));
  assert.ok(savedWhileAway.shortList.includes('the_fool'));

  console.log('Returning to standalone Drawing Board');
  await page.goto('http://127.0.0.1:8000/drawing-board/tarot.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.relphiStandaloneDrawingBoardV2 === 'true');
  await waitForTarotFirstUi();
  await page.locator('#shortListPanel [data-row-card="ace_of_wands"]').first().waitFor({ state: 'visible' });
  await page.locator('#shortListPanel [data-row-card="the_fool"]').first().waitFor({ state: 'visible' });
  await page.locator('#cardList .or-card[data-id="ace_of_wands"]').waitFor({ state: 'visible' });
  await page.locator('#cardList .or-card[data-id="the_fool"]').waitFor({ state: 'visible' });
  assert.deepEqual(await visibleLedgerIds(), ['ace_of_wands', 'the_fool']);
  assert.equal(await visibleHelpfulTipCount(), 0);

  const savedAfterReturn = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)), key);
  assert.ok(savedAfterReturn.shortList.includes('ace_of_wands'));
  assert.ok(savedAfterReturn.shortList.includes('the_fool'));
  assert.equal(savedAfterReturn.shortListNotes, 'This editable board should survive a trip to Sky Chart.');
  assert.deepEqual(pageErrors, []);

  console.log('Standalone Drawing Board tarot-first native Ledger browser test passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  if (browser) await browser.close();
});
