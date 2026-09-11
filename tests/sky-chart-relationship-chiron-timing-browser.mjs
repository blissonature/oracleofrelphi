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
    localStorage.setItem('relphiSkyRelationshipDisplayV1','glyphs');
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

  // Expanding one row must not leak its timing/cards into Copy while Display is Glyphs.
  const glyphCopyState=await page.evaluate(()=>{
    const row=[...document.querySelectorAll('#skyFoundationRelationshipList .sky-foundation-relationship-row')].find(node=>{
      const pair=new Set([node.dataset.leftPlacement,node.dataset.rightPlacement]);
      return node.dataset.relationshipMode==='B-B'&&node.dataset.aspect==='opposition'&&pair.has('venus')&&pair.has('chiron');
    });
    const api=window.RelphiRelationshipCopySerializer;
    return{display:document.documentElement.dataset.relationshipDisplay||'',level:api?.levelForRow?.(row),semantic:api?.serialize?.(row)||''};
  });
  assert.equal(glyphCopyState.level,0,`Glyphs display must keep expanded rows at compact copy level: ${JSON.stringify(glyphCopyState)}`);
  assert.equal(glyphCopyState.semantic,'',`Glyphs display must not serialize expanded timing/card detail: ${JSON.stringify(glyphCopyState)}`);

  // Collapse the timing tile so Copy uses the same compact representation for every row.
  await element.click();
  await page.waitForFunction(()=>![...document.querySelectorAll('#skyFoundationRelationshipList .sky-foundation-relationship-row')].some(row=>row.classList.contains('is-inline-expanded')),null,{timeout:10000});

  // Capture Copy output instead of writing to the runner clipboard.
  await page.evaluate(()=>{
    window.__relphiCopiedText='';
    document.execCommand=()=>false;
    const clipboard={writeText:async text=>{window.__relphiCopiedText=String(text);}};
    try{Object.defineProperty(navigator,'clipboard',{configurable:true,value:clipboard})}catch(_){
      try{navigator.clipboard.writeText=clipboard.writeText}catch(__){}
    }
  });

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

    // Copy must preserve this same global DOM order instead of regrouping by A↔B/A↔A/B↔B.
    const signatures=await page.evaluate(()=>{
      const placementSymbols={sun:'☉',moon:'☽',mercury:'☿',venus:'♀',mars:'♂',jupiter:'♃',saturn:'♄',uranus:'♅',neptune:'♆',pluto:'♇',chiron:'⚷','north-node':'☊','south-node':'☋',lilith:'⚸','part-of-fortune':'⊗',vertex:'Vx',asc:'Asc',dsc:'Dsc',mc:'MC',ic:'IC'};
      const signSymbols=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
      const aspectSymbols={conjunction:'☌',opposition:'☍',trine:'△',square:'□',sextile:'✶','semi-sextile':'⚺',quincunx:'⚻',octile:'∠','tri-octile':'⚼',quintile:'Q','bi-quintile':'BQ'};
      const coordinate=(row,side)=>{
        const small=row.querySelector(`.sky-foundation-relationship-placement--${side} .sky-foundation-relationship-copy small`);
        const stored=String(small?.dataset?.relationshipCoordinate||'').trim();
        return stored||String(small?.textContent||'').match(/\d{1,2}°\d{2}′/)?.[0]||'';
      };
      return [...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]')]
        .filter(row=>!row.hidden&&getComputedStyle(row).display!=='none')
        .slice(0,30)
        .map(row=>{
          const left=row.dataset.leftPlacement||'',right=row.dataset.rightPlacement||'',aspect=row.dataset.aspect||'';
          return `${placementSymbols[left]||left} in ${signSymbols[Number(row.dataset.leftSign)]||''} ${coordinate(row,'left')} ${aspectSymbols[aspect]||aspect} ${placementSymbols[right]||right} in ${signSymbols[Number(row.dataset.rightSign)]||''} ${coordinate(row,'right')}`.replace(/\s+/g,' ').trim();
        })
        .filter(Boolean);
    });
    assert.ok(signatures.length>5,`${spec.label} should expose enough rows to verify Copy order`);
    await page.evaluate(()=>{window.__relphiCopiedText=''});
    await page.locator('.sky-relationship-copy-button').click();
    await page.waitForFunction(()=>Boolean(window.__relphiCopiedText),null,{timeout:3000});
    const copied=await page.evaluate(()=>window.__relphiCopiedText);
    let cursor=-1;
    for(const signature of signatures){
      const next=copied.indexOf(signature,cursor+1);
      assert.ok(next>=0,`${spec.label} Copy omitted or reordered row after position ${cursor}: ${signature}\n${copied}`);
      cursor=next;
    }
  }

  assert.deepEqual(pageErrors,[],`browser errors: ${pageErrors.join(' | ')}`);
  console.log('browser Chiron timing, glyph-only copy, all five timing sorts, and timing-sort Copy order passed');
}finally{
  await browser.close();
}
