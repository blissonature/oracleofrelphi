import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0}};
function sample(name,offset,profile){
  const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,index)=>(asc+index*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Midheaven:76.28};
  return{name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{...profile,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))};
}
const skyA=sample('Alpha sky',0,{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Malden, Massachusetts, United States',locationQuery:'Malden, MA',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662});
const skyB=sample('Beta sky',29.27,{dateTime:'2026-09-09T21:00',instant:'2026-09-10T03:00:00.000Z',location:'Salt Lake City, Utah, United States',locationQuery:'Salt Lake City, UT',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891});

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b));localStorage.setItem('relphiSkyChartLastModeV1','comparison')},{a:skyA,b:skyB});
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
await page.waitForSelector('#skyFoundationRelationshipList .sky-foundation-relationship-row',{timeout:20000});
await page.waitForTimeout(500);

const audit=await page.evaluate(()=>{
  const rows=[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]')];
  const lines=[...document.querySelectorAll('[data-layer="aspects"]>line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)')];
  const visible=node=>{
    const s=getComputedStyle(node);
    return !node.hidden&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&s.stroke!=='rgba(0, 0, 0, 0)'&&s.stroke!=='transparent';
  };
  const identity=node=>{
    const mode=String(node.dataset.relationshipMode||'A-B').toUpperCase();
    const leftSky=node.dataset.leftSky||(mode==='B-B'?'B':'A');
    const rightSky=node.dataset.rightSky||(mode==='A-A'?'A':'B');
    return `${leftSky}:${node.dataset.leftPlacement}|${node.dataset.aspect}|${rightSky}:${node.dataset.rightPlacement}`;
  };
  const visibleRows=rows.filter(visible);
  const visibleLines=lines.filter(visible);
  const visibleLineIds=new Set(visibleLines.map(identity));
  return {
    totalRows:rows.length,
    visibleRows:visibleRows.length,
    totalLines:lines.length,
    indexedLines:lines.filter(line=>line.dataset.relationIndex).length,
    visibleLines:visibleLines.length,
    sampleLines:lines.slice(0,12).map(line=>({id:identity(line),index:line.dataset.relationIndex||'',hidden:line.hidden,display:getComputedStyle(line).display,opacity:getComputedStyle(line).opacity,stroke:getComputedStyle(line).stroke,classes:line.getAttribute('class')})),
    missingVisibleRowLines:visibleRows.map(identity).filter(id=>!visibleLineIds.has(id)).slice(0,20),
    htmlVisibleRows:document.documentElement.dataset.skyVisibleRelationshipRows||'',
    htmlVisibleLines:document.documentElement.dataset.skyVisibleRelationshipLines||''
  };
});
console.log('ASPECT_LINE_AUDIT',JSON.stringify(audit));
await page.screenshot({path:'sky-chart-aspect-line-visibility.png',fullPage:true});
assert.ok(audit.visibleRows>0,'Fixture must produce visible relationship rows.');
assert.ok(audit.visibleLines>0,'Visible relationship rows must produce visible aspect lines in the wheel center.');
assert.ok(audit.missingVisibleRowLines.length===0,`Every visible relationship row needs a visible wheel line; missing ${audit.missingVisibleRowLines.join(', ')}`);
assert.deepEqual(errors,[]);
await browser.close();
console.log('Sky Chart visible relationship rows have visible wheel aspect lines.');
