import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function placement(name,longitude){
  const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);
  return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0};
}
function sample(name,offset){
  const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,index)=>(asc+index*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:196.5,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,'North Node':40.3,'South Node':220.3,Chiron:74.48,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
  return{name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Malden, Massachusetts, United States',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))};
}

const skyA=sample('Sky A',0),skyB=sample('Sky B',29.27);
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:900,height:900},timezoneId:'America/Denver'});
  const page=await context.newPage();
  page.setDefaultTimeout(15000);
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.route('https://nominatim.openstreetmap.org/**',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
  await page.route('https://api.open-meteo.com/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({timezone:'America/Denver',current:{temperature_2m:20}})}));
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.removeItem('relphiSkyVocabDisplayV1');
    localStorage.removeItem('relphiSkyVocabFilterV1');
    sessionStorage.removeItem('relphiSkyVocabViewV1');
  },{a:skyA,b:skyB});

  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
  await page.locator('#skyFoundationA [data-sky-vocab-view-button="vocab"]').click();
  await page.waitForFunction(()=>{const panel=document.querySelector('#skyFoundationA [data-sky-vocab-panel="A"]');return panel&&!panel.hidden;});

  const cluster=page.locator('#skyFoundationA [data-vocab-structure="cluster"][data-vocab-members*="sun"][data-vocab-members*="mercury"]');
  assert.equal(await cluster.count(),1,'Fixture must expose the Libra Sun-Mercury concentration.');
  await cluster.hover();
  await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-vocab-context'));

  const rendered=await page.evaluate(()=>{
    const sign=document.querySelector('#skyFoundationWheelMount .sky-foundation-sign-sector[data-sign="6"]');
    const house=document.querySelector('#skyFoundationWheelMount .sky-foundation-house-sector[data-sky="A"][data-house="1"]');
    const unrelated=document.querySelector('#skyFoundationWheelMount .sky-foundation-sign-sector[data-sign="0"]');
    const sun=document.querySelector('#skyFoundationWheelMount [data-focus-piece="placement"][data-sky="A"][data-placement="sun"]');
    if(!sign||!house||!unrelated||!sun)return null;
    const s=getComputedStyle(sign),h=getComputedStyle(house),u=getComputedStyle(unrelated),p=getComputedStyle(sun);
    return{
      signClass:sign.classList.contains('is-vocab-context'),
      houseClass:house.classList.contains('is-vocab-context'),
      signFill:Number(s.fillOpacity),
      houseFill:Number(h.fillOpacity),
      signOpacity:Number(s.opacity),
      houseOpacity:Number(h.opacity),
      signStrokeWidth:parseFloat(s.strokeWidth),
      houseStrokeWidth:parseFloat(h.strokeWidth),
      signFilter:s.filter,
      houseFilter:h.filter,
      unrelatedOpacity:Number(u.opacity),
      sunOpacity:Number(p.opacity)
    };
  });

  assert.ok(rendered,'Expected wheel sectors and placement must exist.');
  assert.equal(rendered.signClass,true,'Applicable Libra sector must receive Vocab context.');
  assert.equal(rendered.houseClass,true,'Applicable House 1 sector must receive Vocab context.');
  assert.equal(rendered.signFill,1,'Applicable sign sector must be fully filled.');
  assert.equal(rendered.houseFill,1,'Applicable house sector must be fully filled.');
  assert.equal(rendered.signOpacity,1,'Applicable sign sector must be fully visible.');
  assert.equal(rendered.houseOpacity,1,'Applicable house sector must be fully visible.');
  assert.ok(rendered.signStrokeWidth>=2.5&&rendered.houseStrokeWidth>=2.5,'Applicable sectors must gain a visible edge.');
  assert.notEqual(rendered.signFilter,'none','Applicable sign sector must have visible emphasis.');
  assert.notEqual(rendered.houseFilter,'none','Applicable house sector must have visible emphasis.');
  assert.ok(rendered.unrelatedOpacity<=.1,'Unrelated sign sectors must recede.');
  assert.equal(rendered.sunOpacity,1,'Matching placement must remain strongest.');
  console.log('Vocab sign/house highlight regression passed:',JSON.stringify(rendered));
}finally{
  await browser.close();
}
