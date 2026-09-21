import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0}};
function sample(name,offset,profile){
  const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,index)=>(asc+index*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,Chiron:74.48,'North Node':40.3,'South Node':220.3,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
  return{name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{...profile,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))};
}
const skyA=sample('Alpha',0,{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Malden, Massachusetts, United States',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662});
const skyB=sample('Beta',29.27,{dateTime:'2026-09-09T21:00',instant:'2026-09-10T03:00:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891});

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    localStorage.setItem('relphiSkyRelationshipDisplayV1','glyphs');
  },{a:skyA,b:skyB});

  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
  await page.waitForFunction(()=>document.documentElement.dataset.relationshipDisplay==='glyphs',null,{timeout:10000});
  await page.waitForFunction(()=>document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-left-house][data-right-house]').length>10,null,{timeout:20000});

  const expected=await page.evaluate(()=>{
    const placementSymbols={sun:'☉',moon:'☽',mercury:'☿',venus:'♀',mars:'♂',jupiter:'♃',saturn:'♄',uranus:'♅',neptune:'♆',pluto:'♇',chiron:'⚷','north-node':'☊','south-node':'☋',lilith:'⚸','part-of-fortune':'⊗',vertex:'Vx',asc:'Asc',dsc:'Dsc',mc:'MC',ic:'IC'};
    const signSymbols=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
    const aspectSymbols={conjunction:'☌',opposition:'☍',trine:'△',square:'□',sextile:'✶','semi-sextile':'⚺',quincunx:'⚻',octile:'∠','tri-octile':'⚼',quintile:'Q','bi-quintile':'BQ'};
    const coordinate=(row,side)=>{
      const small=row.querySelector(`.sky-foundation-relationship-placement--${side} .sky-foundation-relationship-copy small`);
      const stored=String(small?.dataset?.relationshipCoordinate||'').trim();
      return stored||String(small?.textContent||'').match(/\d{1,2}°\d{2}′/)?.[0]||'';
    };
    const row=[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]')].find(r=>!r.hidden&&getComputedStyle(r).display!=='none'&&Number(r.dataset.leftHouse)>=1&&Number(r.dataset.rightHouse)>=1);
    if(!row)return null;
    const left=row.dataset.leftPlacement||'',right=row.dataset.rightPlacement||'',aspect=row.dataset.aspect||'';
    return {
      leftHouse:row.dataset.leftHouse,
      rightHouse:row.dataset.rightHouse,
      line:`${placementSymbols[left]||left} in ${signSymbols[Number(row.dataset.leftSign)]||''} ${coordinate(row,'left')} H${row.dataset.leftHouse} ${aspectSymbols[aspect]||aspect} ${placementSymbols[right]||right} in ${signSymbols[Number(row.dataset.rightSign)]||''} ${coordinate(row,'right')} H${row.dataset.rightHouse}`.replace(/\s+/g,' ').trim()
    };
  });
  assert.ok(expected,'fixture must expose a visible relationship with both houses');

  await page.evaluate(()=>{
    window.__relphiCopiedText='';
    document.execCommand=()=>false;
    const clipboard={writeText:async text=>{window.__relphiCopiedText=String(text);}};
    try{Object.defineProperty(navigator,'clipboard',{configurable:true,value:clipboard})}catch(_){try{navigator.clipboard.writeText=clipboard.writeText}catch(__){}}
  });
  await page.locator('.sky-relationship-copy-button').click();
  await page.waitForFunction(()=>Boolean(window.__relphiCopiedText),null,{timeout:3000});
  const copied=await page.evaluate(()=>window.__relphiCopiedText);

  assert.ok(copied.includes(expected.line),`Glyph copy must include endpoint house numbers as H#: expected ${expected.line}\n\n${copied}`);
  assert.match(copied,new RegExp(`H${expected.leftHouse}\\b`));
  assert.match(copied,new RegExp(`H${expected.rightHouse}\\b`));
  assert.equal(/First House|Second House|Third House|Fourth House|Fifth House|Sixth House|Seventh House|Eighth House|Ninth House|Tenth House|Eleventh House|Twelfth House/.test(copied),false,'Glyph mode should add only H# house identifiers, not house names or meanings.');
  assert.deepEqual(errors,[]);
  console.log('Glyph relationship copy includes H# for both endpoints without house meanings.');
}finally{
  await browser.close();
}
