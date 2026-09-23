import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function placement(name,longitude){
  const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);
  return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0};
}
function sky(){
  const asc=168.38,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
  const raw={
    Sun:195,Moon:118.42,Mercury:196.5,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,
    Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,
    'North Node':135.4,'South Node':315.4,Chiron:74.48,Lilith:44.23,'Part of Fortune':244.97,Vertex:310.983333
  };
  return{name:'Structural polarity fixture',houseSystem:'equal-house',houseCusps:cusps,calcProfile:{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Malden, Massachusetts, United States',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value)]))};
}

const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:1100,height:900},timezoneId:'America/Denver'});
  const page=await context.newPage();
  page.setDefaultTimeout(15000);
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.route('https://nominatim.openstreetmap.org/**',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
  await page.route('https://api.open-meteo.com/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({timezone:'America/Denver',current:{temperature_2m:20}})}));
  await page.addInitScript(value=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(value));
    localStorage.removeItem('relphiSkyChartB');
    localStorage.removeItem('relphiSkyVocabDisplayV1');
    localStorage.removeItem('relphiSkyVocabScopeFilterV1');
    sessionStorage.removeItem('relphiSkyVocabViewV1');
  },sky());

  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
  await page.locator('#skyFoundationA [data-sky-vocab-view-button="vocab"]').click();
  await page.waitForFunction(()=>!document.querySelector('#skyFoundationA [data-sky-vocab-panel="A"]')?.hidden);

  const vertex=page.locator('#skyFoundationA [data-vocab-structure="axis-polarity"][data-vocab-axis="vertex-anti-vertex"]');
  assert.equal(await vertex.count(),1,'Vertex polarity must render.');
  const members=(await vertex.getAttribute('data-vocab-members')||'').split('|').filter(Boolean);
  assert.ok(members.includes('south-node'),`South Node must attach to Vertex pole: ${JSON.stringify(members)}`);
  assert.ok(members.includes('north-node'),`North Node must attach to Anti-Vertex pole: ${JSON.stringify(members)}`);

  await vertex.hover();
  await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-vocab-axis-context'));
  const states=await page.evaluate(()=>Object.fromEntries(['vertex','anti-vertex','north-node','south-node'].map(id=>{
    const node=document.querySelector(`#skyFoundationWheelMount [data-focus-piece="placement"][data-sky="A"][data-placement="${id}"]`);
    return[id,{exists:!!node,kept:node?.classList.contains('is-vocab-context')||false,opacity:node?Number(getComputedStyle(node).opacity):null}];
  })));
  for(const id of ['vertex','anti-vertex','north-node','south-node']){
    assert.equal(states[id].exists,true,`${id} must exist on the wheel: ${JSON.stringify(states)}`);
    assert.equal(states[id].kept,true,`${id} must remain in active Vertex polarity context: ${JSON.stringify(states)}`);
    assert.equal(states[id].opacity,1,`${id} must remain fully emphasized: ${JSON.stringify(states)}`);
  }
  const sectorStyle=await page.evaluate(()=>{
    const sign=document.querySelector('#skyFoundationWheelMount .sky-foundation-sign-sector.is-vocab-context');
    const house=document.querySelector('#skyFoundationWheelMount .sky-foundation-house-sector.is-vocab-context');
    const s=sign?getComputedStyle(sign):null,h=house?getComputedStyle(house):null;
    return{
      sign:sign?{fillOpacity:Number(s.fillOpacity),filter:s.filter,opacity:Number(s.opacity)}:null,
      house:house?{fillOpacity:Number(h.fillOpacity),filter:h.filter,opacity:Number(h.opacity)}:null
    };
  });
  assert.ok(sectorStyle.sign&&sectorStyle.house,`Active polarity must expose sign and house sectors: ${JSON.stringify(sectorStyle)}`);
  assert.equal(sectorStyle.sign.fillOpacity,.82,`Highlighted sign must retain native zodiac fill opacity: ${JSON.stringify(sectorStyle)}`);
  assert.equal(sectorStyle.house.fillOpacity,.5,`Highlighted house must retain native house fill opacity: ${JSON.stringify(sectorStyle)}`);
  assert.equal(sectorStyle.sign.filter,'none',`Highlighted sign must not be recolored by a filter: ${JSON.stringify(sectorStyle)}`);
  assert.equal(sectorStyle.house.filter,'none',`Highlighted house must not be recolored by a filter: ${JSON.stringify(sectorStyle)}`);
  console.log('Structural polarity member regression passed:',JSON.stringify(states));
}finally{
  await browser.close();
}
