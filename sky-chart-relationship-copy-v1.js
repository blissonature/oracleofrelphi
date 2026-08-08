// Relationships clipboard serializer: copy the semantic relationship list, never raw SVG/DOM text.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyRelationshipCopyV2)return;
  window.__relphiSkyRelationshipCopyV1=true;
  window.__relphiSkyRelationshipCopyV2=true;

  const PLACEMENT_SYMBOLS=Object.freeze({
    sun:'☉',moon:'☽',mercury:'☿',venus:'♀',mars:'♂',jupiter:'♃',saturn:'♄',uranus:'♅',neptune:'♆',pluto:'♇',
    chiron:'⚷','north-node':'☊','south-node':'☋',lilith:'⚸','part-of-fortune':'⊗',vertex:'Vx',asc:'Asc',dsc:'Dsc',mc:'MC',ic:'IC'
  });
  const SIGN_SYMBOLS=Object.freeze(['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓']);
  const ASPECT_SYMBOLS=Object.freeze({
    conjunction:'☌',opposition:'☍',trine:'△',square:'□',sextile:'✶','semi-sextile':'⚺',quincunx:'⚻',octile:'∠','tri-octile':'⚼',quintile:'Q','bi-quintile':'BQ'
  });
  let feedbackTimer=0;

  function installStyles(){
    if(document.getElementById('skyRelationshipCopyStylesV2'))return;
    document.getElementById('skyRelationshipCopyStylesV1')?.remove();
    const style=document.createElement('style');
    style.id='skyRelationshipCopyStylesV2';
    style.textContent=`
      .sky-relationship-copy-button{margin-left:auto;padding:.38rem .68rem;border:1px solid rgba(31,27,24,.18);border-radius:999px;background:#fff;color:#332e2a;font:800 .68rem/1 system-ui,sans-serif;cursor:pointer;white-space:nowrap}
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
    let button=heading.querySelector('.sky-relationship-copy-button');
    if(button)return button;
    button=document.createElement('button');
    button.type='button';
    button.className='sky-relationship-copy-button';
    button.textContent='Copy';
    button.setAttribute('aria-label','Copy visible relationships as glyph notation');
    button.title='Copy visible relationships';
    const clear=heading.querySelector('#skyFoundationClearIsolation');
    heading.insertBefore(button,clear||null);
    button.addEventListener('click',async event=>{
      event.preventDefault();event.stopPropagation();
      const rows=visibleRows();
      if(!rows.length)return;
      const text=rows.map(serializeRow).filter(Boolean).join('\n');
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
    const text=rows.map(serializeRow).filter(Boolean).join('\n');
    if(!text)return;
    event.preventDefault();
    event.clipboardData.setData('text/plain',text);
  });

  function schedule(){requestAnimationFrame(ensureButton)}
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-foundation-filter-changed'].forEach(name=>window.addEventListener(name,schedule));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
