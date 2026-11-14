import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const receiver='acdb31d9dfca16a388e196d278c8e0af8cc889b8';
const base='https://oracleofrelphi.com/sky-chart-preview/sky-chart.html?ref='+receiver;
const packet=p=>{const url=new URL(base);url.searchParams.set('relphiSingle',JSON.stringify({version:1,event:p}));return url.toString()};
const browser=await chromium.launch({headless:true});
try {
  // This explicitly tests the remote preview actually opened by the extension,
  // including its document.write loader and pinned relative script assets.
  for(const [width,height,device] of [[1365,920,'desktop'],[390,844,'mobile']]){
    const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});
    const page=await context.newPage(),failures=[],failedRequests=[],badResponses=[];
    page.on('requestfailed',request=>failedRequests.push({url:request.url(),failure:request.failure()}));
    page.on('response',response=>{if(!response.ok())badResponses.push({url:response.url(),status:response.status()})});
    page.on('console',message=>{if(message.type()==='error')failures.push('Console: '+message.text())});
    page.on('pageerror',e=>failures.push(String(e.message)));
    await page.route('https://geocoding-api.open-meteo.com/v1/search**',route=>{
      const name=new URL(route.request().url()).searchParams.get('name');
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({results:name==='Jamaica'?[]:[{
        name:'Salt Lake City',admin1:'Utah',country:'United States',country_code:'US',
        latitude:40.7608,longitude:-111.891,timezone:'America/Denver'
      }]})});
    });
    await page.route('https://nominatim.openstreetmap.org/search**',route=>{
      const isJamaica=new URL(route.request().url()).searchParams.get('q')?.includes('Jamaica');
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(isJamaica?[{
        lat:'40.7000',lon:'-73.8000',name:'Jamaica',display_name:'Jamaica, Queens, New York, United States',
        address:{suburb:'Jamaica',borough:'Queens',county:'Queens County',state:'New York',country:'United States'}
      }]:[{
        lat:'40.7608',lon:'-111.891',display_name:'Salt Lake City, Utah, United States',
        address:{city:'Salt Lake City',state:'Utah',country:'United States'}
      }])});
    });
    await page.route('https://api.open-meteo.com/v1/forecast**',route=>{
      const lat=Number(new URL(route.request().url()).searchParams.get('latitude'));
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({timezone:Math.abs(lat-40.7)<0.0001?'America/New_York':'America/Denver'})});
    });
    await page.goto(packet({date:'2026-11-09',time:'15:15',location:'Salt Lake City, Utah',label:'born'}),{
      waitUntil:'domcontentloaded',timeout:60000
    });
    await page.waitForFunction(()=>{
      const root=document.querySelector('#skyFoundationRoot');
      const raw=localStorage.getItem('relphiSkyChartA');
      if(!root||!raw)return false;
      const sky=JSON.parse(raw);
      return sky?.calcProfile?.dateTime==='2026-11-09T15:15'&&sky?.calcProfile?.timeZone==='America/Denver'&&
        Object.keys(sky.placements||{}).length>=10;
    },null,{timeout:26000}).catch(async error=>{
      const diag=await page.evaluate(()=>({
        href:location.href,readyState:document.readyState,title:document.title,
        previewStatus:document.getElementById('previewStatus')?.textContent||'',
        bodyText:document.body?.innerText?.slice(0,900)||'',
        base:document.querySelector('base')?.href||'',
        scripts:document.scripts.length,root:document.getElementById('skyFoundationRoot')?.outerHTML?.slice(0,250)||'',
        controllers:{where:!!window.RelphiSkyWhereWhen,geocoder:!!window.RelphiSkyLocationSearch},
        editorCount:document.querySelectorAll('.sky-where-when-editor').length,
        dialog:document.querySelector('.sky-ph-handoff-dialog')?.innerText||'',
        status:document.querySelector('#skyFoundationA .sky-where-when-status')?.textContent||'',
        storedA:localStorage.getItem('relphiSkyChartA')?.slice(0,1000)||''
      }));
      console.error('HOSTED_SELECTION_DIAGNOSTIC_'+device,JSON.stringify({diag,failedRequests,badResponses,errors:failures}));
      await page.screenshot({path:'sky-extension-hosted-diagnostic-'+device+'.png',fullPage:false}).catch(()=>{});
      throw error;
    });
    // Placement persistence precedes the final async Chiron/commit cleanup.
    // Wait for the receiving owner to consume the handoff before asserting URL state.
    await page.waitForFunction(()=>!new URLSearchParams(location.search).has('relphiSingle'),null,{timeout:6500}).catch(async error=>{
      const diag=await page.evaluate(()=>({
        href:location.href,readyState:document.readyState,title:document.title,
        rootBusy:document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy'),
        editorPresent:!!document.querySelector('#skyFoundationA .sky-where-when-editor'),
        editorHidden:document.querySelector('#skyFoundationA [data-ww-editor-mount]')?.hidden,
        whereStatus:document.querySelector('#skyFoundationA .sky-where-when-status')?.textContent,
        whereOwner:!!window.RelphiSkyWhereWhen,
        hasA:!!localStorage.getItem('relphiSkyChartA'),
        whereEditing:document.documentElement.dataset.skyWhereWhenEditing,
        locationState:document.querySelector('#skyFoundationA .sky-location-confirmation')?.textContent?.slice(0,400)
      }));
      console.error('HOSTED_POST_COMMIT_DIAG_'+device,JSON.stringify({diag,errors:failures,failedRequests,badResponses}));
      await page.screenshot({path:'sky-extension-hosted-post-commit-'+device+'.png'}).catch(()=>{});
      throw error;
    });
    const done=await page.evaluate(()=>{
      const payload=JSON.parse(localStorage.getItem('relphiSkyChartA'));
      return{url:location.href,skyName:payload.name,dateTime:payload.calcProfile.dateTime,
        location:payload.calcProfile.location,timeZone:payload.calcProfile.timeZone,
        placements:Object.keys(payload.placements||{}).length,
        editorOpen:!!document.querySelector('#skyFoundationA .sky-where-when-editor')};
    });
    assert.equal(done.dateTime,'2026-11-09T15:15');
    assert.ok(done.location.includes('Salt Lake City'));
    assert.equal(done.timeZone,'America/Denver');
    assert.equal(new URL(done.url).searchParams.get('ref'),receiver,'Exactly pinned receiver');
    assert.equal(new URL(done.url).searchParams.has('relphiSingle'),false,'Successful intake is consumed');
    assert.equal(done.editorOpen,false,'Complete selection calculates rather than leaving editor open');
    assert.deepEqual(failures.filter(x=>/TypeError|ReferenceError|SyntaxError/.test(x)),[],
      'No critical remote preview runtime errors');
    await page.screenshot({path:'sky-extension-hosted-'+device+'.png'});
    const draftUrl=new URL(base);
    draftUrl.searchParams.set('relphiDraft',JSON.stringify({
      version:1,kind:'fields',date:'1946-06-14',time:'10:54',location:'',timeUnknown:false
    }));
    await page.goto(draftUrl.toString(),{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>{
      const form=document.querySelector('#skyFoundationA .sky-where-when-editor');
      return form?.querySelector('[data-ww-field="date"]')?.value==='1946-06-14'&&
        form?.querySelector('[data-ww-field="time"]')?.value==='10:54'&&
        form?.querySelector('[data-ww-field="location-query"]')?.value==='';
    },null,{timeout:15000});
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartA')).calcProfile.dateTime),
      '2026-11-09T15:15','Partial selection never alters the saved chart');
    await page.screenshot({path:'sky-extension-hosted-draft-'+device+'.png'});
    console.log('HOSTED_SKY_EXTENSION_DRAFT_'+device,'PASS');
    // The reported 1946 birth-selection flow reaches the same hosted receiver.
    const historical={label:'born',date:'1946-06-14',time:'10:54',
      location:'Jamaica, Queens, New York',timeZoneAbbreviation:'EDT'};
    await page.goto(packet(historical),{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>{
      const sky=JSON.parse(localStorage.getItem('relphiSkyChartA')||'null');
      return sky?.calcProfile?.dateTime==='1946-06-14T10:54'&&
        sky?.calcProfile?.timeZone==='America/New_York'&&
        sky?.metadata?.selectionLocation==='Jamaica, Queens, New York'&&
        !new URLSearchParams(location.search).has('relphiSingle');
    },null,{timeout:30000});
    const historicalResult=await page.evaluate(()=>{
      const sky=JSON.parse(localStorage.getItem('relphiSkyChartA'));
      return{dateTime:sky.calcProfile.dateTime,instant:sky.calcProfile.instant,
        location:sky.calcProfile.location,timezone:sky.calcProfile.timeZone,
        wheel:!!document.querySelector('#skyFoundationWheelMount svg')};
    });
    assert.equal(historicalResult.instant,'1946-06-14T14:54:00.000Z');
    assert.equal(historicalResult.wheel,true,'Hosted preview shows historical sky graphics');
    await page.screenshot({path:'sky-extension-hosted-jamaica-'+device+'.png'});
    console.log('HOSTED_SKY_EXTENSION_JAMAICA_'+device,'PASS',JSON.stringify(historicalResult));
    console.log('HOSTED_SKY_EXTENSION_'+device,JSON.stringify(done));
    await context.close();
  }
}finally{await browser.close()}
console.log('Hosted pinned Sky Chart preview auto-created a complete selected sky on desktop and mobile.');
