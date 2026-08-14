// Keep the visible interactive Sky-card title outside the foundation renderer's owned name node.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyCardTitleIntegrityV1)return;
  window.__relphiSkyCardTitleIntegrityV1=true;

  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const GENERIC=new Set(['','current sky','sky a','sky b','standalone sky','comparison','unnamed sky','untitled sky','unsaved sky']);
  const STYLE_ID='skyCardStableTitleV2';
  let queued=false;

  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #skyFoundationA>.sky-foundation-heading>.sky-foundation-name,
      #skyFoundationB>.sky-foundation-heading>.sky-foundation-name{
        display:none!important;
      }
      #skyFoundationA>.sky-foundation-heading>.sky-card-title-stable,
      #skyFoundationB>.sky-foundation-heading>.sky-card-title-stable{
        grid-column:2!important;
        grid-row:1!important;
        display:block!important;
        min-width:0!important;
        overflow:hidden!important;
        padding:0 .45rem 0 .8rem!important;
        margin:0!important;
      }
      #skyFoundationA>.sky-foundation-heading>.sky-card-title-stable>.sky-saved-name-trigger,
      #skyFoundationB>.sky-foundation-heading>.sky-card-title-stable>.sky-saved-name-trigger{
        width:100%!important;
        min-width:0!important;
      }
    `;
    document.head.appendChild(style);
  }
  function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
  function normalize(value){return String(value||'').trim().toLowerCase().replace(/\s+/g,' ')}
  function nameFor(slot){
    const value=read(slot),metadata=value?.metadata&&typeof value.metadata==='object'?value.metadata:{},profile=value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{};
    for(const candidate of [metadata.savedSkyName,value?.name,value?.displayName,value?.skyName,value?.title,profile.name,profile.title]){
      const name=String(candidate||'').trim();
      if(name&&!GENERIC.has(normalize(name)))return name;
    }
    const raw=profile.instant||profile.dateTime||value?.instant||value?.dateTime;
    if(raw){const date=new Date(raw);if(!Number.isNaN(date.getTime())&&Math.abs(Date.now()-date.getTime())<10*60*1000)return'Now'}
    return'Unsaved sky';
  }
  function saved(value){
    const metadata=value?.metadata&&typeof value.metadata==='object'?value.metadata:{};
    return!!String(metadata.savedSkyId||metadata.savedSkyName||'').trim();
  }
  function ensure(slot){
    const panel=document.getElementById(`skyFoundation${slot}`),heading=panel?.querySelector(':scope > .sky-foundation-heading');
    const source=heading?.querySelector(':scope > .sky-foundation-name');
    if(!heading||!source)return;
    installStyle();

    // The foundation renderer owns `source` and may replace its text at any time.
    // The visible title therefore lives in a sibling host that the renderer never queries or rewrites.
    let host=heading.querySelector(':scope > .sky-card-title-stable');
    if(!host){
      host=document.createElement('span');
      host.className='sky-card-title-stable';
      heading.insertBefore(host,source);
    }
    let button=host.querySelector(':scope > [data-saved-sky-trigger]');
    if(!button){
      host.replaceChildren();
      button=document.createElement('button');
      button.type='button';
      button.className='sky-saved-name-trigger';
      button.dataset.savedSkyTrigger=slot;
      button.setAttribute('aria-haspopup','dialog');
      button.setAttribute('aria-expanded','false');
      const label=document.createElement('span');label.className='sky-saved-name-label';
      const chevron=document.createElement('span');chevron.className='sky-saved-name-chevron';chevron.setAttribute('aria-hidden','true');
      button.append(label,chevron);host.appendChild(button);
    }

    const value=read(slot),name=nameFor(slot),label=button.querySelector('.sky-saved-name-label');
    if(label&&label.textContent!==name)label.textContent=name;
    button.classList.toggle('is-saved',saved(value));
    button.title=saved(value)?name:`${name} · open Saved skies`;
    button.setAttribute('aria-label',`${name}. Open Saved skies for Sky ${slot}.`);
  }
  function run(){queued=false;ensure('A');ensure('B')}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(run)}
  function start(){
    installStyle();run();
    const root=document.getElementById('skyFoundationRoot')||document.body;
    new MutationObserver(records=>{
      if(records.some(record=>{
        const heading=record.target?.closest?.('#skyFoundationA > .sky-foundation-heading,#skyFoundationB > .sky-foundation-heading');
        if(heading)return true;
        return[...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===1&&node.closest?.('#skyFoundationA > .sky-foundation-heading,#skyFoundationB > .sky-foundation-heading'));
      }))schedule();
    }).observe(root,{childList:true,subtree:true});
    window.addEventListener('storage',event=>{if(!event.key||Object.values(KEYS).includes(event.key))schedule()});
    ['relphi:sky-foundation-ready','relphi:sky-name-updated','relphi:saved-sky-library-changed','relphi:saved-sky-active-changed'].forEach(name=>window.addEventListener(name,schedule));
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
