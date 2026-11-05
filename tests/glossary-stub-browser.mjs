// End-to-end smoke test for the private, unindexed glossary stub workbench.
// Run after installing Playwright/Chromium and serving this repository on :4173.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1200]){
  const context=await browser.newContext({viewport:{width,height:900}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
   window.__copied=[];
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.__copied.push(text)}});
  });
  await page.goto('http://127.0.0.1:4173/glossary-stubs.html',{waitUntil:'domcontentloaded'});
  await page.locator('#stubHeading').waitFor();
  assert.equal(await page.locator('#stubHeading').textContent(), 'Uranus Rx in Gemini · House 10 — Opposition — Part of Fortune in Sagittarius · House 3');
  assert.equal(await page.locator('.stub-controls select').count(),8);
  assert.match(await page.locator('#stubGeometry').textContent(),/compatible/);
  assert.match(await page.locator('meta[name="robots"]').getAttribute('content'),/noindex/);
  const first=await page.locator('#stubId').textContent();
  await page.locator('select[name="targetHouse"]').selectOption('4');
  assert.notEqual(await page.locator('#stubId').textContent(),first);
  await page.locator('select[name="targetSign"]').selectOption('gemini');
  assert.match(await page.locator('#stubGeometry').textContent(),/impossible/);
  await page.locator('select[name="targetSign"]').selectOption('sagittarius');
  assert.match(await page.locator('#stubGeometry').textContent(),/compatible/);
  await page.locator('select[name="source"]').selectOption('sun');
  assert.equal(await page.locator('input[name="sourceRx"]').isDisabled(),true);
  assert.equal(await page.locator('input[name="sourceRx"]').isChecked(),false);
  await page.locator('select[name="source"]').selectOption('uranus');
  assert.equal(await page.locator('input[name="sourceRx"]').isDisabled(),false);
  await page.locator('input[name="sourceRx"]').check();
  const link=page.url();
  await page.locator('.stub-actions button').first().click();
  await page.waitForFunction(()=>window.__copied.length>0);
  assert.equal(await page.evaluate(()=>window.__copied[0]),link);
  await page.locator('.stub-actions button').nth(1).click();
  await page.waitForFunction(()=>window.__copied.length>1);
  const json=await page.evaluate(()=>JSON.parse(window.__copied[1]));
  assert.equal(json.source.retrograde,true);
  assert.equal(json.target.house,4);
  assert.equal(json.publication.indexable,false);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#stubHeading').waitFor();
  assert.equal(await page.locator('select[name="targetHouse"]').inputValue(),'4');
  assert.equal(await page.locator('input[name="sourceRx"]').isChecked(),true);
  assert.equal(errors.length,0,errors.join(' | '));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
  assert.equal(overflow,false,'Unexpected horizontal overflow at '+width+'px');
  await page.screenshot({path:'glossary-stubs-'+width+'.png',fullPage:true});
  await context.close();
 }
 console.log('Glossary stub browser checks passed at 390px and 1200px.');
}finally{await browser.close();}
