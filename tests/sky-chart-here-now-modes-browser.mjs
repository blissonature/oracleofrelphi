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
 await page.addInitScript(({a,b})=>{
  if(localStorage.getItem('relphiSkyChartA')===null)localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
  if(localStorage.getItem('relphiSkyChartB')===null)localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
  localStorage.setItem('relphiSkyChartLastModeV1','comparison');
 },{a,b});
 await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
 await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
 const tab=page.locator('#skyFoundationB [data-sky-drawer-tab="where"]');await tab.click();
 const form=page.locator('#skyFoundationB .sky-where-when-editor');await form.waitFor();
 const here=form.locator('[data-ww-field="here"]'),now=form.locator('[data-ww-field="now"]'),refresh=form.locator('[data-ww-action="refresh-now"]'),unknown=form.locator('[data-ww-field="time-unknown"]');
 // A blank Sky must offer When controls and the one-click action immediately.
 // Verify the authored footer contract in the open editor at mobile card width.
 const footerInitially=await form.evaluate(node=>{
   const row=node.querySelector('.sky-where-when-footer-actions');
   return{labels:[...row.querySelectorAll('button')].map(button=>button.textContent.trim()),
     columns:getComputedStyle(row).gridTemplateColumns.split(' ').length};
 });
 assert.deepEqual(footerInitially.labels,['Cancel','Use This Where and When']);
 assert.equal(footerInitially.columns,2,'The footer must contain only the original Cancel and Use buttons.');
 const topOrder=await form.evaluate(node=>{
   const body=node.querySelector('.sky-where-when-scroll-body');
   const relevant=[...body.children].filter(el=>el.matches('.sky-where-when-one-click,[data-ww-where],[data-ww-when],[data-ww-heptagram-slot]'));
   const button=body.querySelector('.sky-where-when-one-click');
   return{order:relevant.map(el=>el.dataset.wwAction==='here-and-now'?'here-and-now':el.hasAttribute('data-ww-where')?'where':el.hasAttribute('data-ww-when')?'when':'heptagram'),
     buttonCount:node.querySelectorAll('[data-ww-action="here-and-now"]').length,
     buttonIcon:!!button?.querySelector('svg'),
     buttonVisible:button?.getBoundingClientRect().height>0};
 });
 assert.equal(topOrder.buttonCount,1,'One-click Here and Now must exist exactly once.');
 assert.deepEqual(topOrder.order,['here-and-now','where','when','heptagram']);
 assert.equal(topOrder.buttonIcon,true,'The single button must contain its refresh icon.');
 assert.equal(topOrder.buttonVisible,true,'The top action must be visible.');

 assert.equal(await here.isChecked(),false);assert.equal(await now.isChecked(),false);
 assert.equal(await form.locator('[data-ww-field="live"]').count(),0,'Live toggle must be absent.');
 assert.equal(await form.locator('[role="tooltip"]').count(),0,'Live tooltip must be absent.');
 assert.equal(await form.locator('[data-ww-manual-where]').isVisible(),true);
 assert.equal(await form.locator('[data-ww-manual-when]').isVisible(),true);
 assert.equal(await refresh.count(),1,'Now must have a single refresh button.');
 const spacing=await form.evaluate(node=>{
   const rect=selector=>node.querySelector(selector)?.getBoundingClientRect();
   const centerY=r=>(r.top+r.bottom)/2;
   const whereChoice=rect('[data-ww-where] .sky-ww-choice'),whereRefresh=rect('[data-ww-action="refresh-here"]');
   const nowChoice=rect('[data-ww-when] .sky-ww-choice'),nowRefresh=rect('[data-ww-action="refresh-now"]'),unknown=rect('[data-ww-when] .sky-ww-unknown');
   const row=rect('[data-ww-when] .sky-ww-mode-row'),localTime=rect('[data-ww-manual-when] .sky-where-when-grid > label:last-child');
   return{
     whereGap:whereRefresh.left-whereChoice.right,nowGap:nowRefresh.left-nowChoice.right,
     nowAlignment:Math.abs(centerY(nowRefresh)-centerY(nowChoice)),
     unknownAlignment:Math.abs(centerY(unknown)-centerY(nowChoice)),
     unknownLeft:unknown.left,localTimeLeft:localTime.left,unknownOverflow:unknown.right-row.right
   };
 });
 assert.ok(spacing.whereGap>=0&&spacing.whereGap<=8,JSON.stringify(spacing));
 assert.ok(spacing.nowGap>=0&&spacing.nowGap<=8,JSON.stringify(spacing));
 assert.ok(spacing.nowAlignment<=5,JSON.stringify(spacing));
 assert.ok(spacing.unknownAlignment<=4,JSON.stringify(spacing));
 assert.ok(Math.abs(spacing.unknownLeft-spacing.localTimeLeft)<=2,JSON.stringify(spacing));
 assert.ok(spacing.unknownOverflow<=1,JSON.stringify(spacing));
 assert.equal(await refresh.getAttribute('aria-label'),'Refresh current instant');
 await unknown.check();
 assert.equal(await form.locator('[data-ww-field="time"]').isDisabled(),true);
 assert.equal(await now.isChecked(),false);
 await unknown.uncheck();

 await page.waitForSelector('#skyFoundationB [data-draft-heptagram-ready="true"] .sky-where-when-draft-heptagram',{timeout:20000});
 const parity=await page.evaluate(()=>{
   const mini=document.querySelector('#skyFoundationB .sky-ph-heptagram:not(.sky-where-when-draft-heptagram)');
   const draft=document.querySelector('#skyFoundationB .sky-where-when-draft-heptagram');
   const sample=(svg,selector)=>{const el=svg?.querySelector(selector);if(!el)return null;const cs=getComputedStyle(el);return{stroke:cs.stroke,width:cs.strokeWidth,dash:cs.strokeDasharray}};
   return {canonical:draft?.dataset.canonicalHeptagramReady,gray:sample(draft,'.sky-ph-hour-segment.future'),red:sample(draft,'.sky-ph-week-segment.current'),miniGray:sample(mini,'.sky-ph-hour-segment.future'),miniRed:sample(mini,'.sky-ph-week-segment.current')};
 });
 const rulers=await form.locator('[data-planetary-rulers="true"]').evaluate(node=>({
   day:node.querySelector('[data-role="day"]')?.textContent,
   hour:node.querySelector('[data-role="hour"]')?.textContent,
   icons:[...node.querySelectorAll('.sky-ww-planetary-ruler-art')].map(svg=>svg.querySelector('[data-canonical-glyph-id]')!==null),
   order:node.compareDocumentPosition(node.parentElement.querySelector('.sky-where-when-draft-heptagram'))&4
 }));
 assert.match(rulers.day,/ Day$/);
 assert.match(rulers.hour,/ Hour$/);
 assert.equal(rulers.order,4,'Ruler labels precede heptagram.');
 assert.equal(parity.canonical,'true');
 for(const k of ['gray','red','miniGray','miniRed']){assert.equal(parseFloat(parity[k]?.width),5);assert.equal(parity[k]?.dash,'none')}
 assert.equal(parity.gray.stroke,parity.miniGray.stroke);
 assert.equal(parity.red.stroke,parity.miniRed.stroke);
 await form.screenshot({path:'sky-chart-here-now-manual-mobile.png'});
 const initial=await page.evaluate(()=>localStorage.getItem('relphiSkyChartB'));
 await here.check();
 await page.waitForFunction(()=>document.querySelector('#skyFoundationB [data-ww-here-value]')?.textContent.includes('Salt Lake City'));
 assert.equal(await now.isChecked(),false,'Here does not select Now');
 assert.equal(await page.evaluate(()=>localStorage.getItem('relphiSkyChartB')),initial,'Here must not commit.');
 await refresh.click();
 assert.equal(await now.isChecked(),true,'Now refresh also selects Now when needed.');
 assert.match(await form.locator('[data-ww-now-value]').textContent(),/Captured.*America\/Denver/);
 const first=await form.getAttribute('data-now-instant');
 assert.ok(Date.parse(first)>0);
 await page.waitForTimeout(1150);
 assert.equal(await form.getAttribute('data-now-instant'),first,'Now does not advance by itself.');
 assert.equal(await page.evaluate(()=>localStorage.getItem('relphiSkyChartB')),initial);
 await refresh.click();
 const second=await form.getAttribute('data-now-instant');
 assert.ok(Date.parse(second)>Date.parse(first),'Refresh must capture a newer instant.');
 await page.waitForTimeout(1100);
 assert.equal(await form.getAttribute('data-now-instant'),second,'Refreshed instant must stay fixed.');
 assert.equal(await page.evaluate(()=>localStorage.getItem('relphiSkyChartB')),initial,'Refresh must not commit before confirmation.');
 await unknown.check();
 assert.equal(await now.isChecked(),false,'Unknown time exits Now.');
 assert.equal(await form.locator('[data-ww-manual-when]').isVisible(),true);
 await refresh.click();
 assert.equal(await unknown.isChecked(),false,'Refreshing Now clears unknown time.');
 assert.equal(await now.isChecked(),true);
 const selectedInstant=await form.getAttribute('data-now-instant');
 await page.waitForSelector('#skyFoundationB [data-draft-heptagram-ready="true"] .sky-where-when-draft-heptagram',{timeout:20000});
 await form.screenshot({path:'sky-chart-here-now-refreshed-mobile.png'});
 await form.locator('button[type="submit"]').click();
 await page.waitForFunction(()=>!!JSON.parse(localStorage.getItem('relphiSkyChartB'))?.metadata?.capturedNowAt,null,{timeout:15000});
 const committed=await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartB')));
 assert.equal(committed.metadata.capturedNowAt,selectedInstant);
 assert.equal(committed.calcProfile.instant,selectedInstant);
 assert.equal(committed.calcProfile.timeZone,'America/Denver');
 assert.equal(committed.metadata.liveContinuous,undefined);
 assert.equal(committed.metadata.liveNowOrigin,undefined);
 assert.ok(committed.placements.Ascendant&&committed.placements.Midheaven);
 assert.equal(await page.evaluate(()=>window.RelphiSkyWhereWhen?.refreshContinuous),undefined);
 await page.waitForTimeout(1600);
 assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartB')))).calcProfile.instant,selectedInstant,'Confirmed Now stays fixed.');
 for(let i=0;i<3;i++){
   const prompt=page.locator('#skyWhereWhenNamePrompt:not([hidden])');
   if(await prompt.count())await prompt.locator('[data-sky-name-cancel]').click();
 }
 await tab.click();
 const reopened=page.locator('#skyFoundationB .sky-where-when-editor');await reopened.waitFor();
 assert.equal(await reopened.locator('[data-ww-field="now"]').isChecked(),true);
 assert.equal(await reopened.getAttribute('data-now-instant'),selectedInstant);
 await reopened.locator('[data-ww-action="refresh-now"]').click();
 const updated=await reopened.getAttribute('data-now-instant');
 assert.ok(Date.parse(updated)>Date.parse(selectedInstant));
 assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartB')))).calcProfile.instant,selectedInstant,'Refresh does not change committed sky until confirmation.');
 await reopened.locator('button[type="submit"]').click();
 await page.waitForFunction(instant=>JSON.parse(localStorage.getItem('relphiSkyChartB'))?.calcProfile?.instant===instant,updated,{timeout:15000});
 assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartB')))).metadata.capturedNowAt,updated);
 // Previously committed Live skies must be frozen without recalculation on reload.
 await page.evaluate(()=>{
  const key='relphiSkyChartB',sky=JSON.parse(localStorage.getItem(key));
  sky.metadata.liveContinuous=true;sky.metadata.liveNowOrigin='use-now';sky.metadata.liveNowAt=sky.calcProfile.instant;
  delete sky.metadata.capturedNowAt;
  localStorage.setItem(key,JSON.stringify(sky));
 });
 await page.reload({waitUntil:'networkidle'});
 await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
 const migrated=await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartB')));
 assert.equal(migrated.metadata.liveContinuous,undefined);
 assert.equal(migrated.metadata.liveNowOrigin,undefined);
 assert.equal(migrated.metadata.capturedNowAt,updated);
 assert.equal(migrated.calcProfile.instant,updated);
 // One-click Here and Now must capture both browser location and a fixed instant.
 await page.locator('#skyFoundationB [data-sky-drawer-tab="where"]').click();
 const oneClick=page.locator('#skyFoundationB .sky-where-when-editor');
 await oneClick.waitFor();
 const instantBeforeClick=Date.now();
 assert.equal(await oneClick.locator('[data-ww-action="here-and-now"]').count(),1);
 assert.deepEqual(await oneClick.locator('.sky-where-when-footer-actions button').allTextContents(),['Cancel','Use This Where and When']);
 await oneClick.locator('[data-ww-action="here-and-now"]').click();
 await page.waitForFunction(()=>{const sky=JSON.parse(localStorage.getItem('relphiSkyChartB'));return sky?.metadata?.capturedNowAt&&sky?.metadata?.whereWhenSource==='current-location'},null,{timeout:20000});
 const oneClickSky=await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartB')));
 assert.equal(oneClickSky.metadata.liveContinuous,undefined);
 assert.equal(oneClickSky.metadata.liveNowOrigin,undefined);
 assert.equal(oneClickSky.calcProfile.timeZone,'America/Denver');
 assert.ok(Math.abs(Date.parse(oneClickSky.calcProfile.instant)-instantBeforeClick)<60000);
 assert.equal(oneClickSky.calcProfile.instant,oneClickSky.metadata.capturedNowAt);
 assert.equal(oneClickSky.calcProfile.latitude,'40.7608');
 await page.waitForTimeout(1300);
 assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartB')))).calcProfile.instant,oneClickSky.calcProfile.instant,'Here and Now must not enable Live updates.');
 assert.deepEqual(errors,[],'No uncaught page errors.');
 console.log('Fixed Now: refresh captures a new instant, never auto-commits or advances; no Live; legacy skies freeze.');
}finally{await browser.close()}
