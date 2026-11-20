import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const origin=process.env.GLYPH_TEST_ORIGIN||'http://127.0.0.1:4173';
const assets=[{id:'retrograde',paths:1,first:'m 50.066711'},{id:'anti-vertex',paths:3,first:'M27 57.623'}];
const browser=await chromium.launch({headless:true});
try{
  for(const [name,width,height] of [['desktop',1280,800],['mobile',390,844]]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin+'/glyphs-unified-preview.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(ids=>ids.every(id=>{
      const card=[...document.querySelectorAll('#ugGrid .ug-card')].find(node=>node.querySelector('.ug-id')?.textContent===id);
      return !!card?.querySelector('.relphi-glyph-'+id+' path');
    }),assets.map(x=>x.id),{timeout:30000});
    async function inspect(){return page.evaluate(ids=>{
      const get=id=>[...document.querySelectorAll('#ugGrid .ug-card')].find(card=>card.querySelector('.ug-id')?.textContent===id);
      return Object.fromEntries(ids.map(id=>{
        const card=get(id),art=card.querySelector('.relphi-glyph-'+id),
          ring=card.querySelector('.relphi-glyph-bubble>circle');
        const box=art.getBoundingClientRect(),circle=ring.getBoundingClientRect();
        const cx=circle.x+circle.width/2,cy=circle.y+circle.height/2;
        return[id,{
          viewBox:card.querySelector('svg')?.getAttribute('viewBox'),
          paths:art.querySelectorAll('path').length,
          liveText:art.querySelectorAll('text').length,
          embeddedCircle:art.querySelectorAll('circle').length,
          firstPath:art.querySelector('path')?.getAttribute('d')?.slice(0,24),
          centeredX:box.left+box.width/2-cx,centeredY:box.top+box.height/2-cy,
          farthest:Math.max(...[[box.left,box.top],[box.right,box.top],[box.left,box.bottom],[box.right,box.bottom]]
            .map(([x,y])=>Math.hypot(x-cx,y-cy))),
          circleOpacity:ring.style.opacity,
          canonicalOwner:art.dataset.canonicalGlyphId,
          staticMaster:art.dataset.staticMaster
        }];
      }));
    },assets.map(x=>x.id))}
    const circled=await inspect();
    for(const a of assets){
      const d=circled[a.id];
      assert.equal(d.viewBox,'-32 -32 64 64');
      assert.equal(d.paths,a.paths);
      assert.equal(d.liveText,0,'The original Retrograde master must not become two font-dependent characters');
      assert.equal(d.embeddedCircle,0,'The original SVG contains no circle');
      assert.ok(d.firstPath.startsWith(a.first),'The canonical glyph is the approved outline: '+a.id);
      assert.ok(Math.abs(d.centeredX)<1&&Math.abs(d.centeredY)<1,'Center on the original canonical ring: '+a.id);
      assert.ok(d.farthest<16.825,'Keep existing ring clearance: '+a.id);
      assert.equal(d.circleOpacity,'1');
      assert.equal(d.canonicalOwner,a.id);
      assert.equal(d.staticMaster,'true');
    }
    const raw=await page.evaluate(async ids=>Object.fromEntries(await Promise.all(ids.map(async id=>{
      const response=await fetch('assets/planet-glyphs/'+id+'.svg');
      assertResponse(response,id);
      const svg=new DOMParser().parseFromString(await response.text(),'image/svg+xml').documentElement;
      return[id,{viewBox:svg.getAttribute('viewBox'),paths:svg.querySelectorAll('path').length,
        texts:svg.querySelectorAll('text').length,circles:svg.querySelectorAll('circle').length}];
    }))),assets.map(x=>x.id));
    for(const asset of assets)assert.deepEqual(raw[asset.id],{viewBox:'0 0 100 100',paths:asset.paths,texts:0,circles:0});
    await page.screenshot({path:'retrograde-master-'+name+'.png',fullPage:true});
    await page.locator('[data-circle="false"]').click();
    const off=await inspect();
    assets.forEach(a=>assert.equal(off[a.id].circleOpacity,'0'));
    await page.locator('[data-circle="true"]').click();
    const restored=await inspect();
    assets.forEach(a=>assert.equal(restored[a.id].circleOpacity,'1'));
    assert.deepEqual(errors,[],'Canonical gallery should raise no JavaScript exceptions');
    console.log('Original outlined Retrograde/Anti-Vertex canonical master PASS',name,JSON.stringify(circled));
    await page.close();
  }
}finally{await browser.close()}
function assertResponse(response,id){if(!response.ok)throw new Error('Missing original canonical asset '+id)}
