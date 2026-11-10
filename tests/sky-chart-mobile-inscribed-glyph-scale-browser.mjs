import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const source = {
  Sun:195, Moon:118.42, Mercury:206.17, Venus:169.88, Mars:167.87,
  Jupiter:307.15, Saturn:235.57, Uranus:254.85, Neptune:271.02,
  Pluto:213.88, Ascendant:168.38, Descendant:348.38,
  Midheaven:76.28, 'Imum Coeli':256.28
};
function fixture(slot) {
  const shift=slot==='B'?28:0, asc=168.38+shift;
  const houseCusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
  return {
    name:'Glyph scale '+slot, houseSystem:'equal-house', houseCusps,
    calcProfile:{instant:'2026-11-10T10:00:00Z',dateTime:'2026-11-10T03:00',
      timeZone:'America/Denver',latitude:40.7608,longitude:-111.891,
      houseSystem:'equal-house',houseCusps},
    placements:Object.fromEntries(Object.entries(source).map(([name,longitude])=>[
      name,{name,longitude:(longitude+shift)%360}
    ]))
  };
}

const browser=await chromium.launch({headless:true});
try {
  for(const {name,width,height,compare,mobile} of [
    {name:'desktop-comparison',width:1280,height:900,compare:true,mobile:false},
    {name:'mobile-comparison',width:390,height:844,compare:true,mobile:true},
    {name:'mobile-standalone',width:390,height:844,compare:false,mobile:true}
  ]) {
    const context=await browser.newContext({
      viewport:{width,height},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1
    });
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>
      route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
    await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>
      route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
    await page.addInitScript(({a,b,compare})=>{
      localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
      if(compare)localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
      else localStorage.removeItem('relphiSkyChartB');
      localStorage.setItem('relphiSkyChartLastModeV1',compare?'comparison':'single');
    },{a:fixture('A'),b:fixture('B'),compare});
    await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:40000});
    await page.locator('#skyFoundationRoot[aria-busy="false"]').waitFor({timeout:35000});
    await page.waitForFunction(()=>{
      const hosts=[...document.querySelectorAll('#skyFoundationWheelMount [data-layer="placements"] > g[data-placement="sun"]')];
      return hosts.length&&hosts.every(n=>!!n.querySelector('.relphi-glyph-bubble > circle'));
    },null,{timeout:25000});
    const state=await page.evaluate(()=>{
      const root='#skyFoundationWheelMount ',wheel=document.querySelector(root+'svg.sky-foundation-wheel');
      const inspect=(selector)=>{
        const host=document.querySelector(root+selector),circle=host?.querySelector('.relphi-glyph-bubble > circle');
        return {radius:circle?Number(circle.getAttribute('r')):null,
          transform:host?.getAttribute('transform')||null,inscribed:!!circle,
          glyphId:host?.querySelector('.relphi-glyph-bubble')?.dataset.glyphId||null};
      };
      const zodiac=document.querySelector(root+'[data-layer="zodiac"] .sky-foundation-sign-glyph');
      const zodiacCircle=zodiac?.querySelector('.relphi-glyph-bubble > circle');
      const angle=document.querySelector(root+'[data-layer="placements"] [data-angle-axis="true"]');
      return{
        wheelViewBox:wheel?.getAttribute('viewBox'),wheelSpec:wheel?.dataset.wheelSpec,
        sunA:inspect('[data-layer="placements"] > g[data-sky="A"][data-placement="sun"]'),
        sunB:inspect('[data-layer="placements"] > g[data-sky="B"][data-placement="sun"]'),
        moonA:inspect('[data-layer="placements"] > g[data-sky="A"][data-placement="moon"]'),
        zodiacRadius:Number(zodiacCircle?.getAttribute('r')),
        zodiacOpacity:zodiacCircle?.style.opacity,
        angleWidth:Number(angle?.querySelector('rect')?.getAttribute('width')),
        rowGlyphViewBox:document.querySelector('#skyFoundationA .sky-foundation-row svg')?.getAttribute('viewBox')
      };
    });
    const expected=mobile?27.75:18.5;
    assert.equal(state.sunA.radius,expected,name+' changes only canonical circled placement scale');
    assert.equal(state.moonA.radius,expected,name+' also sizes Moon');
    if(compare)assert.equal(state.sunB.radius,expected,name+' sizes both skies alike');
    assert.equal(state.zodiacRadius,24,name+' preserves uncircled zodiac glyph scale');
    assert.equal(state.zodiacOpacity,'0',name+' does not inscribe zodiac glyphs');
    assert.equal(state.angleWidth,38,name+' does not resize rectangular chart angles');
    assert.equal(state.rowGlyphViewBox,'-20 -20 40 40',name+' preserves Sky Card glyph scale');
    assert.equal(state.wheelSpec,'relphi-sky-wheel-v1',name+' preserves wheel specification');
    if(compare)assert.equal(state.wheelViewBox,'0 0 1200 1200',name+' preserves wheel geometry');
    await page.screenshot({path:'sky-inscribed-glyph-'+name+'.png',fullPage:true});
    const moon=page.locator('#skyFoundationWheelMount [data-layer="placements"] > g[data-sky="A"][data-placement="moon"]');
    await moon.click({force:true});
    await page.waitForTimeout(200);
    assert.equal(await moon.evaluate(node=>node.classList.contains('is-selected')),true,
      name+' preserves placement tap/click selection');
    assert.deepEqual(errors,[],name+' has no uncaught browser errors');
    console.log('PASS '+name+' '+JSON.stringify(state));
    await context.close();
  }
} finally {await browser.close()}
