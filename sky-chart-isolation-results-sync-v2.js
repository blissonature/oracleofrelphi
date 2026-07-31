// Synchronize complete relationship cards with the aspect edges retained by wheel isolation.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiIsolationResultsSyncV2)return;
  window.__relphiIsolationResultsSyncV2=true;

  const GLYPH_TEXT={
    '☉':'sun','☽':'moon','☾':'moon','☿':'mercury','♀':'venus','♂':'mars','♃':'jupiter','♄':'saturn','♅':'uranus','♆':'neptune','♇':'pluto','⚷':'chiron','☊':'north-node','☋':'south-node','⊗':'part-of-fortune','⊙':'part-of-fortune'
  };
  let queued=false,wheelObserver=null,bodyObserver=null;

  function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(_){return null}}
  function norm(v){return String(v||'').toLowerCase().replace(/[℞℟ᴿ]/g,' r ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
  function resolve(v){try{return window.RelphiGlyphRegistry?.resolve(v)?.id||window.RelphiGlyphRegistry?.get(v)?.id||''}catch(_){return''}}
  function canon(v){const raw=String(v||'').trim();return resolve(raw)||GLYPH_TEXT[raw]||norm(raw).replace(/ /g,'-')}

  function vocabulary(){
    const out=[];
    ['relphiSkyChartA','relphiSkyChartB'].forEach(key=>{
      const p=read(key),src=p&&(p.placements||p.positions||p.points||p.bodies||p);
      if(!src||typeof src!=='object'||Array.isArray(src))return;
      Object.entries(src).forEach(([k,v])=>{
        if(!v||typeof v!=='object')return;
        const id=canon(k)||canon(v.name)||canon(v.label)||canon(v.body)||canon(v.planet)||canon(v.point)||canon(v.id);
        if(!id)return;
        [k,v.name,v.label,v.body,v.planet,v.point,v.id,id].forEach(name=>{const n=norm(name);if(n)out.push([n,id])});
      });
    });
    return out.sort((a,b)=>b[0].length-a[0].length);
  }

  function heading(text){return Array.from(document.querySelectorAll('h1,h2,h3,h4,[role="heading"]')).find(n=>new RegExp('^'+text+'$','i').test(String(n.textContent||'').trim()))||null}
  function between(node,start,end){if(!start)return false;const a=start.compareDocumentPosition(node),after=!!(a&Node.DOCUMENT_POSITION_FOLLOWING);if(!after)return false;if(!end)return true;const b=node.compareDocumentPosition(end);return !!(b&Node.DOCUMENT_POSITION_FOLLOWING)}
  function arrowText(node){const t=String(node.textContent||'');return /→|\s->\s/.test(t)&&/\d+°/.test(t)}

  function relationshipCards(){
    const start=heading('Relationships'),end=heading('Selected Relationship');
    if(!start)return[];
    const clickable=Array.from(document.querySelectorAll('button,[role="button"],.relationship-list-row,.relationship-card,article,li,details')).filter(n=>between(n,start,end)&&arrowText(n));
    const smallest=clickable.filter(n=>!clickable.some(other=>other!==n&&n.contains(other)));
    if(smallest.length)return Array.from(new Set(smallest));
    const leaves=Array.from(document.querySelectorAll('body *')).filter(n=>between(n,start,end)&&arrowText(n)&&!Array.from(n.children).some(arrowText));
    return Array.from(new Set(leaves.map(n=>n.closest('button,[role="button"],li,article,details,.relationship-list-row,.relationship-card')||n.parentElement||n)));
  }

  function idsFor(card,vocab){
    const ids=[];
    const add=v=>{const id=canon(v);if(id&&!ids.includes(id))ids.push(id)};
    card.querySelectorAll('[data-glyph-id],[data-relphi-glyph],[data-placement],[data-placement-id],[data-object-id]').forEach(n=>add(n.dataset.glyphId||n.dataset.relphiGlyph||n.dataset.placement||n.dataset.placementId||n.dataset.objectId));
    const text=String(card.textContent||'');
    Object.entries(GLYPH_TEXT).forEach(([glyph,id])=>{if(text.includes(glyph)&&!ids.includes(id))ids.push(id)});
    const clean=' '+norm(text)+' ';
    vocab.forEach(([name,id])=>{if(!ids.includes(id)&&clean.includes(' '+name+' '))ids.push(id)});
    return ids;
  }

  function activePairs(svg){
    if(!svg?.classList.contains('has-isolation'))return null;
    const pairs=new Set();
    svg.querySelectorAll('[data-interactive="aspect"].is-kept,[data-interactive="aspect"].is-related,[data-interactive="aspect"].is-selected').forEach(line=>{
      const a=canon(line.dataset.skyAPlacement),b=canon(line.dataset.skyBPlacement);
      if(a&&b)pairs.add([a,b].sort().join('|'));
    });
    return pairs;
  }

  function badge(){
    const h=heading('Relationships');if(!h)return null;
    let p=h.parentElement;
    while(p&&p!==document.body){const found=Array.from(p.querySelectorAll('span,output,strong,b')).find(n=>/^\d+(?:\s*\/\s*\d+)?$/.test(String(n.textContent||'').trim()));if(found)return found;p=p.parentElement}
    return null;
  }

  function apply(){
    queued=false;
    const svg=document.querySelector('.unified-sky-wheel>.scn-live-wheel[data-ready="true"]');
    const pairs=activePairs(svg),cards=relationshipCards();
    if(!cards.length)return;
    const total=cards.length,b=badge();
    if(!pairs){cards.forEach(c=>c.classList.remove('relphi-isolation-card-hidden'));document.documentElement.classList.remove('relphi-results-isolated');if(b)b.textContent=String(total);return}
    const vocab=vocabulary();let shown=0;
    cards.forEach(card=>{
      const ids=idsFor(card,vocab);let match=false;
      for(let i=0;i<ids.length&&!match;i++)for(let j=i+1;j<ids.length&&!match;j++)match=pairs.has([ids[i],ids[j]].sort().join('|'));
      card.classList.toggle('relphi-isolation-card-hidden',!match);if(match)shown++;
    });
    document.documentElement.classList.add('relphi-results-isolated');
    if(b){b.textContent=shown+' / '+total;b.setAttribute('aria-label',shown+' of '+total+' relationships shown')}
  }

  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(apply))}
  function bindWheel(){
    const svg=document.querySelector('.unified-sky-wheel>.scn-live-wheel[data-ready="true"]');if(!svg)return;
    wheelObserver?.disconnect();wheelObserver=new MutationObserver(queue);wheelObserver.observe(svg,{attributes:true,subtree:true,attributeFilter:['class']});
    svg.addEventListener('click',queue,true);svg.addEventListener('keydown',queue,true);
  }
  function style(){if(document.getElementById('relphi-isolation-results-sync-v2-style'))return;const s=document.createElement('style');s.id='relphi-isolation-results-sync-v2-style';s.textContent='.relphi-isolation-card-hidden{display:none!important}';document.head.appendChild(s)}
  function start(){style();bindWheel();apply();window.addEventListener('relphi:sky-chart-next-display-ready',()=>{bindWheel();queue()});bodyObserver=new MutationObserver(()=>{bindWheel();queue()});bodyObserver.observe(document.body,{childList:true,subtree:true})}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();