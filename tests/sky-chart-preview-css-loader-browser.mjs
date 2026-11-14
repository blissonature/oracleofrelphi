import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';

const ref='365349419d22d085337bf707a2336e836dc4eea1';
const browser=await chromium.launch({headless:true});
try{
  for(const width of [1280,390]){
    const ctx=await browser.newContext({viewport:{width,height:850}});
    const page=await ctx.newPage();
    const cssRequests=[];
    await page.route('https://raw.githubusercontent.com/blissonature/oracleofrelphi/**',async route=>{
      const name=new URL(route.request().url()).pathname.split('/').slice(4).join('/');
      if(!name||name.includes('..'))return route.abort();
      try{
        const content=await fs.readFile(path.resolve(name));
        if(name.endsWith('.css'))cssRequests.push(name);
        await route.fulfill({status:200,body:content,contentType:name.endsWith('.css')?'text/plain':'text/html'});
      }catch{return route.fulfill({status:404,body:'Not found'})}
    });
    // The stylesheet loader is under test. Avoid fetching unrelated CDN scripts
    // to keep the check deterministic and expose CSS delivery independently.
    await page.route(/cdn\\.jsdelivr\\.net|unpkg\\.com/,route=>route.abort());
    await page.goto('http://127.0.0.1:4173/sky-chart-preview/sky-chart.html?ref='+ref,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelectorAll('style[data-preview-css]').length>=30,{timeout:20000});
    const data=await page.evaluate(()=>{
      const h1=document.querySelector('h1'),hero=document.querySelector('.tarot-hero');
      return{title:h1?.textContent,fonts:getComputedStyle(h1).fontFamily,
        titleHeight:h1?.getBoundingClientRect().height,
        heroWidth:hero?.getBoundingClientRect().width,
        inline:document.querySelectorAll('style[data-preview-css]').length,
        missing:document.querySelectorAll('link[rel="stylesheet"]').length,
        status:document.getElementById('previewStatus')?.textContent};
    });
    assert.ok(data.title?.includes('Sky Chart'),'Loaded exact application HTML');
    assert.ok(data.inline>=30,'All first-party stylesheet dependencies embedded');
    assert.ok(data.titleHeight<180,'No unstyled oversized brand/title');
    assert.ok(data.heroWidth<=width+1,'Hero fits viewport');
    assert.ok(cssRequests.some(s=>s.startsWith('style.css')),'Main stylesheet read from pinned revision');
    assert.equal(data.status,undefined,'Preview loader completed');
    await page.screenshot({path:'sky-chart-preview-css-'+width+'.png',fullPage:false});
    console.log('PASS preview CSS loader',width,JSON.stringify(data));
    await ctx.close();
  }
}finally{await browser.close()}
