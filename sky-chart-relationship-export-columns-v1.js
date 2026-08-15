// Export every filtered relationship, 30 rows per column, without changing live-list laziness.
// PNG rasterization is intentionally click-driven so export work never competes with Sky Chart interaction.
(function(){
'use strict';
if(window.__relphiRelationshipExportColumnsV2)return;
window.__relphiRelationshipExportColumnsV2=true;
window.__relphiRelationshipExportColumnsV1=true;

const ID='skyChartRelationshipsExport';
const ROWS=30;
const W=430;
const GAP=8;
const PAD=16;
const LIB='https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js';
const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
let busy=false,pending=null,libPromise=null;

const ios=()=>/iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const status=text=>{const node=document.getElementById('skyChartExportStatus');if(node)node.textContent=text||''};
const read=slot=>{try{return JSON.parse(localStorage.getItem(slot==='A'?'relphiSkyChartA':'relphiSkyChartB')||'null')}catch(_){return null}};
const name=slot=>{const value=read(slot)||{},meta=value.metadata||{};return meta.savedSkyName||value.name||value.displayName||value.skyName||value.title||`Sky ${slot}`};
const safe=value=>String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'sky';
const fileName=()=>`${safe(name('A'))}-vs-${safe(name('B'))}-relationships-${new Date().toISOString().slice(0,16).replace(/[-:T]/g,'')}.png`;

function visible(row){const style=getComputedStyle(row);return!row.hidden&&style.display!=='none'&&style.visibility!=='hidden'}
function currentRows(){return[...document.querySelectorAll('#skyFoundationRelationshipList .sky-foundation-relationship-row')].filter(visible)}
function summary(){
  const bar=document.querySelector('#skyFoundationRelationships .sky-chart-filter-bar');if(!bar)return'';
  const parts=[],harmonic=bar.querySelector('[data-harmonic-window-input]');
  if(harmonic?.value)parts.push(`Harmonic window ${harmonic.value}°`);
  for(const [selector,label] of [['[data-placement-filter-summary]','Placements'],['[data-house-filter-summary]','Houses'],['[data-aspect-filter-summary]','Aspects']]){
    const text=(bar.querySelector(selector)?.textContent||'').replace(/\s+/g,' ').trim();
    if(text&&!/^all$/i.test(text))parts.push(`${label}: ${text}`);
  }
  for(const select of bar.querySelectorAll('select')){
    const text=(select.selectedOptions?.[0]?.textContent||'').trim();if(!text||/^all$/i.test(text)||/^none$/i.test(text))continue;
    const data=String(select.dataset.filter||select.dataset.zodiacFilter||select.name||'').toLowerCase();
    const label=data.includes('zodiac')||data.includes('sign')?'Zodiac signs':data.includes('aspect')?'Aspects':data.includes('house')?'Houses':'Filter';
    const item=`${label}: ${text}`;if(!parts.includes(item))parts.push(item);
  }
  return parts.join(' · ');
}
function load(){
  if(window.htmlToImage?.toBlob)return Promise.resolve(window.htmlToImage);
  if(libPromise)return libPromise;
  libPromise=new Promise((resolve,reject)=>{
    let script=document.querySelector(`script[src="${LIB}"]`);
    if(!script){script=document.createElement('script');script.src=LIB;script.async=true;script.crossOrigin='anonymous';document.head.appendChild(script)}
    const ready=()=>window.htmlToImage?.toBlob?resolve(window.htmlToImage):reject(Error('PNG exporter unavailable.'));
    script.addEventListener('load',ready,{once:true});script.addEventListener('error',()=>reject(Error('PNG exporter did not load.')),{once:true});
    if(window.htmlToImage?.toBlob)resolve(window.htmlToImage);
  });
  return libPromise;
}
function styles(){
  if(document.getElementById('relExportColumnStyle'))return;
  const style=document.createElement('style');style.id='relExportColumnStyle';style.textContent=`
    .rel-export-sheet{box-sizing:border-box;padding:${PAD}px;border:1px solid #ded9d2;border-radius:14px;background:#fffdf8;color:#191613;font-family:system-ui,sans-serif}
    .rel-export-head{display:flex;justify-content:space-between;align-items:center;padding:0 2px 10px;font-size:22px;font-weight:800}
    .rel-export-head span{padding:6px 10px;border-radius:999px;background:#f0ebe4;font-size:13px}
    .rel-export-summary{margin:0 0 12px;padding:10px;border-radius:9px;background:#f6f0e8;color:#5d554e;text-align:center;font-weight:750}
    .rel-export-cols{display:flex;align-items:flex-start;gap:${GAP}px}
    .rel-export-col{display:grid;gap:6px;width:${W}px;min-width:${W}px}
    .rel-export-col>.sky-foundation-relationship-row{box-sizing:border-box;width:${W}px!important;min-width:${W}px!important;max-width:${W}px!important;margin:0!important}`;
  document.head.appendChild(style);
}
function cleanClone(row){
  const clone=row.cloneNode(true);clone.dataset.relationshipExportClone='true';
  clone.classList.remove('is-inline-expanded','is-wheel-related','is-row-hovered');clone.removeAttribute('aria-current');clone.querySelector(':scope>.inline-rel-detail')?.remove();return clone;
}
async function hydrate(clone,row){
  const templates=window.RelphiRelationshipGlyphTemplates;if(!templates?.clone)return;
  const aspect=String(row.dataset.aspect||''),leftSign=SIGNS[+row.dataset.leftSign],rightSign=SIGNS[+row.dataset.rightSign];
  const specs=[
    [clone.querySelector('.sky-foundation-relationship-glyph--left'),row.dataset.leftPlacement,templates.colors.A],
    [clone.querySelector('.sky-foundation-relationship-placement--left .sky-foundation-relationship-sign'),leftSign,templates.colors.A],
    [clone.querySelector('.sky-foundation-relationship-glyph--aspect'),aspect,templates.colors.aspects[aspect]],
    [clone.querySelector('.sky-foundation-relationship-glyph--right'),row.dataset.rightPlacement,templates.colors.B],
    [clone.querySelector('.sky-foundation-relationship-placement--right .sky-foundation-relationship-sign'),rightSign,templates.colors.B]
  ];
  await Promise.all(specs.map(async([host,id,color])=>{if(!host||!id||host.firstElementChild?.tagName?.toLowerCase()==='svg')return;const svg=await templates.clone(id,color||'#777');if(svg)host.replaceChildren(svg)}));
}
async function build(){
  styles();const rows=currentRows();if(!rows.length)throw Error('No relationships match the current filters.');
  const cols=Math.ceil(rows.length/ROWS),width=PAD*2+cols*W+(cols-1)*GAP;
  const host=document.createElement('div'),sheet=document.createElement('div');
  host.dataset.relationshipExportHost='true';
  Object.assign(host.style,{position:'fixed',left:'-100000px',top:'0',width:`${width}px`,background:'#fffdf8',zIndex:'-1'});
  sheet.className='rel-export-sheet';sheet.style.width=`${width}px`;sheet.innerHTML=`<div class="rel-export-head">Relationships <span>${document.getElementById('skyFoundationRelationshipCount')?.textContent||rows.length}</span></div>`;
  const filter=summary();if(filter){const line=document.createElement('div');line.className='rel-export-summary';line.textContent=`Showing only: ${filter}`;sheet.appendChild(line)}
  const wrap=document.createElement('div');wrap.className='rel-export-cols';sheet.appendChild(wrap);host.appendChild(sheet);document.body.appendChild(host);
  const jobs=[];
  for(let index=0;index<cols;index++){
    const column=document.createElement('div');column.className='rel-export-col';wrap.appendChild(column);
    for(const row of rows.slice(index*ROWS,(index+1)*ROWS)){const clone=cleanClone(row);column.appendChild(clone);jobs.push(hydrate(clone,row))}
  }
  await Promise.allSettled(jobs);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  return{host,sheet,width,height:Math.ceil(sheet.scrollHeight),count:rows.length,cols};
}
async function png(built){
  if(document.fonts?.ready)await document.fonts.ready.catch(()=>{});
  const exporter=await load();
  const ratio=built.count>80?1:built.count>40?1.2:1.5;
  const blob=await exporter.toBlob(built.sheet,{backgroundColor:'#fffdf8',width:built.width,height:built.height,pixelRatio:ratio,canvasWidth:Math.ceil(built.width*ratio),canvasHeight:Math.ceil(built.height*ratio),skipAutoScale:true});
  if(!blob)throw Error('PNG exporter returned no image.');
  return new File([blob],fileName(),{type:'image/png'});
}
function download(file){const url=URL.createObjectURL(file),anchor=document.createElement('a');anchor.href=url;anchor.download=file.name;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
async function run(button){
  if(busy)return;
  if(ios()&&pending){try{await navigator.share({files:[pending]})}catch(error){if(error?.name!=='AbortError')console.error(error)}return}
  busy=true;button.disabled=true;status('Preparing complete Relationships PNG…');let built;
  try{
    built=await build();const file=await png(built);
    if(ios()){pending=file;button.dataset.exportReady='true';status(`PNG ready — ${built.count} relationships in ${built.cols} columns. Tap again to share.`)}
    else{download(file);status(`PNG download started — ${built.count} relationships in ${built.cols} columns.`)}
  }catch(error){console.error(error);status(`Export failed: ${error.message||error}`)}
  finally{built?.host.remove();busy=false;button.disabled=false}
}
document.addEventListener('click',event=>{const button=event.target.closest?.(`#${ID}`);if(!button)return;event.preventDefault();event.stopImmediatePropagation();run(button)},true);
['relphi:sky-foundation-ready','relphi:sky-orb-limit-changed','relphi:sky-harmonic-window-visibility-changed','relphi:sky-placement-multiselect-changed','relphi:sky-house-multiselect-changed','relphi:sky-aspect-multiselect-changed','relphi:sky-zodiac-filter-changed'].forEach(name=>window.addEventListener(name,()=>{pending=null;const button=document.getElementById(ID);if(button)delete button.dataset.exportReady}));
// Loading the small exporter library in advance is cheap; rendering the PNG is not.
load().catch(()=>{});
})();