const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const { chromium }=require('playwright');

const out=path.resolve(__dirname,'..','test-results');
fs.mkdirSync(out,{recursive:true});

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1191,height:859}});
    const errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    await page.goto('http://127.0.0.1:8000/drawing-board.html',{waitUntil:'domcontentloaded',timeout:30000});
    const frame=page.frames().find(candidate=>candidate!==page.mainFrame());
    assert.ok(frame,'standalone Drawing Board iframe must load');
    await frame.waitForSelector('#shortListPanel',{state:'visible',timeout:20000});
    await frame.waitForFunction(()=>!!window.RelphiDrawingBoardOptionsBridge && !!document.querySelector('#drawingBoardOptionsButton'),null,{timeout:20000});

    await frame.click('#drawingBoardOptionsButton');
    await frame.waitForSelector('.relphi-reading-options-drawer.is-reading-options-open #relphiSpreadTemplateSelect',{state:'visible',timeout:10000});
    await frame.selectOption('#relphiSpreadTemplateSelect','celtic-cross-10');
    await frame.click('#relphiApplyOptions');
    await frame.waitForFunction(()=>document.querySelector('#shortListPanel')?.classList.contains('relphi-celtic-readable'),null,{timeout:10000});
    await frame.waitForTimeout(250);

    const geometry=await frame.evaluate(()=>{
      const root=document.querySelector('#shortListPanel');
      const crossing=root?.querySelector('.card-row-item[data-relphi-position-id="crossing"],.card-row-item[data-row-index="1"]');
      const before=root?.querySelector('.card-row-item[data-relphi-position-id="before"],.card-row-item[data-row-index="5"]');
      const covering=root?.querySelector('.card-row-item[data-relphi-position-id="covering"],.card-row-item[data-row-index="0"]');
      const face=crossing?.querySelector('.card-row-card-wrap,.card-row-drop-card');
      const label=crossing?.querySelector(':scope>.card-row-position-panel');
      const beforeFace=before?.querySelector('.card-row-card-wrap,.card-row-drop-card');
      const coverLabel=covering?.querySelector(':scope>.card-row-position-panel');
      if(!crossing||!face||!label||!beforeFace||!coverLabel)return null;
      const r=node=>{const b=node.getBoundingClientRect();return{left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height,cx:b.left+b.width/2,cy:b.top+b.height/2}};
      return{face:r(face),label:r(label),before:r(beforeFace),coverLabel:r(coverLabel),labelText:label.textContent.trim(),transform:getComputedStyle(label).transform};
    });

    assert.ok(geometry,'crossing label geometry must be measurable');
    assert.match(geometry.labelText,/crosses/i);
    assert.ok(geometry.label.left>=geometry.face.right+1,'What crosses you should sit to the right of the horizontal crossing card: '+JSON.stringify(geometry));
    assert.ok(geometry.label.right<=geometry.before.left-1,'What crosses you must stay inside the clear corridor before What is before you: '+JSON.stringify(geometry));
    assert.ok(Math.abs(geometry.label.cy-geometry.face.cy)<=3,'crossing label should be vertically centered on the horizontal card: '+JSON.stringify(geometry));
    assert.ok(geometry.label.top>=geometry.coverLabel.bottom+1 || geometry.label.left>=geometry.coverLabel.right+1,'covering and crossing labels must not stack on the same central axis: '+JSON.stringify(geometry));
    assert.deepEqual(errors,[]);

    await page.screenshot({path:path.join(out,'drawing-board-crossing-label.png'),fullPage:true});
    console.log('Drawing Board crossing label sits beside the horizontal card.');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1)});
