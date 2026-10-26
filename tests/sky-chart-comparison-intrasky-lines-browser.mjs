import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';

const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const v=((longitude%360)+360)%360,i=Math.floor(v/30),within=v%30;return{name,longitude:v,sign:signs[i],degree:Math.floor(within),minute:Math.floor((within%1)*60)}};
const makeSky=(name,raw,asc)=>({
  name,houseSystem:'equal-house',houseCusps:Array.from({length:12},(_,i)=>(asc+i*30)%360),
  calcProfile:{houseCusps:Array.from({length:12},(_,i)=>(asc+i*30)%360),houseSystem:'equal-house',dateTime:'2026-10-25T10:00',instant:'2026-10-25T16:00:00.000Z',timeZone:'America/Denver',latitude:40.76,longitude:-111.89},
  placements:Object.fromEntries(Object.entries(raw).map(([name,long])=>[name,placement(name,long)]))
});
const a=makeSky('Sky A',{Sun:195,Moon:118,Mercury:206,Venus:169,Mars:167,Jupiter:307,Saturn:235,Uranus:255,Neptune:271,Pluto:213,Ascendant:168,Midheaven:76},168);
const b=makeSky('Sky B',{Sun:34.18,Moon:94.27,Mercury:43.62,Venus:8.4,Mars:357.55,Jupiter:64.32,Saturn:130.1,Uranus:220,Neptune:255.77,Pluto:192.22,Chiron:31.6,Ascendant:10,Midheaven:280},10);
const ids=['conjunction','semi-sextile','octile','sextile','quintile','square','trine','tri-octile','bi-quintile','quincunx','opposition'];
const browser=await chromium.launch({headless:true});
try{
  for(const width of [390,1280]){
    const page=await browser.newPage({viewport:{width,height:950}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
    await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
    await page.route('https://nominatim.openstreetmap.org/**',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
    await page.addInitScript(({a,b,ids})=>{
      localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
      localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
      localStorage.setItem('relphiSkyChartLastModeV1','comparison');
      localStorage.setItem('relphiSkyAspectMatrixV1',JSON.stringify({'A-A':[],'B-B':ids,'A-B':[]}));
    },{a,b,ids});
    await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
    await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
    await page.waitForSelector('#skyFoundationRelationshipList>.sky-intrasky-b-generated',{timeout:30000});
    const debug=await page.evaluate(()=>({bPresent:document.documentElement.dataset.skyBPresent,svg:document.querySelector('#skyFoundationWheelMount>svg.sky-foundation-wheel')?.outerHTML.slice(0,420),scriptLoaded:!!window.__relphiComparisonIntraskyLinesV1,rows:[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-intrasky-b-generated')].slice(0,2).map(x=>({index:x.dataset.relationIndex,left:x.dataset.leftLongitude,right:x.dataset.rightLongitude})),lines:document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"]>line').length}));
    console.log('B_B_DEBUG',width,JSON.stringify(debug));
    await page.waitForFunction(()=>document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"]>line.sky-comparison-intrasky-aspect[data-relationship-mode="B-B"]').length>0,null,{timeout:10000});
    const audit=await page.evaluate(()=>{
      const visible=n=>{const s=getComputedStyle(n);return !n.hidden&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0};
      const rows=[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-intrasky-b-generated')].filter(visible);
      const lines=[...document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"]>line.sky-comparison-intrasky-aspect')].filter(visible);
      const bLines=lines.filter(x=>x.dataset.relationshipMode==='B-B');
      const aLines=lines.filter(x=>x.dataset.relationshipMode==='A-A');
      const keys=arr=>new Set(arr.map(x=>x.dataset.relationIndex));
      const rowIds=keys(rows),lineIds=keys(bLines);
      return {rowCount:rows.length,bLines:bLines.length,aLines:aLines.length,
        missing:[...rowIds].filter(x=>!lineIds.has(x)),
        extra:[...lineIds].filter(x=>!rowIds.has(x)),
        badCoordinates:bLines.filter(x=>!['x1','y1','x2','y2'].every(k=>Number.isFinite(Number(x.getAttribute(k))))).length,
        invalidStroke:bLines.filter(x=>getComputedStyle(x).stroke==='none'||getComputedStyle(x).stroke==='transparent').length,
        bPresent:document.documentElement.dataset.skyBPresent,
        aspectClasses:bLines.slice(0,3).map(x=>x.getAttribute('class'))};
    });
    console.log('B_B_COMPARISON_ASPECT_AUDIT',width,JSON.stringify(audit));
    assert.ok(audit.rowCount>0,'Fixture must show B↔B relationship results.');
    assert.equal(audit.bLines,audit.rowCount,'Each visible B↔B relationship must have a visible wheel line.');
    assert.deepEqual(audit.missing,[],'All B↔B rows need counterpart lines.');
    assert.deepEqual(audit.extra,[],'No orphan B↔B lines may appear.');
    assert.equal(audit.aLines,0,'A↔A lines must follow the disabled A↔A scope.');
    assert.equal(audit.badCoordinates,0,'Every endpoint must have valid SVG coordinates.');
    assert.equal(audit.invalidStroke,0,'B↔B lines must have a visible aspect stroke.');
    assert.deepEqual(errors.filter(e=>/TypeError|ReferenceError|SyntaxError/.test(e)),[],'No page errors.');
    await page.close();
  }
}finally{await browser.close()}
