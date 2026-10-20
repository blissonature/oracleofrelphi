import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const ASPECTS=['conjunction','semi-sextile','octile','sextile','quintile','square','trine','tri-octile','bi-quintile','quincunx','opposition'];
function placement(name,value){
  const longitude=((value%360)+360)%360,within=longitude%30;
  return{name,longitude,sign:SIGNS[Math.floor(longitude/30)],degree:Math.floor(within),minute:Math.floor((within%1)*60),second:0};
}
function sky(name,offset){
  const asc=168.38+offset,cusps=Array.from({length:12},(_,i)=>(asc+i*30)%360);
  const raw={Sun:195,Moon:118.42,Mercury:206.17,Venus:169.88,Mars:167.87,Jupiter:307.15,Saturn:235.57,Uranus:254.85,Neptune:271.02,Pluto:213.88,Ascendant:168.38,Descendant:348.38,Midheaven:76.28,IC:256.28,Chiron:74.48,'North Node':40.3,'South Node':220.3,Lilith:44.23,'Part of Fortune':244.97,Vertex:330.33};
  return{name,houseSystem:'equal-house',houseCusps:cusps,
    calcProfile:{source:'where-when-v3',dateTime:'2026-10-20T07:19',instant:'2026-10-20T13:19:00.000Z',location:'Salt Lake City, Utah',timeZone:'America/Denver',latitude:40.7608,longitude:-111.891,houseSystem:'equal-house',houseCusps:cusps},
    placements:Object.fromEntries(Object.entries(raw).map(([id,n])=>[id,placement(id,n+offset)]))};
}
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(({a,b,aspects})=>{
  localStorage.setItem('relphiSkyChartA',JSON.stringify(a));
  localStorage.setItem('relphiSkyChartB',JSON.stringify(b));
  localStorage.setItem('relphiSkyChartLastModeV1','comparison');
  // Only A↔B is selected. Every one of its eleven aspects is enabled.
  localStorage.setItem('relphiSkyAspectMatrixV1',JSON.stringify({'A-A':[],'B-B':[],'A-B':aspects}));
  localStorage.setItem('relphiSkyAspectBySignV2','[]');
  localStorage.setItem('relphiSkyVocabDisplayV1',JSON.stringify({glyphs:false,names:false,referents:true}));
  localStorage.setItem('relphiSkyHarmonicWindowV1','7');
},{a:sky('Marisa',0),b:sky('Comparison',8),aspects:ASPECTS});
await page.goto('http://127.0.0.1:4173/sky-chart.html',{waitUntil:'domcontentloaded',timeout:40000});
await page.waitForFunction(()=>document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy')==='false',{timeout:30000});
await page.waitForFunction(()=>document.documentElement.dataset.skyAspectMatrix==='ready'&&
  !!window.RelphiRelationshipExportFocus&&!!window.RelphiVocabCopySerializer,{timeout:30000});
const matrix=await page.evaluate(()=>window.RelphiRelationshipExportFocus.matrix());
assert.equal(matrix.aspects,'All','all eleven selected A↔B aspects must export as All');
assert.equal(matrix.scopes,'A↔B','only A↔B should be listed as a selected relationship scope');
const lines=await page.evaluate(()=>window.RelphiRelationshipExportFocus.lines());
assert.ok(lines.includes('Aspects: All'),JSON.stringify(lines));
assert.ok(lines.includes('Relationship scopes: A↔B'),JSON.stringify(lines));
assert.ok(lines.includes('Display: Referents'),'Display must come from the actual shared layer state');
assert.ok(!lines.some(line=>line.includes('None selected')),'stale checkbox summary must not enter export');

await page.waitForFunction(()=>document.querySelector('.sky-relationship-copy-button')?.dataset.scopeCopyOverride==='v8',{timeout:15000});
await page.waitForFunction(()=>document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row:not(.sky-chart-aspect-multiselect-hidden)').length>0,{timeout:30000});
await page.evaluate(()=>{
  window.__copy='';
  document.execCommand=function(command){
    if(command==='copy'){window.__copy=document.activeElement?.value||'';return true}
    return false;
  };
});
await page.locator('.sky-relationship-copy-button').click();
await page.waitForFunction(()=>window.__copy.startsWith('Relationships'),{timeout:10000});
const copied=await page.evaluate(()=>window.__copy);
assert.match(copied,/\nAspects: All\nRelationship scopes: A↔B\n/);
assert.ok(!copied.includes('Relationship scopes: None selected'));
assert.ok(copied.includes('A↔B'),'comparison results must remain in copy');
assert.ok(!copied.includes('\nA↔A\n'),'unselected A↔A must not be exported');

await page.evaluate(()=>{
  window.__png=null;
  window.htmlToImage={toBlob:async sheet=>{
    window.__png={summary:sheet.querySelector('.rex-summary')?.textContent||'',title:sheet.querySelector('.rex-title h1')?.textContent||''};
    return new Blob(['image'],{type:'image/png'});
  }};
});
await page.locator('#skyChartRelationshipsExport').click();
await page.waitForFunction(()=>!!window.__png,{timeout:20000});
const png=await page.evaluate(()=>window.__png);
assert.ok(png.summary.includes('Aspects: All'),png.summary);
assert.ok(png.summary.includes('Relationship scopes: A↔B'),png.summary);
assert.ok(png.summary.includes('Display: Referents'),png.summary);

// Real serializer against the actual collapsed-group DOM contract. Decorative
// summary previews must not enter the text, and every authored sentence gets a
// separate line even if its expandable section is closed.
const vocab=await page.evaluate(()=>{
  const panel=document.createElement('section');panel.dataset.skyVocabPanel='A';
  panel.innerHTML=
    '<div data-sky-vocab-paragraph>'+
    '<div class="sky-vocab-structures-heading">STRUCTURES</div>'+
    '<details class="sky-vocab-group">'+
    '<summary class="sky-vocab-group-summary"><span class="sky-vocab-group-title">Primary polarities</span>'+
    '<span class="sky-vocab-group-preview">Dsc⚷Vx MC☋</span></summary>'+
    '<div class="sky-vocab-group-body">'+
    '<div class="sky-vocab-line">Vertex polarity: partners and bonds.</div>'+
    '<div class="sky-vocab-line">Horizon polarity: balance and directness.</div>'+
    '</div></details>'+
    '<div class="sky-vocab-placements-heading">PLACEMENTS</div>'+
    '<details class="sky-vocab-group">'+
    '<summary class="sky-vocab-group-summary"><span class="sky-vocab-group-title">Luminaries</span>'+
    '<span class="sky-vocab-group-preview">☉☽</span></summary>'+
    '<div class="sky-vocab-group-body">'+
    '<div class="sky-vocab-line">Identity is in relationship.</div>'+
    '<div class="sky-vocab-line">Feelings are in care.</div>'+
    '</div></details>'+
    '</div>';
  return window.RelphiVocabCopySerializer.serializePanel(panel);
});
assert.match(vocab,/\n\nSTRUCTURES\n\nPrimary polarities\n\nVertex polarity: partners and bonds\.\nHorizon polarity: balance and directness\./);
assert.match(vocab,/\n\nPLACEMENTS\n\nLuminaries\n\nIdentity is in relationship\.\nFeelings are in care\./);
assert.ok(!vocab.includes('Dsc⚷Vx')&&!vocab.includes('☉☽'),'decorative glyph preview must not leak into copy');
assert.ok(!vocab.includes('bonds.Horizon'),'sentences cannot be joined without a line break');

// A partially selected matrix must not claim every aspect is enabled.
const partial=await page.evaluate(()=>{
  const master=document.querySelector('[data-aspect-matrix-scope="A-B"][data-aspect-matrix-aspect="all"]');
  if(master)master.checked=false;
  document.querySelectorAll('[data-aspect-matrix-scope="A-B"][data-aspect-matrix-aspect]').forEach(input=>{
    if(input.dataset.aspectMatrixAspect!=='all')input.checked=['conjunction','square','opposition'].includes(input.dataset.aspectMatrixAspect);
  });
  localStorage.setItem('relphiSkyAspectMatrixV1',JSON.stringify({'A-A':[],'B-B':[],'A-B':['conjunction','square','opposition']}));
  return window.RelphiRelationshipExportFocus.matrix();
});
assert.equal(partial.aspects,'Conjunction, Square, Opposition');
const empty=await page.evaluate(()=>{document.querySelectorAll('[data-aspect-matrix-scope="A-B"][data-aspect-matrix-aspect]').forEach(input=>{input.checked=false});localStorage.setItem('relphiSkyAspectMatrixV1',JSON.stringify({'A-A':[],'B-B':[],'A-B':[]}));return window.RelphiRelationshipExportFocus.matrix()});
assert.equal(empty.aspects,'All','no selected aspect types must be reported as All');
assert.equal(partial.scopes,'A↔B');
assert.deepEqual(errors,[],'no browser errors');
console.log('PASS A↔B-only matrix, Focus copy/PNG consistency, and separated Vocab groups');
await browser.close();
