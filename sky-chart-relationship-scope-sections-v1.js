// Relationship scope sections v7: semantic grouping, visual-only disclosure drawers, and fail-safe fast Copy.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiRelationshipScopeSectionsV7)return;
window.__relphiRelationshipScopeSectionsV1=true;window.__relphiRelationshipScopeSectionsV2=true;window.__relphiRelationshipScopeSectionsV3=true;window.__relphiRelationshipScopeSectionsV4=true;window.__relphiRelationshipScopeSectionsV5=true;window.__relphiRelationshipScopeSectionsV6=true;window.__relphiRelationshipScopeSectionsV7=true;

const GROUPS=Object.freeze([{mode:'A-A',title:'A↔A',family:'intrasky'},{mode:'B-B',title:'B↔B',family:'intrasky'},{mode:'A-B',title:'A↔B',family:'intersky'}]);
const FAMILIES=Object.freeze([{id:'intrasky',title:'Intrasky'},{id:'intersky',title:'Intersky'}]);
const PLACEMENT_SYMBOLS=Object.freeze({sun:'☉',moon:'☽',mercury:'☿',venus:'♀',mars:'♂',jupiter:'♃',saturn:'♄',uranus:'♅',neptune:'♆',pluto:'♇',chiron:'⚷','north-node':'☊','south-node':'☋',lilith:'⚸','part-of-fortune':'⊗',vertex:'Vx',asc:'Asc',dsc:'Dsc',mc:'MC',ic:'IC'});
const SIGN_SYMBOLS=Object.freeze(['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓']);
const ASPECT_SYMBOLS=Object.freeze({conjunction:'☌',opposition:'☍',trine:'△',square:'□',sextile:'✶','semi-sextile':'⚺',quincunx:'⚻',octile:'∠','tri-octile':'⚼',quintile:'Q','bi-quintile':'BQ'});
const HIDDEN_CLASSES=Object.freeze(['sky-foundation-single-sky-cross-hidden','sky-chart-filter-hidden','sky-chart-orb-hidden','sky-orb-filter-hidden','sky-chart-multiselect-hidden','sky-chart-house-multiselect-hidden','sky-chart-aspect-multiselect-hidden','sky-chart-zodiac-filter-hidden']);
const COLLAPSED_VISUAL_CLASS='sky-relationship-drawer-collapsed-visual';
const collapsed=new Set();
let observer=null,observedList=null,queued=false,applying=false,copyTimer=0;

