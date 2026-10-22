import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,lon)=>{
  const v=((lon%360)+360)%360,d=v%30;
  return{name,longitude:v,sign:SIGNS[Math.floor(v/30)],degree:Math.floor(d),minute:Math.round((d%1)*60)};
};
function fixture(name,id,offset,unknown=false){
  const asc=168.38+offset,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28};
  return{name,id,houseSystem:'equal-house',houseCusps:cusps,
    metadata:{savedSkyId:id,savedSkyName:name},
    calcProfile:{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Private address · Malden, Massachusetts',timeZone:'America/New_York',latitude:42.425,longitude:-71.066,timeUnknown:unknown,houseCusps:cusps,houseSystem:'equal-house'},
    placements:Object.fromEntries(Object.entries(raw).map(([key,v])=>[key,placement(key,v+offset)]))};
}
const privateSky=fixture('Sensitive Person One','private-person-one',0);
const secondSky=fixture('Sensitive Person Two','private-person-two',18,true);
const original=fixture('Active Test Sky','active-test',2);
const browser=await chromium.launch({headless:true});
async function load(page){
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.addInitScript(({current,library})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(current));
    localStorage.removeItem('relphiSkyChartB');
    localStorage.setItem('relphiSkyLibraryV1',JSON.stringify(library));
    localStorage.setItem('relphiSkyChartLastModeV1','single');
  },{current:original,library:[privateSky,secondSky]});
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
  await page.locator('[data-saved-sky-trigger="A"]').click({timeout:20000});
  await page.waitForSelector('#skySavedSkiesPopover .sky-saved-list-row [data-private-sky-fingerprint="true"]',{timeout:20000});
  await page.waitForFunction(()=>!!document.querySelector('#skySavedSkiesPopover .sky-saved-library-instruction'),null,{timeout:10000});
}
function row(page,id){return page.locator('#skySavedSkiesPopover .sky-saved-list-row').filter({has:page.locator('[data-saved-sky-ref="'+id+'"]')})}

