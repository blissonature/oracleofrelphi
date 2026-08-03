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
const skyB=sample('Planetary Hours 2026-08-02 02:07',29.27,{dateTime:'2026-08-02T02:07',instant:'2026-08-02T08:07:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891});

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1660,height:1300},deviceScaleFactor:2});
const pageErrors=[];
page.on('pageerror',error=>pageErrors.push(error.message));
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b));sessionStorage.removeItem('relphiSkyWhereWhenViewV1')},{a:skyA,b:skyB});
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
await page.waitForFunction(()=>document.querySelectorAll('.sky-ph-canonical-bubble.is-hour-ruler').length===2,null,{timeout:20000});
await page.waitForFunction(()=>typeof window.RelphiSkyColors?.scan==='function',null,{timeout:20000});
await page.waitForFunction(()=>document.querySelectorAll('.relphi-glyph-bubble[data-relphi-atomic-pending="true"]').length===0,null,{timeout:20000});
await page.waitForFunction(()=>window.RelphiSkyColors?.scan?.().passed===true,null,{timeout:20000});
const colorScan=await page.evaluate(()=>window.RelphiSkyColors.scan());
assert.equal(colorScan.passed,true,`Placement color scan painted ${colorScan.painted}/${colorScan.expected} hosts.`);
assert.equal(await page.getAttribute('html','data-sky-placement-colors'),'passed');
await page.waitForTimeout(100);

const issues=await page.evaluate(({colors})=>{
  const issues=[];
  const geometry='path,circle,ellipse,rect,polygon,polyline,line,text';
  const artFor=host=>{const root=host?.querySelector?.('.relphi-glyph-bubble');return root?Array.from(root.children).find(node=>node.classList?.contains('relphi-canonical-glyph')):null};
  const paintedLeaves=art=>Array.from(art?.querySelectorAll(geometry)||[]);
  const checkColor=(host,slot,label)=>{
    const art=artFor(host);
    if(!art){issues.push(`${label}: canonical art missing`);return}
    paintedLeaves(art).forEach((node,index)=>{
      const style=getComputedStyle(node);
      if(style.fill!=='none'&&style.fill!=='rgba(0, 0, 0, 0)'&&style.fill!==colors[slot])issues.push(`${label} shape ${index+1}: fill ${style.fill}, expected ${colors[slot]}`);
      if(style.stroke!=='none'&&style.stroke!=='rgba(0, 0, 0, 0)'&&style.stroke!==colors[slot])issues.push(`${label} shape ${index+1}: stroke ${style.stroke}, expected ${colors[slot]}`);
    });
  };

  document.querySelectorAll('#skyFoundationA .sky-foundation-row > svg').forEach((host,index)=>checkColor(host,'A',`Sky A ledger ${index+1}`));
  document.querySelectorAll('#skyFoundationB .sky-foundation-row > svg').forEach((host,index)=>checkColor(host,'B',`Sky B ledger ${index+1}`));
  document.querySelectorAll('[data-layer="placements"] > g[data-sky="A"]').forEach((host,index)=>checkColor(host,'A',`Sky A wheel ${index+1}`));
  document.querySelectorAll('[data-layer="placements"] > g[data-sky="B"]').forEach((host,index)=>checkColor(host,'B',`Sky B wheel ${index+1}`));

  const rulers=Array.from(document.querySelectorAll('.sky-ph-canonical-bubble.is-hour-ruler'));
  if(rulers.length!==2)issues.push(`Expected 2 hour rulers, received ${rulers.length}`);
  rulers.forEach((root,index)=>{
    const rootStyle=getComputedStyle(root);
    if(rootStyle.filter!=='none')issues.push(`Hour ruler ${index+1}: filter is ${rootStyle.filter}`);
    const art=Array.from(root.children).find(node=>node.classList?.contains('relphi-canonical-glyph'));
    if(!art)issues.push(`Hour ruler ${index+1}: canonical art missing`);
    paintedLeaves(art).forEach((node,shapeIndex)=>{
      const style=getComputedStyle(node);
      if(style.vectorEffect!=='none')issues.push(`Hour ruler ${index+1} shape ${shapeIndex+1}: vector-effect is ${style.vectorEffect}`);
      if(style.fill!=='none'&&style.fill!=='rgba(0, 0, 0, 0)'&&style.fill!=='rgb(255, 255, 255)')issues.push(`Hour ruler ${index+1} shape ${shapeIndex+1}: nonwhite fill ${style.fill}`);
      if(style.stroke!=='none'&&style.stroke!=='rgba(0, 0, 0, 0)'&&style.stroke!=='rgb(255, 255, 255)')issues.push(`Hour ruler ${index+1} shape ${shapeIndex+1}: nonwhite stroke ${style.stroke}`);
    });
  });
  return Array.from(new Set(issues));
},{colors:COLORS});

assert.deepEqual(issues,[]);
assert.deepEqual(pageErrors,[]);
await page.screenshot({path:'sky-chart-hour-ruler-and-sky-colors-desktop.png',fullPage:true});
await page.locator('#skyFoundationA').screenshot({path:'sky-chart-sky-a-card-colors.png'});
await page.locator('#skyFoundationB').screenshot({path:'sky-chart-sky-b-card-colors.png'});

await page.setViewportSize({width:390,height:844});
await page.waitForFunction(()=>document.querySelectorAll('.relphi-glyph-bubble[data-relphi-atomic-pending="true"]').length===0,null,{timeout:20000});
await page.waitForTimeout(350);
await page.screenshot({path:'sky-chart-hour-ruler-and-sky-colors-mobile.png',fullPage:true});
await browser.close();
console.log('Sky Chart hour rulers are crisp, and Sky A/B placement glyph colors are consistent.');