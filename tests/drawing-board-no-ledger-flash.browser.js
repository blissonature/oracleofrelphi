const assert = require('node:assert/strict');
const { chromium } = require('playwright');

let browser;
(async () => {
  const executablePath = process.env.RELPHI_BROWSER_EXECUTABLE || undefined;
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(15000);

  await page.addInitScript(() => {
    if (!/(^|\/)drawing-board\/tarot\.html$/.test(location.pathname)) return;
    window.__relphiNoLedgerFlashTrace = [];
    let last = '';
    const visible = node => {
      if (!(node instanceof Element)) return false;
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight;
    };
    const directText = node => Array.from(node.childNodes || []).filter(child => child.nodeType === Node.TEXT_NODE).map(child => child.textContent || '').join(' ').replace(/\s+/g, ' ').trim();
    const sample = () => {
      const hero = document.querySelector('.tarot-hero h1')?.textContent?.replace(/\s+/g, ' ').trim() || '';
      const offenders = Array.from(document.querySelectorAll('body *')).filter(visible).map(node => ({ node, text: directText(node) })).filter(item => /Tarot\s+Ledger/i.test(item.text)).map(item => {
        const r = item.node.getBoundingClientRect();
        return { tag:item.node.tagName, id:item.node.id || '', cls:item.node.className || '', text:item.text, top:Math.round(r.top) };
      });
      const snapshot = JSON.stringify({ title:document.title, hero, offenders });
      if (snapshot !== last) {
        last = snapshot;
        window.__relphiNoLedgerFlashTrace.push({ at:performance.now(), title:document.title, hero, offenders });
      }
      requestAnimationFrame(sample);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(sample), { once:true });
    else requestAnimationFrame(sample);
  });

  await page.goto('http://127.0.0.1:8000/drawing-board/tarot.html', { waitUntil:'domcontentloaded' });
  await page.locator('#shortListPanel').waitFor({ state:'visible' });
  await page.waitForTimeout(2500);

  const trace = await page.evaluate(() => window.__relphiNoLedgerFlashTrace || []);
  console.log('Drawing Board identity trace:', JSON.stringify(trace, null, 2));
  assert.ok(trace.length, 'Expected startup identity samples');
  assert.deepEqual([...new Set(trace.map(entry => entry.hero).filter(Boolean))], ['Drawing Board']);
  assert.deepEqual([...new Set(trace.map(entry => entry.title).filter(Boolean))], ['Drawing Board · Oracle of Relphi']);
  const visibleLedger = trace.flatMap(entry => entry.offenders.map(offender => ({ ...offender, at:entry.at })));
  assert.deepEqual(visibleLedger, [], 'Tarot Ledger became visibly rendered during Drawing Board startup');
  console.log('No-Ledger-flash Drawing Board browser test passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  if (browser) await browser.close();
});
