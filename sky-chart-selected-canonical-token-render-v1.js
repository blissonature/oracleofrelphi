// Rebuild selected relationship token glyphs from canonical masters after all view transforms.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSelectedCanonicalTokenRenderV1)return;
  window.__relphiSelectedCanonicalTokenRenderV1=true;

  const NS='http://www.w3.org/2000/svg';
  let queued=false;

  function colorFor(token){
    if(token.closest('.sky-a,[data-selected-card="A"]'))return '#c9211e';
    if(token.closest('.sky-b,[data-selected-card="B"]'))return '#2462d0';
    const id=token.dataset.progressiveGlyphId;
    const aspectColors={conjunction:'#e53935','semi-sextile':'#7c9b49',octile:'#b86d43',sextile:'#d3b727',quintile:'#8b6cc2',square:'#d6534d',trine:'#4e9e69','tri-octile':'#9f5944','bi-quintile':'#7655aa',quincunx:'#4b8e88',opposition:'#5961c8'};
    return aspectColors[id]||'#111111';
  }

  function radiusFor(token){
    if(token.closest('.sky-redundancy-title'))return 12;
    if(token.closest('.sky-selected-aspect-diagram'))return 10;
    if(token.closest('.sky-redundancy-card-facts'))return 9;
    return 9;
  }

  async function rebuild(token){
    const id=token.dataset.progressiveGlyphId;
    const button=token.querySelector(':scope > .sky-progressive-glyph');
    if(!id||!button||!window.RelphiGlyphComponent?.draw)return;

    let stage=button.querySelector(':scope > svg');
    if(!stage){
      stage=document.createElementNS(NS,'svg');
      button.replaceChildren(stage);
    }else stage.replaceChildren();

    stage.setAttribute('viewBox','-20 -20 40 40');
    stage.setAttribute('preserveAspectRatio','xMidYMid meet');
    stage.setAttribute('aria-hidden','true');
    stage.dataset.canonicalTokenStage='true';

    await window.RelphiGlyphComponent.draw(stage,id,{
      radius:radiusFor(token),
      padding:1,
      color:colorFor(token)
    });
    token.dataset.canonicalTokenRender='master-frame';
  }

  function installStyles(){
    if(document.getElementById('skySelectedCanonicalTokenStyles'))return;
    const style=document.createElement('style');
    style.id='skySelectedCanonicalTokenStyles';
    style.textContent=`
      #skySelectedRelationship .sky-progressive-glyph{
        width:2.15rem!important;
        height:2.15rem!important;
        min-width:2.15rem!important;
        padding:0!important;
        margin:0!important;
        border:0!important;
        border-radius:0!important;
        background:transparent!important;
        box-shadow:none!important;
        overflow:visible!important;
        line-height:1!important;
      }
      #skySelectedRelationship .sky-progressive-glyph::before,
      #skySelectedRelationship .sky-progressive-glyph::after{content:none!important;display:none!important}
      #skySelectedRelationship .sky-progressive-glyph > svg{
        display:block!important;
        width:100%!important;
        height:100%!important;
        max-width:100%!important;
        max-height:100%!important;
        overflow:visible!important;
      }
      #skySelectedRelationship .sky-redundancy-title .sky-progressive-glyph{
        width:2.7rem!important;height:2.7rem!important;min-width:2.7rem!important
      }
      #skySelectedRelationship .sky-redundancy-card-facts .sky-progressive-token{
        min-width:0!important;max-width:100%!important
      }
      #skySelectedRelationship .sky-redundancy-card-facts .sky-progressive-glyph{
        width:1.9rem!important;height:1.9rem!important;min-width:1.9rem!important
      }
    `;
    document.head.appendChild(style);
  }

  async function apply(){
    queued=false;
    const panel=document.getElementById('skySelectedRelationship');
    if(!panel||panel.hidden)return;
    const tokens=[...panel.querySelectorAll('.sky-progressive-token[data-progressive-glyph-id]')];
    await Promise.allSettled(tokens.map(rebuild));
    panel.dataset.canonicalTokenPass='complete';
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>requestAnimationFrame(apply));
  }

  function start(){
    installStyles();
    ['relphi:selected-relationship-rendered','relphi:selected-relationship-redundancy-pass-ready'].forEach(name=>window.addEventListener(name,schedule));
    new MutationObserver(mutations=>{
      if(mutations.some(m=>[...m.addedNodes].some(node=>node.nodeType===1)))schedule();
    }).observe(document.body,{childList:true,subtree:true});
    schedule();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
