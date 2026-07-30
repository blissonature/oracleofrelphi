(function(){
  'use strict';
  if(window.__skyChartNextFocusTargetsInstalled)return;
  window.__skyChartNextFocusTargetsInstalled=true;

  function activate(){
    const svg=document.querySelector('#wheelMount svg.scn-wheel');
    if(!svg)return;
    svg.querySelectorAll('[data-focusable-piece="sign"]').forEach(node=>{node.dataset.interactive='sign';});
    svg.querySelectorAll('[data-focusable-piece="house"]').forEach(node=>{node.dataset.interactive='house';});
    svg.querySelectorAll('[data-focusable-piece="placement-leader"]').forEach(node=>{node.dataset.interactive='placement-leader';});
  }

  const mount=document.getElementById('wheelMount');
  if(mount)new MutationObserver(()=>requestAnimationFrame(activate)).observe(mount,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',activate,{once:true});
  else activate();
})();