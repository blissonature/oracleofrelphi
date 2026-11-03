// Browser regression for native Tarot Ledger search and Drawing Board handoff.
// No extra runtime search owner: exercise the real search button on desktop/mobile.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const url = process.env.RELPHI_TEST_URL || 'http://127.0.0.1:8000/tarot.html#tarot';
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    for (const size of [{name:'desktop',width:1280,height:900},{name:'mobile',width:390,height:844}]) {
      const page = await browser.newPage({viewport:{width:size.width,height:size.height}});
      try {
        await page.goto(url,{waitUntil:'domcontentloaded'});
        await page.locator('#oracleCommand').waitFor({state:'visible',timeout:30000});
        await page.locator('#oracleCommand').fill('emperor rx, fool, cis rx, 9c, death');
        await page.locator('#runCommand').click();
        const results=page.locator('#cardList .tarot-result-grid .or-card[data-id]');
        await page.waitForFunction(()=>document.querySelectorAll('#cardList .tarot-result-grid .or-card[data-id]').length===5,null,{timeout:30000});
        const ids=await results.evaluateAll(elements=>elements.map(el=>el.dataset.id));
        assert.equal(ids.length,5,size.name+': should resolve five card references');
        assert.equal(new Set(ids).size,5,size.name+': five unique cards');
        assert.equal(await page.locator('#commandMenu .relphi-bespoke-choice').count(),0,size.name+': card list is not a Bespoke question');
        await page.locator('[data-add-results-to-row]').click();
        const snapshot=await page.evaluate(()=>window.RelphiDrawingBoardOptionsBridge?.capture?.());
        assert.ok(snapshot,size.name+': native Drawing Board snapshot');
        assert.deepEqual(snapshot.shortList.slice(0,5),ids,size.name+': preserve search order on board');
        assert.equal(!!snapshot.rowCardReversals?.[0],true,size.name+': emperor reversed');
        assert.equal(!!snapshot.rowCardReversals?.[1],false,size.name+': fool upright');
        assert.equal(!!snapshot.rowCardReversals?.[2],true,size.name+': court reversed');
        assert.equal(!!snapshot.rowCardReversals?.[3],false,size.name+': nine cups upright');
        assert.equal(!!snapshot.rowCardReversals?.[4],false,size.name+': death upright');
        await page.locator('#oracleCommand').fill('moon');
        await page.locator('#runCommand').click();
        assert.ok(await page.locator('#cardList .tarot-result-grid .or-card[data-id]').count()>0,size.name+': ordinary theme search remains functional');
        console.log(size.name+' card-list search, board handoff, and theme search passed');
      } finally { await page.close(); }
    }
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
