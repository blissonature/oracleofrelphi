import { chromium } from 'playwright';
import path from 'node:path';

const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);return{name,longitude:value,sign:signs[sign],degree,minute,second:0}};
function sample(name,offset,profile){
  const asc=(168.38+offset)%360,mc=(76.28+offset)%360,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,Chiron:74.48,'North Node':40.3,'South Node':220.3,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
  return{name,houseCusps:cusps,calcProfile:{...profile,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))};
}
const a=sample('My birth chart',0,{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Malden, Massachusetts, United States',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662});
const b=sample('Planetary Hours 2026-08-02 02:07',29.27,{dateTime:'2026-08-02T02:07',instant:'2026-08-02T08:07:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891});

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1660,height:1300}});
page.on('pageerror',error=>console.log('PAGEERROR',error.message));
page.on('console',message=>console.log(`BROWSER ${message.type().toUpperCase()}`,message.text()));
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b));sessionStorage.removeItem('relphiSkyWhereWhenViewV1')},{a,b});
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
await page.waitForSelector('.sky-foundation-relationship-row',{timeout:20000});
await page.waitForSelector('#skySelectedRelationship:not([hidden])',{timeout:20000});
await page.waitForFunction(()=>document.querySelectorAll('.sky-ph-heptagram[data-canonical-heptagram-v1="true"]').length===2,null,{timeout:20000});
await page.waitForTimeout(700);
const state=await page.evaluate(()=>({
  audit:document.documentElement.dataset.skyGlyphAudit,
  count:document.documentElement.dataset.skyGlyphAuditCount,
  issues:window.RelphiSkyGlyphAudit?.run?.(),
  component:{whitespaceAware:window.RelphiGlyphComponent?.skyWhitespaceAware,source:window.RelphiGlyphComponent?.canonicalSource},
  totals:{bubbles:document.querySelectorAll('.relphi-glyph-bubble').length,framed:document.querySelectorAll('.relphi-glyph-framed').length,ledgers:document.querySelectorAll('.sky-foundation-ledger .sky-foundation-row>svg').length,relations:document.querySelectorAll('.sky-foundation-relationship-row').length,progressive:document.querySelectorAll('[data-progressive-glyph-id]').length,heptagrams:document.querySelectorAll('.sky-ph-heptagram[data-canonical-heptagram-v1="true"]').length}
}));
console.log('AUDIT_STATE',JSON.stringify(state,null,2));
await page.screenshot({path:'sky-chart-glyph-audit-debug.png',fullPage:true});
await browser.close();
if(state.issues?.length)process.exitCode=1;
