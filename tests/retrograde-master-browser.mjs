import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const origin = process.env.GLYPH_TEST_ORIGIN || 'http://127.0.0.1:4173';
const glyphs = [
  {id:'retrograde',paths:0,text:['P','x']},
  {id:'anti-vertex',paths:3,text:[]}
];
const browser = await chromium.launch({headless:true});

async function ready(page) {
  await page.waitForFunction(ids => ids.every(id => {
    const card=[...document.querySelectorAll('#ugGrid .ug-card')]
      .find(node=>node.querySelector('.ug-id')?.textContent===id);
    return !!card?.querySelector('.relphi-glyph-'+id+' path, .relphi-glyph-'+id+' text');
  }),glyphs.map(g=>g.id),{timeout:30000});
}

async function inspect(page){
  return page.evaluate(ids=>{
    const get=id=>[...document.querySelectorAll('#ugGrid .ug-card')]
      .find(card=>card.querySelector('.ug-id')?.textContent===id);
    // SVG <text> reports its logical line box in getBoundingClientRect();
    // measure the actual visible ink instead to test circle clearance.
    function inkRect(text){
      const cs=getComputedStyle(text);
      const ctx=document.createElement('canvas').getContext('2d');
      ctx.font=cs.font;
      const metrics=ctx.measureText(text.textContent);
      const x=Number(text.getAttribute('x')),y=Number(text.getAttribute('y'));
      const m=text.getScreenCTM();
      const corners=[
        [x-metrics.actualBoundingBoxLeft,y-metrics.actualBoundingBoxAscent],
        [x+metrics.actualBoundingBoxRight,y-metrics.actualBoundingBoxAscent],
        [x-metrics.actualBoundingBoxLeft,y+metrics.actualBoundingBoxDescent],
        [x+metrics.actualBoundingBoxRight,y+metrics.actualBoundingBoxDescent]
      ].map(([px,py])=>[m.a*px+m.c*py+m.e,m.b*px+m.d*py+m.f]);
      const xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]);
      return {left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),
        bottom:Math.max(...ys),fontFamily:cs.fontFamily,fontWeight:cs.fontWeight};
    }
    const letters=Object.fromEntries(ids.map(id=>{
      const card=get(id),svg=card.querySelector('svg');
      const ring=card.querySelector('.relphi-glyph-bubble > circle');
      const art=card.querySelector('.relphi-glyph-'+id),texts=[...art.querySelectorAll('text')];
      const box=art.getBoundingClientRect(),circle=ring.getBoundingClientRect();
      const ink=texts.length?texts.map(inkRect):[{left:box.left,right:box.right,top:box.top,bottom:box.bottom}];
      const left=Math.min(...ink.map(r=>r.left)),right=Math.max(...ink.map(r=>r.right));
      const top=Math.min(...ink.map(r=>r.top)),bottom=Math.max(...ink.map(r=>r.bottom));
      const cx=circle.x+circle.width/2,cy=circle.y+circle.height/2;
      return [id,{
        viewBox:svg.getAttribute('viewBox'),
        paths:art.querySelectorAll('path').length,
        text:texts.map(t=>t.textContent),
        textStyle:ink.filter(r=>r.fontFamily).map(r=>({family:r.fontFamily,weight:r.fontWeight})),
        firstPath:art.querySelector('path')?.getAttribute('d')?.slice(0,25)||'',
        embeddedCircle:art.querySelectorAll('circle').length,
        dx:(left+right)/2-cx,dy:(top+bottom)/2-cy,
        farthest:Math.max(...[[left,top],[right,top],[left,bottom],[right,bottom]]
          .map(([x,y])=>Math.hypot(x-cx,y-cy))),
        clearRadius:19-2.35/2-1,
        ringOpacity:ring.style.opacity
      }];
    }));
    const vertex=get('vertex')?.querySelector('.relphi-glyph-vertex');
    return {letters,vertexFont:vertex?getComputedStyle(vertex).fontFamily:null,
      vertexWeight:vertex?getComputedStyle(vertex).fontWeight:null};
  },glyphs.map(g=>g.id));
}

try{
  for(const [name,width,height] of [['desktop',1280,800],['mobile',390,844]]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin+'/glyphs-unified-preview.html',{waitUntil:'domcontentloaded'});
    await ready(page);
    const circled=await inspect(page);
    assert.match(circled.vertexFont||'',/Montserrat/);
    assert.equal(circled.vertexWeight,'700');

    for(const glyph of glyphs){
      const data=circled.letters[glyph.id];
      assert.equal(data.viewBox,'-32 -32 64 64');
      assert.equal(data.paths,glyph.paths);
      assert.deepEqual(data.text,glyph.text);
      assert.equal(data.embeddedCircle,0,'No added circle in '+glyph.id+' master');
      assert.ok(Math.abs(data.dx)<1,'Visually centered horizontally: '+glyph.id);
      assert.ok(Math.abs(data.dy)<1,'Visually centered vertically: '+glyph.id);
      assert.ok(data.farthest<data.clearRadius,'Visible glyph fits inside canonical circle: '+glyph.id);
      assert.equal(data.ringOpacity,'1');
    }
    const retro=circled.letters.retrograde;
    assert.equal(retro.textStyle.length,2);
    assert.ok(retro.textStyle.every(x=>x.family.includes('system-ui')),
      'The P and x must share the system font used for Pluto');
    assert.deepEqual(retro.textStyle.map(x=>x.weight),['700','900'],
      'The P matches Pluto Bold, while the smaller subscript x uses optical bold weight');
    assert.ok(circled.letters['anti-vertex'].firstPath.startsWith('M27 57.623'));

    const assets=await page.evaluate(async ids=>Object.fromEntries(await Promise.all(ids.map(async id=>{
      const response=await fetch('assets/planet-glyphs/'+id+'.svg');
      if(!response.ok)throw new Error('Missing canonical glyph asset: '+id);
      const svg=new DOMParser().parseFromString(await response.text(),'image/svg+xml').documentElement;
      return [id,{viewBox:svg.getAttribute('viewBox'),paths:svg.querySelectorAll('path').length,
        circles:svg.querySelectorAll('circle').length,text:[...svg.querySelectorAll('text')].map(n=>n.textContent)}];
    }))),glyphs.map(g=>g.id));
    for(const glyph of glyphs)assert.deepEqual(assets[glyph.id],{
      viewBox:'0 0 100 100',paths:glyph.paths,circles:0,text:glyph.text
    },'The canonical asset remains the single authored glyph source: '+glyph.id);

    await page.screenshot({path:'retrograde-master-'+name+'.png',fullPage:true});
    await page.locator('[data-circle="false"]').click();await ready(page);
    const uncircled=await inspect(page);
    for(const glyph of glyphs){
      const before=circled.letters[glyph.id],after=uncircled.letters[glyph.id];
      assert.equal(after.ringOpacity,'0');
      assert.ok(Math.abs(after.dx-before.dx)<.25);
      assert.ok(Math.abs(after.dy-before.dy)<.25);
    }
    await page.locator('[data-circle="true"]').click();await ready(page);
    const restored=await inspect(page);
    for(const glyph of glyphs)assert.equal(restored.letters[glyph.id].ringOpacity,'1');
    assert.deepEqual(errors,[],'Canonical Master Glyph List has no page errors');
    console.log('Pluto-matched Retrograde / Anti-Vertex master Chromium PASS:',name,JSON.stringify(circled));
    await page.close();
  }
}finally{await browser.close()}
