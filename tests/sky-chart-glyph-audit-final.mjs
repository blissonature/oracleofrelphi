import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minuteFloat=(within-degree)*60,minute=Math.floor(minuteFloat),second=Math.round((minuteFloat-minute)*60);return{name,longitude:value,sign:signs[sign],degree,minute,second}};
function sample(name,offset,profile){
  const asc=(168.38+offset)%360,mc=(76.28+offset)%360,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,Chiron:74.48,'North Node':40.3,'South Node':220.3,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
  return{name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{...profile,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))};
}
const skyA=sample('My birth chart',0,{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Malden, Massachusetts, United States',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662});
const skyB=sample('Planetary Hours 2026-08-02 02:07',29.27,{dateTime:'2026-08-02T02:07',instant:'2026-08-02T08:07:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891});

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1660,height:1300}});
const pageErrors=[];
page.on('pageerror',error=>pageErrors.push(error.message));
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b));sessionStorage.removeItem('relphiSkyWhereWhenViewV1')},{a:skyA,b:skyB});
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
await page.waitForSelector('.sky-foundation-relationship-row[data-relation-index]',{timeout:20000});
await page.waitForSelector('#skySelectedRelationship:not([hidden])',{timeout:20000});
await page.waitForFunction(()=>document.querySelectorAll('.sky-ph-heptagram[data-canonical-heptagram-v1="true"]').length===2,null,{timeout:20000});
await page.waitForSelector('html[data-sky-glyph-audit="passed"][data-sky-glyph-audit-count="0"]',{timeout:20000});

