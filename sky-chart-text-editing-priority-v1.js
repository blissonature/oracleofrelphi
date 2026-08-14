// Give native Sky-name text editing priority over Sky Chart rendering, especially on mobile.
// Keyboard viewport changes must not wake chart/layout controllers while a name field is focused.
(function(){
  'use strict';
  if(window.__relphiSkyTextEditingPriorityV1)return;
  window.__relphiSkyTextEditingPriorityV1=true;

  const SELECTOR='[data-ww-sky-name],[data-save-sky-name-input],[data-saved-name-input]';
  const root=document.documentElement;
  const deferred=new Set();
  let active=null;
  let releaseTimer=0;

  function isNameField(node){return node instanceof HTMLInputElement&&node.matches(SELECTOR)}
  function editing(){return !!active&&active.isConnected&&document.activeElement===active}

  function begin(input){
    clearTimeout(releaseTimer);
    active=input;
    // Do not constrain a descriptive Sky name. Let the browser provide normal text editing.
    input.removeAttribute('maxlength');
    input.setAttribute('spellcheck','true');
    input.setAttribute('autocorrect','on');
    input.setAttribute('autocapitalize','sentences');
    root.dataset.skyTextEditing='true';
  }

  function finish(){
    if(editing())return;
    active=null;
    root.removeAttribute('data-sky-text-editing');
    const needsFoundation=deferred.size>0;
    deferred.clear();
    // Let the keyboard/visual viewport finish settling before one catch-up pass.
    if(needsFoundation)requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(root.dataset.skyTextEditing==='true')return;
      window.dispatchEvent(new CustomEvent('relphi:sky-text-editing-ended'));
      window.dispatchEvent(new Event('resize'));
    }));
    else window.dispatchEvent(new CustomEvent('relphi:sky-text-editing-ended'));
  }

  document.addEventListener('focusin',event=>{if(isNameField(event.target))begin(event.target)},true);
  document.addEventListener('focusout',event=>{
    if(event.target!==active)return;
    clearTimeout(releaseTimer);
    releaseTimer=window.setTimeout(finish,0);
  },true);

  // These application-level events can fan out into wheel/list recomposition. Suppress only
  // while the native text editor owns focus; do not prevent any native input or pointer event.
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
