import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function placement(name,longitude){
  const n=((longitude%360)+360)%360,within=n%30;
  return{name,longitude:n,sign:SIGNS[Math.floor(n/30)],degree:Math.floor(within),minute:Math.floor((within%1)*60),second:0};
}
function sky(slot,dateTime,location,zone,offset){
  const asc=168.38+offset,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,Chiron:74.48,'North Node':40.3,'South Node':220.3,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
  return {
    name:'Where and When',title:'Where and When',displayName:'Where and When',skyName:'Where and When',
    metadata:{liveNowDisabled:true,liveNowDisabledReason:'custom-where-when'},
    houseSystem:'equal-house',houseCusps:cusps,
    calcProfile:{source:'where-when-v3',dateTime,instant:slot==='A'?'2026-10-19T20:51:00.000Z':'2026-01-05T05:05:00.000Z',location,timeZone:zone,latitude:40.7608,longitude:-111.891,houseSystem:'equal-house',houseCusps:cusps},
    placements:Object.fromEntries(Object.entries(raw).map(([name,value])=>[name,placement(name,value+offset)]))
  };
}
const a=sky('A','2026-10-19T14:51','Salt Lake City, Utah','America/Denver',0);
const b=sky('B','2026-01-05T00:05','Boston, Massachusetts','America/New_York',6);
const wantedA='Oct 19, 2026, 2:51 PM · Salt Lake City, Utah';
const wantedB='Jan 5, 2026, 12:05 AM · Boston, Massachusetts';
await page.addInitScript(({a,b})=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
  localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
  localStorage.setItem('relphiSkyChartLastModeV1','comparison');
},{a,b});
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy')==='false',{timeout:30000});
await page.waitForFunction(()=>!!window.RelphiSkyCardTitle?.nameFor,{timeout:15000});
await page.waitForFunction(
  ([one,two])=>document.querySelector('#skyFoundationA .sky-saved-name-label')?.textContent===one&&document.querySelector('#skyFoundationB .sky-saved-name-label')?.textContent===two,
  [wantedA,wantedB],{timeout:15000});
assert.equal(await page.locator('#skyFoundationA .sky-saved-name-label').textContent(),wantedA);
assert.equal(await page.locator('#skyFoundationB .sky-saved-name-label').textContent(),wantedB);

const result=await page.evaluate(({a,b})=>{
  const unknown=structuredClone(b);
  unknown.calcProfile.dateTime='2026-09-02';
  unknown.calcProfile.timeUnknown=true;
  const named=structuredClone(a);
  named.metadata.savedSkyName='My natal sky';
  const empty={name:'Where and When',placements:{}};
  const unrecognized={name:'Where and When',placements:{},calcProfile:a.calcProfile};
  const legacy=structuredClone(a);
  legacy.name='Unsaved sky';
  legacy.title='Unsaved sky';
  legacy.displayName='Unsaved sky';
  legacy.skyName='Unsaved sky';
  const withNoDate=structuredClone(a);
  delete withNoDate.calcProfile.dateTime;
  return{
    unknown:window.RelphiSkyCardTitle.nameFor('B',unknown),
    named:window.RelphiSkyCardTitle.nameFor('A',named),
    empty:window.RelphiSkyCardTitle.nameFor('A',empty),
    unrecognized:window.RelphiSkyCardTitle.nameFor('A',unrecognized),
    legacy:window.RelphiSkyCardTitle.nameFor('A',legacy),
    fallback:window.RelphiSkyCardTitle.nameFor('A',withNoDate)
  };
},{a,b});
assert.equal(result.unknown,'Sep 2, 2026 (time unknown) · Boston, Massachusetts');
assert.equal(result.named,'My natal sky','an explicitly named saved sky must keep its name');
assert.equal(result.empty,'Where and When','empty editor without settings stays a placeholder');
assert.equal(result.unrecognized,wantedA,'calculated date and location survive unexpected placement encoding');
assert.equal(result.legacy,wantedA,'generic unsaved name must not hide the settings');
assert.equal(result.fallback,'Salt Lake City, Utah','location-only title should still be descriptive');

