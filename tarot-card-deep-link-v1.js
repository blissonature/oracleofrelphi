// Tarot Ledger card deep link v2: route ?card=<card_id> through the Ledger's real browse/full-entry UI.
(function(){
'use strict';
if(!/(^|\/)tarot\.html$/.test(location.pathname)||window.__relphiTarotCardDeepLinkV2)return;
window.__relphiTarotCardDeepLinkV2=true;
window.__relphiTarotCardDeepLinkV1=true;

function requestedCard(){
  return String(new URLSearchParams(location.search).get('card')||'').trim();
}
function cardSelector(cardId){
  if(window.CSS?.escape)return `.or-card[data-id="${CSS.escape(cardId)}"]`;
  return `.or-card[data-id="${cardId.replace(/["\\]/g,'\\$&')}"]`;
}
function openRequestedCard(){
  const cardId=requestedCard();if(!cardId)return;
  const browse=document.getElementById('browsePanel'),landing=document.getElementById('landingShowLedger'),showAll=document.getElementById('showAllCards');
  if(!browse||(!landing&&!showAll))return;
  const trigger=landing||showAll;
  trigger.click();
  let attempts=0;
  const seek=()=>{
    const card=document.querySelector(cardSelector(cardId));
    if(card){card.click();return}
    if(++attempts<12)requestAnimationFrame(seek);
  };
  requestAnimationFrame(seek);
}
function afterLedgerInit(){requestAnimationFrame(openRequestedCard)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',afterLedgerInit,{once:true});else afterLedgerInit();
})();