import{createStore,modeOf}from'./core/store.mjs';
import{placementEntries,coordinateText,calculateRelationships,houseFor,skyCusps,canonicalId}from'./core/model.mjs';
import{readLibrary,loadSavedSky,saveNewSky,updateSavedSky,isSavedSky,nameExists,suggestUniqueName,readWorkspace,saveWorkspace}from'./core/storage.mjs';
import{calculateHereNow,calculateSky,currentLocationPacket,exactInstant}from'./core/astronomy.mjs';
import{renderWheel,applyTransientFocus}from'./ui/wheel.mjs';

const root=document.getElementById('skyChartApp'),dialog=document.getElementById('skyChartDialog'),dialogBody=document.getElementById('skyDialogBody'),dialogTitle=document.getElementById('skyDialogTitle');
const store=createStore(readWorkspace()||{});
const SLOT_COLOR={A:'#c9211e',B:'#2462d0'};
const GLYPH_ID={Ascendant:'asc',Descendant:'dsc',Midheaven:'mc','Imum Coeli':'ic','North Node':'north-node','South Node':'south-node','Part of Fortune':'part-of-fortune',Vertex:'vertex',Lilith:'lilith',Chiron:'chiron'};
const HOUSE_SYSTEMS=[['whole-sign','Whole Sign'],['equal-house','Equal House'],['porphyry','Porphyry'],['placidus','Placidus'],['alcabitius','Alcabitius'],['regiomontanus','Regiomontanus'],['campanus','Campanus'],['koch','Koch']];
let lastStructure={A:undefined,B:undefined,orb:undefined};

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const formatMeta=sky=>{const p=sky?.calcProfile||{};return[String(p.dateTime||'').replace('T',' '),String(p.location||'')].filter(Boolean).join(' · ')};
const savedRef=record=>String(record?.id||record?.metadata?.savedSkyId||'');
const nowLocalValue=()=>{const d=new Date(),off=d.getTimezoneOffset(),local=new Date(d.getTime()-off*60000);return local.toISOString().slice(0,16)};

