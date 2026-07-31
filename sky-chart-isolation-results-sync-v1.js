// Keep the relationship list synchronized with the aspect edges surviving wheel isolation.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiIsolationResultsSyncV1)return;
  window.__relphiIsolationResultsSyncV1=true;

  let queued=false;
  let observer=null;

  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
  function normalizeText(value){return String(value||'').toLowerCase().replace(/[℞℟ᴿ]/g,' r ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
  function resolve(value){try{return window.RelphiGlyphRegistry?.resolve(value)?.id||window.RelphiGlyphRegistry?.get(value)?.id||''}catch(_){return''}}

  function placementVocabulary(){
    const names=new Map();
    ['relphiSkyChartA','relphiSkyChartB'].forEach(key=>{
      const payload=read(key);
      const source=payload&&(payload.placements||payload.positions||payload.points||payload.bodies||payload);
      if(!source||typeof source!=='object'||Array.isArray(source))return;
      Object.entries(source).forEach(([key,item])=>{
        if(!item||typeof item!=='object')return;
        const id=resolve(key)||resolve(item.name)||resolve(item.label)||resolve(item.body)||resolve(item.planet)||resolve(item.point)||resolve(item.id);
        if(!id)return;
        const candidates=[key,item.name,item.label,item.body,item.planet,item.point,item.id,id];
        candidates.forEach(name=>{const clean=normalizeText(name);if(clean)names.set(clean,id)});
      });
    });
    return Array.from(names.entries()).sort((a,b)=>b[0].length-a[0].length);
  }

  function relationshipRows(){
    const selectors=['.relationship-list-row','.relationship-card','[data-relphi-relationship]','.relphi-progressive-reading','.relphi-canonical-relationship-reading'];
    const seen=new Set(),rows=[];
    document.querySelectorAll(selectors.join(',')).forEach(node=>{
      const host=node.closest('.relationship-list-row,.relationship-card,li,article,details')||node;
      if(seen.has(host))return;
      const text=normalizeText(host.textContent);
      if(!text)return;
      seen.add(host);rows.push(host);
    });
    return rows;
  }

  function rowIds(row,vocabulary){
    const ids=[];
    row.querySelectorAll('[data-glyph-id],[data-relphi-glyph],[data-placement],[data-placement-id]').forEach(node=>{
      const raw=node.dataset.glyphId||node.dataset.relphiGlyph||node.dataset.placement||node.dataset.placementId;
      const id=resolve(raw)||raw;
      if(id&&!ids.includes(id))ids.push(id);
    });
    if(ids.length>=2)return ids;
    const text=' '+normalizeText(row.textContent)+' ';
    vocabulary.forEach(([name,id])=>{
      if(ids.includes(id))return;
      if(text.includes(' '+name+' '))ids.push(id);
    });
    return ids;
  }

  function activePairs(svg){
    if(!svg?.classList.contains('has-isolation'))return null;
    const lines=Array.from(svg.querySelectorAll('[data-interactive="aspect"].is-kept,[data-interactive="aspect"].is-related,[data-interactive="aspect"].is-selected'));
    const pairs=new Set();
    lines.forEach(line=>{
      const a=line.dataset.skyAPlacement,b=line.dataset.skyBPlacement;
      if(!a||!b)return;
      pairs.add([a,b].sort().join('|'));
    });
    return pairs;
  }

  function headingAndBadge(){
    const heading=Array.from(document.querySelectorAll('h1,h2,h3,h4,[role="heading"]')).find(node=>/^relationships$/i.test(String(node.textContent||'').trim()));
    if(!heading)return{};
    const region=heading.parentElement;
    const badge=Array.from(region?.querySelectorAll('span,output,strong,b')||[]).find(node=>/^\d+(?:\s*\/\s*\d+)?$/.test(String(node.textContent||'').trim()));
    return{heading,badge};
  }

  function updateCount(rows,active){
    const visible=rows.filter(row=>!row.hidden&&!row.classList.contains('relphi-isolation-excluded')).length;
    const total=rows.filter(row=>!row.hidden).length;
    const {badge}=headingAndBadge();
    if(!badge)return;
    if(!badge.dataset.relphiUnfilteredCount)badge.dataset.relphiUnfilteredCount=String(total||Number(badge.textContent)||rows.length);
    badge.textContent=active?visible+' / '+badge.dataset.relphiUnfilteredCount:badge.dataset.relphiUnfilteredCount;
    badge.setAttribute('aria-label',active?visible+' of '+badge.dataset.relphiUnfilteredCount+' relationships shown':badge.dataset.relphiUnfilteredCount+' relationships');
  }

  function apply(){
    queued=false;
    const svg=document.querySelector('.unified-sky-wheel>.scn-live-wheel[data-ready="true"]');
    const pairs=activePairs(svg);
    const rows=relationshipRows();
    if(!rows.length)return;
    if(!pairs){
      rows.forEach(row=>row.classList.remove('relphi-isolation-excluded'));
      document.documentElement.classList.remove('relphi-results-isolated');
      updateCount(rows,false);
      return;
    }
    const vocabulary=placementVocabulary();
    rows.forEach(row=>{
      const ids=rowIds(row,vocabulary);
      let match=false;
      for(let i=0;i<ids.length&&!match;i++)for(let j=i+1;j<ids.length&&!match;j++)match=pairs.has([ids[i],ids[j]].sort().join('|'));
      row.classList.toggle('relphi-isolation-excluded',!match);
    });
    document.documentElement.classList.add('relphi-results-isolated');
    updateCount(rows,true);
  }

  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(apply))}

  function bindWheel(){
    const svg=document.querySelector('.unified-sky-wheel>.scn-live-wheel[data-ready="true"]');
    if(!svg)return;
    observer?.disconnect();
    observer=new MutationObserver(queue);
    observer.observe(svg,{attributes:true,subtree:true,attributeFilter:['class']});
    svg.addEventListener('click',queue,true);
    svg.addEventListener('keydown',queue,true);
  }

  function style(){
    if(document.getElementById('relphi-isolation-results-sync-style'))return;
    const node=document.createElement('style');node.id='relphi-isolation-results-sync-style';
    node.textContent='.relphi-isolation-excluded{display:none!important}.relphi-results-isolated .relationship-list-row:not(.relphi-isolation-excluded),.relphi-results-isolated .relationship-card:not(.relphi-isolation-excluded){animation:relphiResultEnter .16s ease both}@keyframes relphiResultEnter{from{opacity:.35;transform:translateY(2px)}to{opacity:1;transform:none}}';
    document.head.appendChild(node);
  }

  function start(){
    style();bindWheel();apply();
    window.addEventListener('relphi:sky-chart-next-display-ready',()=>{bindWheel();queue()});
    new MutationObserver(mutations=>{
      if(mutations.some(m=>Array.from(m.addedNodes).some(node=>node.nodeType===1&&(node.matches?.('.scn-live-wheel,.relationship-list-row,.relationship-card')||node.querySelector?.('.scn-live-wheel,.relationship-list-row,.relationship-card'))))){bindWheel();queue()}
    }).observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();