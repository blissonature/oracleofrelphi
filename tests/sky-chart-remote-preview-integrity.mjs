import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const ref=process.env.PREVIEW_REF;
assert.match(ref||'',/^[0-9a-f]{40}$/,'A commit SHA is required');
const urls=[
  ['preview',`https://oracleofrelphi.com/sky-chart-preview/sky-chart.html?ref=${ref}`],
  ['deployed', 'https://oracleofrelphi.com/sky-chart.html']
];
const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function point(name,degree){const value=((degree%360)+360)%360;return{name,longitude:value,sign:signs[Math.floor(value/30)],degree:Math.floor(value%30),minute:Math.floor((value%1)*60)}}
function sky(name,offset,instant,location,lat,lon,tz){
 const asc=168.38+offset,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
 const points={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:asc,Midheaven:76.28};
 return {name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{dateTime:instant.slice(0,16),instant,location,locationQuery:location,timeZone:tz,latitude:lat,longitude:lon,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(points).map(([k,v])=>[k,point(k,v+offset)]))};
}
const a=sky('Test A',0,'1985-10-08T08:37:00Z','Malden, Massachusetts, United States',42.4251,-71.0662,'America/New_York');
const b=sky('Test B',29,'2026-10-17T12:00:00Z','Salt Lake City, Utah, United States',40.7608,-111.891,'America/Denver');
const browser=await chromium.launch({headless:true});
let failed=false;
try{
 for(const [kind,url] of urls){
  const ctx=await browser.newContext({viewport:{width:1200,height:820},serviceWorkers:'block'});
  const page=await ctx.newPage(),failures=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>failures.push({url:r.url(),error:r.failure()?.errorText}));
  page.on('response',response=>{if(response.status()>=400)failures.push({status:response.status(),url:response.url()})});
  await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b));localStorage.setItem('relphiSkyChartLastModeV1','comparison')},{a,b});
  try{
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});
   await page.waitForTimeout(15000);
   const state=await page.evaluate(()=>{const mount=document.querySelector('#skyFoundationWheelMount'),root=document.querySelector('#skyFoundationRoot'),wheel=mount?.querySelector('.sky-foundation-wheel');return{
    href:location.href,base:document.baseURI,rootBusy:root?.getAttribute('aria-busy'),bodyWidth:document.body?.scrollWidth,
    mountVisible:mount?getComputedStyle(mount).visibility:null,
    wheelCount:mount?.querySelectorAll('.sky-foundation-wheel').length??0,
    wheelOuter:wheel?.outerHTML.slice(0,240)??null,
    status:document.getElementById('previewStatus')?.textContent?.slice(0,250)??null,
    styles:[...document.styleSheets].length,scripts:document.scripts.length,
    text:document.body?.innerText?.slice(0,300)
   }});
   console.log(kind.toUpperCase(),JSON.stringify({state,errors:errors.slice(0,15),failures:failures.slice(0,30)}));
   await page.screenshot({path:`sky-remote-${kind}.png`,fullPage:true});
   if(kind==='preview'&&(!state.wheelCount||state.mountVisible==='hidden'||state.rootBusy!=='false'||errors.length)){failed=true;console.error('FAILED: hosted exact-revision preview did not display a ready wheel');}
   if(kind==='preview'&&!failed){
     await page.locator('#skyFoundationB [data-sky-drawer-tab="where"]').click();
     await page.waitForSelector('#skyFoundationB .sky-where-when-editor [data-ww-action="refresh-now"]',{timeout:15000});
     await page.waitForSelector('#skyFoundationB [data-draft-heptagram-ready="true"] .sky-where-when-draft-heptagram',{timeout:20000});
     const detail=await page.evaluate(()=>{
       const hepta=document.querySelector('#skyFoundationB .sky-where-when-draft-heptagram');
       const future=hepta?.querySelector('.sky-ph-week-segment.future');
       const current=hepta?.querySelector('.sky-ph-week-segment.current');
       const read=n=>{if(!n)return null;const cs=getComputedStyle(n);return{color:cs.stroke,width:cs.strokeWidth,dash:cs.strokeDasharray}};
       const mount=document.getElementById('skyFoundationWheelMount');
       return{canonical:hepta?.dataset.canonicalHeptagramReady,nowRefresh:!!document.querySelector('#skyFoundationB .sky-where-when-editor [data-ww-action="refresh-now"]'),liveToggle:!!document.querySelector('#skyFoundationB .sky-where-when-editor [data-ww-field="live"]'),
         future:read(future),current:read(current),wheelVisible:getComputedStyle(mount).visibility};
     });
     console.log('PREVIEW WHERE/WHEN DESIGN',JSON.stringify(detail));
     assert.equal(detail.canonical,'true');
     assert.equal(detail.nowRefresh,true);
     assert.equal(detail.liveToggle,false);
     assert.equal(detail.wheelVisible,'visible');
     assert.equal(detail.future?.dash,'none');
     assert.equal(detail.current?.dash,'none');
     assert.equal(parseFloat(detail.future?.width),5);
     assert.equal(parseFloat(detail.current?.width),5);
     await page.screenshot({path:'sky-remote-preview-open.png',fullPage:true});
   }
  }catch(e){failed=true;console.error(kind+' FAILED '+e.message);await page.screenshot({path:`sky-remote-${kind}.png`,fullPage:true}).catch(()=>{})}
  await ctx.close();
 }
 // Exercise the actual exact revision in Learn at desktop and mobile sizes.
 for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
  const ctx=await browser.newContext({viewport,serviceWorkers:'block',hasTouch:viewport.width<600});
  const page=await ctx.newPage();
  try{
   await page.addInitScript(()=>localStorage.setItem('relphiSkyChartLastModeV1','learn'));
   await page.goto(urls[0][1],{waitUntil:'domcontentloaded',timeout:25000});
   const focus=page.locator('#skyFoundationFocus');
   await focus.locator('[data-zodiac-summary]').waitFor({state:'visible',timeout:20000});
   const header=await focus.evaluate(el=>{
     const rect=s=>{const r=el.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}};
     return {brand:rect('.sky-chart-page-brand'),modes:rect('.sky-sky-mode-selector'),controls:rect('.sky-focus-heading-controls'),asc:rect('.sky-learn-ascendant'),signs:rect('[data-zodiac-filter]')};
   });
   assert.ok(header.brand.top<header.modes.bottom&&header.modes.top<header.brand.bottom,'Mode selector must share brand row');
   if(viewport.width>=1050)assert.ok(header.asc.top<header.controls.bottom&&header.controls.top<header.asc.bottom,'Ascendant and Focus controls must share second row');
   const trigger=focus.locator('#skyLearnAscendantSelect');
   await trigger.click();
   const menu=page.locator('#skyLearnAscendantMenu');
   await menu.waitFor({state:'visible'});
   assert.equal(await menu.getByRole('option').count(),12);
   assert.equal(await menu.locator('.sky-chart-zodiac-filter-glyph svg').count(),12);
   await menu.getByRole('option',{name:'Aquarius · Bucket'}).click();
   assert.equal(await trigger.getAttribute('data-selected-sign'),'10');
   await focus.locator('[data-ascendant-step="1"]').click();
   assert.equal(await trigger.getAttribute('data-selected-sign'),'11');
   await focus.locator('[data-zodiac-summary]').click();
   await page.locator('#skyChartZodiacFilterMenu').waitFor({state:'visible'});
   assert.equal(await page.locator('#skyChartZodiacFilterMenu input[type=checkbox]').count(),12);
   await page.keyboard.press('Escape');
   await page.screenshot({path:'sky-remote-learn-'+viewport.width+'.png',fullPage:true});
   console.log('LEARN TOOLBAR',viewport.width,JSON.stringify(header));
  }catch(e){failed=true;console.error('LEARN '+viewport.width+' FAILED '+e.message)}
  finally{await ctx.close()}
 }
}finally{await browser.close()}
if(failed)process.exitCode=1;
