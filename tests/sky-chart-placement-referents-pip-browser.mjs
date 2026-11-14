import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function placement(name,longitude){return {name,longitude,sign:signs[Math.floor(longitude/30)],degree:Math.floor(longitude%30),minute:Math.floor((longitude%1)*60)}}
function sky(name,shift){const positions={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Midheaven:76.28};const cusps=Array.from({length:12},(_,i)=>(168.38+shift+i*30)%360);return {name,placements:Object.fromEntries(Object.entries(positions).map(([k,v])=>[k,placement(k,v+shift)])),houseCusps:cusps,calcProfile:{dateTime:'2026-11-01T12:00',instant:'2026-11-01T18:00:00Z',location:'Salt Lake City',latitude:40.7608,longitude:-111.891,timeZone:'America/Denver',houseSystem:'equal-house',houseCusps:cusps}}}
const browser=await chromium.launch({headless:true});
try{
  for(const width of [1280,390]){
    const context=await browser.newContext({viewport:{width,height:850}}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.stack||e.message));
    await page.route('https://unpkg.com/suncalc@1.9.0/suncalc.js',r=>r.fulfill({path:path.resolve('node_modules/suncalc/suncalc.js'),contentType:'application/javascript'}));
    await page.route('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js',r=>r.fulfill({path:path.resolve('node_modules/luxon/build/global/luxon.min.js'),contentType:'application/javascript'}));
    await page.addInitScript(({a,b})=>{localStorage.setItem('relphiSkyChartA',JSON.stringify(a));localStorage.setItem('relphiSkyChartB',JSON.stringify(b));localStorage.setItem('relphiSkyChartLastModeV1','comparison')},{a:sky('A',0),b:sky('B',7)});
    await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded'});
    await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:30000});
    await page.waitForFunction(()=>window.RelphiSkyDecanCards&&window.RelphiSkyVocab?.describeFocus&&window.RelphiSkyPlacementView);
    const prompt=page.locator('#skyWhereWhenNamePrompt:not([hidden])');
    if(await prompt.count())await prompt.locator('[data-sky-name-cancel]').click();
    for(const slot of ['A','B']){
      const panel=page.locator('#skyFoundation'+slot);
      const saturn=panel.locator('.sky-foundation-ledger .sky-foundation-row[data-placement="saturn"]');
      await saturn.waitFor();
      await page.waitForFunction(slot=>document.querySelector('#skyFoundation'+slot+' .sky-foundation-row[data-placement="saturn"]')?.dataset.interactive==='placement',slot,{timeout:15000});
      await saturn.click();
      const detail=panel.locator('.sky-placement-expanded[data-placement-detail="saturn"]');
      assert.equal(await detail.count(),1,'Saturn detail is expanded '+slot);
      assert.ok(await detail.isVisible(),'Expanded referents must actually be visible');
      const layout=await detail.evaluate(node=>{
        const frame=getComputedStyle(node),tiles=node.querySelector('.sky-placement-referents'),grid=getComputedStyle(tiles),card=node.querySelector('.sky-placement-card-link'),img=card?.querySelector('img');
        return{background:frame.backgroundColor,border:frame.borderLeftWidth,columns:grid.gridTemplateColumns.split(' ').filter(Boolean).length,
          tiles:tiles.children.length,cardWidth:img?.getBoundingClientRect().width||0,
          cardHeight:img?.getBoundingClientRect().height||0,cardInSharedStyle:card?.classList.contains('inline-rel-card')};
      });
      assert.equal(layout.columns,2,'Placement referents should be a two-column Relationships-style composition');
      assert.equal(layout.tiles,4,'Show planet, sign, decan, and house referents');
      assert.ok(layout.background!=='rgb(255, 255, 255)','Expanded card must use shared parchment styling');
      assert.equal(layout.cardInSharedStyle,true,'Tarot art must reuse the Relationships card primitive');
      assert.ok(layout.cardHeight>=100,'Tarot art must be large and vertically presented');
      if(slot==='A')await panel.screenshot({path:'sky-chart-placement-detail-'+width+'.png'});
      const referents=await detail.textContent();
      for(const part of ['Placement','Sign','Decan','House'])assert.ok(referents.includes(part),part+' referent absent');
      assert.ok(referents.includes('structure'),'Saturn referent absent');
      assert.ok(referents.includes('Scorpio')||slot==='B','Saturn sign absent');
      const link=detail.locator('a.sky-placement-card-link');
      assert.match(await link.getAttribute('href'),/tarot\.html\?card=/);
      assert.equal(await saturn.getAttribute('aria-expanded'),'true');
      assert.equal(await saturn.evaluate(n=>n.classList.contains('is-selected')),false,'placement click must not use old highlight');
      await saturn.press('Enter');
      assert.equal(await detail.count(),0,'keyboard activation collapses detail');
      const placementOrder=await panel.locator('.sky-foundation-ledger .sky-foundation-row[data-placement]').evaluateAll(rows=>rows.map(row=>row.dataset.placement));
      await panel.locator('[data-placement-view="pip"]').click();
      const images=panel.locator('.sky-placement-pip-gallery .sky-placement-pip img');
      const artOrder=await panel.locator('.sky-placement-pip-gallery .sky-placement-pip').evaluateAll(cards=>cards.map(card=>card.dataset.placementId));
      assert.equal(await panel.locator('.sky-foundation-ledger .sky-foundation-row').count(),0,'pip art view replaces placement rows');
      assert.deepEqual(artOrder,placementOrder,'pip artwork must preserve the full canonical placement order');
      assert.equal(await images.count(),placementOrder.length,'one art image for each canonical placement');
      const ids=await images.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src').split('/').at(-1)));
      assert.ok(new Set(ids).size<ids.length,'duplicate pip artwork must remain in source order');
      assert.equal(await panel.locator('.sky-placement-pip-gallery .sky-placement-pip[href*="tarot.html?card="]').count(),placementOrder.length);
      await page.waitForFunction(slot=>Array.from(document.querySelectorAll('#skyFoundation'+slot+' .sky-placement-pip img')).every(img=>img.complete&&img.naturalWidth>0),slot,{timeout:15000});
      if(slot==='A')await panel.screenshot({path:'sky-chart-placement-pip-'+width+'.png'});
      await panel.locator('[data-placement-view="list"]').click();
      await saturn.waitFor();
      assert.equal(await panel.locator('.sky-placement-pip-gallery').count(),0,'return to placement ledger');
      console.log('PASS placement detail and duplicate pip art',slot,width);
    }
    assert.deepEqual(errors,[],'browser page errors: '+errors.join('; '));
    await context.close();
  }
}finally{await browser.close()}
