import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const instant='2026-09-10T18:00:00.000Z';
const profile={instant,dateTime:instant,timeZone:'America/Denver',latitude:40.7608,longitude:-111.8910,houseSystem:'whole-sign'};
const sampleA={
  name:'Natal test',houseSystem:'whole-sign',calcProfile:profile,
  houseCusps:Array.from({length:12},(_,i)=>(165+i*30)%360),
  placements:{
    Sun:{name:'Sun',glyphId:'sun',longitude:195},Moon:{name:'Moon',glyphId:'moon',longitude:118.4},Mercury:{name:'Mercury',glyphId:'mercury',longitude:206.1},Venus:{name:'Venus',glyphId:'venus',longitude:169.8},Mars:{name:'Mars',glyphId:'mars',longitude:167.8},Jupiter:{name:'Jupiter',glyphId:'jupiter',longitude:307.1},Saturn:{name:'Saturn',glyphId:'saturn',longitude:235.5},Uranus:{name:'Uranus',glyphId:'uranus',longitude:254.8},Neptune:{name:'Neptune',glyphId:'neptune',longitude:271},Pluto:{name:'Pluto',glyphId:'pluto',longitude:213.8},Ascendant:{name:'Ascendant',glyphId:'asc',longitude:165}
  }
};
const sampleB={
  name:'Transit test',houseSystem:'whole-sign',calcProfile:profile,
  houseCusps:Array.from({length:12},(_,i)=>(180+i*30)%360),
  placements:{
    Sun:{name:'Sun',glyphId:'sun',longitude:170},Moon:{name:'Moon',glyphId:'moon',longitude:260},Mercury:{name:'Mercury',glyphId:'mercury',longitude:180},Venus:{name:'Venus',glyphId:'venus',longitude:210.3},Mars:{name:'Mars',glyphId:'mars',longitude:90},Jupiter:{name:'Jupiter',glyphId:'jupiter',longitude:130},Saturn:{name:'Saturn',glyphId:'saturn',longitude:20},Uranus:{name:'Uranus',glyphId:'uranus',longitude:60},Neptune:{name:'Neptune',glyphId:'neptune',longitude:5},Pluto:{name:'Pluto',glyphId:'pluto',longitude:305},Chiron:{name:'Chiron',glyphId:'chiron',longitude:30.3,source:'swiss-ephemeris-chiron'},Ascendant:{name:'Ascendant',glyphId:'asc',longitude:180}
  }
};

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1280,height:1000}});
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
  },{a:sampleA,b:sampleB});

  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle',timeout:30000});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
  await page.waitForFunction(()=>document.documentElement.dataset.skyBPresent==='true',null,{timeout:10000});
  await page.waitForFunction(()=>{
    return [...document.querySelectorAll('#skyFoundationRelationshipList .sky-foundation-relationship-row')].some(row=>{
      const pair=new Set([row.dataset.leftPlacement,row.dataset.rightPlacement]);
      return row.dataset.relationshipMode==='B-B'&&row.dataset.aspect==='opposition'&&pair.has('venus')&&pair.has('chiron');
    });
  },null,{timeout:20000});

  // Use the data attributes to avoid depending on visible wording or glyph layout.
  const handle=await page.evaluateHandle(()=>[...document.querySelectorAll('#skyFoundationRelationshipList .sky-foundation-relationship-row')].find(row=>{
    const pair=new Set([row.dataset.leftPlacement,row.dataset.rightPlacement]);
    return row.dataset.relationshipMode==='B-B'&&row.dataset.aspect==='opposition'&&pair.has('venus')&&pair.has('chiron');
  }));
  const element=handle.asElement();
  assert.ok(element,'Venus–Chiron B-B opposition row should exist');
  await element.click();
  await page.waitForFunction(()=>{
    const row=[...document.querySelectorAll('#skyFoundationRelationshipList .sky-foundation-relationship-row')].find(node=>{
      const pair=new Set([node.dataset.leftPlacement,node.dataset.rightPlacement]);
      return node.dataset.relationshipMode==='B-B'&&node.dataset.aspect==='opposition'&&pair.has('venus')&&pair.has('chiron');
    });
    const meta=row?.querySelector('.inline-rel-transit-window');
    return row?.classList.contains('is-inline-expanded')&&meta?.dataset.transitKind==='dynamic';
  },null,{timeout:45000});

  const state=await page.evaluate(()=>{
    const row=[...document.querySelectorAll('#skyFoundationRelationshipList .sky-foundation-relationship-row')].find(node=>{
      const pair=new Set([node.dataset.leftPlacement,node.dataset.rightPlacement]);
      return node.dataset.relationshipMode==='B-B'&&node.dataset.aspect==='opposition'&&pair.has('venus')&&pair.has('chiron');
    });
    const meta=row?.querySelector('.inline-rel-transit-window');
    return{kind:meta?.dataset.transitKind||'',text:meta?.textContent||'',chironReady:!!window.RelphiChironEphemeris?.isReady?.()};
  });
  assert.equal(state.kind,'dynamic',`Venus–Chiron tile should show dynamic timing: ${JSON.stringify(state)}`);
  for(const label of ['Start','Exact','End','Duration','Passes'])assert.ok(state.text.includes(label),`timing tile should include ${label}: ${state.text}`);
  assert.ok(!state.text.includes('unavailable'),'timing tile should not say unavailable');
  assert.ok(state.chironReady,'Swiss Chiron ephemeris should be ready');

  const sort=page.locator('select[data-relationship-sort]');
  const timingSorts=[
    {mode:'duration-shortest',field:'transitDurationDays',direction:1,label:'Shortest Duration'},
    {mode:'duration-longest',field:'transitDurationDays',direction:-1,label:'Longest Duration'},
    {mode:'began-most-recently',field:'transitStartedDaysAgo',direction:1,label:'Began Most Recently'},
    {mode:'ends-soonest',field:'transitEndsInDays',direction:1,label:'Ends Soonest'},
    {mode:'ends-last',field:'transitEndsInDays',direction:-1,label:'Ends Last'}
  ];

  for(const spec of timingSorts){
    await sort.selectOption(spec.mode);
    await page.waitForFunction(mode=>document.documentElement.dataset.skyRelationshipSort===mode,spec.mode,{timeout:45000});
    await page.waitForFunction(()=>document.querySelector('select[data-relationship-sort]')?.getAttribute('aria-busy')==='false',null,{timeout:45000});
    await page.waitForTimeout(300);
    const values=await page.evaluate(field=>[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]')]
      .filter(row=>!row.hidden&&getComputedStyle(row).display!=='none')
      .map(row=>({id:row.dataset.relationIndex,value:Number(row.dataset[field]),scope:row.dataset.relationshipMode,left:row.dataset.leftPlacement,right:row.dataset.rightPlacement,aspect:row.dataset.aspect}))
      .filter(item=>Number.isFinite(item.value)),spec.field);
    assert.ok(values.length>1,`${spec.label} should time multiple visible rows: ${JSON.stringify(values)}`);
    for(let i=1;i<values.length;i+=1){
      const previous=values[i-1].value,current=values[i].value;
      const ordered=spec.direction===1?previous<=current+1e-9:previous+1e-9>=current;
      assert.ok(ordered,`${spec.label} is out of global order at ${i-1}/${i}: ${JSON.stringify(values.slice(Math.max(0,i-2),i+2))}`);
    }
  }

  assert.deepEqual(pageErrors,[],`browser errors: ${pageErrors.join(' | ')}`);
  console.log('browser Chiron timing and all five timing sorts passed');
}finally{
  await browser.close();
}
