import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1420,height:950}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4173/tarot.html',{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('#showAllCards').click({timeout:20000});
 await page.locator('#browsePanel .tarot-result-grid .or-card').first().waitFor({timeout:18000});
 const initial=await page.evaluate(()=>{
  const cards=document.querySelectorAll('#browsePanel .tarot-result-grid .or-card');
  return {count:cards.length,entry:document.querySelector('#cardDetail')?.hidden,
    galleryMode:document.querySelector('select[data-gallery-mode]')?.value,
    nav:document.querySelector('#cardDetail .ledger-entry-nav')?.textContent,
    noExtraMode:!document.querySelector('#ledgerBookView,#ledgerGridView,#tarotStorybook')};
 });
 assert.ok(initial.count>=70,JSON.stringify(initial));
 assert.equal(initial.entry,false);
 assert.equal(initial.galleryMode,'fit');
 assert.equal(initial.noExtraMode,true);
 assert.match(initial.nav,/Card 1 of 78/);
 const beforeTitle=await page.locator('#cardDetail .full-entry-title-row h2').innerText();
 await page.locator('#cardDetail [data-ledger-entry-step="1"]').click();
 const afterTitle=await page.locator('#cardDetail .full-entry-title-row h2').innerText();
 assert.notEqual(beforeTitle,afterTitle);
 assert.match(await page.locator('#cardDetail .ledger-entry-position').innerText(),/Card 2 of 78/);
 const active=await page.locator('#browsePanel .tarot-result-grid > .is-detail-selected').count();
 assert.equal(active,1,'one gallery card must be marked active');
 const activeId=await page.locator('#browsePanel .tarot-result-grid > .is-detail-selected').getAttribute('data-id');
 assert.equal(activeId,(await page.locator('#cardDetail .full-entry-title-row h2').innerText()).length>0?activeId:null);
 await page.locator('#cardDetail [data-ledger-entry-step="-1"]').click();
 assert.equal(await page.locator('#cardDetail .full-entry-title-row h2').innerText(),beforeTitle);
 assert.equal(await page.locator('#cardDetail [data-ledger-entry-step="-1"]').isDisabled(),true);

 // Closing the entry restores the entire available width for the gallery.
 await page.locator('#cardDetail [data-ledger-entry-close]').click();
 const hidden=await page.evaluate(()=>{
  const browse=document.querySelector('#browsePanel'),entry=document.querySelector('#cardDetail');
  const root=document.querySelector('#browsePanel .tarot-list-panel');
  const b=browse.getBoundingClientRect(),r=root.getBoundingClientRect();
  return {entry:entry.hidden,grid:browse.dataset.entryVisible,widthRatio:r.width/b.width};
 });
 assert.equal(hidden.entry,true);
 assert.equal(hidden.grid,'false');
 assert.ok(hidden.widthRatio>.9,'results should reclaim width: '+JSON.stringify(hidden));
 assert.equal(await page.locator('#toggleLedgerEntry').innerText(),'Show full entry');
 await page.evaluate(()=>{
   const min=document.querySelector('[data-gallery-min]');
   const max=document.querySelector('[data-gallery-max]');
   min.value='128';min.dispatchEvent(new Event('input',{bubbles:true}));
   max.value='256';max.dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.waitForTimeout(150);
 const fitted=await page.evaluate(()=>{
  const e=document.querySelector('#browsePanel .tarot-result-grid .or-card');
  return {width:e?.getBoundingClientRect().width,grid:document.querySelector('.tarot-result-grid').dataset.galleryFit,
    stored:JSON.parse(localStorage.getItem('relphi-tarot-ledger-gallery-v1'))};
 });
 assert.ok(fitted.width>=127&&fitted.width<=257,JSON.stringify(fitted));
 assert.equal(fitted.stored.min,128);
 assert.equal(fitted.stored.max,256);

 await page.locator('#toggleLedgerEntry').click();
 assert.equal(await page.locator('#cardDetail').isVisible(),true);
 assert.equal(await page.locator('#cardDetail .ledger-entry-nav').count(),1);

 // The arrows navigate within the actual current search, not the entire deck.
 await page.locator('#oracleCommand').fill('pages');
 await page.locator('#runCommand').click();
 await page.waitForFunction(() => document.querySelectorAll('#browsePanel .tarot-result-grid .or-card').length === 4);
 const pages=await page.evaluate(() => ({
   ids:[...document.querySelectorAll('#browsePanel .tarot-result-grid .or-card')].map(card=>card.dataset.id)
 }));
 assert.equal(pages.ids.length,4,JSON.stringify(pages));
 assert.ok(pages.ids.every(id=>id.startsWith('princess_of_')),JSON.stringify(pages));
 assert.match(await page.locator('#cardDetail .ledger-entry-position').innerText(),/Card 1 of 4/);
 for(let i=1;i<4;i++){
   await page.locator('#cardDetail [data-ledger-entry-step="1"]').click();
   assert.match(await page.locator('#cardDetail .ledger-entry-position').innerText(),new RegExp('Card '+(i+1)+' of 4'));
   assert.equal(await page.locator('.tarot-result-grid > .is-detail-selected').getAttribute('data-id'),pages.ids[i]);
 }
 assert.equal(await page.locator('#cardDetail [data-ledger-entry-step="1"]').isDisabled(),true);
 await page.locator('#cardDetail .full-entry-title-row h2').focus();
 // Heading isn't normally focusable; make it focusable to test scoped keyboard navigation.
 await page.locator('#cardDetail .full-entry-title-row h2').evaluate(node=>{node.tabIndex=0;node.focus()});
 await page.keyboard.press('ArrowLeft');
 assert.match(await page.locator('#cardDetail .ledger-entry-position').innerText(),/Card 3 of 4/);
 // Hide and re-open by selecting a result.
 await page.locator('#toggleLedgerEntry').click();
 assert.equal(await page.locator('#cardDetail').isHidden(),true);
 await page.locator('#browsePanel .tarot-result-grid > .or-card').first().click({position:{x:10,y:10}});
 assert.equal(await page.locator('#cardDetail').isVisible(),true);
 assert.match(await page.locator('#cardDetail .ledger-entry-position').innerText(),/Card 1 of 4/);

 await page.setViewportSize({width:390,height:850});
 await page.locator('#toggleLedgerEntry').click();
 const mobile=await page.evaluate(()=>{
  const b=document.getElementById('browsePanel').getBoundingClientRect();
  const list=document.querySelector('.tarot-list-panel').getBoundingClientRect();
  const cards=Array.from(document.querySelectorAll('#browsePanel .tarot-result-grid .or-card')).slice(0,5);
  return {viewport:innerWidth,browseW:b.width,listW:list.width,cardWidths:cards.map(c=>c.getBoundingClientRect().width)};
 });
 assert.ok(mobile.listW<=mobile.viewport+3,JSON.stringify(mobile));
 assert.ok(mobile.cardWidths.every(w=>w<=257&&w>=125),JSON.stringify(mobile));
 await page.locator('#toggleLedgerEntry').click();
 await page.locator('#cardDetail [data-ledger-entry-step="1"]').click();
 assert.match(await page.locator('#cardDetail .ledger-entry-position').innerText(),/Card 2 of 4/);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({initial,hidden,fitted,mobile,pages,pageErrors:errors}));
}finally{
 await browser.close();
}
