const assert = require('node:assert/strict');
const { chromium } = require('playwright');

let browser;

(async () => {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);
  const pageErrors = [];
  page.on('pageerror', error => {
    if (page.url().includes('/tarot.html')) pageErrors.push(String(error));
  });

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

  console.log('Seeding Drawing Board storage from Sky Chart');
  await page.goto('http://127.0.0.1:8000/sky-chart.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ storageKey, value }) => {
    localStorage.setItem(storageKey, JSON.stringify(value));
  }, { storageKey: key, value: snapshot });

  console.log('Confirming Tarot Ledger no longer exposes Drawing Board');
  await page.goto('http://127.0.0.1:8000/tarot.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#shortListPanel').waitFor({ state: 'attached' });
  await page.waitForFunction(() => document.documentElement.dataset.relphiTarotLedgerNoBoard === 'true');
  assert.equal(await page.locator('#shortListPanel').isVisible(), false);
  assert.equal(await page.locator('#landingOpenBoard').count(), 0);
  assert.equal(await page.locator('[data-shortlist]').count(), 0);

  console.log('Opening standalone Drawing Board and restoring the saved board');
  await page.goto('http://127.0.0.1:8000/drawing-board/tarot.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#shortListPanel').waitFor({ state: 'visible' });
  await page.locator('#shortListPanel [data-row-card="ace_of_wands"]').first().waitFor({ state: 'visible' });
  await page.locator('#drawingBoardInspector').waitFor({ state: 'visible' });
  await page.locator('#drawingBoardCardList [data-board-card-id="ace_of_wands"]').waitFor({ state: 'visible' });

  console.log('Confirming the board description layer is suppressed and full Ledger entry is below the board');
  const boardInfoLayers = page.locator('#shortListPanel .card-row-board .or-card-layer.relphi-info-layer, #shortListPanel .card-row-board .or-layer-scroll');
  const infoLayerCount = await boardInfoLayers.count();
  for (let index = 0; index < infoLayerCount; index += 1) {
    assert.equal(await boardInfoLayers.nth(index).evaluate(node => getComputedStyle(node).display), 'none');
  }
  await page.locator('#drawingBoardSelectedCardEntry [data-shortlist="ace_of_wands"]').waitFor({ state: 'attached' });

  console.log('Using mini search to select The Fool into an empty position');
  const placeholder = page.locator('#shortListPanel .card-row-item.card-row-placeholder-item').last();
  await placeholder.waitFor({ state: 'visible' });
  const searchToggle = placeholder.locator('[data-relphi-placeholder-search]');
  await searchToggle.waitFor({ state: 'visible' });
  await searchToggle.click();
  const searchInput = placeholder.locator('[data-relphi-placeholder-query]');
  await searchInput.fill('The Fool');
  const foolResult = placeholder.locator('[data-relphi-placeholder-result="the_fool"]');
  await foolResult.waitFor({ state: 'visible' });
  await foolResult.click();
  await page.locator('#shortListPanel [data-row-card="the_fool"]').first().waitFor({ state: 'visible' });
  await page.locator('#drawingBoardCardList [data-board-card-id="the_fool"]').waitFor({ state: 'visible' });

  console.log('Selecting a board card and confirming synchronized list and full entry');
  await page.locator('#shortListPanel [data-row-card="the_fool"]').first().click();
  await page.locator('#drawingBoardCardList [data-board-card-id="the_fool"][aria-current="true"]').waitFor({ state: 'visible' });
  await page.waitForTimeout(700);
  console.log('Full-entry transition diagnostic:', JSON.stringify(await page.evaluate(() => {
    const detail = document.getElementById('cardDetail');
    const host = document.getElementById('drawingBoardSelectedCardEntry');
    const list = document.getElementById('cardList');
    const candidates = list ? Array.from(list.querySelectorAll('[data-card-id],[data-card],[data-id],button,[role="listitem"],li,article')).filter(node => /fool/i.test(node.textContent || '')).slice(0, 6).map(node => ({
      tag: node.tagName,
      cardId: node.getAttribute('data-card-id'),
      card: node.getAttribute('data-card'),
      id: node.getAttribute('data-id'),
      text: (node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120)
    })) : [];
    return {
      detailConnected: !!detail?.isConnected,
      detailParent: detail?.parentElement?.id || detail?.parentElement?.className || '',
      detailShortlists: detail ? Array.from(detail.querySelectorAll('[data-shortlist]')).map(node => node.getAttribute('data-shortlist')) : [],
      detailText: (detail?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 180),
      hostShortlists: host ? Array.from(host.querySelectorAll('[data-shortlist]')).map(node => node.getAttribute('data-shortlist')) : [],
      hostText: (host?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 180),
      candidates
    };
  })));
  await page.locator('#drawingBoardSelectedCardEntry [data-shortlist="the_fool"]').waitFor({ state: 'attached' });

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
  await page.locator('#shortListPanel').waitFor({ state: 'visible' });
  await page.locator('#shortListPanel [data-row-card="ace_of_wands"]').first().waitFor({ state: 'visible' });
  await page.locator('#shortListPanel [data-row-card="the_fool"]').first().waitFor({ state: 'visible' });
  await page.locator('#drawingBoardCardList [data-board-card-id="ace_of_wands"]').waitFor({ state: 'visible' });
  await page.locator('#drawingBoardCardList [data-board-card-id="the_fool"]').waitFor({ state: 'visible' });

  const savedAfterReturn = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)), key);
  assert.ok(savedAfterReturn.shortList.includes('ace_of_wands'));
  assert.ok(savedAfterReturn.shortList.includes('the_fool'));
  assert.equal(savedAfterReturn.shortListNotes, 'This editable board should survive a trip to Sky Chart.');
  assert.deepEqual(pageErrors, []);

  console.log('Standalone Drawing Board navigation and interaction browser test passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  if (browser) await browser.close();
});