function slotStatus(sky){
  const state=isSavedSky(sky);if(state.saved)return state.dirty?'Saved · unsaved changes':'Saved';
  return sky?.name==='Now'?'Temporary · Now':'Not saved';
}
function glyphId(name){return GLYPH_ID[name]||canonicalId(name)}
function ledgerHtml(slot,sky,state){
  const cusps=skyCusps(sky),selected=state.selectedPlacement;
  return`<div class="sky-ledger">${placementEntries(sky).map(item=>{
    const key=`${slot}:${item.id}`,house=item.house||houseFor(item.longitude,cusps)||'—',active=selected?.slot===slot&&selected?.id===item.id;
    return`<div class="sky-ledger-row${active?' is-selected':''}" data-placement-key="${escapeHtml(key)}" tabindex="0"><svg class="sky-ledger-glyph" viewBox="-18 -18 36 36" data-glyph="${escapeHtml(glyphId(item.name))}" data-glyph-color="${SLOT_COLOR[slot]}" aria-hidden="true"></svg><span class="sky-ledger-name">${escapeHtml(item.name)}</span><span class="sky-ledger-coordinate">${escapeHtml(coordinateText(item.longitude))}</span><span class="sky-ledger-house">H${house}</span></div>`;
  }).join('')}</div>`;
}
function slotHtml(slot,sky,state){
  const canAdd=slot==='A'||!!state.slots.A;
  if(!sky)return`<aside class="sky-slot" data-slot="${slot}"><div class="sky-slot-head"><div class="sky-slot-title"><span class="sky-slot-dot"></span><span>Sky ${slot}</span></div></div><div class="sky-empty-slot">${canAdd?`<button class="sky-add-button" type="button" data-add-sky="${slot}"><span class="plus">＋</span>Add Sky ${slot}</button>`:'<span class="sky-status">Add Sky A first.</span>'}</div></aside>`;
  const saved=isSavedSky(sky),status=slotStatus(sky);
  return`<aside class="sky-slot" data-slot="${slot}"><div class="sky-slot-head"><div class="sky-slot-title"><span class="sky-slot-dot"></span><span class="sky-slot-name" title="${escapeHtml(sky.name)}">${escapeHtml(sky.name)}</span></div><div class="sky-slot-actions">${(!saved.saved||saved.dirty)?`<button class="sky-text-button" type="button" data-save-slot="${slot}">${saved.dirty?'Save changes':'Save'}</button>`:''}<button class="sky-icon-button" type="button" data-replace-slot="${slot}" aria-label="Replace Sky ${slot}" title="Replace">↻</button><button class="sky-icon-button" type="button" data-clear-slot="${slot}" aria-label="Clear Sky ${slot}" title="Clear">×</button></div></div><div class="sky-slot-body"><div class="sky-status"><strong>${escapeHtml(status)}</strong>${formatMeta(sky)?` · ${escapeHtml(formatMeta(sky))}`:''}</div>${ledgerHtml(slot,sky,state)}</div></aside>`;
}
function relationshipsHtml(state){
  if(!state.slots.A)return'';
  const relationships=calculateRelationships(state.slots.A,state.slots.B,state.orb);
  if(!relationships.length)return`<section class="sky-relationships"><h2>${state.slots.B?'Sky A ↔ Sky B':'Relationships within Sky A'}</h2><p class="sky-status">No relationships fall within the selected orb.</p></section>`;
  return`<section class="sky-relationships"><h2>${state.slots.B?'Sky A ↔ Sky B':'Relationships within Sky A'} · ${relationships.length}</h2><div class="sky-rel-list">${relationships.slice(0,120).map(rel=>`<button type="button" class="sky-rel${state.selectedRelationship===rel.id?' is-selected':''}" data-relationship-id="${escapeHtml(rel.id)}"><strong>${escapeHtml(rel.left.name)} ${escapeHtml(rel.label)} ${escapeHtml(rel.right.name)}</strong><span>${rel.orb.toFixed(2)}° orb</span></button>`).join('')}</div></section>`;
}
function stageHtml(state){
  const mode=modeOf(state),title=mode==='comparison'?'Comparison':mode==='single'?'Sky A':'Sky Chart';
  return`<section class="sky-stage"><div class="sky-stage-head"><h2>${title}</h2>${state.slots.A?`<div class="sky-stage-controls"><label>Orb <select data-orb>${[1,2,3,5,8].map(value=>`<option value="${value}"${Number(state.orb)===value?' selected':''}>${value}°</option>`).join('')}</select></label></div>`:''}</div><div id="skyWheelMount" class="sky-wheel-wrap"></div></section>`;
}
async function hydrateGlyphs(scope){
  const component=window.RelphiGlyphComponent,registry=window.RelphiGlyphRegistry;if(!component?.draw||!registry)return;
  await Promise.all(Array.from(scope.querySelectorAll('svg[data-glyph]')).map(async host=>{
    const entry=registry.resolve?.(host.dataset.glyph)||registry.get?.(host.dataset.glyph);if(!entry)return;
    try{await component.draw(host,entry.id,{radius:13,padding:1,color:host.dataset.glyphColor||'#4a332e'})}catch{}
  }));
}
function syncSelection(state){
  const placementKey=state.selectedPlacement?`${state.selectedPlacement.slot}:${state.selectedPlacement.id}`:'';
  root.querySelectorAll('[data-placement-key]').forEach(node=>node.classList.toggle('is-selected',!!placementKey&&node.dataset.placementKey===placementKey));
  root.querySelectorAll('[data-relationship-id]').forEach(node=>node.classList.toggle('is-selected',!!state.selectedRelationship&&node.dataset.relationshipId===state.selectedRelationship));
  root.querySelectorAll('.aspect-line').forEach(node=>node.classList.toggle('is-selected',!!state.selectedRelationship&&node.dataset.relationshipId===state.selectedRelationship));
}
function renderWorkspace(state){
  root.innerHTML=`<div class="sky-workspace">${slotHtml('A',state.slots.A,state)}${stageHtml(state)}${slotHtml('B',state.slots.B,state)}</div>${relationshipsHtml(state)}`;
  const mount=document.getElementById('skyWheelMount');renderWheel(mount,{skyA:state.slots.A,skyB:state.slots.B,orb:state.orb,selectedPlacement:state.selectedPlacement,selectedRelationship:state.selectedRelationship});
  hydrateGlyphs(root);
}
function render(state){
  const structural=lastStructure.A!==state.slots.A||lastStructure.B!==state.slots.B||lastStructure.orb!==state.orb;
  if(structural){renderWorkspace(state);lastStructure={A:state.slots.A,B:state.slots.B,orb:state.orb}}else syncSelection(state);
  renderDialog(state.dialog);
}

