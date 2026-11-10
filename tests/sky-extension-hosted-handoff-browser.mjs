import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const receiver='9922d7198e4f1886500d0acda828db2fd045f797';
const base='https://oracleofrelphi.com/sky-chart-preview/sky-chart.html?ref='+receiver;
const packet=p=>'#relphiSkyIntake='+encodeURIComponent(JSON.stringify({v:1,...p}));
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
    await page.route('https://nominatim.openstreetmap.org/search**',route=>
      route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{
        lat:'40.7608',lon:'-111.891',display_name:'Salt Lake City, Utah, United States',
        address:{city:'Salt Lake City',state:'Utah',country:'United States'}
      }])}));
    await page.route('https://api.open-meteo.com/v1/forecast**',route=>
      route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({timezone:'America/Denver'})}));
    await page.goto(base+packet({date:'2026-11-09',time:'15:15',timeUnknown:false,location:'Salt Lake City, Utah'}),{
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
    await page.waitForFunction(()=>location.hash==='',null,{timeout:15000});
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
    assert.equal(new URL(done.url).hash,'','Successful intake is consumed');
    assert.equal(done.editorOpen,false,'Complete selection calculates rather than leaving editor open');
    assert.deepEqual(failures.filter(x=>/TypeError|ReferenceError|SyntaxError/.test(x)),[],
      'No critical remote preview runtime errors');
    await page.screenshot({path:'sky-extension-hosted-'+device+'.png'});
    console.log('HOSTED_SKY_EXTENSION_'+device,JSON.stringify(done));
    await context.close();
  }
}finally{await browser.close()}
console.log('Hosted pinned Sky Chart preview auto-created a complete selected sky on desktop and mobile.');
