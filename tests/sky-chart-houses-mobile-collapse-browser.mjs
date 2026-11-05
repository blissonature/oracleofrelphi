import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function sky(name,shift){
 const cusps=Array.from({length:12},(_,i)=>(168.38+shift+i*30)%360);
 const source={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,
   Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28};
 return{name,houseCusps:cusps,houseSystem:'equal-house',
   calcProfile:{dateTime:'2026-10-25T04:00',instant:'2026-10-25T10:00:00.000Z',latitude:40.76,longitude:-111.89,timeZone:'America/Denver',houseCusps:cusps,houseSystem:'equal-house'},
   placements:Object.fromEntries(Object.entries(source).map(([key,value])=>{
     const longitude=(value+shift)%360,d=longitude%30;
     return[key,{name:key,longitude,sign:SIGNS[Math.floor(longitude/30)],degree:Math.floor(d),minute:Math.floor((d%1)*60)}];
   }))};
}
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:740},isMobile:true,hasTouch:true,timezoneId:'America/Denver'});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',r=>r.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
 await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',r=>r.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
 await page.route('https://nominatim.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
 await page.addInitScript(({a,b})=>{
   localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
   localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
   localStorage.setItem('relphiSkyChartLastModeV1','comparison');
 },{a:sky('Sky A',0),b:sky('Sky B',29.27)});
 await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
 const opener=page.locator('[data-house-filter="combined"] [data-house-filter-toggle]');
 await opener.waitFor({state:'visible',timeout:20000});await opener.click();
 const menu=page.locator('#skyChartHousePopover'),collapse=menu.locator('[data-house-filter-collapse]');
 await collapse.waitFor({state:'visible'});
 assert.equal(await opener.getAttribute('aria-expanded'),'true');
 const geometry=await collapse.evaluate(button=>{
   const menu=button.closest('#skyChartHousePopover'),rect=button.getBoundingClientRect();
   menu.scrollTop=menu.scrollHeight;
   const after=button.getBoundingClientRect();
   return{sticky:getComputedStyle(button).position,top:after.top,screenHeight:innerHeight,
     minHeight:rect.height,menuBottom:menu.getBoundingClientRect().bottom};
 });
 assert.equal(geometry.sticky,'sticky','Collapse title stays pinned while checklist scrolls');
 assert.ok(geometry.top>=0&&geometry.top<geometry.screenHeight&&geometry.minHeight>=44,
   'The mobile collapse header must remain onscreen and touch-sized: '+JSON.stringify(geometry));
 await collapse.click();
 assert.equal(await menu.isHidden(),true,'Tap on Houses header must collapse the portaled checklist');
 assert.equal(await opener.getAttribute('aria-expanded'),'false');
 assert.equal((await opener.textContent()).trim(),'⌄','Closed filter must show downward chevron');
 await opener.click();assert.equal(await menu.isVisible(),true,'Houses can reopen after collapsing');
 await collapse.click();assert.equal(await menu.isHidden(),true,'Houses can close repeatedly');
 assert.deepEqual(errors,[],'No browser errors');
 console.log('PASS: iPhone Houses popover has a sticky, touch-sized title+chevron collapse button; toggles and reopens.');
} finally {await browser.close()}
