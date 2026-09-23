import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function placement(name,longitude){
  const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);
  return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0};
}
function sample(){
  const asc=168.38,cusps=Array.from({length:12},(_,index)=>(asc+index*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:196.5,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,'North Node':40.3,'South Node':220.3,Chiron:74.48,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
  return{name:'Copy Fixture',houseSystem:'equal-house',houseCusps:cusps,calcProfile:{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Malden, Massachusetts, United States',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value)]))};
}

const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:1000,height:900},timezoneId:'America/Denver'});
  const page=await context.newPage();
  page.setDefaultTimeout(15000);
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.route('https://nominatim.openstreetmap.org/**',route=>route.fulfill({status:200,contentType:'application/json',body:'{}'}));
  await page.route('https://api.open-meteo.com/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({timezone:'America/Denver',current:{temperature_2m:20}})}));
  await page.addInitScript(value=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(value));
    localStorage.removeItem('relphiSkyChartB');
    localStorage.setItem('relphiSkyVocabDisplayV1',JSON.stringify({glyphs:true,names:false,referents:false}));
    sessionStorage.setItem('relphiSkyVocabViewV1',JSON.stringify({A:'vocab',B:'placements'}));
    window.__relphiCopiedText='';
    document.execCommand=()=>false;
    const clipboard={writeText:async text=>{window.__relphiCopiedText=String(text)}};
    try{Object.defineProperty(navigator,'clipboard',{configurable:true,value:clipboard})}catch(_){try{navigator.clipboard.writeText=clipboard.writeText}catch(__){}}
  },sample());

  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
  await page.waitForFunction(()=>!document.querySelector('#skyFoundationA [data-sky-vocab-panel="A"]')?.hidden);

  const copy=page.locator('#skyFoundationA [data-copy-vocab="A"]');
  assert.equal(await copy.count(),1,'Vocab must expose exactly one Copy button.');
  assert.equal(await copy.isVisible(),true,'Vocab Copy button must be visible in Vocab mode.');
  assert.equal(await page.locator('#skyFoundationA [data-copy-placements]').isVisible(),false,'Placements Copy must be hidden while Vocab is active.');

  const direct=await page.evaluate(()=>window.RelphiVocabCopySerializer?.serializePanel?.(document.querySelector('#skyFoundationA [data-sky-vocab-panel="A"]'))||'');
  assert.ok(direct.startsWith('Copy Fixture — Vocab'),'Serializer must identify the copied Sky.');
  assert.ok(direct.includes('☉ Sun is in ♎ Libra in First House.'),`Canonical glyph serializer must convert the glyph-only Sun line: ${direct}`);
  assert.ok(direct.includes('Vertex'),'Custom Relphi letter glyphs must serialize to their semantic names.');
  assert.ok(!direct.includes('[object SVG'),`Copy must never expose raw SVG objects: ${direct}`);

  const liveTitle=await page.evaluate(()=>{
    const key='relphiSkyChartA',value=JSON.parse(localStorage.getItem(key)||'null'),at=new Date(Date.now()-11*60*1000).toISOString();
    value.name='Now';value.title='Now';value.displayName='Now';value.skyName='Now';
    value.metadata={...(value.metadata||{}),liveNowOrigin:'use-now',liveNowAt:at,liveAgeAnchorAt:at};
    value.calcProfile={...(value.calcProfile||{}),name:'Now',title:'Now',liveNowOrigin:'use-now',liveNowAt:at,instant:at};
    localStorage.setItem(key,JSON.stringify(value));
    return window.RelphiVocabCopySerializer?.serializePanel?.(document.querySelector('#skyFoundationA [data-sky-vocab-panel="A"]'))||'';
  });
  assert.ok(liveTitle.startsWith('10 mins. ago — Vocab'),`Live Vocab copy must use the canonical age title instead of the payload name Now: ${liveTitle.split('\\n')[0]}`);

  await copy.click();
  await page.waitForFunction(()=>Boolean(window.__relphiCopiedText));
  const copied=await page.evaluate(()=>window.__relphiCopiedText);
  assert.equal(copied,direct,'One-click Copy must write exactly the semantic Vocab serialization.');
  assert.equal((await copy.textContent()).trim(),'Copied','Copy button must confirm completion.');
  console.log('Vocab semantic glyph copy regression passed.');
}finally{
  await browser.close();
}
