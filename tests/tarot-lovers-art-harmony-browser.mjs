import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const passage='Self and other can cease to be opposites without ceasing to be themselves.';
try{
  for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
    const context=await browser.newContext({viewport});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    for(const card of [{id:'the_lovers',art:false},{id:'temperance',art:true}]){
      await page.goto('http://127.0.0.1:4173/tarot.html?card='+card.id,{waitUntil:'domcontentloaded',timeout:30000});
      const panel=page.locator('#cardDetail');
      const upright=panel.locator('.locked-relphi-priority');
      const reversed=panel.locator('.relphi-reversed-priority');
      await upright.waitFor({timeout:30000});
      await reversed.waitFor({timeout:30000});
      await page.waitForFunction(passage=>document.querySelector('#cardDetail .locked-relphi-priority')?.textContent?.includes(passage),passage,{timeout:30000});
      assert.equal(await upright.count(),1,'Exactly one main Relphi-derived interpretation');
      assert.equal(await reversed.count(),1,'Exactly one canonical reversed counterpart');
      const uprightText=await upright.textContent(),reversedText=await reversed.textContent();
      assert.ok(uprightText.includes('two musical notes'));
      assert.ok(uprightText.includes("doesn't require either note to lose its pitch"));
      assert.equal(uprightText.includes('visual hypothesis'),card.art,'Torus is only Art and explicitly hypothetical');
      if(card.art){
        assert.match(reversedText,/conformity in place of communion/);
        assert.match(uprightText,/spiral tori/);
      }else assert.match(reversedText,/reluctant participation for freely chosen intimacy/);
      assert.ok(!((await panel.locator('.relphi-layer').allTextContents()).join(' ').includes('two musical notes')),'No duplicate reflection in secondary Relphi fields');
      assert.ok(await page.locator('#browsePanel').isVisible(),'Canonical full-card detail opens in Ledger');
      console.log('PASS upright + reversed '+card.id+' '+viewport.width);
    }
    assert.deepEqual(errors.filter(e=>/SyntaxError|TypeError|ReferenceError/.test(e)),[],'No critical runtime errors');
    await context.close();
  }
}finally{await browser.close()}