await page.waitForFunction(()=>document.querySelectorAll('#skyFoundationRelationshipList .sky-foundation-relationship-row').length>0,{timeout:30000});
await page.waitForFunction(()=>document.querySelector('.sky-relationship-copy-button')?.dataset.scopeCopyOverride==='v8',{timeout:15000});
await page.evaluate(()=>{
  window.__copiedRelationships='';
  document.execCommand=function(command){
    if(command==='copy'){
      window.__copiedRelationships=document.activeElement?.value||'';
      return true;
    }
    return false;
  };
});
await page.locator('.sky-relationship-copy-button').click();
await page.waitForFunction(()=>String(window.__copiedRelationships||'').includes('Sky A:'),{timeout:10000});
const copied=await page.evaluate(()=>window.__copiedRelationships);
assert.ok(copied.includes('Sky A: '+wantedA), 'Copy must identify Sky A by selected date/time/place');
assert.ok(copied.includes('Sky B: '+wantedB), 'Copy must identify Sky B by selected date/time/place');
assert.ok(!copied.includes('Sky A: Where and When'), 'Copy must not use the editor label for a calculated sky');

await page.evaluate(()=>{
  window.__renderedRelationships=null;
  window.htmlToImage={
    toBlob:async sheet=>{
      window.__renderedRelationships={
        title:sheet.querySelector('.rex-title h1')?.textContent||'',
        context:sheet.querySelector('.rex-context')?.textContent||''
      };
      return new Blob(['test image'],{type:'image/png'});
    }
  };
});
await page.locator('#skyChartRelationshipsExport').click();
await page.waitForFunction(()=>!!window.__renderedRelationships,{timeout:20000});
const sheet=await page.evaluate(()=>window.__renderedRelationships);
assert.ok(sheet.title.includes(wantedA)&&sheet.title.includes(wantedB),'PNG export title must use settings identities');
assert.ok(sheet.context.includes(wantedA)&&sheet.context.includes(wantedB),'PNG export context must use settings identities');
// Regression: only Sky A loaded. The copy must not invent a Sky B label.
const single=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const singleErrors=[];single.on('pageerror',e=>singleErrors.push(e.message));
await single.addInitScript(a=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
  localStorage.removeItem('relphiSkyChartB');
  localStorage.setItem('relphiSkyChartLastModeV1','single');
},a);
await single.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
await single.waitForFunction(()=>document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy')==='false',{timeout:30000});
await single.waitForFunction(()=>document.querySelector('.sky-relationship-copy-button')?.dataset.scopeCopyOverride==='v8',{timeout:15000});
await single.waitForFunction(()=>document.querySelectorAll('#skyFoundationRelationshipList .sky-foundation-relationship-row').length>0,{timeout:30000});
await single.evaluate(()=>{
  window.__copiedRelationships='';
  document.execCommand=function(command){
    if(command==='copy'){window.__copiedRelationships=document.activeElement?.value||'';return true}
    return false;
  };
});
await single.locator('.sky-relationship-copy-button').click();
await single.waitForFunction(()=>String(window.__copiedRelationships||'').startsWith('Relationships'),{timeout:10000});
const singleCopy=await single.evaluate(()=>window.__copiedRelationships);
assert.ok(singleCopy.includes('Sky A: '+wantedA),'single-sky copy must identify the populated Sky A');
assert.ok(!singleCopy.includes('Sky B:'),'single-sky copy must omit Sky B altogether');
assert.ok(singleCopy.includes('A↔A'),'single-sky copy must retain Intrasky relationships');
await single.evaluate(()=>{
  window.__renderedSingle=null;
  window.htmlToImage={toBlob:async sheet=>{
    window.__renderedSingle={title:sheet.querySelector('.rex-title h1')?.textContent||'',context:sheet.querySelector('.rex-context')?.textContent||''};
    return new Blob(['test image'],{type:'image/png'});
  }};
});
await single.locator('#skyChartRelationshipsExport').click();
await single.waitForFunction(()=>!!window.__renderedSingle,{timeout:20000});
const singleSheet=await single.evaluate(()=>window.__renderedSingle);
assert.ok(singleSheet.title.includes(wantedA)&&!singleSheet.title.includes('Where and When'));
assert.ok(!singleSheet.title.includes('↔'),'single sky must not have a comparison marker in PNG heading');
assert.ok(!singleSheet.context.includes('Where and When'),'single-sky PNG context must omit Sky B');
assert.deepEqual(singleErrors,[],'single-sky browser must have no errors');
await single.close();
assert.deepEqual(errors,[],'no browser errors');
console.log('PASS descriptive Sky labels, unknown-time title, saved names, Relationships copy and PNG header');
await browser.close();
