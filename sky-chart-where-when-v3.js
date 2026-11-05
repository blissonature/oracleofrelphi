// Where and When source owner. Final markup, transaction state, and commit lifecycle live here.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyWhereWhenV3)return;
window.__relphiSkyWhereWhenV3=true;
window.__relphiSkyWhereWhenV2=true;
window.__relphiSkyWhereWhenV1=true;

const SLOT_KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const SHARED_HOUSE_KEY='relphiSkySharedHouseSystemV1';
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const BODIES=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const CHALDEAN=['saturn','jupiter','mars','sun','venus','mercury','moon'];
const WEEK_PATH=['sun','moon','mars','mercury','jupiter','venus','saturn','sun'];
const WEEKDAY_RULERS={1:'moon',2:'mars',3:'mercury',4:'jupiter',5:'venus',6:'saturn',7:'sun'};
const PLANETS={saturn:{color:'#8c7a42'},jupiter:{color:'#41752f'},mars:{color:'#c9211e'},sun:{color:'#d08a00'},venus:{color:'#b23b79'},mercury:{color:'#277390'},moon:{color:'#58628a'}};
const INFERENCE_MARKER='Inferred from pasted placements';
const cardState={A:{selected:null,busy:false,summarySignature:'',rendering:false,rerender:false},B:{selected:null,busy:false,summarySignature:'',rendering:false,rerender:false}};
const transactionState={editing:new Set(),committed:new Set()};

