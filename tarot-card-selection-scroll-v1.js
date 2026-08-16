// Keep an exact deep-linked Tarot card visible in the existing ordered results list.
(function(){
  'use strict';
  if(window.RelphiTarotCardSelectionScroll)return;

  function requestedCardId(){
    return String(new URL(location.href).searchParams.get('card')||'').trim();
  }

  function exactResultCard(cardId){
    const list=document.getElementById('cardList');
    if(!list||!cardId)return null;
    return Array.from(list.querySelectorAll('.or-card[data-id]')).find(node=>String(node.dataset.id||'')===cardId)
      ||Array.from(list.querySelectorAll('[data-card-id]')).find(node=>String(node.dataset.cardId||'')===cardId)
      ||null;
  }

  function scrollableAncestor(node,browsePanel){
    for(let current=node?.parentElement;current&&browsePanel?.contains(current);current=current.parentElement){
      const style=getComputedStyle(current);
      const overflowY=style.overflowY;
      if((overflowY==='auto'||overflowY==='scroll')&&current.scrollHeight>current.clientHeight+1)return current;
      if(current===browsePanel)break;
    }
    const listPanel=browsePanel?.querySelector('.tarot-list-panel');
    return listPanel&&listPanel.scrollHeight>listPanel.clientHeight+1?listPanel:null;
  }

  function centerInScroller(node,scroller){
    const nodeRect=node.getBoundingClientRect();
    const scrollerRect=scroller.getBoundingClientRect();
    const offset=nodeRect.top-scrollerRect.top;
    const target=scroller.scrollTop+offset-(scroller.clientHeight-nodeRect.height)/2;
    const maximum=Math.max(0,scroller.scrollHeight-scroller.clientHeight);
    const previousBehavior=scroller.style.scrollBehavior;
    scroller.style.scrollBehavior='auto';
    scroller.scrollTop=Math.max(0,Math.min(maximum,target));
    scroller.style.scrollBehavior=previousBehavior;
  }

  function scrollExactCardIntoView(cardId=requestedCardId()){
    const id=String(cardId||'').trim();
    if(!id)return false;
    const browsePanel=document.getElementById('browsePanel');
    const card=exactResultCard(id);
    if(!browsePanel||!card)return false;
    const scroller=scrollableAncestor(card,browsePanel);
    if(!scroller)return false;
    centerInScroller(card,scroller);
    scroller.dataset.deepLinkedCard=id;
    return true;
  }

  function scrollFromLocation(){
    const cardId=requestedCardId();
    if(!cardId)return false;
    return scrollExactCardIntoView(cardId);
  }

  window.RelphiTarotCardSelectionScroll=Object.freeze({scrollExactCardIntoView,scrollFromLocation});
})();
