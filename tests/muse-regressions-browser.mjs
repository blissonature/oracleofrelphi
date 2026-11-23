import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const base='http://127.0.0.1:8000/';
fs.mkdirSync('test-results',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const reports=[];
async function check(name,run){
  try{await run();reports.push({name,status:'PASS'});console.log('PASS',name)}
  catch(error){reports.push({name,status:'FAIL',error:String(error.stack||error)});console.error('FAIL',name,error)}
}
async function newPage(width){
  const context=await browser.newContext({viewport:{width,height:900},timezoneId:'America/Denver',acceptDownloads:true});
  const page=await context.newPage();
  page.on('pageerror',e=>console.error('PAGEERROR',page.url(),e.message));
  return {page,context};
}
try {
  for(const width of [1280,390]){
    await check('Glyph Trainer canonical symbols and classification '+width,async()=>{
      const {page,context}=await newPage(width);
      try{
        await page.goto(base+'glyphs.html',{waitUntil:'domcontentloaded',timeout:30000});
        await page.waitForFunction(()=>document.querySelectorAll('#glyphGrid .glyph-card').length>=45,{timeout:18000});
        await page.waitForFunction(()=>['Sun','Moon','Aries','Trine'].every(name=>{
          const card=[...document.querySelectorAll('#glyphGrid .glyph-card')].find(el=>el.querySelector('h3')?.textContent===name);
          return card?.querySelector('svg .relphi-canonical-glyph');
        }),{timeout:25000});
        const results=await page.evaluate(()=>{
          const cards=[...document.querySelectorAll('#glyphGrid .glyph-card')];
          return Object.fromEntries(['Sun','Moon','Aries','Trine'].map(name=>{
            const item=cards.find(card=>card.querySelector('h3')?.textContent===name);
            const art=item?.querySelector('svg .relphi-canonical-glyph');
            let box;try{box=art?.getBBox()}catch(_){}
            return [name,{kind:item?.querySelector('.glyph-kind')?.textContent,
              id:art?.dataset.canonicalGlyphId,
              primitives:art?.querySelectorAll('path,circle,line,ellipse,polygon,polyline,rect').length||0,
              bbox:box?{width:box.width,height:box.height}:null,
              hasBubble:!!item?.querySelector('.relphi-glyph-bubble')}];
          }));
        });
        assert.equal(results.Sun.id,'sun');assert.equal(results.Moon.id,'moon');assert.equal(results.Aries.id,'aries');assert.equal(results.Trine.id,'trine');
        assert.match(results.Trine.kind,/Aspect/i);
        for(const info of Object.values(results)){assert.ok(info.primitives>0,JSON.stringify(info));assert.equal(info.hasBubble,false)}
        await page.screenshot({path:'test-results/muse-glyphs-'+width+'.png'});
      }finally{await context.close()}
    });
    await check('Astrology Foundations sign sizing '+width,async()=>{
      const {page,context}=await newPage(width);
      try{
        await page.goto(base+'astrology-foundations.html',{waitUntil:'domcontentloaded',timeout:30000});
        await page.locator('[data-kind="signs"]').click({timeout:10000});
        await page.waitForFunction(()=>document.querySelectorAll('.foundation-matrix .front-glyph[data-canonical-glyph-id]').length===12,{timeout:30000});
        const result=await page.evaluate(()=>{
          return [...document.querySelectorAll('.foundation-matrix .flip-tile')].map(tile=>{
            const icon=tile.querySelector('svg.front-glyph'),face=tile.querySelector('.flip-front');
            if(!icon)return {error:'missing glyph'};
            const i=icon.getBoundingClientRect(),f=face.getBoundingClientRect();
            return {id:icon.dataset.canonicalGlyphId,icon:{w:i.width,h:i.height},face:{w:f.width,h:f.height},
              overflow:i.left<f.left-2||i.right>f.right+2||i.top<f.top-2||i.bottom>f.bottom+2};
          });
        });
        assert.equal(result.length,12);assert.ok(result.every(v=>!v.error&&!v.overflow&&v.icon.w<=v.face.w&&v.icon.h<=v.face.h),JSON.stringify(result));
        await page.screenshot({path:'test-results/muse-foundations-'+width+'.png'});
      }finally{await context.close()}
    });
    await check('Planetary Hours demo timezone '+width,async()=>{
      const {page,context}=await newPage(width);
      try{
        await page.goto(base+'planetaryhours.html',{waitUntil:'domcontentloaded',timeout:30000});
        await page.waitForFunction(()=>!!document.querySelector('#tzSelect')?.value,{timeout:16000});
        const packet=await page.evaluate(()=>({
          tz:document.querySelector('#tzSelect')?.value,
          lat:Number(document.querySelector('#lat')?.value),
          name:document.querySelector('#locationSearch')?.value,
          sunrise:document.querySelector('#sunTimes')?.textContent||''
        }));
        assert.equal(packet.tz,'Europe/London',JSON.stringify(packet));
        assert.ok(Math.abs(packet.lat-51.4769)<.01);
        assert.match(packet.name,/Greenwich/);
        assert.match(packet.sunrise,/sunrise/i);
        await page.screenshot({path:'test-results/muse-planetary-'+width+'.png'});
      }finally{await context.close()}
    });
    await check('Tarot search add card and reload x4 '+width,async()=>{
      const {page,context}=await newPage(width);
      try{
        await page.goto(base+'tarot.html',{waitUntil:'domcontentloaded',timeout:30000});
        await page.waitForFunction(()=>!!window.RelphiTarotLedgerBridge&&!!window.RelphiDrawingBoardOptionsBridge,{timeout:30000});
        await page.locator('#oracleCommand').fill('Moon');
        await page.locator('#runCommand').click();
        await page.waitForFunction(()=>document.querySelectorAll('#cardList .or-card').length>3,{timeout:14000});
        const add=page.locator('#cardList [data-shortlist]').first();
        await add.click({timeout:15000});
        await page.waitForFunction(()=>{
          const snap=window.RelphiDrawingBoardOptionsBridge?.capture?.();return snap?.shortList?.length>0;
        },{timeout:13000});
        await page.waitForTimeout(350);
        for(let i=1;i<=4;i++){
          await page.reload({waitUntil:'domcontentloaded',timeout:30000});
          await page.waitForFunction(()=>window.RelphiDrawingBoardOptionsBridge?.capture?.()?.shortList?.length>0,{timeout:20000});
          await page.waitForFunction(()=>document.querySelector('#shortListPanel .card-row-item'),{timeout:15000});
          await page.evaluate(()=>document.body.dataset.museResponsive=String(Date.now()));
          console.log('responsive reload',width,i);
        }
        await page.locator('#relphiOpenDrawingBoardCurrent').waitFor({state:'visible'});
        const expanded=await page.locator('#relphiOpenDrawingBoardCurrent').getAttribute('aria-expanded');
        if(expanded!=='true')await page.locator('#relphiOpenDrawingBoardCurrent').click();
        await page.locator('#shortListPanel .card-row-item').first().waitFor({state:'visible',timeout:15000});
        await page.screenshot({path:'test-results/muse-tarot-board-'+width+'.png'});
      }finally{await context.close()}
    });
  }
}finally{await browser.close()}
fs.writeFileSync('test-results/muse-report.json',JSON.stringify(reports,null,2));
if(reports.some(r=>r.status==='FAIL'))process.exitCode=1;
