const assert = require('node:assert/strict');
const { chromium } = require('playwright');

let browser;

(async () => {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);
  const tarotErrors = [];
  page.on('pageerror', error => {
    if (page.url().includes('/tarot.html')) tarotErrors.push(String(error));
  });

  const key = 'relphiDrawingBoardSessionV1';
  const snapshot = {
    version: 1,
    savedAt: new Date().toISOString(),
    shortList: ['ace_of_wands'],
    shortListPositionLabels: ['Message'],
    shortListPositionCardIds: [],
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

  console.log('Opening Tarot Ledger and restoring the Drawing Board');
  await page.goto('http://127.0.0.1:8000/tarot.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#shortListPanel').waitFor({ state: 'visible' });
  await page.locator('#shortListPanel .short-list-card[data-id="ace_of_wands"]').waitFor({ state: 'visible' });

  const savedBeforeNavigation = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)), key);
  assert.deepEqual(savedBeforeNavigation.shortList, ['ace_of_wands']);
  assert.equal(savedBeforeNavigation.shortListName, 'Navigation persistence test');

  console.log('Navigating away to Sky Chart');
  await page.goto('http://127.0.0.1:8000/sky-chart.html', { waitUntil: 'domcontentloaded' });
  const savedWhileAway = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)), key);
  assert.deepEqual(savedWhileAway.shortList, ['ace_of_wands']);

  console.log('Returning to Tarot Ledger');
  await page.goto('http://127.0.0.1:8000/tarot.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#shortListPanel').waitFor({ state: 'visible' });
  await page.locator('#shortListPanel .short-list-card[data-id="ace_of_wands"]').waitFor({ state: 'visible' });

  const savedAfterReturn = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)), key);
  assert.deepEqual(savedAfterReturn.shortList, ['ace_of_wands']);
  assert.equal(savedAfterReturn.shortListNotes, 'This editable board should survive a trip to Sky Chart.');
  assert.deepEqual(tarotErrors, []);

  console.log('Drawing Board navigation persistence browser test passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  if (browser) await browser.close();
});
