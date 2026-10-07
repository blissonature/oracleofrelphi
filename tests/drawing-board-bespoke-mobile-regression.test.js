const assert=require('node:assert/strict');
const { chromium }=require('playwright');

const base=process.env.RELPHI_TEST_URL||'http://127.0.0.1:8000/tarot.html?board=workflow-v2#tarot';

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForSelector('#relphiOpenDrawingBoardCurrent',{state:'attached',timeout:20000});
    await page.waitForFunction(()=>!!window.RelphiDrawingBoardOptionsBridge&&!!window.RelphiTarotLedgerBridge,null,{timeout:20000});

    const panel=page.locator('#shortListPanel');
    if(!(await panel.isVisible())) await page.locator('#relphiOpenDrawingBoardCurrent').tap();
    await panel.waitFor({state:'visible',timeout:10000});
    await page.waitForSelector('#relphiBoardSettingsButton',{state:'visible',timeout:10000});
    await page.locator('#relphiBoardSettingsButton').tap();
    await page.waitForSelector('#drawingBoardOptionsButton',{state:'visible',timeout:10000});
    await page.locator('#drawingBoardOptionsButton').tap();
    await page.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open',{state:'visible',timeout:10000});

    await page.locator('[data-referent-path="templates"]').tap();
    await page.waitForSelector('#relphiSpreadTemplateSelect',{state:'visible',timeout:10000});
    await page.selectOption('#relphiSpreadTemplateSelect','celtic-cross-10');

    await page.locator('[data-referent-path="bespoke"]').tap();
    await page.waitForSelector('#relphiPositionLabels [data-position-label="0"]',{state:'visible',timeout:10000});
    assert.equal(
      await page.locator('#relphiPositionLabels [data-position-label="0"]').inputValue(),
      '',
      'browsing Templates must not replace the Bespoke question draft'
    );

    const geometry=await page.evaluate(()=>{
      const toolbar=document.querySelector('.relphi-question-toolbar-settings');
      const pack=document.querySelector('#relphiQuestionControllerPack');
      const cards=document.querySelector('#relphiQuestionControllerCards');
      const link=document.querySelector('#relphiQuestionControllerLink');
      const visible=node=>{
        if(!node)return false;
        const r=node.getBoundingClientRect(),s=getComputedStyle(node);
        return s.display!=='none'&&s.visibility!=='hidden'&&r.width>20&&r.height>20;
      };
      return {
        toolbar:visible(toolbar),
        toolbarWidth:toolbar?.getBoundingClientRect().width||0,
        pack:visible(pack),
        cards:visible(cards),
        link:visible(link)
      };
    });
    assert.equal(geometry.toolbar,true,'Bespoke card settings toolbar must be visible on mobile');
    assert.ok(geometry.toolbarWidth>200,'Bespoke card settings toolbar must have usable mobile width');
    assert.equal(geometry.pack,true,'Sub-pack must be visible on mobile');
    assert.equal(geometry.cards,true,'Cards per question must be visible on mobile');
    assert.equal(geometry.link,true,'Share card with must be visible on mobile');

    const undersizedMobileFields=await page.evaluate(()=>{
      const controls=Array.from(document.querySelectorAll('#shortListPanel.relphi-settings-open .relphi-board-settings-panel input, #shortListPanel.relphi-settings-open .relphi-board-settings-panel textarea, #shortListPanel.relphi-settings-open .relphi-board-settings-panel select'));
      const excluded=new Set(['checkbox','radio','color','range','button','submit','reset','hidden']);
      return controls.filter(node=>{
        if(node.tagName==='INPUT'&&excluded.has((node.getAttribute('type')||'text').toLowerCase()))return false;
        const style=getComputedStyle(node),rect=node.getBoundingClientRect();
        if(style.display==='none'||style.visibility==='hidden'||rect.width<1||rect.height<1)return false;
        return parseFloat(style.fontSize)<16;
      }).map(node=>({tag:node.tagName,id:node.id,type:node.getAttribute('type'),fontSize:getComputedStyle(node).fontSize}));
    });
    assert.deepEqual(undersizedMobileFields,[],'visible mobile Drawing Board form controls must not fall below 16px and trigger iOS focus zoom');

    await page.locator('#relphiPositionLabels [data-question-select="0"]').check();
    assert.equal(await page.locator('#relphiQuestionControllerPack').isEnabled(),true,'selected question must allow Sub-pack changes');
    assert.equal(await page.locator('#relphiQuestionControllerCards').isEnabled(),true,'selected question must allow card-count changes');
    assert.equal(await page.locator('#relphiQuestionControllerLink').isEnabled(),true,'selected question must allow shared-card linking');

    await page.locator('[data-referent-path="templates"]').tap();
    await page.waitForSelector('#relphiModifyTemplate',{state:'visible',timeout:10000});
    await page.locator('#relphiModifyTemplate').tap();
    await page.waitForSelector('[data-referent-path="bespoke"][aria-pressed="true"]',{state:'visible',timeout:10000});
    assert.equal(
      await page.locator('#relphiPositionLabels [data-position-label="0"]').inputValue(),
      'What covers you',
      'Modify a copy must remain the explicit template-to-Bespoke bridge'
    );

    assert.deepEqual(errors,[]);
    console.log('Bespoke mobile path isolation and card settings regression passed.');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
