// Sky Chart comparison-wheel snapshot export: one-click desktop download, iOS-safe two-step share.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkySnapshotV1)return;
  window.__relphiSkySnapshotV1=true;

  const PREPARE_ID='skyChartPrepareSnapshot';
  const SAVE_ID='skyChartSaveSnapshot';
  const STATUS_ID='skyChartSnapshotStatus';
  const LIB_URL='https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js';
  let libraryPromise=null;
  let pendingFile=null;
  let pendingUrl='';
  let preparing=false;

  function isIOS(){
    const ua=String(navigator.userAgent||'');
    return /iPad|iPhone|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  }

  function loadLibrary(){
    if(window.htmlToImage?.toPng)return Promise.resolve(window.htmlToImage);
    if(libraryPromise)return libraryPromise;
    libraryPromise=new Promise((resolve,reject)=>{
      const existing=document.querySelector(`script[src="${LIB_URL}"]`);
      if(existing){
        if(window.htmlToImage?.toPng)return resolve(window.htmlToImage);
        existing.addEventListener('load',()=>window.htmlToImage?.toPng?resolve(window.htmlToImage):reject(new Error('Snapshot library loaded without becoming available.')),{once:true});
        existing.addEventListener('error',()=>reject(new Error('Snapshot library did not load.')),{once:true});
        return;
      }
      const script=document.createElement('script');
      script.src=LIB_URL;script.async=true;script.crossOrigin='anonymous';
      script.addEventListener('load',()=>window.htmlToImage?.toPng?resolve(window.htmlToImage):reject(new Error('Snapshot library loaded without becoming available.')),{once:true});
      script.addEventListener('error',()=>reject(new Error('Snapshot library did not load.')),{once:true});
      document.head.appendChild(script);
    });
    return libraryPromise;
  }

  function prewarmLibrary(){
    const warm=()=>loadLibrary().catch(()=>{});
    if('requestIdleCallback'in window)requestIdleCallback(warm,{timeout:2500});
    else setTimeout(warm,900);
  }

  function safeName(value,fallback){
    return String(value||fallback).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48)||fallback;
  }
  function read(slot){try{return JSON.parse(localStorage.getItem(slot==='A'?'relphiSkyChartA':'relphiSkyChartB')||'null')}catch(_){return null}}
  function skyName(slot){
    const value=read(slot)||{},metadata=value.metadata&&typeof value.metadata==='object'?value.metadata:{};
    return metadata.savedSkyName||value.name||value.displayName||value.skyName||value.title||`sky-${slot.toLowerCase()}`;
  }
  function filename(){
    const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/T(\d{4}).*/, '-$1');
    return `${safeName(skyName('A'),'sky-a')}-vs-${safeName(skyName('B'),'sky-b')}-${stamp}.png`;
  }

  function status(text,error){
    const node=document.getElementById(STATUS_ID);if(!node)return;
    node.textContent=text||'';node.dataset.error=error?'true':'false';
  }
  function clearUrl(){if(pendingUrl){URL.revokeObjectURL(pendingUrl);pendingUrl=''}}
  function invalidate(){
    pendingFile=null;clearUrl();
    const save=document.getElementById(SAVE_ID);if(save)save.hidden=true;
    status('',false);
  }

  async function dataUrlToFile(dataUrl,name){
    const response=await fetch(dataUrl),blob=await response.blob();
    return new File([blob],name,{type:'image/png',lastModified:Date.now()});
  }

  function downloadFile(file){
    const url=URL.createObjectURL(file),a=document.createElement('a');
    a.href=url;a.download=file.name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }

  async function prepare(){
    if(preparing)return;
    const wheel=document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel');
    if(!wheel){status('The comparison wheel is not ready yet.',true);return}
    preparing=true;invalidate();
    const button=document.getElementById(PREPARE_ID);
    if(button){button.disabled=true;button.setAttribute('aria-busy','true')}
    status(isIOS()?'Preparing PNG…':'Preparing download…',false);
    try{
      window.RelphiPlacementCollisionOrder?.arrangeCurrent?.();
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      if(document.fonts?.ready)await document.fonts.ready.catch(()=>{});
      const htmlToImage=await loadLibrary();
      const box=wheel.viewBox?.baseVal;
      const width=Math.max(1,Math.ceil(box?.width||1200));
      const height=Math.max(1,Math.ceil(box?.height||1200));
      const pixelRatio=Math.min(2,Math.max(1,window.devicePixelRatio||1));
      const dataUrl=await htmlToImage.toPng(wheel,{
        cacheBust:false,
        backgroundColor:'#fffdf8',
        width,height,pixelRatio,
        canvasWidth:Math.ceil(width*pixelRatio),
        canvasHeight:Math.ceil(height*pixelRatio),
        skipAutoScale:true,
        includeQueryParams:false,
        style:{width:`${width}px`,height:`${height}px`,maxHeight:'none',overflow:'visible'}
      });
      pendingFile=await dataUrlToFile(dataUrl,filename());
      if(isIOS()){
        const save=document.getElementById(SAVE_ID);if(save)save.hidden=false;
        status('Snapshot ready to share.',false);
      }else{
        downloadFile(pendingFile);
        status('PNG download started.',false);
        pendingFile=null;
      }
    }catch(error){
      console.error('Sky Chart snapshot failed:',error);
      status(`Snapshot failed: ${String(error?.message||error||'unknown error').replace(/\s+/g,' ').slice(0,150)}`,true);
    }finally{
      preparing=false;
      if(button?.isConnected){button.disabled=false;button.removeAttribute('aria-busy')}
    }
  }

  function fallbackOpen(file){
    clearUrl();pendingUrl=URL.createObjectURL(file);
    const opened=window.open(pendingUrl,'_blank','noopener');
    if(!opened)location.href=pendingUrl;
  }

  async function saveIOS(){
    if(!pendingFile){status('Prepare a snapshot first.',true);return}
    const button=document.getElementById(SAVE_ID);if(button)button.disabled=true;
    try{
      if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[pendingFile]}))){
        await navigator.share({files:[pendingFile],title:'Sky Chart snapshot'});
        status('Snapshot sent to the share sheet.',false);
      }else{
        fallbackOpen(pendingFile);
        status('The PNG opened separately so it can be saved.',false);
      }
    }catch(error){
      if(error?.name==='AbortError')status('Share canceled. The snapshot is still ready.',false);
      else{
        console.error('Sky Chart snapshot share failed:',error);
        fallbackOpen(pendingFile);
        status('The PNG opened separately so it can be saved.',false);
      }
    }finally{if(button?.isConnected)button.disabled=false}
  }

  function installStyles(){
    if(document.getElementById('skyChartSnapshotStyles'))return;
    const style=document.createElement('style');style.id='skyChartSnapshotStyles';
    style.textContent=`
      #skyFoundationComparison>.sky-foundation-heading{flex-wrap:wrap}
      #skyFoundationComparison .sky-snapshot-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px;min-width:0}
      #skyFoundationComparison .sky-snapshot-button{appearance:none;border:1px solid rgba(31,27,24,.2);border-radius:999px;background:#fff;color:#2d2824;padding:.34rem .62rem;font:800 .64rem/1 system-ui,sans-serif;white-space:nowrap;cursor:pointer}
      #skyFoundationComparison .sky-snapshot-button:hover,#skyFoundationComparison .sky-snapshot-button:focus-visible{outline:none;border-color:#2462d0;box-shadow:0 0 0 2px rgba(36,98,208,.12)}
      #skyFoundationComparison .sky-snapshot-button:disabled{opacity:.55;cursor:default}
      #${SAVE_ID}{border-color:#2462d0!important;background:#2462d0!important;color:#fff!important}
      #${STATUS_ID}{flex:1 0 100%;min-height:0;color:#665e57;text-align:right;font:650 .6rem/1.2 system-ui,sans-serif}
      #${STATUS_ID}:empty{display:none}
      #${STATUS_ID}[data-error="true"]{color:#b81712}
      @media(max-width:620px){#skyFoundationComparison .sky-snapshot-button{padding:.4rem .58rem;font-size:.62rem}}
    `;
    document.head.appendChild(style);
  }

  function ensureControls(){
    installStyles();
    const heading=document.querySelector('#skyFoundationComparison>.sky-foundation-heading');if(!heading)return;
    let actions=heading.querySelector('.sky-snapshot-actions');
    if(!actions){
      actions=document.createElement('span');actions.className='sky-snapshot-actions';
      const prepareButton=document.createElement('button');prepareButton.type='button';prepareButton.id=PREPARE_ID;prepareButton.className='sky-snapshot-button';prepareButton.textContent='Save Snapshot';prepareButton.title=isIOS()?'Prepare a PNG snapshot of the current comparison wheel':'Download a PNG snapshot of the current comparison wheel';
      const saveButton=document.createElement('button');saveButton.type='button';saveButton.id=SAVE_ID;saveButton.className='sky-snapshot-button';saveButton.textContent='Share PNG';saveButton.title='Share or save the prepared PNG';saveButton.hidden=true;
      prepareButton.addEventListener('click',prepare);saveButton.addEventListener('click',saveIOS);
      actions.append(prepareButton,saveButton);heading.appendChild(actions);
      const state=document.createElement('span');state.id=STATUS_ID;state.setAttribute('role','status');state.setAttribute('aria-live','polite');heading.appendChild(state);
    }
  }

  function start(){
    ensureControls();prewarmLibrary();
    new MutationObserver(ensureControls).observe(document.getElementById('skyFoundationComparison')||document.body,{childList:true,subtree:true});
    ['relphi:sky-foundation-ready','relphi:sky-orb-limit-changed','relphi:sky-foundation-filter-changed'].forEach(name=>window.addEventListener(name,()=>{ensureControls();invalidate()}));
    window.addEventListener('storage',event=>{if(!event.key||event.key==='relphiSkyChartA'||event.key==='relphiSkyChartB')invalidate()});
    window.addEventListener('pagehide',clearUrl);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
