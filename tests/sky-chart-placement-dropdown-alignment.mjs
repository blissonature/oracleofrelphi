import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function placement(name,longitude){
  const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);
  return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0};
}
function sky(name,offset){
  const asc=(168+offset)%360;
  const raw={Sun:195,Moon:118.4,Mercury:206.1,Venus:169.8,Mars:167.8,Jupiter:307.1,Saturn:235.5,Uranus:254.8,Neptune:271,Pluto:213.8,Ascendant:168,Descendant:348,Midheaven:76,IC:256,Chiron:74.4,'North Node':40.3,'South Node':220.3,Lilith:44.2,'Part of Fortune':244.9,Vertex:330.3};
  const profile={dateTime:'2026-09-19T20:00',instant:'2026-09-20T02:00:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.8910,houseSystem:'whole-sign'};
  return{name,houseSystem:'whole-sign',calcProfile:profile,houseCusps:Array.from({length:12},(_,i)=>(asc+i*30)%360),placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))};
}
function centers(nodes){return nodes.map(node=>{const r=node.getBoundingClientRect();return r.left+r.width/2})}

const browser=await chromium.launch({headless:true});
try{
  for(const mode of ['comparison','single']){
    const context=await browser.newContext({viewport:{width:1280,height:900}});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
    await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
    await page.addInitScript(({a,b,mode})=>{
      localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
      if(b)localStorage.setItem('relphiSkyChartB',JSON.stringify(b)); else localStorage.removeItem('relphiSkyChartB');
      localStorage.setItem('relphiSkyChartLastModeV1',mode);
      sessionStorage.removeItem('relphiSkyWhereWhenViewV1');
    },{a:sky('Sky A',0),b:mode==='comparison'?sky('Sky B',23):null,mode});

    await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle',timeout:30000});
    await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
    await page.waitForSelector('[data-placement-filter="combined"]',{timeout:20000});
    await page.locator('[data-placement-filter-toggle]').click();
    await page.waitForSelector('#skyChartPlacementPopover.is-portaled:not([hidden])',{timeout:10000});

    const result=await page.evaluate(mode=>{
      const list=document.querySelector('[data-placement-list="combined"]');
      const header=list?.querySelector(':scope>.sky-chart-placement-list-header');
      const sample=list?.querySelector(':scope>.sky-chart-placement-list-item-group')||list?.querySelector(':scope>.sky-chart-placement-list-item-placement');
      const kinds=mode==='comparison'?['all','a','b']:['all','a'];
      const headerNodes=kinds.map(kind=>header?.querySelector(`.sky-chart-placement-list-header-choice-${kind}`));
      const inputNodes=kinds.map(kind=>sample?.querySelector(`button[data-placement-choice="${kind}"]`));
      const center=node=>{const r=node?.getBoundingClientRect();return r?r.left+r.width/2:NaN};
      const headerChoices=header?.querySelector('.sky-chart-placement-list-header-choices');
      const rowChoices=sample?.querySelector('.sky-chart-placement-list-choices');
      return{
        headerCount:header?.querySelectorAll('.sky-chart-placement-list-header-choice').length||0,
        headerKinds:headerNodes.map(node=>node?.textContent?.trim()||''),
        headerCenters:headerNodes.map(center),
        inputCenters:inputNodes.map(center),
        aVisible:!!header?.querySelector('.sky-chart-placement-list-header-choice-a')&&getComputedStyle(header.querySelector('.sky-chart-placement-list-header-choice-a')).display!=='none',
        bPresent:!!header?.querySelector('.sky-chart-placement-list-header-choice-b'),
        headerGrid:getComputedStyle(header).gridTemplateColumns,
        rowGrid:getComputedStyle(sample).gridTemplateColumns,
        headerChoicesDisplay:getComputedStyle(headerChoices).display,
        headerChoicesGrid:getComputedStyle(headerChoices).gridTemplateColumns,
        rowChoicesDisplay:getComputedStyle(rowChoices).display,
        rowChoicesGrid:getComputedStyle(rowChoices).gridTemplateColumns,
        rowChoiceWidths:[...sample.querySelectorAll('.sky-chart-placement-choice')].map(node=>node.getBoundingClientRect().width)
      };
    },mode);

    const expectedKinds=mode==='comparison'?['All','A','B']:['All','A'];
    console.log(mode,JSON.stringify(result));
    assert.equal(result.headerCount,expectedKinds.length,`${mode}: header should contain exactly the active scope columns`);
    assert.deepEqual(result.headerKinds,expectedKinds,`${mode}: Placement header labels should be canonical`);
    result.headerCenters.forEach((value,index)=>{
      assert.ok(Number.isFinite(value)&&Number.isFinite(result.inputCenters[index]),`${mode}: scope center must be measurable`);
      assert.ok(Math.abs(value-result.inputCenters[index])<=1,`${mode}: ${expectedKinds[index]} header must align over its logic-control column`);
    });
    assert.equal(result.aVisible,true,`${mode}: A header must stay visible`);
    assert.equal(result.bPresent,mode==='comparison',`${mode}: B header presence must follow Sky B`);
    assert.deepEqual(errors,[],`${mode}: page should not raise errors`);
    await context.close();
  }
  console.log('Placement dropdown header and logic-control columns align in comparison and single-sky modes.');
}finally{
  await browser.close();
}