function choice(title,copy,attr){return`<button type="button" class="sky-choice" ${attr}><strong>${escapeHtml(title)}</strong><span>${escapeHtml(copy)}</span></button>`}
function setDialog(title,html){dialogTitle.textContent=title;dialogBody.innerHTML=html;if(!dialog.open)dialog.showModal()}
function renderDialog(spec){
  if(!spec){if(dialog.open)dialog.close();return}
  const slot=spec.slot==='B'?'B':'A';
  if(spec.type==='add'&&spec.step==='root'){
    setDialog(`Add Sky ${slot}`,`<div class="sky-choice-grid">${choice('Existing','Choose one of your saved skies.',`data-add-existing="${slot}"`)}${choice('New','Create a sky from a new time and place.',`data-add-new="${slot}"`)}</div>`);return;
  }
  if(spec.type==='add'&&spec.step==='new'){
    setDialog(`New Sky ${slot}`,`<div class="sky-choice-grid">${choice('Here and Now','Use your current time and device location.',`data-new-now="${slot}"`)}${choice('Enter Exactly Where and When','Choose the exact date, time, location, time zone, and house system.',`data-new-exact="${slot}"`)}</div><div class="sky-dialog-actions"><button class="sky-text-button" type="button" data-dialog-back="${slot}">Back</button></div>`);return;
  }
  if(spec.type==='add'&&spec.step==='existing'){
    const records=readLibrary();
    setDialog(`Existing Sky → Sky ${slot}`,`${records.length?`<div class="sky-saved-list">${records.map(record=>`<button type="button" class="sky-saved-choice" data-load-saved="${escapeHtml(savedRef(record))}" data-load-slot="${slot}"><strong>${escapeHtml(record.name)}</strong><small>${escapeHtml(formatMeta(record)||'Saved sky')}</small></button>`).join('')}</div>`:'<p class="sky-dialog-note">You do not have any saved skies yet.</p>'}<div class="sky-dialog-actions"><button class="sky-text-button" type="button" data-dialog-back="${slot}">Back</button></div>`);return;
  }
  if(spec.type==='add'&&spec.step==='exact'){
    const systems=HOUSE_SYSTEMS.map(([value,label])=>`<option value="${value}"${value==='whole-sign'?' selected':''}>${label}</option>`).join('');
    setDialog(`Exact Sky ${slot}`,`<form class="sky-form" data-exact-form data-slot="${slot}"><label>Optional working name<input name="name" maxlength="80" placeholder="Unsaved sky"></label><label>Date and time<input name="dateTime" type="datetime-local" value="${nowLocalValue()}" required></label><label>Location name<input name="location" autocomplete="off" placeholder="Salt Lake City, Utah"></label><div class="sky-form-row"><label>Latitude<input name="latitude" type="number" step="any" min="-90" max="90" required></label><label>Longitude<input name="longitude" type="number" step="any" min="-180" max="180" required></label></div><label>Time zone<input name="timeZone" value="${escapeHtml(Intl.DateTimeFormat().resolvedOptions().timeZone||'')}" placeholder="America/Denver" required></label><label>House system<select name="houseSystem">${systems}</select></label><div><button type="button" class="sky-text-button" data-fill-current-location>Use my current location</button></div><p class="sky-dialog-note">This creates the sky first. Saving it is a separate action.</p><p class="sky-dialog-error" data-form-status></p><div class="sky-dialog-actions"><button class="sky-text-button" type="button" data-dialog-back-new="${slot}">Back</button><button class="sky-primary-button" type="submit">Create Sky ${slot}</button></div></form>`);return;
  }
  if(spec.type==='save'){
    const sky=store.getState().slots[slot],candidate=sky?.name&&sky.name!=='Now'&&sky.name!=='Unsaved sky'?sky.name:'';
    setDialog(`Save Sky ${slot}`,`<form class="sky-form" data-save-form data-slot="${slot}"><label>Name this sky<input name="name" maxlength="80" autocomplete="off" value="${escapeHtml(candidate)}" required></label><p class="sky-dialog-error" data-name-status></p><div class="sky-dialog-actions"><button class="sky-text-button" type="button" data-dialog-close>Cancel</button><button class="sky-primary-button" type="submit" data-save-submit>Save Sky</button></div></form>`);requestAnimationFrame(()=>{const input=dialogBody.querySelector('input[name="name"]');input?.focus({preventScroll:true});input?.select();validateSaveName(input)});return;
  }
}
function validateSaveName(input){
  if(!input)return;const records=readLibrary(),name=input.value.trim(),status=dialogBody.querySelector('[data-name-status]'),submit=dialogBody.querySelector('[data-save-submit]');
  if(!name){status.textContent='Give this sky a name.';submit.disabled=true;return}
  if(nameExists(name,records)){const suggestion=suggestUniqueName(name,records);status.innerHTML=`That name is already in Saved skies. <button type="button" class="sky-text-button" data-name-suggestion="${escapeHtml(suggestion)}">Use “${escapeHtml(suggestion)}”</button>`;submit.disabled=true;return}
  status.textContent='';submit.disabled=false;
}
async function createNow(slot){
  setDialog(`New Sky ${slot}`,`<p class="sky-dialog-note"><span class="sky-spinner"></span>Resolving your current place and calculating the sky…</p>`);
  try{const sky=await calculateHereNow('whole-sign');store.dispatch({type:'SET_SLOT',slot,sky});store.dispatch({type:'CLOSE_DIALOG'})}
  catch(error){setDialog(`New Sky ${slot}`,`<p class="sky-dialog-error">${escapeHtml(error?.code===1?'Location permission was denied.':error?.message||'Here and Now could not be created.')}</p><div class="sky-dialog-actions"><button class="sky-text-button" type="button" data-dialog-back-new="${slot}">Back</button></div>`)}
}

