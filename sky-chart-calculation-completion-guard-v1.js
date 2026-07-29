// Reconciles a completed enrichment payload with the Sky Builder after an early partial finish.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;

  const STATE_KEY='relphiSkyBuilderV4State';
  const SLOT_KEY={skyA:'relphiSkyChartA',skyB:'relphiSkyChartB'};
  const RELOAD_KEY='relphiSkyCompletionReloadV1';
  let timer=0;
  let stopped=false;

  function read(store,key,fallback){try{const raw=store.getItem(key);return raw?JSON.parse(raw):fallback}catch(_){return fallback}}
  function count(payload){const map=payload&&(payload.placements||payload);if(!map||typeof map!=='object'||Array.isArray(map))return 0;return Object.values(map).filter(function(item){return item&&typeof item==='object'&&!Array.isArray(item)&&(String(item.sign||'').trim()||(item.degree!==''&&item.degree!=null&&Number.isFinite(Number(item.degree))))}).length}
  function signature(payload){const map=payload&&(payload.placements||payload)||{};return Object.keys(map).sort().map(function(key){const p=map[key]||{};return [key,p.sign||'',p.degree??'',p.minute??'',p.house??'',p.retrograde?'R':''].join(':')}).join('|')}
  function visibleCount(slot){const panel=document.querySelector('.relphi-v4-sky-panel[data-slot="'+slot+'"]');if(!panel)return 0;const match=(panel.querySelector('.relphi-v4-panel-copy>p')?.textContent||'').match(/\d+/);return match?Number(match[0]):0}
  function reconcile(slot){
    const payload=read(localStorage,SLOT_KEY[slot],null);
    if(count(payload)<20)return false;
    const currentVisible=visibleCount(slot);
    const state=read(sessionStorage,STATE_KEY,null);
    if(!state||typeof state!=='object')return false;
    const stateCount=count(state[slot]);
    if(stateCount>=20&&(!currentVisible||currentVisible>=20))return false;
    state[slot]=payload;
    state.step=count(state.skyB)>=1?'completeBoth':'completeA';
    state.calculating=false;
    state.beforeSignature='';
    try{sessionStorage.setItem(STATE_KEY,JSON.stringify(state))}catch(_){return false}
    const marker=slot+'|'+signature(payload);
    if(sessionStorage.getItem(RELOAD_KEY)===marker)return false;
    sessionStorage.setItem(RELOAD_KEY,marker);
    location.reload();
    return true;
  }
  function check(){
    if(stopped)return;
    if(reconcile('skyA')||reconcile('skyB'))return;
    timer=setTimeout(check,200);
  }
  function stop(){stopped=true;clearTimeout(timer)}
  document.addEventListener('relphi:extra-points-updated',function(event){
    const key=event.detail&&event.detail.key;
    const slot=key==='relphiSkyChartB'?'skyB':key==='relphiSkyChartA'?'skyA':'';
    if(slot&&reconcile(slot))stop();
  });
  window.addEventListener('beforeunload',stop,{once:true});
  setTimeout(check,50);
  setTimeout(stop,12000);
})();