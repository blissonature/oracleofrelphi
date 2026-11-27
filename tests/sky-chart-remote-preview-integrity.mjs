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
   assert.equal(await focus.locator('.sky-foundation-focus-heading h2').count(),0,'No redundant Focus heading');
   const header=await focus.evaluate(el=>{
     const rect=s=>{const r=el.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}};
     return {brand:rect('.sky-chart-page-brand'),modes:rect('.sky-sky-mode-selector'),controls:rect('.sky-focus-heading-controls'),asc:rect('.sky-learn-ascendant'),signs:rect('[data-zodiac-filter]')};
   });
   assert.ok(header.brand.top<header.modes.bottom&&header.modes.top<header.brand.bottom,'Mode selector must share brand row');
   if(viewport.width>=1050)assert.ok(header.asc.top<header.controls.bottom&&header.controls.top<header.asc.bottom,'Ascendant and Focus controls must share second row');
   const trigger=focus.locator('#skyLearnAscendantSelect');
   const checkWheel=async()=>{
    const wheel=await page.locator('#skyFoundationWheelMount .sky-foundation-wheel[data-learn-ascendant]').evaluate(el=>{
     const layer=el.querySelector('[data-layer="a-houses"]');
     return {colors:[...layer.querySelectorAll('.sky-foundation-house-sector')].map(n=>n.getAttribute('fill')),opacity:[...layer.querySelectorAll('.sky-foundation-house-sector')].map(n=>Number(n.getAttribute('fill-opacity'))),dividers:[...layer.querySelectorAll('.sky-foundation-learn-divider')].map(n=>[getComputedStyle(n).stroke,getComputedStyle(n).strokeWidth]),palette:[...window.RelphiSkyWheelSpec.COLORS],expectedOpacity:window.RelphiSkyWheelSpec.comparison.houseFillOpacity};
    });
    assert.deepEqual(wheel.colors,wheel.palette);
    assert.ok(wheel.opacity.every(n=>n===wheel.expectedOpacity));
    assert.equal(wheel.dividers.length,12);
    assert.ok(wheel.dividers.every(([color,width])=>color==='rgb(0, 0, 0)'&&parseFloat(width)===1));
   };
   await page.locator('#skyFoundationWheelMount .sky-foundation-wheel[data-learn-ascendant]').waitFor({state:'visible'});
   await checkWheel();
   const core=page.locator('#skyFoundationLearnCore');
   const coreErrors=[];
   page.on('pageerror',e=>{coreErrors.push(e.message);console.log('CORE PAGE ERROR',e.message)});
   await core.getByRole('tab',{name:'Rulers',exact:true}).click();
   console.log('CORE RULERS STATE',JSON.stringify(await core.evaluate(el=>({tab:el.dataset.coreActiveTab,selected:el.querySelector('[aria-selected="true"]')?.textContent,key:el.querySelector('[data-core-structure]')?.dataset.structureKey,content:el.querySelector('[data-core-structure]')?.innerText,buttons:el.querySelectorAll('[data-core-ruler]').length,ready:!!window.RelphiSkyCardHitsStructure?.renderTemplate}))));
   await core.locator('[data-core-ruler="Mars"]').waitFor({state:'visible',timeout:5000});
   assert.equal(await core.locator('[data-core-ruler]').count(),7,'All seven rulers are available in Learn');
   assert.equal(await core.getByRole('tab',{name:'Rulers',exact:true}).getAttribute('aria-selected'),'true');
   await core.locator('[data-core-ruler="Mars"]').click();
   console.log('CORE RULER FOCUS',JSON.stringify(await core.evaluate(el=>({selected:el.querySelector('[data-core-ruler][aria-pressed="true"]')?.dataset.coreRuler,detail:el.querySelector('.sky-card-ruler-detail')?.innerText}))));
   await core.locator('.sky-card-ruler-detail').waitFor({state:'visible',timeout:5000});
   assert.equal(await core.locator('[data-core-ruler="Mars"]').getAttribute('aria-pressed'),'true');
   assert.match(await core.locator('.sky-card-ruler-detail').innerText(),/Aries/);
   assert.match(await core.locator('.sky-card-ruler-detail').innerText(),/Scorpio/);
   assert.deepEqual(await page.locator('#skyFoundationWheelMount [data-interactive="sign"].is-kept').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.sign)).sort((a,b)=>a-b)),[0,7]);
   await core.locator('[data-core-clear-ruler]').click();
   assert.equal(await core.locator('.sky-card-ruler-detail').count(),0);
   await core.getByRole('tab',{name:'Signs',exact:true}).click();
   assert.equal(await core.locator('[data-core-select-sign]').count(),12);
   await core.locator('[data-core-select-sign="7"]').click();
   assert.equal(await core.locator('[data-core-select-sign="7"]').getAttribute('aria-expanded'),'true','Switching tabs must not intercept sign selection');
   await core.locator('[data-core-select-sign="7"]').click();
   assert.equal(await core.locator('[data-core-select-sign="7"]').getAttribute('aria-expanded'),'false');
   await core.getByRole('tab',{name:'Houses',exact:true}).click();
   assert.equal(await core.getByRole('tab',{name:'Houses',exact:true}).getAttribute('aria-selected'),'true');
   assert.deepEqual(coreErrors,[]);
   if(viewport.width>=1050){
    const boxes=await focus.evaluate(el=>['#skyLearnAscendantSelect','.sky-chart-aspect-summary-choices','.sky-chart-house-summary-choices','[data-zodiac-summary]','[data-relationship-display-value]'].map(s=>{const r=el.querySelector(s).getBoundingClientRect();return {bottom:r.bottom,height:r.height}}));
    console.log('FOCUS FIELD BOXES',JSON.stringify(boxes));
    assert.ok(boxes.every(b=>Math.abs(b.height-35)<1),'All fields share height');
    assert.ok(boxes.every(b=>Math.abs(b.bottom-boxes[0].bottom)<1),'All fields share bottom baseline');
   }
   await trigger.click();
   const menu=page.locator('#skyLearnAscendantMenu');
   await menu.waitFor({state:'visible'});
   assert.equal(await menu.getByRole('option').count(),12);
   const menuFit=await menu.evaluate(el=>{
     const box=el.getBoundingClientRect(),style=getComputedStyle(el),names=[...el.querySelectorAll('.sky-chart-zodiac-filter-name')];
     const right=Math.max(...names.map(n=>n.querySelector('.sky-chart-sign-list-figure').getBoundingClientRect().right));
     const expectedPadding=parseFloat(style.paddingRight)+parseFloat(style.borderRightWidth)+11;
     return {width:box.width,rightGap:box.right-right,expectedPadding,viewport:innerWidth};
   });
   console.log('ASCENDANT MENU FIT',JSON.stringify(menuFit));
   assert.ok(menuFit.width<330&&menuFit.rightGap<=menuFit.expectedPadding+3,'Ascendant menu fits its longest content without spare checkbox space');
   assert.equal(await menu.locator('.sky-chart-zodiac-filter-glyph svg').count(),12);
   await menu.getByRole('option',{name:'Aquarius · Bucket'}).click();
   assert.equal(await trigger.getAttribute('data-selected-sign'),'10');
   await focus.locator('[data-ascendant-step="1"]').click();
   assert.equal(await trigger.getAttribute('data-selected-sign'),'11');
   await page.waitForSelector('#skyFoundationWheelMount .sky-foundation-wheel[data-learn-ascendant="11"]');
   await checkWheel();
   await focus.locator('[data-zodiac-summary]').click();
   await page.locator('#skyChartZodiacFilterMenu').waitFor({state:'visible'});
   assert.equal(await page.locator('#skyChartZodiacFilterMenu input[type=checkbox]').count(),12);
   await page.keyboard.press('Escape');
   for(const [toggle,popover,rowSelector] of [
    ['[data-aspect-filter-toggle]','.sky-chart-aspect-filter-popover','.sky-chart-aspect-list-item'],
    ['[data-house-filter-toggle]','.sky-chart-house-filter-popover','.sky-chart-house-list-item']
   ]){
    await focus.locator(toggle).click();
    const popup=page.locator(popover);
    await popup.waitFor({state:'visible'});
    const layout=await popup.locator(rowSelector).evaluateAll(rows=>rows.map(row=>{
     const input=row.querySelector('input[type=checkbox]'),r=row.getBoundingClientRect(),check=input.getBoundingClientRect(),tracks=getComputedStyle(row).gridTemplateColumns.split(' ');
     return {count:row.querySelectorAll('input[type=checkbox]').length,tracks,rightGap:r.right-check.right,checkboxCenter:check.x+check.width/2,right:r.right};
    }));
    console.log('LEARN MENU COLUMNS',viewport.width,popover,JSON.stringify(layout));
    assert.ok(layout.length>0&&layout.every(r=>r.count===1&&r.tracks.length===2&&Math.abs(parseFloat(r.tracks[1])-40)<1&&Math.abs(r.right-r.checkboxCenter-20)<2),'One 40px checkbox column must reach the row right edge');
    await page.screenshot({path:'sky-remote-'+(toggle.includes('aspect')?'aspect':'house')+'-menu-'+viewport.width+'.png'});
    await page.keyboard.press('Escape');
   }
   await page.screenshot({path:'sky-remote-learn-'+viewport.width+'.png',fullPage:true});
   console.log('LEARN TOOLBAR',viewport.width,JSON.stringify(header));
  }catch(e){failed=true;console.error('LEARN '+viewport.width+' FAILED '+e.message)}
  finally{await ctx.close()}
 }
}finally{await browser.close()}
if(failed)process.exitCode=1;