root.addEventListener('click',event=>{
  const add=event.target.closest('[data-add-sky],[data-replace-slot]');if(add){const slot=add.dataset.addSky||add.dataset.replaceSlot;store.dispatch({type:'OPEN_DIALOG',dialog:{type:'add',slot,step:'root'}});return}
  const clear=event.target.closest('[data-clear-slot]');if(clear){store.dispatch({type:'CLEAR_SLOT',slot:clear.dataset.clearSlot});return}
  const save=event.target.closest('[data-save-slot]');if(save){const slot=save.dataset.saveSlot,sky=store.getState().slots[slot],status=isSavedSky(sky);if(status.saved&&status.dirty){const result=updateSavedSky(sky);if(result.ok)store.dispatch({type:'SET_SLOT',slot,sky:result.active})}else store.dispatch({type:'OPEN_DIALOG',dialog:{type:'save',slot}});return}
  const placementNode=event.target.closest('[data-placement-key]');if(placementNode){const[slot,id]=placementNode.dataset.placementKey.split(':');store.dispatch({type:'SELECT_PLACEMENT',value:{slot,id}});return}
  const relationship=event.target.closest('[data-relationship-id]');if(relationship){store.dispatch({type:'SELECT_RELATIONSHIP',value:relationship.dataset.relationshipId});return}
});
root.addEventListener('change',event=>{if(event.target.matches('[data-orb]'))store.dispatch({type:'SET_ORB',value:event.target.value})});
root.addEventListener('pointerover',event=>{const node=event.target.closest('[data-placement-key]');if(node)applyTransientFocus(root,node.dataset.placementKey)});
root.addEventListener('pointerout',event=>{const node=event.target.closest('[data-placement-key]');if(node&&!node.contains(event.relatedTarget))applyTransientFocus(root,'')});
root.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('.sky-ledger-row,[data-placement-key].placement')){event.preventDefault();event.target.click()}});

