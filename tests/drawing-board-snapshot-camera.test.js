const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');

const master=fs.readFileSync('relphi-icons.svg','utf8');
const board=fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const css=fs.readFileSync('drawing-board-workflow-v2.css','utf8');
const sky=fs.readFileSync('sky-chart-export-v2.js','utf8');
assert.equal((master.match(/id="relphi-snapshot"/g)||[]).length,1,'Snapshot has one reusable canonical symbol');
const symbol=master.match(/<symbol\b[^>]*id="relphi-snapshot"[^>]*>[\s\S]*?<\/symbol>/)?.[0];
assert.ok(symbol,'Snapshot symbol exists');
assert.equal((symbol.match(/<path\b/g)||[]).length,1,'Snapshot camera has one canonical geometry path');
assert.ok(symbol.includes('M9.2 4.1h5.6l1.8 2.3H19.9')&&symbol.includes('M15.35 13a3.35 3.35 0 1 1-6.7 0'), 'Snapshot camera has a larger body and lens, without changing the canonical symbol reference');
assert.match(symbol,/transform="translate\(0 -1\)"/,'optical centering stays in the shared symbol');
assert.doesNotMatch(symbol,/M7 4H4v3|M8 3H3v5/, 'Snapshot may not use viewfinder or Zoom Extents corner marks');
assert.match(board,/snapshotButton\.innerHTML='<svg class="relphi-snapshot-icon"[^']*<use href="relphi-icons\.svg#relphi-snapshot"\/>/);
assert.match(board,/RelphiDrawingBoardSnapshot\?\.download/,'retains existing snapshot action');
assert.match(css,/> \.relphi-board-snapshot-button,\s*#shortListPanel/,'Snapshot shares the document control shape');
assert.doesNotMatch(sky,/relphi-snapshot/,'Sky Chart keeps its established wheel Copy and Download icons');

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
   for(const width of [390,1280]){
     const page=await browser.newPage({viewport:{width,height:860}});
     try{
       await page.goto('http://127.0.0.1:8000/tarot.html?board=workflow-v2#tarot',{waitUntil:'domcontentloaded',timeout:30000});
       await page.waitForFunction(()=>!!window.RelphiDrawingBoardOptionsBridge&&!!window.RelphiTarotLedgerBridge,null,{timeout:20000});
       const panel=page.locator('#shortListPanel');
       if(!(await panel.isVisible()))await page.locator('#relphiOpenDrawingBoardCurrent').click();
       await panel.waitFor({state:'visible',timeout:10000});
       const locator=page.locator('#drawing-board-document-actions #snapshotCardRowArrangement svg use');
       await locator.waitFor({state:'attached',timeout:12000});
       const state=await page.evaluate(()=>{
         const btn=document.querySelector('#drawing-board-document-actions #snapshotCardRowArrangement');
         const svg=btn?.querySelector('svg');
         const use=svg?.querySelector('use');
         const rect=btn?.getBoundingClientRect();
         const style=btn&&getComputedStyle(btn);
         return {text:btn?.textContent?.trim(),title:btn?.title,label:btn?.getAttribute('aria-label'),
           href:use?.getAttribute('href'),iconCount:btn?.querySelectorAll('svg').length,
           iconWidth:svg?getComputedStyle(svg).width:'',
           width:rect?.width,visible:style?.display!=='none' && style?.visibility!=='hidden',
           bound:btn?.dataset.relphiSnapshotBridgeBound};
       });
       assert.equal(state.visible,true,width+': Snapshot button visible');
       assert.equal(state.text,'',width+': no visible word Snapshot');
       assert.equal(state.label,'Snapshot the current board arrangement at zoom extents');
       assert.equal(state.title,state.label);
       assert.equal(state.href,'relphi-icons.svg#relphi-snapshot');
       assert.equal(state.iconCount,1,width+': exactly one SVG');
       assert.equal(state.iconWidth,'17px');
       assert.equal(state.bound,'true',width+': original snapshot action preserved');
       assert.ok(Math.abs(state.width-36)<2,width+': compact square');
     }finally{await page.close();}
   }
   console.log('Canonical Drawing Board Snapshot camera verified at mobile and desktop widths.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
