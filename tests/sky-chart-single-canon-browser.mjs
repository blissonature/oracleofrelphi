import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0}};
function sky(name,offset){
  const asc=(168.38+offset)%360;
  const cusps=Array.from({length:12},(_,index)=>(asc+index*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,Chiron:74.48,'North Node':40.3,'South Node':220.3,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
  return{name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{dateTime:'2026-08-03T19:02',instant:'2026-08-04T01:02:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))};
}
const skyA=sky('Sky A',0);
const skyB=sky('Sky B',0);
const APPROVED_PAGE='https://oracleofrelphi.com/glyphs-unified-preview.html';
const APPROVED_COMMIT='0d56ee7ec0ea0fc3e44debcb809afde09f3271ab';

const browser=await chromium.launch({headless:true});

async function inspectSky(width,height,suffix){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  page.setDefaultTimeout(20000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    sessionStorage.removeItem('relphiSkyWhereWhenViewV1');
  },{a:skyA,b:skyB});

  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy')==='false');
  await page.waitForSelector('#skyFoundationA .sky-foundation-row');
  await page.waitForSelector('[data-layer="placements"] > g[data-sky="A"]');
  await page.waitForFunction(()=>document.documentElement.dataset.relphiGlyphSourceIntegrity==='approved');
  await page.waitForFunction(()=>document.querySelectorAll('[data-layer="placements"] > g[data-angle-axis="true"]').length===8);

  const state=await page.evaluate(async()=>{
    window.RelphiGlyphSourceIntegrity.assert('browser-test');
    const sourceMarkup=await fetch('assets/planet-glyphs/neptune.svg?v=test-source').then(response=>response.text());
    const sourceSvg=new DOMParser().parseFromString(sourceMarkup,'image/svg+xml').documentElement;
    const sourceNeptune=sourceSvg.querySelector('path')?.getAttribute('d')||'';
    const geminiMarkup=await fetch('assets/zodiac-glyphs/gemini.svg?v=test-source').then(response=>response.text());
    const geminiSvg=new DOMParser().parseFromString(geminiMarkup,'image/svg+xml').documentElement;
    const geminiSourceStroke=geminiSvg.querySelector('path')?.getAttribute('stroke-width')||'';
    const textOf=art=>art?.matches?.('text')?art.textContent:(art?.querySelector('text')?.textContent||'');
    const radiusAt=(x,y)=>Math.hypot(Number(x)-600,Number(y)-600);
    const angleExpected={asc:'Asc',dsc:'Dsc',mc:'MC',ic:'IC'};
    const angles=Array.from(document.querySelectorAll('[data-layer="placements"] > g[data-angle-axis="true"]')).map(host=>{
      const root=host.querySelector(':scope > .relphi-glyph-bubble');
      const circle=root?.querySelector(':scope > circle');
      const lines=Array.from(document.querySelectorAll(`[data-layer="leaders"] .sky-foundation-angle-axis[data-sky="${host.dataset.sky}"][data-angle="${host.dataset.placement}"]`));
      return{
        id:host.dataset.placement,
        sky:host.dataset.sky,
        text:textOf(root?.querySelector('.relphi-canonical-glyph')),
        masterComposition:!!root,
        circleOpacity:circle?Number(getComputedStyle(circle).opacity):null,
        circlePresentation:root?.dataset.circlePresentation||'',
        transform:root?.querySelector('.relphi-canonical-glyph')?.getAttribute('transform')||'',
        exact:host.dataset.angleLongitude||'',
        lineCount:lines.length,
        lineEndpointRadii:lines.map(line=>[
          radiusAt(line.getAttribute('x1'),line.getAttribute('y1')),
          radiusAt(line.getAttribute('x2'),line.getAttribute('y2'))
        ]),
        lineEdgeRadii:lines.map(line=>Number(line.dataset.axisEdgeRadius)),
        extreme:host.dataset.angleExtreme||'',
        lane:Number(host.dataset.angleLane),
        lineExtremes:lines.map(line=>line.dataset.axisExtreme||'')
      };
    });
    const geminiHost=document.querySelector('[data-layer="zodiac"] [data-zodiac-sign="gemini"]');
    const neptunes=Array.from(document.querySelectorAll('.relphi-glyph-neptune')).map(art=>art.querySelector('path')?.getAttribute('d')||'');
    const nodes=Object.fromEntries(['north-node','south-node'].map(id=>[id,Array.from(document.querySelectorAll(`.relphi-glyph-${id}`)).map(textOf)]));
    const scripts=Array.from(document.scripts).map(script=>script.getAttribute('src')||'').filter(Boolean);
    return{
      sourcePage:document.documentElement.dataset.relphiGlyphSourcePage,
      sourceCommit:document.documentElement.dataset.relphiGlyphSourceCommit,
      apiSourcePage:window.RelphiGlyphSourceIntegrity.sourcePage,
      registryScripts:scripts.filter(src=>src.includes('relphi-glyph-registry-v1.js')).length,
      componentScripts:scripts.filter(src=>src.includes('relphi-glyph-component-v1.js')).length,
      competingScripts:scripts.filter(src=>/(canon-binding|atomic-loader|neptune-cross|moon-stroke|glyph-framing|glyph-size-guard|live-integrity|e9344099|unified-marker|angle-extreme-placement)/.test(src)),
      angles,angleExpected,neptunes,nodes,sourceNeptune,geminiSourceStroke,
      angleDiagnostics:document.querySelectorAll('[data-angle-collision-error],[data-canonical-glyph-error]').length,
      angleCollisionState:document.querySelector('.sky-foundation-wheel')?.dataset.angleCollisionState||'',
      geminiRadius:Number(geminiHost?.dataset.wheelGlyphRadius),
      geminiGlyphs:geminiHost?.querySelectorAll('.relphi-glyph-gemini').length||0,
      neptuneRegistry:window.RelphiGlyphRegistry.get('neptune')?.asset||'',
      ledgerGlyphs:document.querySelectorAll('.sky-foundation-ledger .relphi-canonical-glyph').length
    };
  });

  assert.equal(state.sourcePage,APPROVED_PAGE);
  assert.equal(state.apiSourcePage,APPROVED_PAGE);
  assert.equal(state.sourceCommit,APPROVED_COMMIT);
  assert.equal(state.registryScripts,1);
  assert.equal(state.componentScripts,1);
  assert.deepEqual(state.competingScripts,[]);
  assert.ok(state.ledgerGlyphs>=30);
  assert.equal(state.angleDiagnostics,0);
  assert.equal(state.angleCollisionState,'resolved');
  assert.equal(state.angles.length,8);
  for(const slot of ['A','B']) assert.deepEqual(state.angles.filter(item=>item.sky===slot).map(item=>item.id).sort(),['asc','dsc','ic','mc']);
  for(const angle of state.angles){
    const expectedEdge=angle.sky==='A'?574:166;
    assert.equal(angle.text,state.angleExpected[angle.id]);
    assert.equal(angle.masterComposition,true);
    assert.equal(angle.circleOpacity,0);
    assert.equal(angle.circlePresentation,'hidden-only');
    assert.ok(!/rotate\s*\(/i.test(angle.transform));
    assert.ok(angle.exact);
    assert.equal(angle.lineCount,1);
    assert.equal(angle.lineEdgeRadii[0],expectedEdge);
    assert.ok(angle.lineEndpointRadii[0].some(radius=>Math.abs(radius-expectedEdge)<.01));
    assert.equal(angle.extreme,angle.sky==='A'?'outer':'inner');
    assert.ok(angle.sky==='A'?angle.lane>=504:angle.lane<=238);
    assert.ok(angle.lineExtremes.every(value=>value===angle.extreme));
  }
  assert.equal(state.geminiSourceStroke,'7');
  assert.equal(state.geminiRadius,34);
  assert.equal(state.geminiGlyphs,1);
  assert.equal(state.neptuneRegistry,'assets/planet-glyphs/neptune.svg');
  assert.ok(state.sourceNeptune);
  assert.ok(state.neptunes.length>=3);
  assert.ok(state.neptunes.every(value=>value===state.sourceNeptune));
  assert.ok(state.nodes['north-node'].some(value=>value==='☊'));
  assert.ok(state.nodes['south-node'].some(value=>value==='☋'));

  const relation=page.locator('.sky-foundation-relationship-row[data-relation-index]').first();
  await relation.waitFor({state:'attached'});
  await relation.evaluate(row=>row.click());
  await page.waitForFunction(()=>{
    const panel=document.getElementById('skySelectedRelationship');
    return panel&&!panel.hidden&&panel.querySelectorAll('.sky-selected-card[data-selected-card]').length===2;
  });
  const cards=await page.evaluate(()=>Array.from(document.querySelectorAll('#skySelectedRelationship .sky-selected-card[data-selected-card]')).map(card=>({
    slot:card.dataset.selectedCard,
    border:getComputedStyle(card).borderColor,
    padding:getComputedStyle(card).padding,
    background:getComputedStyle(card).backgroundColor,
    image:!!card.querySelector('img'),
    box:(()=>{const b=card.getBoundingClientRect();return{left:b.left,right:b.right,top:b.top,bottom:b.bottom};})()
  })));
  assert.equal(cards.length,2);
  assert.deepEqual(cards.map(card=>card.slot),['A','B']);
  assert.ok(cards.every(card=>card.image));
  assert.ok(cards.every(card=>card.padding==='0px'));
  assert.ok(cards.every(card=>card.background==='rgba(0, 0, 0, 0)'));
  assert.equal(cards[0].border,'rgb(201, 33, 30)');
  assert.equal(cards[1].border,'rgb(36, 98, 208)');
  assert.ok(cards[0].box.right<=cards[1].box.left||cards[1].box.right<=cards[0].box.left||cards[0].box.bottom<=cards[1].box.top||cards[1].box.bottom<=cards[0].box.top);

  await page.screenshot({path:`sky-chart-single-canon-${suffix}.png`,fullPage:true,animations:'disabled',timeout:30000});
  assert.deepEqual(errors,[]);
  await page.close();
}

await inspectSky(1440,900,'desktop');
await inspectSky(390,844,'mobile');
await browser.close();
console.log('Sky Chart points to the permanent canonical glyph page and passes desktop/mobile source checks.');
