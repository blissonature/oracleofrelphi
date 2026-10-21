import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const placement=(name,longitude)=>({name,longitude});
const unknownSky={
  name:'Unknown-time standalone',
  houseSystem:'none',
  houseCusps:[],
  calcProfile:{
    timeUnknown:true,
    houseSystem:'none',
    houseCusps:[],
    cusps:[],
    dateTime:'1940-04-15',
    moonRange:{
      start:{name:'Moon',longitude:100.5},
      end:{name:'Moon',longitude:113.25}
    }
  },
  placements:{
    Sun:placement('Sun',25),
    Mercury:placement('Mercury',62),
    Venus:placement('Venus',78),
    Mars:placement('Mars',347),
    Jupiter:placement('Jupiter',18),
    Saturn:placement('Saturn',95),
    Uranus:placement('Uranus',210),
    Neptune:placement('Neptune',258),
    Pluto:placement('Pluto',188),
    'North Node':placement('North Node',232),
    'South Node':placement('South Node',52),
    Chiron:placement('Chiron',7),
    Lilith:placement('Lilith',355)
  }
};

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});

await page.addInitScript(sky=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(sky));
  localStorage.removeItem('relphiSkyChartB');
  localStorage.setItem('relphiSkyChartLastModeV1','single');
},unknownSky);

await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount>svg[data-single-sky="A"]')?.dataset.wheelGeometry==='standalone-unknown-time',{timeout:20000});
await page.waitForTimeout(250);

const state=await page.evaluate(()=>{
  const wheel=document.querySelector('#skyFoundationWheelMount>svg[data-single-sky="A"]');
  const spec=window.RelphiSkyWheelSpec;
  const placements=[...wheel.querySelectorAll('[data-layer="placements"]>g[data-sky="A"][data-placement]:not([data-angle-axis="true"])')];
  const zodiacPaths=[...wheel.querySelectorAll('[data-layer="zodiac"] .sky-foundation-sign-sector')];
  const outlines=[...wheel.querySelectorAll('[data-layer="outlines"] .sky-foundation-ring')].map(node=>Number(node.getAttribute('r')));
  return{
    geometry:wheel.dataset.wheelGeometry,
    ringOrder:wheel.dataset.ringOrder,
    inner:Number(wheel.dataset.singleSkyInnerRadius),
    outer:Number(wheel.dataset.singleSkyOuterRadius),
    placementLane:Number(wheel.dataset.singleSkyPlacementLane),
    signGlyphLane:Number(wheel.dataset.singleSkySignGlyphLane),
    ordinaryZodiacInner:Number(spec.comparison.zodiac.inner),
    ordinaryZodiacOuter:Number(spec.comparison.zodiac.outer),
    placementBubbleRadius:Number(spec.comparison.placementBubbleRadius),
    houseSectors:wheel.querySelectorAll('[data-layer="a-houses"] .sky-foundation-house-sector').length,
    houseNumbers:wheel.querySelectorAll('[data-layer="a-houses"] .sky-foundation-house-number').length,
    anglePlacements:wheel.querySelectorAll('[data-layer="placements"] [data-angle-axis="true"]').length,
    signs:zodiacPaths.length,
    outlines,
    moonRange:wheel.querySelectorAll('.sky-foundation-moon-range').length,
    placementLanes:placements.map(node=>Number(node.dataset.placementLane)),
    placementMedallions:placements.map(node=>({present:!!node.querySelector('.relphi-glyph-bubble>circle'),radius:Number(node.querySelector('.relphi-glyph-bubble>circle')?.getAttribute('r')||0)})),
    placementCount:placements.length,
    background:[...wheel.children].filter(node=>node.tagName?.toLowerCase()==='circle'&&node.dataset?.wheelBackground).map(node=>({mode:node.dataset.wheelBackground,r:Number(node.getAttribute('r')),stroke:node.getAttribute('stroke')})),
    viewBox:wheel.getAttribute('viewBox')
  };
});

