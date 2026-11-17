import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const positions={
  A:{Sun:50,Moon:200,Mercury:80,Venus:170,Mars:260,Jupiter:10,Saturn:350,Uranus:140,Neptune:310,Pluto:20},
  B:{Sun:170,Moon:350,Mercury:320,Venus:230,Mars:110,Jupiter:50,Saturn:140,Uranus:20,Neptune:260,Pluto:290}
};
function sky(slot){
  const asc=slot==='A'?168:185;
  const cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
  const placements=Object.fromEntries(Object.entries(positions[slot]).map(([name,longitude])=>[name,{name,longitude}]));
  placements.Ascendant={name:'Ascendant',longitude:asc};
  placements.Descendant={name:'Descendant',longitude:(asc+180)%360};
  placements.Midheaven={name:'Midheaven',longitude:(asc+270)%360};
  placements.IC={name:'IC',longitude:(asc+90)%360};
  return{name:'Limit test '+slot,houseSystem:'porphyry',houseCusps:cusps,placements,
    calcProfile:{instant:'2026-11-14T19:00:00Z',houseSystem:'porphyry',houseCusps:cusps}};
}
const browser=await chromium.launch({headless:true});
try{
  for(const width of [1280,390]){
    const isMobile=width===390;
    const context=await browser.newContext({viewport:{width,height:880},isMobile,hasTouch:isMobile});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(({a,b})=>{
      localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
      localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
      localStorage.setItem('relphiSkyChartLastModeV1','comparison');
      localStorage.setItem('relphiSkyHarmonicWindowV1','12');
    },{a:sky('A'),b:sky('B')});
    await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:40000});
    await page.locator('#skyFoundationRoot[aria-busy="false"]').waitFor({timeout:30000});
    const control=page.locator('#skyFoundationRelationships .sky-relationship-limit-control');
    const select=control.locator('select[data-relationship-limit-preset]');
    const input=control.locator('input[data-relationship-limit]');
    await select.waitFor({state:'visible',timeout:30000});
    await page.waitForFunction(()=>document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row').length>15,{timeout:30000});
    assert.equal(await control.count(),1,'Only one owned limit control');
    assert.equal(await select.inputValue(),'all');
    assert.equal(await input.isVisible(),false,'Custom input hidden until chosen');
    assert.equal(await page.evaluate(()=>window.RelphiRelationshipLimit?.get?.()),'all');

    await select.selectOption('10');
    assert.equal(await page.evaluate(()=>window.RelphiRelationshipLimit.get()),'10');
    const before=await select.boundingBox();
    await select.selectOption('custom');
    await input.waitFor({state:'visible'});
    const editing=await page.evaluate(()=>{
      const sel=document.querySelector('[data-relationship-limit-preset]');
      const inp=document.querySelector('[data-relationship-limit]');
      return{active:document.activeElement===inp,blank:inp.value==='',
        selectHidden:sel.hidden,selectDisabled:sel.disabled,inputMode:inp.inputMode,
        inputType:inp.type,pattern:inp.pattern,placeholders:inp.placeholder};
    });
    assert.deepEqual([editing.active,editing.blank,editing.selectHidden,editing.selectDisabled],
      [true,true,true,true],'Choosing Custom closes select and focuses blank replacement');
    assert.equal(editing.inputMode,'numeric');
    assert.equal(editing.inputType,'text','Do not accept e, - or decimal native number syntax');
    assert.equal(editing.pattern,'[1-9][0-9]*');
    assert.equal(editing.placeholders,'','Editing field is visually blank');
    const during=await input.boundingBox();
    // Autofocus may scroll the page to bring the field into view.
    // Compare both controls to their shared slot in the CURRENT viewport,
    // rather than comparing old and new screen Y across page scroll.
    const slot=await control.boundingBox();
    assert.ok(Math.abs(before.width-during.width)<1
      &&Math.abs(slot.x-during.x)<1&&Math.abs(slot.y-during.y)<1
      &&Math.abs(slot.width-during.width)<1,
      'Custom input occupies precisely the existing dropdown slot');
    await input.fill('-37');
    assert.equal(await input.inputValue(),'','A negative paste must be rejected, not converted to positive');
    await input.fill('4.5');
    assert.equal(await input.inputValue(),'','A decimal must be rejected');
    await input.fill('3e2');
    assert.equal(await input.inputValue(),'','Exponent notation must be rejected');
    await input.fill('0');
    assert.equal(await input.inputValue(),'','Zero must be rejected');
    await input.fill('9007199254740992');
    assert.equal(await input.inputValue(),'','Unsafe integer must be rejected');
    await input.fill('37');
    assert.equal(await input.inputValue(),'37','A positive integer is accepted');
    await input.press('Enter');
    await select.waitFor({state:'visible'});
    assert.equal(await input.isVisible(),false,'Enter finishes editing in the same slot');
    assert.equal(await select.inputValue(),'37','Saved custom value is selected');
    assert.equal(await select.locator('option:checked').textContent(),'37','Saved numeric value is displayed, not Custom');
    assert.equal(await page.evaluate(()=>window.RelphiRelationshipLimit.get()),'37');
    assert.equal(await select.locator('option[value="custom"]').count(),1,'Custom remains available to edit again');

    await select.selectOption('custom');
    await input.waitFor({state:'visible'});
    assert.equal(await input.inputValue(),'','Repeated Custom always opens blank, even after saved custom');
    assert.equal(await input.evaluate(n=>document.activeElement===n),true);
    await input.fill('51');
    await input.press('Escape');
    await select.waitFor({state:'visible'});
    assert.equal(await select.inputValue(),'37','Escape restores committed numeric value');
    assert.equal(await page.evaluate(()=>window.RelphiRelationshipLimit.get()),'37');

    await select.selectOption('custom');
    await input.fill('12');
    await input.blur();
    await select.waitFor({state:'visible'});
    assert.equal(await select.inputValue(),'12','Blur commits a valid positive integer');
    await select.selectOption('5');
    await page.waitForFunction(()=>window.RelphiRelationshipLimit?.get?.()==='5');
    await page.waitForFunction(()=>document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row.sky-chart-result-limit-hidden').length>0);
    const cap=await page.evaluate(()=>{
      const rows=[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row')];
      return{all:rows.length,capped:rows.filter(n=>n.classList.contains('sky-chart-result-limit-hidden')).length,
        shown:rows.filter(n=>!n.classList.contains('sky-chart-result-limit-hidden')).length,
        value:window.RelphiRelationshipLimit.get()};
    });
    assert.equal(cap.value,'5');
    assert.ok(cap.capped>0,'Preset limit must hide excess relationships');
    assert.ok(cap.shown>=5,'Limit does not delete authored relationship rows');
    await select.selectOption('custom');
    await input.fill('0');
    await input.blur();
    await select.waitFor({state:'visible'});
    assert.equal(await select.inputValue(),'5','Invalid or empty custom leaves previous cap untouched');
    await select.selectOption('all');
    assert.equal(await page.evaluate(()=>window.RelphiRelationshipLimit.get()),'all');
    await page.waitForFunction(()=>document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row.sky-chart-result-limit-hidden').length===0);
    assert.deepEqual(errors,[],'No browser exceptions');
    console.log('PASS Relationships single-field Custom + integer validation + cap',JSON.stringify({width,editing,cap}));
    await context.close();
  }
}finally{await browser.close()}
