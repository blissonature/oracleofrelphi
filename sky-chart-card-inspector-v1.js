(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyCardInspectorV1)return;
window.__relphiSkyCardInspectorV1=true;

const OMIT=new Set(['card_id','id','name','title','stable_symbol_id','stable_symbol_kind']);
const LABELS={
  card_type:'Card type',
  thoth_suit:'Thoth suit',
  sign_ruler:'Sign ruler',
  decan_ruler:'Decan ruler',
  degree_span:'Degree span',
  zodiac_range:'Zodiac range',
  golden_dawn_rws:'Golden Dawn / RWS',
  letter_name:'Letter name'
};
let returnFocus=null;

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[ch]));

function cardId(card){
  return String(card?.card_id||card?.id||card?.stable_symbol_id||'').trim();
}
function cardName(card){
  return String(card?.name||card?.title||cardId(card)||'Tarot card').trim();
}
function cards(){
  return Array.isArray(window.RELPHI_TAROT_CARDS)?window.RELPHI_TAROT_CARDS:[];
}
function resolveCard(cardOrId){
  if(cardOrId&&typeof cardOrId==='object'){
    const id=cardId(cardOrId);
    return cards().find(card=>cardId(card)===id)||cardOrId;
  }
  const id=String(cardOrId||'').trim();
  return cards().find(card=>cardId(card)===id)||null;
}
function humanize(key){
  if(LABELS[key])return LABELS[key];
  return String(key||'')
    .replace(/_/g,' ')
    .replace(/([a-z])([A-Z])/g,'$1 $2')
    .replace(/\brws\b/ig,'RWS')
    .replace(/\b\w/g,ch=>ch.toUpperCase());
}
function hasValue(value){
  if(value===null||value===undefined||value==='')return false;
  if(Array.isArray(value))return value.some(hasValue);
  if(typeof value==='object')return Object.values(value).some(hasValue);
  return true;
}
function flatten(value,prefix=[],out=[]){
  if(!hasValue(value))return out;
  if(Array.isArray(value)){
    const simple=value.filter(hasValue);
    if(simple.every(item=>typeof item!=='object')){
      out.push([prefix.join(' · ')||'Values',simple.join(' · ')]);
      return out;
    }
    simple.forEach((item,index)=>flatten(item,[...prefix,String(index+1)],out));
    return out;
  }
  if(typeof value==='object'){
    Object.entries(value).forEach(([key,item])=>{
      if(hasValue(item))flatten(item,[...prefix,humanize(key)],out);
    });
    return out;
  }
  out.push([prefix.join(' · ')||'Value',String(value)]);
  return out;
}
function rowMarkup(label,value){
  return `<div class="sky-ledger-ingredient"><span class="sky-ledger-ingredient-label">${esc(label)}</span><div class="sky-ledger-progressive"><span class="sky-ledger-names">${esc(value)}</span></div></div>`;
}
function sectionMarkup(title,rows){
  if(!rows.length)return'';
  return `<section class="sky-ledger-section"><h3>${esc(title)}</h3>${rows.map(([label,value])=>rowMarkup(label,value)).join('')}</section>`;
}
function detailMarkup(card){
  const core=[];
  const sections=[];
  Object.entries(card||{}).forEach(([key,value])=>{
    if(OMIT.has(key)||!hasValue(value))return;
    if(value&&typeof value==='object'){
      const rows=flatten(value);
      if(rows.length)sections.push(sectionMarkup(humanize(key),rows));
      return;
    }
    core.push([humanize(key),String(value)]);
  });
  return `${sectionMarkup('Card',core)}${sections.join('')}`;
}
function artFor(card){
  const id=cardId(card);
  return id?`assets/tarot/rws/${encodeURIComponent(id)}.webp?v=border-preserving-crop-352`:'';
}
function closeDialog(dialog){
  if(!dialog)return;
  if(typeof dialog.close==='function'&&dialog.open)dialog.close();
  else dialog.removeAttribute('open');
}
function ensureDialog(){
  let dialog=document.getElementById('skyCardInspectorDialog');
  if(!dialog){
    dialog=document.createElement('dialog');
    dialog.id='skyCardInspectorDialog';
    dialog.className='sky-ledger-dialog';
    (document.getElementById('modals-root')||document.body).appendChild(dialog);
    dialog.addEventListener('cancel',event=>{
      event.preventDefault();
      closeDialog(dialog);
    });
    dialog.addEventListener('click',event=>{
      const close=event.target.closest?.('[data-close-ledger]');
      if(close){
        event.preventDefault();
        closeDialog(dialog);
        return;
      }
      if(event.target===dialog)closeDialog(dialog);
    });
    dialog.addEventListener('close',()=>{
      const target=returnFocus;
      returnFocus=null;
      if(target?.isConnected&&typeof target.focus==='function'){
        try{target.focus({preventScroll:true})}catch(_){target.focus()}
      }
    });
  }
  return dialog;
}
function openCard(cardOrId){
  const card=resolveCard(cardOrId);
  if(!card){
    console.warn('[Oracle of Relphi] Tarot Ledger card not found:',cardOrId);
    return false;
  }
  const id=cardId(card);
  if(!id)return false;
  const name=cardName(card);
  const image=artFor(card);
  const active=document.activeElement;
  if(active&&active!==document.body&&typeof active.focus==='function')returnFocus=active;

  const dialog=ensureDialog();
  dialog.innerHTML=`<div class="sky-ledger-shell"><header class="sky-ledger-header">${image?`<img src="${esc(image)}" alt="">`:''}<h2 id="skyCardInspectorTitle">${esc(name)}</h2><button type="button" data-close-ledger aria-label="Close ${esc(name)} card inspector">Close</button></header><div class="sky-ledger-body"><article class="sky-ledger-card" data-card-id="${esc(id)}" tabindex="-1" aria-labelledby="skyCardInspectorTitle">${detailMarkup(card)}</article></div></div>`;

  if(!dialog.open){
    if(typeof dialog.showModal==='function'){
      try{dialog.showModal()}catch(_){dialog.setAttribute('open','')}
    }else dialog.setAttribute('open','');
  }
  requestAnimationFrame(()=>{
    const cardNode=dialog.querySelector(`[data-card-id="${CSS.escape(id)}"]`);
    cardNode?.focus?.({preventScroll:true});
  });
  window.dispatchEvent(new CustomEvent('relphi:sky-card-inspector-opened',{detail:{cardId:id}}));
  return true;
}

window.RELPHI_OPEN_SKY_CARD_INSPECTOR=openCard;
window.addEventListener('relphi:open-ledger-card',event=>{
  openCard(event.detail?.cardId);
});
})();
