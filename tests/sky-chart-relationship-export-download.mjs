import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0}};
function sample(name,offset,profile){
  const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,index)=>(asc+index*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Midheaven:76.28};
  return{name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{...profile,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))};
}
const skyA=sample('Alpha sky',0,{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Malden, Massachusetts, United States',locationQuery:'Malden, MA',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662});
const skyB=sample('Beta sky',29.27,{dateTime:'2026-09-09T21:00',instant:'2026-09-10T03:00:00.000Z',location:'Salt Lake City, Utah, United States',locationQuery:'Salt Lake City, UT',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891});

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
const errors=[],consoleErrors=[],downloads=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text())});
page.on('download',download=>downloads.push(download));
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(({a,b})=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
  localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
  localStorage.setItem('relphiSkyChartLastModeV1','comparison');
  window.htmlToImage={toBlob:async()=>new Blob(['png'],{type:'image/png'}),toPng:async()=> 'data:image/png;base64,cG5n'};
},{a:skyA,b:skyB});
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
await page.waitForSelector('#skyFoundationRelationshipList .sky-foundation-relationship-row',{timeout:20000});
const button=page.locator('#skyChartRelationshipsExport');
await button.waitFor({state:'visible',timeout:10000});
assert.equal(await button.getAttribute('data-relationship-export-owner'),'columns-v2');
await button.click();
await page.waitForTimeout(3000);
const diagnostics=await page.evaluate(()=>({
  status:document.getElementById('skyChartExportStatus')?.textContent||'',
  disabled:document.getElementById('skyChartRelationshipsExport')?.disabled||false,
  relationshipExportV3:!!window.__relphiRelationshipExportColumnsV3,
  relationshipExportV2:!!window.__relphiRelationshipExportColumnsV2,
  genericExportV5:!!window.__relphiSkyExportV5,
  visibleRows:[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row')].filter(r=>{const s=getComputedStyle(r);return !r.hidden&&s.display!=='none'&&s.visibility!=='hidden'}).length,
  pendingImages:[...document.querySelectorAll('.rex-sheet img')].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.getAttribute('src')).slice(0,12),
  rexSheet:!!document.querySelector('.rex-sheet')
}));
console.log('RELATIONSHIP_EXPORT_DIAGNOSTICS',JSON.stringify({diagnostics,downloads:downloads.length,errors,consoleErrors}));
assert.ok(downloads.length>0,`Relationships export did not start a download: ${JSON.stringify(diagnostics)}`);
assert.match(downloads[0].suggestedFilename(),/relationships-.*\.png$/i);
assert.match(diagnostics.status,/download started/i);
assert.deepEqual(errors,[]);
await browser.close();
console.log('Relationships download button produces a PNG download.');
