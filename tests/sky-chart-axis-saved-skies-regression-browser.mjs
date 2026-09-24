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
const legacySaved={...structuredClone(skyA),id:'legacy-sage',name:'Legacy Sage Event',calcProfile:{},instant:'2021-05-22T16:15:00.000Z',notes:'Motion state sampled around 2021-05-22T16:15:00.000Z. Location: Malden, Massachusetts, United States. Time zone: America/New_York. latitude 42.4251 and longitude -71.0662',metadata:{savedSkyId:'legacy-sage',savedSkyName:'Legacy Sage Event'}};

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1280,height:1000}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.addInitScript(({a,b,library})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyLibraryV1',JSON.stringify(library));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    window.__skyBRemovedCount=0;
    window.addEventListener('relphi:sky-b-removed',()=>{window.__skyBRemovedCount+=1});
  },{a:skyA,b:skyB,library:[saved,legacySaved]});

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

  await page.waitForFunction(()=>['A','B'].every(slot=>{
    const mount=window.RelphiSkyCardShell?.get?.(slot)?.whereFingerprint;
    return !!mount&&!mount.hidden&&!!mount.querySelector('.sky-where-fingerprint-heptagram');
  }),null,{timeout:5000});
  const drawerHeptagrams=await page.evaluate(()=>Object.fromEntries(['A','B'].map(slot=>{
    const mount=window.RelphiSkyCardShell?.get?.(slot)?.whereFingerprint;
    const heptagram=mount?.querySelector('.sky-where-fingerprint-heptagram');
    const rect=heptagram?.getBoundingClientRect();
    const weekLines=Array.from(heptagram?.querySelectorAll('.sky-ph-week-segment')||[]);
    const visibleWeekLines=weekLines.filter(line=>{
      const style=getComputedStyle(line),stroke=String(style.stroke||'').toLowerCase();
      return stroke&&stroke!=='none'&&stroke!=='transparent'&&style.visibility!=='hidden'&&style.display!=='none'&&Number(style.opacity||1)>0;
    });
    return[slot,{exists:!!mount,hidden:mount?.hidden,heptagram:!!heptagram,width:rect?.width||0,height:rect?.height||0,weekLines:weekLines.length,visibleWeekLines:visibleWeekLines.length}];
  })));
  for(const slot of ['A','B']){
    const thumb=drawerHeptagrams[slot];
    assert.equal(thumb.exists,true,`Sky ${slot} Where/When thumbprint mount should exist: ${JSON.stringify(thumb)}`);
    assert.equal(thumb.hidden,false,`Sky ${slot} Where/When thumbprint should not be hidden: ${JSON.stringify(thumb)}`);
    assert.equal(thumb.heptagram,true,`Sky ${slot} microheptagram should exist: ${JSON.stringify(thumb)}`);
    assert.ok(thumb.width>=40&&thumb.height>=40,`Sky ${slot} microheptagram should occupy its visible tab: ${JSON.stringify(thumb)}`);
    assert.ok(thumb.weekLines>=7,`Sky ${slot} microheptagram should retain the weekly star geometry: ${JSON.stringify(thumb)}`);
    assert.equal(thumb.visibleWeekLines,thumb.weekLines,`Sky ${slot} microheptagram lines should be visibly painted: ${JSON.stringify(thumb)}`);
  }

  // Loading an older Saved Sky into an already-mounted Sky B must rebuild both
  // the hidden source heptagram and the visible microheptagram fingerprint.
  await page.locator('[data-saved-sky-trigger="B"]').click();
  await page.waitForSelector('#skySavedSkiesPopover .sky-saved-list',{timeout:5000});
  await page.locator('#skySavedSkiesPopover [data-saved-sky-ref="legacy-sage"]').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('relphiSkyChartB')||'null')?.metadata?.savedSkyId==='legacy-sage',null,{timeout:5000});
  await page.waitForFunction(()=>{
    const refs=window.RelphiSkyCardShell?.get?.('B'),source=refs?.heptagram,thumb=refs?.whereFingerprint?.querySelector('.sky-where-fingerprint-heptagram');
    return !!source&&source.dataset.canonicalSourceReady==='true'&&source.querySelectorAll('.sky-ph-week-segment').length>=7&&!!thumb&&thumb.querySelectorAll('.sky-ph-week-segment').length>=7;
  },null,{timeout:10000});
  const loadedLegacyB=await page.evaluate(()=>{
    const refs=window.RelphiSkyCardShell?.get?.('B'),source=refs?.heptagram,thumb=refs?.whereFingerprint?.querySelector('.sky-where-fingerprint-heptagram'),rect=thumb?.getBoundingClientRect();
    return{sourceReady:source?.dataset.canonicalSourceReady,sourceWeek:source?.querySelectorAll('.sky-ph-week-segment').length||0,thumb:!!thumb,width:rect?.width||0,height:rect?.height||0};
  });
  assert.equal(loadedLegacyB.sourceReady,'true',`Loaded legacy Sky B must rebuild its source heptagram: ${JSON.stringify(loadedLegacyB)}`);
  assert.ok(loadedLegacyB.sourceWeek>=7,`Loaded legacy Sky B source must contain weekly heptagram geometry: ${JSON.stringify(loadedLegacyB)}`);
  assert.equal(loadedLegacyB.thumb,true,`Loaded legacy Sky B must display its microheptagram: ${JSON.stringify(loadedLegacyB)}`);
  assert.ok(loadedLegacyB.width>=40&&loadedLegacyB.height>=40,`Loaded legacy Sky B microheptagram must occupy the visible tab: ${JSON.stringify(loadedLegacyB)}`);

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
    const editor=document.querySelector('#skyFoundationB .sky-where-when-editor[data-slot="B"]');
    const panel=document.getElementById('skyFoundationB');
    return document.documentElement.dataset.skyBEditing==='true'&&!!editor&&!!panel&&!panel.hidden;
  },null,{timeout:10000});
  await page.waitForTimeout(250);
  const afterNew=await page.evaluate(()=>({
    removed:window.__skyBRemovedCount,
    editing:document.documentElement.dataset.skyBEditing,
    bCard:!!document.getElementById('skyFoundationB')&&!document.getElementById('skyFoundationB').hidden,
    mode:localStorage.getItem('relphiSkyChartLastModeV1'),
    storedB:localStorage.getItem('relphiSkyChartB')
  }));
  assert.equal(afterNew.removed,0,`New Sky in B must not invoke Remove Sky B: ${JSON.stringify(afterNew)}`);
  assert.equal(afterNew.editing,'true',`Sky B must remain as the active new-sky editor: ${JSON.stringify(afterNew)}`);
  assert.equal(afterNew.bCard,true,`Sky B card must remain visibly mounted: ${JSON.stringify(afterNew)}`);
  assert.equal(afterNew.mode,'comparison',`comparison mode must remain active while editing the new B: ${JSON.stringify(afterNew)}`);
  assert.equal(afterNew.storedB,null,`uncommitted New Sky B should not masquerade as a stored completed sky: ${JSON.stringify(afterNew)}`);

  assert.deepEqual(errors,[],`browser errors: ${errors.join(' | ')}`);
  console.log('axis label/notch pairing, visibly painted A/B microheptagrams, Saved Skies fingerprints, and in-place Sky B New Sky passed');
}finally{
  await browser.close();
}