dialog.addEventListener('cancel',event=>{event.preventDefault();store.dispatch({type:'CLOSE_DIALOG'})});
dialog.addEventListener('click',event=>{
  if(event.target.closest('[data-dialog-close]')){store.dispatch({type:'CLOSE_DIALOG'});return}
  const existing=event.target.closest('[data-add-existing]');if(existing){store.dispatch({type:'OPEN_DIALOG',dialog:{type:'add',slot:existing.dataset.addExisting,step:'existing'}});return}
  const fresh=event.target.closest('[data-add-new]');if(fresh){store.dispatch({type:'OPEN_DIALOG',dialog:{type:'add',slot:fresh.dataset.addNew,step:'new'}});return}
  const back=event.target.closest('[data-dialog-back]');if(back){store.dispatch({type:'OPEN_DIALOG',dialog:{type:'add',slot:back.dataset.dialogBack,step:'root'}});return}
  const backNew=event.target.closest('[data-dialog-back-new]');if(backNew){store.dispatch({type:'OPEN_DIALOG',dialog:{type:'add',slot:backNew.dataset.dialogBackNew,step:'new'}});return}
  const now=event.target.closest('[data-new-now]');if(now){createNow(now.dataset.newNow);return}
  const exact=event.target.closest('[data-new-exact]');if(exact){store.dispatch({type:'OPEN_DIALOG',dialog:{type:'add',slot:exact.dataset.newExact,step:'exact'}});return}
  const saved=event.target.closest('[data-load-saved]');if(saved){const record=readLibrary().find(item=>savedRef(item)===saved.dataset.loadSaved);if(record){store.dispatch({type:'SET_SLOT',slot:saved.dataset.loadSlot,sky:loadSavedSky(record)});store.dispatch({type:'CLOSE_DIALOG'})}return}
  const suggestion=event.target.closest('[data-name-suggestion]');if(suggestion){const input=dialogBody.querySelector('input[name="name"]');input.value=suggestion.dataset.nameSuggestion;validateSaveName(input);input.focus();return}
  const fill=event.target.closest('[data-fill-current-location]');if(fill){const form=fill.closest('form'),status=form.querySelector('[data-form-status]');fill.disabled=true;status.innerHTML='<span class="sky-spinner"></span>Resolving current location…';currentLocationPacket().then(packet=>{form.elements.location.value=packet.location;form.elements.latitude.value=packet.latitude;form.elements.longitude.value=packet.longitude;form.elements.timeZone.value=packet.timeZone;status.textContent=''}).catch(error=>status.textContent=error.message).finally(()=>fill.disabled=false);return}
});
dialog.addEventListener('input',event=>{if(event.target.matches('[data-save-form] input[name="name"]'))validateSaveName(event.target)});
dialog.addEventListener('submit',async event=>{
  event.preventDefault();const form=event.target;
  if(form.matches('[data-save-form]')){const slot=form.dataset.slot,sky=store.getState().slots[slot],name=new FormData(form).get('name'),result=saveNewSky(sky,name);if(result.ok){store.dispatch({type:'SET_SLOT',slot,sky:result.active});store.dispatch({type:'CLOSE_DIALOG'})}else{const status=form.querySelector('[data-name-status]');status.textContent=result.message||'Sky could not be saved.'}return}
  if(form.matches('[data-exact-form]')){
    const slot=form.dataset.slot,data=Object.fromEntries(new FormData(form)),status=form.querySelector('[data-form-status]'),submit=form.querySelector('[type="submit"]');submit.disabled=true;status.innerHTML='<span class="sky-spinner"></span>Calculating…';
    try{const instant=await exactInstant(data.dateTime,data.timeZone),sky=calculateSky({name:data.name||'Unsaved sky',instant,localDateTime:data.dateTime,latitude:data.latitude,longitude:data.longitude,location:data.location,timeZone:data.timeZone,houseSystem:data.houseSystem,source:'exact-vnext'});store.dispatch({type:'SET_SLOT',slot,sky});store.dispatch({type:'CLOSE_DIALOG'})}
    catch(error){status.textContent=error.message||'The sky could not be calculated.';submit.disabled=false}
  }
});

store.subscribe(state=>{saveWorkspace(state);render(state)});
render(store.getState());
