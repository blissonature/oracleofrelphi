import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const p=(name,id,date,location)=>({name,id,metadata:{savedSkyId:id},calcProfile:{dateTime:date,location,timeZone:'America/Denver'},placements:{Sun:{longitude:190,sign:'Libra',degree:10,minute:0},Moon:{longitude:125,sign:'Leo',degree:5,minute:0}}});
try{
 const page=await browser.newPage({viewport:{width:660,height:880}});
 await page.addInitScript(records=>{
   localStorage.setItem('relphiSkyLibraryV1',JSON.stringify(records));
   localStorage.setItem('relphiSkyChartA',JSON.stringify(records[0]));
 },[p('Birthday Sky','birth','1985-10-08T04:37','Malden, Massachusetts'),p('Client Review','client','2026-11-14T15:30','Salt Lake City, Utah'),p('Eclipse Event','event','2024-04-08T10:00','Austin, Texas')]);
 await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
 await page.locator('[data-saved-sky-trigger="A"]').click({timeout:20000});
 await page.locator('[data-sky-command="load"]').click({timeout:10000});
 await page.waitForFunction(()=>document.querySelectorAll('#skySavedSkiesPopover .sky-library-visible-name').length===3,null,{timeout:16000});
 const names=await page.locator('#skySavedSkiesPopover .sky-library-visible-name').allTextContents();
 assert.deepEqual(names,['Birthday Sky','Client Review','Eclipse Event'],'All saved sky names visible by default');
 assert.equal(await page.locator('#skySavedSkiesPopover [data-private-sky-fingerprint="true"] .sky-saved-fingerprint-piece').count(),9,'All three visual fingerprints remain');
 const box=page.locator('[data-sky-library-search]');
 for(const [term,expected] of [['Birthday','Birthday Sky'],['Malden','Birthday Sky'],['1985-10-08','Birthday Sky'],['04:37','Birthday Sky'],['11/14/2026','Client Review'],['Salt Lake','Client Review'],['Austin 2024','Eclipse Event']]){
   await box.fill(term);
   await page.waitForFunction(()=>document.querySelectorAll('#skySavedSkiesPopover .sky-saved-list-row:not([hidden])').length===1);
   assert.equal(await page.locator('#skySavedSkiesPopover .sky-saved-list-row:not([hidden]) .sky-library-visible-name').innerText(),expected,'Search '+term);
 }
 await box.fill('not a saved sky');
 await page.waitForFunction(()=>document.querySelectorAll('#skySavedSkiesPopover .sky-saved-list-row:not([hidden])').length===0);
 assert.equal(await page.locator('.sky-library-empty-results').isVisible(),true);
 console.log('Saved Sky visible-name and name/date/time/location search passed.');
}finally{await browser.close()}