function installStyles(){
  if(document.getElementById('skyWhereWhenV3OwnedStyles'))return;
  const style=document.createElement('style');
  style.id='skyWhereWhenV3OwnedStyles';
  style.textContent=`
    .sky-where-when-editor{display:grid;grid-template-rows:minmax(0,1fr) auto;min-height:0}
    .sky-where-when-scroll-body{min-height:0;overflow:auto;padding-bottom:.2rem}
    .sky-where-when-here-now-row{display:flex;align-items:center;padding:.62rem .62rem .18rem}
    .sky-where-when-here-now{border-radius:999px}
    [data-ww-when] .sky-where-when-now-row{display:flex;align-items:center;justify-content:space-between;gap:.45rem}
    [data-ww-when] .sky-where-when-grid{gap:.42rem}
    [data-ww-when] .sky-where-when-grid[hidden]{display:none!important}
    .sky-ww-time-basis{display:flex;gap:.35rem;align-items:center;margin:0 0 .45rem;flex-wrap:wrap}
    .sky-ww-time-basis-label{font:750 .64rem/1.2 system-ui,sans-serif;color:#514941;margin-right:.1rem}
    .sky-ww-time-basis-option{display:inline-flex;align-items:center;gap:.23rem;padding:.3rem .45rem;border:1px solid rgba(31,27,24,.18);border-radius:999px;font:750 .64rem/1 system-ui,sans-serif;cursor:pointer}
    .sky-ww-time-basis-option:has(input:checked){background:#fff0ed;border-color:#c9211e;color:#a51f1b}
    .sky-ww-time-basis-option input{margin:0;accent-color:#c9211e}
    .sky-ww-time-basis-option:has(input:disabled){opacity:.45;cursor:not-allowed}
    .sky-ww-time-equivalent{margin:.4rem 0 0;color:#514941;font:650 .65rem/1.35 system-ui,sans-serif}
    .sky-ww-time-equivalent[hidden]{display:none!important}
    .sky-ww-utc-grid [data-ww-field="utc-date"],.sky-ww-utc-grid [data-ww-field="utc-time"]{min-height:40px;font-variant-numeric:tabular-nums}
    [data-ww-when] .sky-where-when-input{min-width:0;width:100%;box-sizing:border-box}
    .sky-time-unknown-option{display:inline-flex;align-items:center;gap:.32rem;white-space:nowrap;color:#4f4842;font:800 .62rem/1 system-ui,sans-serif;cursor:pointer}
    .sky-time-unknown-option input{margin:0}
    [data-ww-field="time"]:disabled{opacity:.48;background:#eeeae4;color:#8b837c;cursor:not-allowed}
    .sky-where-search-label-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.45rem;align-items:center}
    .sky-where-search-label-row .sky-where-when-label{display:block}
    .sky-use-here-button{padding:.42rem .68rem;font-size:.62rem}
    .sky-inferred-location-value{font-weight:800}
    .sky-where-when-footer{position:relative;display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:auto auto!important;gap:.5rem!important;width:100%;padding:.45rem .62rem .62rem!important;box-sizing:border-box;background:#fffdf8;border-top:1px solid rgba(31,27,24,.12);z-index:2}
    .sky-where-when-footer .sky-where-when-footer-actions{display:grid!important;grid-template-columns:minmax(62px,.78fr) minmax(0,2.22fr)!important;gap:.3rem!important;width:100%;align-items:center}
    .sky-where-when-footer-actions .sky-where-when-button{width:100%;min-width:0;margin:0}
    .sky-where-when-one-click{display:flex;align-items:center;justify-content:center;gap:.4rem;min-height:34px;width:100%;margin:0 0 4px;font-size:.72rem;font-weight:700}
    .sky-where-when-one-click svg{width:16px;height:16px;flex:none}
    .sky-ph-handoff-dialog{width:min(680px,calc(100vw - 2rem));max-width:680px;border:2px solid #dc1f18;border-radius:1.3rem;padding:0;background:#fffdf8;color:#1f1b18;box-shadow:0 24px 70px rgba(0,0,0,.28)}
    .sky-ph-handoff-dialog::backdrop{background:rgba(17,14,12,.48);backdrop-filter:blur(2px)}
    .sky-ph-handoff-inner{padding:1.2rem;display:grid;gap:1rem}
    .sky-ph-handoff-inner h2{margin:0;text-align:center;font-size:1.35rem}
    .sky-ph-handoff-inner>p{margin:0;text-align:center;color:#5d554f}
    .sky-ph-handoff-slots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem}
    .sky-ph-handoff-slot{appearance:none;width:100%;min-width:0;text-align:left;border:1px solid rgba(31,27,24,.18);border-radius:1rem;background:#fff;padding:.9rem;display:grid;gap:.28rem;cursor:pointer;color:inherit}
    .sky-ph-handoff-slot:hover,.sky-ph-handoff-slot:focus-visible{border-color:#dc1f18;box-shadow:0 0 0 3px rgba(220,31,24,.1);outline:none}
    .sky-ph-handoff-action{font-size:.75rem;font-weight:850;letter-spacing:.05em;text-transform:uppercase;color:#dc1f18}
    .sky-ph-handoff-name{font-size:1rem;line-height:1.25}
    .sky-ph-handoff-meta{font-size:.82rem;line-height:1.35;color:#6a625c;overflow-wrap:anywhere}
    .sky-ph-handoff-slot.is-empty{border-style:dashed;background:#fffdfa}
    .sky-ph-handoff-actions{display:flex;justify-content:center;gap:.65rem;flex-wrap:wrap}
    .sky-ph-handoff-clear,.sky-ph-handoff-cancel{border-radius:999px;padding:.68rem 1rem;font:inherit;font-weight:750;cursor:pointer}
    .sky-ph-handoff-clear{background:#fff;color:#dc1f18;border:1px solid #dc1f18}
    .sky-ph-handoff-cancel{background:#fff;color:#333;border:1px solid rgba(31,27,24,.22)}
    @media(max-width:620px){.sky-where-when-here-now-row{padding:.55rem .55rem .14rem}.sky-where-when-footer{padding:.42rem .55rem .55rem!important}.sky-ph-handoff-slots{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}
function readJson(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(_){return fallback}}
function writeJson(key,value){localStorage.setItem(key,JSON.stringify(value))}
function payload(slot){return readJson(SLOT_KEYS[slot],null)}
function profileFor(slot){const value=payload(slot);return window.RelphiSkyCardShell?.profile?.(value)||(value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{})}
function completeProfile(p){return!!(p&&(p.instant||p.dateTime)&&p.location&&p.timeZone&&Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude)))}
function panel(slot){return document.getElementById(`skyFoundation${slot}`)}
function shell(slot){return window.RelphiSkyCardShell?.ensure?.(slot,payload(slot))||null}
function formFor(slot){return shell(slot)?.editor?.querySelector('.sky-where-when-editor')||null}
function eventSlot(target){return target?.closest('#skyFoundationA')?'A':target?.closest('#skyFoundationB')?'B':null}
function escapeHtml(value){return String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))}
function norm(value){return((Number(value)%360)+360)%360}
function displayCoordinate(value){return Number.isFinite(Number(value))?Number(value).toFixed(5):''}
function status(slot,message,error=false){const node=panel(slot)?.querySelector('.sky-where-when-status');if(!node)return;node.textContent=message||'';node.classList.toggle('is-error',!!error)}
function setBusy(slot,busy){cardState[slot].busy=!!busy;const editor=formFor(slot);if(!editor)return;editor.querySelectorAll('button,input,select,textarea').forEach(node=>{if(node.classList.contains('sky-where-when-cancel'))return;node.disabled=!!busy})}

function publishTransactionState(){
  const slots=[...transactionState.editing].sort();
  document.documentElement.dataset.skyWhereWhenEditing=slots.length?'true':'false';
  document.documentElement.dataset.skyWhereWhenEditingSlots=slots.join(',');
  window.dispatchEvent(new CustomEvent('relphi:sky-where-when-edit-state-changed',{detail:{active:slots.length>0,slots}}));
}
function beginWhereWhen(slot){if(!SLOT_KEYS[slot]||transactionState.editing.has(slot))return;transactionState.editing.add(slot);publishTransactionState()}
function finishWhereWhen(slot,committed){
  if(!SLOT_KEYS[slot])return;
  if(committed)transactionState.committed.add(slot);
  transactionState.editing.delete(slot);
  publishTransactionState();
  if(transactionState.editing.size||!transactionState.committed.size)return;
  const slots=[...transactionState.committed].sort();
  transactionState.committed.clear();
  window.dispatchEvent(new CustomEvent('relphi:sky-where-when-committed',{detail:{slots}}));
}
function reconcileWhereWhenTransaction(){
  [...transactionState.editing].forEach(slot=>{
    const editor=document.querySelector(`.sky-where-when-editor[data-slot="${slot}"]`),mount=editor?.closest?.('[data-ww-editor-mount]');
    if(!editor?.isConnected||mount?.hidden)transactionState.editing.delete(slot);
  });
  publishTransactionState();
}
window.RelphiSkyWhereWhenTransaction=Object.freeze({begin:beginWhereWhen,commit:slot=>finishWhereWhen(slot,true),cancel:slot=>finishWhereWhen(slot,false),active:()=>transactionState.editing.size>0,slots:()=>[...transactionState.editing],reconcile:reconcileWhereWhenTransaction});

function selectedSource(slot,p){
  const metadata=payload(slot)?.metadata||{},source=String(metadata.whereWhenSource||p.whereWhenSource||'').trim();
  if(source==='placement-inference'||p.locationQuery===INFERENCE_MARKER)return'placement-inference';
  return source||'saved';
}
function currentSelection(slot,p){
  if(!completeProfile(p))return null;
  const source=selectedSource(slot,p);
  return{source,query:source==='placement-inference'?'':String(p.locationQuery||p.location||''),canonical:p.location,latitude:Number(p.latitude),longitude:Number(p.longitude),timezone:p.timeZone};
}
function confirmationMarkup(selected){
  if(!selected)return'<div class="sky-location-confirmation" hidden></div>';
  if(selected.source==='placement-inference')return`<div class="sky-location-confirmation" data-location-source="placement-inference"><p><strong>Location inferred from pasted placements</strong></p><p class="sky-inferred-location-value">${escapeHtml(selected.canonical)}</p></div>`;
  return`<div class="sky-location-confirmation" data-location-source="${escapeHtml(selected.source||'search')}"><p><strong>You searched:</strong> ${escapeHtml(selected.query||selected.canonical)}</p><p><strong>Location found:</strong> ${escapeHtml(selected.canonical)}</p></div>`;
}
function editorMarkup(slot,p){
  const selected=currentSelection(slot,p);
  cardState[slot].selected=selected;
  const dateTime=String(p.dateTime||''),date=dateTime.slice(0,10),time=dateTime.slice(11,16),disabled=selected?'':' disabled';
  const savedMetadata=payload(slot)?.metadata||{};
  const here=selected?.source==='current-location',now=!p.timeUnknown&&(savedMetadata.liveNowOrigin==='use-now'||!!savedMetadata.capturedNowAt);
  const moment=now?String(savedMetadata.capturedNowAt||savedMetadata.liveNowAt||p.instant||''):'';
  const nowMoment=Number.isFinite(Date.parse(moment))?moment:'';
  return `<form class="sky-where-when-editor" data-slot="${slot}" data-now-instant="${escapeHtml(nowMoment)}">
    <div class="sky-where-when-scroll-body">
      <button class="sky-where-when-button secondary sky-where-when-one-click" type="button" data-ww-action="here-and-now"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5M18 10A7 7 0 0 0 6 7L4 9M6 14a7 7 0 0 0 12 3l2-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>1-Click Here and Now</span></button>
      <fieldset class="sky-where-when-section sky-where-when-mode" data-ww-where><legend>Where</legend>
        <div class="sky-ww-mode-row"><span class="sky-ww-mode-primary"><label class="sky-ww-choice"><input data-ww-field="here" type="checkbox"${here?' checked':''}><span>Here</span></label><button class="sky-ww-refresh" type="button" data-ww-action="refresh-here" aria-label="Refresh current location" title="Refresh current location"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5M18 10A7 7 0 0 0 6 7L4 9M6 14a7 7 0 0 0 12 3l2-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></span></div>
        <p class="sky-ww-mode-value" data-ww-here-value${here?'':' hidden'}>${escapeHtml(here?selected.canonical:'')}</p>
        <div class="sky-ww-manual" data-ww-manual-where${here?' hidden':''}><label class="sky-where-when-label" for="skyWhereLocation${slot}">Search for a location</label><div class="sky-where-search-row"><input id="skyWhereLocation${slot}" class="sky-where-when-input${selected?.source==='current-location'?' is-current-location':''}" data-ww-field="location-query" type="search" autocomplete="off" value="${escapeHtml(selected?.source==='current-location'?'':selected?.query||'')}" placeholder="Ex. City, State or Country"><button class="sky-where-when-button secondary" type="button" data-ww-action="search-location">Search</button></div><div class="sky-location-results" aria-live="polite"></div>${confirmationMarkup(selected)}</div>
      </fieldset>
      <fieldset class="sky-where-when-section sky-where-when-mode" data-ww-when><legend>When</legend>
        <div class="sky-ww-mode-row sky-ww-when-row"><span class="sky-ww-mode-primary"><label class="sky-ww-choice"><input data-ww-field="now" type="checkbox"${now?' checked':''}><span>Now</span></label><button class="sky-ww-refresh" type="button" data-ww-action="refresh-now" aria-label="Refresh current instant" title="Capture current instant"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5M18 10A7 7 0 0 0 6 7L4 9M6 14a7 7 0 0 0 12 3l2-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></span><label class="sky-time-unknown-option sky-ww-unknown"><input data-ww-field="time-unknown" type="checkbox"${p.timeUnknown?' checked':''}><span>Time unknown</span></label></div>
        <p class="sky-ww-mode-value sky-ww-clock" data-ww-now-value${now?'':' hidden'} role="timer" aria-live="off"></p>
        <div class="sky-ww-manual" data-ww-manual-when${now?' hidden':''}><div class="sky-ww-time-basis" role="radiogroup" aria-label="Time entry basis"><span class="sky-ww-time-basis-label">Enter as</span><label class="sky-ww-time-basis-option"><input type="radio" data-ww-field="time-basis" name="skyTimeBasis${slot}" value="local" checked>Local</label><label class="sky-ww-time-basis-option"><input type="radio" data-ww-field="time-basis" name="skyTimeBasis${slot}" value="utc"${p.timeUnknown?' disabled':''}>UTC</label></div><div class="sky-where-when-grid" data-ww-local-fields><label class="sky-where-when-label">Local date<input class="sky-where-when-input" data-ww-field="date" type="date" value="${escapeHtml(date)}"></label><label class="sky-where-when-label">Local time<input class="sky-where-when-input" data-ww-field="time" type="time" value="${escapeHtml(time)}"${p.timeUnknown?' disabled':''}></label></div><div class="sky-where-when-grid sky-ww-utc-grid" data-ww-utc-fields hidden><label class="sky-where-when-label">UTC date<input class="sky-where-when-input" data-ww-field="utc-date" type="date"></label><label class="sky-where-when-label">UTC time<input class="sky-where-when-input" data-ww-field="utc-time" type="time"></label></div><p class="sky-ww-time-equivalent" data-ww-time-equivalent role="status" aria-live="polite" hidden></p></div>
      </fieldset>
      <details class="sky-where-when-advanced"><summary>Advanced settings</summary><div class="sky-where-when-advanced-body"><label class="sky-where-when-label">Time zone<input class="sky-where-when-input" data-ww-field="timezone" type="text" readonly value="${escapeHtml(selected?.timezone||p.timeZone||'')}"></label><div class="sky-where-when-coordinate-grid"><label class="sky-where-when-label">Latitude<input class="sky-where-when-input" data-ww-field="latitude" type="number" step="0.00001" min="-90" max="90" value="${escapeHtml(displayCoordinate(selected?.latitude??p.latitude))}"></label><label class="sky-where-when-label">Longitude<input class="sky-where-when-input" data-ww-field="longitude" type="number" step="0.00001" min="-180" max="180" value="${escapeHtml(displayCoordinate(selected?.longitude??p.longitude))}"></label></div><div data-ww-paste-inference-host></div></div></details>
      <p class="sky-where-when-status" data-update-now-status aria-live="polite"></p>
      <div class="sky-where-when-heptagram-slot" data-ww-heptagram-slot="${slot}"></div>
    </div>
    <div class="sky-where-when-footer"><div class="sky-where-when-footer-actions"><button class="sky-where-when-button secondary sky-where-when-cancel" type="button" data-ww-action="cancel">Cancel</button><button class="sky-where-when-button primary" type="submit"${disabled}>Use This Where and When</button></div></div>
  </form>`;
}

function timeBasis(form){return form?.querySelector('[data-ww-field="time-basis"]:checked')?.value==='utc'?'utc':'local'}
function timeField(form,name){return form?.querySelector('[data-ww-field="'+name+'"]')}
function utcDraftInstant(form){
  const date=timeField(form,'utc-date')?.value||'',time=timeField(form,'utc-time')?.value||'';
  if(!date||!time||!window.luxon?.DateTime)return null;
  const instant=window.luxon.DateTime.fromISO(date+'T'+time,{zone:'UTC',setZone:true});
  return instant.isValid&&instant.toFormat('yyyy-MM-dd')===date&&instant.toFormat('HH:mm')===time?instant:null;
}
function syncLocalToUtc(form){
  const date=timeField(form,'date')?.value||'',time=timeField(form,'time')?.value||'';
  const zone=timeField(form,'timezone')?.value||'';
  if(!date||!time||!zone||!window.luxon?.DateTime)return;
  const local=window.luxon.DateTime.fromISO(date+'T'+time,{zone,setZone:true});
  if(!local.isValid)return;
  const utc=local.toUTC();
  timeField(form,'utc-date').value=utc.toFormat('yyyy-MM-dd');
  timeField(form,'utc-time').value=utc.toFormat('HH:mm');
}
function syncUtcToLocal(form){
  const instant=utcDraftInstant(form),zone=timeField(form,'timezone')?.value||'';
  const label=form?.querySelector('[data-ww-time-equivalent]');
  if(!instant||!zone){
    if(label){label.hidden=false;label.textContent=!zone?'Select a location to show the equivalent local date and time.':'Enter a valid UTC date and time.'}
    timeField(form,'date').value='';
    timeField(form,'time').value='';
    return null;
  }
  const local=instant.setZone(zone);
  if(!local.isValid){
    if(label){label.hidden=false;label.textContent='The location time zone could not be resolved.'}
    return null;
  }
  timeField(form,'date').value=local.toFormat('yyyy-MM-dd');
  timeField(form,'time').value=local.toFormat('HH:mm');
  window.RelphiSkyTimeControl?.refresh?.(timeField(form,'time'));
  if(label){
    label.hidden=false;
    label.textContent='At '+zone+': '+local.toFormat('ccc, LLL d, yyyy · h:mm a')+' (UTC'+local.toFormat('ZZ')+').';
  }
  return instant;
}
function syncTimeBasis(form){
  if(!form)return;
  const unknown=modeValue(form,'time-unknown');
  const utcToggle=form.querySelector('[data-ww-field="time-basis"][value="utc"]');
  if(utcToggle)utcToggle.disabled=unknown;
  if(unknown&&utcToggle?.checked){
    form.querySelector('[data-ww-field="time-basis"][value="local"]').checked=true;
  }
  const utc=timeBasis(form)==='utc'&&!unknown;
  const localFields=form.querySelector('[data-ww-local-fields]'),utcFields=form.querySelector('[data-ww-utc-fields]'),label=form.querySelector('[data-ww-time-equivalent]');
  if(localFields)localFields.hidden=utc;
  if(utcFields)utcFields.hidden=!utc;
  if(utc)syncUtcToLocal(form);
  else if(label)label.hidden=true;
}
function initializeTimeBasis(form,p){
  if(!form||p?.timeUnknown===true)return;
  const iso=String(p?.instant||'');
  let instant=iso&&window.luxon?.DateTime?.fromISO(iso,{setZone:true});
  if(!instant?.isValid){syncLocalToUtc(form);return}
  instant=instant.toUTC();
  timeField(form,'utc-date').value=instant.toFormat('yyyy-MM-dd');
  timeField(form,'utc-time').value=instant.toFormat('HH:mm');
}
window.RelphiSkyUtcTimeEntry=Object.freeze({instantForForm:utcDraftInstant,syncUtcToLocal,syncLocalToUtc});

function modeValue(form,name){return form?.querySelector('[data-ww-field="'+name+'"]')?.checked===true}
function captureMoment(form){if(form)form.dataset.nowInstant=new Date().toISOString()}
function syncModes(slot){
  const form=formFor(slot);if(!form)return;
  const here=modeValue(form,'here'),now=modeValue(form,'now');
  const manualWhere=form.querySelector('[data-ww-manual-where]'),manualWhen=form.querySelector('[data-ww-manual-when]');
  if(manualWhere)manualWhere.hidden=here;
  if(manualWhen)manualWhen.hidden=now;
  syncTimeBasis(form);
  const hereValue=form.querySelector('[data-ww-here-value]'),nowValue=form.querySelector('[data-ww-now-value]');
  if(hereValue){hereValue.hidden=!here;hereValue.textContent=here?cardState[slot].selected?.canonical||'Finding your location…':''}
  if(nowValue)nowValue.hidden=!now;
  if(now)updateNowFields(slot);
  window.RelphiSkyWhereWhenDraftHeptagram?.render?.(slot,0);
}
function updateNowFields(slot){
  const form=formFor(slot);if(!form||!modeValue(form,'now'))return;
  const selected=cardState[slot].selected,DateTime=window.luxon?.DateTime;
  if(!DateTime)return;
  if(!form.dataset.nowInstant)captureMoment(form);
  const instant=DateTime.fromISO(form.dataset.nowInstant,{setZone:true});
  if(!instant?.isValid)return;
  const timezone=selected?.timezone||DateTime.local().zoneName;
  const local=instant.setZone(timezone);if(!local?.isValid)return;
  const date=form.querySelector('[data-ww-field="date"]'),time=form.querySelector('[data-ww-field="time"]'),summary=form.querySelector('[data-ww-now-value]');
  if(date)date.value=local.toFormat('yyyy-MM-dd');
  if(time)time.value=local.toFormat('HH:mm');
  if(time)window.RelphiSkyTimeControl?.refresh?.(time);
  if(summary)summary.textContent='Captured · '+local.toFormat('ccc, LLL d · h:mm:ss a')+' · '+timezone;
  const utc=instant.toUTC();timeField(form,'utc-date').value=utc.toFormat('yyyy-MM-dd');timeField(form,'utc-time').value=utc.toFormat('HH:mm');
}
async function checkHere(slot){
  const form=formFor(slot),here=form?.querySelector('[data-ww-field="here"]');
  if(!form||!here?.checked)return;
  status(slot,'Finding your current browser location…');
  try{
    const packet=await currentLocationPacket();
    if(!form.isConnected||!here.checked)return;
    if(!selectLocation(slot,packet))throw new Error('Current location could not be applied.');
    syncModes(slot);
    status(slot,'');
  }catch(error){
    if(!form.isConnected)return;
    here.checked=false;syncModes(slot);
    status(slot,error?.code===1?'Location permission was denied.':error?.message||'Current location could not be resolved.',true);
  }
}
function updateMode(slot,kind,checked){
  const form=formFor(slot);if(!form)return;
  if(kind==='here'){
    if(checked){syncModes(slot);void checkHere(slot)}
    else{syncModes(slot);status(slot,'Search for a location, or keep the selected location.')}
    return;
  }
  if(kind!=='now')return;
  if(checked){
    enableKnownTime(form);
    form.dataset.manualDate=form.querySelector('[data-ww-field="date"]')?.value||'';
    form.dataset.manualTime=form.querySelector('[data-ww-field="time"]')?.value||'';
    form.dataset.manualUtcDate=timeField(form,'utc-date')?.value||'';
    form.dataset.manualUtcTime=timeField(form,'utc-time')?.value||'';
    captureMoment(form);
    status(slot,'Current instant captured. Refresh to capture a different instant.');
  }else{
    delete form.dataset.nowInstant;
    const date=form.querySelector('[data-ww-field="date"]'),time=form.querySelector('[data-ww-field="time"]');
    if(date&&form.dataset.manualDate)date.value=form.dataset.manualDate;
    if(time&&form.dataset.manualTime)time.value=form.dataset.manualTime;
    if(form.dataset.manualUtcDate)timeField(form,'utc-date').value=form.dataset.manualUtcDate;
    if(form.dataset.manualUtcTime)timeField(form,'utc-time').value=form.dataset.manualUtcTime;
    status(slot,'Custom date and time selected.');
  }
  syncModes(slot);
}
function refreshNow(slot){
  const form=formFor(slot);if(!form)return;
  const toggle=form.querySelector('[data-ww-field="now"]');
  if(!toggle)return;
  if(!toggle.checked){
    toggle.checked=true;
    updateMode(slot,'now',true);
    return;
  }
  captureMoment(form);
  updateNowFields(slot);
  window.RelphiSkyWhereWhenDraftHeptagram?.render?.(slot,0);
  status(slot,'Current instant refreshed. Confirm to apply it to the chart.');
}
function keepCommittedHeptagramInSummary(slot){
  const refs=shell(slot),frame=refs?.root?.querySelector(`[data-sky-heptagram-frame="${slot}"]`);
  // The committed heptagram belongs to the summary. The editor has its own
  // draft heptagram owner, so never move the committed frame into the editor.
  if(refs?.summary&&frame&&!refs.summary.contains(frame))refs.summary.prepend(frame);
}
function restoreHeptagram(slot){const refs=shell(slot),frame=refs?.root?.querySelector(`[data-sky-heptagram-frame="${slot}"]`);if(refs?.summary&&frame&&!refs.summary.contains(frame))refs.summary.prepend(frame)}
function openEditor(slot,focus=false){
  const refs=shell(slot);if(!refs)return;
  beginWhereWhen(slot);
  const initialProfile=profileFor(slot);
  refs.editor.innerHTML=editorMarkup(slot,initialProfile);
  initializeTimeBasis(formFor(slot),initialProfile);
  keepCommittedHeptagramInSummary(slot);
  window.RelphiSkyCardShell.setEditorExpanded(slot,true);
  syncModes(slot);
  // A persisted 'Here' tag is not a fresh geolocation result for this editing session.
  if(formFor(slot)?.querySelector('[data-ww-field="here"]')?.checked)void checkHere(slot);
  window.dispatchEvent(new CustomEvent('relphi:sky-where-when-editor-ready',{detail:{slot,form:formFor(slot)}}));
  if(focus)requestAnimationFrame(()=>formFor(slot)?.querySelector('[data-ww-field="location-query"]')?.focus());
}
function clearEditor(slot){const refs=shell(slot);if(!refs)return;restoreHeptagram(slot);window.RelphiSkyCardShell.setEditorExpanded(slot,false);refs.editor.replaceChildren();cardState[slot].busy=false}
function closeEditor(slot){if(!transactionState.editing.has(slot))return;clearEditor(slot);finishWhereWhen(slot,false)}

function localDateTimeToInstant(date,time,timeZone){
  if(!window.luxon?.DateTime)throw new Error('Time-zone conversion is unavailable.');
  const dt=window.luxon.DateTime.fromISO(`${date}T${time}`,{zone:timeZone,setZone:true});
  if(!dt.isValid)throw new Error(dt.invalidExplanation||'That local date and time is not valid in the selected time zone.');
  return dt;
}
function astronomyLongitude(bodyName,date){const A=window.Astronomy;if(!A)throw new Error('Astronomy Engine is unavailable.');if(bodyName==='Moon'&&typeof A.EclipticGeoMoon==='function')return norm(A.EclipticGeoMoon(date).lon);return norm(A.Ecliptic(A.GeoVector(bodyName,date,true)).elon)}
function siderealDegrees(date,longitude){return norm(window.Astronomy.SiderealTime(date)*15+Number(longitude||0))}
function obliquity(date){return Number(window.Astronomy.e_tilt(date).tobl)}
function ascendantLongitude(date,latitude,longitude){const theta=siderealDegrees(date,longitude)*Math.PI/180,phi=Number(latitude)*Math.PI/180,epsilon=obliquity(date)*Math.PI/180;return norm(Math.atan2(-Math.cos(theta),Math.sin(theta)*Math.cos(epsilon)+Math.tan(phi)*Math.sin(epsilon))*180/Math.PI+180)}
function midheavenLongitude(date,longitude){const theta=siderealDegrees(date,longitude)*Math.PI/180,epsilon=obliquity(date)*Math.PI/180;return norm(Math.atan2(Math.sin(theta),Math.cos(theta)*Math.cos(epsilon))*180/Math.PI)}
function placementObject(name,longitude){const value=norm(longitude),signIndex=Math.floor(value/30),within=value-signIndex*30,degree=Math.floor(within),minuteFloat=(within-degree)*60,minute=Math.floor(minuteFloat),second=Math.round((minuteFloat-minute)*60);return{name,longitude:value,sign:SIGNS[signIndex],degree,minute,second}}
function calculateUnknownTimeSky(slot,selected,date){
  if(!window.luxon?.DateTime)throw new Error('Time-zone conversion is unavailable.');
  const start=window.luxon.DateTime.fromISO(`${date}T00:00:00`,{zone:selected.timezone,setZone:true});
  const end=start.plus({days:1}).minus({seconds:1});
  if(!start.isValid||!end.isValid)throw new Error('That local date is not valid in the selected time zone.');
  const startInstant=start.toUTC().toJSDate(),endInstant=end.toUTC().toJSDate(),midInstant=start.plus({hours:12}).toUTC().toJSDate();
  const placements={};
  BODIES.filter(name=>name!=='Moon').forEach(name=>{placements[name]=placementObject(name,astronomyLongitude(name,midInstant))});
  const moonStart=placementObject('Moon',astronomyLongitude('Moon',startInstant)),moonEnd=placementObject('Moon',astronomyLongitude('Moon',endInstant));
  const existing=payload(slot)||{},metadata=existing.metadata&&typeof existing.metadata==='object'?{...existing.metadata}:{},priorProfile=existing.calcProfile&&typeof existing.calcProfile==='object'?{...existing.calcProfile}:{};
  metadata.whereWhenSource=selected.source||'manual';metadata.liveNowDisabled=true;metadata.liveNowDisabledReason='time-unknown';
  delete metadata.capturedNowAt;delete metadata.liveContinuous;delete metadata.liveNowOrigin;delete metadata.liveNowAt;delete metadata.liveAgeAnchorAt;delete metadata.liveNowLatitude;delete metadata.liveNowLongitude;
  delete metadata.savedSkyId;delete metadata.savedSkyName;delete metadata.savedSkyLoadedAt;delete metadata.name;delete metadata.title;
  delete priorProfile.name;delete priorProfile.title;
  return{...existing,name:`Sky ${slot}`,title:`Sky ${slot}`,displayName:`Sky ${slot}`,skyName:`Sky ${slot}`,saved:false,placements,houseCusps:[],metadata,calcProfile:{...priorProfile,dateTime:date,instant:'',timeUnknown:true,moonRange:{start:moonStart,end:moonEnd},latitude:String(selected.latitude),longitude:String(selected.longitude),location:selected.canonical,locationQuery:selected.query||selected.canonical,timeZone:selected.timezone,whereWhenSource:selected.source||'manual',houseSystem:'none',houseCusps:[],cusps:[],source:'where-when-v3'},savedAt:new Date().toISOString()};
}
function calculateSky(slot,selected,date,time,options={}){
  if(options.timeUnknown===true)return calculateUnknownTimeSky(slot,selected,date);
  const supplied=String(options.instant||'').trim();
  const dt=supplied?window.luxon?.DateTime?.fromISO(supplied,{setZone:true})?.setZone(selected.timezone):localDateTimeToInstant(date,time,selected.timezone);
  if(!dt?.isValid)throw new Error('The current instant could not be converted to the selected location.');
  const instant=dt.toUTC().toJSDate(),placements={};
  BODIES.forEach(name=>{placements[name]=placementObject(name,astronomyLongitude(name,instant))});
  const asc=ascendantLongitude(instant,selected.latitude,selected.longitude),mc=midheavenLongitude(instant,selected.longitude);
  placements.Ascendant=placementObject('Ascendant',asc);placements.Midheaven=placementObject('Midheaven',mc);
  const storedHouseSystem=String(profileFor(slot).houseSystem||'').trim();
  const houseSystem=localStorage.getItem(SHARED_HOUSE_KEY)||(storedHouseSystem&&storedHouseSystem!=='none'?storedHouseSystem:'whole-sign');
  const houses=window.RelphiHouseSystems.calculateCusps({system:houseSystem,ascendant:asc,midheaven:mc,siderealDegrees:siderealDegrees(instant,selected.longitude),obliquityDegrees:obliquity(instant),latitude:selected.latitude});
  const existing=options.replaceExisting?{}:(payload(slot)||{}),metadata=existing.metadata&&typeof existing.metadata==='object'?{...existing.metadata}:{},priorProfile=existing.calcProfile&&typeof existing.calcProfile==='object'?{...existing.calcProfile}:{},liveOrigin=String(options.liveOrigin||'');
  // A known-time calculation must not inherit unknown-time state from the prior working copy.
  delete priorProfile.timeUnknown;delete priorProfile.moonRange;
  // Chiron may already be a trusted stored placement even when no live Chiron provider is available.
  // Preserve it only when this calculation represents the same instant. A genuinely new instant must never inherit stale Chiron.
  const existingInstant=String(priorProfile.instant||existing.instant||'').trim(),nextInstant=dt.toUTC().toISO();
  if(existingInstant&&Date.parse(existingInstant)===Date.parse(nextInstant)){
    const source=existing.placements&&typeof existing.placements==='object'?existing.placements:{};
    const chironKey=Object.keys(source).find(key=>String(source[key]?.name||source[key]?.label||source[key]?.body||source[key]?.planet||source[key]?.point||source[key]?.id||source[key]?.glyphId||key).trim().toLowerCase()==='chiron');
    if(chironKey&&source[chironKey]&&typeof source[chironKey]==='object')placements[chironKey]=JSON.parse(JSON.stringify(source[chironKey]));
  }
  delete metadata.savedSkyId;delete metadata.savedSkyName;delete metadata.savedSkyLoadedAt;
  // A changed calculation starts a fresh working identity. The editor's
  // explicit Sky name, if supplied, is reapplied by Saved Skies after commit.
  delete metadata.name;delete metadata.title;delete priorProfile.name;delete priorProfile.title;
  metadata.whereWhenSource=selected.source||'manual';
  if(liveOrigin==='use-now'){
    delete metadata.liveNowDisabled;delete metadata.liveNowDisabledReason;delete metadata.liveNowMigrated;
    delete priorProfile.savedSkyId;delete priorProfile.savedSkyName;
    delete metadata.capturedNowAt;
    metadata.liveContinuous=options.continuousNow===true;
    metadata.name='Now';metadata.title='Now';metadata.liveNowOrigin='use-now';metadata.liveNowAt=dt.toUTC().toISO();metadata.liveAgeAnchorAt=metadata.liveNowAt;metadata.liveNowLatitude=String(selected.latitude);metadata.liveNowLongitude=String(selected.longitude);
    return{...existing,name:'Now',title:'Now',displayName:'Now',skyName:'Now',saved:false,placements,houseCusps:houses.cusps,metadata,calcProfile:{...priorProfile,name:'Now',title:'Now',dateTime:dt.toFormat("yyyy-MM-dd'T'HH:mm"),instant:metadata.liveNowAt,timeUnknown:false,latitude:String(selected.latitude),longitude:String(selected.longitude),location:selected.canonical,locationQuery:selected.query||selected.canonical,timeZone:selected.timezone,whereWhenSource:selected.source||'manual',houseSystem:houses.system||houseSystem,houseCusps:houses.cusps,cusps:houses.cusps,houseSystemNote:houses.note,source:'where-when-v3',liveNowOrigin:'use-now',liveNowAt:metadata.liveNowAt},savedAt:new Date().toISOString()};
  }
  delete metadata.liveContinuous;delete metadata.liveNowOrigin;delete metadata.liveNowAt;delete metadata.liveAgeAnchorAt;delete metadata.liveNowLatitude;delete metadata.liveNowLongitude;delete metadata.liveNowMigrated;
  if(options.snapshotNow){
    metadata.capturedNowAt=nextInstant;
    metadata.name='Now';metadata.title='Now';
  }else delete metadata.capturedNowAt;
  metadata.liveNowDisabled=true;metadata.liveNowDisabledReason=options.snapshotNow?'fixed-now-snapshot':'custom-where-when';
  delete priorProfile.liveNowOrigin;delete priorProfile.liveNowAt;
  return{...existing,name:options.snapshotNow?'Now':`Sky ${slot}`,title:options.snapshotNow?'Now':`Sky ${slot}`,displayName:options.snapshotNow?'Now':`Sky ${slot}`,skyName:options.snapshotNow?'Now':`Sky ${slot}`,saved:false,placements,houseCusps:houses.cusps,metadata,calcProfile:{...priorProfile,dateTime:dt.toFormat("yyyy-MM-dd'T'HH:mm"),instant:dt.toUTC().toISO(),timeUnknown:false,latitude:String(selected.latitude),longitude:String(selected.longitude),location:selected.canonical,locationQuery:selected.query||selected.canonical,timeZone:selected.timezone,whereWhenSource:selected.source||'manual',houseSystem:houses.system||houseSystem,houseCusps:houses.cusps,cusps:houses.cusps,houseSystemNote:houses.note,source:'where-when-v3'},savedAt:new Date().toISOString()};
}
function dispatchSlotChange(slot){try{window.dispatchEvent(new StorageEvent('storage',{key:SLOT_KEYS[slot],newValue:localStorage.getItem(SLOT_KEYS[slot]),storageArea:localStorage}))}catch(_){const event=new Event('storage');Object.defineProperty(event,'key',{value:SLOT_KEYS[slot]});window.dispatchEvent(event)}}
function normalizePacket(packet){
  if(!packet||typeof packet!=='object')return null;
  const next={...packet},inferred=next.source==='placement-inference'||String(next.query||'').trim()===INFERENCE_MARKER;
  if(inferred){next.source='placement-inference';next.query=''}else if(!next.source)next.source='search';
  return next;
}
async function searchLocation(slot){
  const card=panel(slot),input=card?.querySelector('[data-ww-field="location-query"]'),resultsNode=card?.querySelector('.sky-location-results'),query=input?.value.trim()||'';
  if(!query){status(slot,'Type a location first.',true);input?.focus();return}
  status(slot,`Searching for ${query}…`);resultsNode?.replaceChildren();
  try{
    const url=new URL('https://geocoding-api.open-meteo.com/v1/search');url.searchParams.set('name',query);url.searchParams.set('count','7');url.searchParams.set('language','en');url.searchParams.set('format','json');
    const response=await fetch(url.toString(),{headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`Location search returned ${response.status}.`);
    const data=await response.json(),results=Array.isArray(data.results)?data.results:[];if(!results.length)throw new Error('No matching location was found. Try a city plus state, region, or country.');
    const fragment=document.createDocumentFragment();
    results.forEach((result,index)=>{
      const canonical=[result.name,result.admin1,result.country].map(v=>String(v||'').trim()).filter((v,i,list)=>v&&list.indexOf(v)===i).join(','+' '),button=document.createElement('button');
      button.type='button';button.className='sky-location-result';button.dataset.wwAction='select-location';button.dataset.locationIndex=String(index);button.innerHTML=`<strong>${escapeHtml(canonical)}</strong><span>${displayCoordinate(result.latitude)}, ${displayCoordinate(result.longitude)} · ${escapeHtml(result.timezone||'Time zone unavailable')}</span>`;
      button.__locationPacket={source:'search',query,canonical,latitude:Number(result.latitude),longitude:Number(result.longitude),timezone:String(result.timezone||'')};fragment.appendChild(button);
    });
    resultsNode.appendChild(fragment);status(slot,'Choose the canonical location that matches what you meant.');
  }catch(error){status(slot,error.message||'Location search failed.',true)}
}
function selectLocation(slot,source){
  const packet=normalizePacket(source?.__locationPacket||source);
  if(!packet||!Number.isFinite(Number(packet.latitude))||!Number.isFinite(Number(packet.longitude))||!packet.timezone){status(slot,'That result did not include a complete coordinate and time-zone packet.',true);return false}
  packet.latitude=Number(packet.latitude);packet.longitude=Number(packet.longitude);cardState[slot].selected=packet;
  const card=panel(slot),queryInput=card?.querySelector('[data-ww-field="location-query"]');if(queryInput){queryInput.value=packet.source==='current-location'?'':packet.query||'';queryInput.classList.toggle('is-current-location',packet.source==='current-location')}
  card?.querySelector('.sky-location-results')?.replaceChildren();
  const confirmation=card?.querySelector('.sky-location-confirmation');
  if(confirmation){confirmation.hidden=false;confirmation.dataset.locationSource=packet.source||'search';confirmation.innerHTML=packet.source==='placement-inference'?`<p><strong>Location inferred from pasted placements</strong></p><p class="sky-inferred-location-value">${escapeHtml(packet.canonical)}</p>`:`<p><strong>You searched:</strong> ${escapeHtml(packet.query||packet.canonical)}</p><p><strong>Location found:</strong> ${escapeHtml(packet.canonical)}</p>`}
  card.querySelector('[data-ww-field="timezone"]').value=packet.timezone;card.querySelector('[data-ww-field="latitude"]').value=displayCoordinate(packet.latitude);card.querySelector('[data-ww-field="longitude"]').value=displayCoordinate(packet.longitude);
  const when=card.querySelector('[data-ww-when]');when.disabled=false;when.querySelectorAll('input').forEach(node=>{node.disabled=false});card.querySelector('button[type="submit"]').disabled=false;
  const form=formFor(slot);
  if(form&&!modeValue(form,'now')){if(timeBasis(form)==='utc')syncUtcToLocal(form);else syncLocalToUtc(form)}
  if(form&&modeValue(form,'time-unknown'))timeField(form,'time').disabled=true;
  const hereToggle=card.querySelector('[data-ww-field="here"]');if(hereToggle)hereToggle.checked=packet.source==='current-location';
  syncModes(slot);
  status(slot,packet.source==='placement-inference'?'Inferred location ready. Review the date and time, then confirm.':'Location confirmed. Review the time and preview, then confirm.');
  window.dispatchEvent(new CustomEvent('relphi:sky-where-when-location-selected',{detail:{slot,packet:{...packet}}}));
  window.RelphiSkyWhereWhenDraftHeptagram?.render?.(slot,0);
  return true;
}
async function reversePacket(latitude,longitude){
  const reverseUrl=new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');reverseUrl.searchParams.set('latitude',String(latitude));reverseUrl.searchParams.set('longitude',String(longitude));reverseUrl.searchParams.set('localityLanguage','en');
  const zoneUrl=new URL('https://api.open-meteo.com/v1/forecast');zoneUrl.searchParams.set('latitude',String(latitude));zoneUrl.searchParams.set('longitude',String(longitude));zoneUrl.searchParams.set('timezone','auto');zoneUrl.searchParams.set('forecast_days','1');
  const[reverseResponse,zoneResponse]=await Promise.all([fetch(reverseUrl.toString(),{headers:{Accept:'application/json'}}),fetch(zoneUrl.toString(),{headers:{Accept:'application/json'}})]);
  if(!reverseResponse.ok||!zoneResponse.ok)throw new Error('Current coordinates could not be resolved.');
  const reverse=await reverseResponse.json(),zone=await zoneResponse.json(),canonical=[reverse.locality||reverse.city,reverse.principalSubdivision,reverse.countryName].map(v=>String(v||'').trim()).filter((v,i,list)=>v&&list.indexOf(v)===i).join(', ');
  return{canonical,timezone:String(zone.timezone||'UTC')};
}
function currentPosition(){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error('Current location is unavailable in this browser.'));navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:12000,maximumAge:0})})}
async function currentLocationPacket(){
  const shared=window.RelphiSkyLocationSearch?.currentLocationPacket;
  if(typeof shared==='function'){const packet=await shared();return{...packet,source:'current-location'}}
  const position=await currentPosition(),latitude=Number(position.coords.latitude),longitude=Number(position.coords.longitude),resolved=await reversePacket(latitude,longitude);
  return{source:'current-location',query:'My current location',canonical:resolved.canonical||`${displayCoordinate(latitude)}, ${displayCoordinate(longitude)}`,latitude,longitude,timezone:resolved.timezone||'UTC'};
}
function finishCommitted(slot,detail={}){
  clearEditor(slot);
  dispatchSlotChange(slot);
  finishWhereWhen(slot,true);
  window.dispatchEvent(new CustomEvent('relphi:sky-working-copy-updated',{detail:{slot,source:detail.source||'where-when',dateTime:detail.dateTime||'',location:detail.location||''}}));
  scheduleSummary(slot,true);
  requestAnimationFrame(()=>window.RelphiSkyCardShell?.openDrawer?.(slot,'placements'));
}
async function submitCalculated(slot,form,options={}){
  const selected=cardState[slot].selected; if(modeValue(form,'now'))updateNowFields(slot);
  const isNow=modeValue(form,'now'),timeUnknown=!isNow&&modeValue(form,'time-unknown'),enteringUtc=!isNow&&!timeUnknown&&timeBasis(form)==='utc';
  if(!selected)return status(slot,'Choose a canonical location first.',true);
  const utc=enteringUtc?syncUtcToLocal(form):null;
  if(enteringUtc&&!utc)return status(slot,'Enter a valid UTC date and time and choose a location.',true);
  const date=timeField(form,'date')?.value||'',time=timeField(form,'time')?.value||'';
  if(!date||(!timeUnknown&&!time))return status(slot,timeUnknown?'Enter the local date.':'Enter both the date and time.',true);
  setBusy(slot,true);status(slot,'Calculating placements and Planetary Hours…');
  try{
    const effectiveOptions=isNow?{...options,timeUnknown:false,liveOrigin:'',instant:form.dataset.nowInstant,snapshotNow:true}:enteringUtc?{...options,timeUnknown:false,instant:utc.toUTC().toISO()}:{...options,timeUnknown};
    const nextPayload=calculateSky(slot,selected,date,time,effectiveOptions);
    // Chiron is optional when the local ephemeris cannot cover this date.
    status(slot,'Calculating Chiron…');
    if(window.RelphiChironEphemeris)await window.RelphiChironEphemeris.completePayload(nextPayload);
    // A sky without Chiron remains valid; never synthesize a position.
    writeJson(SLOT_KEYS[slot],nextPayload);
    const committed=payload(slot),profile=committed?.calcProfile||{};
    if(String(profile.location||'')!==String(selected.canonical||''))throw new Error('The new Where and When did not persist.');
    finishCommitted(slot,{source:'where-when',dateTime:nextPayload.calcProfile.dateTime,location:selected.canonical});
    if(!timeUnknown)scheduleSummary(slot,true);
    if(effectiveOptions.snapshotNow){
      try{localStorage.removeItem(`relphiSkyLiveAgeAnchor${slot}`)}catch(_){}
      window.dispatchEvent(new CustomEvent('relphi:sky-live-origin-changed',{detail:{slot,origin:null,reason:'fixed-now-snapshot'}}));
      window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name:'Now',source:'fixed-now-snapshot'}}));
    }
  }catch(error){setBusy(slot,false);status(slot,error.message||'The Sky could not be calculated.',true)}
}
async function submitForm(slot,form,options={}){
  const pasted=window.RelphiSkyWhereWhenPasteInference;
  if(pasted?.hasPaste?.(form)){
    const handled=await pasted.commit(form,{requestedLiveOrigin:options.liveOrigin||''});
    if(handled)return;
  }
  await submitCalculated(slot,form,options);
}
function enableKnownTime(form){
  const unknown=form.querySelector('[data-ww-field="time-unknown"]');
  if(unknown?.checked){unknown.checked=false;unknown.dispatchEvent(new Event('change',{bubbles:true}))}
  const time=form.querySelector('[data-ww-field="time"]'),now=form.querySelector('[data-ww-action="use-now"]');
  if(time)time.disabled=false;
  if(now)now.disabled=false;
}
async function currentLocalTime(slot){
  const selected=cardState[slot].selected,form=formFor(slot);if(!selected||!form)return status(slot,'Choose a location first.',true);
  const now=window.luxon?.DateTime?.now(),local=now?.isValid?now.setZone(selected.timezone):null;if(!local?.isValid)return status(slot,'The current instant could not be converted to that location.',true);
  enableKnownTime(form);
  form.querySelector('[data-ww-field="date"]').value=local.toFormat('yyyy-MM-dd');form.querySelector('[data-ww-field="time"]').value=local.toFormat('HH:mm');window.RelphiSkyWhereWhenDraftHeptagram?.render?.(slot,0);
  await submitForm(slot,form,{snapshotNow:true,instant:now.toUTC().toISO()});
}
async function useHere(slot,button){
  const form=formFor(slot);if(!form)return;
  const dateField=form.querySelector('[data-ww-field="date"]'),timeField=form.querySelector('[data-ww-field="time"]');
  const dateValue=dateField?.value||'',timeValue=timeField?.value||'';
  if(button){button.disabled=true;button.setAttribute('aria-busy','true')}
  status(slot,'Finding your current browser location…');
  try{
    const packet=await currentLocationPacket();
    if(!selectLocation(slot,packet))throw new Error('Current browser location could not be applied.');
    if(dateField)dateField.value=dateValue;
    if(timeField)timeField.value=timeValue;
    status(slot,'Current browser location applied. Date and time unchanged.');
  }catch(error){
    status(slot,error?.code===1?'Location permission was denied.':error?.message||'Current browser location could not be resolved.',true);
  }finally{
    if(button){button.disabled=false;button.removeAttribute('aria-busy')}
  }
}
async function hereAndNow(slot){
  const form=formFor(slot);if(!form)return;
  setBusy(slot,true);status(slot,'Finding your location and capturing the current instant…');
  try{
    const packet=await currentLocationPacket();
    if(!form.isConnected)return;
    if(!selectLocation(slot,packet))throw new Error('Current browser location could not be applied.');
    const now=window.luxon?.DateTime?.now(),local=now?.isValid?now.setZone(packet.timezone):null;
    if(!local?.isValid)throw new Error('The current instant could not be converted to your location.');
    enableKnownTime(form);
    const here=form.querySelector('[data-ww-field="here"]'),nowToggle=form.querySelector('[data-ww-field="now"]');
    if(here)here.checked=true;
    if(nowToggle)nowToggle.checked=true;
    form.dataset.nowInstant=now.toUTC().toISO();
    updateNowFields(slot);
    syncModes(slot);
    setBusy(slot,false);
    await submitForm(slot,form,{snapshotNow:true,instant:form.dataset.nowInstant});
  }catch(error){setBusy(slot,false);status(slot,error?.code===1?'Location permission was denied.':error?.message||'Here and Now could not be resolved.',true)}
}

function weekdayRuler(instant,timeZone){return WEEKDAY_RULERS[window.luxon.DateTime.fromJSDate(instant).setZone(timeZone).weekday]||'sun'}
function solarNoonDate(localDate,timeZone){return window.luxon.DateTime.fromISO(`${localDate}T12:00`,{zone:timeZone}).toJSDate()}
function solarFrame(instant,latitude,longitude,timeZone){
  if(!window.SunCalc)throw new Error('Sunrise and sunset calculation is unavailable.');
  const local=window.luxon.DateTime.fromJSDate(instant).setZone(timeZone),todayDate=local.toFormat('yyyy-MM-dd'),previousDate=local.minus({days:1}).toFormat('yyyy-MM-dd'),nextDate=local.plus({days:1}).toFormat('yyyy-MM-dd'),today=SunCalc.getTimes(solarNoonDate(todayDate,timeZone),latitude,longitude),previous=SunCalc.getTimes(solarNoonDate(previousDate,timeZone),latitude,longitude),next=SunCalc.getTimes(solarNoonDate(nextDate,timeZone),latitude,longitude),valid=value=>value instanceof Date&&!Number.isNaN(value.getTime());
  if(![today.sunrise,today.sunset,previous.sunrise,previous.sunset,next.sunrise].every(valid))throw new Error('Planetary hours are unavailable for this date or latitude.');
  return instant>=today.sunrise?{start:today.sunrise,sunrise:today.sunrise,sunset:today.sunset,end:next.sunrise}:{start:previous.sunrise,sunrise:previous.sunrise,sunset:previous.sunset,end:today.sunrise};
}
function rotateHours(dayKey){const start=CHALDEAN.indexOf(dayKey);return Array.from({length:24},(_,index)=>CHALDEAN[(start+index)%7])}
function planetaryHourRows(frame,dayKey){const sequence=rotateHours(dayKey),daylight=frame.sunset-frame.sunrise,night=frame.end-frame.sunset,brightLength=daylight/12,darkLength=night/12;return Array.from({length:24},(_,index)=>{const bright=index<12,start=bright?frame.sunrise.getTime()+index*brightLength:frame.sunset.getTime()+(index-12)*darkLength;return{ruler:sequence[index],start:new Date(start),end:new Date(start+(bright?brightLength:darkLength))}})}
function heptagramPoint(key,radius){const index=CHALDEAN.indexOf(key),angle=(-90+index*(360/7))*Math.PI/180;return{x:180+Math.cos(angle)*radius,y:180+Math.sin(angle)*radius}}
function svgElement(name,attrs){const node=document.createElementNS('http://www.w3.org/2000/svg',name);Object.entries(attrs||{}).forEach(([key,value])=>node.setAttribute(key,String(value)));return node}
function line(parent,a,b,className){parent.appendChild(svgElement('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:className}))}
function partialLine(parent,a,b,fraction,className){const value=Math.max(0,Math.min(1,fraction));line(parent,a,{x:a.x+(b.x-a.x)*value,y:a.y+(b.y-a.y)*value},className)}
async function drawHeptagram(svg,p){
  if(!window.RelphiSkyHeptagramGeometry?.correct||!window.RelphiSkyHeptagramCanonical?.correct)throw new Error('The final heptagram rendering pipeline is unavailable.');
  const dt=window.luxon.DateTime.fromISO(p.instant||p.dateTime,{zone:p.timeZone,setZone:true}),instant=dt.toUTC().toJSDate(),frame=solarFrame(instant,Number(p.latitude),Number(p.longitude),p.timeZone),dayKey=weekdayRuler(frame.start,p.timeZone),rows=planetaryHourRows(frame,dayKey),currentIndex=Math.max(0,rows.findIndex(row=>instant>=row.start&&instant<row.end)),current=rows[currentIndex]||rows[0],weekIndex=Math.max(0,WEEK_PATH.indexOf(dayKey)),dayFraction=Math.max(0,Math.min(1,(instant-frame.start)/(frame.end-frame.start))),hourFraction=Math.max(0,Math.min(1,(instant-current.start)/(current.end-current.start)));
  delete svg.dataset.canonicalSourceReady;
  delete svg.dataset.canonicalHeptagramReady;
  delete svg.dataset.canonicalHeptagramBusy;
  delete svg.dataset.heptagramGeometryV6;
  delete svg.dataset.heptagramGeometryV7;
  svg.replaceChildren();svg.appendChild(svgElement('circle',{cx:180,cy:180,r:118,class:'sky-ph-circle'}));svg.appendChild(svgElement('circle',{cx:180,cy:180,r:78,class:'sky-ph-guide'}));
  for(let index=0;index<7;index++){const from=heptagramPoint(WEEK_PATH[index],118),to=heptagramPoint(WEEK_PATH[index+1],118);line(svg,from,to,`sky-ph-week-segment ${index<weekIndex?'past':'future'}`);if(index===weekIndex)partialLine(svg,from,to,dayFraction,'sky-ph-week-segment current')}
  rows.forEach((row,index)=>{const from=heptagramPoint(row.ruler,78),to=heptagramPoint(rows[(index+1)%rows.length].ruler,78);line(svg,from,to,`sky-ph-hour-segment ${index<currentIndex?'past':'future'}`);if(index===currentIndex)partialLine(svg,from,to,hourFraction,'sky-ph-hour-segment current')});
  CHALDEAN.forEach(key=>{const point=heptagramPoint(key,118),group=svgElement('g',{class:`sky-ph-planet sky-ph-${key}${key===dayKey?' is-day-ruler':''}${key===current.ruler?' is-hour-ruler':''}`,style:`color:${PLANETS[key].color}`});group.append(svgElement('circle',{cx:point.x,cy:point.y,r:18,class:`sky-ph-node${key===dayKey?' day':''}${key===current.ruler?' hour':''}`}),svgElement('g',{transform:`translate(${point.x} ${point.y})`,class:'sky-ph-node-glyph'}));svg.appendChild(group)});
  window.RelphiSkyHeptagramGeometry.correct(svg);await window.RelphiSkyHeptagramCanonical.correct(svg);svg.dataset.canonicalSourceReady='true';window.dispatchEvent(new CustomEvent('relphi:sky-heptagram-source-ready',{detail:{svg}}));
}
function planetaryHoursHref(p){const params=new URLSearchParams();params.set('phShare','1');params.set('lat',String(p.latitude));params.set('lon',String(p.longitude));params.set('tz',String(p.timeZone||''));if(p.location)params.set('loc',String(p.location));let instant='';if(p.instant){const date=new Date(p.instant);if(Number.isFinite(date.getTime()))instant=date.toISOString()}if(!instant&&p.dateTime&&window.luxon?.DateTime){const dt=window.luxon.DateTime.fromISO(String(p.dateTime),{zone:String(p.timeZone||'UTC'),setZone:true});if(dt.isValid)instant=dt.toUTC().toISO()}if(instant)params.set('dt',instant);return'planetaryhours.html#'+params.toString()}
function summarySignature(p){return[p.instant||p.dateTime,p.latitude,p.longitude,p.timeZone].join('|')}
async function renderSummary(slot,force=false){
  const state=cardState[slot];if(state.rendering){state.rerender=true;return}state.rendering=true;
  try{do{state.rerender=false;const p=profileFor(slot),refs=shell(slot);if(!refs)break;if(p?.timeUnknown===true||!completeProfile(p)){refs.summary.hidden=true;state.summarySignature='';refs.heptagram.replaceChildren();delete refs.heptagram.dataset.canonicalSourceReady;break}refs.summary.hidden=false;const signature=summarySignature(p);if(!force&&signature===state.summarySignature&&refs.heptagram.dataset.canonicalSourceReady==='true')continue;state.summarySignature=signature;refs.heptagram.setAttribute('viewBox',window.matchMedia?.('(max-width:620px)')?.matches?'0 -8 360 368':'0 0 360 360');try{await drawHeptagram(refs.heptagram,p)}catch(error){state.summarySignature='';console.error(error)}}while(state.rerender)}finally{state.rendering=false}
}
function scheduleSummary(slot,force=false){const state=cardState[slot];if(state.rendering){state.rerender=true;return}void renderSummary(slot,force)}

// Committed Now skies remain living while this tab is visible. Historical/manual
// charts never enter this loop. A 60-second cadence moves fast angles and points
// without rebuilding the entire wheel every second.
const continuousBusy={A:false,B:false};
function freezeLegacyLiveSky(slot){
  const value=payload(slot),meta=value?.metadata||{};
  if(meta.liveNowOrigin!=='use-now'&&meta.liveContinuous!==true)return;
  const captured=String(value?.calcProfile?.instant||meta.liveNowAt||'');
  const metadata={...meta};
  delete metadata.liveContinuous;delete metadata.liveNowOrigin;delete metadata.liveNowAt;
  delete metadata.liveAgeAnchorAt;delete metadata.liveNowLatitude;delete metadata.liveNowLongitude;
  if(Number.isFinite(Date.parse(captured)))metadata.capturedNowAt=captured;
  metadata.liveNowDisabled=true;metadata.liveNowDisabledReason='fixed-now-snapshot';
  const calcProfile={...value.calcProfile};delete calcProfile.liveNowOrigin;delete calcProfile.liveNowAt;
  writeJson(SLOT_KEYS[slot],{...value,metadata,calcProfile});
  try{localStorage.removeItem(`relphiSkyLiveAgeAnchor${slot}`)}catch(_){}
}
window.RelphiSkyWhereWhen=Object.freeze({
  form:formFor,
  selectPacket:(slot,packet)=>selectLocation(slot,packet),
  finishExternalCommit:(slot,detail)=>finishCommitted(slot,detail),
  status,
  setBusy,
  profile:profileFor
});

document.addEventListener('click',event=>{
  const actionNode=event.target.closest?.('[data-ww-action]');if(!actionNode)return;const slot=eventSlot(actionNode);if(!slot)return;const action=actionNode.dataset.wwAction;
  if(action==='cancel')closeEditor(slot);else if(action==='search-location')void searchLocation(slot);else if(action==='select-location')selectLocation(slot,actionNode);else if(action==='refresh-here'){const toggle=formFor(slot)?.querySelector('[data-ww-field="here"]');if(toggle&&!toggle.checked){toggle.checked=true;syncModes(slot)}void checkHere(slot)}else if(action==='refresh-now')refreshNow(slot);else if(action==='use-here')void useHere(slot,actionNode);else if(action==='use-now')void currentLocalTime(slot);else if(action==='here-and-now')void hereAndNow(slot);
});
document.addEventListener('change',event=>{
  const basis=event.target.closest?.('[data-ww-field="time-basis"]');
  if(basis){
    const form=basis.closest('.sky-where-when-editor');if(!form)return;
    if(timeBasis(form)==='utc'){
      const utc=utcDraftInstant(form);
      if(!utc)syncLocalToUtc(form);
    }
    syncTimeBasis(form);
    window.RelphiSkyWhereWhenDraftHeptagram?.render?.(form.dataset.slot,0);
    return;
  }
  const modeToggle=event.target.closest?.('[data-ww-field="here"],[data-ww-field="now"]');
  if(modeToggle){const form=modeToggle.closest('.sky-where-when-editor');if(form)updateMode(form.dataset.slot,modeToggle.dataset.wwField,modeToggle.checked);return}
  const toggle=event.target.closest?.('[data-ww-field="time-unknown"]');if(!toggle)return;
  const form=toggle.closest('.sky-where-when-editor');if(!form)return;
  const unknown=toggle.checked,time=form.querySelector('[data-ww-field="time"]'),now=form.querySelector('[data-ww-field="now"]'),slot=form.dataset.slot,mount=form.querySelector(`[data-ww-heptagram-slot="${slot}"]`);
  // Unknown time and a captured instant are mutually exclusive.
  if(unknown&&now?.checked){now.checked=false;delete form.dataset.nowInstant;syncModes(slot)}
  if(unknown&&timeBasis(form)==='utc'){
    syncUtcToLocal(form);
    form.querySelector('[data-ww-field="time-basis"][value="local"]').checked=true;
    status(slot,'Unknown time uses the local calendar date.');
  }
  if(time)time.disabled=unknown;
  syncTimeBasis(form);
  if(unknown){
    mount?.querySelectorAll('[data-sky-heptagram-frame],[data-draft-where-when-link],[data-draft-where-when],.sky-ph-jump').forEach(node=>node.remove());
  }
  window.RelphiSkyWhereWhenDraftHeptagram?.render?.(slot,0);
});
document.addEventListener('submit',event=>{const form=event.target.closest?.('.sky-where-when-editor');if(!form)return;event.preventDefault();void submitForm(form.dataset.slot,form)});
document.addEventListener('input',event=>{
  const input=event.target.closest?.('[data-ww-field]');if(!input)return;
  if(input.dataset.wwField==='location-query')input.classList.remove('is-current-location');
  const form=input.closest('.sky-where-when-editor');if(!form||modeValue(form,'now'))return;
  if(['utc-date','utc-time'].includes(input.dataset.wwField)&&timeBasis(form)==='utc')syncUtcToLocal(form);
  if(['date','time'].includes(input.dataset.wwField)&&timeBasis(form)==='local')syncLocalToUtc(form);
});
document.addEventListener('keydown',event=>{if(event.key!=='Enter')return;const input=event.target.closest?.('[data-ww-field="location-query"]');if(!input)return;event.preventDefault();const slot=eventSlot(input);if(slot)void searchLocation(slot)});
window.addEventListener('relphi:sky-drawer-preparing',event=>{const{slot,drawer}=event.detail||{};if(drawer==='where'&&SLOT_KEYS[slot])openEditor(slot,false)});
window.addEventListener('relphi:sky-drawer-opened',event=>{const{slot,drawer}=event.detail||{};if(drawer==='where'&&SLOT_KEYS[slot]&&!transactionState.editing.has(slot))openEditor(slot,false)});
window.addEventListener('relphi:sky-drawer-closed',event=>{const{slot,drawer}=event.detail||{};if(drawer==='where'&&SLOT_KEYS[slot]&&transactionState.editing.has(slot))closeEditor(slot)});
function readPlanetaryHoursHandoff(){
  const params=new URLSearchParams(location.search);
  if(params.get('source')!=='planetary-hours')return null;
  const dateTime=String(params.get('datetime')||'').trim(),latitude=Number(params.get('lat')),longitude=Number(params.get('lon')),timeZone=String(params.get('tz')||'').trim();
  const match=dateTime.match(/^(\d{4}-\d\d-\d\d)T(\d\d:\d\d)/);
  if(!match||!Number.isFinite(latitude)||!Number.isFinite(longitude)||!timeZone)return null;
  const locationName=String(params.get('loc')||'').trim()||`${displayCoordinate(latitude)}, ${displayCoordinate(longitude)}`;
  return{date:match[1],time:match[2],dateTime:`${match[1]}T${match[2]}`,latitude,longitude,timeZone,location:locationName,name:String(params.get('name')||'').trim()};
}
function slotHasPlacements(slot){
const value=payload(slot),placements=value?.placements;
return!!(placements&&typeof placements==='object'&&Object.keys(placements).length);
}
function planetaryHoursSlotPreview(slot){
const value=payload(slot)||{},profile=value.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{},name=String(value.name||value.title||value.displayName||value.skyName||`Sky ${slot}`).trim()||`Sky ${slot}`;
const dateTime=String(profile.dateTime||'').trim(),locationName=String(profile.location||'').trim();
return{name,dateTime,location:locationName};
}
function planetaryHoursSlotMarkup(slot,filled){
if(!filled)return`<button class="sky-ph-handoff-slot is-empty" type="button" data-ph-handoff-slot="${slot}"><span class="sky-ph-handoff-action">Use Sky ${slot}</span><strong class="sky-ph-handoff-name">Empty slot</strong><span class="sky-ph-handoff-meta">Keep the current Sky A and add this moment for comparison.</span></button>`;
const info=planetaryHoursSlotPreview(slot),meta=[info.dateTime,info.location].filter(Boolean).join(' · ')||'Existing sky';
return`<button class="sky-ph-handoff-slot" type="button" data-ph-handoff-slot="${slot}"><span class="sky-ph-handoff-action">Replace Sky ${slot}</span><strong class="sky-ph-handoff-name">${escapeHtml(info.name)}</strong><span class="sky-ph-handoff-meta">${escapeHtml(meta)}</span></button>`;
}
function choosePlanetaryHoursTarget(){
const aFilled=slotHasPlacements('A'),bFilled=slotHasPlacements('B');
if(!aFilled)return Promise.resolve({slot:'A',clearBoth:false});
return new Promise(resolve=>{
document.querySelector('.sky-ph-handoff-dialog')?.remove();
const dialog=document.createElement('dialog');
dialog.className='sky-ph-handoff-dialog';
dialog.setAttribute('aria-labelledby','skyPhHandoffTitle');
dialog.innerHTML=`<div class="sky-ph-handoff-inner"><h2 id="skyPhHandoffTitle">${bFilled?'Sky Chart slots filled':'Sky Chart already has a sky'}</h2><p>Where should this Planetary Hours moment go?</p><div class="sky-ph-handoff-slots">${planetaryHoursSlotMarkup('A',true)}${planetaryHoursSlotMarkup('B',bFilled)}</div><div class="sky-ph-handoff-actions">${bFilled?'<button class="sky-ph-handoff-clear" type="button" data-ph-handoff-clear>Clear both and open this moment</button>':''}<button class="sky-ph-handoff-cancel" type="button" data-ph-handoff-cancel>Cancel</button></div></div>`;
const finish=choice=>{try{dialog.close()}catch(_){}dialog.remove();resolve(choice)};
dialog.addEventListener('click',event=>{
const slotButton=event.target.closest?.('[data-ph-handoff-slot]');
if(slotButton)return finish({slot:slotButton.dataset.phHandoffSlot,clearBoth:false});
if(event.target.closest?.('[data-ph-handoff-clear]'))return finish({slot:'A',clearBoth:true});
if(event.target.closest?.('[data-ph-handoff-cancel]'))return finish(null);
});
dialog.addEventListener('cancel',event=>{event.preventDefault();finish(null)},{once:true});
document.body.appendChild(dialog);
if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
});
}
function cleanPlanetaryHoursHandoffUrl(){
const clean=new URL(location.href);
['preview','source','datetime','date','lat','lon','tz','loc','name','calc'].forEach(key=>clean.searchParams.delete(key));
history.replaceState(history.state,'',clean.pathname+clean.search+clean.hash);
}
let planetaryHoursHandoffConsumed=false;
async function applyPlanetaryHoursHandoff(){
const handoff=readPlanetaryHoursHandoff();
if(!handoff||planetaryHoursHandoffConsumed)return;
planetaryHoursHandoffConsumed=true;
const choice=await choosePlanetaryHoursTarget();
if(!choice){cleanPlanetaryHoursHandoffUrl();return}
const slot=choice.slot;
const selected={source:'planetary-hours',query:handoff.location,canonical:handoff.location,latitude:handoff.latitude,longitude:handoff.longitude,timezone:handoff.timeZone};
cardState[slot].selected=selected;
try{
const nextPayload=calculateSky(slot,selected,handoff.date,handoff.time,{replaceExisting:true});
if(handoff.name){nextPayload.name=handoff.name;nextPayload.title=handoff.name;nextPayload.displayName=handoff.name;nextPayload.skyName=handoff.name}
// Chiron is optional when the local ephemeris cannot cover this date.
if(window.RelphiChironEphemeris)await window.RelphiChironEphemeris.completePayload(nextPayload);
// A sky without Chiron remains valid; never synthesize a position.
if(choice.clearBoth){localStorage.removeItem(SLOT_KEYS.A);localStorage.removeItem(SLOT_KEYS.B)}
writeJson(SLOT_KEYS[slot],nextPayload);
const hasB=!choice.clearBoth&&(slot==='B'||slotHasPlacements('B'));
if(window.RelphiSkyStartupMode){
window.RelphiSkyStartupMode.writeMode(hasB?'comparison':'single');
window.RelphiSkyStartupMode.syncRoot();
}
if(choice.clearBoth)dispatchSlotChange('B');
dispatchSlotChange(slot);
window.dispatchEvent(new CustomEvent('relphi:sky-working-copy-updated',{detail:{slot,source:'planetary-hours',dateTime:handoff.dateTime,location:handoff.location}}));
window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name:nextPayload.name||`Sky ${slot}`,source:'planetary-hours'}}));
scheduleSummary(slot,true);
requestAnimationFrame(()=>window.RelphiSkyCardShell?.openDrawer?.(slot,'placements'));
cleanPlanetaryHoursHandoffUrl();
}catch(error){
console.error(error);
planetaryHoursHandoffConsumed=false;
const refs=shell(slot);
if(refs)status(slot,error.message||'The Planetary Hours sky could not be built.',true);
}
}
function schedulePlanetaryHoursHandoff(){
  if(!readPlanetaryHoursHandoff())return;
  let attempts=0;
  const run=()=>{
    attempts+=1;
    const ready=!!(window.Astronomy&&window.luxon?.DateTime&&window.RelphiHouseSystems?.calculateCusps&&window.RelphiChironEphemeris&&window.RelphiSkyCardShell);
    if(ready){void applyPlanetaryHoursHandoff();return}
    if(attempts<120)setTimeout(run,50);
  };
  run();
}
window.addEventListener('storage',event=>{if(!event.key||Object.values(SLOT_KEYS).includes(event.key)){['A','B'].forEach(slot=>{window.RelphiSkyCardShell?.sync?.(slot,payload(slot));scheduleSummary(slot)})}});
window.addEventListener('relphi:sky-foundation-ready',()=>{scheduleSummary('A');scheduleSummary('B')});
window.addEventListener('relphi:sky-name-updated',event=>{const slot=event.detail?.slot;if(SLOT_KEYS[slot]){window.RelphiSkyCardShell?.sync?.(slot,payload(slot));scheduleSummary(slot,true)}});
window.addEventListener('resize',()=>{['A','B'].forEach(slot=>{const svg=shell(slot)?.heptagram;if(svg&&svg.dataset.canonicalSourceReady==='true')svg.setAttribute('viewBox',window.matchMedia?.('(max-width:620px)')?.matches?'0 -8 360 368':'0 0 360 360')})},{passive:true});
function recoverWhereWhen(){reconcileWhereWhenTransaction();['A','B'].forEach(slot=>{window.RelphiSkyCardShell?.ensure?.(slot,payload(slot));scheduleSummary(slot,true)})}
function start(){installStyles();['A','B'].forEach(slot=>{freezeLegacyLiveSky(slot);shell(slot);scheduleSummary(slot)});schedulePlanetaryHoursHandoff()}
window.addEventListener('relphi:sky-session-recovered',recoverWhereWhen);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();