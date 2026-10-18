const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const base='http://127.0.0.1:8000/tarot.html';

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1180,height:900}});
    page.setDefaultTimeout(30000);
    const errors=[];
    page.on('pageerror',error=>errors.push(error?.stack||String(error)));

    await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>!!window.RelphiDrawingBoardOptionsBridge && !!document.querySelector('#drawingBoardOptionsButton'),null,{timeout:20000});

    const panel=page.locator('#shortListPanel');
    if(!(await panel.isVisible())) await page.click('#relphiOpenDrawingBoardCurrent');
    await panel.waitFor({state:'visible'});
    await page.click('#relphiBoardSettingsButton');
    await page.locator('#drawingBoardOptionsButton').click();
    await page.waitForSelector('.relphi-referents-drawer',{state:'visible'});

    await page.click('[data-referent-path="templates"]');
    await page.selectOption('#relphiSpreadTemplateSelect','relphi-recursion-13');
    await page.waitForSelector('.relphi-recursion-template-note',{state:'visible'});

    const templateCopy=await page.locator('.relphi-recursion-template-note').innerText();
    assert.ok(templateCopy.includes('Four recursive levels'));
    assert.ok(templateCopy.includes('13 cards'));
    assert.ok(templateCopy.includes('three black circles'));
    assert.ok(templateCopy.includes('red circle is Earth'));
    assert.ok(templateCopy.includes('Level 4'));

    await page.click('#relphiApplyOptions');
    await page.waitForSelector('.relphi-referents-drawer',{state:'detached'});
    console.log('RECURSION_AFTER_APPLY',JSON.stringify(await page.evaluate(()=>{
      const state=window.RelphiDrawingBoardOptionsBridge?.capture?.();
      const toast=document.querySelector('.relphi-board-toast');
      return {id:state?.rowActiveLayout?.id,count:state?.rowActiveLayout?.positions?.length,cardCount:state?.rowActiveLayout?.cardCount,boardClass:document.querySelector('#shortListPanel')?.className,toast:toast?.outerHTML?.slice(0,600),settings:!!document.querySelector('.relphi-board-settings-panel')};
    })));
    await page.waitForFunction(()=>window.RelphiDrawingBoardOptionsBridge.capture().rowActiveLayout?.id==='relphi-recursion-13');

    const toast=page.locator('.relphi-board-toast');
    if(await toast.count()){
      const readingToast=await toast.innerText();
      assert.ok(readingToast.includes('active black circle opens white'));
      assert.ok(readingToast.includes('red Earth circle wakes up'));
      assert.ok(readingToast.includes('four worlds'));
      assert.equal(await page.locator('.relphi-board-toast-action').textContent(),'Enter Level 1');
    }

    const configured=await page.evaluate(()=>window.RelphiDrawingBoardOptionsBridge.capture());
    assert.equal(configured.rowActiveLayout?.id,'relphi-recursion-13');
    assert.equal(configured.rowActiveLayout?.name,'Relphi Recursive Reading');
    assert.equal(configured.rowActiveLayout?.cardCount,13);
    assert.equal(configured.rowActiveLayout?.virtualPositionCount,3);
    assert.equal(configured.shortListPositionLabels.length,13,'Only card-bearing positions belong to the card-slot array');
    assert.equal(configured.rowActiveLayout.positions.length,13,'Three Earth portals must stay virtual rather than becoming empty card slots');
    assert.deepEqual(
      configured.rowActiveLayout.positions.slice(0,3).map(item=>item.recursionElement),
      ['mem','aleph','shin']
    );
    assert.equal(configured.rowActiveLayout.positions.at(-1).recursionElement,'earth');
    assert.equal(configured.rowActiveLayout.positions.at(-1).recursionLevel,4);

    const levelOne=configured.rowActiveLayout.positions.filter(item=>item.recursionLevel===1);
    const mem=levelOne.find(item=>item.recursionElement==='mem');
    const aleph=levelOne.find(item=>item.recursionElement==='aleph');
    const shin=levelOne.find(item=>item.recursionElement==='shin');
    const earth=configured.rowActiveLayout.positions.at(-1);
    assert.equal(mem.transform.y,aleph.transform.y,'Mem and Aleph should occupy the top row of the logo');
    assert.equal(mem.transform.x,shin.transform.x,'Mem and Shin should occupy the left column of the logo');
    assert.equal(aleph.transform.x,earth.transform.x,'Aleph and Earth should occupy the right column of the logo');
    assert.equal(shin.transform.y,earth.transform.y,'Shin and Earth should occupy the bottom row of the logo');

    assert.equal(await page.locator('#shortListPanel').evaluate(node=>node.classList.contains('relphi-recursion-reading')),true);
    assert.equal(await page.locator('.card-row-board>.relphi-recursion-logo-underlay').count(),1,'The Relphi logo should underlay the active recursive level');
    assert.ok((await page.locator('.relphi-recursion-logo-underlay').getAttribute('src')).endsWith('assets/relphi-logo-tight.svg'),'Recursive Reading should use the tightly cropped logo asset');
    const logoGeometry=await page.locator('.relphi-recursion-logo-underlay').evaluate(node=>{const r=node.getBoundingClientRect();return {w:r.width,h:r.height};});
    assert.ok(Math.abs(logoGeometry.w-logoGeometry.h)<1,'The cropped logo should remain square');
    assert.equal(await page.locator('.card-row-board>.card-row-item.is-recursion-level-active').count(),3,'Level 1 should expose only its triad on the Board');
    assert.equal(await page.locator('.relphi-recursion-board-depth [data-recursion-depth]').count(),4);
    assert.equal(await page.locator('.relphi-recursion-board-depth').getAttribute('aria-label'),'Four worlds · recursion depth');
    const worlds=await page.locator('.relphi-recursion-board-depth [data-recursion-depth]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('title')));
    assert.deepEqual(worlds,['Level 1 · Atziluth','Level 2 · Beriah','Level 3 · Yetzirah','Level 4 · Assiah']);
    assert.equal(await page.locator('.relphi-recursion-board-depth [data-recursion-depth="1"]').evaluate(node=>node.classList.contains('is-current')),true);
    const veilvaCell=await page.locator('.relphi-recursion-board-depth [data-recursion-depth="1"]').evaluate(node=>{const r=node.getBoundingClientRect();return {w:r.width,h:r.height,radius:getComputedStyle(node).borderRadius,bg:getComputedStyle(node).backgroundColor};});
    assert.ok(Math.abs(veilvaCell.w-veilvaCell.h)<1,'Each world rung should be square');
    assert.equal(veilvaCell.radius,'0px','The worlds should read as a four-rung ladder, not a string of circles');
    assert.equal(veilvaCell.bg,'rgb(220, 31, 24)','The active world rung should be red');
    await page.waitForFunction(()=>{
      const input=document.querySelector('#rowZoom');
      return input && Number(input.min)>0.02;
    });
    const recursionZoom=await page.evaluate(()=>({value:Number(document.querySelector('#rowZoom')?.value),min:Number(document.querySelector('#rowZoom')?.min)}));
    assert.ok(recursionZoom.min>0.02,'Recursive Reading should raise the generic zoom-out floor');
    await page.evaluate(()=>{
      const input=document.querySelector('#rowZoom');
      input.value='0.02';
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));
      document.querySelector('.relphi-zoom-step')?.click();
    });
    const clampedZoom=await page.evaluate(()=>Number(document.querySelector('#rowZoom')?.value));
    assert.ok(clampedZoom>=recursionZoom.min-.001,'Recursive Reading should not zoom out below its fitted layout floor');
    assert.equal(await page.locator('.relphi-recursion-circle-states .relphi-recursion-state-circle').count(),3);
    assert.equal(await page.locator('[data-recursion-circle="mem"]').evaluate(node=>node.classList.contains('is-current')),true,'Mem should be the first active logo circle');
    const activeCircle=await page.locator('[data-recursion-circle="mem"]').evaluate(node=>({bg:getComputedStyle(node).backgroundColor,border:getComputedStyle(node).borderColor}));
    assert.match(activeCircle.bg,/^rgba?\(255, 255, 255(?:, 0\.9\d+)?\)/,'The active logo circle should open nearly white');
    assert.equal(activeCircle.border,'rgb(17, 17, 17)','The active logo circle should keep a black stroke');
    assert.equal(await page.locator('.relphi-recursion-board-portal').isDisabled(),true,'Earth must remain closed until Mem, Aleph, and Shin are complete');
    assert.equal(await page.locator('.relphi-recursion-board-portal').evaluate(node=>node.parentElement?.classList.contains('card-row-board')),true,'The Earth portal should occupy the logo itself, not float below it');
    assert.equal(await page.locator('.relphi-recursion-board-portal').evaluate(node=>getComputedStyle(node).backgroundColor),'rgb(220, 31, 24)','The logo red circle is the Earth portal');

    const recursionAttuneScrollY=await page.evaluate(()=>{
      document.body.style.minHeight='2600px';
      window.scrollTo(0,640);
      return window.scrollY;
    });
    await page.evaluate(()=>{const action=document.querySelector('.relphi-board-toast-action');if(action)action.click();else document.querySelector('.card-row-board>.card-row-item.is-recursion-level-active')?.click()});
    await page.waitForSelector('.relphi-attune-reader',{state:'visible'});
    assert.ok((await page.locator('.relphi-attune-shell h2').textContent()).includes('Mem'));
    const recursionAttuneViewport=await page.evaluate(()=>({
      bodyPosition:document.body.style.position,
      bodyTop:document.body.style.top,
      overlayTop:document.querySelector('.relphi-attune-reader')?.getBoundingClientRect().top,
      overlayBottom:document.querySelector('.relphi-attune-reader')?.getBoundingClientRect().bottom,
      viewportHeight:window.innerHeight
    }));
    assert.equal(recursionAttuneViewport.bodyPosition,'fixed');
    assert.equal(recursionAttuneViewport.bodyTop,(-recursionAttuneScrollY)+'px');
    assert.equal(Math.round(recursionAttuneViewport.overlayTop),0);
    assert.equal(Math.round(recursionAttuneViewport.overlayBottom),Math.round(recursionAttuneViewport.viewportHeight));
    await page.click('.relphi-attune-close');
    await page.waitForSelector('.relphi-attune-reader',{state:'detached'});
    assert.ok(Math.abs((await page.evaluate(()=>window.scrollY))-recursionAttuneScrollY)<=1,'Closing Recursive Attune should restore the exact page scroll position');
    await page.evaluate(()=>document.querySelector('.card-row-board>.card-row-item.is-recursion-level-active')?.click());
    await page.waitForSelector('.relphi-attune-reader',{state:'visible'});

    let cardCircleHeightChecked=false;
    async function drawAttuned(){
      await page.waitForSelector('.relphi-attune-reader',{state:'visible'});
      await page.click('[data-attune-random]');
      await page.waitForSelector('.relphi-focus-reader',{state:'visible'});
      if(!cardCircleHeightChecked){
        const sizing=await page.evaluate(()=>{
          const item=document.querySelector('.card-row-board>.card-row-item.is-recursion-level-active.is-recursion-drawn');
          const face=item?.querySelector('.card-row-card-wrap');
          const key=item?.dataset?.relphiRecursionElement;
          const circle=document.querySelector('[data-recursion-circle="'+key+'"]');
          if(!face||!circle)return null;
          return {cardH:face.getBoundingClientRect().height,circleH:circle.getBoundingClientRect().height};
        });
        assert.ok(sizing,'A drawn recursive card and its logo circle should both be measurable');
        console.log('RECURSION_CIRCLE_DIMENSIONS',JSON.stringify(sizing));
        assert.ok(Math.abs(sizing.cardH-sizing.circleH)<=8,'A recursive card should occupy essentially the full height of its logo circle');
        cardCircleHeightChecked=true;
      }
    }

    async function nextToAttune(){
      await page.click('.relphi-focus-next');
      await page.waitForSelector('.relphi-attune-reader',{state:'visible'});
    }

    async function completeTriad(level){
      for(let slot=0;slot<3;slot++){
        await drawAttuned();
        const expected=['mem','aleph','shin'][slot];
        const current=await page.evaluate(()=> {
          const state=window.RelphiDrawingBoardOptionsBridge.capture();
          const index=Number(document.querySelector('.relphi-focus-reader')?.dataset?.focusIndex);
          return state.rowActiveLayout?.positions?.[index] || null;
        });
        assert.equal(current?.recursionLevel,level);
        assert.equal(current?.recursionElement,expected);
        if(slot<2) await nextToAttune();
      }
    }

    for(let level=1;level<=3;level++){
      await completeTriad(level);
      const cardCount=await page.locator('#shortListPanel .card-row-board [data-row-card]').count();
      assert.equal(cardCount,level*3);

      await page.click('.relphi-focus-next');
      await page.waitForSelector('.relphi-focus-reader.is-recursion-portal',{state:'visible'});

      assert.ok((await page.locator('.relphi-recursion-portal-focus').innerText()).includes('Earth'));
      assert.ok((await page.locator('.relphi-recursion-portal-focus').innerText()).includes('Descend'));
      assert.equal(await page.locator('.relphi-recursion-focus-node.is-earth-portal').count(),1);
      assert.equal(await page.locator('.relphi-recursion-focus-node.is-earth-portal').isDisabled(),false);
      assert.equal(await page.locator('.relphi-recursion-board-portal').evaluate(node=>node.classList.contains('is-ready')),true,'The red Earth circle should visibly wake up when the triad is complete');
      assert.equal(await page.locator('#shortListPanel .card-row-board [data-row-card]').count(),level*3,'Entering Earth must not draw a fourth card on Levels 1–3');

      await page.click('[data-recursion-descend]');
      await page.waitForSelector('.relphi-attune-reader',{state:'visible'});
      assert.ok((await page.locator('.relphi-attune-shell h2').textContent()).includes('Level '+(level+1)));
      assert.ok((await page.locator('.relphi-attune-shell h2').textContent()).includes('Mem'));

      assert.equal(
        await page.locator('.relphi-recursion-board-depth [data-recursion-depth="'+(level+1)+'"]').evaluate(node=>node.classList.contains('is-current')),
        true
      );
      assert.equal(await page.locator('.card-row-board>.card-row-item.is-recursion-level-active').count(),level===3?4:3);
    }

    // Level 4 still begins with the same triad.
    await completeTriad(4);
    assert.equal(await page.locator('#shortListPanel .card-row-board [data-row-card]').count(),12);

    // Level 4 uses the same red circle as the explicit action for card 13.
    assert.equal(await page.locator('.relphi-recursion-focus-node.is-earth-portal').count(),0);
    assert.equal(await page.locator('.relphi-recursion-board-portal').count(),1,'The red logo circle should remain actionable for card 13');
    assert.equal(await page.locator('.relphi-recursion-board-portal').isDisabled(),false);
    assert.ok((await page.locator('.relphi-recursion-board-portal').innerText()).includes('Draw card 13'));
    await page.click('.relphi-recursion-board-portal');
    await page.waitForSelector('.relphi-attune-reader',{state:'visible'});
    const finalReferent=await page.locator('.relphi-attune-shell h2').textContent();
    assert.ok(finalReferent.includes('Level 4'));
    assert.ok(finalReferent.includes('Earth'));
    assert.ok(finalReferent.includes('Completion'));

    await drawAttuned();
    assert.equal(await page.locator('#shortListPanel .card-row-board [data-row-card]').count(),13);

    const finalState=await page.evaluate(()=>window.RelphiDrawingBoardOptionsBridge.capture());
    const finalIndex=Number(await page.locator('.relphi-focus-reader').getAttribute('data-focus-index'));
    assert.equal(finalIndex,12);
    assert.equal(finalState.rowActiveLayout.positions[finalIndex].recursionElement,'earth');
    assert.equal(finalState.rowActiveLayout.positions[finalIndex].recursionLevel,4);
    await page.waitForFunction(()=>document.querySelector('.relphi-recursion-complete-mark')?.textContent?.includes('13 / 13'));
    assert.ok((await page.locator('.relphi-recursion-complete-mark').first().textContent()).includes('complete'));

    // Opened depths remain revisitable without flattening the reading into a 13-card filmstrip.
    assert.equal(await page.locator('.relphi-recursion-depth [data-recursion-depth]:not(:disabled)').count(),4);
    assert.equal(await page.locator('.relphi-focus-strip [data-focus-position]').count(),0,'Recursive Focus should not duplicate the board as a miniature logo navigator');
    assert.equal(await page.locator('.relphi-focus-fan').count(),0);

    assert.deepEqual(errors,[]);
    console.log('Relphi Recursive Reading preserves three virtual Earth portals, four worlds, and terminal thirteenth Earth card.');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
