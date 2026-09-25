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
await page.waitForSelector('#skyFoundationFocus',{timeout:10000});
await page.waitForSelector('#skyFoundationFocus #skyChartWheelCopy',{timeout:10000});
const comparisonLayout=await page.locator('#skyFoundationComparison').evaluate(node=>{
  const heading=node.querySelector('#skyFoundationFocus>.sky-foundation-focus-heading');
  const actions=heading?.querySelector('.sky-export-wheel-slot');
  const hr=heading?.getBoundingClientRect(),ar=actions?.getBoundingClientRect(),style=actions?getComputedStyle(actions):null;
  return{
    firstId:node.firstElementChild?.id||'',
    secondId:node.firstElementChild?.nextElementSibling?.id||'',
    titleBarCount:node.querySelectorAll(':scope>.sky-foundation-heading').length,
    zodiacLabel:[...node.querySelectorAll(':scope>*')].some(child=>child.textContent?.trim()==='Zodiac Wheel'),
    wheelCopyInFocus:!!node.querySelector('#skyFoundationFocus .sky-focus-heading-controls #skyChartWheelCopy'),
    wheelDownloadInFocus:!!node.querySelector('#skyFoundationFocus .sky-focus-heading-controls #skyChartWheelExport'),
    wheelActionsRightGap:hr&&ar?hr.right-ar.right:null,
    wheelActionsOrder:style?.order||''
  };
});
assert.equal(comparisonLayout.firstId,'skyFoundationFocus','Focus must be the first visible section in the comparison panel.');
assert.equal(comparisonLayout.secondId,'skyFoundationWheelMount','The wheel must follow Focus directly.');
assert.equal(comparisonLayout.titleBarCount,0,'The separate Zodiac Wheel title bar must be removed.');
assert.equal(comparisonLayout.zodiacLabel,false,'The visual Zodiac Wheel label must not return.');
assert.equal(comparisonLayout.wheelCopyInFocus,true,'Wheel Copy must move into the Focus heading.');
assert.equal(comparisonLayout.wheelDownloadInFocus,true,'Wheel Download must move into the Focus heading.');
assert.ok(comparisonLayout.wheelActionsRightGap!==null&&comparisonLayout.wheelActionsRightGap<=12,'Wheel Copy and Download must sit on the far-right edge of the Focus panel.');
assert.equal(comparisonLayout.wheelActionsOrder,'999','Wheel actions must stay after the other Focus controls regardless of initialization order.');

await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(100);
const mobileFocusLayout=await page.locator('#skyFoundationFocus>.sky-foundation-focus-heading').evaluate(heading=>{
  const r=node=>node?.getBoundingClientRect();
  const title=r(heading.querySelector('h2'));
  const actions=r(heading.querySelector('.sky-export-wheel-slot'));
  const display=r(heading.querySelector('[data-relationship-display-control]'));
  const harmonic=r(heading.querySelector('[data-orb-field="true"]'));
  const hr=r(heading);
  return{
    titleTop:title?.top??null,
    actionsTop:actions?.top??null,
    displayTop:display?.top??null,
    harmonicTop:harmonic?.top??null,
    firstRowBottom:Math.max(title?.bottom||0,actions?.bottom||0),
    secondRowTop:Math.min(display?.top??Infinity,harmonic?.top??Infinity),
    actionsRightGap:hr&&actions?hr.right-actions.right:null,
    height:hr?.height??null
  };
});
assert.ok(Math.abs(mobileFocusLayout.titleTop-mobileFocusLayout.actionsTop)<=4,'On mobile, Copy and Download must share the Focus title row.');
assert.ok(Math.abs(mobileFocusLayout.displayTop-mobileFocusLayout.harmonicTop)<=4,'On mobile, Display and Harmonic Window must share the second row.');
assert.ok(mobileFocusLayout.secondRowTop>mobileFocusLayout.firstRowBottom,'The selector row must sit below the Focus title/action row.');
assert.ok(mobileFocusLayout.actionsRightGap!==null&&mobileFocusLayout.actionsRightGap<=12,'Mobile Copy and Download must remain right-aligned.');
assert.ok(mobileFocusLayout.height<105,'Focus should remain a compact two-row header on mobile.');
await page.setViewportSize({width:1440,height:800});
await page.waitForTimeout(80);

