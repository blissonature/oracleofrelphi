import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

const ref=process.env.PREVIEW_REF;
assert.match(ref||'',/^[a-f0-9]{40}$/i,'PREVIEW_REF must specify the exact commit');
const url='https://oracleofrelphi.com/sky-chart-preview/sky-chart.html?ref='+ref+'&page=glyphs-unified-preview.html';
await mkdir('test-results/glyph-audit',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const [name,width,height] of [['desktop',1280,900],['mobile',390,844]]){
   const page=await browser.newPage({viewport:{width,height},serviceWorkers:'block'});
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>window.RelphiGlyphRegistry?.entries?.length===95&&
     document.querySelectorAll('#ugGrid .ug-card .relphi-canonical-glyph').length===95&&
     /95 canonical glyph masters loaded/.test(document.querySelector('#ugStatus')?.textContent||''),null,{timeout:90000});
   const state=await page.evaluate(()=>{
     const art=document.querySelector('.relphi-glyph-retrograde');
     const ring=art?.closest('.relphi-glyph-bubble')?.querySelector(':scope > circle');
     const b=art?.getBoundingClientRect(),r=ring?.getBoundingClientRect();
     const x=r.x+r.width/2,y=r.y+r.height/2;
     return{status:document.querySelector('#ugStatus')?.textContent,base:document.baseURI,
       rendered:document.querySelectorAll('#ugGrid .ug-card .relphi-canonical-glyph').length,
       retrograde:{centerErrorX:b.x+b.width/2-x,centerErrorY:b.y+b.height/2-y,
         box:{width:b.width,height:b.height},ringDiameter:r.width,
         hasText:art.querySelectorAll('text').length,hasPath:art.querySelectorAll('path').length},
       source:art.dataset.canonicalGlyphId};
   });
   assert.ok(state.base.includes(ref),'All canonical assets must be pinned to the requested revision');
   assert.equal(state.rendered,95);
   assert.equal(state.source,'retrograde');
   assert.ok(Math.abs(state.retrograde.centerErrorX)<1.2&&Math.abs(state.retrograde.centerErrorY)<1.2,
     'Retrograde centered in the actual hosted glyph list');
   assert.equal(state.retrograde.hasText,0,'Use original outlined glyph, not a new font rendering');
   assert.equal(state.retrograde.hasPath,1);
   assert.deepEqual(errors,[],'No errors in hosted gallery');
   await page.screenshot({path:'test-results/glyph-audit/hosted-'+name+'.png',fullPage:true});
   console.log('HOSTED COMMIT PREVIEW '+name.toUpperCase(),JSON.stringify({url,state,errors}));
   await page.close();
 }
}finally{await browser.close()}
