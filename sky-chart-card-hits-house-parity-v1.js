// Card Hits Houses parity: compact ledger styling plus temporary wheel isolation on hover/focus.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyCardHitsHouseParityV1)return;
window.__relphiSkyCardHitsHouseParityV1=true;

const STYLE_ID='skyCardHitsHouseParityV1Styles';
const ROW='.sky-card-hits-structure .sky-card-house-row[data-house-number]';
let pointerPreview=null,focusPreview=null;

function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');style.id=STYLE_ID;
  style.textContent=`
    /* Houses should read as the sibling ledger to Placements, not as a separate visual system. */
    .sky-card-hits-structure:has(.sky-card-houses){gap:.7rem!important}
    .sky-card-houses{
      display:grid!important;gap:0!important;min-width:0!important;
      border:1px solid rgba(31,27,24,.11)!important;border-radius:.72rem!important;
      background:#fffdfa!important;overflow:hidden!important
    }
    .sky-card-house-row,
    .sky-card-house-row[data-ruler-spans-enhanced="true"]{
      display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:0!important;
      min-width:0!important;margin:0!important;padding:0!important;
      border:0!important;border-bottom:1px solid rgba(31,27,24,.075)!important;
      border-radius:0!important;background:#fffdfa!important;overflow:hidden!important
    }
    .sky-card-house-row:last-child{border-bottom:0!important}
    .sky-card-house-toggle{
      appearance:none!important;display:grid!important;
      grid-template-columns:20px minmax(0,1fr) 54px!important;align-items:center!important;
      gap:7px!important;width:100%!important;min-height:32px!important;
      margin:0!important;padding:4px 10px!important;border:0!important;border-radius:0!important;
      background:#fffdfa!important;color:#211d19!important;cursor:pointer!important;text-align:left!important
    }
    .sky-card-house-toggle:hover,
    .sky-card-house-toggle:focus-visible,
    .sky-card-house-row.is-card-house-preview>.sky-card-house-toggle{
      background:#f8f3ed!important;outline:none!important
    }
    .sky-card-house-row.is-card-house-preview>.sky-card-house-toggle{
      box-shadow:inset 3px 0 0 var(--sky-house-unit-color,var(--slot-color,#777))!important
    }
    .sky-card-house-toggle[aria-expanded="true"]{border-bottom:1px solid rgba(31,27,24,.075)!important}
    .sky-card-house-toggle>.relphi-house-medallion{
      display:grid!important;place-items:center!important;justify-self:start!important;
      flex:0 0 18px!important;width:18px!important;height:18px!important;min-width:18px!important;min-height:18px!important;
      margin:0!important;font-size:.58rem!important;line-height:18px!important
    }
    .sky-card-house-toggle-range{
      display:flex!important;align-items:center!important;gap:.12rem!important;min-width:0!important;
      overflow:hidden!important;color:#5d554e!important;
      font:650 .67rem/1.2 system-ui,sans-serif!important;font-variant-numeric:tabular-nums!important;
      white-space:nowrap!important
    }
    .sky-card-house-toggle-range-text{white-space:nowrap!important}
    .sky-card-house-toggle-arrow{margin:0 .02rem!important;opacity:.56!important}
    .sky-card-house-toggle-glyph{
      display:inline-block!important;flex:0 0 21px!important;width:21px!important;height:21px!important;
      margin:0!important;vertical-align:middle!important
    }
    .sky-card-house-toggle-glyph svg{display:block!important;width:100%!important;height:100%!important;overflow:visible!important}
    .sky-card-house-hit-count{align-self:center!important;margin:0!important}
    .sky-card-house-detail{border-radius:0!important}
    @media(max-width:520px){
      .sky-card-house-toggle{grid-template-columns:19px minmax(0,1fr) 48px!important;gap:6px!important;min-height:32px!important;padding:4px 9px!important}
      .sky-card-house-toggle>.relphi-house-medallion{flex-basis:17px!important;width:17px!important;height:17px!important;min-width:17px!important;min-height:17px!important}
      .sky-card-house-toggle-range{font-size:.65rem!important;gap:.1rem!important}
      .sky-card-house-toggle-glyph{flex-basis:20px!important;width:20px!important;height:20px!important}
      .sky-card-house-hit-count{transform:scale(.92);transform-origin:right center}
    }
  `;
  document.head.appendChild(style);
}

function houseTarget(row){
  if(!row)return null;
  const root=row.closest('.sky-card-hits-structure'),slot=String(root?.dataset.cardHitsStructureSlot||''),house=String(row.dataset.houseNumber||'');
  if(!slot||!house)return null;
  return document.querySelector(`#skyFoundationWheelMount [data-interactive="house"][data-sky="${slot}"][data-house="${house}"]`)
    ||document.querySelector(`#skyFoundationWheelMount [data-focus-piece="house"][data-sky="${slot}"][data-house="${house}"]`);
}
function dispatchPreview(row,type,entering){
  const target=houseTarget(row);if(!target)return false;
  try{
    if(type==='focus'){
      const eventName=entering?'focusin':'focusout';
      target.dispatchEvent(new FocusEvent(eventName,{bubbles:true,composed:true,relatedTarget:null}));
    }else{
      const eventName=entering?'pointerover':'pointerout';
      target.dispatchEvent(new PointerEvent(eventName,{bubbles:true,composed:true,relatedTarget:null,pointerType:'mouse'}));
    }
    return true;
  }catch(_){
    const eventName=type==='focus'?(entering?'focusin':'focusout'):(entering?'pointerover':'pointerout');
    target.dispatchEvent(new Event(eventName,{bubbles:true,composed:true}));return true;
  }
}
function begin(row,type){
  if(!row)return;
  row.classList.add('is-card-house-preview');
  dispatchPreview(row,type,true);
  if(type==='focus')focusPreview=row;else pointerPreview=row;
}
function end(row,type){
  if(!row)return;
  dispatchPreview(row,type,false);
  if(type==='focus'){if(focusPreview===row)focusPreview=null}else if(pointerPreview===row)pointerPreview=null;
  if(row!==pointerPreview&&row!==focusPreview)row.classList.remove('is-card-house-preview');
}
function rowFrom(event){return event.target.closest?.(ROW)||null}
function bind(){
  installStyles();
  document.addEventListener('pointerover',event=>{const row=rowFrom(event);if(!row||row.contains(event.relatedTarget))return;if(pointerPreview&&pointerPreview!==row)end(pointerPreview,'pointer');begin(row,'pointer')},true);
  document.addEventListener('pointerout',event=>{const row=rowFrom(event);if(!row||row.contains(event.relatedTarget))return;end(row,'pointer')},true);
  document.addEventListener('focusin',event=>{const row=rowFrom(event);if(!row||row.contains(event.relatedTarget))return;if(focusPreview&&focusPreview!==row)end(focusPreview,'focus');begin(row,'focus')},true);
  document.addEventListener('focusout',event=>{const row=rowFrom(event);if(!row||row.contains(event.relatedTarget))return;end(row,'focus')},true);
  window.addEventListener('relphi:sky-foundation-interactions-ready',()=>{
    if(pointerPreview?.matches(':hover'))dispatchPreview(pointerPreview,'pointer',true);
    if(focusPreview?.contains(document.activeElement))dispatchPreview(focusPreview,'focus',true);
  });
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bind,{once:true}):bind();
})();
