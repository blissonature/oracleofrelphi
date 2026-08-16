// Tarot Ledger card deep link v8: use the real Ledger controls only; never commandeer the search field.
(function(){
'use strict';
const params=new URLSearchParams(location.search);
const tarotContext=/(^|\/)tarot\.html$/.test(location.pathname)||(window.__relphiTarotPreviewDocument===true&&params.get('view')==='tarot');
if(!tarotContext||window.__relphiTarotCardDeepLinkV8)return;
window.__relphiTarotCardDeepLinkV8=true;
window.__relphiTarotCardDeepLinkV7=true;
window.__relphiTarotCardDeepLinkV6=true;
window.__relphiTarotCardDeepLinkV5=true;
window.__relphiTarotCardDeepLinkV4=true;
window.__relphiTarotCardDeepLinkV3=true;
window.__relphiTarotCardDeepLinkV2=true;
window.__relphiTarotCardDeepLinkV1=true;

const CARD_ID=String(params.get('card')||'').trim();
let attempts=0,opened=false,timer=0,lastLedgerClickAt=0,lastCardClickAt=0;
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
  return card?.querySelector(`[data-card-id="${id}"]`)||list.querySelector(`[data-card-id="${id}"]`)||card||null;
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
  const now=Date.now();
  if(now-lastLedgerClickAt>300){
    const trigger=document.getElementById('showAllCards')||document.getElementById('landingShowLedger');
    if(trigger){
      lastLedgerClickAt=now;
      trigger.click();
    }
  }
  return ledgerReady();
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
  if(control&&now-lastCardClickAt>300){
    lastCardClickAt=now;
    control.click();
    if(finish())return;
  }
  attempts+=1;
  if(attempts<MAX_ATTEMPTS)schedule();
  else console.warn('[Oracle of Relphi] Tarot Ledger deep link could not confirm full card detail:',CARD_ID);
}
function start(){if(CARD_ID)schedule(0)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.addEventListener('load',()=>{if(!opened&&CARD_ID)schedule(0)},{once:true});
})();
