import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const ref=process.env.PREVIEW_REF;
assert.match(ref||'',/^[a-f0-9]{40}$/);
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1100,height:850}});
 const errors=[],blocked=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)blocked.push(r.status()+' '+r.url())});
 await page.goto('https://oracleofrelphi.com/sky-chart-preview/sky-chart.html?ref='+ref,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:25000});
 await page.locator('#skyFoundationA [data-sky-vocab-view-button="vocab"]').click();
 await page.waitForFunction(()=>!document.querySelector('#skyFoundationA [data-sky-vocab-panel="A"]')?.hidden);
 const result=await page.evaluate(()=>{
  const panel=document.querySelector('#skyFoundationA [data-sky-vocab-panel="A"]');
  return {serializer:!!window.RelphiVocabCopySerializer,version:!![...document.scripts].find(x=>x.src.includes('sky-chart-vocab-copy-v1.js?v=3')),panel:!!panel,copy:!!document.querySelector('#skyFoundationA [data-copy-vocab="A"]'),rootBusy:document.querySelector('#skyFoundationRoot')?.getAttribute('aria-busy')};
 });
 console.log('HOSTED_PREVIEW',JSON.stringify({result,errors,blocked:blocked.filter(x=>!/google-analytics/.test(x)).slice(0,15)}));
 assert.equal(result.serializer,true);
 assert.equal(result.version,true);
 assert.equal(result.copy,true);
 assert.equal(result.rootBusy,'false');
 assert.deepEqual(errors,[]);
 assert.deepEqual(blocked.filter(x=>!/google-analytics/.test(x)),[]);
 await page.screenshot({path:'vocab-copy-hosted-preview.png',fullPage:true});
}finally{await browser.close()}
