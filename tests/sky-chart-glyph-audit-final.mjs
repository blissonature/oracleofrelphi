import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minuteFloat=(within-degree)*60,minute=Math.floor(minuteFloat),second=Math.round((minuteFloat-minute)*60);return{name,longitude:value,sign:SIGNS[sign],degree,minute,second}};
function sample(name,offset,profile){
  const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,index)=>(asc+index*30)%360);
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
await page.waitForFunction(()=>typeof window.RelphiSkyGlyphAudit?.run==='function',null,{timeout:20000});

async function audit(){
  return page.evaluate(()=>{
    const issues=window.RelphiSkyGlyphAudit.run();
    const hourRulers=Array.from(document.querySelectorAll('.sky-ph-canonical-bubble.is-hour-ruler'));
    const inverseIssues=[];
    if(hourRulers.length!==2) inverseIssues.push(`Expected 2 inverse hour rulers, received ${hourRulers.length}`);
    hourRulers.forEach((root,index)=>{
      const art=Array.from(root.children).find(node=>node.classList?.contains('relphi-canonical-glyph'));
      const field=root.querySelector(':scope > circle');
      if(!art) inverseIssues.push(`Hour ruler ${index+1}: canonical artwork missing`);
      if(art?.dataset.hourRulerInverse!=='true') inverseIssues.push(`Hour ruler ${index+1}: inverse treatment missing`);
      if(!field) inverseIssues.push(`Hour ruler ${index+1}: solid field missing`);
      const fill=field?getComputedStyle(field).fill:'';
      if(!fill||fill==='none'||fill==='rgba(0, 0, 0, 0)'||fill==='rgb(255, 255, 255)') inverseIssues.push(`Hour ruler ${index+1}: solid planetary field missing`);
    });
    return{
      issues:[...issues,...inverseIssues],
      state:document.documentElement.dataset.skyGlyphAudit,
      count:document.documentElement.dataset.skyGlyphAuditCount,
      bubbles:document.querySelectorAll('.relphi-glyph-bubble').length,
      zodiac:document.querySelectorAll('[data-layer="zodiac"] > g').length,
      placementGlyphs:document.querySelectorAll('[data-layer="placements"] > g[data-placement]').length,
      relationshipRows:document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]').length
    };
  });
}

const desktopAudit=await audit();
assert.deepEqual(desktopAudit.issues,[]);
assert.equal(desktopAudit.state,'passed');
assert.equal(desktopAudit.count,'0');
assert.ok(desktopAudit.bubbles>0);
assert.equal(desktopAudit.zodiac,12);
assert.ok(desktopAudit.placementGlyphs>0);
assert.ok(desktopAudit.relationshipRows>0);
assert.deepEqual(pageErrors,[]);
await page.screenshot({path:'sky-chart-glyph-audit-desktop.png',fullPage:true});

await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(350);
const mobileAudit=await audit();
assert.deepEqual(mobileAudit.issues,[]);
assert.equal(mobileAudit.state,'passed');
assert.equal(mobileAudit.count,'0');
assert.deepEqual(pageErrors,[]);
await page.screenshot({path:'sky-chart-glyph-audit-mobile.png',fullPage:true});

await browser.close();
console.log('Sky Chart canonical glyph audit passed on desktop and mobile, including inverse hour rulers.');
