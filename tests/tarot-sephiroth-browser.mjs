// Full-card Golden Dawn / Thoth correspondence: actual Tarot Ledger browser workflow.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:4173';
const RANKS = {
  Ace: [1, 'Kether', 'Crown', 'Primum Mobile / First Motion'],
  Two: [2, 'Chokmah', 'Wisdom', 'Zodiac / fixed stars'],
  Three: [3, 'Binah', 'Understanding', 'Saturn'],
  Four: [4, 'Chesed', 'Mercy', 'Jupiter'],
  Five: [5, 'Geburah', 'Severity', 'Mars'],
  Six: [6, 'Tiphareth', 'Beauty', 'Sun'],
  Seven: [7, 'Netzach', 'Victory', 'Venus'],
  Eight: [8, 'Hod', 'Splendour', 'Mercury'],
  Nine: [9, 'Yesod', 'Foundation', 'Moon'],
  Ten: [10, 'Malkuth', 'Kingdom', 'Four elements / material realm']
};
const browser = await chromium.launch({ headless:true, args:['--no-sandbox'] });
try {
  for (const width of [1280,390]) {
    const page = await browser.newPage({ viewport:{width,height:900}, deviceScaleFactor:1 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base+'/tarot.html?card=five_of_wands', {waitUntil:'domcontentloaded', timeout:60000});
    await page.waitForFunction(() => window.RelphiTarotLedgerBridge?.renderCardEntry && window.RELPHI_TAROT_CARDS?.length === 78, {timeout:45000});

    const report = await page.evaluate(() => {
      const cards = window.RELPHI_TAROT_CARDS;
      return cards.map(card => {
        const html=window.RelphiTarotLedgerBridge.renderCardEntry(card.card_id);
        const template=document.createElement('template');
        template.innerHTML=html;
        const panel=template.content.querySelector('.tarot-traditional-sephirah');
        const fields=panel ? Object.fromEntries([...panel.querySelectorAll('dt')].map(dt => [dt.textContent, dt.nextElementSibling?.textContent])) : null;
        return {id:card.card_id,type:card.card_type,arcana:card.arcana,rank:card.rank,decan:card.astrology?.decan_ruler,head:panel?.querySelector('h3')?.textContent||'',fields,count:template.content.querySelectorAll('.tarot-traditional-sephirah').length};
      });
    });
    assert.equal(report.length,78);
    const applicable=report.filter(c => c.arcana==='Minor' && ['Ace','Pip'].includes(c.type));
    assert.equal(applicable.length,40);
    for(const entry of report){
      const expected=RANKS[entry.rank];
      if (entry.arcana==='Minor' && ['Ace','Pip'].includes(entry.type)) {
        assert.equal(entry.count,1,entry.id+' should display exactly one tradition section');
        assert.equal(entry.head,'Golden Dawn / Thoth · Tree of Life',entry.id);
        assert.equal(entry.fields.Sephirah,`${expected[0]} · ${expected[1]} (${expected[2]})`,entry.id);
        assert.equal(entry.fields['Planetary sphere']||entry.fields['Associated sphere'],expected[3],entry.id);
        assert.equal(Boolean(entry.fields['Planetary sphere']),['Three','Four','Five','Six','Seven','Eight','Nine'].includes(entry.rank),entry.id);
      } else assert.equal(entry.count,0,entry.id+' should not acquire a numbered-card sephirah');
    }
    const five=report.find(c=>c.id==='five_of_wands');
    const seven=report.find(c=>c.id==='seven_of_wands');
    assert.equal(five.decan,'Saturn');
    assert.equal(five.fields['Planetary sphere'],'Mars');
    assert.equal(seven.fields['Planetary sphere'],'Venus');
    assert.notEqual(seven.fields['Planetary sphere'],seven.decan);
    const ten=report.find(c=>c.id==='ten_of_swords');
    assert.equal(ten.fields['Associated sphere'],'Four elements / material realm');
    assert.equal(ten.decan,'Sun');

    // User-facing interaction: choose a card from the normal ledger, not a test-only render.
    await page.locator('#showAllCards').click({timeout:20000});
    const item=page.locator('#cardList .or-card[data-id="five_of_wands"]').first();
    await item.waitFor({state:'visible',timeout:30000});
    await item.click({timeout:30000});
    const detail=page.locator('#cardDetail .tarot-traditional-sephirah');
    await detail.waitFor({state:'visible',timeout:15000});
    assert.match(await detail.innerText(),/5 · Geburah \(Severity\)/);
    assert.match(await detail.innerText(),/Planetary sphere\s*Mars/);
    assert.match(await page.locator('#cardDetail .ruler-interaction').innerText(),/Saturn/i);
    const box=await detail.boundingBox();
    assert.ok(box && box.width > 100 && box.x>=-1 && box.x+box.width<=width+2, `tradition section must fit ${width}px viewport: ${JSON.stringify(box)}`);
    await page.screenshot({path:`tarot-sephiroth-${width}.png`,fullPage:true});
    console.log(`PASS ${width}px: 40/40 rank correspondences, other 38 excluded, normal card click, distinct decan and sphere, section fits`);
    if(errors.length)console.log('Page errors (investigate if relevant):',errors.slice(0,5));
    await page.close();
  }
} finally {
  await browser.close();
}
