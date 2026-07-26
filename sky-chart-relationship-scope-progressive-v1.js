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
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(_) {}}
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

  function relationshipsHeading(){
    return Array.from(document.querySelectorAll('h1,h2,h3,h4,[role="heading"]')).find(node=>/^relationships$/i.test(String(node.textContent||'').trim()))||null;
  }

  function relationshipsPanel(heading){
    if(!heading)return null;
    let node=heading.parentElement;
    while(node&&node!==document.body){
      if(node.querySelector('.relationship-list-row')||/relationship/i.test(String(node.className||''))) return node;
      node=node.parentElement;
    }
    return heading.parentElement;
  }

  function placeChartAxesAboveRelationships(){
    const structural=document.getElementById('relphiStructuralRelationshipSections');
    const heading=relationshipsHeading();
    const panel=relationshipsPanel(heading);
    if(!structural||!panel)return null;
    structural.classList.add('relphi-chart-axes-box');
    structural.classList.toggle('relphi-chart-axes-two-skies',hasSkyB());
    if(structural.nextElementSibling!==panel) panel.insertAdjacentElement('beforebegin',structural);
    return {structural,heading,panel};
  }

  function ensureScopeControl(){
    const placement=placeChartAxesAboveRelationships();
    if(!placement)return null;
    const {heading}=placement;
    let header=heading.closest('.panel-heading-row,.relationship-heading,.section-heading,.heading-row')||heading.parentElement;
    header.classList.add('relphi-relationships-heading-row');

    let shell=document.getElementById('relphiRelationshipScope');
    if(!shell){
      shell=document.createElement('div');
      shell.id='relphiRelationshipScope';
      shell.className='relphi-relationship-scope';
      shell.innerHTML='<button type="button" class="relphi-relationship-filter-button" aria-haspopup="true" aria-expanded="false"><span>Filter</span><span aria-hidden="true">▾</span></button><div class="relphi-relationship-filter-flyout" hidden><strong>Show</strong><label><input type="checkbox" data-scope="withinA"> A ↔ A</label><label><input type="checkbox" data-scope="withinB"> B ↔ B</label><label><input type="checkbox" data-scope="between"> A ↔ B</label></div>';
      header.appendChild(shell);
      const button=shell.querySelector('.relphi-relationship-filter-button');
      const flyout=shell.querySelector('.relphi-relationship-filter-flyout');
      button.addEventListener('click',event=>{
        event.stopPropagation();
        const open=flyout.hidden;
        flyout.hidden=!open;
        button.setAttribute('aria-expanded',open?'true':'false');
      });
      shell.addEventListener('click',event=>event.stopPropagation());
      shell.addEventListener('change',()=>{
        if(!hasSkyB())return;
        const state={withinA:shell.querySelector('[data-scope="withinA"]').checked,withinB:shell.querySelector('[data-scope="withinB"]').checked,between:shell.querySelector('[data-scope="between"]').checked};
        write(SCOPE_KEY,state);applyScope();
      });
      document.addEventListener('click',()=>{
        flyout.hidden=true;
        button.setAttribute('aria-expanded','false');
      });
      document.addEventListener('keydown',event=>{
        if(event.key==='Escape'){
          flyout.hidden=true;
          button.setAttribute('aria-expanded','false');
          button.focus();
        }
      });
    } else if(shell.parentElement!==header){
      header.appendChild(shell);
    }

    const twoSkies=hasSkyB(),state=savedScopes(twoSkies);
    const a=shell.querySelector('[data-scope="withinA"]'),b=shell.querySelector('[data-scope="withinB"]'),between=shell.querySelector('[data-scope="between"]');
    a.checked=state.withinA;a.disabled=false;
    b.checked=state.withinB;b.disabled=!twoSkies;
    between.checked=state.between;between.disabled=!twoSkies;
    shell.dataset.twoSkies=twoSkies?'true':'false';
    return shell;
  }

  function applyScope(){
    const control=document.getElementById('relphiRelationshipScope');if(!control)return;
    const enabled={
      'within-a':control.querySelector('[data-scope="withinA"]').checked,
      'within-b':control.querySelector('[data-scope="withinB"]').checked,
      'between':control.querySelector('[data-scope="between"]').checked
    };
    relationshipRows().forEach(host=>{const type=classify(host);host.dataset.relphiRelationshipScope=type;host.hidden=type?!enabled[type]:false});
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
    s.textContent='.relphi-chart-axes-box{display:grid;gap:.9rem;margin:0 0 1.15rem;padding:1rem;border:1px solid rgba(220,31,24,.36);border-radius:1rem;background:#fff;box-shadow:0 4px 16px rgba(0,0,0,.05)}.relphi-chart-axes-box .relphi-relationship-subsection{padding:0}.relphi-chart-axes-box .relphi-relationship-subsection-heading{padding-bottom:.5rem;border-bottom:1px solid rgba(220,31,24,.16)}.relphi-chart-axes-two-skies [data-relationship-section="axes"] .relphi-relationship-subsection-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem}.relphi-relationships-heading-row{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:.75rem!important;position:relative}.relphi-relationship-scope{position:relative;margin-left:auto}.relphi-relationship-filter-button{display:inline-flex;align-items:center;gap:.45rem;appearance:none;border:1px solid rgba(220,31,24,.4);border-radius:999px;background:#fff;color:#111;font:inherit;font-size:.84rem;font-weight:800;padding:.42rem .72rem;cursor:pointer}.relphi-relationship-filter-button:hover,.relphi-relationship-filter-button:focus-visible{background:rgba(220,31,24,.06);border-color:#dc1f18}.relphi-relationship-filter-flyout{position:absolute;right:0;top:calc(100% + .42rem);z-index:30;min-width:9.5rem;padding:.55rem;border:1px solid rgba(0,0,0,.16);border-radius:.75rem;background:#fff;box-shadow:0 10px 28px rgba(0,0,0,.14)}.relphi-relationship-filter-flyout strong{display:block;margin:0 0 .35rem;padding:0 .2rem;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:#655}.relphi-relationship-filter-flyout label{display:flex;align-items:center;gap:.45rem;padding:.4rem .35rem;border-radius:.45rem;font-weight:720;white-space:nowrap}.relphi-relationship-filter-flyout label:hover{background:rgba(220,31,24,.055)}.relphi-relationship-filter-flyout input{margin:0}.relphi-relationship-filter-flyout input:disabled{opacity:.45}.relphi-heavy-venus-mars{font-weight:950!important;text-shadow:.025em 0 currentColor,-.025em 0 currentColor,0 .025em currentColor,0 -.025em currentColor}.relphi-canonical-token[data-relphi-reveal-level="glyph"] .relphi-canonical-token-name,.relphi-canonical-token[data-relphi-reveal-level="glyph"] .relphi-canonical-token-meaning{display:none!important}.relphi-canonical-token[data-relphi-reveal-level="name"] .relphi-canonical-token-meaning{display:none!important}@media(max-width:600px){.relphi-mobile-dual-card-view{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;column-gap:.45rem!important;align-items:start!important}.relphi-mobile-dual-card-view .relphi-dual-card-item{grid-row:1!important;width:100%!important;max-width:100%!important;min-width:0!important}.relphi-mobile-dual-card-view .relphi-dual-card-item:first-of-type{grid-column:1!important}.relphi-mobile-dual-card-view .relphi-dual-card-item:nth-of-type(2){grid-column:2!important}.relphi-mobile-dual-card-view .relphi-progressive-reading,.relphi-mobile-dual-card-view .relphi-canonical-relationship-reading,.relphi-mobile-dual-card-view [class*="reading"]{grid-column:1/-1!important}.relphi-chart-axes-two-skies [data-relationship-section="axes"] .relphi-relationship-subsection-list{grid-template-columns:minmax(0,1fr)}.relphi-chart-axes-box{padding:.8rem}.relphi-relationship-filter-flyout{right:0}}';
    document.head.appendChild(s);
  }

  function run(){queued=false;protectNatalSetup();dedupeLibrary();ensureScopeControl();applyScope();strengthenTextGlyphs();dualCards();finishProgressiveReveal()}
  function queue(){if(queued)return;queued=true;requestAnimationFrame(run)}
  function start(){styles();run();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true});window.addEventListener('storage',queue);document.addEventListener('relphi:skyroleschange',queue);window.addEventListener('resize',queue,{passive:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();