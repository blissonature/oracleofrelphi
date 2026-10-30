'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.RELPHI_TEST_URL || 'http://127.0.0.1:8075/tarot.html';
(async ()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const viewport of [{width:1365,height:900},{width:390,height:844}]){
   const page=await browser.newPage({viewportSize:viewport});
   const errors=[];
   page.on('pageerror',err=>errors.push(String(err)));
   await page.goto(base,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.RELPHI_THEME_SEARCH?.themeCount===563 && !!window.RELPHI_KEYWORD_SUBPACK_CONTEXT,{timeout:25000});
   const cases=[
     ['despair',2],['suffering',4],['despair and suffering',4],['secrets',3],
     ['love',7],['betrayal',4],['cruelty',1],['oppression',1],['ruin',2],
     ['development',1],['divorce',0],['cheating',0],['infidelity',0]
   ];
   for(const [term,count] of cases){
     await page.locator('#oracleCommand').fill(term);
     await page.locator('#runCommand').click();
     await page.waitForFunction(expected => {
       const el=document.getElementById('resultInlineCount');
       return !!el && el.textContent.trim()===expected;
     },count===0?'No cards shown':`${count} ${count===1?'card':'cards'} shown`,{timeout:15000});
     const direct=await page.evaluate(t=>window.RELPHI_THEME_SEARCH.directCardIds(t).length,term);
     assert.equal(direct,count,term+' semantic count');
   }
   const leak=await page.evaluate(()=>({
     love:window.RELPHI_THEME_SEARCH.directCardIds('love'),
     betrayal:window.RELPHI_THEME_SEARCH.directCardIds('betrayal'),
     suffering:window.RELPHI_THEME_SEARCH.directCardIds('suffering'),
     catalog:window.RELPHI_KEYWORD_SUBPACK_CONTEXT.catalog(),
     selected:window.RELPHI_KEYWORD_SUBPACK_CONTEXT.count(['suffering'])
   }));
   assert.ok(!leak.love.includes('seven_of_swords'));
   assert.ok(!leak.love.includes('nine_of_swords'));
   assert.equal(leak.selected,4);
   for(const t of ['despair','suffering','oppression','development'])assert.ok(leak.catalog.some(label=>label.toLowerCase()===t),t);
   await page.locator('#oracleCommand').fill('divorce');
   await page.locator('#runCommand').click();
   await page.locator('#relphiThemeNavigation:visible').waitFor({timeout:10000});
   assert.equal(await page.locator('#relphiThemeNavigation .relphi-theme-suggestion').count()>0,true);
   await page.locator('#relphiThemeNavigation .relphi-theme-suggestion').first().click();
   await page.waitForFunction(()=>window.RELPHI_THEME_SEARCH?.directCardIds(document.getElementById('oracleCommand').value).length>0,{timeout:10000});
   // Open the actual Drawing Board, verifying available vocabulary remains accessible.
   await page.locator('#relphiOpenDrawingBoardCurrent').click();
   await page.waitForFunction(()=>!document.getElementById('shortListPanel').hidden,{timeout:15000});
   assert.equal(await page.locator('#shortListPanel').isVisible(),true);
   assert.deepEqual(errors,[],`uncaught browser errors at ${viewport.width}px`);
   console.log('PASS browser width='+viewport.width+' queries='+cases.length+' Drawing Board + navigation');
   await page.close();
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
