const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const base=process.env.RELPHI_TEST_URL||'http://127.0.0.1:8000/tarot.html?board=workflow-v2#tarot';
const out=path.join(__dirname,'..','test-results');
fs.mkdirSync(out,{recursive:true});
async function openBoard(page){
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForSelector('#relphiOpenDrawingBoardCurrent',{timeout:20000});
  await page.waitForFunction(()=>!!window.RelphiDrawingBoardOptionsBridge&&!!window.RelphiTarotLedgerBridge,null,{timeout:20000});
  if(!(await page.locator('#shortListPanel').isVisible()))
    await page.locator('#relphiOpenDrawingBoardCurrent').click();
  await page.locator('#relphiMainQuestion').waitFor({state:'visible',timeout:15000});
}
async function assertChrome(page,label){
  const data=await page.evaluate(()=>{
    const root=document.querySelector('#shortListPanel');
    const bar=root.querySelector('.relphi-board-commandbar').getBoundingClientRect();
    const strip=root.querySelector('.relphi-main-composer').getBoundingClientRect();
    const workspace=root.querySelector('.drawing-board-board-mode').getBoundingClientRect();
    const actions=[...root.querySelectorAll('.relphi-main-strip > button[data-main-action]')].map(x=>x.dataset.mainAction);
    const overflow=[...root.querySelectorAll('.relphi-main-strip > button,.relphi-main-strip > details > summary,#relphiMainQuestion')]
      .filter(e=>{const r=e.getBoundingClientRect(),style=getComputedStyle(e);
        return style.display!=='none'&&r.width>0&&(r.left<strip.left-2||r.right>strip.right+2);
      }).map(e=>e.outerHTML.slice(0,120));
    return {bar:bar.toJSON(),strip:strip.toJSON(),workspace:workspace.toJSON(),
      tabVisible:[...root.querySelectorAll('.drawing-board-mode-switch')].some(e=>getComputedStyle(e).display!=='none'),
      settings:!!root.querySelector('#relphiBoardSettingsButton'),actions,overflow,
      scroll:root.querySelector('.relphi-main-composer').scrollWidth,
      width:root.querySelector('.relphi-main-composer').clientWidth};
  });
  assert.equal(data.settings,false,label+': no Settings button');
  assert.equal(data.tabVisible,false,label+': no Free/Crafted tabs');
  assert.ok(data.strip.top>=data.bar.top,label+': chrome belongs above the board');
  assert.ok(data.strip.bottom<=data.workspace.bottom,label+': controls stay within the board header');
  assert.ok(data.strip.height<140,label+': compact chrome, got '+data.strip.height);
  assert.deepEqual(data.overflow,[],label+': no horizontal button overflow');
  assert.ok(data.scroll<=data.width+2,label+': no horizontal scrolling (scroll='+data.scroll+', width='+data.width+', bar='+JSON.stringify(data.bar)+', strip='+JSON.stringify(data.strip)+')');
  assert.deepEqual(data.actions.filter(x=>['filters','methods','appearance'].includes(x)),['filters','methods','appearance']);
}
async function clickSummary(page,selector){
  const item=page.locator(selector);
  if(!(await item.evaluate(e=>e.open)))await item.locator(':scope > summary').click();
}
(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const desktop=await browser.newContext({viewport:{width:1280,height:920}});
    const page=await desktop.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e.stack||e)));
    await openBoard(page);
    await assertChrome(page,'Desktop');
    assert.equal(await page.locator('[data-main-default="repeats"]').isChecked(),false,'New visitor shipped Repeats OFF');
    await clickSummary(page,'.relphi-main-draw-defaults');
    await page.locator('[data-main-default="repeats"]').check();
    assert.equal(await page.locator('[data-main-default="repeats"]').isChecked(),true);
    await page.locator('#relphiMainQuestion').fill('What is asking for my attention?');
    await page.locator('[data-main-action="append"]').click();
    await page.locator('#relphiMainQuestion').fill('What is my next step?');
    await page.locator('[data-main-action="append"]').click();
    await clickSummary(page,'.relphi-main-journal');
    assert.equal(await page.locator('[data-main-text]').count(),2,'Questions stored in compact journal');
    await clickSummary(page,'[data-main-question-options="0"]');
    await page.locator('[data-main-setting="cards"][data-main-index="0"]').fill('2');
    await page.locator('[data-main-setting="cards"][data-main-index="0"]').dispatchEvent('change');
    assert.equal(await page.locator('[data-main-setting="cards"][data-main-index="0"]').inputValue(),'2');
    await page.locator('[data-main-select="1"]').check();
    await page.locator('[data-main-action="up"]').click();
    assert.equal(await page.locator('[data-main-text="0"]').inputValue(),'What is my next step?');
    await assertChrome(page,'Desktop populated');
    await page.screenshot({path:path.join(out,'drawing-board-main-desktop.png'),fullPage:true});
    await page.reload({waitUntil:'domcontentloaded'});
    if(!(await page.locator('#shortListPanel').isVisible()))await page.locator('#relphiOpenDrawingBoardCurrent').click();
    await page.locator('#relphiMainQuestion').waitFor({state:'visible'});
    assert.equal(await page.locator('[data-main-default="repeats"]').isChecked(),true,'Repeats is local and sticky');
    assert.equal(await page.locator('[data-main-text]').count(),2,'Questions persist locally');
    await page.locator('[data-main-action="ready"]').click();
    await page.waitForFunction(()=>window.RelphiDrawingBoardOptionsBridge?.capture?.()?.shortListPositionLabels?.length===3,null,{timeout:20000});
    assert.equal(await page.locator('.relphi-main-question-text').count(),2,'Two questions remain grouped despite three cards');
    await page.screenshot({path:path.join(out,'drawing-board-main-ready.png'),fullPage:true});
    await page.locator('#drawRandomRowCard').click();
    const attune=page.locator('.relphi-attune-reader [data-attune-random]');
    if(await attune.waitFor({state:'visible',timeout:2500}).then(()=>true).catch(()=>false))await attune.click();
    await page.waitForFunction(()=>document.querySelectorAll('.relphi-main-question-reading').length>0,null,{timeout:15000});
    assert.equal(await page.locator('#drawing-board-reading-text').isHidden(),true,'No duplicate reading text');
    assert.equal(await page.locator('.relphi-main-question-row.is-reading').first().locator('[data-reading-slot="0"]').count(),1,'Interpretation directly under its question');
    assert.deepEqual(errors,[],'No desktop browser exceptions');

    const menus=await browser.newContext({viewport:{width:1050,height:850}});
    const options=await menus.newPage(),optionErrors=[];
    options.on('pageerror',e=>optionErrors.push(String(e)));
    await openBoard(options);
    assert.equal(await options.locator('.relphi-main-sky-source').count(),0,'Only one Sky Connector');
    assert.equal(await options.locator('[data-sky-choice]').count(),1);
    await clickSummary(options,'.relphi-main-template-disclosure');
    await options.selectOption('#relphiMainTemplate','past-present-future-3');
    await options.locator('[data-main-action="template-add"]').click();
    assert.deepEqual(await options.locator('[data-main-text]').evaluateAll(nodes=>nodes.map(n=>n.value)),['Past','Present','Future']);
    await clickSummary(options,'.relphi-main-building-disclosure');
    await options.selectOption('[data-main-building="sign"]','Libra');
    await options.locator('[data-main-action="blocks-add"]').click();
    assert.equal(await options.locator('[data-main-text]').count(),6);
    await options.screenshot({path:path.join(out,'drawing-board-compact-sources.png'),fullPage:true});
    await options.locator('[data-main-action="methods"]').click();
    await options.locator('[data-referent-path="surface"]').waitFor({state:'visible',timeout:15000});
    assert.equal(await options.locator('.relphi-board-settings-panel').isVisible(),true,'Methods open from chrome');
    await options.locator('[data-main-action="methods"]').click();
    await options.locator('[data-main-action="appearance"]').click();
    await options.locator('.relphi-board-configuration .relphi-appearance-body').waitFor({state:'visible'});
    assert.equal(await options.locator('[data-card-controls-master]').isVisible(),true,'Card controls have a Board home');
    assert.equal(await options.locator('.relphi-board-background').isVisible(),true,'Background controls have a Board home');
    await options.locator('[data-main-action="appearance"]').click();
    await options.locator('[data-main-action="filters"]').click();
    await options.locator('#relphiFreePack').waitFor({state:'visible'});
    assert.equal(await options.locator('#relphiFreePack').isVisible(),true,'Free pack filters have a chrome home');
    await options.screenshot({path:path.join(out,'drawing-board-compact-filters.png'),fullPage:true});
    assert.deepEqual(optionErrors,[],'No menu browser errors');
    await menus.close();

    const mobile=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const phone=await mobile.newPage(),mobileErrors=[];
    phone.on('pageerror',e=>mobileErrors.push(String(e)));
    await openBoard(phone);
    await assertChrome(phone,'Mobile');
    assert.equal(await phone.locator('[data-main-default="repeats"]').isChecked(),false);
    await phone.locator('#relphiMainQuestion').fill('What is unfolding?');
    await phone.locator('[data-main-action="append"]').tap();
    assert.equal(await phone.locator('.relphi-main-question-row').count(),1);
    await phone.screenshot({path:path.join(out,'drawing-board-main-mobile.png'),fullPage:true});
    await phone.locator('[data-main-action="ready"]').tap();
    await phone.waitForFunction(()=>window.RelphiDrawingBoardOptionsBridge?.capture?.()?.shortListPositionLabels?.length===1,null,{timeout:20000});
    assert.equal(await phone.locator('.relphi-main-question-text').count(),1);
    assert.deepEqual(mobileErrors,[],'No mobile browser exceptions');
    console.log('PASS: compact chrome, Settings removed, Free/Crafted removed, first-time defaults, sticky preferences, sources, Methods, Filters, Board, questions and interpretation');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
