// Keep the two confirmed Sky cards vertically symmetric even when one address wraps more lines.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyConfirmedCardAlignmentV1)return;
  window.__relphiSkyConfirmedCardAlignmentV1=true;

  const STYLE_ID='skyConfirmedCardAlignmentV1';
  let queued=false,lastHeight=0;

  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');style.id=STYLE_ID;
    style.textContent='.sky-where-when-facts{box-sizing:border-box;min-height:var(--sky-confirmed-facts-height,auto)}';
    document.head.appendChild(style);
  }
  function visibleFacts(slot){
    const node=document.querySelector(`#skyFoundation${slot} .sky-where-when-confirmed .sky-where-when-facts`);
    if(!node||node.closest('[hidden]'))return null;
    return node;
  }
  function intrinsicHeight(node){
    const style=getComputedStyle(node),children=[...node.children].filter(child=>getComputedStyle(child).display!=='none');
    const number=value=>Number.parseFloat(value)||0;
    const gap=number(style.rowGap||style.gap);
    const childrenHeight=children.reduce((sum,child)=>sum+child.getBoundingClientRect().height,0);
    return Math.ceil(
      number(style.paddingTop)+number(style.paddingBottom)+
      number(style.borderTopWidth)+number(style.borderBottomWidth)+
      childrenHeight+Math.max(0,children.length-1)*gap
    );
  }
  function run(){
    queued=false;installStyle();
    const root=document.getElementById('skyFoundationRoot');if(!root)return;
    const facts=[visibleFacts('A'),visibleFacts('B')].filter(Boolean);
    if(facts.length<2){lastHeight=0;root.style.removeProperty('--sky-confirmed-facts-height');return}
    const height=Math.max(...facts.map(intrinsicHeight));
    if(height===lastHeight)return;
    lastHeight=height;root.style.setProperty('--sky-confirmed-facts-height',`${height}px`);
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(run)}
  function start(){
    installStyle();run();
    const root=document.getElementById('skyFoundationRoot')||document.body;
    new MutationObserver(schedule).observe(root,{childList:true,subtree:true,characterData:true});
    window.addEventListener('resize',schedule,{passive:true});
    window.visualViewport?.addEventListener('resize',schedule,{passive:true});
    ['relphi:sky-foundation-ready','relphi:sky-name-updated','relphi:saved-sky-active-changed'].forEach(name=>window.addEventListener(name,schedule));
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
