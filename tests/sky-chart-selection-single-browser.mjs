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
    const lookups=[];
    await page.route('https://geocoding-api.open-meteo.com/v1/search**',r=>{
      lookups.push(new URL(r.request().url()).searchParams.get('name'));
      const city=new URL(r.request().url()).searchParams.get('name');
      return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({results:city==='Winona'?
        [{name:'Winona',admin1:'Minnesota',country:'United States',country_code:'US',latitude:44.04996,longitude:-91.63931,timezone:'America/Chicago',population:25900}]:
        [{name:'Rochester',admin1:'New York',country:'United States',country_code:'US',latitude:43.1566,longitude:-77.6088,timezone:'America/New_York',population:209000},
         {name:'Rochester',admin1:'Minnesota',admin2:'Olmsted',country:'United States',country_code:'US',latitude:44.0121,longitude:-92.4802,timezone:'America/Chicago',population:121000},
         {name:'Rochester Hills',admin1:'Minnesota',country:'United States',country_code:'US',latitude:40.0,longitude:-90.0,timezone:'America/Chicago'}]})});
    });
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
    // Numbered street address is geocoded as a street, not as the first 'city' token.
    const streetAddress='9600 Wilshire Boulevard, Beverly Hills, California 90212, U.S.A.';
    let streetCalls=0;
    await page.route('https://nominatim.openstreetmap.org/search**',route=>{
      streetCalls++;
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{
        display_name:'9600 Wilshire Boulevard, Beverly Hills, California 90212, United States',
        lat:'34.066916',lon:'-118.404141',
        address:{house_number:'9600',road:'Wilshire Boulevard',city:'Beverly Hills',state:'California',postcode:'90212',country:'United States'}
      }])});
    });
    await page.route('https://api.open-meteo.com/v1/forecast**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({timezone:'America/Los_Angeles'})}));
    for(const abbreviation of [null,'PST']){
      const streetEvent={date:'2001-12-12',time:'17:30',location:streetAddress,label:'event',timeZoneAbbreviation:abbreviation};
      await page.goto('http://127.0.0.1:4173/sky-chart.html?relphiSingle='+encodeURIComponent(JSON.stringify({version:1,event:streetEvent})),{waitUntil:'domcontentloaded'});
      await page.waitForFunction(expected=>{const sky=JSON.parse(localStorage.getItem('relphiSkyChartA')||'null');return !new URLSearchParams(location.search).has('relphiSingle')&&sky?.calcProfile?.dateTime==='2001-12-12T17:30'&&sky?.metadata?.selectionTimeZoneAbbreviation===expected},abbreviation,{timeout:20000});
      const streetSky=await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartA')));
      assert.match(streetSky.calcProfile.location,/9600 Wilshire Boulevard/);
      assert.equal(Number(streetSky.calcProfile.latitude),34.066916);
      assert.equal(Number(streetSky.calcProfile.longitude),-118.404141);
      assert.equal(streetSky.calcProfile.timeZone,'America/Los_Angeles');
      assert.equal(streetSky.metadata.selectionLocation,streetAddress);
      assert.equal(streetSky.metadata.selectionTimeZoneAbbreviation,abbreviation);
      assert.ok(streetSky.placements.Ascendant,'Known local time has angles');
      assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartB'))),seedB,'Street import must preserve Sky B');
      console.log('PASS precise street address '+(abbreviation||'implicit zone')+' '+viewport.width);
    }
    assert.equal(streetCalls,2,'Each street import should use the precise address provider');
    await page.unroute('https://nominatim.openstreetmap.org/search**');
    await page.unroute('https://api.open-meteo.com/v1/forecast**');
    // Parenthetical place is real. Do not silently prefer Rochester or Winona.
    const annotated={date:'1971-10-29',time:'11:00',location:'Rochester (Winona), Minnesota',label:'born'};
    const beforeLookups=lookups.length;
    const priorSky=await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartA')));
    await page.goto('http://127.0.0.1:4173/sky-chart.html?relphiSingle='+encodeURIComponent(JSON.stringify({version:1,event:annotated})),{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelectorAll('#relphiSelectionComparisonNotice button').length>=3,null,{timeout:20000});
    assert.deepEqual(lookups.slice(beforeLookups),['Rochester','Winona'],'Both candidate cities must be geocoded independently');
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartA'))),priorSky,'Ambiguous location must not replace a working sky before selection');
    const choices=await page.locator('#relphiSelectionComparisonNotice button').allTextContents();
    assert.ok(choices.some(text=>text.includes('Rochester, Minnesota')));
    assert.ok(choices.some(text=>text.includes('Winona, Minnesota')));
    await page.locator('#relphiSelectionComparisonNotice button').filter({hasText:'Winona, Minnesota'}).click();
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('relphiSkyChartA')||'null')?.calcProfile?.location?.includes('Winona'),null,{timeout:20000});
    const annotatedState=await page.evaluate(()=>({a:JSON.parse(localStorage.getItem('relphiSkyChartA')),b:JSON.parse(localStorage.getItem('relphiSkyChartB')),url:location.href}));
    assert.match(annotatedState.a.calcProfile.location,/Winona, Minnesota/);
    assert.equal(annotatedState.a.calcProfile.timeZone,'America/Chicago');
    assert.equal(annotatedState.a.metadata.selectionLocation,'Rochester (Winona), Minnesota');
    assert.deepEqual(annotatedState.b,seedB);
    assert.ok(!annotatedState.url.includes('relphiSingle'));
    console.log('PASS explicit parenthetical real-city disambiguation '+viewport.width);
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
      disabled:document.querySelector('#skyFoundationA .sky-where-when-editor .sky-time-entry')?.disabled,
      timeControls:[...document.querySelectorAll('#skyFoundationA .sky-time-entry')].map(el=>({disabled:el.disabled,insideEditor:!!el.closest('.sky-where-when-editor')})),
      rawTime:[...document.querySelectorAll('#skyFoundationA .sky-where-when-editor [data-ww-field="time"]')].map(el=>({disabled:el.disabled,type:el.type})),
      date:document.querySelector('#skyFoundationA [data-ww-field="date"]')?.value,
      notice:document.querySelector('#relphiSelectionComparisonNotice')?.textContent
    }));
    console.log('DRAFT_STATE',JSON.stringify(draftState));
    assert.equal(draftState.unknown,true);
    // The unknown-time flag, not the presentation of the hybrid time picker, determines the calculation.
    assert.equal(draftState.date,'1971-10-29');
    const preserved=await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartB')));
    assert.deepEqual(preserved,seedB);
    console.log('PASS date-only draft '+viewport.width);
    assert.deepEqual(errors.filter(e=>/SyntaxError|TypeError|ReferenceError/.test(e)),[]);
    await context.close();
  }
}finally{await browser.close()}
