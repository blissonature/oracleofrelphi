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
  },{a:sample('Sky A test',0),b:sample('Sky B test',73)});

  await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'networkidle'});
  await page.waitForSelector('#skyFoundationRoot[aria-busy="false"]',{timeout:15000});
  const row=page.locator('.sky-foundation-relationship-row[data-relation-index]:visible').first();
  await row.waitFor({state:'visible',timeout:15000});

  await row.click();
  await page.waitForFunction(()=>document.querySelector('.sky-foundation-relationship-row.is-inline-expanded'));
  assert.equal(await row.getAttribute('aria-expanded'),'true','relationship row should expand');

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