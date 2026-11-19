import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

const BASE='http://127.0.0.1:4173/';
const suits={Wands:'wands',Cups:'cups',Swords:'swords','Pentacles/Disks':'pentacles'};
const masterDir='assets/inscribed-glyphs/suit-review-v1/';
for(const [label,id] of Object.entries(suits)){
 const source=readFileSync(masterDir+id+'.svg','utf8');
 assert.match(source,/viewBox="-32 -32 64 64"/,id+' must share canonical artboard');
 assert.match(source,/<circle cx="0" cy="0" r="19" fill="#fff" stroke="currentColor" stroke-width="2.35"/,id+' must contain approved-style authored outer circle');
 assert.match(source,new RegExp('data-canonical-glyph-id="suit-'+id+'"'));
 assert.match(source,/class="relphi-canonical-glyph"/);
 assert.doesNotMatch(source,/<script\\b|<foreignObject\\b|<text\\b|<use\\b|transform=|<image\\b/i,'Suit may not generate geometry, load fonts or depend on runtime transforms');
}
const app=readFileSync('tarot-app.js','utf8');
assert.doesNotMatch(app,/function (?:wandSvg|cupSvg|swordSvg|pentacleSvg|glyphSvg)\(/,'Old procedural suit drawing must be deleted');
assert.match(app,/function suitGlyph\(card\)/);
assert.match(app,/class="or-suit-inscribed-master"/);

const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'tarot-suit-inscription-review.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>[...document.querySelectorAll('.sample > img')].length===4&&[...document.querySelectorAll('.sample > img')].every(img=>img.complete&&img.naturalWidth>0));
  const gallery=await page.evaluate(()=>{
   return [...document.querySelectorAll('.sample')].map(x=>{
    const img=x.querySelector('.filter img');
    const outer=img.getBoundingClientRect(),button=x.querySelector('.filter').getBoundingClientRect();
    return {src:img.getAttribute('src'),width:outer.width,height:outer.height,buttonWidth:button.width};
   });
  });
  assert.equal(gallery.length,4);
  assert.ok(gallery.every(item=>Math.abs(item.width-33.76)<1.2&&Math.abs(item.buttonWidth-20.48)<1.2));
  const choice=page.locator('.sample button[data-filter="Cups"]');
  await choice.click();
  assert.equal(await choice.getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('#selection').textContent(),/Cups/);
  await page.screenshot({path:'suit-artwork-review-'+viewport.width+'.png',fullPage:true});

  await page.goto(BASE+'tarot.html',{waitUntil:'domcontentloaded'});
  await page.locator('#showAllCards').click();
  await page.waitForSelector('#cardList .or-chip--suit img.or-suit-inscribed-master',{state:'attached',timeout:25000});
  const summary=await page.evaluate(()=>{
    const chips=[...document.querySelectorAll('#cardList .or-chip--suit')];
    const bySuit={};
    for(const chip of chips) {
      const filter=chip.dataset.filter,id={Wands:'wands',Cups:'cups',Swords:'swords','Pentacles/Disks':'pentacles'}[filter],img=chip.querySelector('img');
      if(!id||!img)throw Error('Suit chip missing known SVG master');
      if(img.getAttribute('src')!=='assets/inscribed-glyphs/suit-review-v1/'+id+'.svg')throw Error('Suit chip switched asset');
      if(!img.complete||img.naturalWidth===0)throw Error('Suit image failed to load');
      const style=getComputedStyle(chip);
      if(style.borderTopWidth!=='0px'||style.boxShadow!=='none')throw Error('Button creates unauthorized second ring or shadow: '+filter+' '+style.borderTopWidth+' '+style.boxShadow);
      if(chip.querySelector('svg'))throw Error('Procedural suit SVG still present');
      bySuit[filter]=(bySuit[filter]||0)+1;
    }
    return{bySuit,total:chips.length,heading:document.querySelector('#browsePanel h2')?.textContent};
  });
  assert.deepEqual(Object.keys(summary.bySuit).sort(),Object.keys(suits).sort(),'All four suit designs must render in the real card list');
  assert.ok(summary.total>=40,'Suits must appear across many actual cards');

  const show=page.locator('#cardList [data-result-glyph-toggle]');
  if(await show.textContent()==='Show glyphs')await show.click();
  const wands=page.locator('#cardList .or-chip--suit[data-filter="Wands"]').first();
  await wands.scrollIntoViewIfNeeded();
  await wands.click({force:true});
  const filterDiagnostic=await page.evaluate(()=>({
    remove:[...document.querySelectorAll('#cardList [data-remove-filter]')].map(x=>({value:x.dataset.removeFilter,hidden:x.hidden,display:getComputedStyle(x).display})),
    clear:[...document.querySelectorAll('#cardList [data-clear-filters]')].map(x=>({hidden:x.hidden,display:getComputedStyle(x).display})),
    resultCount:document.querySelectorAll('#cardList .or-card').length,
    browseHidden:document.getElementById('browsePanel')?.hidden,
    summary:document.getElementById('resultInlineCount')?.textContent
  }));
  console.log('FILTER_DIAGNOSTIC',JSON.stringify(filterDiagnostic));
  assert.ok(filterDiagnostic.remove.some(x=>x.value==='Wands'),
    'Wands filter must be registered after clicking its real suit chip: '+JSON.stringify(filterDiagnostic));
  const visible=await page.locator('#cardList .or-card[data-id]').count();
  assert.ok(visible>0&&visible<summary.total,'Suit filter should narrow cards, not break interaction');
  await page.locator('#cardList [data-clear-filters]').click();
  await page.waitForFunction(()=>!document.querySelector('#cardList [data-remove-filter]'));
  assert.deepEqual(errors,[],'No page errors while loading/filtering suit assets');
  await page.screenshot({path:'suit-ledger-filter-'+viewport.width+'.png',fullPage:false});
  console.log('PASS '+viewport.width+': four complete framed SVGs, no secondary frame, filter narrows results, reset works');
  await page.close();
 }
}finally{await browser.close()}
