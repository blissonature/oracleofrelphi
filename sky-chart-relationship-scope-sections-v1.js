// Relationship scope sections v10: semantic grouping and sorting without visible scope headers; Copy retains semantic grouping.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiRelationshipScopeSectionsV10)return;
window.__relphiRelationshipScopeSectionsV1=true;window.__relphiRelationshipScopeSectionsV2=true;window.__relphiRelationshipScopeSectionsV3=true;window.__relphiRelationshipScopeSectionsV4=true;window.__relphiRelationshipScopeSectionsV5=true;window.__relphiRelationshipScopeSectionsV6=true;window.__relphiRelationshipScopeSectionsV7=true;window.__relphiRelationshipScopeSectionsV8=true;window.__relphiRelationshipScopeSectionsV9=true;window.__relphiRelationshipScopeSectionsV10=true;

const GROUPS=Object.freeze([{mode:'A-B',title:'A↔B',family:'intersky'},{mode:'A-A',title:'A↔A',family:'intrasky'},{mode:'B-B',title:'B↔B',family:'intrasky'}]);
const FAMILIES=Object.freeze([{id:'intersky',title:'Intersky'},{id:'intrasky',title:'Intrasky'}]);
const PLACEMENT_SYMBOLS=Object.freeze({sun:'☉',moon:'☽',mercury:'☿',venus:'♀',mars:'♂',jupiter:'♃',saturn:'♄',uranus:'♅',neptune:'♆',pluto:'♇',chiron:'⚷','north-node':'☊','south-node':'☋',lilith:'⚸','part-of-fortune':'⊗',vertex:'Vx',asc:'Asc',dsc:'Dsc',mc:'MC',ic:'IC'});
const SIGN_SYMBOLS=Object.freeze(['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓']);
const ASPECT_SYMBOLS=Object.freeze({conjunction:'☌',opposition:'☍',trine:'△',square:'□',sextile:'✶','semi-sextile':'⚺',quincunx:'⚻',octile:'∠','tri-octile':'⚼',quintile:'Q','bi-quintile':'BQ'});
const HIDDEN_CLASSES=Object.freeze(['sky-foundation-single-sky-cross-hidden','sky-chart-filter-hidden','sky-chart-orb-hidden','sky-orb-filter-hidden','sky-chart-multiselect-hidden','sky-chart-house-multiselect-hidden','sky-chart-aspect-multiselect-hidden','sky-chart-zodiac-filter-hidden']);
const COLLAPSED_VISUAL_CLASS='sky-relationship-drawer-collapsed-visual';
const collapsed=new Set();
let observer=null,observedList=null,queued=false,applying=false,copyTimer=0;

