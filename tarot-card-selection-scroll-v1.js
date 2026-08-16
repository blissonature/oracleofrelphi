// Keep an exact deep-linked Tarot card visible and visibly selected in the existing ordered results list.
(function(){
  'use strict';
  if(window.RelphiTarotCardSelectionScroll)return;

  const SELECTED_CLASS='relphi-selected-result-card';
  let selectedCardId='';

  function installSelectedStateStyle(){
    if(document.getElementById('relphi-tarot-selected-result-style'))return;
    const style=document.createElement('style');
    style.id='relphi-tarot-selected-result-style';
    style.textContent=`
      #cardList .${SELECTED_CLASS},
      #cardList [data-card-id].${SELECTED_CLASS}{
        outline:3px solid var(--relphi-red,#dc1f18);
        outline-offset:-3px;
        box-shadow:0 0 0 2px rgba(220,31,24,.16);
      }
    `;
    document.head.appendChild(style);
  }

  function requestedCardId(){
    return String(new URL(location.href).searchParams.get('card')||'').trim();
  }

  function cardIdFromNode(node){
    return String(node?.dataset?.id||node?.dataset?.cardId||'').trim();
  }

  function exactResultCard(cardId){
    const list=document.getElementById('cardList');
    if(!list||!cardId)return null;
    return Array.from(list.querySelectorAll('.or-card[data-id]')).find(node=>String(node.dataset.id||'')===cardId)
      ||Array.from(list.querySelectorAll('[data-card-id]')).find(node=>String(node.dataset.cardId||'')===cardId)
      ||null;
  }

  function markSelected(cardId){
    const id=String(cardId||'').trim();
    if(!id)return false;
    const list=document.getElementById('cardList');
    const card=exactResultCard(id);
    if(!list||!card)return false;
    installSelectedStateStyle();
    list.querySelectorAll(`.${SELECTED_CLASS},[aria-current="true"]`).forEach(node=>{
      if(node===card)return;
      node.classList.remove(SELECTED_CLASS);
      if(node.getAttribute('aria-current')==='true')node.removeAttribute('aria-current');
    });
    card.classList.add(SELECTED_CLASS);
    card.setAttribute('aria-current','true');
    selectedCardId=id;
    list.dataset.selectedCard=id;
    return true;
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
    markSelected(id);
    const scroller=scrollableAncestor(card,browsePanel);
    if(!scroller)return true;
    centerInScroller(card,scroller);
    scroller.dataset.deepLinkedCard=id;
    return true;
  }

  function scrollFromLocation(){
    const cardId=requestedCardId();
    if(!cardId)return false;
    return scrollExactCardIntoView(cardId);
  }

  // Any card subsequently opened from the canonical results list becomes the
  // selected card immediately; this is independent of the initial deep link.
  document.addEventListener('click',event=>{
    const card=event.target?.closest?.('#cardList .or-card[data-id],#cardList [data-card-id]');
    if(!card)return;
    const cardId=cardIdFromNode(card);
    if(cardId)markSelected(cardId);
  },true);

  // renderBrowse() may rebuild the list. Reapply the current exact selection
  // when that happens without changing order, filtering, or navigation.
  const observeList=()=>{
    const list=document.getElementById('cardList');
    if(!list||list.dataset.relphiSelectionObserver==='true')return;
    list.dataset.relphiSelectionObserver='true';
    new MutationObserver(()=>{
      const id=selectedCardId||requestedCardId();
      if(id)markSelected(id);
    }).observe(list,{childList:true,subtree:true});
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observeList,{once:true});
  else observeList();

  window.RelphiTarotCardSelectionScroll=Object.freeze({scrollExactCardIntoView,scrollFromLocation,markSelected});
})();
