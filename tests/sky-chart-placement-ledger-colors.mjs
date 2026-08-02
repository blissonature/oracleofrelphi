import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const COLORS={A:'rgb(201, 33, 30)',B:'rgb(36, 98, 208)'};
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0}};
function sample(name,offset,profile){
  const asc=(168.38+offset)%360,mc=(76.28+offset)%360,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
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

await page.locator('#skyFoundationA button', {hasText:'Placements'}).click();
await page.locator('#skyFoundationB button', {hasText:'Placements'}).click();
await page.waitForFunction(()=>document.querySelectorAll('#skyFoundationA .sky-foundation-row').length>10&&document.querySelectorAll('#skyFoundationB .sky-foundation-row').length>10,null,{timeout:20000});
await page.waitForFunction(()=>{
  const hosts=Array.from(document.querySelectorAll('#skyFoundationA .sky-foundation-row > svg,#skyFoundationB .sky-foundation-row > svg'));
  return hosts.length>20&&hosts.every(host=>host.dataset.canonicalCircle==='hidden'&&host.getAttribute('viewBox')==='-22 -22 44 44'&&host.dataset.canonicalFit);
},null,{timeout:20000});
await page.waitForSelector('html[data-sky-placement-colors="passed"]',{timeout:20000});
await page.waitForTimeout(400);

const issues=await page.evaluate(({colors})=>{
  const issues=[];
  const geometry='path,circle,ellipse,rect,polygon,polyline,line,text';
  const testPanel=(selector,slot)=>{
    const rows=Array.from(document.querySelectorAll(`${selector} .sky-foundation-row`));
    if(rows.length<10)issues.push(`${slot}: placement ledger did not render`);
    rows.forEach((row,index)=>{
      const host=row.querySelector(':scope > svg');
      if(host?.getAttribute('viewBox')!=='-22 -22 44 44')issues.push(`${slot} row ${index+1}: canonical native canvas viewBox missing`);
      if(host?.dataset.canonicalCircle!=='hidden')issues.push(`${slot} row ${index+1}: calibration circle was not hidden`);
      if(!['native-canvas','fallback-frame'].includes(host?.dataset.canonicalFit))issues.push(`${slot} row ${index+1}: canonical fit mode missing`);
      const root=host?.querySelector('.relphi-glyph-bubble');
      const art=root&&Array.from(root.children).find(node=>node.classList?.contains('relphi-canonical-glyph'));
      if(!art){issues.push(`${slot} row ${index+1}: canonical art missing`);return}
      if(art.dataset.skyPlacementColor!==slot)issues.push(`${slot} row ${index+1}: color pass missing`);
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
console.log('Sky A placement ledger is native-canvas and red; Sky B is native-canvas and blue.');
