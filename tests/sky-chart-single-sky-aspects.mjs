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
const skyA=sample('My birth chart',0,{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Malden, Massachusetts, United States',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662});
const skyB=sample('Planetary Hours 2026-08-02 02:07',29.27,{dateTime:'2026-08-02T02:07',instant:'2026-08-02T08:07:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891});

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:2});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b));sessionStorage.removeItem('relphiSkyWhereWhenViewV1')},{a:skyA,b:skyB});
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
await page.waitForSelector('html[data-sky-placement-multiselect="ready"]',{timeout:20000});
await page.waitForSelector('[data-placement-filter="combined"]',{timeout:20000});

const combined=page.locator('[data-placement-filter="combined"]');
const summary=combined.locator('.sky-chart-placement-summary-choices');
const inlineA=summary.locator('[data-placement-choice="a"]');
const inlineB=summary.locator('[data-placement-choice="b"]');

const headerPresentation=await page.evaluate(()=>{
  const bar=document.querySelector('#skyFoundationRelationships .sky-chart-filter-bar');
  const head=document.querySelector('[data-placement-filter="combined"] .sky-chart-placement-filter-head');
  const label=document.querySelector('[data-placement-filter="combined"] .sky-chart-placement-filter-label');
  const choices=document.querySelector('[data-placement-filter="combined"] .sky-chart-placement-summary-choices');
  return{
    barBackground:getComputedStyle(bar).backgroundColor,
    headBackground:getComputedStyle(head).backgroundColor,
    labelBackground:getComputedStyle(label).backgroundColor,
    choicesBackground:getComputedStyle(choices).backgroundColor,
    labelTop:label.getBoundingClientRect().top,
    choicesTop:choices.getBoundingClientRect().top
  };
});
assert.ok(['rgba(0, 0, 0, 0)','transparent'].includes(headerPresentation.headBackground),'Placements must not put a white field behind its heading.');
assert.ok(['rgba(0, 0, 0, 0)','transparent'].includes(headerPresentation.labelBackground),'The Placements label must inherit the parchment filter-bar background.');
assert.equal(headerPresentation.choicesBackground,'rgb(255, 255, 255)','Only the checkbox control row should be white.');
assert.ok(headerPresentation.labelTop<headerPresentation.choicesTop,'The parchment heading must sit above the white control row like the neighboring filters.');

const crossLines=()=>page.locator('[data-layer="aspects"] > .sky-foundation-aspect:not(.sky-foundation-single-sky-aspect):not(.sky-foundation-single-sky-cross-hidden)');
const selfLines=slot=>page.locator(`.sky-foundation-single-sky-aspect[data-single-sky="${slot}"]`);
const selfRows=slot=>page.locator(`.sky-foundation-single-sky-row[data-single-sky="${slot}"]`);

await page.waitForFunction(()=>document.documentElement.dataset.skyRelationshipMode==='A-B',null,{timeout:10000});
assert.ok(await crossLines().count()>0,'Both active skies must show comparison aspects.');

await inlineB.uncheck();
await page.waitForFunction(()=>document.documentElement.dataset.skyRelationshipMode==='A-A',null,{timeout:10000});
await page.waitForTimeout(100);
assert.ok(await selfLines('A').count()>0,'Hiding Sky B must reveal internal Sky A aspect lines.');
assert.ok(await selfRows('A').count()>0,'Hiding Sky B must reveal internal Sky A relationship rows.');
assert.equal(await crossLines().count(),0,'Cross-sky aspect lines must be absent while viewing Sky A alone.');
assert.equal(await selfLines('A').evaluateAll(lines=>lines.every(line=>line.dataset.leftSky==='A'&&line.dataset.rightSky==='A')),true);
assert.equal(await selfRows('A').evaluateAll(rows=>rows.every(row=>row.dataset.leftSky==='A'&&row.dataset.rightSky==='A')),true);
assert.notEqual((await page.locator('#skyFoundationRelationshipCount').textContent())?.trim().split('/')[0],'0');
await page.screenshot({path:'sky-chart-single-sky-a-aspects-desktop.png',fullPage:true});

await inlineB.check();
await page.waitForFunction(()=>document.documentElement.dataset.skyRelationshipMode==='A-B',null,{timeout:10000});
await inlineA.uncheck();
await page.waitForFunction(()=>document.documentElement.dataset.skyRelationshipMode==='B-B',null,{timeout:10000});
await page.waitForTimeout(100);
assert.ok(await selfLines('B').count()>0,'Hiding Sky A must reveal internal Sky B aspect lines.');
assert.ok(await selfRows('B').count()>0,'Hiding Sky A must reveal internal Sky B relationship rows.');
assert.equal(await crossLines().count(),0,'Cross-sky aspect lines must be absent while viewing Sky B alone.');
assert.equal(await selfLines('B').evaluateAll(lines=>lines.every(line=>line.dataset.leftSky==='B'&&line.dataset.rightSky==='B')),true);
assert.equal(await selfRows('B').evaluateAll(rows=>rows.every(row=>row.dataset.leftSky==='B'&&row.dataset.rightSky==='B')),true);

await inlineA.check();
await page.waitForFunction(()=>document.documentElement.dataset.skyRelationshipMode==='A-B',null,{timeout:10000});
await page.waitForTimeout(100);
assert.equal(await page.locator('.sky-foundation-single-sky-aspect').count(),0,'Re-enabling both skies must remove temporary internal-aspect lines.');
assert.equal(await page.locator('.sky-foundation-single-sky-row').count(),0,'Re-enabling both skies must restore the comparison relationship list.');
assert.ok(await crossLines().count()>0,'Re-enabling both skies must restore comparison aspects.');

await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(250);
await inlineB.uncheck();
await page.waitForFunction(()=>document.documentElement.dataset.skyRelationshipMode==='A-A',null,{timeout:10000});
await page.screenshot({path:'sky-chart-single-sky-a-aspects-mobile.png',fullPage:true});
assert.ok(await selfLines('A').count()>0);
assert.ok(await selfRows('A').count()>0);
assert.deepEqual(errors,[]);
await browser.close();
console.log('Sky Chart parchment Placements heading and A-A/B-B relationship modes passed.');
