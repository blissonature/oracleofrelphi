import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const ref=String(process.env.RELPHI_PREVIEW_REF||'').trim();
assert.match(ref,/^[0-9a-f]{40}$/i,'Preview test must use an exact commit SHA');
const url='https://oracleofrelphi.com/sky-chart-preview/sky-chart.html?ref='+ref;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errors=[],failed=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('requestfailed',request=>{if(/jsdelivr|raw.githubusercontent/.test(request.url()))failed.push(request.url()+' '+(request.failure()?.errorText||''))});
try{
  await page.goto(url,{waitUntil:'commit',timeout:35000});
  await page.waitForFunction(()=>!!document.querySelector('#skyFoundationRoot')&&!!window.RelphiSkyVocab,null,{timeout:50000});
  const resources=await page.evaluate(()=>({
    title:document.title,
    script:document.querySelector('script[src*="sky-chart-vocab-tab-v1.js"]')?.src,
    root:!!document.querySelector('#skyFoundationRoot'),
    loading:document.querySelector('#previewStatus')?.textContent||''
  }));
  assert.ok(resources.script?.includes('@'+ref+'/sky-chart-vocab-tab-v1.js'),'Preview must load Vocab from the exact commit');
  assert.ok(resources.root&&resources.title.includes('Sky Chart'),'Preview must render Sky Chart');
  console.log('Exact commit preview verified in Chromium:',url,JSON.stringify(resources));
}catch(error){
  console.log('Preview failed:',url,'Status:',await page.locator('body').innerText().then(t=>t.slice(0,1100)).catch(()=>'<unavailable>'));
  console.log('Page errors:',errors.slice(0,10),'Failed CDN requests:',failed.slice(0,15));
  throw error;
}finally{await browser.close()}
