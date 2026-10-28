import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';

const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,value)=>({name,longitude:value,sign:signs[Math.floor(value/30)%12],degree:Math.floor(value%30),minute:Math.floor((value%1)*60)});
function makeSky(kind){
 const p={dateTime:kind==='unknown'?'2026-10-27':'2026-10-27T04:05',instant:kind==='unknown'?'':'2026-10-27T10:05:00.000Z',
  timeZone:'America/Denver',location:'South Jordan, Utah, United States',latitude:40.56,longitude:-111.93,
  timeUnknown:kind==='unknown',houseSystem:'equal-house'};
 const name=kind==='custom'?'Meditation with Mars':kind==='timestamp'?'4:05 AM 10/27/2026':'Sky A';
 return{name,calcProfile:p,placements:{
  Sun:placement('Sun',215),Moon:placement('Moon',43),Venus:placement('Venus',195),
  Mars:placement('Mars',133),Mercury:placement('Mercury',220),Jupiter:placement('Jupiter',145),
  Saturn:placement('Saturn',8),Uranus:placement('Uranus',77),Neptune:placement('Neptune',3)
 }};
}
const browser=await chromium.launch({headless:true});
async function pageFor(width,kind){
 const page=await browser.newPage({viewport:{width,height:940},hasTouch:width===390,isMobile:width===390});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',r=>r.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
 await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',r=>r.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
 await page.route('https://nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
 await page.addInitScript(sky=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(sky));
  localStorage.removeItem('relphiSkyChartB');
  localStorage.setItem('relphiSkyLibraryV1','[]');
  localStorage.setItem('relphiSkyChartLastModeV1','single');
 },makeSky(kind));
 await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
 await page.waitForFunction(()=>!!window.RelphiSkySavedSkyIdentityFlow?.resolveCommitted&&!!window.RelphiSkySuggestedName?.preferred,{timeout:20000});
 return{page,errors};
}
async function readStorage(page){
 return page.evaluate(()=>({
  lib:JSON.parse(localStorage.getItem('relphiSkyLibraryV1')||'[]'),
  sky:JSON.parse(localStorage.getItem('relphiSkyChartA')||'null')
 }));
}
async function picker(page){
 const trigger=page.locator('#skyFoundationA [data-saved-sky-trigger]').first();
 await trigger.click();
 await page.locator('#skySavedSkiesPopover .sky-saved-list').waitFor({state:'visible'});
 await page.locator('#skySavedSkiesPopover [data-sky-picker-save]').waitFor({state:'visible'});
 return page.locator('#skySavedSkiesPopover');
}
try{
 for(const width of [390,1280]){
  const{page,errors}=await pageFor(width,'standard');
  try{
   await page.evaluate(()=>window.RelphiSkySavedSkyIdentityFlow.resolveCommitted('A'));
   const prompt=page.locator('#skyWhereWhenNamePrompt');
   await prompt.waitFor({state:'visible'});
   const auto=await prompt.locator('[data-sky-name-input]').inputValue();
   assert.equal(auto,'4:05 AM 10/27/2026 · South Jordan, Utah');
   await prompt.locator('[data-sky-name-cancel]').click();
   assert.equal((await readStorage(page)).lib.length,0,'Cancel cannot save');
   const menu=await picker(page);
   assert.equal(await menu.locator('.sky-saved-subview-head strong').innerText(),'Load Sky');
   assert.equal(await menu.locator('[data-sky-picker-save]').innerText(),'Save Sky');
   await menu.locator('[data-sky-picker-save]').click();
   const dialog=page.locator('.sky-save-name-overlay');
   await dialog.waitFor({state:'visible'});
   const name=await dialog.locator('[data-save-sky-name-input]').inputValue();
   assert.equal(name,auto,'Explicit Save Sky must offer same suggested name after Cancel');
   await dialog.locator('[data-save-sky-name-input]').fill('A Sky I Chose to Keep');
   await dialog.locator('button[type="submit"]').click();
   await dialog.waitFor({state:'hidden'});
   const saved=await readStorage(page);
   assert.equal(saved.lib.length,1);
   assert.equal(saved.lib[0].name,'A Sky I Chose to Keep');
   assert.equal(saved.sky.name,'A Sky I Chose to Keep');
   assert.equal(saved.sky.calcProfile.location,'South Jordan, Utah, United States');
   const after=await picker(page);
   assert.equal(await after.locator('[data-sky-picker-save]').innerText(),'Save Changes');
   assert.deepEqual(errors,[],'No browser errors');
   console.log('PASS_SKY_SAVE_DEFERRED',width,JSON.stringify({suggestion:auto,saved:saved.sky.name,actions:['Cancel','Load Sky','Save Sky','Save Changes']}));
  }finally{await page.close()}
  for(const [kind,expected]of [['unknown','Time unknown 10/27/2026 · South Jordan, Utah'],
                                ['custom','Meditation with Mars'],
                                ['timestamp','4:05 AM 10/27/2026 · South Jordan, Utah']]){
   const{page,errors}=await pageFor(width,kind);
   try{
    await page.evaluate(()=>window.RelphiSkySavedSkyIdentityFlow.resolveCommitted('A'));
    await page.locator('#skyWhereWhenNamePrompt').waitFor({state:'visible'});
    const result=await page.locator('[data-sky-name-input]').inputValue();
    assert.equal(result,expected);
    await page.locator('[data-sky-name-cancel]').click();
    assert.equal((await readStorage(page)).lib.length,0);
    assert.deepEqual(errors,[]);
    console.log('PASS_SKY_NAME_SUGGESTION',width,kind,JSON.stringify(result));
   }finally{await page.close()}
  }
 }
}finally{await browser.close()}
