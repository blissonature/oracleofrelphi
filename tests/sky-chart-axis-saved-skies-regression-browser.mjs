import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0}};
function sample(name,offset,profile){
  const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,index)=>(asc+index*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,Chiron:74.48,'North Node':40.3,'South Node':220.3,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
  return{name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{...profile,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))};
}
const skyA=sample('Alpha sky',0,{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Malden, Massachusetts, United States',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662});
const skyB=sample('Beta sky',29.27,{dateTime:'2026-09-10T21:00',instant:'2026-09-11T03:00:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891});
const saved={...structuredClone(skyA),id:'saved-alpha',name:'Saved Alpha',metadata:{savedSkyId:'saved-alpha',savedSkyName:'Saved Alpha'}};

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1280,height:1000}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.addInitScript(({a,b,library})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyLibraryV1',JSON.stringify(library));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    window.__skyBRemovedCount=0;
    window.addEventListener('relphi:sky-b-removed',()=>{window.__skyBRemovedCount+=1});
  },{a:skyA,b:skyB,library:[saved]});

  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle',timeout:30000});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
  await page.waitForFunction(()=>document.documentElement.dataset.skyBPresent==='true',null,{timeout:10000});

  const axes=await page.evaluate(()=>{
    const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
    return [...(wheel?.querySelectorAll('[data-layer="leaders"] > line[data-angle]')||[])].map(leader=>{
      const angle=leader.dataset.angle||leader.dataset.placement||'',extreme=leader.dataset.axisExtreme||'',sky=leader.dataset.sky||'';
      const marker=wheel?.querySelector(`[data-layer="placements"] > g[data-sky="${sky}"][data-placement="${angle}"]`);
      return{angle,extreme,sky,marker:!!marker};
    });
  });
  assert.equal(axes.length,8,`comparison wheel should have eight axis notches: ${JSON.stringify(axes)}`);
  for(const axis of axes){
    assert.ok(axis.marker,`axis notch must stay paired with its label: ${JSON.stringify(axis)}`);
    if(axis.extreme==='inner')assert.equal(axis.sky,'A',`inner axis belongs to Sky A: ${JSON.stringify(axis)}`);
    if(axis.extreme==='outer')assert.equal(axis.sky,'B',`outer axis belongs to Sky B: ${JSON.stringify(axis)}`);
  }

  await page.waitForFunction(()=>{
    const mount=window.RelphiSkyCardShell?.get?.('B')?.whereFingerprint;
    return !!mount&&!mount.hidden&&!!mount.querySelector('.sky-where-fingerprint-heptagram');
  },null,{timeout:5000});
  const drawerHeptagram=await page.evaluate(()=>{
    const mount=window.RelphiSkyCardShell?.get?.('B')?.whereFingerprint;
    return{exists:!!mount,hidden:mount?.hidden,heptagram:!!mount?.querySelector('.sky-where-fingerprint-heptagram')};
  });
  assert.deepEqual(drawerHeptagram,{exists:true,hidden:false,heptagram:true},`Sky B Where/When thumbprint should be visible: ${JSON.stringify(drawerHeptagram)}`);

  await page.locator('[data-saved-sky-trigger="B"]').click();
  await page.waitForSelector('#skySavedSkiesPopover .sky-saved-list',{timeout:5000});
  await page.waitForFunction(()=>!!document.querySelector('#skySavedSkiesPopover [data-private-sky-fingerprint="true"]'),null,{timeout:5000});
  const picker=await page.evaluate(()=>({
    heading:!!document.querySelector('#skySavedSkiesPopover .sky-saved-subview-head'),
    fingerprint:!!document.querySelector('#skySavedSkiesPopover [data-private-sky-fingerprint="true"] .sky-saved-fingerprint-triptych'),
    heptagram:!!document.querySelector('#skySavedSkiesPopover [data-fingerprint-part="where"] .sky-where-fingerprint-heptagram'),
    newSky:!!document.querySelector('#skySavedSkiesPopover [data-sky-command="new"]')
  }));
  assert.equal(picker.heading,false,`direct Saved Skies picker must not keep a hidden heading sentinel: ${JSON.stringify(picker)}`);
  assert.equal(picker.fingerprint,true,`saved sky fingerprint should render: ${JSON.stringify(picker)}`);
  assert.equal(picker.heptagram,true,`saved sky temporal heptagram should render: ${JSON.stringify(picker)}`);
  assert.equal(picker.newSky,true,`New Sky should be available in Sky B: ${JSON.stringify(picker)}`);

  await page.locator('#skySavedSkiesPopover [data-sky-command="new"]').click();
  await page.waitForFunction(()=>{
    try{
      const b=JSON.parse(localStorage.getItem('relphiSkyChartB')||'null');
      return document.documentElement.dataset.skyBPresent==='true'&&b&&Object.keys(b.placements||{}).length===0;
    }catch(_){return false}
  },null,{timeout:10000});
  await page.waitForTimeout(250);
  const afterNew=await page.evaluate(()=>({
    removed:window.__skyBRemovedCount,
    bPresent:document.documentElement.dataset.skyBPresent,
    bCard:!!document.getElementById('skyFoundationB'),
    mode:localStorage.getItem('relphiSkyChartLastModeV1'),
    blank:Object.keys(JSON.parse(localStorage.getItem('relphiSkyChartB')||'{}').placements||{}).length===0
  }));
  assert.equal(afterNew.removed,0,`New Sky in B must not remove/re-add Sky B: ${JSON.stringify(afterNew)}`);
  assert.equal(afterNew.bPresent,'true',`Sky B must remain present: ${JSON.stringify(afterNew)}`);
  assert.equal(afterNew.bCard,true,`Sky B card must remain mounted: ${JSON.stringify(afterNew)}`);
  assert.equal(afterNew.mode,'comparison',`comparison mode must remain active: ${JSON.stringify(afterNew)}`);
  assert.equal(afterNew.blank,true,`Sky B should reset in place to a blank sky: ${JSON.stringify(afterNew)}`);

  assert.deepEqual(errors,[],`browser errors: ${errors.join(' | ')}`);
  console.log('axis label/notch pairing, visible heptagram thumbprints, Saved Skies fingerprints, and in-place Sky B New Sky passed');
}finally{
  await browser.close();
}