function installStyles(){
  if(document.getElementById('skyRelationshipScopeSectionsV3Styles'))return;
  document.getElementById('skyRelationshipScopeSectionsV1Styles')?.remove();
  document.getElementById('skyRelationshipScopeSectionsV2Styles')?.remove();
  const style=document.createElement('style');
  style.id='skyRelationshipScopeSectionsV3Styles';
  style.textContent=`
.sky-relationship-family-heading,.sky-relationship-scope-heading{grid-column:1/-1;display:flex;align-items:center;width:100%;box-sizing:border-box;padding:0}.sky-relationship-family-heading{min-height:34px;color:#29231e;background:#e9e3da;border-top:1px solid rgba(31,27,24,.16);border-bottom:1px solid rgba(31,27,24,.12);font:950 .68rem/1 system-ui,sans-serif;letter-spacing:.015em}.sky-relationship-family-heading:first-child{border-top:0}.sky-relationship-scope-heading{min-height:28px;color:#514941;background:#f4efe8;border-bottom:1px solid rgba(31,27,24,.08);font:900 .63rem/1 system-ui,sans-serif;letter-spacing:.01em}.sky-relationship-family-heading[hidden],.sky-relationship-scope-heading[hidden],.${COLLAPSED_VISUAL_CLASS}{display:none!important}.sky-relationship-disclosure-button{appearance:none;-webkit-appearance:none;display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-width:0;min-height:inherit;box-sizing:border-box;margin:0;border:0;border-radius:0;background:transparent;color:inherit;font:inherit;letter-spacing:inherit;text-align:left;cursor:pointer}.sky-relationship-family-heading>.sky-relationship-disclosure-button{padding:9px 10px 7px}.sky-relationship-scope-heading>.sky-relationship-disclosure-button{padding:7px 10px 5px 18px}.sky-relationship-disclosure-button:hover,.sky-relationship-disclosure-button:focus-visible{background:rgba(255,255,255,.28)}.sky-relationship-disclosure-button:focus-visible{outline:2px solid rgba(31,27,24,.48);outline-offset:-2px}.sky-relationship-disclosure-button::after{content:"";flex:0 0 7px;width:7px;height:7px;margin-right:2px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:translateY(-2px) rotate(45deg);transform-origin:center;transition:transform 120ms ease}.sky-relationship-disclosure-button[aria-expanded="false"]::after{transform:translateY(1px) rotate(-45deg)}`;
  document.head.appendChild(style);
}
function mode(row){const x=String(row?.dataset?.relationshipMode||'').toUpperCase();if(x==='A-A'||x==='B-B'||x==='A-B')return x;if(x==='B-A')return'A-B';const l=String(row?.dataset?.leftSky||'A').toUpperCase(),r=String(row?.dataset?.rightSky||'B').toUpperCase();return l===r&&l==='A'?'A-A':l===r&&l==='B'?'B-B':'A-B'}
function visible(row){if(!row||row.hidden||row.getAttribute('aria-hidden')==='true')return false;for(const c of HIDDEN_CLASSES)if(row.classList.contains(c))return false;return true}
function disclosureButton(owner,id,title){
  let button=owner.querySelector(':scope>.sky-relationship-disclosure-button');
  if(!button){button=document.createElement('button');button.type='button';button.className='sky-relationship-disclosure-button';owner.replaceChildren(button)}
  button.dataset.relationshipDrawerToggle=id;
  if(button.textContent!==title)button.textContent=title;
  button.setAttribute('aria-expanded',collapsed.has(id)?'false':'true');
  button.setAttribute('aria-label',`${title}, ${collapsed.has(id)?'collapsed':'expanded'}`);
  return button;
}
function scopeHeading(list,g){let n=list.querySelector(`:scope>.sky-relationship-scope-heading[data-relationship-scope-heading="${g.mode}"]`);if(!n){n=document.createElement('div');n.className='sky-relationship-scope-heading';n.dataset.relationshipScopeHeading=g.mode;n.setAttribute('role','heading');n.setAttribute('aria-level','4')}disclosureButton(n,g.mode,g.title);return n}
function familyHeading(list,f){let n=list.querySelector(`:scope>.sky-relationship-family-heading[data-relationship-family-heading="${f.id}"]`);if(!n){n=document.createElement('div');n.className='sky-relationship-family-heading';n.dataset.relationshipFamilyHeading=f.id;n.setAttribute('role','heading');n.setAttribute('aria-level','3')}disclosureButton(n,f.id,f.title);return n}
function sameOrder(a,b){return a.length===b.length&&a.every((n,i)=>n===b[i])}
function applyCollapseState(list){
  for(const family of FAMILIES){
    const familyCollapsed=collapsed.has(family.id);
    const familyHead=list.querySelector(`:scope>.sky-relationship-family-heading[data-relationship-family-heading="${family.id}"]`);
    const familyButton=familyHead?.querySelector(':scope>.sky-relationship-disclosure-button');
    if(familyButton){familyButton.setAttribute('aria-expanded',familyCollapsed?'false':'true');familyButton.setAttribute('aria-label',`${family.title}, ${familyCollapsed?'collapsed':'expanded'}`)}
    for(const g of GROUPS.filter(group=>group.family===family.id)){
      const groupCollapsed=collapsed.has(g.mode);
      const scopeHead=list.querySelector(`:scope>.sky-relationship-scope-heading[data-relationship-scope-heading="${g.mode}"]`);
      scopeHead?.classList.toggle(COLLAPSED_VISUAL_CLASS,familyCollapsed);
      const scopeButton=scopeHead?.querySelector(':scope>.sky-relationship-disclosure-button');
      if(scopeButton){scopeButton.setAttribute('aria-expanded',groupCollapsed?'false':'true');scopeButton.setAttribute('aria-label',`${g.title}, ${groupCollapsed?'collapsed':'expanded'}`)}
      for(const row of list.querySelectorAll(':scope>.sky-foundation-relationship-row'))if(mode(row)===g.mode)row.classList.toggle(COLLAPSED_VISUAL_CLASS,familyCollapsed||groupCollapsed);
    }
  }
}
function groupList(){
  queued=false;if(applying)return;
  const list=document.getElementById('skyFoundationRelationshipList');if(!list)return;
  const rows=[...list.querySelectorAll(':scope>.sky-foundation-relationship-row')];if(!rows.length)return;
  const other=[...list.children].filter(n=>!n.matches?.('.sky-foundation-relationship-row,.sky-relationship-scope-heading,.sky-relationship-family-heading')),desired=[...other];
  for(const family of FAMILIES){
    const groups=GROUPS.filter(g=>g.family===family.id),head=familyHeading(list,family);
    head.hidden=!groups.some(g=>rows.some(r=>mode(r)===g.mode&&visible(r)));
    desired.push(head);
    for(const g of groups){const section=rows.filter(r=>mode(r)===g.mode),sh=scopeHeading(list,g);sh.hidden=!section.some(visible);desired.push(sh,...section)}
  }
  if(!sameOrder([...list.children],desired)){
    applying=true;const frag=document.createDocumentFragment();desired.forEach(n=>frag.appendChild(n));list.appendChild(frag);applying=false;
  }
  applyCollapseState(list);
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
function toggleDrawer(id){
  if(!FAMILIES.some(f=>f.id===id)&&!GROUPS.some(g=>g.mode===id))return;
  if(collapsed.has(id))collapsed.delete(id);else collapsed.add(id);
  const list=document.getElementById('skyFoundationRelationshipList');if(list)applyCollapseState(list);
}
function handleDisclosureClick(event){
  const button=event.target.closest?.('[data-relationship-drawer-toggle]');
  const list=document.getElementById('skyFoundationRelationshipList');
  if(!button||!list?.contains(button))return;
  event.preventDefault();event.stopPropagation();toggleDrawer(button.dataset.relationshipDrawerToggle);
}
function ensureObserver(){const list=document.getElementById('skyFoundationRelationshipList');if(!list||list===observedList)return;observer?.disconnect();observedList=list;observer=new MutationObserver(records=>{if(applying)return;if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n instanceof Element&&n.matches?.('.sky-foundation-relationship-row'))))schedule()});observer.observe(list,{childList:true,subtree:false})}
function bind(){ensureObserver();bindCopyButton();schedule()}
function bindCopySoon(){bindCopyButton();requestAnimationFrame(bindCopyButton)}
function start(){installStyles();document.addEventListener('click',handleDisclosureClick);bind();requestAnimationFrame(bindCopySoon);const events=['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-intrasky-relationships-ready','relphi:sky-intrasky-b-relationships-ready','relphi:sky-aspect-multiselect-changed','relphi:sky-placement-multiselect-changed','relphi:sky-house-multiselect-changed','relphi:sky-zodiac-filter-changed','relphi:sky-foundation-filter-changed','relphi:relationship-display-changed'];events.forEach(name=>window.addEventListener(name,()=>{schedule();bindCopySoon()}))}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
