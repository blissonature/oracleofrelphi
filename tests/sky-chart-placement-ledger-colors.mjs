import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const COLORS={A:'rgb(201, 33, 30)',B:'rgb(36, 98, 208)'};
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0}};
function sample(name,offset,profile){
  const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,index)=>(asc+index*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,Chiron:74.48,'North Node':40.3,'South Node':220.3,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
  return{name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{...profile,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))};
}
const skyA=sample('My birth chart',0,{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Malden, Massachusetts, United States',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662});
const skyB=sample('Current sky',29.27,{dateTime:'2026-08-02T02:07',instant:'2026-08-02T08:07:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891});

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1660,height:1300},deviceScaleFactor:2});
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b));sessionStorage.removeItem('relphiSkyWhereWhenViewV1')},{a:skyA,b:skyB});
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});

await page.locator('#skyFoundationA button',{hasText:'Placements'}).click();
await page.locator('#skyFoundationB button',{hasText:'Placements'}).click();
await page.waitForFunction(()=>document.querySelectorAll('#skyFoundationA .sky-foundation-row').length>10&&document.querySelectorAll('#skyFoundationB .sky-foundation-row').length>10,null,{timeout:20000});
await page.waitForFunction(()=>{
  const hosts=Array.from(document.querySelectorAll('#skyFoundationA .sky-foundation-row > svg,#skyFoundationB .sky-foundation-row > svg'));
  return hosts.length>20&&hosts.every(host=>{
    const root=host.querySelector('.relphi-glyph-bubble.relphi-glyph-framed[data-canonical-framing="hidden-bubble"]');
    const circle=root?.querySelector(':scope > circle');
    const art=root&&Array.from(root.children).find(node=>node.classList?.contains('relphi-canonical-glyph'));
    return host.getAttribute('viewBox')==='-20 -20 40 40'&&
      host.dataset.canonicalFit==='registry-component'&&
      !!host.dataset.canonicalGlyphId&&
      !!root&&
      circle?.getAttribute('opacity')==='0'&&
      art?.dataset.relphiAtomicCommit==='true'&&
      !!art.getAttribute('transform');
  });
},null,{timeout:20000});
await page.waitForFunction(()=>typeof window.RelphiSkyColors?.scan==='function',null,{timeout:20000});
const colorScan=await page.evaluate(()=>window.RelphiSkyColors.scan());
assert.equal(colorScan.passed,true,`Placement color scan painted ${colorScan.painted}/${colorScan.expected} hosts.`);
assert.equal(await page.getAttribute('html','data-sky-placement-colors'),'passed');
await page.waitForTimeout(100);

const issues=await page.evaluate(({colors})=>{
  const issues=[];
  const geometry='path,circle,ellipse,rect,polygon,polyline,line,text';
  const testPanel=(selector,slot)=>{
    const rows=Array.from(document.querySelectorAll(`${selector} .sky-foundation-row`));
    if(rows.length<10)issues.push(`${slot}: placement ledger did not render`);
    rows.forEach((row,index)=>{
      const host=row.querySelector(':scope > svg');
      if(host?.getAttribute('viewBox')!=='-20 -20 40 40')issues.push(`${slot} row ${index+1}: ledger viewBox changed`);
      if(host?.dataset.canonicalFit!=='registry-component')issues.push(`${slot} row ${index+1}: registry-component fit marker missing`);
      if(!host?.dataset.canonicalGlyphId)issues.push(`${slot} row ${index+1}: canonical glyph identity missing`);
      const root=host?.querySelector('.relphi-glyph-bubble.relphi-glyph-framed');
      if(root?.dataset.canonicalFraming!=='hidden-bubble')issues.push(`${slot} row ${index+1}: hidden calibration framing missing`);
      const circle=root?.querySelector(':scope > circle');
      if(circle?.getAttribute('opacity')!=='0'||circle?.getAttribute('aria-hidden')!=='true')issues.push(`${slot} row ${index+1}: calibration circle remains visible`);
      const art=root&&Array.from(root.children).find(node=>node.classList?.contains('relphi-canonical-glyph'));
      if(!art){issues.push(`${slot} row ${index+1}: canonical art missing`);return}
      if(art.dataset.relphiAtomicCommit!=='true'||!art.getAttribute('transform'))issues.push(`${slot} row ${index+1}: canonical art did not commit and fit atomically`);
      art.querySelectorAll(geometry).forEach((node,shapeIndex)=>{
        const style=getComputedStyle(node);
        if(style.fill!=='none'&&style.fill!=='rgba(0, 0, 0, 0)'&&style.fill!==colors[slot])issues.push(`${slot} row ${index+1} shape ${shapeIndex+1}: fill ${style.fill}`);
        if(style.stroke!=='none'&&style.stroke!=='rgba(0, 0, 0, 0)'&&style.stroke!==colors[slot])issues.push(`${slot} row ${index+1} shape ${shapeIndex+1}: stroke ${style.stroke}`);
      });
    });
  };
  testPanel('#skyFoundationA','A');
  testPanel('#skyFoundationB','B');
  return Array.from(new Set(issues));
},{colors:COLORS});

assert.deepEqual(issues,[]);
await page.locator('#skyFoundationA').screenshot({path:'sky-chart-sky-a-placement-ledger-red.png'});
await page.locator('#skyFoundationB').screenshot({path:'sky-chart-sky-b-placement-ledger-blue.png'});
await page.screenshot({path:'sky-chart-placement-ledgers-red-blue.png',fullPage:true});
await browser.close();
console.log('Sky A placement ledger uses canonical atomic red glyphs; Sky B uses canonical atomic blue glyphs.');