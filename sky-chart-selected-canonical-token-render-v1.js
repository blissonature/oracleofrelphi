// Render selected relationship tokens exactly as the Master Glyph List renders them.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSelectedCanonicalTokenRenderV2)return;
  window.__relphiSelectedCanonicalTokenRenderV2=true;

  const NS='http://www.w3.org/2000/svg';
  const MASTER_RADIUS=19;
  let queued=false;

  function colorFor(token){
    if(token.closest('.sky-a,[data-selected-card="A"],.sky-shared-context-a'))return '#c9211e';
    if(token.closest('.sky-b,[data-selected-card="B"],.sky-shared-context-b'))return '#2462d0';
    const id=token.dataset.progressiveGlyphId;
    const aspectColors={conjunction:'#e53935','semi-sextile':'#7c9b49',octile:'#b86d43',sextile:'#d3b727',quintile:'#8b6cc2',square:'#d6534d',trine:'#4e9e69','tri-octile':'#9f5944','bi-quintile':'#7655aa',quincunx:'#4b8e88',opposition:'#5961c8'};
    return aspectColors[id]||'#111111';
  }

  async function rebuild(token){
    const id=token.dataset.progressiveGlyphId;
    const button=token.querySelector(':scope > .sky-progressive-glyph');
    const component=window.RelphiGlyphComponent;
    if(!id||!button||!component?.createBubble)return;

    let stage=button.querySelector(':scope > svg');
    if(!stage){
      stage=document.createElementNS(NS,'svg');
      button.replaceChildren(stage);
    }else stage.replaceChildren();

    // This is the exact Master Glyph List stage. Its whitespace is authored geometry.
    stage.setAttribute('viewBox','-32 -32 64 64');
    stage.setAttribute('preserveAspectRatio','xMidYMid meet');
    stage.setAttribute('aria-hidden','true');
    stage.dataset.canonicalTokenStage='direct-canon';

    const bubble=component.createBubble(stage,id,{
      radius:MASTER_RADIUS,
      padding:1,
      color:colorFor(token)
    });
    // Selected context uses the authored uncircled set: identical master, circle hidden only.
    bubble.circle.style.opacity='0';
    bubble.circle.setAttribute('aria-hidden','true');
    await bubble.ready;
    token.dataset.canonicalTokenRender='direct-master-glyph-list';
  }

  function installStyles(){
    if(document.getElementById('skySelectedCanonicalTokenStylesV2'))return;
    const style=document.createElement('style');
    style.id='skySelectedCanonicalTokenStylesV2';
    style.textContent=`
      #skySelectedRelationship .sky-progressive-glyph{
        width:2.15rem!important;height:2.15rem!important;min-width:2.15rem!important;
        padding:0!important;margin:0!important;border:0!important;border-radius:0!important;
        background:transparent!important;box-shadow:none!important;overflow:visible!important;line-height:1!important
      }
      #skySelectedRelationship .sky-progressive-glyph::before,
      #skySelectedRelationship .sky-progressive-glyph::after{content:none!important;display:none!important}
      #skySelectedRelationship .sky-progressive-glyph>svg{
        display:block!important;width:100%!important;height:100%!important;
        max-width:100%!important;max-height:100%!important;overflow:visible!important
      }
    `;
    document.head.appendChild(style);
  }

  async function apply(){
    queued=false;
    const panel=document.getElementById('skySelectedRelationship');
    if(!panel||panel.hidden)return;
    await Promise.allSettled([...panel.querySelectorAll('.sky-progressive-token[data-progressive-glyph-id]')].map(rebuild));
    panel.dataset.canonicalTokenPass='direct-canon';
  }

  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(apply))}
  function start(){
    installStyles();
    ['relphi:selected-relationship-rendered','relphi:selected-relationship-redundancy-pass-ready','relphi:selected-shared-context-ready'].forEach(name=>window.addEventListener(name,schedule));
    new MutationObserver(mutations=>{if(mutations.some(m=>[...m.addedNodes].some(node=>node.nodeType===1)))schedule()}).observe(document.body,{childList:true,subtree:true});
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();