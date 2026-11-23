import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const origin=process.env.GLYPH_TEST_ORIGIN||'http://127.0.0.1:4173';
const assets=[{id:'retrograde',paths:1,first:'M60.1246'},{id:'anti-vertex',paths:3,first:'M27 57.623'}];
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
      assert.equal(d.liveText,a.id==='retrograde'?1:0,'Only Retrograde needs the planet-name P as a live font glyph');
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
      if(!response.ok)throw new Error('Missing original canonical asset '+id);
      const svg=new DOMParser().parseFromString(await response.text(),'image/svg+xml').documentElement;
      return[id,{viewBox:svg.getAttribute('viewBox'),paths:svg.querySelectorAll('path').length,
        texts:svg.querySelectorAll('text').length,circles:svg.querySelectorAll('circle').length}];
    }))),assets.map(x=>x.id));
    for(const asset of assets)assert.deepEqual(raw[asset.id],{viewBox:'0 0 100 100',paths:asset.paths,texts:asset.id==='retrograde'?1:0,circles:0});
    const font=await page.evaluate(()=>{const card=[...document.querySelectorAll('#ugGrid .ug-card')].find(node=>node.querySelector('.ug-id')?.textContent==='retrograde');const text=card.querySelector('.relphi-glyph-retrograde text');const css=getComputedStyle(text);return{letter:text.textContent,fontFamily:css.fontFamily,fontWeight:css.fontWeight,fill:css.fill};});
    assert.equal(font.letter,'P','Use the exact letter P rendered by the planet-name typeface');
    assert.match(font.fontFamily,/system-ui/i);
    assert.equal(font.fontWeight,'700');
    assert.equal(font.fill,'rgb(17, 17, 17)');
    const rLeg=await page.evaluate(async()=>{
      const card=[...document.querySelectorAll('#ugGrid .ug-card')]
        .find(node=>node.querySelector('.ug-id')?.textContent==='retrograde');
      const art=card.querySelector('.relphi-glyph-retrograde');
      const source=await fetch('assets/planet-glyphs/retrograde.svg').then(r=>r.text());
      const svg=new DOMParser().parseFromString(source,'image/svg+xml').documentElement;
      const points=[...svg.querySelector('path').getAttribute('d').matchAll(/-?\d+(?:\.\d+)?/g)].map(m=>Number(m[0]));
      if(points.length!==24)throw new Error('R leg must contain symmetric diagonals and one P-stem extension');
      const pt=i=>({x:points[2*i],y:points[2*i+1]}),
        avg=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
      const slashStart=avg(pt(0),pt(1)),slashEnd=avg(pt(2),pt(3)),
        otherBottom=avg(pt(4),pt(5)),otherTop=avg(pt(6),pt(7));
      const angleA=Math.atan2(slashEnd.y-slashStart.y,slashEnd.x-slashStart.x),
        angleB=Math.atan2(otherTop.y-otherBottom.y,otherTop.x-otherBottom.x);
      const thickness=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
      const p=art.querySelector('text'),bounds=p.getBBox(),stemBottom=pt(10).y,stemWidth=pt(9).x-pt(8).x;
      return{upperLeft:slashStart,lowerRight:slashEnd,opposingUpperRight:otherTop,
        diagonalAngleDifference:Math.abs(Math.abs(angleA)-Math.abs(angleB)),
        strokeWidthDifference:Math.abs(thickness(pt(0),pt(1))-thickness(pt(4),pt(5))),
        overlapIntoPBowl:bounds.x+bounds.width-slashStart.x,
        stemBaseline:Number(p.getAttribute('y')),stemBottom,stemWidth,
        pExtent:bounds.x+bounds.width};
    });
    assert.ok(rLeg.diagonalAngleDifference<.001,'Both x diagonals must have the same angle');
    assert.ok(rLeg.strokeWidthDifference<.01,'Both x diagonals must have the same weight');
    assert.ok(rLeg.overlapIntoPBowl>=14,'The upper-left diagonal must enter the P bowl, not merely graze its edge');
    assert.ok(rLeg.upperLeft.x<59&&rLeg.upperLeft.y<54,'R leg must extend inside the P bowl');
    assert.ok(rLeg.stemWidth>5.4&&rLeg.stemWidth<5.6,'P extension must use the existing bold stem width');
    assert.ok(rLeg.stemBottom>=rLeg.stemBaseline+2.5&&rLeg.stemBottom<=rLeg.stemBaseline+3,
      'Visible P stem must extend to the neighboring text ink line');
    assert.ok(rLeg.upperLeft.y<rLeg.stemBaseline-6,'R diagonal must begin at the P bowl, above its baseline');
    console.log('RETROGRADE JOINED R LEG AND SYMMETRIC X',name,JSON.stringify(rLeg));
    await page.screenshot({path:'retrograde-master-'+name+'.png',fullPage:true});
    await page.locator('[data-circle="false"]').click();
    const off=await inspect();
    assets.forEach(a=>assert.equal(off[a.id].circleOpacity,'0'));
    await page.locator('[data-circle="true"]').click();
    const restored=await inspect();
    assets.forEach(a=>assert.equal(restored[a.id].circleOpacity,'1'));

    // The optional experiment must clone the actual Dsc / Vx letter primitive;
    // no registry entry, second renderer or modified master is allowed.
    await page.goto(origin+'/glyphs-unified-preview.html?mock=rx-typeface',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.getElementById('ugTypefaceStudy')?.dataset.mockReady==='true',null,{timeout:30000});
    const mock=await page.evaluate(()=>{
      const root=document.getElementById('ugTypefaceStudy');
      const svg=id=>root.querySelector('[data-typeface-source="'+id+'"] svg');
      const text=id=>svg(id)?.querySelector('text');
      const style=id=>{const n=text(id),cs=getComputedStyle(n);return{family:cs.fontFamily,size:cs.fontSize,weight:cs.fontWeight,spacing:cs.letterSpacing,text:n?.textContent}};
      const cases=[...root.querySelectorAll('[data-typeface-inline]')].map(n=>{const cs=getComputedStyle(n);return{family:cs.fontFamily,size:cs.fontSize,weight:cs.fontWeight,spacing:cs.letterSpacing,text:n.textContent}});
      const name=root.querySelector('.ug-typeface-placement span:first-child');
      const mark=root.querySelector('.ug-typeface-placement [data-typeface-inline]');
      return{visible:!root.hidden,vertex:style('vertex'),descendant:style('dsc'),candidate:style('mock'),cases,altPaths:svg('mock')?.querySelectorAll('path').length,canonicalPlanet:!!root.querySelector('[data-typeface-planet] .relphi-glyph-saturn'),addedPlanetRing:!!root.querySelector('[data-typeface-planet] .relphi-glyph-bubble>circle'),
        distance:mark.getBoundingClientRect().left-name.getBoundingClientRect().right};
    });
    assert.equal(mock.visible,true);
    assert.equal(mock.vertex.text,'Vx');
    assert.equal(mock.descendant.text,'Dsc');
    assert.equal(mock.candidate.text,'Px');
    assert.equal(mock.candidate.family,mock.vertex.family);
    assert.equal(mock.candidate.size,mock.vertex.size);
    assert.equal(mock.candidate.weight,mock.vertex.weight);
    assert.equal(mock.candidate.spacing,mock.vertex.spacing);
    assert.equal(mock.candidate.size,'16px');
    assert.equal(mock.candidate.weight,'700');
    assert.match(mock.candidate.family,/Montserrat/i);
    assert.equal(mock.altPaths,0,'Symmetrical font x, not custom X strokes');
    assert.equal(mock.canonicalPlanet,true,'Relationship mock must use the real Saturn master');
    assert.equal(mock.addedPlanetRing,false,'No added circle in the relationship glyph');
    for(const item of mock.cases){
      assert.equal(item.text,'Px');
      assert.equal(item.family,mock.vertex.family);
      assert.equal(item.size,mock.vertex.size);
      assert.equal(item.weight,mock.vertex.weight);
    }
    assert.ok(mock.distance>=4,'Placement mock must separate the symbol from the planet name');
    await page.screenshot({path:'retrograde-typeface-alternative-'+name+'.png',fullPage:true});
    console.log('Retrograde exact Dsc/Vx letterform alternative PASS',name,JSON.stringify(mock));

    assert.deepEqual(errors,[],'Canonical gallery should raise no JavaScript exceptions');
    console.log('Original outlined Retrograde/Anti-Vertex canonical master PASS',name,JSON.stringify(circled));
    await page.close();
  }
}finally{await browser.close()}
