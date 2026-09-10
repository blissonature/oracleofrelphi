import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);return{name,longitude:value,sign:SIGNS[sign],degree,minute,second:0}};
function sample(name,offset,profile){
  const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,index)=>(asc+index*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Midheaven:76.28};
  return{name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{...profile,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))};
}
const skyA=sample('Alpha sky',0,{dateTime:'1985-10-08T04:37',instant:'1985-10-08T08:37:00.000Z',location:'Malden, Massachusetts, United States',locationQuery:'Malden, MA',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662});
const skyB=sample('Hospital sky',29.27,{dateTime:'2026-09-09T21:00',instant:'2026-09-10T03:00:00.000Z',location:'Tufts Medicine / Acadia Hospital, Malden Highlands, Malden, Middlesex County, Massachusetts, United States',locationQuery:'hospital, malden, ma',timeZone:'America/New_York',latitude:42.4251,longitude:-71.0662});

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:800}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b));localStorage.setItem('relphiSkyChartLastModeV1','comparison')},{a:skyA,b:skyB});
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
const panel=page.locator('#skyFoundationB');
await panel.scrollIntoViewIfNeeded();
await panel.locator('[data-sky-drawer-tab="where"]').click();
const editor=panel.locator('.sky-where-when-editor');
await editor.waitFor({state:'visible'});
await page.waitForSelector('#skyFoundationB [data-ww-heptagram-slot="B"][data-draft-heptagram-ready="true"] .sky-where-when-draft-heptagram',{timeout:20000});
await page.waitForTimeout(80);

const metrics=await editor.evaluate(form=>{
  const card=form.closest('.sky-foundation-panel');
  const body=form.querySelector('.sky-where-when-scroll-body');
  const when=form.querySelector('[data-ww-when]');
  const date=form.querySelector('[data-ww-field="date"]');
  const footer=form.querySelector('.sky-where-when-footer');
  const slot=form.querySelector('.sky-where-when-heptagram-slot');
  const heptagram=slot.querySelector('.sky-where-when-draft-heptagram');
  const confirm=footer.querySelector('button[type="submit"]');
  const cancel=footer.querySelector('.sky-where-when-cancel');
  const r=node=>node.getBoundingClientRect();
  const bodyRect=r(body),whenRect=r(when),dateRect=r(date);
  return{
    cardWidth:r(card).width,
    heptagramWidth:r(heptagram).width,
    heptagramHeight:r(heptagram).height,
    slotHeight:r(slot).height,
    footerHeight:r(footer).height,
    confirmClientWidth:confirm.clientWidth,
    confirmScrollWidth:confirm.scrollWidth,
    cancelWidth:r(cancel).width,
    confirmWidth:r(confirm).width,
    whenVisiblePixels:Math.max(0,Math.min(bodyRect.bottom,whenRect.bottom)-Math.max(bodyRect.top,whenRect.top)),
    dateStartsInsideBody:dateRect.top<bodyRect.bottom-4,
    bodyMaxHeight:parseFloat(getComputedStyle(body).maxHeight)||0
  };
});

console.log('WHERE_WHEN_LAYOUT_METRICS',JSON.stringify(metrics));
await panel.screenshot({path:'sky-chart-where-when-layout-density.png'});

assert.ok(metrics.cardWidth<=272,'Comparison Sky cards should remain in the narrow-card layout used by the screenshot.');
assert.ok(metrics.heptagramWidth>=174&&metrics.heptagramWidth<=178,`Footer heptagram should restore to about 176px, got ${metrics.heptagramWidth}.`);
assert.ok(metrics.heptagramHeight>=174&&metrics.heptagramHeight<=178,`Footer heptagram must have a square footprint, got ${metrics.heptagramWidth}×${metrics.heptagramHeight}.`);
assert.ok(metrics.slotHeight<210,`Heptagram slot should not reserve a large empty block, got ${metrics.slotHeight}px.`);
assert.ok(metrics.footerHeight<255,`Footer should stay compact enough to return vertical room to When, got ${metrics.footerHeight}px.`);
assert.ok(metrics.confirmScrollWidth<=metrics.confirmClientWidth+1,`Confirm label must fit inside its button (${metrics.confirmScrollWidth}/${metrics.confirmClientWidth}).`);
assert.ok(metrics.confirmWidth>metrics.cancelWidth*1.9,'Confirm action should keep the intended roughly 2× width of Cancel.');
assert.ok(metrics.whenVisiblePixels>=90,`At least the useful top of When should show without scrolling, got ${metrics.whenVisiblePixels}px.`);
assert.equal(metrics.dateStartsInsideBody,true,'The date field should begin inside the default visible Where/When scroll viewport.');
assert.ok(metrics.bodyMaxHeight>=390,`The scroll body should receive the space recovered from the footer, got max-height ${metrics.bodyMaxHeight}px.`);

assert.deepEqual(errors,[]);
await browser.close();
console.log('Where and When compact footer layout passed.');
