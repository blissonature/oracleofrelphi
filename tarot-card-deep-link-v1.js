// Tarot Ledger card deep link v6: open the requested card's full Ledger detail without a competing Ledger-entry scroll.
(function(){
'use strict';
const params=new URLSearchParams(location.search);
const tarotContext=/(^|\/)tarot\.html$/.test(location.pathname)||(window.__relphiTarotPreviewDocument===true&&params.get('view')==='tarot');
if(!tarotContext||window.__relphiTarotCardDeepLinkV6)return;
window.__relphiTarotCardDeepLinkV6=true;
window.__relphiTarotCardDeepLinkV5=true;
window.__relphiTarotCardDeepLinkV4=true;
window.__relphiTarotCardDeepLinkV3=true;
window.__relphiTarotCardDeepLinkV2=true;
window.__relphiTarotCardDeepLinkV1=true;

const CARD_ID=String(params.get('card')||'').trim();
let attempts=0,opened=false,timer=0,lastClickAt=0,fallbackUsed=false,ledgerPrepared=false;
const MAX_ATTEMPTS=200;

function normalize(value){return String(value||'').replace(/\s+/g,' ').trim().toLowerCase()}
function cssEscape(value){
  if(window.CSS?.escape)return CSS.escape(value);
  return String(value).replace(/["\\]/g,'\\$&');
}
function cardRecord(){
  return (Array.isArray(window.RELPHI_TAROT_CARDS)?window.RELPHI_TAROT_CARDS:[]).find(card=>card?.card_id===CARD_ID)||null;
}
function expectedNames(){
  const card=cardRecord();
  return [card?.name,card?.systems?.golden_dawn_rws?.display_name,card?.systems?.thoth?.display_name]
    .map(normalize).filter(Boolean);
}
function detailMatches(){
  const detail=document.getElementById('cardDetail');
  if(!detail||!detail.textContent.trim())return false;
  const names=expectedNames();
  if(!names.length)return false;
  const text=normalize(detail.textContent);
  return names.some(name=>text.includes(name));
}
function finish(){
  const detail=document.getElementById('cardDetail');
  if(!detail||!detailMatches())return false;
  opened=true;
  document.getElementById('browsePanel')?.removeAttribute('hidden');
  const land=()=>detail.scrollIntoView?.({behavior:'auto',block:'start',inline:'nearest'});
  requestAnimationFrame(()=>{land();setTimeout(land,120)});
  return true;
}
function targetControl(){
  const list=document.getElementById('cardList');
  if(!list)return null;
  const id=cssEscape(CARD_ID);
  return list.querySelector(`[data-card-id="${id}"]`)||list.querySelector(`.or-card[data-id="${id}"]`)||list.querySelector(`[data-id="${id}"]`);
}
function prepareLedger(){
  if(ledgerPrepared)return;
  const browse=document.getElementById('browsePanel');
  const list=document.getElementById('cardList');
  if(!browse||!list)return;

  // Prefer the ordinary Show All control. It renders the complete Ledger without
  // starting the landing page's smooth scroll back to the top of browsePanel.
  const showAll=document.getElementById('showAllCards');
  if(showAll){
    showAll.click();
    ledgerPrepared=true;
    return;
  }

  const landing=document.getElementById('landingShowLedger');
  if(landing){
    landing.click();
    ledgerPrepared=true;
  }
}
function useSearchFallback(){
  if(fallbackUsed)return;
  const card=cardRecord(),command=document.getElementById('oracleCommand'),run=document.getElementById('runCommand');
  if(!card||!command||!run)return;
  fallbackUsed=true;
  command.value=card.name||CARD_ID;
  command.dispatchEvent(new Event('input',{bubbles:true}));
  run.click();
}
function schedule(delay=40){
  if(opened||timer||!CARD_ID)return;
  timer=setTimeout(()=>{timer=0;seek()},delay);
}
function seek(){
  if(opened||!CARD_ID)return;
  if(finish())return;
  prepareLedger();
  const control=targetControl();
  const now=Date.now();
  if(control&&now-lastClickAt>240){
    lastClickAt=now;
    control.click();
  }
  attempts+=1;
  if(attempts===75)useSearchFallback();
  if(attempts<MAX_ATTEMPTS)schedule();
  else console.warn('[Oracle of Relphi] Tarot Ledger deep link could not confirm full card detail:',CARD_ID);
}
function start(){if(CARD_ID)schedule(0)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.addEventListener('load',()=>{if(!opened&&CARD_ID)schedule(0)},{once:true});
})();