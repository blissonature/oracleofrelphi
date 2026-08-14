// Keep the two confirmed Sky cards vertically symmetric even when one address wraps more lines.
// Measure only each facts block's natural height; never measure a height imposed by this aligner.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyConfirmedCardAlignmentV2)return;
  window.__relphiSkyConfirmedCardAlignmentV2=true;
  window.__relphiSkyConfirmedCardAlignmentV1=true;

  const STYLE_ID='skyConfirmedCardAlignmentV2';
  let queued=false;

  function installStyle(){
    document.getElementById('skyConfirmedCardAlignmentV1')?.remove();
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent='.sky-where-when-facts{box-sizing:border-box;min-height:var(--sky-confirmed-facts-height,0px);align-content:start}';
    document.head.appendChild(style);
  }
  function visibleFacts(slot){
    const node=document.querySelector(`#skyFoundation${slot} .sky-where-when-confirmed .sky-where-when-facts`);
    if(!node||node.closest('[hidden]'))return null;
    return node;
  }
  function run(){
    queued=false;
    installStyle();
    const root=document.getElementById('skyFoundationRoot');
    if(!root)return;
    const facts=[visibleFacts('A'),visibleFacts('B')].filter(Boolean);
    if(facts.length<2){
      root.style.removeProperty('--sky-confirmed-facts-height');
      return;
    }

    // Critical invariant: remove our own imposed size before reading layout. getBoundingClientRect()
    // then forces layout at each block's true content height, so repeated passes cannot grow it.
    root.style.removeProperty('--sky-confirmed-facts-height');
    const naturalHeights=facts.map(node=>Math.ceil(node.getBoundingClientRect().height));
    const sharedHeight=Math.max(...naturalHeights);
    if(Number.isFinite(sharedHeight)&&sharedHeight>0){
      root.style.setProperty('--sky-confirmed-facts-height',`${sharedHeight}px`);
    }
  }
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(run);
  }
  function start(){
    installStyle();
    run();
    const root=document.getElementById('skyFoundationRoot')||document.body;
    new MutationObserver(schedule).observe(root,{childList:true,subtree:true,characterData:true});
    window.addEventListener('resize',schedule,{passive:true});
    window.visualViewport?.addEventListener('resize',schedule,{passive:true});
    ['relphi:sky-foundation-ready','relphi:sky-name-updated','relphi:saved-sky-active-changed'].forEach(name=>window.addEventListener(name,schedule));
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
