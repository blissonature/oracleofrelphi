import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const seedB={name:'Existing Sky B — preserve',calcProfile:{dateTime:'2020-01-01T12:00',location:'Existing B'},metadata:{marker:'must-survive'}};
const browser=await chromium.launch({headless:true});
try{
  for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
    const context=await browser.newContext({viewport});
    await context.addInitScript(seed=>localStorage.setItem('relphiSkyChartB',JSON.stringify(seed)),seedB);
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',r=>r.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
    await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',r=>r.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
    await page.route('https://geocoding-api.open-meteo.com/v1/search**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({results:[{name:'Rochester',admin1:'New York',country:'United States',country_code:'US',latitude:43.1566,longitude:-77.6088,timezone:'America/New_York'}]})}));
    for(const time of ['11:00',null]){
      const event={date:'1971-10-29',time,location:'Rochester, New York',label:'born'};
      const packet=encodeURIComponent(JSON.stringify({version:1,event}));
      await page.goto('http://127.0.0.1:4173/sky-chart.html?relphiSingle='+packet,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(time=>{
        try{const a=JSON.parse(localStorage.getItem('relphiSkyChartA')||'null');return a?.calcProfile?.dateTime===(time?'1971-10-29T11:00':'1971-10-29')&&a?.calcProfile?.timeUnknown===!time}catch{return false}
      },time,{timeout:45000});
      const state=await page.evaluate(()=>({a:JSON.parse(localStorage.getItem('relphiSkyChartA')),b:JSON.parse(localStorage.getItem('relphiSkyChartB')),mode:localStorage.getItem('relphiSkyChartLastModeV1'),url:location.href}));
      assert.equal(state.a.calcProfile.location.includes('Rochester'),true);
      assert.equal(state.a.calcProfile.timeZone,'America/New_York');
      assert.deepEqual(state.b,seedB,'Single-event import must not change Sky B');
      assert.equal(state.mode,'single');
      assert.ok(!state.url.includes('relphiSingle'),'Consumed import must leave no stale URL payload');
      if(!time){
        assert.equal(state.a.calcProfile.houseSystem,'none');
        assert.ok(!state.a.placements.Ascendant);
        assert.ok(state.a.calcProfile.moonRange?.start);
      }else{
        assert.ok(state.a.placements.Ascendant,'Known-time import must preserve calculated angles');
      }
      console.log('PASS single selected event '+(time?'known':'unknown')+' '+viewport.width);
    }
    const draft=encodeURIComponent(JSON.stringify({version:1,kind:'date',value:'1971-10-29'}));
    await page.goto('http://127.0.0.1:4173/sky-chart.html?relphiDraft='+draft,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#skyFoundationA .sky-where-when-editor [data-ww-field="date"]')?.value==='1971-10-29',null,{timeout:15000}).catch(async error=>{
      const diagnostic=await page.evaluate(()=>({url:location.href,note:document.querySelector('#relphiSelectionComparisonNotice')?.textContent,editor:document.querySelector('#skyFoundationA .sky-where-when-editor')?.outerHTML?.slice(0,1300),aDate:document.querySelector('#skyFoundationA [data-ww-field="date"]')?.value,forms:document.querySelectorAll('.sky-where-when-editor').length}));
      console.error('SINGLE_DRAFT_DIAGNOSTIC',JSON.stringify(diagnostic));
      throw error;
    });
    await page.waitForTimeout(250);
    const draftState=await page.evaluate(()=>({
      unknown:document.querySelector('#skyFoundationA [data-ww-field="time-unknown"]')?.checked,
      disabled:document.querySelector('#skyFoundationA .sky-time-entry')?.disabled,
      date:document.querySelector('#skyFoundationA [data-ww-field="date"]')?.value,
      notice:document.querySelector('#relphiSelectionComparisonNotice')?.textContent
    }));
    console.log('DRAFT_STATE',JSON.stringify(draftState));
    assert.equal(draftState.unknown,true);
    assert.equal(draftState.disabled,true);
    const preserved=await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartB')));
    assert.deepEqual(preserved,seedB);
    console.log('PASS date-only draft '+viewport.width);
    assert.deepEqual(errors.filter(e=>/SyntaxError|TypeError|ReferenceError/.test(e)),[]);
    await context.close();
  }
}finally{await browser.close()}
