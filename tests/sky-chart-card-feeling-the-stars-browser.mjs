import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import path from 'node:path';

const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

function makeSky(name,shift=0) {
  const asc=(168.38+shift)%360;
  const cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
  const bodies={
    Sun:195,Moon:118.42,Saturn:235.57,Mercury:196.5,Venus:169.88,Mars:167.87,
    Jupiter:307.15,Uranus:254.85,Neptune:271.02,Pluto:213.88,Chiron:74.48,
    'North Node':40.3,'South Node':220.3,'Part of Fortune':244.97,
    Vertex:330.33,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28
  };
  const placements=Object.fromEntries(Object.entries(bodies).map(([label,base])=>{
    const longitude=(base+shift)%360;
    const sign=Math.floor(longitude/30);
    const within=longitude%30;
    return [label,{name:label,longitude,sign:signs[sign],degree:Math.floor(within),
      minute:Math.floor((within%1)*60),second:0}];
  }));
  return {name,houseSystem:'equal-house',houseCusps:cusps,
    calcProfile:{houseCusps:cusps,houseSystem:'equal-house',dateTime:'2026-11-04T17:00',
      instant:'2026-11-05T00:00:00.000Z',timeZone:'America/Denver',
      latitude:40.76,longitude:-111.89},placements};
}

async function focus(page,selector,label,kind,value,sky,method='click'){
  const target=page.locator(selector);
  await target.waitFor({state:'visible'});
  await target.scrollIntoViewIfNeeded();
  if(method==='tap') await target.tap();
  else if(method==='Enter'||method==='Space'){
    await target.focus();
    await target.press(method==='Space'?'Space':'Enter');
  } else await target.click();
  await page.waitForFunction(expected=>{
    const el=document.querySelector('#skyFoundationWheelMount .sky-wheel-sector-description');
    return !!el&&!el.hidden&&el.querySelector('strong')?.textContent===expected;
  },label,{timeout:15000});
  const selected=await page.evaluate(()=>window.__relphiSkyCardFocusTrace?.at(-1)?.state||null);
  assert.equal(selected?.kind,kind,'The wheel must own a '+kind+' selection, not the row planet');
  assert.equal(String(selected?.value),String(value),'Selected focus value should match the clicked part');
  assert.equal(selected?.sky||null,sky||null,'The focus sky must match the target');
}

async function run(browser,mode,url='http://127.0.0.1:4173/sky-chart.html'){
  const mobile=mode==='mobile';
  const context=await browser.newContext({
    viewport:mobile?{width:390,height:844}:{width:1280,height:980},
    isMobile:mobile,hasTouch:mobile,timezoneId:'America/Denver',
    deviceScaleFactor:mobile?2:1
  });
  try{
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',
      route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
    await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',
      route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
    await page.route('https://nominatim.openstreetmap.org/**',
      route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
    await page.addInitScript(({a,b})=>{
      localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
      localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
      localStorage.setItem('relphiSkyChartLastModeV1','comparison');
      window.__relphiSkyCardFocusTrace=[];
      window.addEventListener('relphi:sky-foundation-filter-changed',event=>{
        if(event.detail?.state?.mode==='selected'){
          window.__relphiSkyCardFocusTrace.push({state:event.detail.state});
        }
      });
    },{a:makeSky('Marisa'),b:makeSky('Nov 4, 2026',29.27)});
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
    await page.waitForSelector('#skyFoundationA .sky-foundation-row[data-placement="jupiter"] .sky-foundation-coordinate-sign[data-interactive="sign"]',{timeout:30000});
    await page.waitForSelector('#skyFoundationA .sky-foundation-row[data-placement="jupiter"] .sky-foundation-house[data-interactive="house"]',{timeout:30000});
    const base='#skyFoundationA .sky-foundation-row[data-placement="jupiter"]';
    const details=await page.evaluate(base=>{
      const row=document.querySelector(base);
      return {
        text:row?.textContent,
        sign:Number(row?.querySelector('.sky-foundation-coordinate-sign')?.dataset.sign),
        house:Number(row?.querySelector('.sky-foundation-house')?.dataset.house),
        signRole:row?.querySelector('.sky-foundation-coordinate-sign')?.getAttribute('role'),
        houseRole:row?.querySelector('.sky-foundation-house')?.getAttribute('role')
      };
    },base);
    assert.equal(details.sign,10,'Jupiter should be in Aquarius');
    assert.equal(details.house,5,'Jupiter should be in the fifth house');
    assert.equal(details.signRole,'button');
    assert.equal(details.houseRole,'button');
    assert.match(details.text,/Aquarius/);

    const method=mobile?'tap':'click';
    await focus(page,base+' .sky-foundation-row-name','Jupiter','placement','jupiter','A',method);
    await focus(page,base+' .sky-foundation-coordinate-sign','Aquarius','sign',10,null,method);
    assert.equal(await page.locator(base+' .sky-foundation-coordinate-sign').getAttribute('aria-pressed'),'true');
    await focus(page,base+' .sky-foundation-house','Fifth House','house',5,'A',method);
    assert.equal(await page.locator(base+' .sky-foundation-house').getAttribute('aria-pressed'),'true');
    await focus(page,base+' > svg','Jupiter','placement','jupiter','A',method);

    // Switch to a different sky and back without carrying Jupiter's tooltip.
    const b='#skyFoundationB .sky-foundation-row[data-placement="jupiter"]';
    await focus(page,b+' .sky-foundation-coordinate-sign','Pisces','sign',11,null,method);
    await focus(page,b+' .sky-foundation-house','Fifth House','house',5,'B',method);

    if(!mobile){
      await focus(page,base+' .sky-foundation-coordinate-sign','Aquarius','sign',10,null,'Enter');
      await focus(page,base+' .sky-foundation-house','Fifth House','house',5,'A','Space');
      await focus(page,base,'Jupiter','placement','jupiter','A','Enter');
    }
    // Repeated activation must toggle the canonical lock off, not leave stale help.
    // The mobile sequence ends on Sky B's house, so first select Jupiter on A.
    if(mobile)await focus(page,base+' .sky-foundation-row-name','Jupiter','placement','jupiter','A',method);
    await page.locator(base+' .sky-foundation-row-name')[method]();
    await page.waitForFunction(()=>{
      const label=document.querySelector('#skyFoundationWheelMount .sky-wheel-sector-description');
      return !!label&&label.hidden;
    },null,{timeout:15000});
    assert.deepEqual(errors,[],'Sky Card focus should not raise page errors');
    console.log('PASS '+mode+': Jupiter / Aquarius / Fifth House independent help and focus, both skies, keyboard/touch, selection clear');
  } finally{await context.close()}
}

const browser=await chromium.launch({headless:true});
try{
  await run(browser,'desktop');
  await run(browser,'mobile');
  const ref=process.env.REMOTE_PREVIEW_REF||'';
  if(ref){
    assert.match(ref,/^[a-f0-9]{40}$/i,'Hosted preview requires an exact commit SHA');
    await run(browser,'hosted-preview',`https://oracleofrelphi.com/sky-chart-preview/sky-chart.html?ref=${ref}`);
  }
} finally{await browser.close()}
