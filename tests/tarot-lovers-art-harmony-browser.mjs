import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const heading='Harmonic union · individuality preserved';
const note='Self and other can cease to be opposites without ceasing to be themselves.';
const torus='Art background · visual hypothesis';
try{
  for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
    const context=await browser.newContext({viewport});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    for(const card of [{id:'the_lovers',art:false},{id:'temperance',art:true}]){
      await page.goto('http://127.0.0.1:4173/tarot.html?card='+card.id,{waitUntil:'domcontentloaded',timeout:30000});
      const panel=page.locator('#cardDetail');
      await panel.locator('.relphi-layer').waitFor({timeout:30000});
      await page.waitForFunction(({note,heading})=>{
        const text=document.querySelector('#cardDetail')?.textContent||'';
        return text.includes(note)&&text.includes(heading);
      },{note,heading},{timeout:30000});
      const content=await panel.textContent();
      assert.ok(content.includes('two musical notes'));
      assert.ok(content.includes('doesn\'t require either note to lose its pitch'));
      assert.equal(content.includes(torus),card.art,'Art-only torus observation must not bleed onto The Lovers');
      if(card.art)assert.ok(content.includes('not a confirmed identification'));
      assert.ok(await page.locator('#browsePanel').isVisible(),'Full-card entry should open inside the Tarot Ledger');
      console.log('PASS full card '+card.id+' '+viewport.width);
    }
    assert.deepEqual(errors.filter(e=>/SyntaxError|TypeError|ReferenceError/.test(e)),[],'No critical runtime errors');
    await context.close();
  }
}finally{await browser.close()}