const issues=await page.evaluate(()=>{
  const issues=[];
  const registry=window.RelphiGlyphRegistry;
  const zodiac=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const chaldean=['saturn','jupiter','mars','sun','venus','mercury','moon'];
  const rootFor=host=>host?.querySelector?.('.relphi-glyph-bubble')||null;
  const artFor=root=>Array.from(root?.children||[]).find(node=>node.classList?.contains('relphi-canonical-glyph'))||null;
  const circleFor=root=>root?.querySelector?.(':scope > circle')||null;
  const white=value=>value==='rgb(255, 255, 255)'||value==='rgba(255, 255, 255, 1)'||value==='#fff'||value==='#ffffff'||value==='white';
  const isHidden=root=>{
    const circle=circleFor(root);if(!circle)return false;
    const attr=circle.getAttribute('opacity');
    const opacity=attr==null?NaN:Number(attr);
    const styleOpacity=Number.parseFloat(circle.style.opacity||'');
    return root.classList.contains('relphi-glyph-framed')||root.dataset.canonicalFraming==='hidden-bubble'||opacity===0||styleOpacity===0||circle.closest('svg')?.dataset?.canonicalCircle==='hidden';
  };
  const check=(host,expected,label,hiddenExpected)=>{
    const root=rootFor(host),art=artFor(root),entry=registry.get(expected)||registry.resolve(expected);
    if(!root){issues.push(`${label}: canonical bubble missing`);return}
    if(!entry)issues.push(`${label}: registry entry ${expected} missing`);
    if(root.dataset.glyphId!==entry?.id)issues.push(`${label}: expected ${entry?.id||expected}, received ${root.dataset.glyphId||'(missing)'}`);
    if(!art?.classList.contains(`relphi-glyph-${entry?.id||expected}`))issues.push(`${label}: canonical artwork identity mismatch`);
    if(entry?.asset&&art?.querySelector('text'))issues.push(`${label}: asset-backed glyph rendered as text`);
    if(hiddenExpected!==undefined&&isHidden(root)!==hiddenExpected)issues.push(`${label}: calibration-frame visibility mismatch`);
  };

  const audit=window.RelphiSkyGlyphAudit?.run?.()||['audit unavailable'];
  audit.forEach(issue=>issues.push(`runtime audit: ${issue}`));
  if(!window.RelphiGlyphComponent?.skyWhitespaceAware)issues.push('whitespace-aware component wrapper is inactive');

  document.querySelectorAll('.sky-foundation-ledger .sky-foundation-row[data-placement]').forEach((row,index)=>check(row.querySelector(':scope > svg'),row.dataset.placement,`ledger ${index+1}`,true));

  const zodiacHosts=Array.from(document.querySelectorAll('[data-layer="zodiac"] > g'));
  if(zodiacHosts.length!==12)issues.push(`zodiac wheel: expected 12 glyphs, received ${zodiacHosts.length}`);
  zodiacHosts.forEach((host,index)=>check(host,zodiac[index],`zodiac ${zodiac[index]}`,true));

  document.querySelectorAll('[data-layer="placements"] > g[data-placement]').forEach((host,index)=>check(host,host.dataset.placement,`wheel placement ${index+1}`,false));

  document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]').forEach((row,rowIndex)=>{
    const hosts=row.querySelectorAll(':scope > svg');
    const expected=[row.dataset.leftPlacement,row.dataset.aspect,row.dataset.rightPlacement];
    if(hosts.length!==3)issues.push(`relationship row ${rowIndex+1}: expected 3 glyphs, received ${hosts.length}`);
    expected.forEach((id,index)=>check(hosts[index],id,`relationship row ${rowIndex+1} glyph ${index+1}`,true));
  });

  const selected=document.querySelector('#skySelectedRelationship');
  const selectedRow=document.querySelector(`.sky-foundation-relationship-row[data-relation-index="${selected?.dataset?.relationIndex}"]`);
  if(!selected||!selectedRow)issues.push('selected relationship source is unavailable');
  else{
    check(selected.querySelector('[data-selected-graphic-a]'),selectedRow.dataset.leftPlacement,'selected header Sky A',false);
    check(selected.querySelector('[data-selected-graphic-aspect]'),selectedRow.dataset.aspect,'selected header aspect',false);
    check(selected.querySelector('[data-selected-graphic-b]'),selectedRow.dataset.rightPlacement,'selected header Sky B',false);
    selected.querySelectorAll('.sky-selected-reveal-glyph svg').forEach(host=>check(host,selectedRow.dataset.aspect,'selected reveal aspect',true));
  }

  document.querySelectorAll('.sky-progressive-token[data-progressive-glyph-id]').forEach((token,index)=>check(token.querySelector('svg'),token.dataset.progressiveGlyphId,`progressive token ${index+1}`,true));

  document.querySelectorAll('.sky-ph-heptagram[data-canonical-heptagram-v1="true"]').forEach((svg,chartIndex)=>chaldean.forEach(key=>check(svg.querySelector(`.sky-ph-${key} .sky-ph-node-glyph`),key,`heptagram ${chartIndex+1} ${key}`,false)));

  const hourRulers=Array.from(document.querySelectorAll('.sky-ph-canonical-bubble.is-hour-ruler'));
  if(hourRulers.length!==2)issues.push(`hour-ruler inversion: expected 2 rulers, received ${hourRulers.length}`);
  hourRulers.forEach((root,index)=>{
    const art=artFor(root),field=circleFor(root);
    if(!art)issues.push(`hour-ruler ${index+1}: canonical artwork missing`);
    if(art?.dataset.hourRulerInverse!=='true')issues.push(`hour-ruler ${index+1}: inverse pass was not applied`);
    if(!field)issues.push(`hour-ruler ${index+1}: solid field missing`);
    else{
      const fill=getComputedStyle(field).fill;
      if(fill==='none'||fill==='rgba(0, 0, 0, 0)'||white(fill))issues.push(`hour-ruler ${index+1}: field is not a solid planetary color`);
    }
    art?.querySelectorAll('path,circle,ellipse,rect,polygon,polyline,line,text').forEach(node=>{
      const style=getComputedStyle(node);
      const fillOpacity=Number.parseFloat(style.fillOpacity||'1');
      const strokeOpacity=Number.parseFloat(style.strokeOpacity||'1');
      const strokeWidth=Number.parseFloat(style.strokeWidth||'0');
      if(style.fill!=='none'&&fillOpacity>0&&!white(style.fill))issues.push(`hour-ruler ${index+1}: rendered fill is not white`);
      if(style.stroke!=='none'&&strokeOpacity>0&&strokeWidth>0&&!white(style.stroke))issues.push(`hour-ruler ${index+1}: rendered stroke is not white`);
    });
  });

  document.querySelectorAll('.relphi-glyph-venus').forEach((art,index)=>{
    const circle=art.querySelector('circle'),cross=art.querySelector('path');
    if(!circle||!cross)issues.push(`Venus ${index+1}: canonical circle or cross missing`);
    if(circle&&getComputedStyle(circle).stroke==='none')issues.push(`Venus ${index+1}: circle stroke missing`);
    if(cross&&getComputedStyle(cross).stroke==='none')issues.push(`Venus ${index+1}: cross stroke missing`);
  });
  document.querySelectorAll('.relphi-glyph-moon').forEach((art,index)=>{
    const path=art.querySelector('path');
    if(!path)issues.push(`Moon ${index+1}: canonical crescent missing`);
    if(path&&getComputedStyle(path).stroke==='none')issues.push(`Moon ${index+1}: supportive stroke missing`);
  });

  document.querySelectorAll('.relphi-glyph-bubble').forEach((root,index)=>{
    const entry=registry.get(root.dataset.glyphId)||registry.resolve(root.dataset.glyphId),art=artFor(root);
    if(!entry)issues.push(`bubble ${index+1}: unresolved identity`);
    if(!art)issues.push(`bubble ${index+1}: artwork missing`);
    if(entry&&art&&!art.classList.contains(`relphi-glyph-${entry.id}`))issues.push(`bubble ${index+1}: identity/artwork mismatch`);
  });
  return Array.from(new Set(issues));
});
assert.deepEqual(issues,[]);
assert.deepEqual(pageErrors,[]);
await page.screenshot({path:'sky-chart-glyph-audit-desktop.png',fullPage:true});

await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(350);
assert.deepEqual(await page.evaluate(()=>window.RelphiSkyGlyphAudit.run()),[]);
assert.equal(await page.getAttribute('html','data-sky-glyph-audit'),'passed');
await page.screenshot({path:'sky-chart-glyph-audit-mobile.png',fullPage:true});

await browser.close();
console.log('Sky Chart canonical glyph audit passed on desktop and mobile, including inherited white-on-color hour-ruler paint.');
