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
 },{alpha,beta,study});
 await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
 await page.locator('[data-saved-sky-trigger="A"]').click({timeout:20000});
 await page.waitForSelector('#skySavedSkiesPopover.sky-library-redesigned .sky-library-controls',{timeout:10000});
 assert.equal(await page.locator('#skySavedSkiesPopover .sky-saved-list-row:not([hidden])').count(),3);
 assert.equal(await page.locator('#skySavedSkiesPopover .sky-library-identity-overlay').count(),3);
 const defaultState=await page.locator('#skySavedSkiesPopover [data-saved-sky-ref="family-1"]').evaluate(el=>{
  const overlay=el.querySelector('.sky-library-identity-overlay');
  return{opacity:getComputedStyle(overlay).opacity,display:getComputedStyle(overlay).visibility,
    details:el.querySelector('[data-saved-fingerprint-copy]')?getComputedStyle(el.querySelector('[data-saved-fingerprint-copy]')).display:'none'};
 });
 assert.equal(defaultState.display,'hidden','Identity overlay is concealed by default');
 assert.equal(defaultState.details,'none','No empty sensitive detail column');
 await page.screenshot({path:'sky-card-library-modern-default.png',fullPage:false});
 await page.locator('[data-saved-sky-ref="family-1"]').hover();
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-saved-sky-ref="family-1"] .sky-library-identity-overlay')).visibility==='visible',null,{timeout:3000});
 await page.screenshot({path:'sky-card-library-modern-revealed.png',fullPage:false});
 await page.locator('[data-sky-library-search]').fill('consultation');
 assert.equal(await page.locator('#skySavedSkiesPopover .sky-saved-list-row:not([hidden])').count(),1,'Search by name filters private cards');
 assert.equal(await page.locator('#skySavedSkiesPopover .sky-saved-list-row:not([hidden]) [data-saved-sky-ref]').getAttribute('data-saved-sky-ref'),'client-1');
 await page.locator('[data-sky-library-search]').fill('');
 const action=page.locator('[data-saved-sky-ref="client-1"]').locator('..').locator('[data-sky-folder-edit]');
 await action.click();
 await page.locator('[data-saved-sky-ref="client-1"]').locator('..').locator('[data-sky-folder-select]').selectOption('Clients');
 await page.locator('[data-sky-library-folder="Clients"]').click();
 assert.equal(await page.locator('#skySavedSkiesPopover .sky-saved-list-row:not([hidden])').count(),1,'Folder filters rows');
 assert.equal(await page.locator('#skySavedSkiesPopover .sky-saved-list-row:not([hidden]) [data-saved-sky-ref]').getAttribute('data-saved-sky-ref'),'client-1','Assigned folder persists');
 await page.locator('[data-sky-library-folder="All"]').click();
 assert.equal(await page.locator('[data-sky-card-swap]').isEnabled(),true);
 await page.locator('[data-sky-card-swap]').click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('relphiSkyChartA')).metadata?.savedSkyId==='client-1',null,{timeout:7000});
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartB')).metadata?.savedSkyId),'family-1','Sky B becomes former A');
 await page.locator('[data-saved-sky-trigger="A"]').click();
 await page.waitForSelector('[data-sky-card-unload]');
 await page.locator('[data-sky-card-unload]').click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('relphiSkyChartA'))?.metadata?.savedSkyId==='family-1',null,{timeout:8000});
 assert.equal(await page.evaluate(()=>localStorage.getItem('relphiSkyChartB')),null,'Unloading A promotes B and removes B');
 console.log('Sky Card library acceptance passed: compact identity overlay, search, folders, swap, unload/promote.');
} finally{await browser.close()}
