import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const point=(name,value)=>{
 const longitude=((value%360)+360)%360,within=longitude%30;
 return {name,longitude,sign:SIGNS[Math.floor(longitude/30)],
   degree:Math.floor(within),minute:Math.floor((within%1)*60)};
};
function sky(name,items,offset,instant){
 const asc=(168.3667+offset)%360,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
 return {name,houseSystem:'equal-house',houseCusps:cusps,
  calcProfile:{dateTime:'2026-11-05T20:35',instant,timeZone:'America/Denver',
   location:'Salt Lake City, Utah, United States',latitude:40.7608,longitude:-111.891,
   houseSystem:'equal-house',houseCusps:cusps},
  placements:Object.fromEntries(Object.entries(items).map(([n,v])=>[n,point(n,v)]))};
}
const a=sky('Marisa',{
 Sun:195,Moon:118.4167,Mercury:206.1667,Venus:169.8833,Mars:167.8667,
 Jupiter:307.15,Saturn:235.5667,Pluto:213.8833,
 Ascendant:168.3667,Descendant:348.3667,Midheaven:76.2667,IC:256.2667
},0,'1985-10-08T08:37:00Z');
const b=sky('Sensed Spiral, Bilateral Neural Activity in Arms and Jaw',{
 Sun:223.8,Moon:188.0833,Venus:204.0833,Mars:141.2,Jupiter:144.9167,Saturn:8.9667,
 Uranus:64.4667,Neptune:1.9667,Pluto:303.1667,
 Ascendant:122.4667,Descendant:302.4667,Midheaven:18.3167,IC:198.3167,
 Vertex:258.45,'Anti-Vertex':78.45,'North Node':325.7833,'South Node':145.7833
},-45.9,'2026-11-06T03:35:00Z');

