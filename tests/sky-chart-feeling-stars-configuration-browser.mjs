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
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
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
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
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

  // One interactive, annotated plotted vertex for each position in the
  // ACTUAL diagram; no second interpretation, card stack, or appended legend.
  const meaning=await tile.evaluate(node=>{
    const visual=node.querySelector('.sky-configuration-result-visual');
    const plotted=[...visual.querySelectorAll('.sky-configuration-vertex-host')].map(host=>{
      const placement=host.querySelector('.sky-configuration-vertex-placement');
      const sign=host.querySelector('.sky-configuration-vertex-sign');
      const house=host.querySelector('.sky-configuration-vertex-house');
      return{sky:host.dataset.sky,placement:host.dataset.canonicalPlacement,
        glyph:!!placement?.querySelector('svg[data-relationship-canonical-host]'),
        sign:sign?.textContent,house:house?.textContent,
        signTitle:sign?.title,houseTitle:house?.title,
        signColor:sign?.style.getPropertyValue('--vertex-sign-color'),
        houseColor:house?.style.getPropertyValue('--vertex-house-color'),
        signInteractive:sign?.dataset.interactive,houseInteractive:house?.dataset.interactive};
    });
    const rect=visual.querySelector('.sky-configuration-mini-wheel')?.getBoundingClientRect();
    return{plotted,width:rect?.width,hidden:visual.querySelector('.sky-configuration-vertex-layer')?.getAttribute('aria-hidden'),
      extra:node.querySelectorAll('.sky-configuration-participant-guide,.sky-configuration-intrinsic-axes-note,.sky-configuration-aspect-legend,.sky-configuration-match-rail-key').length};
  });
  console.log('DIAGRAM '+mode+' '+JSON.stringify(meaning));
  assert.equal(meaning.extra,0,'No duplicated interpretation or keys outside the diagram');
  assert.equal(meaning.hidden,null,'Plotted interactive vertices must not be aria-hidden');
  assert.equal(meaning.plotted.length,4,'All four vertices must be represented in the configuration geometry');
  assert.ok(meaning.width>=190,'The expanded diagram must be large enough for sign and house targets');
  assert.ok(meaning.plotted.every(v=>v.glyph&&v.sign&&v.house&&v.signTitle&&v.houseTitle&&v.signColor&&v.houseColor),
    'Each existing vertex must carry its actual glyph, sign and house with matching colors');
  assert.ok(meaning.plotted.every(v=>v.signInteractive==='sign'&&v.houseInteractive==='house'));
  const asc=tile.locator('.sky-configuration-vertex-host[data-sky="A"][data-canonical-placement="asc"]');
  assert.equal(await asc.count(),1,'My natal Ascendant must be plotted once');
  assert.equal(await asc.locator('.sky-configuration-vertex-sign').getAttribute('aria-label'),'Virgo zodiac sign');
  assert.equal(await asc.locator('.sky-configuration-vertex-house').textContent(),'1');
  const liveVertex=await page.evaluate(()=>{
    const sky=JSON.parse(localStorage.getItem('relphiSkyChartB')||'{}');
    const entries=sky.placements||sky.positions||sky.points||{};
    return Number((entries.Vertex||entries.vertex)?.longitude);
  });
  assert.ok(Number.isFinite(liveVertex),'The comparison sky should retain a calculated Vertex');
  const vertexSign=SIGNS[Math.floor((((liveVertex%360)+360)%360)/30)];
  const eventVertex=tile.locator('.sky-configuration-vertex-host[data-sky="B"][data-canonical-placement="vertex"]');
  assert.equal(await eventVertex.locator('.sky-configuration-vertex-sign').getAttribute('title'),vertexSign);

  // Clicking the diagram goes through the existing Foundation wheel controller,
  // not an additional popover or competing selection state.
  const skyInteractions=()=>window.RelphiSkyFoundationInteractions?.captureFocus?.();
  const sign=asc.locator('.sky-configuration-vertex-sign');
  if(mobile)await sign.tap();else await sign.click();
  await page.waitForFunction(()=>window.RelphiSkyFoundationInteractions?.captureFocus?.().lockedState?.kind==='sign');
  let focus=await page.evaluate(skyInteractions);
  assert.equal(focus.lockedState.value,5,'Virgo sign button must select Virgo in the existing controller');
  assert.match(await page.locator('.sky-wheel-sector-description').textContent(),/Virgo/i);
  const house=asc.locator('.sky-configuration-vertex-house');
  if(mobile)await house.tap();else await house.click();
  await page.waitForFunction(()=>window.RelphiSkyFoundationInteractions?.captureFocus?.().lockedState?.kind==='house');
  focus=await page.evaluate(skyInteractions);
  assert.equal(focus.lockedState.sky,'A');
  assert.equal(focus.lockedState.value,1);
  assert.match(await page.locator('.sky-wheel-sector-description').textContent(),/(First House|House 1)/i);
  const glyph=asc.locator('.sky-configuration-vertex-placement');
  if(mobile)await glyph.tap();else await glyph.click();
  await page.waitForFunction(()=>window.RelphiSkyFoundationInteractions?.captureFocus?.().lockedState?.kind==='placement');
  focus=await page.evaluate(skyInteractions);
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
  console.log('PASS '+mode+' diagram sign, house and placement focus; clipboard and denied-permission feedback');
 }finally{await context.close()}
}
try{
 await run('desktop');
 await run('mobile');
 const ref=process.env.REMOTE_PREVIEW_REF||'';
 if(ref){
  assert.match(ref,/^[a-f0-9]{40}$/i,'The hosted preview must use the exact commit SHA');
  await run('hosted-preview','https://oracleofrelphi.com/sky-chart-preview/sky-chart.html?ref='+ref);
 }
}finally{await browser.close()}
