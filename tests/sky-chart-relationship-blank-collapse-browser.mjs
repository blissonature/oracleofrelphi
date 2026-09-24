import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const sample = (name, offset) => ({
  name,
  houseSystem:'whole-sign',
  houseCusps:Array.from({length:12}, (_,i)=>(165 + offset + i*30)%360),
  placements:{
    Sun:{name:'Sun',longitude:(195+offset)%360},
    Moon:{name:'Moon',longitude:(118.4+offset)%360},
    Ascendant:{name:'Ascendant',longitude:(165+offset)%360},
    Mercury:{name:'Mercury',longitude:(206.1+offset)%360},
    Venus:{name:'Venus',longitude:(169.8+offset)%360},
    Mars:{name:'Mars',longitude:(167.8+offset)%360},
    Jupiter:{name:'Jupiter',longitude:(307.1+offset)%360},
    Saturn:{name:'Saturn',longitude:(235.5+offset)%360},
    Uranus:{name:'Uranus',longitude:(254.8+offset)%360},
    Neptune:{name:'Neptune',longitude:(271+offset)%360},
    Pluto:{name:'Pluto',longitude:(213.8+offset)%360}
  }
});

const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:1280,height:1000}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(({a,b})=>{
    localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
    localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
    localStorage.setItem('relphiSkyVocabDisplayV1',JSON.stringify({glyphs:true,names:true,referents:true}));
  },{a:sample('Sky A test',0),b:sample('Sky B test',73)});

  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:15000});
  const row=page.locator('.sky-foundation-relationship-row[data-relation-index]:visible').first();
  await row.waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>document.querySelector('.sky-foundation-relationship-row[data-relation-index]:not([hidden]) .sky-rel-vocab-line'),null,{timeout:10000});

  const fusion=await row.evaluate(node=>({
    tokens:node.querySelectorAll('[data-rel-vocab-token]').length,
    names:[...node.querySelectorAll('.sky-rel-vocab-name')].map(el=>el.textContent.trim()),
    referents:[...node.querySelectorAll('.sky-rel-vocab-referent')].map(el=>el.textContent.trim()),
    originalTilePartsHidden:[...node.querySelectorAll(':scope>.sky-foundation-relationship-placement,:scope>.sky-foundation-relationship-glyph--aspect,:scope>.sky-foundation-relationship-orb')].every(el=>getComputedStyle(el).display==='none')
  }));
  assert.equal(fusion.tokens,3,'Relationship fusion surface should read as three Vocab-like tokens.');
  assert.ok(fusion.names.every(Boolean),'Relationship fusion tokens should expose readable names.');
  assert.ok(fusion.referents.every(Boolean),'Relationship fusion tokens should expose referents.');
  assert.equal(fusion.originalTilePartsHidden,true,'Legacy tile geometry should yield to the prose surface.');

  await page.evaluate(()=>window.RelphiSkyRelationshipDisplay?.setState?.({glyphs:false,names:true,referents:false}));
  await page.waitForFunction(()=>[...document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]:not([hidden]) [data-rel-vocab-token]')].every(token=>getComputedStyle(token.querySelector('.sky-rel-vocab-glyph')).display==='none'&&!token.querySelector('.sky-rel-vocab-name').hidden&&token.querySelector('.sky-rel-vocab-referent').hidden));
  await row.locator('[data-rel-vocab-token="left"]').click();
  await page.waitForFunction(()=>document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-isolation'));
  assert.equal(await row.locator('[data-rel-vocab-token="left"]').evaluate(token=>token.classList.contains('is-wheel-active')),true,'A relationship token should temporarily isolate its wheel context.');
  assert.equal(await row.locator('[data-rel-vocab-token="left"] .sky-rel-vocab-glyph').evaluate(el=>el.hidden),false,'Progressive reveal should add a globally hidden layer locally.');

  await page.evaluate(()=>document.getElementById('skyFoundationComparison')?.dispatchEvent(new MouseEvent('click',{bubbles:true})));
  await page.waitForFunction(()=>!document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel')?.classList.contains('has-isolation'));
  await page.evaluate(()=>window.RelphiSkyRelationshipDisplay?.setState?.({glyphs:true,names:true,referents:true}));

  await page.evaluate(()=>document.querySelector('.sky-foundation-relationship-row[data-relation-index]:not([hidden])')?.dispatchEvent(new MouseEvent('click',{bubbles:true})));
  await page.waitForFunction(()=>document.querySelector('.sky-foundation-relationship-row.is-inline-expanded'));
  assert.equal(await row.getAttribute('aria-expanded'),'true','relationship row should expand');

  await page.waitForFunction(()=>[...document.querySelectorAll('.sky-foundation-relationship-row.is-inline-expanded .inline-rel-card-art img')].length===2&&[...document.querySelectorAll('.sky-foundation-relationship-row.is-inline-expanded .inline-rel-card-art img')].every(img=>img.complete&&img.naturalWidth>0),null,{timeout:10000});
  const inlineCardArt=await page.evaluate(()=>[...document.querySelectorAll('.sky-foundation-relationship-row.is-inline-expanded .inline-rel-card-art')].map(frame=>{
    const img=frame.querySelector('img'),fs=getComputedStyle(frame),is=getComputedStyle(img),fr=frame.getBoundingClientRect(),ir=img.getBoundingClientRect();
    const bl=parseFloat(fs.borderLeftWidth)||0,br=parseFloat(fs.borderRightWidth)||0,bt=parseFloat(fs.borderTopWidth)||0,bb=parseFloat(fs.borderBottomWidth)||0;
    return{
      frameRadius:fs.borderRadius,
      framePadding:[fs.paddingTop,fs.paddingRight,fs.paddingBottom,fs.paddingLeft],
      frameBorder:[fs.borderTopWidth,fs.borderRightWidth,fs.borderBottomWidth,fs.borderLeftWidth],
      frameColor:fs.borderTopColor,
      frameOverflow:fs.overflow,
      imgRadius:is.borderRadius,
      imgBorder:is.borderWidth,
      imgFit:is.objectFit,
      imgAspect:is.aspectRatio,
      imgClip:is.clipPath,
      sourceRatio:img.naturalWidth/img.naturalHeight,
      renderedRatio:ir.width/ir.height,
      flush:{
        left:Math.abs(ir.left-(fr.left+bl)),
        right:Math.abs(ir.right-(fr.right-br)),
        top:Math.abs(ir.top-(fr.top+bt)),
        bottom:Math.abs(ir.bottom-(fr.bottom-bb))
      }
    };
  }));
  assert.equal(inlineCardArt.length,2,'expanded relationship must show two card-art frames');
  inlineCardArt.forEach(item=>{
    assert.equal(item.frameRadius,'0px','dual-card Sky stroke must have sharp corners');
    assert.deepEqual(item.framePadding,['0px','0px','0px','0px'],'dual-card Sky stroke must be flush to the card art');
    assert.deepEqual(item.frameBorder,['2px','2px','2px','2px'],'dual-card Sky assignment stroke must remain visible');
    assert.equal(item.frameOverflow,'visible');
    assert.equal(item.imgRadius,'0px','dual-card tarot image must have sharp corners');
    assert.equal(item.imgBorder,'0px','stroke belongs outside the image pixels');
    assert.equal(item.imgFit,'contain');
    assert.equal(item.imgAspect,'auto');
    assert.equal(item.imgClip,'none');
    assert.ok(Math.abs(item.renderedRatio-item.sourceRatio)<0.01,'dual-card art must preserve the source image aspect ratio');
    assert.ok(Object.values(item.flush).every(delta=>delta<=0.75),'dual-card art must touch the inside edge of its Sky stroke without a gap');
  });
  assert.equal(inlineCardArt[0].frameColor,'rgb(201, 33, 30)','Sky A card stroke must stay red');
  assert.equal(inlineCardArt[1].frameColor,'rgb(36, 98, 208)','Sky B card stroke must stay blue');

  const blank=await page.evaluate(()=>{
    const row=document.querySelector('.sky-foundation-relationship-row.is-inline-expanded');
    const detail=row?.querySelector(':scope > .inline-rel-detail');
    if(!row||!detail)return null;
    const r=detail.getBoundingClientRect();
    const interactive='a,button,input,select,textarea,label,[role="button"],[data-inline-progressive-glyph],[data-inline-ledger]';
    for(let y=r.top+3;y<r.bottom-3;y+=4){
      for(let x=r.left+3;x<r.right-3;x+=4){
        const el=document.elementFromPoint(x,y);
        if(!el||!row.contains(el))continue;
        const interactiveHit=el.closest(interactive);
        if(interactiveHit&&interactiveHit!==row)continue;
        return{x,y,target:el.className?.baseVal||el.className||el.tagName};
      }
    }
    return null;
  });
  assert.ok(blank,'expanded relationship should contain a clickable blank point');
  await page.mouse.click(blank.x,blank.y);
  await page.waitForFunction(()=>!document.querySelector('.sky-foundation-relationship-row.is-inline-expanded'),null,{timeout:5000});
  assert.equal(await row.getAttribute('aria-expanded'),'false','blank-space click should collapse relationship row');

  await row.click();
  await page.waitForFunction(()=>document.querySelector('.sky-foundation-relationship-row.is-inline-expanded'));
  assert.equal(await row.getAttribute('aria-expanded'),'true','relationship row should expand again after collapse');

  assert.deepEqual(errors,[],`browser errors: ${errors.join(' | ')}`);
  console.log(`relationship blank-collapse regression passed at target ${blank.target}`);
} finally {
  await browser.close();
}