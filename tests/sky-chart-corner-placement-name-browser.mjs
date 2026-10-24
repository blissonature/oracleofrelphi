import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import path from 'node:path';

const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function makeSky(label,shift){
  const asc=(168.38+shift)%360;
  const cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
  const bodies={Sun:195,Moon:118.42,Saturn:235.57,Mercury:196.5,Venus:169.88,Mars:167.87,
    Jupiter:307.15,Uranus:254.85,Neptune:271.02,Pluto:213.88,Chiron:74.48,
    'North Node':40.3,'South Node':220.3,'Part of Fortune':244.97,
    Vertex:330.33,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28};
  const placements=Object.fromEntries(Object.entries(bodies).map(([name,longitude])=>{
    const value=(longitude+shift)%360,sign=Math.floor(value/30),within=value-sign*30;
    return[name,{name,longitude:value,sign:signs[sign],degree:Math.floor(within),
      minute:Math.floor((within%1)*60),second:0}];
  }));
  return{name:label,houseSystem:'equal-house',houseCusps:cusps,
    calcProfile:{houseCusps:cusps,houseSystem:'equal-house',dateTime:'2026-10-24T17:00',
      instant:'2026-10-24T23:00:00.000Z',timeZone:'America/Denver',latitude:40.76,longitude:-111.89},
    placements};
}

const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:1280,height:980},timezoneId:'America/Denver'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>
    route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>
    route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.route('https://nominatim.openstreetmap.org/**',route=>
    route.fulfill({status:200,contentType:'application/json',body:'[]'}));
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
  },{a:makeSky('A',0),b:makeSky('B',29.27)});
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
  await page.waitForFunction(()=>window.RelphiSkyVocab?.describeFocus&&
    document.querySelector('#skyFoundationWheelMount [data-interactive="placement"][data-sky="A"][data-placement="moon"]'));

  const expected={
    moon:'Moon',saturn:'Saturn',sun:'Sun','north-node':'North Node',
    'south-node':'South Node','part-of-fortune':'Part of Fortune','anti-vertex':'Anti-Vertex'
  };
  const actual=await page.evaluate(ids=>Object.fromEntries(ids.map(id=>
    [id,window.RelphiSkyVocab.describeFocus('placement',id)?.name])),Object.keys(expected));
  assert.deepEqual(actual,expected,'Corner description names must be canonical and capitalized.');

  for(const [id,name] of [['moon','Moon'],['saturn','Saturn']]){
    await page.evaluate(id=>{
      const node=document.querySelector('#skyFoundationWheelMount [data-interactive="placement"][data-sky="A"][data-placement="'+id+'"]');
      if(!node)throw new Error('Missing placement glyph: '+id);
      const pointer={bubbles:true,cancelable:true,composed:true,pointerId:88,pointerType:'mouse',isPrimary:true,buttons:1};
      node.dispatchEvent(new PointerEvent('pointerdown',pointer));
      node.dispatchEvent(new PointerEvent('pointerup',{...pointer,buttons:0}));
      node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,composed:true}));
    },id);
    await page.waitForFunction(expected=>
      document.querySelector('#skyFoundationWheelMount .sky-wheel-sector-description strong')?.textContent===expected,
      name,{timeout:10000});
    const visible=await page.locator('#skyFoundationWheelMount .sky-wheel-sector-description').isVisible();
    assert.equal(visible,true,'The corner text box for '+name+' must be visible.');
  }
  assert.deepEqual(errors,[],'Capitalized corner labels must produce no page errors.');
  console.log('PASS: canonical placement names and visible Moon/Saturn corner boxes use title capitalization.');
} finally { await browser.close(); }
