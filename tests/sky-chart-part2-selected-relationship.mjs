import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';

const sample=(name,offset)=>{
  const asc=(165+offset)%360,mc=(82+offset)%360;
  const houseCusps=Array.from({length:12},(_,index)=>(Math.floor(asc/30)*30+index*30)%360);
  return{
    name,houseSystem:'whole-sign',houseCusps,
    calcProfile:{
      dateTime:'1985-10-08T12:15',instant:'1985-10-08T16:15:00.000Z',
      location:'Malden, Massachusetts, United States',timeZone:'America/New_York',
      latitude:42.4251,longitude:-71.0662,houseSystem:'whole-sign',houseCusps
    },
    placements:{
      Sun:{name:'Sun',longitude:(195+offset)%360},Moon:{name:'Moon',longitude:(118.4+offset)%360},
      Mercury:{name:'Mercury',longitude:(206.1+offset)%360},Venus:{name:'Venus',longitude:(169.8+offset)%360},
      Mars:{name:'Mars',longitude:(167.8+offset)%360},Jupiter:{name:'Jupiter',longitude:(307.1+offset)%360},
      Saturn:{name:'Saturn',longitude:(235.5+offset)%360},Uranus:{name:'Uranus',longitude:(254.8+offset)%360},
      Neptune:{name:'Neptune',longitude:(271+offset)%360},Pluto:{name:'Pluto',longitude:(213.8+offset)%360},
      Ascendant:{name:'Ascendant',longitude:asc},Midheaven:{name:'Midheaven',longitude:mc},
      Chiron:{name:'Chiron',longitude:(49+offset)%360},'North Node':{name:'North Node',longitude:(10+offset)%360}
    }
  };
};

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1200}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error'&&!/favicon|Failed to load resource/i.test(message.text()))errors.push(message.text())});
  await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',route=>route.fulfill({
    path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'
  }));
  await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',route=>route.fulfill({
    path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'
  }));
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyChartLastModeV1','comparison');
    sessionStorage.removeItem('relphiSkyWhereWhenViewV1');
  },{a:sample('Sky A test',0),b:sample('Sky B test',73)});

  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:20000});
  await page.waitForSelector('.sky-foundation-relationship-row[data-relation-index]',{timeout:20000});

  assert.equal(await page.locator('#skySelectedRelationship').count(),0,'The retired separate Selected Relationship panel must not be recreated.');

  const rows=page.locator('.sky-foundation-relationship-row[data-relation-index]');
  const visibleBefore=await page.locator('.sky-foundation-relationship-row:visible').count();
  assert.ok(visibleBefore>1);

  const row=rows.first();
  await row.click();
  await page.waitForFunction(()=>Boolean(document.querySelector('.sky-foundation-relationship-row.is-inline-expanded')));
  assert.equal(await row.getAttribute('aria-expanded'),'true');
  assert.equal(await row.locator(':scope > .inline-rel-detail').isVisible(),true);
  assert.equal(await row.locator(':scope > .inline-rel-detail .inline-rel-card').count(),2);
  assert.equal(await row.locator(':scope > .inline-rel-detail .inline-rel-wheel').count(),1);
  await row.locator(':scope > .inline-rel-detail > .inline-rel-progressive-strip').waitFor({state:'attached',timeout:5000});
  assert.equal(await row.locator('[data-inline-progressive-token]').count(),7);
  assert.equal(await page.locator('.sky-foundation-relationship-row:visible').count(),visibleBefore,'Expanding a relationship must not filter the list.');

  const cardsLoaded=await row.locator('.inline-rel-card img').evaluateAll(images=>images.every(image=>image.complete&&image.naturalWidth>0));
  assert.equal(cardsLoaded,true);

  const leftGlyph=row.locator('.sky-foundation-relationship-glyph--left');
  const leftToken=row.locator('[data-inline-progressive-token="left-placement"]');
  await leftGlyph.click();
  assert.equal(await leftToken.getAttribute('data-inline-progressive-stage'),'1');
  assert.equal(await leftToken.isVisible(),true);
  assert.equal(await leftToken.locator('[data-inline-progressive-level="name"]').isVisible(),true);
  assert.equal(await leftToken.locator('[data-inline-progressive-level="referent"]').isVisible(),false);
  await leftToken.locator('[data-inline-progressive-level="name"]').click();
  assert.equal(await leftToken.getAttribute('data-inline-progressive-stage'),'2');
  assert.equal(await leftToken.locator('[data-inline-progressive-level="referent"]').isVisible(),true);
  assert.ok((await leftToken.locator('[data-inline-progressive-level="referent"]').textContent()).trim().length>10);

  const second=rows.nth(1);
  await second.hover();
  await page.waitForTimeout(150);
  assert.equal(await page.locator('.sky-foundation-relationship-row:visible').count(),visibleBefore,'Row hover must not mutate the relationship list.');

  await second.click();
  assert.equal(await second.getAttribute('aria-expanded'),'true');
  assert.equal(await row.getAttribute('aria-expanded'),'false','Only one inline relationship may own the open detail at a time.');

  const placementsDrawer=page.locator('#skyFoundationA [data-sky-drawer="placements"]');
  if((await placementsDrawer.getAttribute('open'))===null){
    await page.locator('#skyFoundationA [data-sky-drawer-tab="placements"]').click();
  }
  await page.waitForFunction(()=>document.querySelector('#skyFoundationA [data-sky-drawer="placements"]')?.open===true,null,{timeout:10000});
  await page.locator('[data-placement-house-system="A"]').waitFor({state:'visible',timeout:10000});
  assert.equal(await page.locator('[data-house-system-filter]').count(),0,'The retired relationship-bar House System control must stay gone.');
  const beforeCusps=await page.evaluate(()=>JSON.parse(localStorage.getItem('relphiSkyChartA')).calcProfile.houseCusps);
  await page.locator('[data-placement-house-system="A"]').selectOption('equal-house');
  await page.waitForFunction(previous=>{
    const a=JSON.parse(localStorage.getItem('relphiSkyChartA')||'null');
    const b=JSON.parse(localStorage.getItem('relphiSkyChartB')||'null');
    return a?.calcProfile?.houseSystem==='equal-house'&&b?.calcProfile?.houseSystem==='equal-house'&&JSON.stringify(a.calcProfile.houseCusps)!==JSON.stringify(previous);
  },beforeCusps,{timeout:10000});

  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(150);
  const mobileRow=page.locator('.sky-foundation-relationship-row[data-relation-index]').first();
  await mobileRow.click();
  assert.equal(await mobileRow.getAttribute('aria-expanded'),'true');
  assert.equal(await page.locator('body').evaluate(node=>node.scrollWidth<=node.clientWidth),true);

  assert.deepEqual(errors,[]);
  await page.screenshot({path:'sky-chart-inline-relationship.png',fullPage:true});
  console.log('Sky Chart inline relationship ownership passed.');
}finally{
  await browser.close();
}