function installStyles(){
  document.getElementById('skyRelationshipScopeSectionsV1Styles')?.remove();
  document.getElementById('skyRelationshipScopeSectionsV2Styles')?.remove();
  document.getElementById('skyRelationshipScopeSectionsV3Styles')?.remove();
}
function mode(row){const x=String(row?.dataset?.relationshipMode||'').toUpperCase();if(x==='A-A'||x==='B-B'||x==='A-B')return x;if(x==='B-A')return'A-B';const l=String(row?.dataset?.leftSky||'A').toUpperCase(),r=String(row?.dataset?.rightSky||'B').toUpperCase();return l===r&&l==='A'?'A-A':l===r&&l==='B'?'B-B':'A-B'}
function visible(row){if(!row||row.hidden||row.getAttribute('aria-hidden')==='true')return false;for(const c of HIDDEN_CLASSES)if(row.classList.contains(c))return false;return true}
function sameOrder(a,b){return a.length===b.length&&a.every((n,i)=>n===b[i])}
function whereWhenEditing(){return document.documentElement.dataset.skyWhereWhenEditing==='true'}
function groupList(){
  queued=false;if(applying||whereWhenEditing())return;
  const list=document.getElementById('skyFoundationRelationshipList');if(!list)return;
  list.querySelectorAll(':scope>.sky-relationship-scope-heading,:scope>.sky-relationship-family-heading').forEach(node=>node.remove());
  const rows=[...list.querySelectorAll(':scope>.sky-foundation-relationship-row')];if(!rows.length)return;
  collapsed.clear();
  rows.forEach(row=>row.classList.remove(COLLAPSED_VISUAL_CLASS));
  const other=[...list.children].filter(node=>!node.matches?.('.sky-foundation-relationship-row')),desired=[...other];
  for(const family of FAMILIES){
    for(const group of GROUPS.filter(item=>item.family===family.id)){
      let section=rows.filter(row=>mode(row)===group.mode);
      const sorter=window.RelphiRelationshipSort;
      if(sorter?.compareRows)section=section.slice().sort(sorter.compareRows);
      desired.push(...section);
    }
  }
  if(!sameOrder([...list.children],desired)){
    applying=true;
    const frag=document.createDocumentFragment();
    desired.forEach(node=>frag.appendChild(node));
    list.appendChild(frag);
    applying=false;
  }
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(groupList)}
function coordinate(row,side){const small=row.querySelector(`.sky-foundation-relationship-placement--${side} .sky-foundation-relationship-copy small`);const stored=String(small?.dataset?.relationshipCoordinate||'').trim();return stored||String(small?.textContent||'').match(/\d{1,2}°\d{2}′/)?.[0]||''}
function placementSymbol(id){return PLACEMENT_SYMBOLS[id]||window.RelphiGlyphRegistry?.get?.(id)?.fallback||id}
function compactRow(row){const l=String(row.dataset.leftPlacement||''),r=String(row.dataset.rightPlacement||''),a=String(row.dataset.aspect||''),lc=coordinate(row,'left'),rc=coordinate(row,'right'),ls=SIGN_SYMBOLS[Number(row.dataset.leftSign)]||'',rs=SIGN_SYMBOLS[Number(row.dataset.rightSign)]||'';if(!l||!r||!lc||!rc)return'';return`${placementSymbol(l)} in ${ls} ${lc} ${ASPECT_SYMBOLS[a]||a} ${placementSymbol(r)} in ${rs} ${rc}`.replace(/\s+/g,' ').trim()}
function serializeRow(row){const api=window.RelphiRelationshipCopySerializer,level=api?.levelForRow?.(row)??0;if(level>0){const text=api?.serialize?.(row,{level,includeScope:false});if(text)return{text,semantic:true}}return{text:compactRow(row),semantic:false}}
function visibleRows(){const out=[];for(const row of document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]'))if(visible(row))out.push(row);return out}
function serializeSection(rows){const out=[];let semantic=false;for(const row of rows){const item=serializeRow(row);if(!item.text)continue;out.push(item.text);if(item.semantic)semantic=true}return out.join(semantic?'\n\n':'\n')}
function serializeAll(){const rows=visibleRows(),families=[];for(const family of FAMILIES){const sections=[];for(const group of GROUPS){if(group.family!==family.id)continue;const body=serializeSection(rows.filter(r=>mode(r)===group.mode));if(body)sections.push(`${group.title}\n${body}`)}if(sections.length)families.push(`${family.title}\n\n${sections.join('\n\n')}`)}return families.length?`Relationships\n\n${families.join('\n\n')}`:''}
function legacyCopy(text){const active=document.activeElement;let ta=null;try{ta=document.createElement('textarea');ta.value=text;ta.setAttribute('aria-hidden','true');Object.assign(ta.style,{position:'fixed',left:'0',top:'0',width:'1px',height:'1px',padding:'0',border:'0',opacity:'0',fontSize:'16px'});document.body.appendChild(ta);try{ta.focus({preventScroll:true})}catch(_){ta.focus()}ta.select();ta.setSelectionRange(0,ta.value.length);return document.execCommand('copy')===true}catch(_){return false}finally{ta?.remove();try{active?.focus?.({preventScroll:true})}catch(_){try{active?.focus?.()}catch(__){}}}}
async function writeClipboard(text){if(legacyCopy(text))return true;if(!navigator.clipboard?.writeText)return false;let timer=0;try{const timeout=new Promise(resolve=>{timer=window.setTimeout(()=>resolve(false),900)});const copy=Promise.resolve(navigator.clipboard.writeText(text)).then(()=>true,()=>false);return await Promise.race([copy,timeout])}catch(_){return false}finally{clearTimeout(timer)}}
function bindCopyButton(){const b=document.querySelector('.sky-relationship-copy-button');if(!b||b.dataset.scopeCopyOverride==='v7')return;b.dataset.scopeCopyOverride='v7';b.setAttribute('aria-label','Copy included relationships at the current reveal level');b.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();const text=serializeAll();if(!text)return;b.textContent='Copying…';let ok=false;try{ok=await writeClipboard(text)}catch(_){}if(!ok){b.textContent='Copy failed';clearTimeout(copyTimer);copyTimer=setTimeout(()=>{if(b.isConnected)b.textContent='Copy'},1400);return}b.textContent='Copied';clearTimeout(copyTimer);copyTimer=setTimeout(()=>{if(b.isConnected)b.textContent='Copy'},1000)},true)}
function visibilityClassChanged(record){
  if(record.type!=='attributes'||record.attributeName!=='class')return false;
  const row=record.target?.matches?.('.sky-foundation-relationship-row')?record.target:null;
  if(!row)return false;
  const before=new Set(String(record.oldValue||'').split(/\s+/).filter(Boolean));
  return HIDDEN_CLASSES.some(className=>before.has(className)!==row.classList.contains(className));
}
function visibilityMutation(record){
  if(record.type==='childList')return[...record.addedNodes,...record.removedNodes].some(node=>node instanceof Element&&node.matches?.('.sky-foundation-relationship-row'));
  if(!record.target?.matches?.('.sky-foundation-relationship-row'))return false;
  if(record.attributeName==='class')return visibilityClassChanged(record);
  return record.attributeName==='hidden'||record.attributeName==='aria-hidden';
}
function ensureObserver(){
  const list=document.getElementById('skyFoundationRelationshipList');if(!list||list===observedList)return;
  observer?.disconnect();observedList=list;
  observer=new MutationObserver(records=>{if(records.some(visibilityMutation))schedule()});
  observer.observe(list,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','aria-hidden'],attributeOldValue:true});
}
function bind(){ensureObserver();bindCopyButton();schedule()}
function bindCopySoon(){bindCopyButton();requestAnimationFrame(bindCopyButton)}
function start(){installStyles();bind();requestAnimationFrame(bindCopySoon);const events=['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-intrasky-relationships-ready','relphi:sky-intrasky-b-relationships-ready','relphi:sky-aspect-multiselect-changed','relphi:sky-placement-multiselect-changed','relphi:sky-house-multiselect-changed','relphi:sky-zodiac-filter-changed','relphi:sky-foundation-filter-changed','relphi:relationship-display-changed','relphi:relationship-sort-changed'];events.forEach(name=>window.addEventListener(name,()=>{schedule();bindCopySoon()}))}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
