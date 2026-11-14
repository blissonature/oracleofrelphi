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
        const artRect=card.getBoundingClientRect(),textRect=tiles.getBoundingClientRect(),imgRect=img.getBoundingClientRect(),frameRect=node.getBoundingClientRect();
        return{background:frame.backgroundColor,border:frame.borderLeftWidth,columns:frame.gridTemplateColumns.split(' ').filter(Boolean).length,
          textColumns:grid.gridTemplateColumns.split(' ').filter(Boolean).length,
          tiles:tiles.children.length,cardWidth:imgRect.width,cardHeight:imgRect.height,
          artLeft:artRect.left,artRight:artRect.right,textLeft:textRect.left,textRight:textRect.right,frameRight:frameRect.right,
          visibleCardText:card.innerText.trim(),cardInSharedStyle:card?.classList.contains('inline-rel-card')};
      });
      assert.equal(layout.columns,2,'Pip art and referents form two adjacent columns');
      assert.equal(layout.textColumns,1,'Referent text flows vertically in the right column');
      assert.ok(layout.artRight<layout.textLeft,'Pip art is positioned left of the referents');
      assert.ok(layout.textRight<=layout.frameRight+1,'Referent text fits inside the tile');
      assert.equal(layout.visibleCardText,'','The artwork link has no extraneous visible labels');
      assert.equal(layout.tiles,4,'Show planet, sign, decan, and house referents');
      assert.ok(layout.background!=='rgb(255, 255, 255)','Expanded card must use shared parchment styling');
      assert.equal(layout.cardInSharedStyle,true,'Tarot art must reuse the Relationships card primitive');
      const rails=await detail.evaluate(node=>{
        const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
        const signIndex=signs.indexOf(node.querySelector('[data-referent-kind="sign"] strong')?.textContent.trim());
        const houseNumber=Number(node.querySelector('[data-referent-kind="house"] strong')?.textContent.replace('House ','')||0);
        const colors=window.RelphiRelationshipVocab.railColors(signIndex,houseNumber);
        return{sign:node.style.getPropertyValue('--placement-sign-rail').trim(),house:node.style.getPropertyValue('--placement-house-rail').trim(),
          expectedSign:colors.sign,expectedHouse:colors.house,background:getComputedStyle(node).backgroundImage,
          dividers:[...node.querySelectorAll('.sky-placement-referent')].map(item=>getComputedStyle(item).borderTopWidth)};
      });
      assert.equal(rails.sign,rails.expectedSign,'Sign rail follows the selected zodiac sign');
      assert.equal(rails.house,rails.expectedHouse,'House rail uses canonical numbered-house color');
      assert.ok(rails.background.includes('gradient'),'Sign and house rails appear as two gradient tracks');
      assert.ok(rails.dividers.every(width=>width==='0px'),'No arbitrarily colored referent borders');
      assert.ok(layout.cardWidth>=95&&layout.cardHeight>=125,'Pip artwork uses the available left column at full natural proportions');
      if(slot==='A')await panel.screenshot({path:'sky-chart-placement-detail-'+width+'.png'});
      const referents=await detail.textContent();
      for(const part of ['Placement','Sign','Decan','House'])assert.ok(referents.includes(part),part+' referent absent');
      assert.ok(referents.includes('structure'),'Saturn referent absent');
      assert.ok(referents.includes('Scorpio')||slot==='B','Saturn sign absent');
      const link=detail.locator('a.sky-placement-card-link');
      assert.match(await link.getAttribute('href'),/tarot\.html\?card=/);
      assert.match(await link.getAttribute('aria-label'),/Tarot Ledger/);
      assert.equal(await saturn.getAttribute('aria-expanded'),'true');
      assert.equal(await saturn.evaluate(n=>n.classList.contains('is-selected')),false,'placement click must not use old highlight');
      await saturn.press('Enter');
      assert.equal(await detail.count(),0,'keyboard activation collapses detail');
      assert.equal(await panel.locator('[data-placement-view]').count(),0,'No redundant Placements/Pip art tab row');
      const topTabs=panel.locator('[data-sky-vocab-tabs] [data-sky-vocab-view-button]');
      await page.waitForFunction(slot=>document.querySelectorAll('#skyFoundation'+slot+' [data-sky-vocab-tabs] [data-sky-vocab-view-button]').length===2,slot);
      assert.deepEqual(await topTabs.allTextContents(),['Placements','Vocab'],'Original Placements/Vocab navigation remains intact');
      const placementOrder=await panel.locator('.sky-foundation-ledger .sky-foundation-row[data-placement]').evaluateAll(rows=>rows.map(row=>row.dataset.placement));
      await panel.locator('[data-sky-drawer-tab="card-hits"]').click();
      const decansTab=panel.locator('[data-card-hits-view="art"]');
      assert.equal(await decansTab.textContent(),'Decans','Only Artwork subtab renamed; Card Hits remains the drawer');
      assert.equal(await panel.locator('[data-sky-drawer-tab="card-hits"]').getAttribute('aria-label'),'Card Hits');
      await decansTab.click();
      await page.waitForFunction(slot=>document.querySelector('#skyFoundation'+slot+' .sky-card-hits-structure [data-card-hits-view="art"][aria-selected="true"]')!==null,slot);
      const gallery=panel.locator('.sky-card-placement-art-grid');
      assert.ok(await gallery.isVisible(),'Card Hits Artwork shows ordered card art');
      const cards=gallery.locator('.sky-card-placement-art');
      const images=cards.locator('img');
      assert.equal(await panel.locator('.sky-placement-pip-gallery').count(),0,'Gallery no longer belongs to Placements');
      const artOrder=await cards.evaluateAll(cards=>cards.map(card=>card.dataset.cardPlacement));
      const canon=id=>({'asc':'ascendant','dsc':'descendant','mc':'midheaven','ic':'imum-coeli','part-of-fortune':'part-of-fortune','anti-vertex':'anti-vertex'}[id]||id);
      assert.deepEqual(artOrder,placementOrder.map(canon),'Card Hits preserves displayed placement order including repeats');
      assert.equal(await images.count(),placementOrder.length,'One card image per displayed placement');
      const ids=await images.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src').split('/').at(-1)));
      assert.ok(new Set(ids).size<ids.length,'Repeated pip cards remain separate');
      assert.equal(await gallery.locator('a[href*="tarot.html?card="]').count(),placementOrder.length);
      await page.waitForFunction(slot=>Array.from(document.querySelectorAll('#skyFoundation'+slot+' .sky-card-placement-art img')).every(img=>img.complete&&img.naturalWidth>0),slot,{timeout:15000});
      if(slot==='A')await panel.screenshot({path:'sky-chart-placement-pip-'+width+'.png'});
      await panel.locator('[data-sky-drawer-tab="placements"]').click();
      await saturn.waitFor();
      assert.equal(await panel.locator('.sky-foundation-ledger .sky-foundation-row').count(),placementOrder.length,'Placements restores ledger');
      await topTabs.filter({hasText:'Vocab'}).click();
      assert.ok(await panel.locator('.sky-vocab-panel').isVisible(),'Vocab still functions after visiting Card Hits');
      await topTabs.filter({hasText:'Placements'}).click();
      assert.ok(await saturn.isVisible(),'Placements still functions after Vocab');
      console.log('PASS placement detail and duplicate pip art',slot,width);
    }
    assert.deepEqual(errors,[],'browser page errors: '+errors.join('; '));
    await context.close();
  }
}finally{await browser.close()}
