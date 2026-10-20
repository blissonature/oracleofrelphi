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
    galleryMode:document.querySelector('select[data-gallery-mode]')?.value};
 });
 assert.ok(initial.count>=70,JSON.stringify(initial));
 assert.equal(initial.galleryMode,'fit');
 await page.locator('#toggleLedgerEntry').click();
 const hidden=await page.evaluate(()=>{
  const browse=document.querySelector('#browsePanel'),entry=document.querySelector('#cardDetail');
  const root=document.querySelector('#browsePanel .tarot-list-panel');
  const b=browse.getBoundingClientRect(),r=root.getBoundingClientRect();
  return {entry:entry.hidden,grid:browse.dataset.entryVisible,widthRatio:r.width/b.width};
 });
 assert.equal(hidden.entry,true);
 assert.equal(hidden.grid,'false');
 assert.ok(hidden.widthRatio>.9,'results should reclaim width: '+JSON.stringify(hidden));
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

 await page.locator('#ledgerBookView').click();
 await page.locator('#tarotStorybook:not([hidden]) .tarot-book-page').waitFor();
 const first=await page.locator('#tarotStorybook .tarot-book-text h3').innerText();
 const img=page.locator('#tarotStorybook .tarot-book-illustration img');
 assert.match(await img.getAttribute('src'),/assets\/tarot\/rws\/.+\.webp/);
 await page.locator('#tarotStorybook [data-book-step="1"]').click();
 const second=await page.locator('#tarotStorybook .tarot-book-text h3').innerText();
 assert.notEqual(second,first);
 assert.equal(await page.locator('#cardDetail').isHidden(),true);
 await page.locator('#tarotStorybook [data-book-full-entry]').click();
 assert.equal(await page.locator('#cardDetail').isVisible(),true);
 await page.locator('#ledgerGridView').click();
 assert.equal(await page.locator('#tarotStorybook').isHidden(),true);
 assert.equal(await page.locator('.tarot-result-grid').isVisible(),true);

 await page.setViewportSize({width:390,height:850});
 await page.locator('#toggleLedgerEntry').click();
 const mobile=await page.evaluate(()=>{
  const b=document.getElementById('browsePanel').getBoundingClientRect();
  const list=document.querySelector('.tarot-list-panel').getBoundingClientRect();
  const cards=Array.from(document.querySelectorAll('#browsePanel .tarot-result-grid .or-card')).slice(0,5);
  return {viewport:innerWidth,browseW:b.width,listW:list.width,
    cardWidths:cards.map(c=>c.getBoundingClientRect().width)};
 });
 assert.ok(mobile.listW<=mobile.viewport+3,JSON.stringify(mobile));
 assert.ok(mobile.cardWidths.every(w=>w<=257&&w>=125),JSON.stringify(mobile));
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({initial,hidden,fitted,mobile,storybookTitles:[first,second],pageErrors:errors}));
}finally{
 await browser.close();
}
