import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const browser=await chromium.launch({headless:true});
try{
  for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
    const context=await browser.newContext({viewport});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',r=>r.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
    await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',r=>r.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
    await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
    await page.waitForSelector('#skyFoundationA [data-sky-drawer-tab="where"]',{timeout:30000});
    await page.locator('#skyFoundationA [data-sky-drawer-tab="where"]').click();
    await page.waitForSelector('#skyFoundationA [data-ww-field="location-query"]');
    const input=page.locator('#skyFoundationA [data-ww-field="location-query"]');
    const button=page.locator('#skyFoundationA [data-ww-action="search-location"]');
    const results=page.locator('#skyFoundationA .sky-location-results .sky-location-result');
    let cityCalls=0,preciseCalls=0;
    await page.route('https://nominatim.openstreetmap.org/search**',r=>{preciseCalls++;return r.abort('failed')});
    await page.route('https://geocoding-api.open-meteo.com/v1/search**',r=>{
      cityCalls++;
      return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({results:[
        {name:'Rochester',admin1:'New York',country:'United States',country_code:'US',latitude:43.1566,longitude:-77.6088,timezone:'America/New_York'},
        {name:'Rochester',admin1:'Minnesota',country:'United States',country_code:'US',latitude:44.0121,longitude:-92.4802,timezone:'America/Chicago'}
      ]})});
    });
    await input.fill('Rochester, Minnesota');
    await button.click();
    await results.first().waitFor({timeout:12000});
    assert.equal(await results.count(),1,'City query must require Minnesota and ignore New York');
    assert.match(await results.first().textContent(),/Rochester, Minnesota/);
    assert.equal(cityCalls,1);
    assert.equal(preciseCalls,0,'An ordinary city lookup must not be intercepted by old Nominatim owner');
    await results.first().click();
    assert.match(await page.locator('#skyFoundationA .sky-location-confirmation').textContent(),/Rochester, Minnesota/);
    console.log('PASS city search independent of failed alternate provider '+viewport.width);

    // If primary fails, the same owner must attempt precise fallback.
    await page.unrouteAll({behavior:'ignoreErrors'});
    await page.route('https://geocoding-api.open-meteo.com/v1/search**',r=>r.abort('failed'));
    await page.route('https://nominatim.openstreetmap.org/search**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{display_name:'42 River Rd, Winona, Minnesota, USA',lat:'44.0500',lon:'-91.6400'}])}));
    await page.route('https://api.open-meteo.com/v1/forecast**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({timezone:'America/Chicago'})}));
    await input.fill('42 River Rd, Winona, Minnesota');
    await button.click();
    await results.first().waitFor({timeout:12000});
    assert.match(await results.first().textContent(),/River Rd/);
    console.log('PASS precise-address lookup with city service unavailable '+viewport.width);

    // Neither provider is reachable: actionable error, not raw Failed to fetch.
    await page.unrouteAll({behavior:'ignoreErrors'});
    await page.route('https://geocoding-api.open-meteo.com/v1/search**',r=>r.abort('failed'));
    await page.route('https://nominatim.openstreetmap.org/search**',r=>r.abort('failed'));
    await input.fill('Unreachable place');
    await button.click();
    await page.waitForFunction(()=>document.querySelector('#skyFoundationA .sky-where-when-status')?.textContent?.includes('Check your connection'),null,{timeout:15000});
    assert.equal(await results.count(),0);
    assert.ok(await input.isEnabled(),'User can retry after service failure');
    console.log('PASS editable recovery after both geocoding services fail '+viewport.width);
    assert.deepEqual(errors.filter(e=>/ReferenceError|TypeError|SyntaxError/.test(e)),[]);
    await context.close();
  }
}finally{await browser.close()}
