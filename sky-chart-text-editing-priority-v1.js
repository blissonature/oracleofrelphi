// Give native Sky Chart form editing priority over chart rendering, especially on mobile.
// Keyboard and picker viewport changes must not wake chart/layout controllers while an editable
// Where and When or Saved Sky field owns focus.
(function(){
  'use strict';
  if(window.__relphiSkyTextEditingPriorityV1)return;
  window.__relphiSkyTextEditingPriorityV1=true;

  const EDITOR_SELECTOR=[
    '.sky-where-when-editor input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([readonly]):not([disabled])',
    '.sky-where-when-editor textarea:not([readonly]):not([disabled])',
    '.sky-where-when-editor select:not([disabled])',
    '[data-save-sky-name-input]:not([disabled])',
    '[data-saved-name-input]:not([disabled])',
    '[data-sky-command-save-name]:not([disabled])'
  ].join(',');
  const NAME_SELECTOR='[data-ww-sky-name],[data-save-sky-name-input],[data-saved-name-input],[data-sky-command-save-name]';
  const PASSIVE_TEXT_SELECTOR=[
    '.sky-where-when-editor [data-ww-field="location-query"]',
    '.sky-where-when-editor [data-ww-sky-name]',
    '[data-save-sky-name-input]',
    '[data-saved-name-input]',
    '[data-sky-command-save-name]'
  ].join(',');
  const root=document.documentElement;
  const deferred=new Set();
  let active=null;
  let releaseTimer=0;

  function isEditingField(node){return node instanceof HTMLElement&&node.matches(EDITOR_SELECTOR)}
  function isPassiveText(node){return node instanceof HTMLElement&&node.matches(PASSIVE_TEXT_SELECTOR)}
  function editing(){return !!active&&active.isConnected&&document.activeElement===active}

  function begin(control){
    clearTimeout(releaseTimer);
    active=control;
    // Name fields get ordinary prose editing. Other Where and When controls keep their native
    // input semantics (search, date, time, number, select, etc.).
    if(control.matches(NAME_SELECTOR)){
      control.removeAttribute('maxlength');
      control.setAttribute('spellcheck','true');
      control.setAttribute('autocorrect','on');
      control.setAttribute('autocapitalize','sentences');
    }
    root.dataset.skyTextEditing='true';
    root.dataset.skyTextEditingField=control.getAttribute('data-ww-field')||
      (control.matches(NAME_SELECTOR)?'sky-name':control.tagName.toLowerCase());
  }

  function finish(){
    if(editing())return;
    active=null;
    root.removeAttribute('data-sky-text-editing');
    root.removeAttribute('data-sky-text-editing-field');
    const needsFoundation=deferred.size>0;
    deferred.clear();
    // Let the keyboard/native picker and visual viewport finish settling before one catch-up pass.
    if(needsFoundation)requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(root.dataset.skyTextEditing==='true')return;
      window.dispatchEvent(new CustomEvent('relphi:sky-text-editing-ended'));
      window.dispatchEvent(new Event('resize'));
    }));
    else window.dispatchEvent(new CustomEvent('relphi:sky-text-editing-ended'));
  }

  document.addEventListener('focusin',event=>{if(isEditingField(event.target))begin(event.target)},true);
  document.addEventListener('focusout',event=>{
    if(event.target!==active)return;
    clearTimeout(releaseTimer);
    releaseTimer=window.setTimeout(finish,0);
  },true);

  // Location/name fields are passive while text is being composed. Search/save/submit work
  // happens on explicit actions, so ordinary keystrokes and input events must not fan out
  // through unrelated document-level Sky Chart controllers. Default browser editing remains
  // untouched. Enter is allowed through for established search/submit behavior.
  window.addEventListener('keydown',event=>{
    if(!isPassiveText(event.target)||event.key==='Enter')return;
    event.stopPropagation();
  },true);
  window.addEventListener('input',event=>{
    if(!isPassiveText(event.target))return;
    event.stopPropagation();
  },true);

  // These application-level events can fan out into wheel/list recomposition. Suppress only
  // while a native editor owns focus; do not prevent change, pointer, selection, or the native
  // editing behavior of the control itself.
  const expensive=['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-foundation-filter-changed','relphi:sky-orb-limit-changed'];
  expensive.forEach(name=>window.addEventListener(name,event=>{
    if(!editing())return;
    deferred.add(name);
    event.stopImmediatePropagation();
  },true));

  function suppressViewportFanout(event){
    if(!editing())return;
    deferred.add('viewport');
    event.stopImmediatePropagation();
  }
  window.addEventListener('resize',suppressViewportFanout,true);
  window.addEventListener('scroll',suppressViewportFanout,true);
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',suppressViewportFanout,true);
    window.visualViewport.addEventListener('scroll',suppressViewportFanout,true);
  }
})();
