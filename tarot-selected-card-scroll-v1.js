// Tarot Ledger exact-card list alignment: keep the selected card visible without search or synthetic interaction.
(function(){
  'use strict';
  if(window.RelphiTarotSelectedCardScroll)return;

  function requestedCardId(){
    return String(new URL(location.href).searchParams.get('card')||'').trim();
  }

  function scrollContainer(item){
    for(let node=item.parentElement;node&&node!==document.body;node=node.parentElement){
      if(!node.closest?.('#browsePanel'))break;
      const style=getComputedStyle(node);
      if(/auto|scroll/.test(style.overflowY)&&node.scrollHeight>node.clientHeight+1)return node;
    }
    return document.getElementById('cardList');
  }

  function align(){
    const id=requestedCardId(),list=document.getElementById('cardList');
    if(!id||!list)return false;
    const button=list.querySelector(`.ledger-card-button[data-card-id="${CSS.escape(id)}"]`);
    if(!button)return false;
    const item=button.closest('.ledger-card-item')||button,container=scrollContainer(item);
    if(!container)return false;
    const box=container.getBoundingClientRect(),rect=item.getBoundingClientRect();
    const top=container.scrollTop+(rect.top-box.top)-(box.height-rect.height)/2;
    container.scrollTo({top:Math.max(0,top),behavior:'auto'});
    return true;
  }

  function schedule(){requestAnimationFrame(align)}

  window.RelphiTarotSelectedCardScroll=Object.freeze({align});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
  else schedule();
  window.addEventListener('relphi:tarot-enhancements-ready',schedule);
})();
