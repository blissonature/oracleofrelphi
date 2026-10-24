const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');

const js=fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const css=fs.readFileSync('drawing-board-workflow-v2.css','utf8');
const sky=fs.readFileSync('sky-chart-export-v2.js','utf8');
const skyIcon=sky.match(/const ICON='(<svg[^']+<\/svg>)';/);
const boardIcon=js.match(/if \(kind === 'download'\) return '(<svg[^']+<\/svg>)';/);
assert.ok(skyIcon && boardIcon,'both Sky Chart and Drawing Board must define a download glyph');
assert.equal(boardIcon[1],skyIcon[1],'Drawing Board must reuse the exact established download icon');
assert.match(js,/const downloadButton=take\('downloadRowHtml','','Download the reading as HTML with card art and text'\);/);
assert.match(js,/downloadButton\.innerHTML=icon\('download'\)/);
assert.match(css,/> \.relphi-board-download-button\{[\s\S]*?width:2\.25rem!important/);
assert.match(css,/> \.relphi-board-download-button > svg\{[\s\S]*?width:17px!important/);

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
        await page.locator('#drawing-board-document-actions #downloadRowHtml svg path').waitFor({state:'attached',timeout:12000});
        const result=await page.evaluate(()=>{
          const button=document.querySelector('#drawing-board-document-actions #downloadRowHtml');
          const icon=button?.querySelector('svg');
          const path=icon?.querySelector('path');
          const rect=button?.getBoundingClientRect();
          return {visible:!!button&&getComputedStyle(button).display!=='none',
            text:button?.textContent?.trim(),title:button?.title,label:button?.getAttribute('aria-label'),
            iconCount:button?.querySelectorAll('svg').length,path:path?.getAttribute('d'),
            stroke:path?.getAttribute('stroke-width'),svgWidth:icon?getComputedStyle(icon).width:'',
            buttonWidth:rect?.width};
        });
        assert.equal(result.visible,true,width+': Download action must be visible');
        assert.equal(result.text,'',width+': visible Download word must be removed');
        assert.equal(result.label,'Download the reading as HTML with card art and text');
        assert.equal(result.title,result.label);
        assert.equal(result.iconCount,1,width+': exactly one Download svg');
        assert.equal(result.path,'M12 3v11m0 0-4-4m4 4 4-4M5 15v4h14v-4');
        assert.equal(result.stroke,'1.9');
        assert.equal(result.svgWidth,'17px');
        assert.ok(Math.abs(result.buttonWidth-36)<2,width+': compact square Download control');
      }finally{await page.close();}
    }
    console.log('Drawing Board icon-only Download matches Sky Chart at desktop/mobile widths.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