const browser=await chromium.launch({headless:true});
async function run(mode,url='http://127.0.0.1:4173/sky-chart.html'){
 const mobile=mode==='mobile';
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:960},
    hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1,permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage(),errors=[],networkErrors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',req=>networkErrors.push({url:req.url(),failure:req.failure()?.errorText}));
 page.on('response',response=>{if(response.status()>=400)networkErrors.push({url:response.url(),status:response.status()})});
 await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',
  route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
 await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',
  route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
 await page.addInitScript(({a,b})=>{
   localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
   localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
   localStorage.setItem('relphiSkyChartLastModeV1','comparison');
   localStorage.setItem('relphiSkyConfigurationMatrixV1',JSON.stringify({
     'A-A':[],'B-B':['mystic-rectangle'],'A-B':['grand-cross','t-square']
   }));
   localStorage.setItem('relphiSkyConfigurationInevitableV1','false');
 },{a,b});
 try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});
  try{
    await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
  }catch(error){
    const state=await page.evaluate(()=>({
      title:document.title,
      bodyText:document.body?.innerText?.slice(0,900)||'',
      rootBusy:document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy'),
      scripts:[...document.scripts].filter(s=>s.src).slice(-16).map(s=>s.src),
      base:document.querySelector('base')?.href||'',
      ready:document.readyState
    })).catch(e=>({inspectionError:String(e)}));
    console.error('CONFIG_REMOTE_DIAGNOSTICS '+JSON.stringify({mode,url:page.url(),state,errors,networkErrors:networkErrors.slice(0,30)}));
    throw error;
  }
  await page.waitForSelector('#skyFoundationConfigurations:not([hidden]) .sky-configuration-result-tile',
     {timeout:30000});
  const found=await page.locator('.sky-configuration-result-tile').evaluateAll(rows=>rows.map(r=>r.dataset.configurationType));
  console.log('FOUND '+mode+' '+JSON.stringify(found));
  const copy=page.locator('#skyFoundationConfigurations .sky-configuration-copy-button');
  await copy.scrollIntoViewIfNeeded();
  if(mobile)await copy.tap();else await copy.click();
  await page.waitForFunction(()=>document.querySelector('.sky-configuration-copy-button')?.dataset.relphiCopyFeedback==='done',
     null,{timeout:5000});
  const copied=await page.evaluate(()=>navigator.clipboard.readText());
  assert.match(copied,/Configurations/);
  assert.match(copied,/(Grand Cross|Mystic Rectangle|T-Square)/);
  console.log('COPY LIST '+mode+' '+copied.slice(0,100).replaceAll('\n',' '));

  // Recreate the specific two-sky axis cross in a minimal relationship graph.
  // The default Focus filter omits these angle/point edges, so don't assume
  // its initial list includes a user-selected Focus configuration.
  await page.evaluate(()=>{
    const list=document.getElementById('skyFoundationRelationshipList');
    list.replaceChildren();
    const square=(left,right,lHouse,rHouse,lSign,rSign)=>{
      const row=document.createElement('div');
      row.className='sky-foundation-relationship-row';
      Object.assign(row.dataset,{
        relationshipMode:'A-B',leftSky:'A',rightSky:'B',
        leftPlacement:left,rightPlacement:right,aspect:'square',
        phaseError:'0.33',sourceOrb:'0.0833',harmonicOrder:'4',
        leftHouse:String(lHouse),rightHouse:String(rHouse),
        leftSign:String(lSign),rightSign:String(rSign)
      });
      return row;
    };
    list.append(
      square('asc','vertex',1,5,5,8),
      square('asc','anti-vertex',1,11,5,2),
      square('dsc','vertex',7,5,11,8),
      square('dsc','anti-vertex',7,11,11,2)
    );
    window.RelphiAspectConfigurations?.refresh?.();
  });
  await page.waitForFunction(()=>window.RelphiAspectConfigurations?.patterns?.some(pattern=>
    pattern.type==='grand-cross'&&['A:asc','A:dsc','B:vertex','B:anti-vertex']
      .every(key=>pattern.vertices.includes(key))),null,{timeout:10000});
  await page.locator('[data-configuration-inevitable]').evaluate(input=>{
    input.checked=true;
    input.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.waitForSelector('.sky-configuration-result-tile[data-configuration-type="grand-cross"]',{state:'visible',timeout:10000});

  const tile=page.locator('.sky-configuration-result-tile[data-configuration-type="grand-cross"]').first();
  if(mobile)await tile.locator('.sky-configuration-result-summary').tap();
  else await tile.locator('.sky-configuration-result-summary').click();
  await page.waitForSelector('.sky-configuration-result-tile.is-expanded .sky-configuration-result-detail',{timeout:10000});
  const matchKeys=await tile.locator('.sky-configuration-match-row').evaluateAll(rows=>rows.map(row=>row.dataset.configurationMatch));
  console.log('GRAND CROSS MATCHES '+mode+' '+JSON.stringify(matchKeys.slice(0,12)));
  const ownAxes=tile.locator('.sky-configuration-match-row[data-configuration-match*="A:asc"][data-configuration-match*="A:dsc"][data-configuration-match*="B:vertex"][data-configuration-match*="B:anti-vertex"]');
  assert.equal(await ownAxes.count(),1,"The Asc/Dsc ↔ Vx/AVx Grand Cross must remain a selectable exact match");
  if(mobile)await ownAxes.tap();else await ownAxes.click();
  assert.equal(await tile.locator('.sky-configuration-participant-guide,.sky-configuration-intrinsic-axes-note').count(),0,
    'Expanded Configuration must not repeat its interpretation in supplementary cards or panels');
  const detailCopy=tile.locator('.sky-configuration-tile-copy');
  if(mobile)await detailCopy.tap();else await detailCopy.click();
  await page.waitForFunction(()=>document.querySelector('.sky-configuration-result-tile.is-expanded .sky-configuration-tile-copy')?.dataset.relphiCopyFeedback==='done',
     null,{timeout:5000});
  const detailText=await page.evaluate(()=>navigator.clipboard.readText());
  assert.match(detailText,/Configurations/);
  assert.match(detailText,/Structure:/);
  assert.match(detailText,/Interpretation:/);

  // The diagram belongs to the canonical glyph owner, not the rejected
  // floating sign/house badge renderer. Vocab colors belong in interpretation.
  const meaning=await tile.evaluate(node=>{
    const visual=node.querySelector('.sky-configuration-result-visual');
    const plotted=[...visual.querySelectorAll('.sky-configuration-vertex-host')].map(host=>{
      const placement=host.querySelector('.sky-configuration-vertex-placement');
      return{sky:host.dataset.sky,placement:host.dataset.canonicalPlacement,
        glyph:!!placement?.querySelector('svg[data-relationship-canonical-host]'),
        label:placement?.getAttribute('aria-label')||''};
    });
    const rect=visual.querySelector('.sky-configuration-mini-wheel')?.getBoundingClientRect();
    const rails=[...node.querySelectorAll('.sky-configuration-match-participant')].map(x=>{
      const r=x.getBoundingClientRect();
      return{width:r.width,height:r.height,colors:[...x.querySelectorAll('.sky-configuration-match-rail')].map(y=>getComputedStyle(y).backgroundColor)};
    });
    const reader=node.querySelector('.sky-configuration-result-interpretation');
    return{plotted,width:rect?.width,hidden:visual.querySelector('.sky-configuration-vertex-layer')?.getAttribute('aria-hidden'),
      badges:visual.querySelectorAll('.sky-configuration-vertex-sign,.sky-configuration-vertex-house,[data-interactive="sign"],[data-interactive="house"]').length,
      expandedLabels:node.querySelectorAll('.sky-configuration-match-context').length,
      rails,reading:reader?.textContent||'',
      signs:reader.querySelectorAll('.sky-configuration-interpretation-sign').length,
      houses:reader.querySelectorAll('.sky-configuration-interpretation-house').length,
      syntheses:reader.querySelectorAll('.sky-configuration-interpretation-synthesis').length,
      extra:node.querySelectorAll('.sky-configuration-participant-guide,.sky-configuration-intrinsic-axes-note,.sky-configuration-aspect-legend,.sky-configuration-match-rail-key').length};
  });
  console.log('DIAGRAM '+mode+' '+JSON.stringify(meaning));
  assert.equal(meaning.extra,0,'No duplicated interpretation panels or keys');
  assert.equal(meaning.hidden,null,'Canonical interactive placements are accessible');
  assert.equal(meaning.plotted.length,4,'All four geometry positions remain');
  assert.ok(meaning.width>=190,'Original expanded diagram remains legible');
  assert.ok(meaning.plotted.every(x=>x.glyph&&x.label),'Each point retains its canonical glyph');
  assert.equal(meaning.badges,0,'No rejected sign or house badges overlap the diagram');
  assert.equal(meaning.expandedLabels,0,'No extra label text beneath canonical glyph rails');
  assert.ok(meaning.rails.length>0&&meaning.rails.every(r=>Math.abs(r.width-38)<1&&Math.abs(r.height-46)<1&&r.colors.length===2),
    'Match row rails and glyphs retain their compact 38×46 proportions');
  assert.ok(meaning.signs>=2&&meaning.houses>=2,'Vocab-colored signs and houses appear in the interpretation');
  assert.ok(meaning.syntheses>=1,'Interpretation separates synthesis from individual readings');
  const asc=tile.locator('.sky-configuration-vertex-host[data-sky="A"][data-canonical-placement="asc"]');
  assert.equal(await asc.count(),1,'Natal Ascendant plotted once');
  assert.match(await asc.locator('.sky-configuration-vertex-placement').getAttribute('aria-label'),/Sky A Ascendant.*Virgo/i);
  const liveVertex=await page.evaluate(()=>{
    const sky=JSON.parse(localStorage.getItem('relphiSkyChartB')||'{}');
    const entries=sky.placements||sky.positions||sky.points||{};
    return Number((entries.Vertex||entries.vertex)?.longitude);
  });
  assert.ok(Number.isFinite(liveVertex),'Comparison sky retains calculated Vertex');
  const vertexSign=SIGNS[Math.floor((((liveVertex%360)+360)%360)/30)];
  const eventVertex=tile.locator('.sky-configuration-vertex-host[data-sky="B"][data-canonical-placement="vertex"]');
  assert.match(await eventVertex.locator('.sky-configuration-vertex-placement').getAttribute('aria-label'),new RegExp(vertexSign,'i'));
  const glyph=asc.locator('.sky-configuration-vertex-placement');
  if(mobile)await glyph.tap();else await glyph.click();
  await page.waitForFunction(()=>window.RelphiSkyFoundationInteractions?.captureFocus?.().lockedState?.kind==='placement');
  const focus=await page.evaluate(()=>window.RelphiSkyFoundationInteractions?.captureFocus?.());
  assert.equal(focus.lockedState.sky,'A');
  assert.equal(focus.lockedState.value,'asc');
  await page.locator('.sky-configuration-result-visual').scrollIntoViewIfNeeded();
  await page.screenshot({path:'feeling-stars-config-'+mode+'.png',fullPage:false});

  // When copying is denied, the owner must report a failure instead of a silent no-op.
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Clipboard denied')}}});
    document.execCommand=()=>false;
  });
  const allCopy=page.locator('#skyFoundationConfigurations .sky-configuration-copy-button');
  if(mobile)await allCopy.tap();else await allCopy.click();
  await page.waitForFunction(()=>{
    const button=document.querySelector('#skyFoundationConfigurations .sky-configuration-copy-button');
    return button?.dataset.relphiCopyFeedback==='failed' || /^Copy failed/i.test(button?.getAttribute('aria-label')||'');
  },null,{timeout:3000});
  assert.deepEqual(errors,[],mode+' runtime errors');
  console.log('PASS '+mode+' canonical glyph diagram, color-coded interpretation, placement focus and copy feedback');
 }finally{await context.close()}
}
try{
 await run('desktop');
 await run('mobile');
 const ref=process.env.REMOTE_PREVIEW_REF||'';
 if(ref){
  assert.match(ref,/^[a-f0-9]{40}$/i,'The hosted preview must use the exact commit SHA');
  await run('hosted-preview','https://cdn.githubraw.com/blissonature/oracleofrelphi/'+ref);
 }
}finally{await browser.close()}