const panel=page.locator('#skyFoundationB');
await panel.scrollIntoViewIfNeeded();
await panel.locator('[data-sky-drawer-tab="where"]').click();
const editor=panel.locator('.sky-where-when-editor');
await editor.waitFor({state:'visible'});
await page.waitForSelector('#skyFoundationB [data-ww-heptagram-slot="B"][data-draft-heptagram-ready="true"] .sky-where-when-draft-heptagram',{timeout:20000});
await page.waitForTimeout(80);

const jump=editor.locator('.sky-where-when-heptagram-slot > .sky-ph-jump[data-draft-where-when-link="true"]');
assert.equal(await jump.count(),1,'Draft Planetary Hours preview should be one link block.');
assert.equal(await jump.evaluate(node=>node.tagName),'A');
assert.equal(await jump.locator('.sky-where-when-draft-heptagram').count(),1,'The heptagram must live inside the Planetary Hours link.');
assert.equal((await jump.locator('.sky-ph-jump-title').textContent()).trim(),'Jump to this time in Planetary Hours');
assert.equal(await editor.locator('.sky-where-when-ph-jump').count(),0,'The old separate brown text link must not return.');

const metrics=await editor.evaluate(form=>{
  const card=form.closest('.sky-foundation-panel');
  const body=form.querySelector('.sky-where-when-scroll-body');
  const where=form.querySelector('[data-ww-where]');
  const when=form.querySelector('[data-ww-when]');
  const date=form.querySelector('[data-ww-field="date"]');
  const time=form.querySelector('[data-ww-field="time"]');
  const search=form.querySelector('[data-ww-field="location-query"]');
  const footer=form.querySelector('.sky-where-when-footer');
  const slot=form.querySelector('.sky-where-when-heptagram-slot');
  const heptagram=slot.querySelector('.sky-where-when-draft-heptagram');
  const confirm=footer.querySelector('button[type="submit"]');
  const cancel=footer.querySelector('.sky-where-when-cancel');
  const r=node=>node.getBoundingClientRect();
  const formRect=r(form),bodyRect=r(body),whereRect=r(where),whenRect=r(when),dateRect=r(date),timeRect=r(time),searchRect=r(search);
  const formStyle=getComputedStyle(form);
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
    bodyMaxHeight:parseFloat(getComputedStyle(body).maxHeight)||0,
    scrollbarGutter:getComputedStyle(body).scrollbarGutter,
    expectedContentRight:formRect.right-(parseFloat(formStyle.paddingRight)||0),
    whereRight:whereRect.right,
    whenRight:whenRect.right,
    searchRight:searchRect.right,
    timeRight:timeRect.right,
    timeClientWidth:time.clientWidth,
    timeScrollWidth:time.scrollWidth
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
assert.equal(metrics.scrollbarGutter,'auto','Where/When must not reserve a permanent scrollbar lane in a narrow Sky card.');
assert.ok(Math.abs(metrics.expectedContentRight-metrics.whereRight)<=1.5,`Where should use the full editor content width; right gap is ${metrics.expectedContentRight-metrics.whereRight}px.`);
assert.ok(Math.abs(metrics.expectedContentRight-metrics.whenRight)<=1.5,`When should use the full editor content width; right gap is ${metrics.expectedContentRight-metrics.whenRight}px.`);
assert.ok(metrics.searchRight<=metrics.expectedContentRight+1.5,'Location search field must remain inside the reclaimed content width.');
assert.ok(metrics.timeRight<=metrics.expectedContentRight+1.5,'Time field must remain inside the reclaimed content width.');
assert.ok(metrics.timeScrollWidth<=metrics.timeClientWidth+1,'Time control content must not be clipped horizontally.');

assert.deepEqual(errors,[]);
await browser.close();
console.log('Where and When compact footer and full-width narrow-card layout passed.');
