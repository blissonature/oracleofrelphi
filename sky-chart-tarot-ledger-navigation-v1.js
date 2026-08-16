// Sky Chart side of the Tarot Ledger addressability contract: transmit one canonical card ID.
(function(){
  'use strict';
  if(window.RelphiTarotLedgerNavigation)return;
  function cardId(value){return String(value||'').trim()}
  function hrefForCard(value){
    const id=cardId(value);
    if(!id)throw new TypeError('A Tarot card ID is required.');
    const current=new URL(location.href),ref=current.searchParams.get('ref');
    if(/(^|\/)sky-chart-preview\/sky-chart\.html$/.test(current.pathname)&&/^[0-9a-f]{40}$/i.test(ref||'')){
      current.search='';current.hash='';
      current.searchParams.set('ref',ref);
      current.searchParams.set('view','tarot');
      current.searchParams.set('card',id);
      return current.toString();
    }
    const target=new URL('tarot.html',current);
    target.searchParams.set('card',id);
    return target.toString();
  }
  function openCard(value){location.assign(hrefForCard(value))}
  window.RelphiTarotLedgerNavigation=Object.freeze({hrefForCard,openCard});
})();
