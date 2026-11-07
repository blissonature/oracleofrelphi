import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';
const placement=(name,longitude)=>({name,longitude,sign:'Libra',degree:12,minute:0});
const sky=(name,id,offset)=>({name,id,metadata:{savedSkyId:id,savedSkyName:name},houseSystem:'equal-house',
 houseCusps:Array.from({length:12},(_,i)=>(165+30*i)%360),
 calcProfile:{dateTime:'2026-10-20T12:00',instant:'2026-10-20T18:00:00.000Z',location:'Sensitive City',timeZone:'America/Denver',latitude:40.76,longitude:-111.89,houseSystem:'equal-house'},
 placements:Object.fromEntries(Object.entries({Sun:195,Moon:118,Venus:167,Mars:225,Mercury:208,Saturn:255,Uranus:288,Neptune:310,Jupiter:330,Pluto:270,Ascendant:165,Midheaven:75}).map(([k,v])=>[k,placement(k,v+offset)]))});
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:620,height:900}});
 page.on('pageerror',e=>console.log('PAGE ERROR',e.message));
 await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
 await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
 const alpha=sky('Family Birthday','family-1',0),beta=sky('Client Consultation','client-1',14),study=sky('Study Session','study-1',22);
 await page.addInitScript(({alpha,beta,study})=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(alpha));
  localStorage.setItem('relphiSkyChartB',JSON.stringify(beta));
  localStorage.setItem('relphiSkyLibraryV1',JSON.stringify([alpha,beta,study]));
  localStorage.setItem('relphiSkyChartLastModeV1','comparison');
  // A historical assignment to an old built-in category is not proof that
  // the user explicitly created a folder.
  localStorage.setItem('relphiSkyCardFoldersV1',JSON.stringify({'family-1':'Family'}));
 },{alpha,beta,study});
 await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
 await page.locator('[data-saved-sky-trigger="A"]').click({timeout:20000});
 await page.waitForTimeout(250);
 await page.waitForSelector('#skySavedSkiesPopover.sky-library-redesigned .sky-library-controls',{timeout:10000});
 assert.equal(await page.locator('#skySavedSkiesPopover .sky-saved-list-row:not([hidden])').count(),3);
 assert.equal(await page.locator('#skySavedSkiesPopover .sky-library-identity-overlay').count(),3);
 assert.equal(await page.locator('#skySavedSkiesPopover .sky-library-folders [data-sky-library-folder]').count(),0,
   'No category chips before the user creates a folder');
 assert.equal(await page.locator('#skySavedSkiesPopover .sky-library-folders').isHidden(),true,
   'Folder filter strip is absent without user-created folders');
 assert.equal(await page.locator('#skySavedSkiesPopover [data-sky-folder-edit]').count(),0,
   'No meaningless per-sky folder controls before folders exist');
 assert.equal(await page.locator('#skySavedSkiesPopover [data-sky-library-add-folder]').count(),1,
   'The user can create a folder without suggested categories');
 const escaped=await page.locator('#skySavedSkiesPopover [data-saved-sky-ref]').evaluateAll(buttons=>buttons.filter(button=>{
   const copy=button.querySelector('[data-saved-fingerprint-copy]');
   return !copy||!copy.closest('.sky-library-identity-overlay');
 }).map(button=>button.dataset.savedSkyRef));
 assert.deepEqual(escaped,[],'Identity is mounted only inside the concealed overlay');
 // The title chevron opens the saved-chart picker directly. Primary actions
 // precede filtering, and Sky slot management is a footer, not a competing header.
 assert.equal(await page.locator('#skySavedSkiesPopover .sky-saved-subview-head').count(),0);
 assert.equal(await page.locator('#skySavedSkiesPopover .sky-saved-list > :first-child [data-sky-command="new"]').count(),1);
 assert.equal(await page.locator('#skySavedSkiesPopover [data-sky-command="load"]').count(),0);
 const order=await page.locator('#skySavedSkiesPopover').evaluate(menu=>({
   list:[...menu.children].findIndex(x=>x.classList.contains('sky-saved-list')),
   footer:[...menu.children].findIndex(x=>x.classList.contains('sky-library-slot-actions'))
 }));
 assert.ok(order.list>=0&&order.footer>order.list,'Slot management follows the library list');
 await page.setViewportSize({width:390,height:780});
 await page.waitForTimeout(160);
 const mobile=await page.locator('#skySavedSkiesPopover').evaluate(menu=>{
   const bounds=menu.getBoundingClientRect(),list=menu.querySelector('.sky-saved-list');
   return{left:bounds.left,right:bounds.right,viewport:innerWidth,
      listOverflow:list.scrollWidth-list.clientWidth,
      first:list.firstElementChild?.querySelector('[data-sky-command]')?.dataset.skyCommand};
 });
 assert.ok(mobile.left>=0&&mobile.right<=mobile.viewport,
   'Mobile picker stays within viewport: '+JSON.stringify(mobile));
 assert.equal(mobile.first,'new','New Sky remains first on mobile');
 assert.ok(mobile.listOverflow<=1,'Saved Skies content does not overflow horizontally on mobile');
 await page.setViewportSize({width:620,height:900});
 await page.waitForTimeout(100);
 const defaultState=await page.locator('#skySavedSkiesPopover [data-saved-sky-ref="family-1"]').evaluate(el=>{
  const overlay=el.querySelector('.sky-library-identity-overlay');
  return{opacity:getComputedStyle(overlay).opacity,display:getComputedStyle(overlay).visibility,
    details:el.querySelector('[data-saved-fingerprint-copy]')?getComputedStyle(el.querySelector('[data-saved-fingerprint-copy]')).display:'none'};
 });
 assert.equal(defaultState.display,'hidden','Identity overlay is concealed by default');
 assert.equal(defaultState.details,'grid','Identity details live inside the concealed overlay, not a separate column');
 await page.screenshot({path:'sky-card-library-modern-default.png',fullPage:false});
 await page.locator('[data-saved-sky-ref="family-1"]').hover();
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-saved-sky-ref="family-1"] .sky-library-identity-overlay')).visibility==='visible',null,{timeout:3000});
 await page.screenshot({path:'sky-card-library-modern-revealed.png',fullPage:false});
 await page.locator('[data-sky-library-search]').fill('consultation');
 assert.equal(await page.locator('#skySavedSkiesPopover .sky-saved-list-row:not([hidden])').count(),1,'Search by name filters private cards');
 assert.equal(await page.locator('#skySavedSkiesPopover .sky-saved-list-row:not([hidden]) [data-saved-sky-ref]').getAttribute('data-saved-sky-ref'),'client-1');
 await page.locator('[data-sky-library-search]').fill('');
 page.once('dialog',dialog=>dialog.accept('Clients'));
 await page.locator('#skySavedSkiesPopover [data-sky-library-add-folder]').click();
 await page.waitForSelector('#skySavedSkiesPopover .sky-library-folders [data-sky-library-folder="Clients"]');
 const folderLabels=await page.locator('#skySavedSkiesPopover .sky-library-folders [data-sky-library-folder]').allTextContents();
 assert.deepEqual(folderLabels,['All','Clients','Unfiled'],
   'Only explicitly created categories appear, plus navigation filters');
 assert.equal(await page.locator('.sky-library-folders [data-sky-library-folder="All"]').getAttribute('aria-pressed'),'true',
   'After creating a folder, keep All selected so records can be assigned');
 const action=page.locator('[data-saved-sky-ref="client-1"]').locator('..').locator('[data-sky-folder-edit]');
 await action.click();
 await page.locator('[data-saved-sky-ref="client-1"]').locator('..').locator('[data-sky-folder-select]').selectOption('Clients');
 await page.locator('.sky-library-folders [data-sky-library-folder="Clients"]').click();
 assert.equal(await page.locator('#skySavedSkiesPopover .sky-saved-list-row:not([hidden])').count(),1,'Folder filters rows');
 assert.equal(await page.locator('#skySavedSkiesPopover .sky-saved-list-row:not([hidden]) [data-saved-sky-ref]').getAttribute('data-saved-sky-ref'),'client-1','Assigned folder persists');
 await page.locator('.sky-library-folders [data-sky-library-folder="All"]').click();
 assert.equal(await page.locator('[data-sky-card-swap]').isEnabled(),true);
 await page.locator('[data-sky-card-swap]').click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('relphiSkyChartA')).metadata?.savedSkyId==='client-1',null,{timeout:7000});
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartB')).metadata?.savedSkyId),'family-1','Sky B becomes former A');
 await page.locator('[data-saved-sky-trigger="A"]').click();
 await page.waitForSelector('[data-sky-card-unload]');
 await page.locator('[data-sky-card-unload]').click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('relphiSkyChartA'))?.metadata?.savedSkyId==='family-1',null,{timeout:8000});
 assert.equal(await page.evaluate(()=>localStorage.getItem('relphiSkyChartB')),null,'Unloading A promotes B and removes B');
 // Loading a real row must NOT dispatch the folder-filter action, even after
 // the user has created a folder and used its filter.
 await page.locator('[data-saved-sky-trigger="A"]').click();
 await page.locator('#skySavedSkiesPopover [data-saved-sky-ref="client-1"]').click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('relphiSkyChartA')||'null')?.metadata?.savedSkyId==='client-1',null,{timeout:7000});
 assert.equal(await page.locator('#skySavedSkiesPopover').isVisible(),false,'Selecting a sky closes the picker');
 console.log('Sky Card library acceptance passed: compact identity overlay, search, folders, swap, unload/promote.');
} finally{await browser.close()}
