// Tarot Ledger card deep link v1: route ?card=<card_id> through the Ledger's existing full-entry action.
(function(){
'use strict';
if(!/(^|\/)tarot\.html$/.test(location.pathname)||window.__relphiTarotCardDeepLinkV1)return;
window.__relphiTarotCardDeepLinkV1=true;

function requestedCard(){
  const id=new URLSearchParams(location.search).get('card');
  return String(id||'').trim();
}
function openRequestedCard(){
  const cardId=requestedCard();if(!cardId)return;
  const host=document.getElementById('chartOutput');if(!host)return;
  const proxy=document.createElement('button');
  proxy.type='button';proxy.hidden=true;proxy.dataset.cardId=cardId;
  proxy.setAttribute('aria-hidden','true');
  host.appendChild(proxy);
  proxy.click();
  proxy.remove();
}
function afterLedgerInit(){setTimeout(openRequestedCard,0)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',afterLedgerInit,{once:true});else afterLedgerInit();
})();