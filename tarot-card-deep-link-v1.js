// Tarot Ledger card deep link v9: open the requested card and make its full Ledger entry the visible destination.
(function(){
'use strict';
const params=new URLSearchParams(location.search);
const tarotContext=/(^|\/)tarot\.html$/.test(location.pathname)||(window.__relphiTarotPreviewDocument===true&&params.get('view')==='tarot');
if(!tarotContext||window.__relphiTarotCardDeepLinkV9)return;
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
function installFocusedEntryStyle(){
  if(document.getElementById('relphi-deep-linked-card-style'))return;
  const style=document.createElement('style');
  style.id='relphi-deep-linked-card-style';
  style.textContent=[
    'body.relphi-deep-linked-card .tarot-entry-panel,',
    'body.relphi-deep-linked-card .tarot-mode-bar,',
    'body.relphi-deep-linked-card .tarot-command-panel,',
    'body.relphi-deep-linked-card #tarotSummary,',
    'body.relphi-deep-linked-card #visibilityPanel,',
    'body.relphi-deep-linked-card #browsePanel>.tarot-list-panel{display:none!important}',
    'body.relphi-deep-linked-card #browsePanel{display:block!important}',
    'body.relphi-deep-linked-card #cardDetail{display:block!important;max-width:72rem;margin:0 auto!important}'
  ].join('');
  document.head.appendChild(style);
}
function landOnDetail(){
  const detail=document.getElementById('cardDetail');
  if(!detail)return;
  const land=()=>{
    detail.scrollIntoView?.({behavior:'auto',block:'start',inline:'nearest'});
    if(window.scrollY>4)window.scrollTo({top:Math.max(0,detail.getBoundingClientRect().top+window.scrollY-12),behavior:'auto'});
  };
  land();
  requestAnimationFrame(land);
  setTimeout(land,120);
  setTimeout(land,420);
}
function finish(){
  if(!detailMatches())return false;
  opened=true;
  document.getElementById('browsePanel')?.removeAttribute('hidden');
  installFocusedEntryStyle();
  document.body?.classList.add('relphi-deep-linked-card');
  landOnDetail();
  return true;
}
function targetCard(){
  const list=document.getElementById('cardList');
  if(!list)return null;
  const id=cssEscape(CARD_ID);
  return list.querySelector(`.or-card[data-id="${id}"]`);
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
  const card=targetCard();
  const now=Date.now();
  if(card&&now-lastCardClickAt>300){
    lastCardClickAt=now;
    // Click the card surface itself. Tarot Ledger's delegated result handler
    // treats that as an ordinary request for this card's full detail entry.
    card.click();
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
