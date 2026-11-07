import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';

const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function point(name,longitude,house){
  const value=((longitude%360)+360)%360,d=value%30;
  return{name,longitude:value,sign:signs[Math.floor(value/30)],degree:Math.floor(d),minute:Math.floor((d%1)*60),house};
}
function sky(name,offset,tSquare=false){
  const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,i)=>(asc+30*i)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,
    Jupiter:307.15,Saturn:tSquare?220-offset:235.57,
    Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Midheaven:76.28};
  if(tSquare){raw['North Node']=310-offset;raw['South Node']=130-offset;}
  return{name,houseSystem:'equal-house',houseCusps:cusps,
    calcProfile:{dateTime:'2026-11-07T04:00',instant:'2026-11-07T11:00:00.000Z',
      location:'Salt Lake City, Utah',locationQuery:'Salt Lake City, Utah',
      timeZone:'America/Denver',latitude:40.76,longitude:-111.89,houseCusps:cusps,houseSystem:'equal-house'},
    placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[
      key,point(key,value+offset,tSquare&&key==='North Node'?5:tSquare&&key==='South Node'?11:tSquare&&key==='Saturn'?3:1)]))};
}
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1200,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',r=>r.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',r=>r.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  const a=sky('Sky A',0),b=sky('Sky B',29.27,true);
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    localStorage.setItem('relphiSkyConfigurationMatrixV1',JSON.stringify({'A-A':[],'B-B':['t-square'],'A-B':[]}));
  },{a,b});
  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
  await page.waitForSelector('#skyChartAspectPopover [data-configuration-row="t-square"]',{state:'attached',timeout:15000});
  // Explicit data for the three aspects, fed through the genuine graph owner,
  // avoids relying on which optional Relationship categories are user-enabled.
  await page.evaluate(()=>{
    const list=document.querySelector('#skyFoundationRelationshipList');
    for(const [left,right,aspect] of [
      ['north-node','south-node','opposition'],
      ['north-node','saturn','square'],
      ['south-node','saturn','square']
    ]){
      const row=document.createElement('div');
      row.className='sky-foundation-relationship-row';
      const houses={'north-node':5,'south-node':11,saturn:3};
      const signs={'north-node':10,'south-node':4,saturn:7};
      Object.assign(row.dataset,{
        leftSky:'B',rightSky:'B',leftPlacement:left,rightPlacement:right,
        leftHouse:String(houses[left]),rightHouse:String(houses[right]),
        leftSign:String(signs[left]),rightSign:String(signs[right]),
        relationshipMode:'B-B',aspect,phaseError:'0.1',harmonicOrder:'1',
        relationIndex:'config-canonical-'+left+'-'+right
      });
      list.appendChild(row);
    }
    const input=document.querySelector('#skyChartAspectPopover [data-configuration-row="t-square"] [data-configuration-scope="B-B"]');
    input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));
    window.RelphiAspectConfigurations?.refresh?.();
  });
  const tile=page.locator('#skyFoundationConfigurations .sky-configuration-type-tile[data-configuration-type="t-square"]');
  await tile.waitFor({timeout:20000});
  await tile.locator('.sky-configuration-result-summary').click();
  await page.waitForFunction(()=>document.querySelectorAll('#skyFoundationConfigurations .sky-configuration-type-tile[data-configuration-type="t-square"] .sky-configuration-vertex-placement svg[data-relationship-canonical-host]').length===3,null,{timeout:20000});
  for(const [width,height,label] of [[1200,900,'desktop'],[390,844,'mobile']]){
    await page.setViewportSize({width,height});
    await page.waitForTimeout(150);
    const audit=await tile.evaluate(root=>{
      const visual=root.querySelector('.sky-configuration-result-visual');
      const vertices=[...visual.querySelectorAll('.sky-configuration-vertex-host')];
      const placements=vertices.map(host=>host.querySelector('.sky-configuration-vertex-placement'));
      const lines=visual.querySelectorAll('.sky-configuration-mini-aspect');
      const context=[...root.querySelectorAll('.sky-configuration-interpretation-actor')].map(x=>x.textContent.trim());
      const entries=[...root.querySelectorAll('.sky-configuration-interpretation-line')];
      const matchRows=[...root.querySelectorAll('.sky-configuration-match-participant')];
      const structures=[...root.querySelectorAll('.sky-configuration-interpretation-synthesis')];
      const first=matchRows[0]?.getBoundingClientRect();
      const rect=visual.getBoundingClientRect();
      return{width:rect.width,lines:lines.length,
        canonical:placements.map(x=>!!x?.querySelector('svg[data-relationship-canonical-host]')),
        illegal:visual.querySelectorAll('.sky-configuration-vertex-sign,.sky-configuration-vertex-house,.sky-configuration-vertex-attributes,[data-interactive="sign"],[data-interactive="house"]').length,
        text:visual.innerText||'',context,
        entries:entries.length,structure:structures.map(s=>s.textContent.trim()),
        noAddedLabels:root.querySelectorAll('.sky-configuration-match-context').length===0,
        sameRails:matchRows.every(row=>{const box=row.getBoundingClientRect();return Math.abs(box.width-38)<1&&Math.abs(box.height-46)<1&&row.querySelectorAll('.sky-configuration-match-rail').length===2}),
        signTokens:root.querySelectorAll('.sky-configuration-interpretation-sign').length,
        houseTokens:root.querySelectorAll('.sky-configuration-interpretation-house').length,
        aspectTokens:root.querySelectorAll('.sky-configuration-interpretation-aspect').length};
    });
    assert.equal(audit.lines,3,label+' retains all three aspect edges');
    assert.equal(audit.canonical.length,3,label+' retains three vertices');
    assert.ok(audit.canonical.every(Boolean),label+' displays only canonical placement art');
    assert.equal(audit.illegal,0,label+' has no unauthorized sign/house glyph badges');
    assert.equal(audit.noAddedLabels,true,label+' has no additional text beneath the canonical rails');
    assert.equal(audit.sameRails,true,label+' restores the 38px canonical rail and glyph layout');
    assert.ok(audit.entries>=2,label+' structures interpretation by placement');
    assert.ok(audit.signTokens>=2&&audit.houseTokens>=2,label+' color-codes signs and houses in the prose');
    assert.ok(audit.structure.length>0&&audit.aspectTokens>0,label+' separates and colors the synthesis');
    assert.deepEqual(errors,[],label+' has no uncaught browser errors');
    await tile.screenshot({path:'sky-configuration-canonical-'+label+'.png'});
  }
  await page.close();
}finally{await browser.close()}
console.log('Canonical T-square diagram verified: 3 canonical glyphs, 3 aspect edges, no badges, mobile and desktop.');
