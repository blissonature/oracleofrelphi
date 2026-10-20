const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const fit=require('../tarot-ledger-gallery-fit.js');
const html=fs.readFileSync(path.join(__dirname,'../tarot.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../tarot-ledger-gallery-fit.css'),'utf8');
const app=fs.readFileSync(path.join(__dirname,'../tarot-app.js'),'utf8');
test('new visitors can hide entry; gallery defaults to bounded fit and grid',()=>{
 assert.deepEqual(fit.load({getItem:()=>null}),{mode:'fit',min:112,max:320,entryVisible:true});
 const state=fit.normalize({mode:'manual',entryVisible:false,view:'book',min:82,max:192});
 assert.equal(state.entryVisible,false);
 assert.equal(state.min,82);assert.equal(state.max,192);
 const tooSmall=fit.normalize({min:-200,max:0});assert.ok(tooSmall.min>=64);
 const inverted=fit.normalize({min:250,max:120});
 assert.ok(inverted.max>=inverted.min);
});
test('minimum and maximum widths are user bounds in fit mode',()=>{
 const result=fit.plan(1180,700,8,{min:112,max:260});
 assert.ok(result.cardWidth>=112);
 assert.ok(result.cardWidth<=260);
 assert.equal(result.columns*result.rows>=8,true);
 assert.equal(result.fits,true);
 const narrow=fit.plan(312,750,4,{min:112,max:320});
 assert.ok(narrow.cardWidth>=112);
 assert.ok(narrow.cardWidth<=320);
});
test('many cards scroll instead of breaking the user minimum',()=>{
 const result=fit.plan(980,650,78,{min:124,max:280});
 assert.equal(result.fits,false);
 assert.ok(result.cardWidth>=124);
 assert.ok(result.cardWidth<=280);
 assert.ok(result.columns*result.rows>=78);
});
test('one or two cards use available space up to the configured maximum',()=>{
 const one=fit.plan(1100,800,1,{min:112,max:350});
 const two=fit.plan(1100,800,2,{min:112,max:350});
 assert.equal(one.cardWidth,350);
 assert.ok(two.cardWidth>=112&&two.cardWidth<=350);
});
test('computed presentation applies only to Ledger result cards',()=>{
 const props={},attr={};
 const makeStyle=()=>({setProperty(k,v,p){props[k]=[v,p]},removeProperty(k){delete props[k]}});
 const cards=Array.from({length:5},()=>({style:makeStyle()}));
 const grid={style:makeStyle(),dataset:attr,clientWidth:950,parentElement:null,querySelectorAll(selector){
  assert.equal(selector,'.or-card.tarot-card-surface');return cards;
 }};
 const layout=fit.apply(grid,{min:110,max:290},5,900);
 assert.ok(layout.cardWidth>=110&&layout.cardWidth<=290);
 assert.equal(attr.galleryFit,'complete');
 assert.match(props['grid-template-columns'][0],/^repeat\(/);
 assert.equal(props['grid-template-columns'][1],'important');
 assert.ok(cards.every(c=>c.style&&Object.keys(props).length));
 fit.reset(grid);
 assert.equal(props['grid-template-columns'],undefined);
});
test('Ledger reuses its existing two-column layout with entry navigation',()=>{
 for(const id of ['toggleLedgerEntry','cardDetail','cardList']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.doesNotMatch(html,/ledgerBookView|ledgerGridView|tarotStorybook/);
 assert.doesNotMatch(app,/renderBookPage\(|data-book-step|ledgerBookView/);
 assert.match(app,/function setLedgerEntryVisible\(/);
 assert.match(app,/data\.entryVisible|dataset\.entryVisible/);
 assert.match(app,/function navigateLedgerEntry\(step\)/);
 assert.match(app,/data-ledger-entry-step/);
 assert.match(app,/data-ledger-entry-close/);
 assert.match(app,/function reflectSelectedGalleryCard\(/);
 assert.match(app,/list\.findIndex\(item => item\.card_id === state\.selected\?\.card_id\)/);
 assert.match(app,/function renderDetail\(card\)/);
 assert.match(app,/data-gallery-min/);
 assert.match(app,/data-gallery-max/);
 assert.match(html,/tarot-ledger-gallery-fit\.js/);
 assert.match(html,/tarot-ledger-gallery-fit\.css/);
 assert.match(css,/html body\.tarot-ledger-page #browsePanel\[data-entry-visible="false"\]/);
 assert.match(css,/#cardDetail \.ledger-entry-nav/);
 assert.doesNotMatch(css,/tarot-book|ledger-gallery-view-switch|tarotStorybook/);
 assert.ok(!css.includes('#shortListPanel'),'Drawing Board must be untouched');
});
