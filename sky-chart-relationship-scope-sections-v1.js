// Relationship scope sections v14: significance can rank globally; relative timing remains scoped to its sky-time frame.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiRelationshipScopeSectionsV14)return;
window.__relphiRelationshipScopeSectionsV1=true;window.__relphiRelationshipScopeSectionsV2=true;window.__relphiRelationshipScopeSectionsV3=true;window.__relphiRelationshipScopeSectionsV4=true;window.__relphiRelationshipScopeSectionsV5=true;window.__relphiRelationshipScopeSectionsV6=true;window.__relphiRelationshipScopeSectionsV7=true;window.__relphiRelationshipScopeSectionsV8=true;window.__relphiRelationshipScopeSectionsV9=true;window.__relphiRelationshipScopeSectionsV10=true;window.__relphiRelationshipScopeSectionsV11=true;window.__relphiRelationshipScopeSectionsV12=true;window.__relphiRelationshipScopeSectionsV13=true;window.__relphiRelationshipScopeSectionsV14=true;

const GROUPS=Object.freeze([{mode:'A-B',title:'A↔B',family:'intersky'},{mode:'A-A',title:'A↔A',family:'intrasky'},{mode:'B-B',title:'B↔B',family:'intrasky'}]);
const FAMILIES=Object.freeze([{id:'intersky',title:'Intersky'},{id:'intrasky',title:'Intrasky'}]);
const GLOBAL_SORTS=new Set(['exact','aspect','strongest','most-challenging','most-supportive','duration-longest','duration-shortest','began-most-recently','ends-soonest','ends-last','applying-first','separating-first','closing-first','opening-first','reference-resolution']);
const PLACEMENT_SYMBOLS=Object.freeze({sun:'☉',moon:'☽',mercury:'☿',venus:'♀',mars:'♂',jupiter:'♃',saturn:'♄',uranus:'♅',neptune:'♆',pluto:'♇',chiron:'⚷','north-node':'☊','south-node':'☋',lilith:'⚸','part-of-fortune':'⊗',vertex:'Vx','anti-vertex':'AVx',asc:'Asc',dsc:'Dsc',mc:'MC',ic:'IC'});
const SIGN_SYMBOLS=Object.freeze(['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓']);
const ASPECT_SYMBOLS={conjunction:'☌',opposition:'☍',trine:'△',square:'□',sextile:'✶','semi-sextile':'⚺',quincunx:'⚻',octile:'∠','tri-octile':'⚼',quintile:'Q','bi-quintile':'BQ'};
window.RelphiHarmonicAspectCatalog?.aspects.forEach(aspect=>{if(!ASPECT_SYMBOLS[aspect.id])ASPECT_SYMBOLS[aspect.id]=aspect.label});
const HIDDEN_CLASSES=Object.freeze(['sky-foundation-single-sky-cross-hidden','sky-chart-filter-hidden','sky-chart-orb-hidden','sky-orb-filter-hidden','sky-chart-multiselect-hidden','sky-chart-house-multiselect-hidden','sky-chart-aspect-multiselect-hidden','sky-chart-zodiac-filter-hidden','sky-chart-result-limit-hidden']);
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
function relationOrdinal(row){const raw=String(row?.dataset?.relationIndex||'');const match=raw.match(/(\d+)(?!.*\d)/);return match?Number(match[1]):Number.MAX_SAFE_INTEGER}
function scoreFor(row){const value=window.RelphiRelationshipSort?.scoreRow?.(row);return value&&typeof value==='object'?value:{signed:0,strength:0}}
function axisFamily(row){return String(window.RelphiRelationshipSort?.axisFamilyKey?.(row)||'')}
function familyRepresentative(row,rows,cache){
  const key=axisFamily(row);if(!key)return row;if(cache.has(key))return cache.get(key);
  const members=rows.filter(candidate=>visible(candidate)&&axisFamily(candidate)===key);let best=members[0]||row;
  for(let i=1;i<members.length;i+=1){const a=scoreFor(members[i]),b=scoreFor(best);if(a.strength>b.strength||(a.strength===b.strength&&relationOrdinal(members[i])<relationOrdinal(best)))best=members[i]}
  cache.set(key,best);return best;
}
function supportiveCompare(a,b,rows,familyCache){
  const ak=axisFamily(a),bk=axisFamily(b);
  const ar=ak&&ak===bk?a:familyRepresentative(a,rows,familyCache),br=ak&&ak===bk?b:familyRepresentative(b,rows,familyCache);
  const as=scoreFor(ar),bs=scoreFor(br);
  return bs.signed-as.signed||bs.strength-as.strength||relationOrdinal(ar)-relationOrdinal(br)||relationOrdinal(a)-relationOrdinal(b);
}
function globalComparator(sortMode,rows){
  const sorter=window.RelphiRelationshipSort;
  return typeof sorter?.compareRows==='function'?sorter.compareRows:(a,b)=>relationOrdinal(a)-relationOrdinal(b);
}
function groupList(){
  queued=false;if(applying||whereWhenEditing())return;
  const list=document.getElementById('skyFoundationRelationshipList');if(!list)return;
  list.querySelectorAll(':scope>.sky-relationship-scope-heading,:scope>.sky-relationship-family-heading').forEach(node=>node.remove());
  const rows=[...list.querySelectorAll(':scope>.sky-foundation-relationship-row')];if(!rows.length)return;
  collapsed.clear();
  rows.forEach(row=>row.classList.remove(COLLAPSED_VISUAL_CLASS));
  const helpers=[...list.children].filter(node=>node.matches?.('[data-result-limit-show-more],[data-harmonic-show-more]'));
  const other=[...list.children].filter(node=>!node.matches?.('.sky-foundation-relationship-row,[data-result-limit-show-more],[data-harmonic-show-more]')),desired=[...other];
  const sorter=window.RelphiRelationshipSort,sortMode=sorter?.mode?.();
  // Every relationship sort answers one ranking question across the complete visible
  // relationship set. Scope remains relationship metadata, not a boundary on ordering.
  if(GLOBAL_SORTS.has(sortMode)){
    desired.push(...rows.slice().sort(globalComparator(sortMode,rows)));
  }else{
    for(const family of FAMILIES){
      for(const group of GROUPS.filter(item=>item.family===family.id)){
        let section=rows.filter(row=>mode(row)===group.mode);
        if(sorter?.compareRows)section=section.slice().sort(sorter.compareRows);
        desired.push(...section);
      }
    }
  }
  desired.push(...helpers);
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
function placementWithMotion(row,side,id){const sky=String(row.dataset[side+'Sky']||'').toUpperCase();return placementSymbol(id)+(sky&&id&&window.RelphiSkyRetrograde?.forPlacement?.(sky,id)?' Rx':'')}
function exportHouseFor(row,side){
  const direct=String(row.dataset[side+'Sky']||'').toUpperCase();
  const scope=mode(row),slot=direct==='A'||direct==='B'?direct:scope==='A-A'?'A':scope==='B-B'?'B':side==='left'?'A':'B';
  return window.RelphiRelationshipExportHouses?.include?.(slot)===true;
}
function compactRow(row){const l=String(row.dataset.leftPlacement||''),r=String(row.dataset.rightPlacement||''),a=String(row.dataset.aspect||''),lc=coordinate(row,'left'),rc=coordinate(row,'right'),ls=SIGN_SYMBOLS[Number(row.dataset.leftSign)]||'',rs=SIGN_SYMBOLS[Number(row.dataset.rightSign)]||'',lh=Number(row.dataset.leftHouse),rh=Number(row.dataset.rightHouse),lhText=exportHouseFor(row,'left')&&Number.isInteger(lh)&&lh>=1&&lh<=12?` H${lh}`:'',rhText=exportHouseFor(row,'right')&&Number.isInteger(rh)&&rh>=1&&rh<=12?` H${rh}`:'';if(!l||!r||!lc||!rc)return'';return`${placementWithMotion(row,'left',l)} in ${ls} ${lc}${lhText} ${ASPECT_SYMBOLS[a]||a} ${placementWithMotion(row,'right',r)} in ${rs} ${rc}${rhText}`.replace(/\s+/g,' ').trim()}
function serializeRow(row){const api=window.RelphiRelationshipCopySerializer,level=api?.levelForRow?.(row)??0;if(level>0){const text=api?.serialize?.(row,{level,includeScope:false});if(text)return{text,semantic:true}}return{text:compactRow(row),semantic:false}}
function visibleRows(){const out=[];for(const row of document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]'))if(visible(row))out.push(row);return out}
function serializeSection(rows){const out=[];let semantic=false;for(const row of rows){const item=serializeRow(row);if(!item.text)continue;out.push(item.text);if(item.semantic)semantic=true}return out.join(semantic?'\n\n':'\n')}
function groupForMode(value){return GROUPS.find(group=>group.mode===value)||null}
function familyForGroup(group){return FAMILIES.find(family=>family.id===group?.family)||null}
function skyIdentity(slot){
  let payload=null;
  try{payload=JSON.parse(localStorage.getItem('relphiSkyChart'+slot)||'null')}catch(_){}
  let title='';
  try{title=String(window.RelphiSkyCardTitle?.nameFor?.(slot,payload)||'').trim()}catch(_){}
  const metadata=payload?.metadata||{};
  return title||String(metadata.savedSkyName||payload?.name||payload?.displayName||payload?.skyName||payload?.title||'').trim()||'Unnamed sky';
}
function skyIsPresent(slot){
  let value=null;
  try{value=JSON.parse(localStorage.getItem('relphiSkyChart'+slot)||'null')}catch(_){}
  if(!value||typeof value!=='object')return false;
  // A stored placeholder is not a loaded sky. Use actual placements rather
  // than the existence of the slot key or its generic display name.
  for(const key of ['placements','positions','points','bodies']){
    const collection=value[key];
    if(!collection||typeof collection!=='object')continue;
    if(Object.values(collection).some(item=>item&&typeof item==='object'&&
      ((item.longitude!=null&&item.longitude!==''&&Number.isFinite(Number(item.longitude)))||String(item.sign||item.zodiac||'').trim())))return true;
  }
  return false;
}
// The Aspects UI is a scope-by-aspect matrix. The old flat scope checkboxes
// are not the active filter and must not be consulted by exports.
const MATRIX_SCOPES=Object.freeze([{id:'A-A',label:'A↔A'},{id:'B-B',label:'B↔B'},{id:'A-B',label:'A↔B'}]);
const harmonicCatalogue=window.RelphiHarmonicAspectCatalog;
const MATRIX_ASPECTS=Object.freeze((harmonicCatalogue?.aspects||[]).map(aspect=>aspect.id));
const DEFAULT_MATRIX_ASPECTS=Object.freeze(harmonicCatalogue?.legacyIds||MATRIX_ASPECTS);
function matrixFocus(){
  const scopes=MATRIX_SCOPES.filter(scope=>scope.id==='A-A'||skyIsPresent('B'));
  const all=MATRIX_ASPECTS.length;
  let stored=null;
  try{stored=JSON.parse(localStorage.getItem('relphiSkyAspectMatrixV1')||'null')}catch(_){}
  const selectedFor=scope=>{
    const saved=stored&&Array.isArray(stored[scope.id])?stored[scope.id]:DEFAULT_MATRIX_ASPECTS;
    const persisted=new Set(saved.filter(id=>MATRIX_ASPECTS.includes(id)));
    // Filter cells are the authoritative active selections once mounted. Unlike
    // the legacy eleven-only export map, read all harmonic aspect cells.
    return MATRIX_ASPECTS.filter(id=>{
      const input=document.querySelector('[data-aspect-matrix-scope="'+scope.id+'"][data-aspect-matrix-aspect="'+id+'"]');
      return input?input.checked:persisted.has(id);
    });
  };
  const selections=Object.fromEntries(scopes.map(scope=>[scope.id,selectedFor(scope)]));
  const active=scopes.filter(scope=>selections[scope.id].length>0);
  const bySign=window.RelphiSkyBySign?.selected;
  const bySignCount=bySign instanceof Set?bySign.size:0;
  const enabled=bySignCount?scopes:active;
  const scopeNames=enabled.map(scope=>scope.label).join(' · ')||'None';
  const names=ids=>ids.map(id=>harmonicCatalogue?.byId(id)?.label||id).join(', ');
  const summary=ids=>ids.length===0?'None':ids.length===all?'All':names(ids);
  const aspects=active.length===0?'None':active.length===1?summary(selections[active[0].id]):
    active.map(scope=>scope.label+': '+summary(selections[scope.id])).join(' · ');
  return{aspects,scopes:scopeNames,bySignCount};
}
function focusInformation(){
  const value=selector=>String(document.querySelector(selector)?.textContent||'').trim().replace(/\s+/g,' ');
  const selected=selector=>{const element=document.querySelector(selector);return element?.selectedOptions?.[0]?.textContent?.trim()||element?.value||''};
  const windowValue=window.RelphiHarmonicOrb?.getWindow?.();
  const matrix=matrixFocus();
  const display=window.RelphiSkyRelationshipDisplay?.getState?.();
  const enabled=display&&['glyphs','names','referents'].filter(id=>display[id]===true);
  const names={glyphs:'Glyphs',names:'Names',referents:'Referents'};
  const displayName=enabled?enabled.length===3?'All':enabled.length?enabled.map(id=>names[id]).join(' · '):'None':value('[data-relationship-display-value-text]');
  const controls=[
    ['Display',displayName],
    ['Harmonic Window',Number.isFinite(Number(windowValue))?String(windowValue)+'°':document.querySelector('[data-harmonic-window-input]')?.value||''],
    ['Aspects',matrix.aspects],
    ['Relationship scopes',matrix.scopes],
    ...(matrix.bySignCount?[['By Sign',matrix.bySignCount+' selected']]:[]),
    ['Placements',value('[data-placement-filter-summary]')],
    ['Zodiac Signs',value('[data-zodiac-summary]')],
    ['Houses',value('[data-house-filter-summary]')],
    ['Sort',selected('.sky-relationship-sort-select')],
    ['Max',(()=>{const applied=window.RelphiRelationshipLimit?.get?.();return applied==='all'?'Max':applied||selected('[data-relationship-limit-preset]')||document.querySelector('[data-relationship-limit]')?.value||''})()]
  ];
  return controls.filter(([,v])=>String(v).trim()).map(([k,v])=>k+': '+v);
}
window.RelphiRelationshipExportFocus=Object.freeze({lines:focusInformation,matrix:matrixFocus});
function relationshipsCopyHeader(){
  return ['Relationships','Sky A: '+skyIdentity('A'),...(skyIsPresent('B')?['Sky B: '+skyIdentity('B')]:[]),'','Focus',...focusInformation()].join('\n');
}
function serializeDisplayOrder(rows){
  const blocks=[];let currentMode='',bucket=[];
  const flush=()=>{
    if(!bucket.length)return;
    const group=groupForMode(currentMode),family=familyForGroup(group),body=serializeSection(bucket);
    if(body&&group&&family)blocks.push(`${family.title}\n\n${group.title}\n${body}`);
    bucket=[];
  };
  for(const row of rows){const rowMode=mode(row);if(currentMode&&rowMode!==currentMode)flush();currentMode=rowMode;bucket.push(row)}
  flush();
  return blocks.length?`${relationshipsCopyHeader()}\n\n${blocks.join('\n\n')}`:'';
}
function serializeAll(){
  const rows=visibleRows(),sortMode=window.RelphiRelationshipSort?.mode?.();
  if(GLOBAL_SORTS.has(sortMode))return serializeDisplayOrder(rows);
  const families=[];
  for(const family of FAMILIES){
    const sections=[];
    for(const group of GROUPS){if(group.family!==family.id)continue;const body=serializeSection(rows.filter(r=>mode(r)===group.mode));if(body)sections.push(`${group.title}\n${body}`)}
    if(sections.length)families.push(`${family.title}\n\n${sections.join('\n\n')}`);
  }
  return families.length?`${relationshipsCopyHeader()}\n\n${families.join('\n\n')}`:'';
}
function legacyCopy(text){const active=document.activeElement;let ta=null;try{ta=document.createElement('textarea');ta.value=text;ta.setAttribute('aria-hidden','true');Object.assign(ta.style,{position:'fixed',left:'0',top:'0',width:'1px',height:'1px',padding:'0',border:'0',opacity:'0',fontSize:'16px'});document.body.appendChild(ta);try{ta.focus({preventScroll:true})}catch(_){ta.focus()}ta.select();ta.setSelectionRange(0,ta.value.length);return document.execCommand('copy')===true}catch(_){return false}finally{ta?.remove();try{active?.focus?.({preventScroll:true})}catch(_){try{active?.focus?.()}catch(__){}}}}
async function writeClipboard(text){if(legacyCopy(text))return true;if(!navigator.clipboard?.writeText)return false;let timer=0;try{const timeout=new Promise(resolve=>{timer=window.setTimeout(()=>resolve(false),900)});const copy=Promise.resolve(navigator.clipboard.writeText(text)).then(()=>true,()=>false);return await Promise.race([copy,timeout])}catch(_){return false}finally{clearTimeout(timer)}}
function bindCopyButton(){const b=document.querySelector('.sky-relationship-copy-button');if(!b||b.dataset.scopeCopyOverride==='v8')return;b.dataset.scopeCopyOverride='v8';b.setAttribute('aria-label','Copy included relationships at the current reveal level');b.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();const text=serializeAll();if(!text)return;b.textContent='Copying…';let ok=false;try{ok=await writeClipboard(text)}catch(_){}if(!ok){b.textContent='Copy failed';clearTimeout(copyTimer);copyTimer=setTimeout(()=>{if(b.isConnected)b.textContent='Copy'},1400);return}b.textContent='Copied '+visibleRows().length;clearTimeout(copyTimer);copyTimer=setTimeout(()=>{if(b.isConnected)b.textContent='Copy'},1000)},true)}
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