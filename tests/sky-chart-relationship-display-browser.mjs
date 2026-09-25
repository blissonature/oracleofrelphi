import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1100,height:900}});
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.RelphiSkyRelationshipDisplay,{timeout:30000});
  await page.waitForSelector('#skyFoundationFocus [data-relationship-display-control]',{timeout:30000});

  await page.evaluate(()=>window.RelphiSkyRelationshipDisplay.setState({glyphs:true,names:true,referents:true}));
  const control=page.locator('#skyFoundationFocus [data-relationship-display-control]');
  await control.locator('[data-relationship-display-value]').click();
  await page.waitForSelector('#skyRelationshipDisplayPopover:not([hidden])');

  const names=page.locator('#skyRelationshipDisplayPopover [data-shared-display-layer="names"]');
  await names.uncheck();
  await page.waitForFunction(()=>{
    const text=document.querySelector('[data-relationship-display-value-text]')?.textContent?.trim();
    return text==='Glyphs · Referents';
  });

  let state=await page.evaluate(()=>({
    controls:document.querySelectorAll('#skyFoundationFocus [data-relationship-display-control]').length,
    summary:document.querySelector('[data-relationship-display-value-text]')?.textContent?.trim()||'',
    names:document.querySelector('#skyRelationshipDisplayPopover [data-shared-display-layer="names"]')?.checked,
    menuOpen:!document.getElementById('skyRelationshipDisplayPopover')?.hidden,
    menuPortaled:document.getElementById('skyRelationshipDisplayPopover')?.parentElement===document.body
  }));
  assert.deepEqual(state,{controls:1,summary:'Glyphs · Referents',names:false,menuOpen:true,menuPortaled:true});

  await page.evaluate(()=>{
    window.dispatchEvent(new CustomEvent('relphi:sky-foundation-ready'));
    window.dispatchEvent(new CustomEvent('relphi:selected-relationship-rendered'));
  });
  await page.waitForTimeout(80);

  state=await page.evaluate(()=>({
    controls:document.querySelectorAll('#skyFoundationFocus [data-relationship-display-control]').length,
    summary:document.querySelector('[data-relationship-display-value-text]')?.textContent?.trim()||'',
    names:document.querySelector('#skyRelationshipDisplayPopover [data-shared-display-layer="names"]')?.checked,
    menuOpen:!document.getElementById('skyRelationshipDisplayPopover')?.hidden,
    menuPortaled:document.getElementById('skyRelationshipDisplayPopover')?.parentElement===document.body
  }));
  assert.deepEqual(state,{controls:1,summary:'Glyphs · Referents',names:false,menuOpen:true,menuPortaled:true},'Reconciliation must not orphan or recreate the open Display menu.');

  await page.evaluate(()=>window.RelphiSkyRelationshipDisplay.setState({glyphs:true,names:true,referents:true}));
  await page.waitForFunction(()=>{
    const summary=document.querySelector('[data-relationship-display-value-text]')?.textContent?.trim();
    const names=document.querySelector('#skyRelationshipDisplayPopover [data-shared-display-layer="names"]');
    return summary==='All'&&names?.checked===true;
  });

  assert.equal(await page.locator('#skyFoundationFocus [data-relationship-display-control]').count(),1,'Display must retain one stable owner while its menu is portaled.');
  console.log('Relationship Display menu stays synchronized while open.');
}finally{
  await browser.close();
}
