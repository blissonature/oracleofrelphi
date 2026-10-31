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
   await page.waitForFunction(()=>window.RELPHI_THEME_SEARCH?.themeCount===597 && !!window.RELPHI_KEYWORD_SUBPACK_CONTEXT,{timeout:25000});
   const cases=[
     ['despair',2],['suffering',4],['despair and suffering',4],['secrets',3],
     ['abandonment',2],['abandoned',2],['abandon a goal',1],
     ['abandonment of pursuit',1],['being abandoned',1],['feeling abandoned',1],
     ['safe',1],['safety',1],['miscarriage',1],
     ['despair?',2],['suffering!',4],['agony',1],['heartache',1],
     ['deprivation',2],['destitution',1],['serenity',2],
     ['desperate',1],['rebirth',3],['betray',5],
     ['love',7],['betrayal',5],['cruelty',1],['oppression',1],['ruin',2],
     ['development',1],['divorce',0],['cheating',1],['infidelity',0],
     // Audited everyday-life topics: direct qualification, not transitive association.
     ['anger',1],['angry',1],['panic',1],['war',2],['revenge',1],
     ['attack',1],['shame',2],['bullying',2],['victimization',2],
     ['loneliness',1],['lonely',1],['homelessness',1],['housing insecurity',1],
     ['unemployment',1],['trust',2],['loyalty',1],['honesty',2],
     ['abuse',2],['coercion',1],['harassment',1],
     ['stress',1],['emptiness',1],['ecstasy',1],['manifestation',2],
     ['gain',1],['profit',1],['income',2],['salary',2],['budget',2],
     ['arrival',1],['reconciliation',1],['self control',1],
     ['dating',2],['fight',6],['purpose',3],
     ['depression',0],['fraud',0],
     ['compromise',0],['corruption',0],['injury',0]
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
   for(const t of ['despair','suffering','oppression','development','abandonment','being abandoned','safety','miscarriage','cheating','loneliness','shame','trust','abuse','budget'])assert.ok(leak.catalog.some(label=>label.toLowerCase()===t),t);
   for(const term of ['depression','fraud','compromise','corruption','injury','apology','parenting','meditation','eviction','graduation']){
     await page.locator('#oracleCommand').fill(term);
     await page.locator('#runCommand').click();
     await page.waitForFunction(()=>document.getElementById('activeSummary')?.textContent.includes('Explore separately'),{timeout:10000});
     assert.ok(await page.locator('#activeSummary .relphi-theme-suggestion').count()>0,term+' directness guard');
   }
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
   // Exercise the actual Free Draw keyword picker, not merely its backing API.
   await page.locator('#relphiBoardSettingsButton').click();
   await page.locator('#relphiFreePack').selectOption('tags');
   await page.locator('#relphiKeywordQuery').fill('despair');
   const despairChoice=page.locator('#relphiKeywordMatches [data-keyword-choice][value="despair"]');
   await despairChoice.waitFor({state:'visible',timeout:10000});
   // The dialog re-renders immediately on selection, so click rather than Playwright.check()
   // (which expects the original checkbox element to survive the click).
   await despairChoice.click();
   await page.waitForFunction(()=>
     document.querySelector('#relphiKeywordCount')?.textContent.includes('2 cards in this sub-pack'),
     {timeout:10000});
   await page.locator('#relphiConfirmFreeSettings').click();
   assert.equal(await page.evaluate(()=>window.RELPHI_KEYWORD_SUBPACK_CONTEXT.count(['despair'])),2);
   // Switch the real Drawing Board keyword pool to abandonment and verify
   // direct membership without broad loss/rejection contamination.
   await page.locator('#relphiBoardSettingsButton').click();
   await page.locator('[data-keyword-remove="despair"]').click();
   await page.locator('#relphiKeywordQuery').fill('abandonment');
   const abandonChoice=page.locator('#relphiKeywordMatches [data-keyword-choice][value="abandonment"]');
   await abandonChoice.waitFor({state:'visible',timeout:10000});
   await abandonChoice.click(); // The selection re-renders the form.
   await page.waitForFunction(()=>document.querySelector('#relphiKeywordCount')?.textContent.includes('2 cards in this sub-pack'),{timeout:10000});
   await page.locator('#relphiConfirmFreeSettings').click();
   assert.equal(await page.evaluate(()=>window.RELPHI_KEYWORD_SUBPACK_CONTEXT.count(['abandonment'])),2);
   // The full domain review must also surface newly qualified everyday themes
   // inside the actual Drawing Board picker.
   await page.locator('#relphiBoardSettingsButton').click();
   await page.locator('[data-keyword-remove="abandonment"]').click();
   await page.locator('#relphiKeywordQuery').fill('trust');
   const trustChoice=page.locator('#relphiKeywordMatches [data-keyword-choice][value="trust"]');
   await trustChoice.waitFor({state:'visible',timeout:10000});
   await trustChoice.click();
   await page.waitForFunction(()=>document.querySelector('#relphiKeywordCount')?.textContent.includes('2 cards in this sub-pack'),{timeout:10000});
   await page.locator('#relphiConfirmFreeSettings').click();
   assert.equal(await page.evaluate(()=>window.RELPHI_KEYWORD_SUBPACK_CONTEXT.count(['trust'])),2);
   // Unqualified terms must offer visible navigation without changing the pool.
   await page.locator('#relphiBoardSettingsButton').click();
   await page.locator('[data-keyword-remove="trust"]').click();
   await page.locator('#relphiKeywordQuery').fill('apology');
   const related=page.locator('#relphiKeywordMatches [data-keyword-navigate="regret"]');
   await related.waitFor({state:'visible',timeout:10000});
   assert.ok((await page.locator('#relphiKeywordCount').textContent()).includes('Choose one or more tags'));
   await related.click();
   await page.locator('#relphiKeywordMatches [data-keyword-choice][value="regret"]').click();
   await page.waitForFunction(()=>document.querySelector('#relphiKeywordCount')?.textContent.includes('2 cards in this sub-pack'),{timeout:10000});
   assert.equal(await page.locator('#relphiKeywordQuery').inputValue(),'regret','Query survives selection re-render');
   await page.locator('#relphiConfirmFreeSettings').click();
   assert.equal(await page.evaluate(()=>window.RELPHI_KEYWORD_SUBPACK_CONTEXT.count(['regret'])),2);
   // Typos offer corrections, never implicit card qualification.
   await page.locator('#relphiBoardSettingsButton').click();
   await page.locator('[data-keyword-remove="regret"]').click();
   await page.locator('#relphiKeywordQuery').fill('secrects');
   await page.locator('#relphiKeywordMatches [data-keyword-navigate="secrecy"]').waitFor({state:'visible',timeout:10000});
   assert.ok((await page.locator('#relphiKeywordCount').textContent()).includes('Choose one or more tags'));
   await page.locator('#relphiKeywordMatches [data-keyword-navigate="secrecy"]').click();
   await page.locator('#relphiKeywordMatches [data-keyword-choice][value="secrecy"]').click();
   await page.waitForFunction(()=>document.querySelector('#relphiKeywordCount')?.textContent.includes('3 cards in this sub-pack'),{timeout:10000});
   await page.locator('#relphiConfirmFreeSettings').click();
   assert.equal(await page.evaluate(()=>window.RELPHI_KEYWORD_SUBPACK_CONTEXT.count(['secrecy'])),3);

   assert.deepEqual(errors,[],`uncaught browser errors at ${viewport.width}px`);
   console.log('PASS browser width='+viewport.width+' queries='+cases.length+' Drawing Board + navigation');
   await page.close();
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
