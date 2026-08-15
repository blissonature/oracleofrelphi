// Relationships clipboard serializer: copy the semantic relationship list, never raw SVG/DOM text.
// Filter context is emitted once per copied block, never redundantly on every relationship.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyRelationshipCopyV3)return;
  window.__relphiSkyRelationshipCopyV1=true;
  window.__relphiSkyRelationshipCopyV2=true;
  window.__relphiSkyRelationshipCopyV3=true;

  const PLACEMENT_SYMBOLS=Object.freeze({
    sun:'☉',moon:'☽',mercury:'☿',venus:'♀',mars:'♂',jupiter:'♃',saturn:'♄',uranus:'♅',neptune:'♆',pluto:'♇',
    chiron:'⚷','north-node':'☊','south-node':'☋',lilith:'⚸','part-of-fortune':'⊗',vertex:'Vx',asc:'Asc',dsc:'Dsc',mc:'MC',ic:'IC'
  });
  const SIGN_SYMBOLS=Object.freeze(['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓']);
  const ASPECT_SYMBOLS=Object.freeze({
    conjunction:'☌',opposition:'☍',trine:'△',square:'□',sextile:'✶','semi-sextile':'⚺',quincunx:'⚻',octile:'∠','tri-octile':'⚼',quintile:'Q','bi-quintile':'BQ'
  });
  const ALL_HOUSES=Object.freeze(Array.from({length:12},(_,index)=>String(index+1)));
  let feedbackTimer=0;
  let selectedIsolation=null;
  let houseSelections={A:[...ALL_HOUSES],B:[...ALL_HOUSES]};

  function installStyles(){
    if(document.getElementById('skyRelationshipCopyStylesV3'))return;
    document.getElementById('skyRelationshipCopyStylesV2')?.remove();
    document.getElementById('skyRelationshipCopyStylesV1')?.remove();
    const style=document.createElement('style');
    style.id='skyRelationshipCopyStylesV3';
    style.textContent=`
      .sky-relationship-copy-button{margin-left:auto;padding:.38rem .68rem;border:1px solid rgba(31,27,24,.18);border-radius:999px;background:#fff;color:#332e2a;font:800 .68rem/1 system-ui,sans-serif;cursor:pointer;white-space:nowrap}
      .sky-relationship-heading-actions .sky-relationship-copy-button{margin-left:0}
      .sky-relationship-copy-button:hover,.sky-relationship-copy-button:focus-visible{border-color:#6b625a;outline:0;background:#fffdfa}
      .sky-foundation-relationship-row svg,.sky-foundation-relationship-glyph,.sky-foundation-relationship-sign{-webkit-user-select:none;user-select:none}
      .sky-foundation-relationship-copy,.sky-foundation-relationship-orb{-webkit-user-select:text;user-select:text}
    `;
    document.head.appendChild(style);
  }

  function ensureButton(){
    installStyles();
    const heading=document.querySelector('#skyFoundationRelationships .sky-foundation-relationships-heading');
    if(!heading)return null;
    const actions=heading.querySelector('.sky-relationship-heading-actions');
    let button=heading.querySelector('.sky-relationship-copy-button');
    if(button){
      if(actions&&button.parentElement!==actions)actions.insertBefore(button,actions.querySelector('#skyChartRelationshipsExport')||null);
      return button;
    }
    button=document.createElement('button');
    button.type='button';
    button.className='sky-relationship-copy-button';
    button.textContent='Copy';
    button.setAttribute('aria-label','Copy visible relationships with active filter context');
    button.title='Copy visible relationships';
    if(actions)actions.insertBefore(button,actions.querySelector('#skyChartRelationshipsExport')||null);
    else{
      const clear=heading.querySelector('#skyFoundationClearIsolation');
      heading.insertBefore(button,clear||null);
    }
    button.addEventListener('click',async event=>{
      event.preventDefault();event.stopPropagation();
      const rows=visibleRows();
      if(!rows.length)return;
      const text=serializeBlock(rows);
      if(!text)return;
      const copied=await writeClipboard(text);
      if(!copied)return;
      window.clearTimeout(feedbackTimer);
      button.textContent=`Copied ${rows.length}`;
      feedbackTimer=window.setTimeout(()=>{if(button.isConnected)button.textContent='Copy'},1400);
    });
    return button;
  }

  function visibleRows(){
    return Array.from(document.querySelectorAll('#skyFoundationRelationshipList .sky-foundation-relationship-row[data-relation-index]')).filter(row=>
      !row.hidden&&row.getAttribute('aria-hidden')!=='true'&&getComputedStyle(row).display!=='none'
    );
  }

  function coordinate(row,side){
    const group=row.querySelector(`.sky-foundation-relationship-placement--${side}`);
    const small=group?.querySelector('.sky-foundation-relationship-copy small')||(
      side==='left'
        ? row.querySelector(':scope > .sky-foundation-relationship-copy:nth-child(2) small')
        : row.querySelector(':scope > .sky-foundation-relationship-copy:nth-child(5) small')
    );
    const stored=small?.dataset?.relationshipCoordinate?.trim();
    if(stored)return stored;
    const match=String(small?.textContent||'').match(/\d{1,2}°\d{2}′/);
    return match?.[0]||'';
  }

  function placementSymbol(id){return PLACEMENT_SYMBOLS[id]||window.RelphiGlyphRegistry?.get?.(id)?.fallback||id}
  function serializeRow(row){
    const leftId=row.dataset.leftPlacement||'',rightId=row.dataset.rightPlacement||'',aspect=row.dataset.aspect||'';
    const leftSign=SIGN_SYMBOLS[Number(row.dataset.leftSign)]||'',rightSign=SIGN_SYMBOLS[Number(row.dataset.rightSign)]||'';
    const leftCoordinate=coordinate(row,'left'),rightCoordinate=coordinate(row,'right');
    const aspectSymbol=ASPECT_SYMBOLS[aspect]||aspect;
    if(!leftId||!rightId||!leftCoordinate||!rightCoordinate)return'';
    return `${placementSymbol(leftId)} in ${leftSign} ${leftCoordinate}  ${aspectSymbol}  ${placementSymbol(rightId)} in ${rightSign} ${rightCoordinate}`.replace(/\s+/g,' ').trim();
  }

  function normalizedHouses(values){
    return Array.from(new Set((Array.isArray(values)?values:[]).map(String).filter(value=>ALL_HOUSES.includes(value)))).sort((a,b)=>Number(a)-Number(b));
  }
  function housePhrase(slot,houses){
    if(!houses.length||houses.length===ALL_HOUSES.length)return'';
    return houses.length===1?`Sky ${slot} · House ${houses[0]}`:`Sky ${slot} · Houses ${houses.join(', ')}`;
  }
  function copyContext(){
    if(selectedIsolation?.kind==='house'&&selectedIsolation?.mode==='selected'&&['A','B'].includes(selectedIsolation.sky)){
      return `Sky ${selectedIsolation.sky} · House ${selectedIsolation.value}`;
    }
    const a=normalizedHouses(houseSelections.A),b=normalizedHouses(houseSelections.B);
    return [housePhrase('A',a),housePhrase('B',b)].filter(Boolean).join(' · ');
  }
  function serializeBlock(rows){
    const lines=rows.map(serializeRow).filter(Boolean);
    if(!lines.length)return'';
    const context=copyContext();
    return context?`Relationships — ${context}\n${lines.join('\n')}`:lines.join('\n');
  }

  async function writeClipboard(text){
    try{
      if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true}
    }catch(_){}
    const textarea=document.createElement('textarea');
    textarea.value=text;
    textarea.setAttribute('readonly','');
    Object.assign(textarea.style,{position:'fixed',left:'-10000px',top:'0',opacity:'0'});
    document.body.appendChild(textarea);textarea.select();
    let ok=false;try{ok=document.execCommand('copy')}catch(_){}textarea.remove();return ok;
  }

  function rowsIntersectingSelection(){
    const selection=window.getSelection?.();
    if(!selection||selection.isCollapsed||!selection.rangeCount)return[];
    const range=selection.getRangeAt(0),list=document.getElementById('skyFoundationRelationshipList');
    if(!list)return[];
    try{if(!range.intersectsNode(list))return[]}catch(_){return[]}
    return visibleRows().filter(row=>{try{return range.intersectsNode(row)}catch(_){return false}});
  }

  document.addEventListener('copy',event=>{
    const rows=rowsIntersectingSelection();
    if(!rows.length||!event.clipboardData)return;
    const text=serializeBlock(rows);
    if(!text)return;
    event.preventDefault();
    event.clipboardData.setData('text/plain',text);
  });

  window.addEventListener('relphi:sky-foundation-filter-changed',event=>{
    const state=event.detail?.state;
    selectedIsolation=state?.mode==='selected'?state:null;
    requestAnimationFrame(ensureButton);
  });
  window.addEventListener('relphi:sky-house-multiselect-changed',event=>{
    const detail=event.detail||{};
    houseSelections={A:normalizedHouses(detail.A),B:normalizedHouses(detail.B)};
    requestAnimationFrame(ensureButton);
  });

  function schedule(){requestAnimationFrame(ensureButton)}
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready'].forEach(name=>window.addEventListener(name,schedule));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();