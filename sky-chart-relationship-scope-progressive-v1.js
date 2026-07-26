// Stabilizes Sky A/B identity and completes scoped progressive relationship views.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const LIBRARY='relphiSkyLibraryV1';
  const SLOT_A='relphiSkyChartA';
  const SLOT_B='relphiSkyChartB';
  const BIRTH_SETUP='relphiBirthProfileSetupV1';
  const SCOPE_KEY='relphiRelationshipScopesV2';
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
    const seen=new Set(),clean=[];
    list.forEach(record=>{
      if(!record) return;
      const key=(String(record.name||'').trim().toLowerCase()||'unnamed')+'|'+sig(record);
      if(seen.has(key)) return;
      seen.add(key);clean.push(record);
    });
    if(clean.length!==list.length) write(LIBRARY,clean);
  }

  function protectNatalSetup(){
    const raw=sessionStorage.getItem(BIRTH_SETUP);
    if(!raw) return;
    let ctx={};try{ctx=JSON.parse(raw)||{}}catch(_){}
    if(ctx.slotA==null)localStorage.removeItem(SLOT_A);else localStorage.setItem(SLOT_A,ctx.slotA);
    if(ctx.slotB==null)localStorage.removeItem(SLOT_B);else localStorage.setItem(SLOT_B,ctx.slotB);
    dedupeLibrary();
  }

  function skyNames(){
    const a=read(SLOT_A,{}),b=read(SLOT_B,{});
    return {a:String(a&&a.name||'').trim().toLowerCase(),b:String(b&&b.name||'').trim().toLowerCase()};
  }
  function hasSkyB(){return !!sig(read(SLOT_B,null))}

  function relationshipNames(host){
    const value=String(host.textContent||'').replace(/\s+/g,' ').trim();
    let m=value.match(/^Between\s+(.+?)\s+and\s+(.+?),/i);
    if(m)return [m[1].trim().toLowerCase(),m[2].trim().toLowerCase()];
    m=value.match(/^(.+?)[’']s\s+.+?\s+connects with\s+(.+?)[’']s\s+/i);
    return m?[m[1].trim().toLowerCase(),m[2].trim().toLowerCase()]:null;
  }

  function relationshipRows(){
    const selectors=['.relphi-progressive-reading','.relphi-canonical-relationship-reading','[data-relphi-relationship]','.relationship-list-row'];
    const seen=new Set(),rows=[];
    document.querySelectorAll(selectors.join(',')).forEach(node=>{
      const host=node.closest('.relationship-list-row,li,article,details,.relationship-card')||node;
      if(seen.has(host)||!relationshipNames(host))return;
      seen.add(host);rows.push(host);
    });
    return rows;
  }

  function classify(host){
    const pair=relationshipNames(host);if(!pair)return '';
    const [left,right]=pair,names=skyNames();
    if(left!==right)return 'between';
    if(names.b&&left===names.b)return 'within-b';
    if(names.a&&left===names.a)return 'within-a';
    return 'within-a';
  }

  function savedScopes(twoSkies){
    const saved=read(SCOPE_KEY,null);
    if(!twoSkies)return {withinA:true,withinB:false,between:false};
    if(!saved)return {withinA:true,withinB:true,between:true};
    return {withinA:saved.withinA!==false,withinB:saved.withinB!==false,between:saved.between!==false};
  }

  function ensureScopeControl(){
    const structural=document.getElementById('relphiStructuralRelationshipSections');
    const axes=structural&&structural.querySelector('[data-relationship-section="axes"]');
    if(!axes)return null;
    axes.hidden=false;
    structural.classList.add('relphi-chart-axes-box');
    let control=document.getElementById('relphiRelationshipScope');
    if(!control){
      control=document.createElement('fieldset');
      control.id='relphiRelationshipScope';
      control.className='relphi-relationship-scope';
      control.innerHTML='<legend>Show relationship sets</legend><div class="relphi-relationship-scope-options"><label><input type="checkbox" data-scope="withinA"> Sky A ↔ Sky A</label><label><input type="checkbox" data-scope="withinB"> Sky B ↔ Sky B</label><label><input type="checkbox" data-scope="between"> Sky A ↔ Sky B</label></div>';
      const heading=axes.querySelector('.relphi-relationship-subsection-heading');
      heading.insertAdjacentElement('afterend',control);
      control.addEventListener('change',()=>{
        if(!hasSkyB())return;
        const state={withinA:control.querySelector('[data-scope="withinA"]').checked,withinB:control.querySelector('[data-scope="withinB"]').checked,between:control.querySelector('[data-scope="between"]').checked};
        write(SCOPE_KEY,state);applyScope();
      });
    }
    const twoSkies=hasSkyB(),state=savedScopes(twoSkies);
    const a=control.querySelector('[data-scope="withinA"]'),b=control.querySelector('[data-scope="withinB"]'),between=control.querySelector('[data-scope="between"]');
    a.checked=state.withinA;a.disabled=false;
    b.checked=state.withinB;b.disabled=!twoSkies;
    between.checked=state.between;between.disabled=!twoSkies;
    control.dataset.twoSkies=twoSkies?'true':'false';
    return control;
  }

  function applyScope(){
    const control=document.getElementById('relphiRelationshipScope');if(!control)return;
    const enabled={
      'within-a':control.querySelector('[data-scope="withinA"]').checked,
      'within-b':control.querySelector('[data-scope="withinB"]').checked,
      'between':control.querySelector('[data-scope="between"]').checked
    };
    relationshipRows().forEach(host=>{const type=classify(host);host.dataset.relphiRelationshipScope=type;host.hidden=type?!enabled[type]:false});
    document.querySelectorAll('.relphi-relationship-subsection').forEach(section=>{
      const rows=Array.from(section.querySelectorAll(':scope .relationship-list-row'));
      const visible=rows.filter(row=>!row.hidden).length;
      const badge=section.querySelector('.relphi-relationship-subsection-count');
      if(badge){badge.textContent=String(visible);badge.setAttribute('aria-label',visible+(visible===1?' relationship':' relationships'))}
      if(section.dataset.relationshipSection!=='axes')section.hidden=rows.length>0&&visible===0;
    });
  }

  function strengthenTextGlyphs(){
    document.querySelectorAll('.relphi-canonical-token-glyph,.chart-wheel-marker-glyph,.relationship-list-row button,.relationship-list-row span').forEach(node=>{
      if(node.querySelector('img,svg'))return;
      const t=(node.textContent||'').trim();node.classList.toggle('relphi-heavy-venus-mars',t==='♀'||t==='♂');
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
      const glyph=token.querySelector('.relphi-canonical-token-glyph'),name=token.querySelector('.relphi-canonical-token-name'),meaning=token.querySelector('.relphi-canonical-token-meaning');
      token.dataset.relphiRevealLevel=meaning?'meaning':name?'name':'glyph';
      if(glyph&&!glyph.dataset.relphiCollapseBound){glyph.dataset.relphiCollapseBound='1';glyph.addEventListener('click',()=>requestAnimationFrame(()=>{token.dataset.relphiRevealLevel=token.querySelector('.relphi-canonical-token-name')?'name':'glyph'}))}
      if(name&&!name.dataset.relphiCollapseBound){name.dataset.relphiCollapseBound='1';name.addEventListener('click',()=>requestAnimationFrame(()=>{token.dataset.relphiRevealLevel=token.querySelector('.relphi-canonical-token-meaning')?'meaning':'name'}))}
      if(meaning&&!meaning.dataset.relphiCollapseBound){meaning.dataset.relphiCollapseBound='1';meaning.addEventListener('click',()=>requestAnimationFrame(()=>{token.dataset.relphiRevealLevel='name'}))}
    });
  }

  function styles(){
    if(document.getElementById('relphi-relationship-scope-progressive-style'))return;
    const s=document.createElement('style');s.id='relphi-relationship-scope-progressive-style';
    s.textContent='.relphi-chart-axes-box{display:grid;gap:.85rem;margin:0 0 1.25rem;padding:1rem;border:2px solid rgba(220,31,24,.42);border-radius:1rem;background:linear-gradient(180deg,rgba(220,31,24,.055),rgba(255,255,255,.88));box-shadow:0 4px 16px rgba(0,0,0,.045)}.relphi-chart-axes-box .relphi-relationship-axes{display:grid!important}.relphi-relationship-scope{margin:0;padding:.75rem;border:1px solid rgba(0,0,0,.16);border-radius:.75rem;background:rgba(255,255,255,.82)}.relphi-relationship-scope legend{padding:0 .35rem;font-weight:850}.relphi-relationship-scope-options{display:flex;flex-wrap:wrap;gap:.55rem 1rem}.relphi-relationship-scope-options label{display:inline-flex;align-items:center;gap:.38rem;font-weight:720}.relphi-relationship-scope-options input:disabled+*{opacity:.5}.relphi-heavy-venus-mars{font-weight:950!important;text-shadow:.025em 0 currentColor,-.025em 0 currentColor,0 .025em currentColor,0 -.025em currentColor}.relphi-canonical-token[data-relphi-reveal-level="glyph"] .relphi-canonical-token-name,.relphi-canonical-token[data-relphi-reveal-level="glyph"] .relphi-canonical-token-meaning{display:none!important}.relphi-canonical-token[data-relphi-reveal-level="name"] .relphi-canonical-token-meaning{display:none!important}@media(max-width:600px){.relphi-mobile-dual-card-view{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;column-gap:.45rem!important;align-items:start!important}.relphi-mobile-dual-card-view .relphi-dual-card-item{grid-row:1!important;width:100%!important;max-width:100%!important;min-width:0!important}.relphi-mobile-dual-card-view .relphi-dual-card-item:first-of-type{grid-column:1!important}.relphi-mobile-dual-card-view .relphi-dual-card-item:nth-of-type(2){grid-column:2!important}.relphi-mobile-dual-card-view .relphi-progressive-reading,.relphi-mobile-dual-card-view .relphi-canonical-relationship-reading,.relphi-mobile-dual-card-view [class*="reading"]{grid-column:1/-1!important}.relphi-relationship-scope-options{display:grid;grid-template-columns:1fr}.relphi-chart-axes-box{padding:.8rem}}';
    document.head.appendChild(s);
  }

  function run(){queued=false;protectNatalSetup();dedupeLibrary();ensureScopeControl();applyScope();strengthenTextGlyphs();dualCards();finishProgressiveReveal()}
  function queue(){if(queued)return;queued=true;requestAnimationFrame(run)}
  function start(){styles();run();document.addEventListener('click',()=>setTimeout(queue,0),true);new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true});window.addEventListener('storage',queue);document.addEventListener('relphi:skyroleschange',queue)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();