assert.equal(state.geometry,'standalone-unknown-time');
assert.equal(state.ringOrder,'A-zodiac-expanded-placements-inner-edge');
assert.equal(state.houseSectors,0,'Unknown-time standalone must not paint house sectors.');
assert.equal(state.houseNumbers,0,'Unknown-time standalone must not paint house numbers.');
assert.equal(state.anglePlacements,0,'Unknown-time standalone must not paint chart angles.');
assert.equal(state.signs,12,'Unknown-time standalone must keep all twelve zodiac sectors.');
assert.ok(state.inner<state.ordinaryZodiacInner,'The zodiac must expand inward into the unavailable house territory.');
assert.ok(state.outer>state.ordinaryZodiacOuter,'Unknown-time zodiac color must extend beyond the ordinary zodiac edge into the placement zone.');
assert.ok(Math.abs((state.outer-state.ordinaryZodiacOuter)-state.placementBubbleRadius)<1,'The colored extension should cover approximately one placement-bubble radius.');
assert.ok(state.placementLane<state.outer&&state.placementLane>state.signGlyphLane,'The primary placement lane must sit just inside the zodiac outer edge, beyond the sign glyph lane.');
assert.ok(Math.abs(state.signGlyphLane-(state.inner+state.outer)/2)<0.5,'Unknown-time sign glyphs must sit at the zodiac-band midpoint.');
assert.ok(state.placementCount>0,'The fixture must render planetary placements.');
assert.ok(state.placementLanes.every(value=>Number.isFinite(value)&&value<state.outer&&value>state.signGlyphLane),'The collision pass must preserve the inside-edge placement lane.');
assert.ok(state.placementMedallions.every(item=>item.present&&item.radius>0),'Unknown-time placements must retain the canonical inscribed placement circles for optical centering and scale.');
assert.ok(Math.abs((state.outer-state.placementLane)-36)<0.75,'Unknown-time placement lane must preserve the canonical 36-unit radial leader gap.');
assert.equal(state.outlines.length,2,'Unknown-time standalone should draw only the two zodiac boundaries.');
assert.deepEqual(state.background,[{mode:'unknown-time-center',r:state.inner,stroke:'none'}],'Unknown-time standalone must not paint a full white background rim outside the zodiac.');
assert.ok(state.moonRange>0,'Unknown-time standalone must keep the Moon range.');
const relevantErrors=errors.filter(text=>/Sky Chart foundation render failed|standalone unknown-time|unknown-time composition/i.test(text));
assert.deepEqual(relevantErrors,[]);

