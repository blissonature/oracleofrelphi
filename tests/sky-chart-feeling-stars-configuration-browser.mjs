import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const point=(name,value)=>{
 const longitude=((value%360)+360)%360,within=longitude%30;
 return {name,longitude,sign:SIGNS[Math.floor(longitude/30)],
   degree:Math.floor(within),minute:Math.floor((within%1)*60)};
};
function sky(name,items,offset,instant){
 const asc=(168.3667+offset)%360,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
 return {name,houseSystem:'equal-house',houseCusps:cusps,
  calcProfile:{dateTime:'2026-11-05T20:35',instant,timeZone:'America/Denver',
   location:'Salt Lake City, Utah, United States',latitude:40.7608,longitude:-111.891,
   houseSystem:'equal-house',houseCusps:cusps},
  placements:Object.fromEntries(Object.entries(items).map(([n,v])=>[n,point(n,v)]))};
}
const a=sky('Marisa',{
 Sun:195,Moon:118.4167,Mercury:206.1667,Venus:169.8833,Mars:167.8667,
 Jupiter:307.15,Saturn:235.5667,Pluto:213.8833,
 Ascendant:168.3667,Descendant:348.3667,Midheaven:76.2667,IC:256.2667
},0,'1985-10-08T08:37:00Z');
const b=sky('Sensed Spiral, Bilateral Neural Activity in Arms and Jaw',{
 Sun:223.8,Moon:188.0833,Venus:204.0833,Mars:141.2,Jupiter:144.9167,Saturn:8.9667,
 Uranus:64.4667,Neptune:1.9667,Pluto:303.1667,
 Ascendant:122.4667,Descendant:302.4667,Midheaven:18.3167,IC:198.3167,
 Vertex:258.45,'Anti-Vertex':78.45,'North Node':325.7833,'South Node':145.7833
},-45.9,'2026-11-06T03:35:00Z');

const browser=await chromium.launch({headless:true});
async function run(mode){
 const mobile=mode==='mobile';
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:960},
    hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1,permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',
  route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
 await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',
  route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
 await page.addInitScript(({a,b})=>{
   localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
   localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
   localStorage.setItem('relphiSkyChartLastModeV1','comparison');
   localStorage.setItem('relphiSkyConfigurationMatrixV1',JSON.stringify({
     'A-A':[],'B-B':['mystic-rectangle'],'A-B':['grand-cross','t-square']
   }));
   localStorage.setItem('relphiSkyConfigurationInevitableV1','false');
 },{a,b});
 try{
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
  await page.waitForSelector('#skyFoundationConfigurations:not([hidden]) .sky-configuration-result-tile',
     {timeout:30000});
  const found=await page.locator('.sky-configuration-result-tile').evaluateAll(rows=>rows.map(r=>r.dataset.configurationType));
  console.log('FOUND '+mode+' '+JSON.stringify(found));
  const copy=page.locator('#skyFoundationConfigurations .sky-configuration-copy-button');
  await copy.scrollIntoViewIfNeeded();
  if(mobile)await copy.tap();else await copy.click();
  await page.waitForFunction(()=>document.querySelector('.sky-configuration-copy-button')?.dataset.relphiCopyFeedback==='done',
     null,{timeout:5000});
  const copied=await page.evaluate(()=>navigator.clipboard.readText());
  assert.match(copied,/Configurations/);
  assert.match(copied,/(Grand Cross|Mystic Rectangle|T-Square)/);
  console.log('COPY LIST '+mode+' '+copied.slice(0,100).replaceAll('\n',' '));

  const tile=page.locator('.sky-configuration-result-tile[data-configuration-type="grand-cross"]').first();
  if(mobile)await tile.locator('.sky-configuration-result-summary').tap();
  else await tile.locator('.sky-configuration-result-summary').click();
  await page.waitForSelector('.sky-configuration-result-tile.is-expanded .sky-configuration-result-detail',{timeout:10000});
  const detailCopy=tile.locator('.sky-configuration-tile-copy');
  if(mobile)await detailCopy.tap();else await detailCopy.click();
  await page.waitForFunction(()=>document.querySelector('.sky-configuration-result-tile.is-expanded .sky-configuration-tile-copy')?.dataset.relphiCopyFeedback==='done',
     null,{timeout:5000});
  const detailText=await page.evaluate(()=>navigator.clipboard.readText());
  assert.match(detailText,/Configurations/);
  assert.match(detailText,/Structure:/);
  assert.match(detailText,/Interpretation:/);

  // Sign/house rails need explicit identity and a semantic explanation in the expanded tile.
  const meaning=await tile.evaluate(node=>{
    const legend=node.querySelector('.sky-configuration-rail-legend');
    const entries=[...node.querySelectorAll('.sky-configuration-participant-meaning')];
    return{legend:legend?.textContent?.trim(),participants:entries.map(e=>e.textContent.trim()),
      rails:[...node.querySelectorAll('.sky-configuration-match-participant')].map(p=>({
       sign:p.dataset.sign,house:p.dataset.house,
       signColor:p.querySelector('.sky-configuration-match-rail-sign')?.style.background,
       houseColor:p.querySelector('.sky-configuration-match-rail-house')?.style.background
      }))};
  });
  console.log('MEANING '+mode+' '+JSON.stringify(meaning).slice(0,1800));
  assert.match(meaning.legend||'',/sign/i);
  assert.match(meaning.legend||'',/house/i);
  assert.ok(meaning.participants.length>=3,'Expanded tile should explain each participant');
  assert.ok(meaning.participants.some(s=>/Virgo|Sagittarius|Gemini|Aries|Libra/.test(s)));
  assert.ok(meaning.participants.some(s=>/House \d|house \d/i.test(s)));

  // When copying is denied, the owner must report a failure instead of a silent no-op.
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Clipboard denied')}}});
    document.execCommand=()=>false;
  });
  const allCopy=page.locator('#skyFoundationConfigurations .sky-configuration-copy-button');
  if(mobile)await allCopy.tap();else await allCopy.click();
  await page.waitForFunction(()=>{
    const button=document.querySelector('#skyFoundationConfigurations .sky-configuration-copy-button');
    return button?.dataset.relphiCopyFeedback==='failed' || /^Copy failed/i.test(button?.getAttribute('aria-label')||'');
  },null,{timeout:3000});
  assert.deepEqual(errors,[],mode+' runtime errors');
  console.log('PASS '+mode+' list and tile clipboard; visible failure status; sign and house interpretation');
 }finally{await context.close()}
}
try{await run('desktop');await run('mobile')}finally{await browser.close()}
