import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const events=[
  {label:'born',date:'1948-01-04',time:null,location:'Moscow, Russia'},
  {label:'died',date:'2018-07-07',time:null,location:'New Brunswick, NJ'}
];
const packet=encodeURIComponent(JSON.stringify({version:1,events}));
const browser=await chromium.launch({headless:true});
try{
  for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
    const context=await browser.newContext({viewport});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
    await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
    await page.route('https://geocoding-api.open-meteo.com/v1/search**',route=>{
      const name=new URL(route.request().url()).searchParams.get('name');
      const result=name==='Moscow'
        ?{name:'Moscow',admin1:'Moscow',country:'Russia',country_code:'RU',latitude:55.7558,longitude:37.6173,timezone:'Europe/Moscow'}
        :{name:'New Brunswick',admin1:'New Jersey',country:'United States',country_code:'US',latitude:40.4862,longitude:-74.4518,timezone:'America/New_York'};
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({results:[result]})});
    });
    await page.goto('http://127.0.0.1:4173/sky-chart.html?relphiCompare='+packet,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>{
      try {
        const a=JSON.parse(localStorage.getItem('relphiSkyChartA')||'null');
        const b=JSON.parse(localStorage.getItem('relphiSkyChartB')||'null');
        return a?.calcProfile?.timeUnknown===true&&b?.calcProfile?.timeUnknown===true&&a?.calcProfile?.location?.includes('Moscow')&&b?.calcProfile?.location?.includes('New Brunswick');
      }catch{return false}
    },null,{timeout:45000});
    const actual=await page.evaluate(()=>{
      const a=JSON.parse(localStorage.getItem('relphiSkyChartA'));
      const b=JSON.parse(localStorage.getItem('relphiSkyChartB'));
      return {a,b,mode:localStorage.getItem('relphiSkyChartLastModeV1'),url:location.href};
    });
    assert.equal(actual.a.calcProfile.dateTime,'1948-01-04');
    assert.equal(actual.b.calcProfile.dateTime,'2018-07-07');
    assert.equal(actual.a.calcProfile.timeZone,'Europe/Moscow');
    assert.equal(actual.b.calcProfile.timeZone,'America/New_York');
    assert.equal(actual.a.calcProfile.timeUnknown,true);
    assert.equal(actual.b.calcProfile.timeUnknown,true);
    assert.ok(actual.a.calcProfile.moonRange?.start);
    assert.ok(actual.b.calcProfile.moonRange?.end);
    for(const sky of [actual.a,actual.b]){
      assert.ok(!sky.placements.Ascendant&&!sky.placements.Midheaven,'unknown-time sky must not fabricate angles');
      assert.equal(sky.calcProfile.houseSystem,'none');
      assert.deepEqual(sky.houseCusps,[]);
    }
    assert.equal(actual.mode,'comparison');
    assert.ok(!actual.url.includes('relphiCompare'),'import URL must be cleared after successful commit');
    await context.close();
    console.log('PASS paired selection comparison',viewport.width);
  }
}finally{await browser.close()}
