import { webkit } from 'playwright';
import assert from 'node:assert/strict';

const sha=String(process.env.RELPHI_PREVIEW_SHA||'').trim();
if(!/^[0-9a-f]{40}$/i.test(sha))throw new Error('RELPHI_PREVIEW_SHA must be a full commit SHA.');
const url=`https://raw.githack.com/blissonature/oracleofrelphi/${sha}/sky-chart.html`;

const placements={
  Sun:{name:'Sun',longitude:195},
  Moon:{name:'Moon',longitude:118.42},
  Mercury:{name:'Mercury',longitude:206.17},
  Venus:{name:'Venus',longitude:169.88},
  Mars:{name:'Mars',longitude:167.87},
  Jupiter:{name:'Jupiter',longitude:307.15},
  Saturn:{name:'Saturn',longitude:235.57},
  Uranus:{name:'Uranus',longitude:254.85},
  Neptune:{name:'Neptune',longitude:271.02},
  Pluto:{name:'Pluto',longitude:213.88},
  Chiron:{name:'Chiron',longitude:74.48},
  Lilith:{name:'Lilith',longitude:44.23},
  'North Node':{name:'North Node',longitude:40.3},
  'South Node':{name:'South Node',longitude:220.3}
};
const skyA={
  name:'Rawgithack WebKit fixture',
  houseSystem:'none',
  houseCusps:[],
  calcProfile:{
    timeUnknown:true,
    houseSystem:'none',
    houseCusps:[],
    cusps:[],
    dateTime:'1970-05-05',
    location:'Unknown-time fixture',
    timeZone:'America/Denver'
  },
  placements
};

const browser=await webkit.launch({headless:true});
try{
  const page=await browser.newPage({
    viewport:{width:390,height:844},
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  });
  const pageErrors=[],failed=[],badResponses=[];
  page.on('pageerror',error=>pageErrors.push(String(error?.message||error)));
  page.on('requestfailed',request=>failed.push({url:request.url(),error:request.failure()?.errorText||''}));
  page.on('response',response=>{if(response.status()>=400)badResponses.push({status:response.status(),url:response.url()})});
  await page.addInitScript(value=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(value));
    localStorage.removeItem('relphiSkyChartB');
    localStorage.setItem('relphiSkyChartLastModeV1','standalone');
  },skyA);

  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  const interstitial=page.getByText('Open the page',{exact:true});
  if(await interstitial.count()){
    await interstitial.click();
    await page.waitForLoadState('domcontentloaded',{timeout:30000}).catch(()=>{});
  }
  let ready=true;
  try{
    await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
    await page.waitForSelector('.sky-foundation-wheel[data-single-sky="A"]',{timeout:10000});
  }catch(_){ready=false}

  const state=await page.evaluate(()=>({
    ready:document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy'),
    registry:!!window.RelphiGlyphRegistry,
    component:!!window.RelphiGlyphComponent,
    componentDraw:typeof window.RelphiGlyphComponent?.draw,
    componentBubble:typeof window.RelphiGlyphComponent?.createBubble,
    wheelSpec:!!window.RelphiSkyWheelSpec,
    foundation:!!window.__relphiSkyFoundationV2,
    cardShell:!!window.RelphiSkyCardShell,
    wheel:!!document.querySelector('.sky-foundation-wheel[data-single-sky="A"]'),
    skyAName:(document.querySelector('#skyFoundationA .sky-foundation-name')?.textContent||'').trim(),
    bodyText:(document.body.innerText||'').slice(0,1200)
  }));

  if(!ready||!state.wheel){
    console.error('RAWGITHACK_WEBKIT_STATE',JSON.stringify(state,null,2));
    console.error('RAWGITHACK_WEBKIT_PAGE_ERRORS',JSON.stringify(pageErrors,null,2));
    console.error('RAWGITHACK_WEBKIT_REQUEST_FAILED',JSON.stringify(failed.slice(0,40),null,2));
    console.error('RAWGITHACK_WEBKIT_BAD_RESPONSES',JSON.stringify(badResponses.slice(0,40),null,2));
  }

  assert.equal(ready,true,'Rawgithack WebKit preview must finish Sky Chart foundation startup.');
  assert.equal(state.registry,true,'Rawgithack WebKit preview must initialize RelphiGlyphRegistry.');
  assert.equal(state.component,true,'Rawgithack WebKit preview must initialize RelphiGlyphComponent.');
  assert.equal(state.componentDraw,'function');
  assert.equal(state.componentBubble,'function');
  assert.equal(state.wheelSpec,true,'Rawgithack WebKit preview must initialize RelphiSkyWheelSpec.');
  assert.equal(state.foundation,true,'Rawgithack WebKit preview must initialize Sky Chart foundation.');
  assert.equal(state.cardShell,true,'Rawgithack WebKit preview must initialize Sky Card shell.');
  assert.equal(state.wheel,true,'Rawgithack WebKit preview must render a seeded standalone wheel.');
  const relevantErrors=pageErrors.filter(message=>!/Unexpected identifier ['"]astronomy['"]/.test(message));
  assert.deepEqual(relevantErrors,[]);
  assert.deepEqual(failed.filter(item=>/relphi-glyph-registry|relphi-glyph-component|sky-chart-wheel-spec|sky-chart-foundation-v2/.test(item.url)),[]);
  assert.deepEqual(badResponses.filter(item=>/relphi-glyph-registry|relphi-glyph-component|sky-chart-wheel-spec|sky-chart-foundation-v2/.test(item.url)),[]);
  console.log('Rawgithack WebKit Sky Chart startup completed.',JSON.stringify(state));
}finally{
  await browser.close();
}
