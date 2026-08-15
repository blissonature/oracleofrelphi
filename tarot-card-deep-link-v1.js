// Tarot Ledger card deep link v4: wait for the real Ledger browse UI, then open ?card=<card_id>.
(function(){
'use strict';
const params=new URLSearchParams(location.search);
const tarotContext=/(^|\/)tarot\.html$/.test(location.pathname)||(window.__relphiTarotPreviewDocument===true&&params.get('view')==='tarot');
if(!tarotContext||window.__relphiTarotCardDeepLinkV4)return;
window.__relphiTarotCardDeepLinkV4=true;
window.__relphiTarotCardDeepLinkV3=true;
window.__relphiTarotCardDeepLinkV2=true;
window.__relphiTarotCardDeepLinkV1=true;

const CARD_ID=String(params.get('card')||'').trim();
let attempts=0,opened=false,timer=0;
const MAX_ATTEMPTS=100;

function cardSelector(cardId){
  if(window.CSS?.escape)return `.or-card[data-id="${CSS.escape(cardId)}"]`;
  return `.or-card[data-id="${cardId.replace(/["\\]/g,'\\$&')}"]`;
}
function schedule(delay=40){
  if(opened||timer||!CARD_ID)return;
  timer=setTimeout(()=>{timer=0;seek()},delay);
}
function seek(){
  if(opened||!CARD_ID)return;
  const card=document.querySelector(cardSelector(CARD_ID));
  if(card){
    opened=true;
    card.click();
    requestAnimationFrame(()=>card.scrollIntoView?.({block:'nearest',inline:'nearest'}));
    return;
  }
  const browse=document.getElementById('browsePanel');
  const cardList=document.getElementById('cardList');
  const trigger=document.getElementById('landingShowLedger')||document.getElementById('showAllCards');
  if(trigger&&(browse?.hidden||!cardList?.children?.length))trigger.click();
  attempts+=1;
  if(attempts<MAX_ATTEMPTS)schedule();
  else console.warn('[Oracle of Relphi] Tarot Ledger deep link could not open card:',CARD_ID);
}
function start(){if(CARD_ID)schedule(0)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.addEventListener('load',()=>{if(!opened&&CARD_ID)schedule(0)},{once:true});
})();