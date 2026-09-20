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
const skyA=sample('A',0,{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Malden, Massachusetts, United States',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662});
const skyB=sample('B',29.27,{dateTime:'2026-08-02T02:07',instant:'2026-08-02T08:07:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891});

const expected=[
  ['conjunction','0°'],['semi-sextile','30°'],['octile','45°'],['sextile','60°'],['quintile','72°'],['square','90°'],
  ['trine','120°'],['tri-octile','135°'],['bi-quintile','144°'],['quincunx','150°'],['opposition','180°']
];

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b));},{a:skyA,b:skyB});
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
  await page.waitForSelector('[data-aspect-filter="combined"]',{timeout:20000});
  await page.locator('[data-aspect-filter="combined"] [data-aspect-filter-toggle]').click();
  await page.waitForSelector('#skyChartAspectPopover:not([hidden]) [data-aspect-list="matrix"]',{timeout:10000});
  await page.waitForFunction(()=>document.querySelectorAll('#skyChartAspectPopover .sky-filter-symbol-aspect[data-canonical-glyph]').length===11,null,{timeout:10000});

  const audit=await page.locator('#skyChartAspectPopover .sky-chart-aspect-list-item[data-aspect-list-item]:not([data-aspect-list-item="all"])').evaluateAll(rows=>rows.map(row=>{
    const label=row.querySelector('.sky-chart-aspect-list-label');
    const glyph=label?.querySelector('.sky-filter-symbol-aspect');
    const degree=label?.querySelector('.sky-chart-aspect-degree');
    const value=degree?.querySelector('.sky-chart-aspect-degree-value');
    const name=label?.querySelector('.sky-chart-aspect-name');
    const vr=value?.getBoundingClientRect();
    return{
      id:row.dataset.aspectListItem,
      degree:degree?.textContent||'',
      name:name?.textContent||'',
      valueRight:vr?.right||0,
      children:[...(label?.children||[])].map(node=>node.className),
      glyph:String(glyph?.dataset.canonicalGlyph||'')
    };
  }));

  assert.deepEqual(audit.map(item=>[item.id,item.degree]),expected);
  assert.ok(audit.every(item=>item.glyph===item.id),'every row must keep its canonical aspect glyph');
  assert.ok(audit.every(item=>String(item.children[0]).includes('sky-filter-symbol-aspect')&&item.children[1]==='sky-chart-aspect-degree'&&item.children[2]==='sky-chart-aspect-name'),
    'row order must be glyph, degree, name');
  const rights=audit.map(item=>item.valueRight);
  assert.ok(Math.max(...rights)-Math.min(...rights)<=0.5,`ones digits must align; numeric right edges were ${JSON.stringify(rights)}`);
  assert.deepEqual(errors,[]);
  console.log('Aspect filter shows canonical glyph, aligned exact degree, then aspect name.');
}finally{
  await browser.close();
}