// The synthetic Moon range must participate in the same isolation as ordinary placements.
const moonFocus=await page.evaluate(()=>{
  const wheel=document.querySelector('#skyFoundationWheelMount>svg[data-single-sky="A"]');
  const moon=wheel.querySelector('[data-layer="placements"] [data-placement="moon-range"]');
  const fragments=[...wheel.querySelectorAll('[data-layer="leaders"] [data-placement="moon-range"]')];
  const api=window.RelphiSkyFoundationInteractions;
  const before={piece:moon?.dataset.focusPiece,fragments:fragments.map(n=>n.dataset.focusPiece)};
  api.toggleWheel({kind:'placement',sky:'A',value:'pluto'});
  const result={...before,dimmed:getComputedStyle(moon).opacity,fragmentOpacity:fragments.map(n=>getComputedStyle(n).opacity)};
  api.clearWheel();
  result.restored=getComputedStyle(moon).opacity;
  return result;
});
assert.equal(moonFocus.piece,'placement','Unknown-time Moon range must register as a focusable placement.');
assert.ok(moonFocus.fragments.every(x=>x==='leader'),'Unknown-time Moon range boundaries must be focus-controlled.');
assert.ok(Number(moonFocus.dimmed)<.2,'Unknown-time Moon must dim when unrelated Pluto is selected: '+JSON.stringify(moonFocus));
assert.ok(moonFocus.fragmentOpacity.every(x=>Number(x)<.2),'Unknown-time Moon range lines must dim with its symbol.');
assert.ok(Number(moonFocus.restored)>.9,'Unknown-time Moon must restore after clearing focus.');
// Regression: Moon-range boundaries must retain their OWN sky and Moon identity
// in the comparison wheel, even after the ordinary placement interaction pass.
// Previously the interaction layer paired each marker with leaders[index],
// stealing a Moon boundary for a later sky's Sun.
const knownSky={
  name:'Known-time comparison',
  calcProfile:{timeUnknown:false,dateTime:'2026-10-21T16:00',houseSystem:'porphyry',
    houseCusps:Array.from({length:12},(_,index)=>index*30)},
  placements:{
    Sun:placement('Sun',210),
    Moon:placement('Moon',245),
    Mercury:placement('Mercury',268),
    Venus:placement('Venus',315),
    Mars:placement('Mars',345)
  }
};
for(const scenario of [
  {title:'unknown A beside known B',A:unknownSky,B:knownSky,rangeSky:'A',otherSky:'B'},
  {title:'known A beside unknown B',A:knownSky,B:unknownSky,rangeSky:'B',otherSky:'A'}
]){
  await page.evaluate(({A,B})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(A));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(B));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
  },scenario);
  await page.reload({waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount>svg[data-ring-order="A-inner-B-outer"]')?.dataset.finalGeometryReady==='true',{timeout:20000});
  await page.waitForTimeout(450);
  const identity=await page.evaluate(({rangeSky,otherSky})=>{
    const wheel=document.querySelector('#skyFoundationWheelMount>svg[data-ring-order="A-inner-B-outer"]');
    const boundaries=[...wheel.querySelectorAll('[data-layer="leaders"] > line.sky-foundation-moon-range-boundary')];
    const allRange=[...wheel.querySelectorAll('[data-layer="leaders"] > .sky-foundation-moon-range, [data-layer="leaders"] > .sky-foundation-moon-range-boundary, [data-layer="leaders"] > .sky-foundation-moon-range-leader')];
    const otherSun=[...wheel.querySelectorAll(`[data-layer="leaders"] > line.sky-foundation-leader[data-sky="${otherSky}"][data-placement="sun"]`)];
    const misplaced=allRange.filter(node=>node.dataset.sky!==rangeSky||node.dataset.placement!=='moon-range');
    const reassigned=allRange.filter(node=>node.dataset.sign!==undefined||node.dataset.house!==undefined);
    return{boundaryCount:boundaries.length,rangeCount:allRange.length,misplaced:misplaced.map(node=>node.outerHTML.slice(0,300)),reassigned:reassigned.map(node=>node.outerHTML.slice(0,300)),otherSunCount:otherSun.length,
      otherSunPlacements:otherSun.map(node=>({sky:node.dataset.sky,placement:node.dataset.placement,sign:node.dataset.sign}))};
  },scenario);
  assert.equal(identity.boundaryCount,2,scenario.title+': two Moon-range boundaries expected');
  assert.equal(identity.rangeCount,4,scenario.title+': band + two ticks + dashed leader expected');
  assert.deepEqual(identity.misplaced,[],scenario.title+': Moon range has been assigned to the wrong sky or luminary');
  assert.deepEqual(identity.reassigned,[],scenario.title+': Moon range inherited an ordinary Sun/planet annotation');
  assert.equal(identity.otherSunCount,1,scenario.title+': other sky Sun retains its own leader');
  assert.equal(identity.otherSunPlacements[0].placement,'sun',scenario.title+': Sun leader identity is stable');
}

await page.screenshot({path:'sky-chart-standalone-unknown-time.png',fullPage:true});
await browser.close();
console.log('Standalone unknown-time composition passed.');
