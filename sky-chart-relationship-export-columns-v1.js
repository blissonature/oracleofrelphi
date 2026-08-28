// Export every filtered relationship, 30 rows per column, without changing live-list laziness.
// PNG rasterization is intentionally click-driven so export work never competes with Sky Chart interaction.
(function(){
'use strict';
if(window.__relphiRelationshipExportColumnsV2)return;
window.__relphiRelationshipExportColumnsV2=true;
window.__relphiRelationshipExportColumnsV1=true;

const ID='skyChartRelationshipsExport';
const ROWS=20;
const W=520;
const GAP=8;
const PAD=16;
const LIB='https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js';
const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
const SIGN_NAMES=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_REFERENTS={Aries:'initiative, directness, courage, impulse, and beginning',Taurus:'embodiment, value, pleasure, endurance, and material continuity',Gemini:'language, exchange, curiosity, movement, and multiplicity',Cancer:'care, protection, memory, belonging, and attachment',Leo:'radiance, creativity, pride, loyalty, and recognition',Virgo:'discernment, service, refinement, repair, and usefulness',Libra:'relationship, balance, fairness, dialogue, and mutual recognition',Scorpio:'intensity, secrecy, survival, bonding, and emotional truth',Sagittarius:'meaning, faith, exploration, philosophy, and freedom',Capricorn:'structure, responsibility, endurance, mastery, and worldly form',Aquarius:'systems, reform, collective intelligence, detachment, and future orientation',Pisces:'surrender, imagination, compassion, permeability, and release'};
const PLACEMENT_REFERENTS={sun:'identity, vitality, and conscious purpose',moon:'feelings, instincts, memory, and emotional needs',mercury:'thought, perception, language, and communication',venus:'values, attraction, affection, pleasure, and relating',mars:'drive, assertion, desire, conflict, and action',jupiter:'growth, confidence, meaning, opportunity, and expansion',saturn:'structure, limits, responsibility, time, and commitment',uranus:'freedom, disruption, originality, awakening, and change',neptune:'imagination, sensitivity, surrender, ideals, and vision',pluto:'power, depth, compulsion, elimination, and transformation',chiron:'wounding, healing intelligence, and the capacity to guide healing',asc:'the way a person enters life and is immediately perceived',dsc:'the way a person meets partners and encounters the other',mc:'public direction, vocation, visibility, and the role a person grows toward',ic:'roots, home, private foundations, and inherited belonging','north-node':'growth through unfamiliar experience and developing capacity','south-node':'familiar patterns, inherited capacity, and the known path',lilith:'instinctive autonomy, refusal, exile, and uncompromised desire','part-of-fortune':'the meeting place of body, feeling, circumstance, and ease',vertex:'encounters that feel consequential or outside ordinary control'};
const HOUSE_NAMES=['','First House','Second House','Third House','Fourth House','Fifth House','Sixth House','Seventh House','Eighth House','Ninth House','Tenth House','Eleventh House','Twelfth House'];
const HOUSE_REFERENTS=['','self, embodiment, appearance, approach, and the immediate way life is entered','resources, possessions, money, personal values, and what is held as one’s own','communication, learning, siblings, neighbors, short journeys, and the local environment','home, roots, family, ancestry, privacy, and the foundations of life','creativity, pleasure, romance, children, play, and personal self-expression','work, service, routines, health practices, maintenance, and practical obligations','partnership, contracts, one-to-one relationship, and encounters with the other','shared resources, intimacy, debt, inheritance, vulnerability, and transformation','worldview, religion, philosophy, higher learning, long journeys, and the search for meaning','vocation, public standing, reputation, authority, achievement, and visible responsibility','friends, networks, groups, alliances, hopes, and participation in a larger collective','retreat, hidden processes, solitude, confinement, surrender, spirituality, and closure'];
const ASPECT_NAMES={conjunction:'Conjunction','semi-sextile':'Semi-Sextile',octile:'Octile',sextile:'Sextile',quintile:'Quintile',square:'Square',trine:'Trine','tri-octile':'Tri-Octile','bi-quintile':'Bi-Quintile',quincunx:'Quincunx',opposition:'Opposition'};
const ASPECT_REFERENTS={conjunction:'the two functions operate together','semi-sextile':'neighboring functions accommodate one another',octile:'focused friction and adjustment',sextile:'a cooperative opening activated through participation',quintile:'creative pattern-making and specialized skill',square:'activating pressure and development',trine:'low-resistance exchange','tri-octile':'accumulated friction and redirection','bi-quintile':'refined creative pattern-making',quincunx:'continuing adjustment and translation',opposition:'awareness through polarity, contrast, and exchange'};

let busy=false,pending=null,libPromise=null;

const ios=()=>/iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const status=text=>{const node=document.getElementById('skyChartExportStatus');if(node)node.textContent=text||''};
const read=slot=>{try{return JSON.parse(localStorage.getItem(slot==='A'?'relphiSkyChartA':'relphiSkyChartB')||'null')}catch(_){return null}};
const name=slot=>{const value=read(slot)||{},meta=value.metadata||{};return meta.savedSkyName||value.name||value.displayName||value.skyName||value.title||`Sky ${slot}`};
const safe=value=>String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'sky';
const fileName=()=>`${safe(name('A'))}-vs-${safe(name('B'))}-relationships-${new Date().toISOString().slice(0,16).replace(/[-:T]/g,'')}.png`;

const placementName=id=>window.RelphiGlyphRegistry?.get?.(id)?.name||window.RelphiGlyphRegistry?.resolve?.(id)?.name||String(id||'').replace(/-/g,' ');
const coordinate=(row,side)=>{
  const small=row.querySelector(`.sky-foundation-relationship-placement--${side} .sky-foundation-relationship-copy small`);
  return String(small?.dataset?.relationshipCoordinate||'').trim()||String(small?.textContent||'').match(/\d{1,2}°\d{2}′/)?.[0]||'';
};
function durationLabel(days){
  if(!Number.isFinite(days))return'Unavailable';
  if(days<1){const minutes=days*24*60;if(minutes<90)return`${Math.max(1,Math.round(minutes))} min`;return`${Math.max(1,Math.round(days*24*10)/10)} hr`}
  if(days<14)return`${Math.round(days*10)/10} days`;
  if(days<75)return`${Math.round(days)} days`;
  if(days<730)return`${Math.round(days/30.4375*10)/10} months`;
  return`${Math.round(days/365.25*10)/10} years`;
}
function dateLabel(ms){return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(ms))}
function timingLines(row){
  const full=window.RelphiRelationshipTransitMeta?.exportTimingForRow?.(row);
  if(full?.kind==='dynamic'){
    const exact=full.exacts?.length?full.exacts.map(dateLabel).join(' · '):'near pass';
    const passes=full.passCount===1?'1 exact pass':`${full.passCount||0} exact passes`;
    return[
      `Start ${dateLabel(full.startMs)}`,
      `Exact ${exact}`,
      `End ${dateLabel(full.endMs)}`,
      `Duration ${durationLabel(full.durationDays)}`,
      `Passes ${full.motion?passes+' · '+full.motion:passes}`
    ];
  }
  const estimate=window.RelphiRelationshipTransitMeta?.estimatedTimingForRow?.(row);
  if(estimate&&Number.isFinite(estimate.durationDays)){
    const lines=[`Duration ≈ ${durationLabel(estimate.durationDays)}`];
    if(Number.isFinite(estimate.endsInDays))lines.push(`Ends ≈ ${durationLabel(estimate.endsInDays)} after the chart moment`);
    return lines;
  }
  return[`Timing ${full?.reason||'unavailable for this relationship.'}`];
}
function semanticBlock(row,side){
  const left=side==='left',id=String(row.dataset[left?'leftPlacement':'rightPlacement']||''),signIndex=Number(row.dataset[left?'leftSign':'rightSign']),house=Number(row.dataset[left?'leftHouse':'rightHouse']),sign=SIGN_NAMES[signIndex]||'Sign';
  const lines=[`${placementName(id)} in ${sign}${coordinate(row,side)?' '+coordinate(row,side):''}${Number.isFinite(house)&&house>=1&&house<=12?' · '+HOUSE_NAMES[house]:''}`];
  if(PLACEMENT_REFERENTS[id])lines.push(PLACEMENT_REFERENTS[id]);
  if(SIGN_REFERENTS[sign])lines.push(`${sign} — ${SIGN_REFERENTS[sign]}`);
  if(Number.isFinite(house)&&house>=1&&house<=12)lines.push(`${HOUSE_NAMES[house]} — ${HOUSE_REFERENTS[house]}`);
  return lines;
}
function aspectBlock(row){
  const id=String(row.dataset.aspect||''),orb=Number(row.dataset.sourceOrb),lines=[`${ASPECT_NAMES[id]||id}${Number.isFinite(orb)?' · '+orb.toFixed(2)+'°':''}`];
  if(ASPECT_REFERENTS[id])lines.push(ASPECT_REFERENTS[id]);
  lines.push(...timingLines(row));
  return lines;
}
function detailFor(row){
  const detail=document.createElement('div');detail.className='rel-export-detail';
  const blocks=[
    ['Sky '+(row.dataset.leftSky||((row.dataset.relationshipMode||'A-B')==='B-B'?'B':'A')),semanticBlock(row,'left')],
    ['Aspect',aspectBlock(row)],
    ['Sky '+(row.dataset.rightSky||((row.dataset.relationshipMode||'A-B')==='A-A'?'A':'B')),semanticBlock(row,'right')]
  ];
  for(const [label,lines] of blocks){
    const block=document.createElement('section');block.className='rel-export-detail-block';
    const head=document.createElement('strong');head.textContent=label;block.appendChild(head);
    lines.forEach((line,index)=>{const p=document.createElement('p');p.textContent=line;if(index===0)p.className='rel-export-detail-name';block.appendChild(p)});
    detail.appendChild(block);
  }
  return detail;
}


function visible(row){const style=getComputedStyle(row);return!row.hidden&&style.display!=='none'&&style.visibility!=='hidden'}
function currentRows(){return[...document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row')].filter(visible)}
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
    const data=String(select.dataset.filter||select.dataset.zodiacFilter||select.dataset.relationshipSort||select.name||'').toLowerCase();
    const label=select.dataset.relationshipSort?'Sort':data.includes('zodiac')||data.includes('sign')?'Zodiac signs':data.includes('aspect')?'Aspects':data.includes('house')?'Houses':'Filter';
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
    .rel-export-col>.sky-foundation-relationship-row{box-sizing:border-box;width:${W}px!important;min-width:${W}px!important;max-width:${W}px!important;margin:0!important}
    .rel-export-title{display:grid;gap:3px;padding:0 2px 12px}
    .rel-export-title h1{margin:0;font:900 24px/1.15 system-ui,sans-serif}
    .rel-export-title p{margin:0;color:#655d56;font:700 12px/1.3 system-ui,sans-serif}
    .rel-export-col>.sky-foundation-relationship-row{display:grid!important;grid-template-columns:1fr!important}
    .rel-export-detail{display:grid;grid-template-columns:minmax(0,1fr) minmax(120px,.8fr) minmax(0,1fr);gap:8px;margin-top:6px;padding:8px;border-top:1px solid rgba(31,27,24,.12);background:#fffdfa}
    .rel-export-detail-block{display:grid;align-content:start;gap:3px;min-width:0}
    .rel-export-detail-block>strong{color:#6a625a;font:900 9px/1.2 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.035em}
    .rel-export-detail-block p{margin:0;color:#5d554e;font:650 9px/1.28 system-ui,sans-serif;overflow-wrap:anywhere}
    .rel-export-detail-block .rel-export-detail-name{color:#211d19;font:900 10px/1.22 system-ui,sans-serif}
`;
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
  document.body.appendChild(host);
  const shadow=host.attachShadow({mode:'closed'}),css=document.createElement('style');
  let cssText='';
  for(const styleSheet of document.styleSheets){
    try{cssText+=Array.from(styleSheet.cssRules||[]).map(rule=>rule.cssText).join('\n')+'\n'}catch(_){}
  }
  css.textContent=cssText;shadow.appendChild(css);
  sheet.className='rel-export-sheet';sheet.style.width=`${width}px`;
  const title=document.createElement('div');title.className='rel-export-title';
  const h1=document.createElement('h1');h1.textContent=`${name('A')} ↔ ${name('B')} — Relationships`;
  const subtitle=document.createElement('p');subtitle.textContent='Complete relationship export · names · referents · timing';
  title.append(h1,subtitle);
  const head=document.createElement('div');head.className='rel-export-head';head.innerHTML=`<strong>Relationships</strong><span>${document.getElementById('skyFoundationRelationshipCount')?.textContent||rows.length}</span>`;
  sheet.append(title,head);
  const filter=summary();if(filter){const line=document.createElement('div');line.className='rel-export-summary';line.textContent=`Showing only: ${filter}`;sheet.appendChild(line)}
  const wrap=document.createElement('div');wrap.className='rel-export-cols';sheet.appendChild(wrap);shadow.appendChild(sheet);
  const jobs=[];
  for(let index=0;index<cols;index++){
    const column=document.createElement('div');column.className='rel-export-col';wrap.appendChild(column);
    const batch=rows.slice(index*ROWS,(index+1)*ROWS);
    for(let rowIndex=0;rowIndex<batch.length;rowIndex+=1){
      const row=batch[rowIndex],clone=cleanClone(row);clone.appendChild(detailFor(row));column.appendChild(clone);jobs.push(hydrate(clone,row));
      if(rowIndex%5===4)await new Promise(resolve=>setTimeout(resolve,0));
    }
  }
  await Promise.allSettled(jobs);
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
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