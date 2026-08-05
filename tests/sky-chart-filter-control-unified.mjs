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
const skyB=sample('Current sky',29.27,{dateTime:'2026-08-02T02:07',instant:'2026-08-02T08:07:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891});

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:2});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b));sessionStorage.removeItem('relphiSkyWhereWhenViewV1')},{a:skyA,b:skyB});
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
await page.waitForSelector('[data-aspect-filter="combined"]',{timeout:20000});
await page.waitForSelector('[data-placement-filter="combined"]',{timeout:20000});
await page.waitForSelector('[data-house-filter="combined"]',{timeout:20000});

const result=await page.evaluate(()=>{
  const selectors={
    orb:'input[data-filter="orb"]',
    aspects:'.sky-chart-aspect-filter-value',
    placements:'.sky-chart-placement-summary-choices',
    houses:'.sky-chart-house-summary-choices',
    houseSystem:'[data-house-system-filter]'
  };
  const labelSelectors={
    orb:'input[data-filter="orb"]',
    aspects:'.sky-chart-aspect-filter-label',
    placements:'.sky-chart-placement-filter-label',
    houses:'.sky-chart-house-filter-label',
    houseSystem:'[data-house-system-filter]'
  };
  const fields={};
  const labels={};
  for(const [name,selector] of Object.entries(selectors)){
    const node=document.querySelector(selector);
    const style=getComputedStyle(node);
    const rect=node.getBoundingClientRect();
    fields[name]={
      height:rect.height,
      top:rect.top,
      bottom:rect.bottom,
      backgroundColor:style.backgroundColor,
      borderTopColor:style.borderTopColor,
      borderTopStyle:style.borderTopStyle,
      borderTopWidth:style.borderTopWidth,
      borderTopLeftRadius:style.borderTopLeftRadius,
      borderTopRightRadius:style.borderTopRightRadius,
      borderBottomLeftRadius:style.borderBottomLeftRadius,
      borderBottomRightRadius:style.borderBottomRightRadius,
      color:style.color,
      fontFamily:style.fontFamily,
      fontSize:style.fontSize,
      fontWeight:style.fontWeight,
      lineHeight:style.lineHeight
    };
  }
  for(const [name,selector] of Object.entries(labelSelectors)){
    const source=document.querySelector(selector);
    const node=(name==='orb'||name==='houseSystem')?source.closest('label'):source;
    const style=getComputedStyle(node);
    labels[name]={
      color:style.color,
      fontFamily:style.fontFamily,
      fontSize:style.fontSize,
      fontWeight:style.fontWeight,
      lineHeight:style.lineHeight
    };
  }
  const toggles={};
  for(const [name,selector] of Object.entries({
    aspects:'.sky-chart-aspect-filter-toggle',
    placements:'.sky-chart-placement-filter-toggle',
    houses:'.sky-chart-house-filter-toggle'
  })){
    const node=document.querySelector(selector);
    const style=getComputedStyle(node);
    const rect=node.getBoundingClientRect();
    toggles[name]={height:rect.height,borderTopWidth:style.borderTopWidth,backgroundColor:style.backgroundColor,backgroundImage:style.backgroundImage};
  }
  return{fields,labels,toggles};
});

const fieldNames=Object.keys(result.fields);
const reference=result.fields.orb;
for(const name of fieldNames){
  const field=result.fields[name];
  assert.ok(Math.abs(field.height-reference.height)<=0.5,`${name} height ${field.height} does not match Orb ${reference.height}`);
  assert.ok(Math.abs(field.top-reference.top)<=1,`${name} top ${field.top} does not match Orb ${reference.top}`);
  assert.ok(Math.abs(field.bottom-reference.bottom)<=1,`${name} bottom ${field.bottom} does not match Orb ${reference.bottom}`);
  for(const property of ['backgroundColor','borderTopColor','borderTopStyle','borderTopWidth','borderTopLeftRadius','borderTopRightRadius','borderBottomLeftRadius','borderBottomRightRadius','color','fontFamily','fontSize','fontWeight','lineHeight']){
    assert.equal(field[property],reference[property],`${name} ${property} must match Orb`);
  }
}

const labelReference=result.labels.orb;
for(const [name,label] of Object.entries(result.labels)){
  for(const property of ['color','fontFamily','fontSize','fontWeight','lineHeight']){
    assert.equal(label[property],labelReference[property],`${name} label ${property} must match Orb`);
  }
}
for(const [name,toggle] of Object.entries(result.toggles)){
  assert.ok(Math.abs(toggle.height-reference.height)<=0.5,`${name} toggle height must match field height`);
  assert.equal(toggle.borderTopWidth,'0px',`${name} chevron must be overlaid inside one continuous box`);
  assert.equal(toggle.backgroundColor,'rgba(0, 0, 0, 0)',`${name} chevron must not create a second box`);
  assert.notEqual(toggle.backgroundImage,'none',`${name} must use the shared chevron artwork`);
}
assert.deepEqual(errors,[]);
await page.locator('#skyFoundationRelationships .sky-chart-filter-bar').screenshot({path:'sky-chart-filter-controls-unified.png'});
await browser.close();
console.log('All relationship filter labels, fonts, boxes, heights, radii, and chevrons match Orb and House System.');
