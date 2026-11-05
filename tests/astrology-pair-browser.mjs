// Read-only browser checks for the 441-page placement-pair index and refinements.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1200]){
  const ctx=await browser.newContext({viewport:{width,height:900}});
  const page=await ctx.newPage();
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.goto('http://127.0.0.1:4173/astrology-pairs.html',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('a.pair-link').count(),441);
  await page.locator('#pairSearch').fill('uranus fortune');
  assert.equal(await page.locator('a.pair-link:visible').count(),2,'Both ordered directions should match both terms');
  await page.locator('a.pair-link:visible').first().click();
  await page.waitForURL(/\/astrology\/pairs\/.+\.html$/);
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'index,follow');
  await page.locator('#pair-aspect').selectOption('square');
  await page.locator('#pair-sourceHouse').selectOption('10');
  await page.locator('#pair-targetHouse').selectOption('3');
  assert.match(await page.locator('.pair-result').textContent(),/House 10/);
  assert.match(await page.locator('.pair-result').textContent(),/House 3/);
  const route=page.url();
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#pair-sourceHouse').waitFor();
  assert.equal(await page.locator('#pair-aspect').inputValue(),'square');
  assert.equal(await page.locator('#pair-sourceHouse').inputValue(),'10');
  assert.equal(await page.locator('#pair-targetHouse').inputValue(),'3');
  assert.equal(page.url(),route);
  assert.deepEqual(errors,[],'page JavaScript errors');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2),false,'Mobile horizontal overflow');
  await page.screenshot({path:'astrology-pair-'+width+'.png',fullPage:true});
  await ctx.close();
 }
 console.log('Browser verified directory, pair navigation, house/aspect refinement, URL persistence, responsive fit.');
}finally{await browser.close();}
