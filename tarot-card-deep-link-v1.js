// Tarot Ledger card deep link v7: wait until the real Ledger controls are live, then open the exact full card entry.
(function(){
'use strict';
const params=new URLSearchParams(location.search);
const tarotContext=/(^|\/)tarot\.html$/.test(location.pathname)||(window.__relphiTarotPreviewDocument===true&&params.get('view')==='tarot');
if(!tarotContext||window.__relphiTarotCardDeepLinkV7)return;
window.__relphiTarotCardDeepLinkV7=true;
window.__relphiTarotCardDeepLinkV6=true;
window.__relphiTarotCardDeepLinkV5=true;
window.__relphiTarotCardDeepLinkV4=true;
window.__relphiTarotCardDeepLinkV3=true;
window.__relphiTarotCardDeepLinkV2=true;
window.__relphiTarotCardDeepLinkV1=true;

const CARD_ID=String(params.get('card')||'').trim();
let attempts=0,opened=false,timer=0,lastLedgerClickAt=0,lastCardClickAt=0,fallbackUsed=false;
const MAX_ATTEMPTS=300;

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
function landOnDetail(){
  const detail=document.getElementById('cardDetail');
  if(!detail)return;
  const land=()=>detail.scrollIntoView?.({behavior:'auto',block:'start',inline:'nearest'});
  land();
  requestAnimationFrame(land);
  setTimeout(land,120);
  setTimeout(land,420);
}
function finish(){
  if(!detailMatches())return false;
  opened=true;
  document.getElementById('browsePanel')?.removeAttribute('hidden');
  landOnDetail();
  return true;
}
function targetControl(){
  const list=document.getElementById('cardList');
  if(!list)return null;
  const id=cssEscape(CARD_ID);
  const card=list.querySelector(`.or-card[data-id="${id}"]`);
  return card?.querySelector(`[data-card-id="${id}"]`)||list.querySelector(`[data-card-id="${id}"]`)||card||list.querySelector(`[data-id="${id}"]`);
}
function ledgerReady(){
  const browse=document.getElementById('browsePanel');
  const list=document.getElementById('cardList');
  return !!(browse&&list&&!browse.hidden&&list.children.length);
}
function prepareLedger(){
  if(ledgerReady())return true;
  const browse=document.getElementById('browsePanel');
  const list=document.getElementById('cardList');
  if(!browse||!list)return false;

  // navloader runs before tarot-app.js. A one-shot click can therefore happen
  // before Tarot Ledger has attached its handlers. Keep trying until the list
  // itself proves that the real Ledger controller is live.
  const now=Date.now();
  if(now-lastLedgerClickAt>280){
    const trigger=document.getElementById('showAllCards')||document.getElementById('landingShowLedger');
    if(trigger){
      lastLedgerClickAt=now;
      trigger.click();
    }
  }
  return ledgerReady();
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
function schedule(delay=50){
  if(opened||timer||!CARD_ID)return;
  timer=setTimeout(()=>{timer=0;seek()},delay);
}
function seek(){
  if(opened||!CARD_ID)return;
  if(finish())return;
  prepareLedger();
  const control=targetControl();
  const now=Date.now();
  if(control&&now-lastCardClickAt>280){
    lastCardClickAt=now;
    control.click();
    if(finish())return;
  }
  attempts+=1;
  if(attempts===160)useSearchFallback();
  if(attempts<MAX_ATTEMPTS)schedule();
  else console.warn('[Oracle of Relphi] Tarot Ledger deep link could not confirm full card detail:',CARD_ID);
}
function start(){if(CARD_ID)schedule(0)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.addEventListener('load',()=>{if(!opened&&CARD_ID)schedule(0)},{once:true});
})();
