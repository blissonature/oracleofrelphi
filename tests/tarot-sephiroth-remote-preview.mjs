import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const ref=process.env.PREVIEW_REF;
assert.match(ref||'',/^[0-9a-f]{40}$/);
const url='https://oracleofrelphi.com/sky-chart-preview/sky-chart.html?ref='+ref+'&view=tarot&card=five_of_wands';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
  const page=await browser.newPage({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const errors=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>failed.push(r.url()+' :: '+r.failure()?.errorText));
  page.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' :: '+r.url())});
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#cardDetail .tarot-traditional-sephirah').waitFor({state:'visible',timeout:60000}).catch(async error=>{
    console.log('PREVIEW STATUS',JSON.stringify(await page.evaluate(()=>({title:document.title,href:location.href,status:document.querySelector('#previewStatus')?.textContent,body:document.body.innerText.slice(0,500),scripts:document.scripts.length,base:document.baseURI}))));
    console.log('ERRORS',errors.slice(0,12),'NETWORK FAILURES',failed.slice(0,25));
    throw error;
  });
  const info=await page.locator('#cardDetail .tarot-traditional-sephirah').innerText();
  assert.match(info,/5 · Geburah \(Severity\)/);
  assert.match(info,/Planetary sphere\s*Mars/);
  await page.screenshot({path:'tarot-sephiroth-remote-preview.png',fullPage:true});
  console.log('PASS self-hosted commit-specific Tarot preview:',url);
} finally {await browser.close();}
