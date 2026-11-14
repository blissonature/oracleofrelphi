import {chromium,devices} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function placement(name,longitude){
  const sign=Math.floor(longitude/30),within=longitude-sign*30;
  return {name,longitude,sign:SIGNS[sign],degree:Math.floor(within),minute:Math.floor((within-Math.floor(within))*60),second:0};
}
function fixture(name,moonLongitude,asc){
  const cusps=Array.from({length:12},(_,index)=>(asc+index*30)%360);
  const bodies={Sun:221.73,Moon:moonLongitude,Mercury:215.05,Venus:202.85,Mars:144.92,Jupiter:145.70,Saturn:8.55,Ascendant:asc,Descendant:(asc+180)%360};
  return {
    name,houseSystem:'equal-house',houseCusps:cusps,
    calcProfile:{houseSystem:'equal-house',houseCusps:cusps,dateTime:'2026-11-13T20:01',instant:'2026-11-14T03:01:00Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891},
    placements:Object.fromEntries(Object.entries(bodies).map(([key,value])=>[key,placement(key,value)]))
  };
}
const A=fixture('Sky A',118.42,168.38);
const B=fixture('Sky B',285,100);
const browser=await chromium.launch({headless:true});
for(const mode of ['desktop','mobile']){
  const config=mode==='mobile'?devices['iPhone 13']:{viewport:{width:1440,height:900}};
  const context=await browser.newContext(config);
  const page=await context.newPage();
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    sessionStorage.removeItem('relphiSkyVocabViewV1');
  },{a:A,b:B});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
  try{
    await page.waitForFunction(()=>!!window.RelphiSkyVocab&&!!window.RelphiSkyFoundationInteractions&&!!document.querySelector('#skyFoundationB .sky-foundation-row[data-placement="moon"]'),null,{timeout:18000});
  }catch(error){
    console.log('Sky Chart selection readiness diagnostic',mode,JSON.stringify(await page.evaluate(()=>({
      vocab:!!window.RelphiSkyVocab,interaction:!!window.RelphiSkyFoundationInteractions,
      busy:document.querySelector('#skyFoundationRoot')?.getAttribute('aria-busy'),
      skyA:!!document.querySelector('#skyFoundationA'),skyB:!!document.querySelector('#skyFoundationB'),
      aRows:[...document.querySelectorAll('#skyFoundationA .sky-foundation-row')].slice(0,12).map(x=>({name:x.querySelector('.sky-foundation-row-name')?.textContent,id:x.dataset.placement})),
      bRows:[...document.querySelectorAll('#skyFoundationB .sky-foundation-row')].slice(0,12).map(x=>({name:x.querySelector('.sky-foundation-row-name')?.textContent,id:x.dataset.placement})),
      children:document.querySelector('#skyFoundationB .sky-foundation-body')?.childElementCount,
      scripts:[...document.scripts].filter(x=>x.src.includes('vocab')||x.src.includes('interaction')).map(x=>x.src)
    }))));
    console.log('Browser page errors:',errors);
    throw error;
  }
  const tileB=page.locator('#skyFoundationB [data-sky-placement-referents="B"]');
  const tileA=page.locator('#skyFoundationA [data-sky-placement-referents="A"]');
  assert.equal(await tileB.count(),0,mode+' should not display referents before selection');
  const rowB=page.locator('#skyFoundationB .sky-foundation-row[data-placement="moon"]').first();
  await rowB.scrollIntoViewIfNeeded();
  if(mode==='mobile')await rowB.tap();else await rowB.click();
  await tileB.waitFor({state:'visible',timeout:10000});
  assert.match(await tileB.textContent(),/Moon in Capricorn/);
  assert.match(await tileB.textContent(),/feelings and emotional needs/);
  assert.match(await tileB.textContent(),/structure, responsibility, endurance, mastery, and worldly form/);
  assert.match(await tileB.textContent(),/Seventh House/);
  assert.match(await tileB.textContent(),/partnership, contracts, one-to-one relationship/);
  assert.equal(await tileA.count(),0,mode+' must not show referents in another sky');
  assert.equal(await tileB.locator('.sky-placement-referents-item').count(),3);
  await tileB.locator('.sky-placement-referents-definition').first().click();
  assert.equal(await tileB.count(),1,'Interacting with referent text must not clear selection');
  const rowBNext=page.locator('#skyFoundationB .sky-foundation-row[data-placement="moon"]');
  assert.equal(await tileB.evaluate(el=>el.previousElementSibling?.dataset?.placement),'moon','tile must follow selected row');

  await page.screenshot({path:'sky-placement-referents-'+mode+'.png',fullPage:mode==='desktop'});
  const vocab=page.locator('#skyFoundationB [data-sky-vocab-view-button="vocab"]');
  const placements=page.locator('#skyFoundationB [data-sky-vocab-view-button="placements"]');
  await vocab.click();
  const originalPanel=page.locator('#skyFoundationB [data-sky-vocab-panel="B"]');
  await originalPanel.waitFor({state:'visible'});
  assert.ok((await originalPanel.locator('.sky-vocab-paragraph').textContent()).length>10,'Full Vocab view remains usable');
  await placements.click();
  await tileB.waitFor({state:'visible'});
  await page.evaluate(()=>window.RelphiSkyVocab.render());
  await tileB.waitFor({state:'visible'});
  assert.equal(await page.locator('#skyFoundationB [data-sky-placement-referents]').count(),1,'no duplicate renderers');

  const rowA=page.locator('#skyFoundationA .sky-foundation-row[data-placement="moon"]').first();
  await rowA.scrollIntoViewIfNeeded();
  if(mode==='mobile')await rowA.tap();else await rowA.click();
  await tileA.waitFor({state:'visible',timeout:10000});
  assert.match(await tileA.textContent(),/Moon in Cancer/);
  assert.match(await tileA.textContent(),/care, protection, memory, belonging, and attachment/);
  assert.equal(await tileB.count(),0,'Changing selected sky removes the previous inline tile');
  if(mode==='mobile')await rowA.tap();else await rowA.click();
  await page.waitForFunction(()=>!document.querySelector('#skyFoundationA [data-sky-placement-referents]'));
  assert.equal(await tileA.count(),0,'Toggling selection off closes referents');
  assert.deepEqual(errors,[],mode+' runtime errors');
  await context.close();
}
await browser.close();
console.log('Selected placement referents verified in Chromium on desktop and mobile; Vocab preserved, changes and collapse pass.');
