// Sky Chart page stability v1: prevent top-edge overscroll from becoming browser pull-to-refresh.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyPageStabilityV1)return;
window.__relphiSkyPageStabilityV1=true;

const STYLE_ID='skyPageStabilityV1Styles';
let startX=0,startY=0;

function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    html,body{overscroll-behavior-y:none!important}
    #skyFoundationRelationshipList,
    .sky-ledger-body,
    .inline-rel-detail{overscroll-behavior:contain!important}
  `;
  document.head.appendChild(style);
}
function installStaleness(){
  if(window.__relphiSkyStalenessV1||document.querySelector('script[src^="sky-chart-staleness-v1.js"]'))return;
  const script=document.createElement('script');
  script.async=false;
  script.src='sky-chart-staleness-v1.js?v=1';
  document.body.appendChild(script);
}
function scrollableAncestor(target){
  let node=target instanceof Element?target:null;
  while(node&&node!==document.body&&node!==document.documentElement){
    const style=getComputedStyle(node),overflow=style.overflowY;
    if((overflow==='auto'||overflow==='scroll'||overflow==='overlay')&&node.scrollHeight>node.clientHeight+1)return node;
    node=node.parentElement;
  }
  return null;
}
function pageTop(){
  const root=document.scrollingElement||document.documentElement;
  return Math.max(0,Number(root?.scrollTop||window.scrollY||0));
}
function onTouchStart(event){
  if(event.touches.length!==1)return;
  startX=event.touches[0].clientX;
  startY=event.touches[0].clientY;
}
function onTouchMove(event){
  if(event.touches.length!==1)return;
  const touch=event.touches[0],dx=touch.clientX-startX,dy=touch.clientY-startY;
  if(dy<=0||Math.abs(dy)<=Math.abs(dx))return;
  const scroller=scrollableAncestor(event.target);
  if(scroller&&scroller.scrollTop>0)return;
  if(pageTop()>0)return;
  event.preventDefault();
}
function install(){
  installStyles();
  installStaleness();
  document.addEventListener('touchstart',onTouchStart,{capture:true,passive:true});
  document.addEventListener('touchmove',onTouchMove,{capture:true,passive:false});
}
install();
})();