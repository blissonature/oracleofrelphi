// Stabilizes Sky A/B identity and completes scoped progressive relationship views.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const LIBRARY='relphiSkyLibraryV1';
  const SLOT_A='relphiSkyChartA';
  const SLOT_B='relphiSkyChartB';
  const BIRTH_SETUP='relphiBirthProfileSetupV1';
  const SCOPE_KEY='relphiRelationshipScopeV1';
  let queued=false;

  function read(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(_){return fallback}}
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}}
  function sig(payload){
    const source=payload&&(payload.placements||payload);
    if(!source||typeof source!=='object'||Array.isArray(source)) return '';
    return Object.entries(source).filter(([,v])=>v&&typeof v==='object').sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>[k,v.sign||'',v.degree??'',v.minute??'',v.house??'',v.retrograde?'R':''].join(':')).join('|');
  }

  function dedupeLibrary(){
    const list=read(LIBRARY,[]);
    if(!Array.isArray(list)) return;
    const seen=new Set();
    const clean=[];
    list.forEach(record=>{
      if(!record) return;
      const key=(String(record.name||'').trim().toLowerCase()||'unnamed')+'|'+sig(record);
      if(seen.has(key)) return;
      seen.add(key); clean.push(record);
    });
    if(clean.length!==list.length) write(LIBRARY,clean);
  }

  function protectNatalSetup(){
    const raw=sessionStorage.getItem(BIRTH_SETUP);
    if(!raw) return;
    let ctx={}; try{ctx=JSON.parse(raw)||{}}catch(_){}
    if(ctx.slotA==null) localStorage.removeItem(SLOT_A); else localStorage.setItem(SLOT_A,ctx.slotA);
    if(ctx.slotB==null) localStorage.removeItem(SLOT_B); else localStorage.setItem(SLOT_B,ctx.slotB);
    dedupeLibrary();
  }

  function relationScope(text){
    const m=String(text||'').match(/^\s*Between\s+(.+?)\s+and\s+(.+?),/i);
    if(!m) return '';
    return m[1].trim().toLowerCase()===m[2].trim().toLowerCase()?'within':'between';
  }

  function relationshipRows(){
    const selectors=['.relphi-progressive-reading','.relphi-canonical-relationship-reading','[data-relphi-relationship]','.relationship-list-row'];
    const seen=new Set(), rows=[];
    document.querySelectorAll(selectors.join(',')).forEach(node=>{
      const host=node.closest('.relationship-list-row,li,article,details,.relationship-card')||node;
      if(seen.has(host)) return;
      const scope=relationScope(node.textContent||host.textContent||'');
      if(!scope) return;
      seen.add(host); rows.push({host,scope});
    });
    return rows;
  }

  function ensureScopeControl(rows){
    if(!rows.length) return;
    const first=rows[0].host;
    const container=first.parentElement||first;
    let control=document.getElementById('relphiRelationshipScope');
    if(!control){
      control=document.createElement('label');
      control.id='relphiRelationshipScope';
      control.className='relphi-relationship-scope';
      control.innerHTML='<span>Relationship view</span><select aria-label="Relationship view"><option value="all">All relationships</option><option value="within-a">Sky A ↔ Sky A</option><option value="within-b">Sky B ↔ Sky B</option><option value="between">Sky A ↔ Sky B</option></select>';
      container.insertBefore(control,container.firstChild);
      control.querySelector('select').value=localStorage.getItem(SCOPE_KEY)||'all';
      control.querySelector('select').addEventListener('change',()=>{localStorage.setItem(SCOPE_KEY,control.querySelector('select').value);applyScope(rows)});
    }
    applyScope(rows);
  }

  function skyNames(){
    const a=read(SLOT_A,{}), b=read(SLOT_B,{});
    return {a:String(a&&a.name||'').trim().toLowerCase(),b:String(b&&b.name||'').trim().toLowerCase()};
  }

  function classify(host){
    const m=String(host.textContent||'').match(/^\s*Between\s+(.+?)\s+and\s+(.+?),/i);
    if(!m) return '';
    const left=m[1].trim().toLowerCase(),right=m[2].trim().toLowerCase();
    if(left!==right) return 'between';
    const names=skyNames();
    if(names.a&&left===names.a) return 'within-a';
    if(names.b&&left===names.b) return 'within-b';
    return 'within-a';
  }

  function applyScope(rows){
    const select=document.querySelector('#relphiRelationshipScope select');
    const value=select?select.value:'all';
    rows.forEach(row=>{const type=classify(row.host);row.host.hidden=value!=='all'&&type!==value;row.host.dataset.relphiRelationshipScope=type});
  }

  function strengthenTextGlyphs(){
    document.querySelectorAll('.relphi-canonical-token-glyph,.chart-wheel-marker-glyph,.relationship-list-row button,.relationship-list-row span').forEach(node=>{
      if(node.querySelector('img,svg')) return;
      const t=(node.textContent||'').trim();
      node.classList.toggle('relphi-heavy-venus-mars',t==='♀'||t==='♂');
    });
  }

  function dualCards(){
    document.querySelectorAll('.relphi-progressive-reading,.relphi-canonical-relationship-reading').forEach(reading=>{
      let host=reading.parentElement;
      while(host&&host!==document.body){
        const cards=Array.from(host.querySelectorAll('.tarot-card,.spread-card,[class*="card-image"],img[src*="card"],img[alt*="card" i]')).filter((n,i,a)=>a.indexOf(n)===i);
        if(cards.length>=2){host.classList.add('relphi-mobile-dual-card-view');cards.slice(0,2).forEach(c=>c.classList.add('relphi-dual-card-item'));break}
        host=host.parentElement;
      }
    });
  }

  function finishProgressiveReveal(){
    document.querySelectorAll('.relphi-canonical-token').forEach(token=>{
      const glyph=token.querySelector('.relphi-canonical-token-glyph');
      const name=token.querySelector('.relphi-canonical-token-name');
      const meaning=token.querySelector('.relphi-canonical-token-meaning');
      token.dataset.relphiRevealLevel=meaning?'meaning':name?'name':'glyph';
      if(glyph&&!glyph.dataset.relphiCollapseBound){
        glyph.dataset.relphiCollapseBound='1';
        glyph.addEventListener('click',()=>requestAnimationFrame(()=>{const hasName=token.querySelector('.relphi-canonical-token-name');token.dataset.relphiRevealLevel=hasName?'name':'glyph'}));
      }
      if(name&&!name.dataset.relphiCollapseBound){
        name.dataset.relphiCollapseBound='1';
        name.addEventListener('click',()=>requestAnimationFrame(()=>{token.dataset.relphiRevealLevel=token.querySelector('.relphi-canonical-token-meaning')?'meaning':'name'}));
      }
      if(meaning&&!meaning.dataset.relphiCollapseBound){
        meaning.dataset.relphiCollapseBound='1';
        meaning.addEventListener('click',()=>requestAnimationFrame(()=>{token.dataset.relphiRevealLevel='name'}));
      }
    });
  }

  function styles(){
    if(document.getElementById('relphi-relationship-scope-progressive-style')) return;
    const s=document.createElement('style');s.id='relphi-relationship-scope-progressive-style';
    s.textContent='.relphi-relationship-scope{display:flex;align-items:center;justify-content:space-between;gap:.75rem;margin:0 0 .85rem;padding:.65rem .75rem;border:1px solid rgba(0,0,0,.18);border-radius:.75rem;background:rgba(255,255,255,.78);font-weight:800}.relphi-relationship-scope select{max-width:15rem;padding:.45rem .6rem;border-radius:.55rem;border:1px solid rgba(0,0,0,.25);background:#fff;font:inherit}.relphi-heavy-venus-mars{font-weight:950!important;text-shadow:.025em 0 currentColor,-.025em 0 currentColor,0 .025em currentColor,0 -.025em currentColor}.relphi-canonical-token[data-relphi-reveal-level="glyph"] .relphi-canonical-token-name,.relphi-canonical-token[data-relphi-reveal-level="glyph"] .relphi-canonical-token-meaning{display:none!important}.relphi-canonical-token[data-relphi-reveal-level="name"] .relphi-canonical-token-meaning{display:none!important}@media(max-width:600px){.relphi-mobile-dual-card-view{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;column-gap:.45rem!important;align-items:start!important}.relphi-mobile-dual-card-view .relphi-dual-card-item{grid-row:1!important;width:100%!important;max-width:100%!important;min-width:0!important}.relphi-mobile-dual-card-view .relphi-dual-card-item:first-of-type{grid-column:1!important}.relphi-mobile-dual-card-view .relphi-dual-card-item:nth-of-type(2){grid-column:2!important}.relphi-mobile-dual-card-view .relphi-progressive-reading,.relphi-mobile-dual-card-view .relphi-canonical-relationship-reading,.relphi-mobile-dual-card-view [class*="reading"]{grid-column:1/-1!important}.relphi-relationship-scope{align-items:stretch;flex-direction:column}.relphi-relationship-scope select{max-width:none;width:100%}}';
    document.head.appendChild(s);
  }

  function run(){queued=false;protectNatalSetup();dedupeLibrary();const rows=relationshipRows();ensureScopeControl(rows);strengthenTextGlyphs();dualCards();finishProgressiveReveal()}
  function queue(){if(queued)return;queued=true;requestAnimationFrame(run)}
  function start(){styles();run();document.addEventListener('click',()=>setTimeout(queue,0),true);new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true});window.addEventListener('storage',queue)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
