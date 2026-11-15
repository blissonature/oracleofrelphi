import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,Chiron:74.48,'North Node':40.3,'South Node':220.3,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
function sky(name,offset){
 const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
 return{name,houseSystem:'porphyry',houseCusps:cusps,
  calcProfile:{dateTime:'2026-11-14T12:00',instant:'2026-11-14T19:00:00Z',
    timeZone:'America/Denver',location:'Salt Lake City, Utah, United States',
    latitude:40.7608,longitude:-111.891,houseSystem:'porphyry',houseCusps:cusps},
  placements:Object.fromEntries(Object.entries(raw).map(([key,v])=>{
    const longitude=(v+offset)%360,sign=SIGNS[Math.floor(longitude/30)];
    return[key,{name:key,longitude,sign,degree:Math.floor(longitude%30),minute:Math.floor((longitude%1)*60)}];
  }))};
}
const browser=await chromium.launch({headless:true});
try{
 for(const width of [1280,390]){
  const ctx=await browser.newContext({viewport:{width,height:900},isMobile:width===390,hasTouch:width===390});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    localStorage.removeItem('relphiSkyAspectMatrixV1');
  },{a:sky('A',0),b:sky('B',29.27)});
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
  await page.locator('#skyFoundationRoot[aria-busy="false"]').waitFor({timeout:30000});
  await page.waitForFunction(()=>document.documentElement.dataset.skyAspectMatrix==='ready'&&
    document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > .sky-foundation-aspect[data-relation-index]').length>10,null,{timeout:25000});
  const prompt=page.locator('#skyWhereWhenNamePrompt:not([hidden])');
  if(await prompt.count())await prompt.locator('[data-sky-name-cancel]').click();
  const control=page.locator('#skyFoundationFocus [data-aspect-filter="combined"]');
  const choice=scope=>control.locator('[data-aspect-matrix-scope="'+scope+'"][data-aspect-matrix-aspect="all"]');
  for(const scope of ['A-A','B-B','A-B'])assert.equal(await choice(scope).count(),1,'Scope control '+scope+' is present in Focus');
  const snapshot=()=>page.evaluate(()=>{
    const lines=[...document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > .sky-foundation-aspect[data-relation-index]:not(.sky-foundation-aspect-hit)')];
    const counts={'A-A':0,'B-B':0,'A-B':0},total={'A-A':0,'B-B':0,'A-B':0},disagree=[];
    for(const line of lines){
      const mode=line.dataset.relationshipMode||'A-B';
      if(!(mode in counts))continue;
      total[mode]++;
      const visible=!line.hidden&&getComputedStyle(line).display!=='none'&&!line.classList.contains('sky-chart-aspect-multiselect-hidden');
      if(visible)counts[mode]++;
      if(line.classList.contains('sky-chart-aspect-multiselect-hidden')&&visible)disagree.push(mode+':'+line.dataset.relationIndex);
    }
    return{counts,total,disagree,isolation:document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-isolation')};
  });
  const initial=await snapshot();
  for(const scope of ['A-A','B-B','A-B'])assert.ok(initial.total[scope]>0,'Fixture has '+scope+' lines: '+JSON.stringify(initial));
  await page.evaluate(()=>{
    const nodes=[...document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > .sky-foundation-aspect[data-relation-index]:not(.sky-foundation-aspect-hit)')];
    window.__scopeLineAudit={changes:[],observer:new MutationObserver(records=>{
      for(const entry of records){
        const node=entry.target;if(!node.matches?.('.sky-foundation-aspect'))continue;
        window.__scopeLineAudit.changes.push({
          mode:node.dataset.relationshipMode||'A-B',key:node.dataset.relationIndex,
          field:entry.attributeName,hidden:node.hidden,display:node.style.display,
          matrixHidden:node.classList.contains('sky-chart-aspect-multiselect-hidden')
        });
      }
    })};
    window.__scopeLineAudit.observer.observe(document.querySelector('#skyFoundationWheelMount [data-layer="aspects"]'),
      {subtree:true,attributes:true,attributeFilter:['hidden','style','class']});
  });
  const actions=[['A-A',false],['B-B',false],['A-B',false],['B-B',true],['A-B',true],['A-A',true],
    ['A-B',false],['A-B',true],['A-A',false],['A-A',true]];
  for(const [changed,enabled] of actions){
    const input=choice(changed);
    if(enabled)await input.check();else await input.uncheck();
    await page.waitForTimeout(160);
    const state=await snapshot();
    const desired=Object.fromEntries(await Promise.all(['A-A','B-B','A-B'].map(async scope=>[scope,await choice(scope).isChecked()])));
    for(const scope of Object.keys(desired)){
      if(desired[scope])assert.ok(state.counts[scope]>0,'Enabled '+scope+' must have visible aspect lines after '+changed+' '+enabled+': '+JSON.stringify(state));
      else assert.equal(state.counts[scope],0,'Disabled '+scope+' cannot paint lines');
    }
    assert.deepEqual(state.disagree,[],'No geometry may contradict the scope matrix');
    console.log('PASS scope transition',width,changed,enabled,JSON.stringify(state.counts));
  }
  const transitions=await page.evaluate(()=>{
    const audit=window.__scopeLineAudit;audit.observer.disconnect();
    return audit.changes;
  });
  // One user action may hide/show its own lines once. It must not repeatedly
  // flip unrelated scope geometry as delayed scripts overwrite one another.
  const byKey=new Map();
  for(const entry of transitions){
    if(!['hidden','style'].includes(entry.field))continue;
    const id=entry.mode+':'+entry.key;
    const arr=byKey.get(id)||[];arr.push(entry);byKey.set(id,arr);
  }
  const churn=[...byKey.entries()].filter(([_,changes])=>changes.length>actions.length*2);
  assert.deepEqual(churn.map(([key,changes])=>({key,changes:changes.length})),[],
    'A rendered line must not churn visibility repeatedly during scope changes');
  assert.deepEqual(errors,[],'No browser exceptions');
  console.log('PASS stable aspect scopes in Chromium',width,'line mutations',transitions.length);
  await ctx.close();
 }
}finally{await browser.close()}