try{
  const desktop=await browser.newPage({viewport:{width:630,height:940}});
  const errors=[];
  desktop.on('pageerror',e=>errors.push(e.message));
  await load(desktop);
  const rows=desktop.locator('#skySavedSkiesPopover .sky-saved-list-row');
  assert.equal(await rows.count(),2,'Two saved skies should render as fingerprint cards');
  for(const id of ['private-person-one','private-person-two']){
    const entry=row(desktop,id),button=entry.locator('[data-saved-sky-ref]');
    assert.equal(await button.locator('.sky-saved-fingerprint-piece').count(),3,'One fingerprint of each of the three types');
    assert.equal(await button.locator('.sky-saved-list-name').innerText(),'','Sensitive name is not rendered initially');
    const state=await button.evaluate(node=>{
      const details=node.querySelector('[data-saved-fingerprint-copy]');
      const style=getComputedStyle(details);
      const label=node.getAttribute('aria-label');
      const name=node.closest('.sky-saved-list-row')?.querySelector('[data-saved-delete-ref]')?.getAttribute('aria-label');
      return{visibility:style.visibility,opacity:style.opacity,label,deleteLabel:name};
    });
    assert.equal(state.visibility,'hidden','Private details start concealed');
    assert.equal(state.opacity,'0','Private details start transparent');
    assert.ok(!state.label.includes('Sensitive')&&!state.label.includes('1985')&&!state.label.includes('Malden'),'No sensitive accessible labels before reveal');
    assert.ok(!state.deleteLabel.includes('Sensitive'),'Delete label must be private');
  }
  const first=row(desktop,'private-person-one');
  await desktop.screenshot({path:'saved-skies-private-default-desktop.png'});
  await first.locator('[data-saved-sky-ref]').hover();
  await desktop.waitForFunction(()=>getComputedStyle(document.querySelector('[data-saved-sky-ref="private-person-one"] [data-saved-fingerprint-copy]')).visibility==='visible');
  assert.ok((await first.locator('[data-saved-fingerprint-copy]').innerText()).includes('Sensitive Person One'),'Hover reveals name');
  assert.ok((await first.locator('[data-saved-fingerprint-copy]').innerText()).includes('Malden'),'Hover reveals location');
  await desktop.screenshot({path:'saved-skies-private-revealed-desktop.png'});
  await desktop.mouse.move(1,1);
  await desktop.waitForFunction(()=>getComputedStyle(document.querySelector('[data-saved-sky-ref="private-person-one"] [data-saved-fingerprint-copy]')).visibility==='hidden');
  await first.locator('[data-saved-sky-ref]').focus();
  assert.ok((await first.locator('[data-saved-sky-ref]').getAttribute('aria-label')).includes('Sensitive Person One'),'Focus reveals identity accessibly');
  await desktop.keyboard.press('Tab');
  assert.ok(!(await first.locator('[data-saved-sky-ref]').getAttribute('aria-label')).includes('Sensitive Person One'),'Blur re-conceals accessible name');
  await first.locator('[data-saved-delete-ref]').click();
  assert.equal(await first.locator('.sky-saved-delete-confirmation').count(),1,'Delete still requires confirmation');
  const confirm=first.locator('.sky-saved-delete-confirmation');
  assert.ok(!(await confirm.getAttribute('aria-label')).includes('Sensitive'),'Confirmation label conceals identity');
  await first.locator('[data-saved-delete-cancel]').click();
  await first.locator('[data-saved-sky-ref]').click();
  await desktop.waitForFunction(()=>document.querySelector('#skySavedSkiesPopover')?.hidden===true,{timeout:10000});
  const loaded=await desktop.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartA')));
  assert.equal(loaded.metadata.savedSkyId,'private-person-one','Normal tap/click loads the right saved sky');

  const touchContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const touch=await touchContext.newPage();
  touch.on('pageerror',e=>errors.push(e.message));
  await load(touch);
  const mobileRow=row(touch,'private-person-one'),item=mobileRow.locator('[data-saved-sky-ref]');
  const bounding=await item.boundingBox();
  assert.ok(bounding&&bounding.width>180,'Touch hit area is ample');
  // Synthetic touch pointer allows deterministic hold length without triggering click.
  await item.evaluate(node=>{
    node.dispatchEvent(new PointerEvent('pointerdown',{pointerId:12,pointerType:'touch',bubbles:true,clientX:120,clientY:400}));
  });
  await touch.waitForTimeout(610);
  assert.equal(await mobileRow.evaluate(node=>node.classList.contains('is-identity-revealed')),true,'Long press reveals the saved identity');
  await item.evaluate(node=>{
    node.dispatchEvent(new PointerEvent('pointerup',{pointerId:12,pointerType:'touch',bubbles:true,clientX:120,clientY:400}));
    node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
  });
  assert.equal(await touch.locator('#skySavedSkiesPopover').isVisible(),true,'Long press release must NOT load a sky');
  assert.equal(await touch.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartA')).id),'active-test','Long press never changes the loaded sky');
  await touch.screenshot({path:'saved-skies-private-revealed-touch.png'});
  // Tap later should still select, rather than being permanently intercepted.
  await item.click();
  await touch.waitForFunction(()=>document.querySelector('#skySavedSkiesPopover')?.hidden===true,null,{timeout:10000});
  assert.equal(await touch.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartA')).metadata?.savedSkyId),'private-person-one','A later tap still loads the saved sky');
  assert.deepEqual(errors.filter(e=>/SyntaxError|TypeError|ReferenceError/.test(e)),[],'No critical runtime errors');
  await touchContext.close();
  await desktop.close();
}finally{
  await browser.close();
}
console.log('Private fingerprint picker tests passed: concealed default, hover, keyboard, delete, touch hold, and tap.');
