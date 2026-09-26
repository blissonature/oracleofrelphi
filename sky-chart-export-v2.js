// Sky Chart export v5: contextual wheel PNGs and relationship-view PNGs grouped by sky scope.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyExportV5)return;
  window.__relphiSkyExportV2=true;
  window.__relphiSkyExportV3=true;
  window.__relphiSkyExportV4=true;
  window.__relphiSkyExportV5=true;

  const LIB_URL='https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js';
  const WHEEL_ID='skyChartWheelExport';
  const WHEEL_COPY_ID='skyChartWheelCopy';
  const REL_ID='skyChartRelationshipsExport';
  const STATUS_ID='skyChartExportStatus';
  const WHEEL_EXPORT_FRAME=Object.freeze({side:64,top:150,bottom:74});
  const REL_GROUPS=Object.freeze([
    Object.freeze({mode:'A-A',title:'Sky A — Intrasky',className:'sky-a'}),
    Object.freeze({mode:'B-B',title:'Sky B — Intrasky',className:'sky-b'}),
    Object.freeze({mode:'A-B',title:'Sky A ↔ Sky B — Intersky',className:'sky-ab'})
  ]);
  const ICON='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3v11m0 0-4-4m4 4 4-4M5 15v4h14v-4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const WAIT_ICON='<svg class="sky-export-spinner" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2" opacity=".22"/><path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  const SNAPSHOT_STYLE_PROPERTIES=Object.freeze([
    'display','visibility','opacity','filter','color','fill','fill-opacity','fill-rule',
    'stroke','stroke-opacity','stroke-width','stroke-dasharray','stroke-dashoffset',
    'stroke-linecap','stroke-linejoin','paint-order'
  ]);
  let libraryPromise=null,preparing=false,pendingIOS=null;

  const isIOS=()=>/iPad|iPhone|iPod/i.test(String(navigator.userAgent||''))||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  function read(slot){try{return JSON.parse(localStorage.getItem(slot==='A'?'relphiSkyChartA':'relphiSkyChartB')||'null')}catch(_){return null}}
  function safeName(value,fallback){return String(value||fallback).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48)||fallback}
  function rawSkyName(slot){const value=read(slot)||{},m=value.metadata&&typeof value.metadata==='object'?value.metadata:{};return m.savedSkyName||value.name||value.displayName||value.skyName||value.title||`Sky ${slot}`}
  function resolvedSkyName(slot){
    const value=read(slot);
    try{const name=window.RelphiSkyCardTitle?.nameFor?.(slot,value);if(String(name||'').trim())return String(name).trim()}catch(_){}
    try{const state=window.RelphiSkySavedSkyIdentity?.identity?.(slot);if(String(state?.name||'').trim())return String(state.name).trim()}catch(_){}
    return rawSkyName(slot);
  }
  function stamp(){return new Date().toISOString().replace(/[-:]/g,'').replace(/T(\d{4}).*/, '-$1')}
  function filename(kind,slots=['A','B']){
    const normalized=[...new Set((slots||[]).filter(slot=>slot==='A'||slot==='B'))];
    if(normalized.length===1){const slot=normalized[0];return `${safeName(resolvedSkyName(slot),`sky-${slot.toLowerCase()}`)}-${kind}-${stamp()}.png`}
    return `${safeName(resolvedSkyName('A'),'sky-a')}-vs-${safeName(resolvedSkyName('B'),'sky-b')}-${kind}-${stamp()}.png`;
  }

  function loadLibrary(){
    if(window.htmlToImage?.toPng)return Promise.resolve(window.htmlToImage);
    if(libraryPromise)return libraryPromise;
    libraryPromise=new Promise((resolve,reject)=>{
      const existing=document.querySelector(`script[src="${LIB_URL}"]`);
      if(existing){
        if(window.htmlToImage?.toPng)return resolve(window.htmlToImage);
        existing.addEventListener('load',()=>window.htmlToImage?.toPng?resolve(window.htmlToImage):reject(new Error('PNG exporter unavailable.')),{once:true});
        existing.addEventListener('error',()=>reject(new Error('PNG exporter did not load.')),{once:true});
        return;
      }
      const script=document.createElement('script');script.src=LIB_URL;script.async=true;script.crossOrigin='anonymous';
      script.addEventListener('load',()=>window.htmlToImage?.toPng?resolve(window.htmlToImage):reject(new Error('PNG exporter unavailable.')),{once:true});
      script.addEventListener('error',()=>reject(new Error('PNG exporter did not load.')),{once:true});document.head.appendChild(script);
    });
    return libraryPromise;
  }
  function prewarm(){const warm=()=>loadLibrary().catch(()=>{});if('requestIdleCallback'in window)requestIdleCallback(warm,{timeout:2500});else setTimeout(warm,800)}

  function status(text,error=false,busy=false){
    const node=document.getElementById(STATUS_ID);if(!node)return;
    node.textContent=text||'';node.dataset.error=error?'true':'false';node.dataset.busy=busy?'true':'false';
  }
  function setButtonBusy(button,busy){
    if(!button)return;
    button.disabled=!!busy;
    if(busy){button.setAttribute('aria-busy','true');button.innerHTML=WAIT_ICON}
    else{button.removeAttribute('aria-busy');button.innerHTML=ICON}
  }
  function wheelSlots(wheel){
    const explicit=String(wheel?.dataset?.singleSky||'').trim().toUpperCase();
    if(explicit==='A'||explicit==='B')return[explicit];
    const hasA=!!wheel?.querySelector('[data-sky="A"]'),hasB=!!wheel?.querySelector('[data-sky="B"]');
    if(hasA&&!hasB)return['A'];
    if(hasB&&!hasA)return['B'];
    if(hasA&&hasB)return['A','B'];
    try{if(window.RelphiSkySlotControls?.hasSkyB?.())return['A','B']}catch(_){}
    return['A'];
  }

  function cleanLabel(label){return String(label||'').replace(/\s+/g,' ').trim()}
  function selectCaption(select){
    const data=String(select.dataset.filter||select.dataset.zodiacFilter||select.name||'').toLowerCase();
    if(data.includes('aspect'))return'Aspects';if(data.includes('zodiac')||data.includes('sign'))return'Zodiac signs';if(data.includes('house'))return'Houses';
    const label=select.closest('label');if(!label)return'';
    const clone=label.cloneNode(true);clone.querySelectorAll('select,input,button').forEach(node=>node.remove());return cleanLabel(clone.textContent);
  }
  function filterSummary(){
    const bar=(document.querySelector('#skyFoundationFocus .sky-chart-filter-bar')||document.querySelector('#skyFoundationRelationships .sky-chart-filter-bar'));
    if(!bar)return'';
    const parts=[];
    const harmonic=bar.querySelector('[data-harmonic-window-input]');if(harmonic?.value.trim())parts.push(`Harmonic window ${harmonic.value.trim()}°`);
    const limit=document.querySelector('#skyFoundationRelationships [data-relationship-limit]');if(limit?.value&&limit.value!=='all')parts.push(`Limit ${limit.value}`);
    const custom=[['[data-placement-filter-summary]','Placements'],['[data-house-filter-summary]','Houses'],['[data-aspect-filter-summary]','Aspects']];
    custom.forEach(([selector,label])=>{const text=cleanLabel(bar.querySelector(selector)?.textContent);if(text&&text!=='All')parts.push(`${label}: ${text}`)});
    [...bar.querySelectorAll('select')].forEach(select=>{const text=cleanLabel(select.selectedOptions?.[0]?.textContent||select.value);if(!text||/^all$/i.test(text)||/^none$/i.test(text))return;const caption=selectCaption(select)||'Filter';const item=`${caption}: ${text}`;if(!parts.includes(item))parts.push(item)});
    return parts.join(' · ');
  }
  function selectionSummary(){
    const origin=window.RelphiSkyFoundationInteractions?.getSelectionOrigin?.();
    if(!origin)return'';
    const label=cleanLabel(origin.label||origin.value);
    if(!label)return'';
    const sky=origin.sky==='A'||origin.sky==='B'?'Sky '+origin.sky:'';
    return 'Selected: '+[sky,label].filter(Boolean).join(' · ');
  }
  function wheelContextSummary(){
    return [selectionSummary(),filterSummary()].filter(Boolean).join(' · ');
  }

  function fingerprintSource(slot,kind){
    const refs=window.RelphiSkyCardShell?.get?.(slot);
    if(kind==='where')return refs?.whereFingerprint||null;
    if(kind==='placements')return refs?.placementFingerprint||null;
    if(kind==='ruler')return refs?.cardHitsFingerprint||null;
    return null;
  }
  function cloneFingerprintPiece(slot,kind){
    const wrapper=document.createElement('span');
    wrapper.className=`sky-export-fingerprint-piece sky-export-fingerprint-piece-${kind}`;
    wrapper.dataset.fingerprintPart=kind;
    const source=fingerprintSource(slot,kind);
    const sourceChild=source?.firstElementChild;
    if(sourceChild){
      const clone=sourceChild.cloneNode(true);
      clone.removeAttribute?.('hidden');
      clone.querySelectorAll?.('[hidden]').forEach(node=>node.removeAttribute('hidden'));
      wrapper.appendChild(clone);
      const label=source.getAttribute?.('aria-label');
      if(label)wrapper.setAttribute('aria-label',label);
    }else{
      wrapper.dataset.fingerprintMissing='true';
      wrapper.setAttribute('aria-hidden','true');
    }
    return wrapper;
  }
  function fingerprintBox(slot,single=false){
    const side=slot.toLowerCase(),box=document.createElement('div');
    box.className=`sky-export-fingerprint sky-export-fingerprint-${side}${single?' sky-export-fingerprint-single':''}`;
    box.dataset.sky=slot;
    box.dataset.exportSkyIdentifier='fingerprint';
    box.setAttribute('aria-label',`Sky ${slot} fingerprint identifier`);
    const label=document.createElement('span');
    label.className='sky-export-fingerprint-label';
    label.textContent=`Sky ${slot}`;
    const triptych=document.createElement('span');
    triptych.className='sky-export-fingerprint-triptych';
    triptych.append(
      cloneFingerprintPiece(slot,'where'),
      cloneFingerprintPiece(slot,'placements'),
      cloneFingerprintPiece(slot,'ruler')
    );
    box.append(label,triptych);
    return box;
  }
  function wheelBrand(){
    const brand=document.createElement('div');
    brand.className='sky-export-brand';
    brand.dataset.exportBrand='oracle-of-relphi';
    const logo=document.createElement('img');
    logo.className='sky-export-brand-logo';
    logo.src=new URL('logo.png',document.baseURI).href;
    logo.alt='Oracle of Relphi logo';
    logo.decoding='sync';
    const copy=document.createElement('div');
    copy.className='sky-export-brand-copy';
    const title=document.createElement('strong');
    title.className='sky-export-brand-title';
    title.textContent='Sky Chart';
    const line=document.createElement('span');
    line.className='sky-export-brand-line';
    line.textContent='an Oracle of Relphi tool';
    copy.append(title,line);
    brand.append(logo,copy);
    return brand;
  }
  function exportHost(width,height){
    const host=document.createElement('div');host.className='sky-export-host';
    Object.assign(host.style,{position:'fixed',left:'-100000px',top:'0',width:`${width}px`,height:`${height}px`,background:'#fffdf8',overflow:'hidden',zIndex:'-1'});document.body.appendChild(host);return host;
  }

  function freezeWheelAppearance(source,clone){
    const sourceNodes=[source,...source.querySelectorAll('*')];
    const cloneNodes=[clone,...clone.querySelectorAll('*')];
    sourceNodes.forEach((node,index)=>{
      const copy=cloneNodes[index];
      if(!(node instanceof Element)||!(copy instanceof Element))return;
      const computed=getComputedStyle(node);
      SNAPSHOT_STYLE_PROPERTIES.forEach(property=>{const value=computed.getPropertyValue(property);if(value)copy.style.setProperty(property,value)});
    });
  }

  function buildWheelStage(){
    const sourceMount=document.getElementById('skyFoundationWheelMount');
    const wheel=sourceMount?.querySelector(':scope > svg.sky-foundation-wheel');if(!wheel)throw new Error('The Sky wheel is not ready.');
    const slots=wheelSlots(wheel);
    const box=wheel.viewBox?.baseVal,wheelWidth=Math.max(1,Math.ceil(box?.width||1200)),wheelHeight=Math.max(1,Math.ceil(box?.height||1200));
    const width=wheelWidth+WHEEL_EXPORT_FRAME.side*2,height=wheelHeight+WHEEL_EXPORT_FRAME.top+WHEEL_EXPORT_FRAME.bottom;
    const host=exportHost(width,height),stage=document.createElement('div');stage.className='sky-wheel-export-stage';stage.dataset.exportSkyMode=slots.length===1?'single':'comparison';stage.dataset.exportIdentityMode='fingerprint';stage.style.width=`${width}px`;stage.style.height=`${height}px`;

    stage.appendChild(wheelBrand());

    const wheelMount=document.createElement('div');wheelMount.className=sourceMount.className;wheelMount.dataset.exportWheelMount='true';
    Object.assign(wheelMount.style,{position:'absolute',display:'block',left:`${WHEEL_EXPORT_FRAME.side}px`,top:`${WHEEL_EXPORT_FRAME.top}px`,width:`${wheelWidth}px`,height:`${wheelHeight}px`,minHeight:'0',padding:'0',border:'0',overflow:'visible',background:'transparent'});
    const clone=wheel.cloneNode(true);
    freezeWheelAppearance(wheel,clone);
    Object.assign(clone.style,{position:'relative',display:'block',left:'0',top:'0',width:`${wheelWidth}px`,height:`${wheelHeight}px`,maxHeight:'none',overflow:'visible'});
    wheelMount.appendChild(clone);stage.appendChild(wheelMount);

    if(slots.length===1)stage.appendChild(fingerprintBox(slots[0],true));
    else slots.forEach(slot=>stage.appendChild(fingerprintBox(slot,false)));
    const summary=wheelContextSummary();if(summary){const line=document.createElement('div');line.className='sky-export-filter-summary';line.textContent=summary;stage.appendChild(line)}
    host.appendChild(stage);return{host,stage,width,height,slots};
  }
  function rowVisible(row){const style=getComputedStyle(row);return!row.hidden&&style.display!=='none'&&style.visibility!=='hidden'}
  function relationshipMode(row){
    const explicit=String(row?.dataset?.relationshipMode||'').toUpperCase();
    if(explicit==='A-A'||explicit==='B-B'||explicit==='A-B'||explicit==='B-A')return explicit==='B-A'?'A-B':explicit;
    const left=String(row?.dataset?.leftSky||'A').toUpperCase(),right=String(row?.dataset?.rightSky||'B').toUpperCase();
    if(left===right&&left==='A')return'A-A';
    if(left===right&&left==='B')return'B-B';
    return'A-B';
  }
  function visibleViewportRows(list){
    const rect=list.getBoundingClientRect();
    return [...list.querySelectorAll('.sky-foundation-relationship-row')].filter(row=>{if(!rowVisible(row))return false;const box=row.getBoundingClientRect();return box.bottom>=rect.top&&box.top<=rect.bottom});
  }
  function groupedRelationshipRows(rows){
    const map=new Map(REL_GROUPS.map(group=>[group.mode,[]]));rows.forEach(row=>map.get(relationshipMode(row))?.push(row));
    return REL_GROUPS.map(group=>({group,rows:map.get(group.mode)||[]})).filter(section=>section.rows.length);
  }
  function buildRelationshipStage(){
    const source=document.getElementById('skyFoundationRelationships'),list=document.getElementById('skyFoundationRelationshipList');if(!source||!list)throw new Error('The relationship list is not ready.');
    const visibleRows=visibleViewportRows(list);
    const width=Math.max(620,Math.min(900,Math.ceil(source.getBoundingClientRect().width||760))),host=exportHost(width,2000),stage=document.createElement('div');stage.className='sky-relationships-export-stage';stage.style.width=`${width}px`;
    const head=document.createElement('div');head.className='sky-relationships-export-head';head.innerHTML=`<strong>Relationships</strong><span>${esc(visibleRows.length+' shown')}</span>`;stage.appendChild(head);
    const summary=filterSummary();if(summary){const line=document.createElement('div');line.className='sky-relationships-export-summary';line.textContent=`Showing only: ${summary}`;stage.appendChild(line)}
    const frame=document.createElement('div');frame.className='sky-relationships-export-frame';const groups=document.createElement('div');groups.className='sky-relationships-export-groups';
    groupedRelationshipRows(visibleRows).forEach(({group,rows})=>{
      const section=document.createElement('section');section.className=`sky-relationships-export-group ${group.className}`;
      const title=document.createElement('div');title.className='sky-relationships-export-group-title';title.textContent=group.title;
      const grid=document.createElement('div');grid.className='sky-relationships-export-grid';rows.forEach(row=>grid.appendChild(row.cloneNode(true)));
      section.append(title,grid);groups.appendChild(section);
    });
    frame.appendChild(groups);stage.appendChild(frame);host.style.height='auto';host.style.overflow='visible';host.appendChild(stage);return{host,stage,width,height:Math.ceil(stage.scrollHeight||600),slots:['A','B']};
  }

  async function nodeToFile(stage,width,height,name){
    if(document.fonts?.ready)await document.fonts.ready.catch(()=>{});const htmlToImage=await loadLibrary(),pixelRatio=Math.min(2,Math.max(1,window.devicePixelRatio||1));
    const dataUrl=await htmlToImage.toPng(stage,{cacheBust:false,backgroundColor:'#fffdf8',width,height,pixelRatio,canvasWidth:Math.ceil(width*pixelRatio),canvasHeight:Math.ceil(height*pixelRatio),skipAutoScale:true,includeQueryParams:false});
    const response=await fetch(dataUrl),blob=await response.blob();return new File([blob],name,{type:'image/png',lastModified:Date.now()});
  }
  function download(file){const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
  async function shareIOS(file){if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({files:[file],title:'Sky Chart snapshot'});return}const url=URL.createObjectURL(file);window.open(url,'_blank','noopener')||location.assign(url)}

  async function copyWheel(button){
    if(preparing)return;
    preparing=true;
    if(button){button.disabled=true;button.setAttribute('aria-busy','true')}
    status('Preparing wheel copy…',false,true);
    let built=null;
    try{
      if(!navigator.clipboard?.write||typeof ClipboardItem==='undefined')throw new Error('Image copy is not supported in this browser.');
      built=buildWheelStage();
      await new Promise(resolve=>requestAnimationFrame(resolve));
      built.height=Math.max(1,Math.ceil(built.stage.scrollHeight||built.height));built.host.style.height=`${built.height}px`;
      const file=await nodeToFile(built.stage,built.width,built.height,filename('wheel',built.slots));
      await navigator.clipboard.write([new ClipboardItem({'image/png':file})]);
      if(button){
        const previous=button.textContent;
        button.textContent='Copied';
        window.setTimeout(()=>{if(button.isConnected)button.textContent=previous||'Copy'},1200);
      }
      status('Wheel copied to clipboard.');
    }catch(error){
      console.error('Sky Chart wheel copy failed:',error);
      status(String(error?.message||'Unable to copy wheel.').replace(/\s+/g,' ').slice(0,140),true);
    }finally{
      built?.host?.remove();preparing=false;
      if(button?.isConnected){button.disabled=false;button.removeAttribute('aria-busy')}
    }
  }

  async function exportKind(kind,button){
    if(preparing)return;
    if(isIOS()&&pendingIOS?.kind===kind){
      setButtonBusy(button,true);status('Opening Share Sheet…',false,true);
      try{await shareIOS(pendingIOS.file);status('Snapshot sent to the Share Sheet.')}catch(error){if(error?.name!=='AbortError')status('Unable to open the Share Sheet.',true)}finally{setButtonBusy(button,false)}
      return;
    }
    preparing=true;setButtonBusy(button,true);status('Preparing snapshot… Please wait.',false,true);
    let built=null;
    try{
      if(kind==='wheel')built=buildWheelStage();else built=buildRelationshipStage();
      await new Promise(resolve=>requestAnimationFrame(resolve));built.height=Math.max(1,Math.ceil(built.stage.scrollHeight||built.height));built.host.style.height=`${built.height}px`;
      const file=await nodeToFile(built.stage,built.width,built.height,filename(kind==='wheel'?'wheel':'relationships',built.slots));
      if(isIOS()){pendingIOS={kind,file};button.dataset.exportReady='true';status('PNG ready — tap the download icon again to share.')}else{download(file);status('PNG download started.')}
    }catch(error){console.error('Sky Chart export failed:',error);status(`Export failed: ${String(error?.message||error).replace(/\s+/g,' ').slice(0,140)}`,true)}
    finally{built?.host?.remove();preparing=false;if(button?.isConnected)setButtonBusy(button,false)}
  }

  function installStyles(){
    if(document.getElementById('skyChartExportV4Styles'))return;
    ['skyChartExportV2Styles','skyChartExportV3Styles'].forEach(id=>document.getElementById(id)?.remove());
    const style=document.createElement('style');style.id='skyChartExportV4Styles';style.textContent=`
    @keyframes skyExportSpin{to{transform:rotate(360deg)}}
    .sky-export-icon-button{appearance:none;display:grid;place-items:center;width:30px;height:30px;padding:0;border:1px solid rgba(31,27,24,.2);border-radius:999px;background:#fff;color:#2d2824;cursor:pointer}.sky-export-icon-button svg{width:17px;height:17px}.sky-export-icon-button .sky-export-spinner{animation:skyExportSpin .8s linear infinite}.sky-export-icon-button:hover,.sky-export-icon-button:focus-visible{outline:none;border-color:#2462d0;box-shadow:0 0 0 2px rgba(36,98,208,.12)}.sky-export-icon-button:disabled{opacity:.82;cursor:wait}.sky-export-icon-button[data-export-ready="true"]{border-color:#2462d0;color:#2462d0}
    .sky-wheel-copy-button{appearance:none;height:30px;padding:0 .72rem;border:1px solid rgba(31,27,24,.18);border-radius:999px;background:#fff;color:#332e2a;font:800 .68rem/1 system-ui,sans-serif;cursor:pointer;white-space:nowrap}.sky-wheel-copy-button:hover,.sky-wheel-copy-button:focus-visible{outline:none;border-color:#6b625a;background:#fffdfa}.sky-wheel-copy-button:disabled{opacity:.7;cursor:wait}
    #skyFoundationFocus .sky-focus-heading-controls{flex:1 1 auto}#skyFoundationFocus .sky-export-wheel-slot{display:flex;align-items:center;justify-content:flex-end;gap:6px;margin-left:auto;order:999}.sky-relationship-heading-actions{display:flex;align-items:center;gap:6px}.sky-relationship-heading-actions button{margin:0}
    #${STATUS_ID}{flex:1 0 100%;color:#665e57;text-align:right;font:650 .58rem/1.2 system-ui,sans-serif}#${STATUS_ID}:empty{display:none}#${STATUS_ID}[data-error="true"]{color:#b81712}#${STATUS_ID}[data-busy="true"]{margin-top:4px;padding:7px 10px;border-radius:999px;background:#f6f0e8;color:#3e3833;font-size:.68rem;font-weight:800}
    .sky-wheel-export-stage{position:relative;background:#fffdf8;color:#2d2824;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.sky-wheel-export-stage>#skyFoundationWheelMount{position:absolute}
    .sky-export-brand{position:absolute;z-index:4;top:22px;left:50%;transform:translateX(-50%);display:flex;align-items:center;justify-content:center;gap:11px;min-width:248px;padding:7px 12px;border-radius:12px;background:rgba(255,253,248,.96);box-shadow:0 1px 8px rgba(31,27,24,.08)}
    .sky-export-brand-logo{display:block;width:46px;height:46px;object-fit:contain}
    .sky-export-brand-copy{display:grid;gap:3px;text-align:left;white-space:nowrap}
    .sky-export-brand-title{color:#211d19;font:900 22px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .sky-export-brand-line{color:#655d56;font:750 12px/1.15 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .sky-export-fingerprint{position:absolute;top:24px;z-index:3;display:grid;gap:4px;padding:7px 9px;border-radius:12px;background:rgba(255,253,248,.96);box-shadow:0 1px 8px rgba(31,27,24,.08)}
    .sky-export-fingerprint-a{left:${WHEEL_EXPORT_FRAME.side}px;border-left:4px solid #c9211e}.sky-export-fingerprint-b{right:${WHEEL_EXPORT_FRAME.side}px;border-right:4px solid #2462d0}
    .sky-export-fingerprint-single{left:50%!important;right:auto!important;transform:translateX(-50%);border-right:0}.sky-export-fingerprint-single[data-sky="A"]{border-left:4px solid #c9211e}.sky-export-fingerprint-single[data-sky="B"]{border-left:4px solid #2462d0}
    .sky-export-fingerprint-label{color:#5d554e;font:850 10px/1 system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase}
    .sky-export-fingerprint-triptych{display:grid;grid-template-columns:repeat(3,58px);align-items:center;justify-items:center;gap:3px}
    .sky-export-fingerprint-piece{display:grid;place-items:center;width:58px;height:58px;min-width:58px;min-height:58px;overflow:visible}
    .sky-export-fingerprint-piece[data-fingerprint-missing="true"]{opacity:.18}
    .sky-export-fingerprint-piece .sky-where-fingerprint-heptagram,.sky-export-fingerprint-piece .sky-placement-fingerprint-wheel{display:block!important;width:52px!important;height:52px!important;max-width:52px!important;max-height:52px!important;margin:auto!important;overflow:visible!important;transform:none!important}
    .sky-export-fingerprint-piece .sky-card-ruler-fingerprint{--ruler-art-width:28px!important;--ruler-stack-box-width:42px!important;--ruler-rail-height:4px!important;width:42px!important;height:auto!important;transform:none!important}
    .sky-export-fingerprint-piece svg{overflow:visible}
    .sky-export-filter-summary{position:absolute;left:50%;bottom:18px;z-index:3;transform:translateX(-50%);max-width:82%;padding:8px 14px;border-radius:999px;background:rgba(255,253,248,.96);box-shadow:0 1px 7px rgba(31,27,24,.08);font:750 14px/1.25 system-ui,sans-serif;text-align:center;color:#554e48}
    .sky-relationships-export-stage{box-sizing:border-box;padding:16px;border:1px solid rgba(31,27,24,.13);border-radius:14px;background:#fffdf8;color:#191613;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.sky-relationships-export-head{display:flex;align-items:center;justify-content:space-between;padding:0 2px 10px;font-size:16px}.sky-relationships-export-head>span{padding:5px 9px;border-radius:999px;background:#f0ebe4;font-size:12px;font-weight:800}.sky-relationships-export-summary{margin:0 0 10px;padding:8px 10px;border-radius:8px;background:#f6f0e8;color:#5d554e;font-size:12px;font-weight:700}.sky-relationships-export-frame{overflow:visible}.sky-relationships-export-groups{display:grid;gap:12px}.sky-relationships-export-group{display:grid;gap:6px}.sky-relationships-export-group-title{padding:6px 9px;border-radius:7px;background:#f2ece5;color:#3b3530;font:900 12px/1.2 system-ui,sans-serif}.sky-relationships-export-group.sky-a .sky-relationships-export-group-title{border-left:4px solid #c9211e}.sky-relationships-export-group.sky-b .sky-relationships-export-group-title{border-left:4px solid #2462d0}.sky-relationships-export-group.sky-ab .sky-relationships-export-group-title{border-left:4px solid #7655aa}.sky-relationships-export-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.sky-relationships-export-grid>.sky-foundation-relationship-row{margin:0!important}
    `;document.head.appendChild(style);
  }

  function button(id,label){const b=document.createElement('button');b.type='button';b.id=id;b.className='sky-export-icon-button';b.innerHTML=ICON;b.setAttribute('aria-label',label);b.title=label;return b}
  function ensureWheelControl(){
    const controls=document.querySelector('#skyFoundationFocus>.sky-foundation-focus-heading .sky-focus-heading-controls');if(!controls)return;
    document.querySelector('#skyFoundationComparison>.sky-foundation-heading .sky-export-wheel-slot')?.remove();
    document.querySelector('#skyFoundationComparison>.sky-foundation-heading .sky-snapshot-actions')?.remove();
    let slot=controls.querySelector('.sky-export-wheel-slot');
    if(!slot){slot=document.createElement('span');slot.className='sky-export-wheel-slot';controls.appendChild(slot)}
    if(!slot.querySelector(`#${WHEEL_COPY_ID}`)){
      const copy=document.createElement('button');copy.type='button';copy.id=WHEEL_COPY_ID;copy.className='sky-wheel-copy-button';copy.textContent='Copy';copy.setAttribute('aria-label','Copy Zodiac Wheel snapshot');copy.title='Copy Zodiac Wheel snapshot to clipboard';copy.addEventListener('click',()=>copyWheel(copy));slot.appendChild(copy);
    }
    if(!slot.querySelector(`#${WHEEL_ID}`)){const b=button(WHEEL_ID,'Download wheel snapshot');b.addEventListener('click',()=>exportKind('wheel',b));slot.appendChild(b)}
    let state=controls.querySelector(`#${STATUS_ID}`);if(!state){state=document.createElement('span');state.id=STATUS_ID;state.setAttribute('role','status');state.setAttribute('aria-live','polite');controls.appendChild(state)}
  }
  function ensureRelationshipControl(){
    const heading=document.querySelector('#skyFoundationRelationships>.sky-foundation-relationships-heading');if(!heading)return;
    let actions=heading.querySelector('.sky-relationship-heading-actions');if(!actions){actions=document.createElement('span');actions.className='sky-relationship-heading-actions';const copy=[...heading.querySelectorAll('button')].find(b=>/^copy$/i.test(b.textContent.trim()));if(copy){heading.insertBefore(actions,copy);actions.appendChild(copy)}else heading.appendChild(actions)}
    if(!actions.querySelector(`#${REL_ID}`)){const b=button(REL_ID,'Download Relationships snapshot');b.dataset.relationshipExportOwner='columns-v2';actions.appendChild(b)}
  }
  function invalidate(){pendingIOS=null;document.querySelectorAll('.sky-export-icon-button[data-export-ready]').forEach(b=>delete b.dataset.exportReady)}
  function ensure(){installStyles();ensureWheelControl();ensureRelationshipControl()}
  function start(){
    ensure();prewarm();
    new MutationObserver(ensure).observe(document.getElementById('skyFoundationComparison')||document.body,{childList:true,subtree:true});
    ['relphi:sky-foundation-ready','relphi:sky-orb-limit-changed','relphi:sky-harmonic-window-visibility-changed','relphi:sky-placement-multiselect-changed','relphi:sky-house-multiselect-changed','relphi:sky-aspect-multiselect-changed','relphi:sky-zodiac-filter-changed','relphi:sky-where-when-committed','relphi:saved-sky-loaded'].forEach(name=>window.addEventListener(name,()=>{invalidate();ensure()}));
    window.addEventListener('storage',invalidate);
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
