import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const point=(name,longitude)=>{const value=((longitude%360)+360)%360,within=value%30;return{name,longitude:value,sign:signs[Math.floor(value/30)],degree:Math.floor(within),minute:Math.floor((within%1)*60),second:0}};
function sky(name,offset,dateTime,instant,location,timeZone,latitude,longitude){
 const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
 const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Midheaven:76.28};
 return{name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{dateTime,instant,location,locationQuery:location,timeZone,latitude,longitude,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,point(k,v+offset)]))};
}
const a=sky('Past sky',0,'1985-10-08T04:37','1985-10-08T08:37:00Z','Malden, Massachusetts, United States','America/New_York',42.4251,-71.0662);
const b=sky('Second sky',29.27,'2026-08-27T08:00','2026-08-27T14:00:00Z','Salt Lake City, Utah, United States','America/Denver',40.7608,-111.891);
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},geolocation:{latitude:40.7608,longitude:-111.891},permissions:['geolocation'],timezoneId:'America/Denver'});
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
 await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
 await page.route('https://api.bigdatacloud.net/data/reverse-geocode-client**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({locality:'Salt Lake City',principalSubdivision:'Utah',countryName:'United States'})}));
 await page.route('https://api.open-meteo.com/v1/forecast**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({timezone:'America/Denver'})}));
 await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b));localStorage.setItem('relphiSkyChartLastModeV1','comparison')},{a,b});
 await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
 await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
 const tab=page.locator('#skyFoundationB [data-sky-drawer-tab="where"]');await tab.click();
 const form=page.locator('#skyFoundationB .sky-where-when-editor');await form.waitFor();
 const here=form.locator('[data-ww-field="here"]'),now=form.locator('[data-ww-field="now"]'),live=form.locator('[data-ww-field="live"]'),unknown=form.locator('[data-ww-field="time-unknown"]');
 assert.equal(await here.isChecked(),false);assert.equal(await now.isChecked(),false);assert.equal(await live.isChecked(),false);
 assert.equal(await form.locator('[data-ww-manual-where]').isVisible(),true);
 assert.equal(await form.locator('[data-ww-manual-when]').isVisible(),true);
 assert.equal(await form.locator('.sky-where-when-here-now').count(),0,'Old standalone button must be gone.');
 assert.equal(await unknown.isVisible(),true,'Time unknown belongs beside Now, even with the manual controls open.');
 const spacing=await form.evaluate(node=>{
   const rect=selector=>node.querySelector(selector)?.getBoundingClientRect();
   const centerY=r=>(r.top+r.bottom)/2;
   const whereChoice=rect('[data-ww-where] .sky-ww-choice'),whereRefresh=rect('[data-ww-action="refresh-here"]');
   const nowChoice=rect('[data-ww-when] .sky-ww-choice'),live=rect('[data-ww-field="live"]'),unknown=rect('[data-ww-when] .sky-ww-unknown');
   const row=rect('[data-ww-when] .sky-ww-mode-row'),localTime=rect('[data-ww-manual-when] .sky-where-when-grid > label:last-child');
   return{whereGap:whereRefresh.left-whereChoice.right,nowAlignment:Math.abs(centerY(live)-centerY(nowChoice)),unknownAlignment:Math.abs(centerY(unknown)-centerY(nowChoice)),unknownLeft:unknown.left,localTimeLeft:localTime.left,unknownOverflow:unknown.right-row.right};
 });
 assert.ok(spacing.whereGap>=0&&spacing.whereGap<=8,`Here refresh should sit immediately beside Here: ${JSON.stringify(spacing)}`);
 assert.equal(await form.locator('[data-ww-action="refresh-now"]').count(),0,'Now must not have a refresh button.');
 assert.ok(spacing.nowAlignment<=5,`Live should share the Now row: ${JSON.stringify(spacing)}`);
 assert.ok(Math.abs(spacing.unknownLeft-spacing.localTimeLeft)<=2,`Time unknown must align with the Local time field: ${JSON.stringify(spacing)}`);
 assert.equal(await live.locator('..').getAttribute('title'),null,'Do not show a duplicate browser-native tooltip.');
 assert.equal(await form.locator('[role="tooltip"]').count(),1,'Live must expose exactly one custom tooltip.');
 assert.match(await form.locator('[role="tooltip"]').textContent(),/continu(ally|ous)/i,'Live tooltip should explain ongoing updates.');
 assert.ok(await live.getAttribute('aria-describedby'),'Live must provide an accessible description.');
 assert.ok(spacing.unknownAlignment<=4,`Time unknown should share the Now row: ${JSON.stringify(spacing)}`);
 assert.ok(spacing.unknownOverflow<=1,`Unknown time must stay inside the row: ${JSON.stringify(spacing)}`);
 await unknown.check();
 assert.equal(await form.locator('[data-ww-field="time"]').isDisabled(),true,'Unknown time disables time entry.');
 assert.equal(await now.isChecked(),false);
 await unknown.uncheck();

 await page.waitForSelector('#skyFoundationB [data-draft-heptagram-ready="true"] .sky-where-when-draft-heptagram',{timeout:20000});
 const heptagramParity=await page.evaluate(()=>{
   const mini=document.querySelector('#skyFoundationB .sky-ph-heptagram:not(.sky-where-when-draft-heptagram)');
   const preview=document.querySelector('#skyFoundationB .sky-where-when-draft-heptagram');
   const sample=(svg,selector)=>{const node=svg?.querySelector(selector);if(!node)return null;const style=getComputedStyle(node);return{stroke:style.stroke,width:style.strokeWidth,dash:style.strokeDasharray,filter:style.filter,vectorEffect:style.vectorEffect}};
   return {
     previewCanonical:preview?.dataset.canonicalHeptagramReady,
     previewGray:sample(preview,'.sky-ph-hour-segment.future'),
     previewRed:sample(preview,'.sky-ph-week-segment.current'),
     previewPast:sample(preview,'.sky-ph-week-segment.past'),
     miniGray:sample(mini,'.sky-ph-hour-segment.future'),
     miniRed:sample(mini,'.sky-ph-week-segment.current')
   };
 });
 assert.equal(heptagramParity.previewCanonical,'true','Preview must use canonical planetary glyphs.');
 const uniformLine=(line,kind)=>{
   assert.ok(line,kind+' must exist');
   assert.equal(parseFloat(line.width),5,kind+' must use the unified 5-unit stroke');
   assert.equal(line.dash,'none',kind+' must not contain dashes');
   assert.equal(line.filter,'none',kind+' must not glow');
   assert.equal(line.vectorEffect,'none',kind+' scales in source coordinates');
 };
 for(const kind of ['previewGray','previewRed','previewPast','miniGray','miniRed'])uniformLine(heptagramParity[kind],kind);
 assert.equal(heptagramParity.previewGray.stroke,heptagramParity.miniGray.stroke,'Preview gray and miniheptagram gray must match.');
 assert.equal(heptagramParity.previewRed.stroke,heptagramParity.miniRed.stroke,'Preview red and miniheptagram red must match.');
 assert.equal(heptagramParity.previewRed.stroke,heptagramParity.previewPast.stroke,'Traced weekly paths must use the same red.');
 await form.screenshot({path:'sky-chart-here-now-manual-mobile.png'});
 const initial=await page.evaluate(()=>localStorage.getItem('relphiSkyChartB'));
 await here.check();
 await page.waitForFunction(()=>document.querySelector('#skyFoundationB [data-ww-here-value]')?.textContent.includes('Salt Lake City'));
 assert.equal(await now.isChecked(),false,'Here must not select Now');
 assert.equal(await form.locator('[data-ww-manual-where]').isHidden(),true);
 assert.equal(await form.locator('[data-ww-manual-when]').isVisible(),true);
 assert.equal(await page.evaluate(()=>localStorage.getItem('relphiSkyChartB')),initial,'Here must not commit.');
 await now.check();
 await page.waitForFunction(()=>document.querySelector('#skyFoundationB [data-ww-now-value]')?.textContent.includes('America/Denver'));
 assert.equal(await live.isChecked(),false,'Now should capture a fixed instant by default.');
 const captured=await form.getAttribute('data-now-instant');
 await page.waitForTimeout(1100);
 assert.equal(await form.getAttribute('data-now-instant'),captured,'Captured Now must remain fixed while Live is off.');
 assert.match(await form.locator('[data-ww-now-value]').textContent(),/Captured/);
 assert.equal(await form.locator('[data-ww-manual-when]').isHidden(),true);
 assert.equal(await form.locator('[data-ww-manual-where]').isHidden(),true);
 assert.equal(await unknown.isVisible(),true,'Time unknown must remain accessible from the compact choice row.');
 await unknown.check();
 assert.equal(await now.isChecked(),false,'Selecting Time unknown must exit Now mode.');
 assert.equal(await form.locator('[data-ww-manual-when]').isVisible(),true,'Unknown time restores the date entry.');
 await now.check();
 assert.equal(await unknown.isChecked(),false,'Selecting Now must clear Time unknown.');
 assert.equal(await form.locator('[data-ww-manual-when]').isHidden(),true);
 await live.check();
 assert.equal(await now.isChecked(),true);
 assert.match(await form.locator('[data-ww-now-value]').textContent(),/Live/);
 await live.uncheck();
 assert.equal(await now.isChecked(),true,'Turning Live off should hold Now rather than reverting to manual time.');
 const held=await form.getAttribute('data-now-instant');
 await page.waitForTimeout(1050);
 assert.equal(await form.getAttribute('data-now-instant'),held);
 await live.check();

 await page.waitForSelector('#skyFoundationB [data-draft-heptagram-ready="true"] .sky-where-when-draft-heptagram',{timeout:20000});
 await form.screenshot({path:'sky-chart-here-now-live-mobile.png'});
 assert.equal(await page.evaluate(()=>localStorage.getItem('relphiSkyChartB')),initial,'Now must not commit before confirmation.');
 await form.locator('button[type="submit"]').click();
 await page.waitForFunction(()=>{const m=JSON.parse(localStorage.getItem('relphiSkyChartB'))?.metadata;return m?.liveContinuous===true&&m?.liveNowOrigin==='use-now'},null,{timeout:15000});
 const committed=await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartB')));
 assert.equal(committed.calcProfile.timeZone,'America/Denver');
 assert.ok(Math.abs(Date.parse(committed.calcProfile.instant)-Date.now())<60000,'Committed Now must use the current instant.');
 assert.ok(committed.placements.Ascendant&&committed.placements.Midheaven);
 // The comparison wheel must remain painted during the asynchronous Live refresh.
 await page.waitForFunction(()=>document.documentElement.dataset.skyWheelStable==='true'&&document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel')!==null,null,{timeout:20000});
 const wheelBefore=await page.evaluate(()=>{
   const mount=document.getElementById('skyFoundationWheelMount'),wheel=mount.querySelector(':scope > .sky-foundation-wheel');
   if(!wheel||wheel.hasAttribute('data-single-sky'))throw new Error('Expected a comparison wheel for continuity testing.');
   if(getComputedStyle(mount).visibility!=='visible')throw new Error('The initial wheel is hidden.');
   window.__liveContinuity={wheelBefore:wheel,hidden:[],mutations:[],complete:false};
   const state=window.__liveContinuity;
   const sample=source=>{
     const w=mount.querySelector(':scope > .sky-foundation-wheel');
     const visible=getComputedStyle(mount).visibility==='visible'&&!!w;
     if(!visible)state.hidden.push(source);
   };
   state.observer=new MutationObserver(records=>{
     for(const record of records){
       if(record.type==='attributes'&&record.attributeName==='data-sky-wheel-stable'){
         state.mutations.push(document.documentElement.dataset.skyWheelStable||'absent');
       }
     }
     sample('mutation');
   });
   state.observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-sky-wheel-stable']});
   state.observer.observe(mount,{childList:true});
   state.interval=setInterval(()=>sample('sample'),8);
   return wheel.getAttribute('viewBox');
 });
 assert.ok(wheelBefore,'The comparison wheel should have a viewBox before the Live tick.');
 const beforeInstant=committed.calcProfile.instant;
 await page.evaluate(()=>{
   const key='relphiSkyChartB',sky=JSON.parse(localStorage.getItem(key));
   sky.calcProfile.instant=new Date(Date.now()-120000).toISOString();
   localStorage.setItem(key,JSON.stringify(sky));
   void window.RelphiSkyWhereWhen.refreshContinuous('B');
 });
 await page.waitForFunction(previous=>{
   const sky=JSON.parse(localStorage.getItem('relphiSkyChartB'));
   return sky.calcProfile.instant!==previous&&Math.abs(Date.parse(sky.calcProfile.instant)-Date.now())<45000;
 },beforeInstant,{timeout:20000});
 await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel')!==window.__liveContinuity?.wheelBefore,null,{timeout:20000});
 const continuity=await page.evaluate(()=>{
   const state=window.__liveContinuity;
   clearInterval(state.interval);state.observer.disconnect();
   const mount=document.getElementById('skyFoundationWheelMount');
   return{hidden:state.hidden,mutations:state.mutations,stable:document.documentElement.dataset.skyWheelStable,visibility:getComputedStyle(mount).visibility,
     wheelPresent:!!mount.querySelector(':scope > .sky-foundation-wheel')};
 });
 assert.deepEqual(continuity.hidden,[],'Live updates must never expose an empty or invisible wheel.');
 assert.equal(continuity.mutations.includes('absent'),false,'The wheel-stability gate must remain open during Live updates.');
 assert.equal(continuity.stable,'true','Wheel remains stable after the live update.');
 assert.equal(continuity.visibility,'visible');
 assert.equal(continuity.wheelPresent,true);
 // Turning Live off must make a stored snapshot that does not recalculate.
 for(let i=0;i<3;i++){
   const prompt=page.locator('#skyWhereWhenNamePrompt:not([hidden])');
   if(await prompt.count())await prompt.locator('[data-sky-name-cancel]').click();
 }
 await tab.click();
 const fixedForm=page.locator('#skyFoundationB .sky-where-when-editor');
 await fixedForm.waitFor();
 assert.equal(await fixedForm.locator('[data-ww-field="now"]').isChecked(),true);
 assert.equal(await fixedForm.locator('[data-ww-field="live"]').isChecked(),true);
 await fixedForm.locator('[data-ww-field="live"]').uncheck();
 const frozenMoment=await fixedForm.getAttribute('data-now-instant');
 assert.ok(Date.parse(frozenMoment)>0);
 await fixedForm.locator('button[type="submit"]').click();
 await page.waitForFunction(()=>!!JSON.parse(localStorage.getItem('relphiSkyChartB'))?.metadata?.capturedNowAt,null,{timeout:15000});
 const fixed=await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartB')));
 assert.equal(fixed.metadata.liveContinuous,undefined,'Fixed Now must not retain live mode.');
 assert.equal(fixed.metadata.liveNowOrigin,undefined,'Fixed Now must not retain a live origin.');
 assert.equal(fixed.metadata.capturedNowAt,frozenMoment,'Fixed Now must preserve the instant of turning Live off.');
 assert.equal(fixed.calcProfile.instant,frozenMoment,'Chart positions must be calculated for the held instant.');
 await page.evaluate(()=>window.RelphiSkyWhereWhen.refreshContinuous('B'));
 await page.waitForTimeout(300);
 assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartB')))).calcProfile.instant,frozenMoment,'A captured snapshot must not automatically refresh.');
 assert.deepEqual(errors,[],'No uncaught page errors.');
 console.log('Here/Now alignment, tooltip, Live updates, and fixed captured snapshot passed.');
} finally{await browser.close()}
