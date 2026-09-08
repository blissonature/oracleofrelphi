// Tarot Ledger card deep link v10: open the requested card inside the ordinary Ledger UI.
(function(){
'use strict';
const params=new URLSearchParams(location.search);
const tarotContext=/(^|\/)tarot\.html$/.test(location.pathname)||(window.__relphiTarotPreviewDocument===true&&params.get('view')==='tarot');
if(!tarotContext||window.__relphiTarotCardDeepLinkV10)return;
window.__relphiTarotCardDeepLinkV10=true;
window.__relphiTarotCardDeepLinkV9=true;
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
function restoreCanonicalLedgerChrome(){
  document.getElementById('relphi-deep-linked-card-style')?.remove();
  document.body?.classList.remove('relphi-deep-linked-card');
}
function collapseDrawingBoard(){
  const panel=document.getElementById('shortListPanel');
  if(panel){
    panel.hidden=true;
    panel.setAttribute('hidden','');
    const drawer=panel.querySelector('.card-row-drawing-board,details.short-list-drawer');
    if(drawer?.tagName==='DETAILS')drawer.open=false;
  }
  const trigger=document.getElementById('relphiOpenDrawingBoardCurrent');
  if(trigger){
    trigger.setAttribute('aria-expanded','false');
    trigger.textContent='Open Drawing Board';
  }
}
function keepCanonicalArrival(){
  restoreCanonicalLedgerChrome();
  collapseDrawingBoard();
  document.getElementById('browsePanel')?.removeAttribute('hidden');
}
function settleLedgerViewport(){
  const settle=()=>{
    restoreCanonicalLedgerChrome();
    collapseDrawingBoard();
    window.RelphiTarotCardSelectionScroll?.scrollExactCardIntoView?.(CARD_ID);
    window.scrollTo({top:0,left:0,behavior:'auto'});
  };
  requestAnimationFrame(()=>requestAnimationFrame(settle));
  setTimeout(settle,120);
}
function finish(){
  if(!detailMatches())return false;
  opened=true;
  keepCanonicalArrival();
  settleLedgerViewport();
  return true;
}
function targetCard(){
  const list=document.getElementById('cardList');
  if(!list)return null;
  const id=cssEscape(CARD_ID);
  return list.querySelector(`.or-card[data-id="${id}"]`)||list.querySelector(`[data-card-id="${id}"]`);
}
function ledgerReady(){
  const browse=document.getElementById('browsePanel');
  const list=document.getElementById('cardList');
  return !!(browse&&list&&!browse.hidden&&list.children.length);
}
function prepareLedger(){
  keepCanonicalArrival();
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
      collapseDrawingBoard();
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
  const card=targetCard();
  const now=Date.now();
  if(card&&now-lastCardClickAt>300){
    lastCardClickAt=now;
    // Use the ordinary Ledger result interaction so a Sky Chart handoff opens
    // exactly the same full entry a person would get by selecting the card here.
    card.click();
    collapseDrawingBoard();
    if(finish())return;
  }
  attempts+=1;
  if(attempts<MAX_ATTEMPTS)schedule();
  else console.warn('[Oracle of Relphi] Tarot Ledger deep link could not confirm full card detail:',CARD_ID);
}
function start(){
  if(!CARD_ID)return;
  keepCanonicalArrival();
  schedule(0);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.addEventListener('load',()=>{
  if(!CARD_ID)return;
  // tarot-app restores saved Drawing Board contents just after load. Preserve the
  // contents, but keep the Board closed on a fresh Ledger arrival.
  setTimeout(()=>{
    keepCanonicalArrival();
    if(!opened)schedule(0);
  },0);
},{once:true});
})();
