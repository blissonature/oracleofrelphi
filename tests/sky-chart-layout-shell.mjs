import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const placement=(name,longitude)=>{const value=((longitude%360)+360)%360,sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);return{name,longitude:value,sign:signs[sign],degree,minute,second:0}};
function sample(name,offset){
  const asc=(168.38+offset)%360,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,Chiron:74.48,'North Node':40.3,'South Node':220.3,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
  return{name,houseSystem:'equal-house',houseCusps:cusps,calcProfile:{dateTime:'2026-09-18T18:00',instant:'2026-09-19T00:00:00.000Z',location:'Salt Lake City, Utah, United States',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891,houseCusps:cusps,houseSystem:'equal-house'},placements:Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]))};
}
const skyA=sample('Sky A',0),skyB=sample('Sky B',31.4);

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1536,height:864}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    if(!sessionStorage.getItem('relphiLayoutTestSeeded')){
      localStorage.removeItem('relphiSkyChartLayoutV1');
      sessionStorage.setItem('relphiLayoutTestSeeded','true');
    }
  },{a:skyA,b:skyB});

  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
  await page.waitForSelector('#skyFoundationRelationshipList .sky-foundation-relationship-row',{timeout:20000});
  await page.waitForSelector('[data-sky-layout-select]',{timeout:10000});

  assert.equal(await page.locator('#skyFoundationRelationships').evaluate(node=>node.parentElement?.id),'skyFoundationRoot','Relationships must be a stable root-level layout region.');

  const select=page.locator('[data-sky-layout-select]');
  assert.equal(await select.inputValue(),'classic');

  async function boxes(){
    return page.evaluate(()=>{
      const ids=['skyFoundationA','skyFoundationB','skyFoundationComparison','skyFoundationRelationships'];
      return Object.fromEntries(ids.map(id=>{const r=document.getElementById(id).getBoundingClientRect();return[id,{left:Math.round(r.left),right:Math.round(r.right),top:Math.round(r.top),width:Math.round(r.width)}]}));
    });
  }

  await select.selectOption('cards-left');
  await page.waitForFunction(()=>document.documentElement.dataset.skyLayout==='cards-left');
  await page.waitForTimeout(120);
  let b=await boxes();
  assert.ok(b.skyFoundationA.left < b.skyFoundationB.left,'Sky A must precede Sky B in the left cards region.');
  assert.ok(b.skyFoundationB.right <= b.skyFoundationComparison.left+2,'Both Sky cards must stay left of the wheel.');
  assert.ok(b.skyFoundationComparison.right <= b.skyFoundationRelationships.left+2,'Relationships must sit to the right of the wheel.');
  assert.ok(Math.abs(b.skyFoundationA.top-b.skyFoundationB.top)<=2,'Sky A and Sky B must be side by side.');
  assert.equal(await page.locator('#skyFoundationRelationshipList').evaluate(node=>getComputedStyle(node).gridTemplateColumns.split(' ').length),2,'Relationship rail must preserve its two-column list.');
  assert.equal(await page.locator('#skyFoundationRelationshipList').evaluate(node=>parseFloat(getComputedStyle(node).rowGap)||0),0,'Relationship rows must remain contiguous.');
  const shellWidth=await page.locator('.tarot-app-shell').evaluate(node=>node.getBoundingClientRect().width);
  assert.ok(shellWidth>=page.viewportSize().width-32,`Cards Left should use the browser width: ${shellWidth}px of ${page.viewportSize().width}px`);
  const leftRegionWidth=b.skyFoundationB.right-b.skyFoundationA.left;
  const relationshipWidth=b.skyFoundationRelationships.width;
  const wheelCenter=(b.skyFoundationComparison.left+b.skyFoundationComparison.right)/2;
  const viewportCenter=page.viewportSize().width/2;
  assert.ok(Math.abs(leftRegionWidth-relationshipWidth)<=28,`Cards Left should balance the two-card region (${leftRegionWidth}px) against Relationships (${relationshipWidth}px).`);
  assert.ok(Math.abs(wheelCenter-viewportCenter)<=20,`Wheel must remain visually centered: ${wheelCenter}px vs viewport center ${viewportCenter}px.`);
  assert.ok(b.skyFoundationComparison.width>=560,`Wheel panel should retain its former scale; got ${b.skyFoundationComparison.width}px.`);
  assert.ok(relationshipWidth<b.skyFoundationComparison.width,'Relationships should not be wider than the wheel panel.');
  const leftSkyHeight=Math.max(await page.locator('#skyFoundationA').evaluate(node=>node.getBoundingClientRect().height),await page.locator('#skyFoundationB').evaluate(node=>node.getBoundingClientRect().height));
  const leftRelationshipsHeight=await page.locator('#skyFoundationRelationships').evaluate(node=>node.getBoundingClientRect().height);
  assert.ok(leftRelationshipsHeight<=leftSkyHeight+1,`Relationships must not be taller than the Sky cards: ${leftRelationshipsHeight}px vs ${leftSkyHeight}px.`);
  assert.equal(await page.locator('body').evaluate(node=>node.scrollWidth<=node.clientWidth),true,'Cards Left must not create horizontal page scrolling.');
  const baselineAHeight=await page.locator('#skyFoundationA').evaluate(node=>node.getBoundingClientRect().height);
  const baselineRelationshipsHeight=await page.locator('#skyFoundationRelationships').evaluate(node=>node.getBoundingClientRect().height);
  await page.locator('#skyFoundationA [data-sky-drawer-tab="card-hits"]').click();
  await page.waitForSelector('#skyFoundationA [data-sky-drawer="card-hits"][open]',{timeout:10000});
  await page.locator('#skyFoundationA [data-card-ruler="Sun"]').click();
  await page.waitForTimeout(180);
  const expandedAHeight=await page.locator('#skyFoundationA').evaluate(node=>node.getBoundingClientRect().height);
  const expandedRelationshipsHeight=await page.locator('#skyFoundationRelationships').evaluate(node=>node.getBoundingClientRect().height);
  assert.ok(expandedAHeight>baselineAHeight+20,'Rulers should be allowed to extend the Sky card.');
  assert.ok(Math.abs(expandedRelationshipsHeight-baselineRelationshipsHeight)<=1,'Relationships must keep its baseline height when Rulers extends a Sky card.');
  assert.equal(await page.evaluate(()=>localStorage.getItem('relphiSkyChartLayoutV1')),'cards-left');
  await page.waitForFunction(()=>window.RelphiSkyRelationshipDisplay?.setMode&&window.RelphiRelationshipCopySerializer);
  await page.evaluate(()=>window.RelphiSkyRelationshipDisplay.setMode('referents'));
  await page.waitForFunction(()=>document.querySelector('.sky-foundation-relationship-row:not(.is-inline-expanded) > .sky-relationship-display-summary[data-relationship-display-summary="referents"]'));
  const referentText=(await page.locator('.sky-foundation-relationship-row:not(.is-inline-expanded) > .sky-relationship-display-summary').first().textContent())||'';
  assert.ok(/—|identity|feelings|structure|relationship|pressure|exchange|adjustment|opening/i.test(referentText),'Referents mode must visibly render semantic relationship text.');
  await page.evaluate(()=>window.RelphiSkyRelationshipDisplay.setMode('glyphs'));

  const relationshipHeightBeforeRulers=await page.locator('#skyFoundationRelationships').evaluate(node=>node.getBoundingClientRect().height);
  const skyAHeightBeforeRulers=await page.locator('#skyFoundationA').evaluate(node=>node.getBoundingClientRect().height);
  await page.locator('#skyFoundationA [data-sky-drawer-tab="card-hits"]').click();
  await page.waitForSelector('#skyFoundationA [data-card-ruler="Sun"]',{timeout:10000});
  await page.locator('#skyFoundationA [data-card-ruler="Sun"]').click();
  await page.waitForTimeout(120);
  const skyAHeightWithRulers=await page.locator('#skyFoundationA').evaluate(node=>node.getBoundingClientRect().height);
  const relationshipHeightWithRulers=await page.locator('#skyFoundationRelationships').evaluate(node=>node.getBoundingClientRect().height);
  assert.ok(skyAHeightWithRulers>skyAHeightBeforeRulers,'Rulers is allowed to make the Sky card taller.');
  assert.ok(Math.abs(relationshipHeightWithRulers-relationshipHeightBeforeRulers)<=1,'Relationships must not grow when Rulers makes a Sky card taller.');
  assert.ok(await page.locator('.sky-foundation-relationship-row:not(.sky-card-ruler-hidden):visible').count()>0,'Sun ruler focus must leave matching relationships visible.');

    await page.screenshot({path:'sky-chart-layout-cards-left.png',fullPage:true});

  await select.selectOption('cards-right');
  await page.waitForFunction(()=>document.documentElement.dataset.skyLayout==='cards-right');
  await page.waitForTimeout(120);
  b=await boxes();
  assert.ok(b.skyFoundationRelationships.right <= b.skyFoundationComparison.left+2,'Relationships must sit left of the wheel in the mirrored layout.');
  assert.ok(b.skyFoundationComparison.right <= b.skyFoundationA.left+2,'Both Sky cards must stay right of the wheel.');
  assert.ok(b.skyFoundationA.left < b.skyFoundationB.left,'Sky A and Sky B retain their internal order.');
  assert.ok(Math.abs(b.skyFoundationA.top-b.skyFoundationB.top)<=2);
  assert.equal(await page.locator('#skyFoundationRelationshipList').evaluate(node=>getComputedStyle(node).gridTemplateColumns.split(' ').length),2,'Cards Right must also preserve two relationship columns.');
  assert.equal(await page.locator('#skyFoundationRelationshipList').evaluate(node=>parseFloat(getComputedStyle(node).rowGap)||0),0,'Cards Right relationship rows must remain contiguous.');
  assert.ok(await page.locator('.tarot-app-shell').evaluate(node=>node.getBoundingClientRect().width)>=page.viewportSize().width-32,'Cards Right should also use the browser width.');
  const rightCardsWidth=b.skyFoundationB.right-b.skyFoundationA.left;
  const rightRelationshipWidth=b.skyFoundationRelationships.width;
  const rightWheelCenter=(b.skyFoundationComparison.left+b.skyFoundationComparison.right)/2;
  assert.ok(Math.abs(rightCardsWidth-rightRelationshipWidth)<=28,'Cards Right must keep the side regions balanced.');
  assert.ok(Math.abs(rightWheelCenter-page.viewportSize().width/2)<=20,'Cards Right must keep the wheel visually centered.');
  assert.ok(b.skyFoundationComparison.width>=560,'Cards Right must retain wheel scale.');
  const rightSkyHeight=Math.max(await page.locator('#skyFoundationA').evaluate(node=>node.getBoundingClientRect().height),await page.locator('#skyFoundationB').evaluate(node=>node.getBoundingClientRect().height));
  const rightRelationshipsHeight=await page.locator('#skyFoundationRelationships').evaluate(node=>node.getBoundingClientRect().height);
  assert.ok(rightRelationshipsHeight<=rightSkyHeight+1,'Cards Right must keep Relationships within the Sky-card height.');
  assert.equal(await page.locator('body').evaluate(node=>node.scrollWidth<=node.clientWidth),true,'Cards Right must not create horizontal page scrolling.');

  await page.screenshot({path:'sky-chart-layout-cards-right.png',fullPage:true});

  await page.reload({waitUntil:'networkidle'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
  await page.waitForSelector('[data-sky-layout-select]',{timeout:10000});
  assert.equal(await page.locator('[data-sky-layout-select]').inputValue(),'cards-right','Layout choice must persist.');

  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(180);
  const mobile=await boxes();
  assert.ok(Math.abs(mobile.skyFoundationA.left-mobile.skyFoundationComparison.left)<=3);
  assert.ok(mobile.skyFoundationA.top < mobile.skyFoundationB.top);
  assert.ok(mobile.skyFoundationB.top < mobile.skyFoundationComparison.top);
  assert.ok(mobile.skyFoundationComparison.top < mobile.skyFoundationRelationships.top);
  assert.equal(await page.locator('body').evaluate(node=>node.scrollWidth<=node.clientWidth),true,'Mobile layout must not create horizontal scrolling.');
  await page.screenshot({path:'sky-chart-layout-mobile.png',fullPage:true});

  assert.deepEqual(errors,[]);
  console.log('Sky Chart layout shell presets passed.');
}finally{
  await browser.close();
}
