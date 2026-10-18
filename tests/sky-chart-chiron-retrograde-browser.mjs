import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {chromium} from 'playwright';

const sandbox={window:null,Date,Math,Number,String,Array,Object,JSON,Float64Array};
sandbox.window=sandbox;
const c=vm.createContext(sandbox);
for(const file of ['relphi-chiron-ephemeris-data-v1.js','relphi-chiron-ephemeris-v1.js'])
  vm.runInContext(fs.readFileSync(file,'utf8'),c,{filename:file});
const ephem=c.RelphiChironEphemeris;
const dates=Array.from({length:12},(_,i)=>'2026-'+String(i+1).padStart(2,'0')+'-15');
const at=day=>new Date(day+'T12:00:00.000Z');
const retro=dates.find(d=>ephem.motionAt(at(d)).retrograde);
const direct=dates.find(d=>!ephem.motionAt(at(d)).retrograde);
assert.ok(retro&&direct);
const placement=(name,long)=>({name,glyphId:name.toLowerCase().replaceAll(' ','-'),longitude:(long%360+360)%360});
function sky(day,name,untimed){
  const lon=ephem.longitudeAt(at(day));
  const placements={
    Chiron:placement('Chiron',lon),
    Sun:placement('Sun',lon+1),
    Moon:placement('Moon',lon+3),
    Venus:placement('Venus',lon+5),
    Mars:placement('Mars',lon+30),
    Jupiter:placement('Jupiter',lon+180),
    Saturn:placement('Saturn',lon+120)
  };
  const calcProfile={dateTime:untimed?day:day+'T12:00:00',instant:untimed?'':at(day).toISOString(),timeUnknown:untimed,houseSystem:untimed?'none':'whole-sign',latitude:40.7608,longitude:-111.891,timeZone:'UTC'};
  const houseCusps=untimed?[]:Array.from({length:12},(_,i)=>i*30);
  return{name,calcProfile,houseSystem:calcProfile.houseSystem,houseCusps,placements};
}
const skyA=sky(retro,'Retrograde Chiron without birth time',true);
const skyB=sky(direct,'Direct Chiron',false);
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1024},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    localStorage.setItem('relphiSkyRelationshipDisplayV1','glyphs');
    window.htmlToImage={
      toBlob:async node=>{
        window.__chironRxPngLabels=[...node.querySelectorAll('.rex-concepts .rex-chip strong')].map(el=>(el.textContent||'').trim());
        return new Blob(['png'],{type:'image/png'});
      },
      toPng:async()=> 'data:image/png;base64,cG5n'
    };
  },{a:skyA,b:skyB});
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
  await page.waitForFunction(()=>document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row').length>=3,null,{timeout:30000});
  const state=await page.evaluate(()=>{
    const get=slot=>[...document.querySelectorAll('#skyFoundation'+slot+' .sky-foundation-row')].find(row=>row.querySelector('.sky-foundation-row-name')?.textContent?.startsWith('Chiron'));
    const a=get('A'),b=get('B');
    return{A:window.RelphiSkyRetrograde.forPlacement('A','chiron'),B:window.RelphiSkyRetrograde.forPlacement('B','chiron'),aLabel:a?.querySelector('.sky-foundation-row-name')?.textContent||'',aRx:!!a?.querySelector('.sky-placement-rx'),bRx:!!b?.querySelector('.sky-placement-rx')};
  });
  assert.equal(state.A,true);
  assert.equal(state.B,false);
  assert.equal(state.aRx,true,'Untimed retrograde Chiron should display the canonical Rx master');
  assert.equal(state.bRx,false,'Direct Chiron must not display Rx');
  await page.evaluate(()=>{
    window.__relphiCopiedText='';
    document.execCommand=()=>false;
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async x=>{window.__relphiCopiedText=String(x)}}});
  });
  await page.locator('.sky-relationship-copy-button').click();
  await page.waitForFunction(()=>Boolean(window.__relphiCopiedText),null,{timeout:5000});
  const clipboard=await page.evaluate(()=>window.__relphiCopiedText);
  assert.match(clipboard,/⚷ Rx/,'Relationships Copy must include retrograde Chiron');
  assert.match(clipboard,/⚷ in/,'Relationships Copy must also include direct Chiron');
  await page.locator('#skyChartRelationshipsExport').click();
  await page.waitForFunction(()=>Array.isArray(window.__chironRxPngLabels),null,{timeout:12000});
  const labels=await page.evaluate(()=>window.__chironRxPngLabels);
  assert.ok(labels.includes('Chiron Rx'),'PNG concept chips must include retrograde Chiron');
  assert.ok(labels.includes('Chiron'),'PNG concept chips must preserve direct Chiron');
  assert.deepEqual(errors.filter(x=>!/Unexpected identifier ['"]astronomy['"]/.test(x)),[]);
  console.log('Chiron retrograde visible and exported in both Sky Card, text, and PNG. '+retro+' / '+direct);
}finally{await browser.close()}
