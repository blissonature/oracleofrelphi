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
     // Clipboard handoff: a pending long-press must not replace an external capture.
     await ctx.grantPermissions(['clipboard-read','clipboard-write']);
     const row=page.locator('#skyFoundationRelationshipList .sky-foundation-relationship-row:visible').first();
     await row.waitFor({state:'visible'});
     for(const handoff of ['blur','pointerout']){
       await page.evaluate(()=>navigator.clipboard.writeText('external capture sentinel'));
       await row.evaluate(el=>el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:7,pointerType:'mouse',button:0,buttons:1,clientX:5,clientY:5})));
       if(handoff==='blur')await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
       else await row.evaluate(el=>el.dispatchEvent(new PointerEvent('pointerout',{bubbles:true,pointerId:7,pointerType:'mouse',relatedTarget:null})));
       await page.waitForTimeout(550);
       const value=await page.evaluate(()=>navigator.clipboard.readText());
       assert.equal(value,'external capture sentinel',handoff+' must cancel pending automatic clipboard write');
     }
     await row.evaluate(el=>el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:7,pointerType:'mouse',button:0,buttons:1,clientX:5,clientY:5})));
     await page.waitForTimeout(550);
     assert.notEqual(await page.evaluate(()=>navigator.clipboard.readText()),'external capture sentinel','Intentional long press must still copy');
     await row.evaluate(el=>el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:7,pointerType:'mouse',button:0,buttons:0})));
     console.log('CLIPBOARD HANDOFF PASS: blur and pointer departure preserve clipboard, intentional press copies');
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
   // The actual global menu drives the same three Vocab layers in Learn.
   await core.getByRole('tab',{name:'Vocab',exact:true}).click();
   const vocabTokens=core.locator('[data-core-structure] .sky-vocab-token');
   assert.equal(await vocabTokens.count(),24);
   const displayTrigger=focus.locator('[data-relationship-display-value]');
   const displayMenu=page.locator('#skyRelationshipDisplayPopover');
   await displayTrigger.click();
   await displayMenu.waitFor({state:'visible'});
   const ids=['glyphs','referents','names'],levels=['glyph','referent','name'];
   const allButton=displayMenu.getByRole('button',{name:'All',exact:true});
   const layers=await displayMenu.locator('[data-shared-display-layer]').count();
   assert.equal(layers,3);
   async function assertVocabLayers(mask){
     const counts=await vocabTokens.evaluateAll((tokens,levels)=>levels.map(level=>tokens.filter(t=>t.querySelector('[data-vocab-level="'+level+'"]')).length),levels);
     assert.deepEqual(counts,ids.map((_,i)=>mask&(1<<i)?24:0),'Core Vocab must honor the exact independent layer combination '+mask);
     const state=await page.evaluate(()=>window.RelphiSkyRelationshipDisplay.getState());
     assert.deepEqual(ids.map(id=>state[id]),ids.map((_,i)=>Boolean(mask&(1<<i))));
   }
   for(let mask=1;mask<8;mask++){
     await allButton.click();
     for(let i=0;i<ids.length;i++)if(!(mask&(1<<i)))await displayMenu.locator('[data-shared-display-layer="'+ids[i]+'"]').uncheck();
     await assertVocabLayers(mask);
     if([1,2,4].includes(mask))assert.equal(await displayMenu.locator('[data-shared-display-layer]:checked').isDisabled(),true,'Cannot deselect the last layer');
   }
   // Local progressive reveal works until an explicit global preset resets it.
   await displayMenu.locator('[data-shared-display-layer="referents"]').uncheck();
   await displayMenu.locator('[data-shared-display-layer="names"]').uncheck();
   await page.keyboard.press('Escape');
   await assertVocabLayers(1);
   await vocabTokens.first().locator('[data-vocab-level="glyph"]').click();
   assert.equal(await vocabTokens.first().locator('[data-vocab-level="referent"]').count(),1);
   await displayTrigger.click();
   await displayMenu.locator('[data-shared-display-layer="names"]').check();
   await assertVocabLayers(5);
   await page.keyboard.press('Escape');
   await core.getByRole('tab',{name:'Houses',exact:true}).click();
   await core.getByRole('tab',{name:'Vocab',exact:true}).click();
   await assertVocabLayers(5);
   await displayTrigger.click();
   await allButton.click();
   await assertVocabLayers(7);
   await page.keyboard.press('Escape');
   console.log('CORE VOCAB DISPLAY PASS',viewport.width,'all seven combinations, local reveal, tab reentry');
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
   // Expansion replaces the selected compact tile in the original flow; art is not duplicated.
   const order=await core.locator('.sky-card-rulers-grid [data-core-ruler]').evaluateAll(nodes=>nodes.map(n=>n.dataset.coreRuler));
   const venus=core.locator('[data-core-ruler="Venus"]');
   const keptSigns=()=>page.locator('#skyFoundationWheelMount [data-interactive="sign"].is-kept').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.sign)).sort((a,b)=>a-b));
   const beforeHover=await core.locator('.sky-card-rulers-grid').innerHTML();
   // Legacy filter timers may rewrite the hidden raw counter (e.g. 66/66).
   // Compare the visible list identities and the canonical displayed match count.
   const relationshipSnapshot=()=>page.evaluate(()=>({
     count:document.getElementById('skyFoundationRelationshipCount').dataset.matchCount,
     visible:[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]')].filter(r=>!r.hidden&&getComputedStyle(r).display!=='none'&&getComputedStyle(r).visibility!=='hidden').map(r=>r.dataset.relationIndex)
   }));
   const countBeforeHover=await relationshipSnapshot();
   if(viewport.width>=1050)await venus.hover();
   else await venus.dispatchEvent('pointerover',{pointerType:'mouse',relatedTarget:null});
   assert.deepEqual(await keptSigns(),[1,6],'Hover previews Venus domiciles on wheel');
   assert.equal(await core.locator('.sky-card-ruler-detail').count(),0,'Hover must not expand a ruler');
   assert.equal(await core.locator('.sky-card-rulers-grid').innerHTML(),beforeHover,'Hover must not re-render compact tiles');
   assert.deepEqual(await relationshipSnapshot(),countBeforeHover,'Hover must not change the actual visible Relationships or displayed match count');
   if(viewport.width>=1050)await core.getByRole('tab',{name:'Rulers',exact:true}).hover();
   else await venus.dispatchEvent('pointerout',{pointerType:'mouse',relatedTarget:null});
   assert.deepEqual(await keptSigns(),[],'Wheel restores on pointer exit');
   if(viewport.width>=1050)await venus.click();else await venus.tap();
   const expanded=core.locator('.sky-card-ruler-detail[data-card-ruler-detail="Venus"]');
   await expanded.waitFor({state:'visible'});
   const layout=await expanded.evaluate(el=>{
     const art=el.querySelector('img'),body=el.querySelector('.sky-card-ruler-detail-body'),grid=el.parentElement,ar=art.getBoundingClientRect(),br=body.getBoundingClientRect(),r=el.getBoundingClientRect(),gr=grid.getBoundingClientRect();
     return {parent:grid.className,next:el.nextElementSibling?.dataset.coreRuler,artRight:ar.right,bodyLeft:br.left,artTop:ar.top,bodyBottom:br.bottom,width:r.width,gridWidth:gr.width,scroll:el.scrollWidth,client:el.clientWidth,artCount:el.querySelectorAll('img').length};
   });
   console.log('INLINE RULER TILE',viewport.width,JSON.stringify(layout));
   assert.equal(layout.parent,'sky-card-rulers-grid');
   assert.equal(layout.next,'Jupiter','Jupiter must follow expanded Venus in original order');
   assert.ok(layout.artRight<=layout.bodyLeft&&layout.artTop<layout.bodyBottom,'Art and detail must be side by side');
   assert.ok(Math.abs(layout.width-layout.gridWidth)<2&&layout.scroll<=layout.client+1,'Expanded tile fits the grid without overflow');
   assert.equal(layout.artCount,1);
   assert.deepEqual(await core.locator('.sky-card-rulers-grid [data-core-ruler]').evaluateAll(nodes=>nodes.map(n=>n.dataset.coreRuler)),order);
   const saturn=core.locator('[data-core-ruler="Saturn"]');
   if(viewport.width>=1050)await saturn.hover();else await saturn.dispatchEvent('pointerover',{pointerType:'mouse',relatedTarget:null});
   assert.deepEqual(await keptSigns(),[9,10],'Hover previews Saturn even when Venus is expanded');
   assert.equal(await expanded.count(),1,'Hover must preserve expanded Venus');
   assert.equal(await core.locator('.sky-card-ruler-detail[data-card-ruler-detail="Saturn"]').count(),0);
   if(viewport.width>=1050)await core.getByRole('tab',{name:'Rulers',exact:true}).hover();else await saturn.dispatchEvent('pointerout',{pointerType:'mouse',relatedTarget:null});
   assert.deepEqual(await keptSigns(),[1,6],'Leaving preview restores selected Venus');
   console.log('RULER HOVER PASS',viewport.width);
   await page.screenshot({path:'sky-remote-inline-ruler-'+viewport.width+'.png'});
   await expanded.locator('[data-core-ruler="Venus"]').click();
   assert.equal(await core.locator('.sky-card-ruler-detail').count(),0,'Clicking the expanded art collapses it');
   assert.deepEqual(await core.locator('.sky-card-rulers-grid [data-core-ruler]').evaluateAll(nodes=>nodes.map(n=>n.dataset.coreRuler)),order);
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
