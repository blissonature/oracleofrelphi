// Sky Chart export v4: contextual wheel PNGs and relationship-view PNGs grouped by sky scope.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyExportV4)return;
  window.__relphiSkyExportV2=true;
  window.__relphiSkyExportV3=true;
  window.__relphiSkyExportV4=true;

  const LIB_URL='https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js';
  const WHEEL_ID='skyChartWheelExport';
  const REL_ID='skyChartRelationshipsExport';
  const STATUS_ID='skyChartExportStatus';
  const WHEEL_EXPORT_FRAME=Object.freeze({side:64,top:150,bottom:74});
  const REL_GROUPS=Object.freeze([
    Object.freeze({mode:'A-A',title:'Sky A — Intrasky',className:'sky-a'}),
    Object.freeze({mode:'B-B',title:'Sky B — Intrasky',className:'sky-b'}),
    Object.freeze({mode:'A-B',title:'Sky A ↔ Sky B — Intersky',className:'sky-ab'})
  ]);
  const ICON='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3v11m0 0-4-4m4 4 4-4M5 15v4h14v-4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
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
  function skyName(slot){const value=read(slot)||{},m=value.metadata&&typeof value.metadata==='object'?value.metadata:{};return m.savedSkyName||value.name||value.displayName||value.skyName||value.title||`Sky ${slot}`}
  function stamp(){return new Date().toISOString().replace(/[-:]/g,'').replace(/T(\d{4}).*/, '-$1')}
  function filename(kind){return `${safeName(skyName('A'),'sky-a')}-vs-${safeName(skyName('B'),'sky-b')}-${kind}-${stamp()}.png`}

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

  function status(text,error=false){const node=document.getElementById(STATUS_ID);if(!node)return;node.textContent=text||'';node.dataset.error=error?'true':'false'}
  function facts(slot){
    const panel=document.getElementById(slot==='A'?'skyFoundationA':'skyFoundationB');
    const lines=[...panel?.querySelectorAll('.sky-where-when-facts p')||[]].map(node=>node.textContent.trim());
    const profile=read(slot)?.calcProfile||{};
    const where=(lines.find(line=>/^Where:/i.test(line))||'').replace(/^Where:\s*/i,'')||profile.location||'';
    const when=(lines.find(line=>/^When:/i.test(line))||'').replace(/^When:\s*/i,'')||profile.dateTime||'';
    return{name:skyName(slot),where,when};
  }

  function cleanLabel(label){return String(label||'').replace(/\s+/g,' ').trim()}
  function selectCaption(select){
    const data=String(select.dataset.filter||select.dataset.zodiacFilter||select.name||'').toLowerCase();
    if(data.includes('aspect'))return'Aspects';if(data.includes('zodiac')||data.includes('sign'))return'Zodiac signs';if(data.includes('house'))return'Houses';
    const label=select.closest('label');if(!label)return'';
    const clone=label.cloneNode(true);clone.querySelectorAll('select,input,button').forEach(node=>node.remove());return cleanLabel(clone.textContent);
  }
  function filterSummary(){
    const bar=document.querySelector('#skyFoundationRelationships .sky-chart-filter-bar');
    if(!bar)return'';
    const parts=[];
    const harmonic=bar.querySelector('[data-harmonic-window-input]');if(harmonic?.value.trim())parts.push(`Harmonic window ${harmonic.value.trim()}°`);
    const custom=[['[data-placement-filter-summary]','Placements'],['[data-house-filter-summary]','Houses'],['[data-aspect-filter-summary]','Aspects']];
    custom.forEach(([selector,label])=>{const text=cleanLabel(bar.querySelector(selector)?.textContent);if(text&&text!=='All')parts.push(`${label}: ${text}`)});
    [...bar.querySelectorAll('select')].forEach(select=>{const text=cleanLabel(select.selectedOptions?.[0]?.textContent||select.value);if(!text||/^all$/i.test(text)||/^none$/i.test(text))return;const caption=selectCaption(select)||'Filter';const item=`${caption}: ${text}`;if(!parts.includes(item))parts.push(item)});
    return parts.join(' · ');
  }

  function infoBox(info,side){
    const box=document.createElement('div');box.className=`sky-export-info sky-export-info-${side}`;
    box.innerHTML=`<strong>${esc(info.name)}</strong>${info.where?`<span>${esc(info.where)}</span>`:''}${info.when?`<span>${esc(info.when)}</span>`:''}`;
    return box;
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
      SNAPSHOT_STYLE_PROPERTIES.forEach(property=>{
        const value=computed.getPropertyValue(property);
        if(value)copy.style.setProperty(property,value);
      });
    });
  }

  function buildWheelStage(){
    const sourceMount=document.getElementById('skyFoundationWheelMount');
    const wheel=sourceMount?.querySelector(':scope > svg.sky-foundation-wheel');if(!wheel)throw new Error('The comparison wheel is not ready.');
    const box=wheel.viewBox?.baseVal,wheelWidth=Math.max(1,Math.ceil(box?.width||1200)),wheelHeight=Math.max(1,Math.ceil(box?.height||1200));
    const width=wheelWidth+WHEEL_EXPORT_FRAME.side*2,height=wheelHeight+WHEEL_EXPORT_FRAME.top+WHEEL_EXPORT_FRAME.bottom;
    const host=exportHost(width,height),stage=document.createElement('div');stage.className='sky-wheel-export-stage';stage.style.width=`${width}px`;stage.style.height=`${height}px`;

    // Freeze the already-rendered composition before any export work can trigger a wheel
    // rebuild. The export shell intentionally preserves #skyFoundationWheelMount because
    // the live filter-focus/dimming and aspect-line CSS is scoped through that parent.
    const wheelMount=document.createElement('div');wheelMount.id='skyFoundationWheelMount';wheelMount.className=sourceMount.className;
    Object.assign(wheelMount.style,{position:'absolute',display:'block',left:`${WHEEL_EXPORT_FRAME.side}px`,top:`${WHEEL_EXPORT_FRAME.top}px`,width:`${wheelWidth}px`,height:`${wheelHeight}px`,minHeight:'0',padding:'0',border:'0',overflow:'visible',background:'transparent'});
    const clone=wheel.cloneNode(true);
    freezeWheelAppearance(wheel,clone);
    Object.assign(clone.style,{position:'relative',display:'block',left:'0',top:'0',width:`${wheelWidth}px`,height:`${wheelHeight}px`,maxHeight:'none',overflow:'visible'});
    wheelMount.appendChild(clone);stage.appendChild(wheelMount);

    stage.append(infoBox(facts('A'),'a'),infoBox(facts('B'),'b'));
    const summary=filterSummary();if(summary){const line=document.createElement('div');line.className='sky-export-filter-summary';line.textContent=`Showing only: ${summary}`;stage.appendChild(line)}
    host.appendChild(stage);return{host,stage,width,height};
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
    return [...list.querySelectorAll('.sky-foundation-relationship-row')].filter(row=>{
      if(!rowVisible(row))return false;
      const box=row.getBoundingClientRect();return box.bottom>=rect.top&&box.top<=rect.bottom;
    });
  }
  function groupedRelationshipRows(rows){
    const map=new Map(REL_GROUPS.map(group=>[group.mode,[]]));
    rows.forEach(row=>map.get(relationshipMode(row))?.push(row));
    return REL_GROUPS.map(group=>({group,rows:map.get(group.mode)||[]})).filter(section=>section.rows.length);
  }
  function buildRelationshipStage(){
    const source=document.getElementById('skyFoundationRelationships'),list=document.getElementById('skyFoundationRelationshipList');if(!source||!list)throw new Error('The relationship list is not ready.');
    const width=Math.max(620,Math.min(900,Math.ceil(source.getBoundingClientRect().width||760))),host=exportHost(width,2000),stage=document.createElement('div');stage.className='sky-relationships-export-stage';stage.style.width=`${width}px`;
    const head=document.createElement('div');head.className='sky-relationships-export-head';head.innerHTML=`<strong>Relationships</strong><span>${esc(document.getElementById('skyFoundationRelationshipCount')?.textContent||'')}</span>`;stage.appendChild(head);
    const summary=filterSummary();if(summary){const line=document.createElement('div');line.className='sky-relationships-export-summary';line.textContent=`Showing only: ${summary}`;stage.appendChild(line)}
    const frame=document.createElement('div');frame.className='sky-relationships-export-frame';
    const groups=document.createElement('div');groups.className='sky-relationships-export-groups';
    groupedRelationshipRows(visibleViewportRows(list)).forEach(({group,rows})=>{
      const section=document.createElement('section');section.className=`sky-relationships-export-group ${group.className}`;
      const title=document.createElement('div');title.className='sky-relationships-export-group-title';title.textContent=group.title;
      const grid=document.createElement('div');grid.className='sky-relationships-export-grid';rows.forEach(row=>grid.appendChild(row.cloneNode(true)));
      section.append(title,grid);groups.appendChild(section);
    });
    frame.appendChild(groups);stage.appendChild(frame);host.style.height='auto';host.style.overflow='visible';host.appendChild(stage);return{host,stage,width,height:Math.ceil(stage.scrollHeight||600)};
  }

  async function nodeToFile(stage,width,height,name){
    if(document.fonts?.ready)await document.fonts.ready.catch(()=>{});const htmlToImage=await loadLibrary(),pixelRatio=Math.min(2,Math.max(1,window.devicePixelRatio||1));
    const dataUrl=await htmlToImage.toPng(stage,{cacheBust:false,backgroundColor:'#fffdf8',width,height,pixelRatio,canvasWidth:Math.ceil(width*pixelRatio),canvasHeight:Math.ceil(height*pixelRatio),skipAutoScale:true,includeQueryParams:false});
    const response=await fetch(dataUrl),blob=await response.blob();return new File([blob],name,{type:'image/png',lastModified:Date.now()});
  }
  function download(file){const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
  async function shareIOS(file){if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({files:[file],title:'Sky Chart snapshot'});return}const url=URL.createObjectURL(file);window.open(url,'_blank','noopener')||location.assign(url)}

  async function exportKind(kind,button){
    if(preparing)return;
    if(isIOS()&&pendingIOS?.kind===kind){try{await shareIOS(pendingIOS.file);status('Snapshot sent to the share sheet.')}catch(error){if(error?.name!=='AbortError')status('Unable to open the share sheet.',true)}return}
    preparing=true;button.disabled=true;button.setAttribute('aria-busy','true');status(kind==='wheel'?'Preparing wheel PNG…':'Preparing Relationships PNG…');
    let built=null;
    try{
      // Wheel export must capture the composition exactly as it is already rendered.
      // Do not call arrangeCurrent() here: that routine can rebuild placement/aspect state.
      if(kind==='wheel')built=buildWheelStage();
      else built=buildRelationshipStage();
      await new Promise(resolve=>requestAnimationFrame(resolve));built.height=Math.max(1,Math.ceil(built.stage.scrollHeight||built.height));built.host.style.height=`${built.height}px`;
      const file=await nodeToFile(built.stage,built.width,built.height,filename(kind==='wheel'?'wheel':'relationships'));
      if(isIOS()){pendingIOS={kind,file};button.dataset.exportReady='true';status('PNG ready — tap the download icon again to share.')}else{download(file);status('PNG download started.')}
    }catch(error){console.error('Sky Chart export failed:',error);status(`Export failed: ${String(error?.message||error).replace(/\s+/g,' ').slice(0,140)}`,true)}
    finally{built?.host?.remove();preparing=false;if(button?.isConnected){button.disabled=false;button.removeAttribute('aria-busy')}}
  }

  function installStyles(){if(document.getElementById('skyChartExportV3Styles'))return;document.getElementById('skyChartExportV2Styles')?.remove();const style=document.createElement('style');style.id='skyChartExportV3Styles';style.textContent=`
    .sky-export-icon-button{appearance:none;display:grid;place-items:center;width:30px;height:30px;padding:0;border:1px solid rgba(31,27,24,.2);border-radius:999px;background:#fff;color:#2d2824;cursor:pointer}.sky-export-icon-button svg{width:17px;height:17px}.sky-export-icon-button:hover,.sky-export-icon-button:focus-visible{outline:none;border-color:#2462d0;box-shadow:0 0 0 2px rgba(36,98,208,.12)}.sky-export-icon-button:disabled{opacity:.5}.sky-export-icon-button[data-export-ready="true"]{border-color:#2462d0;color:#2462d0}
    #skyFoundationComparison>.sky-foundation-heading{flex-wrap:wrap}#skyFoundationComparison .sky-export-wheel-slot{display:flex;align-items:center;justify-content:flex-end;margin-left:auto}.sky-relationship-heading-actions{display:flex;align-items:center;gap:6px}.sky-relationship-heading-actions button{margin:0}
    #${STATUS_ID}{flex:1 0 100%;color:#665e57;text-align:right;font:650 .58rem/1.2 system-ui,sans-serif}#${STATUS_ID}:empty{display:none}#${STATUS_ID}[data-error="true"]{color:#b81712}
    .sky-wheel-export-stage{position:relative;background:#fffdf8;color:#2d2824;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.sky-wheel-export-stage>#skyFoundationWheelMount{position:absolute}.sky-export-info{position:absolute;top:22px;z-index:3;width:360px;display:grid;gap:5px;padding:12px 14px;border-radius:12px;background:rgba(255,253,248,.96);box-shadow:0 1px 8px rgba(31,27,24,.08);font-size:15px;line-height:1.28;text-align:left}.sky-export-info strong{font-size:19px}.sky-export-info span{color:#5d554e}.sky-export-info-a{left:${WHEEL_EXPORT_FRAME.side}px;border-left:5px solid #c9211e}.sky-export-info-b{right:${WHEEL_EXPORT_FRAME.side}px;border-right:5px solid #2462d0}.sky-export-filter-summary{position:absolute;left:50%;bottom:18px;z-index:3;transform:translateX(-50%);max-width:82%;padding:8px 14px;border-radius:999px;background:rgba(255,253,248,.96);box-shadow:0 1px 7px rgba(31,27,24,.08);font:750 14px/1.25 system-ui,sans-serif;text-align:center;color:#554e48}
    .sky-relationships-export-stage{box-sizing:border-box;padding:16px;border:1px solid rgba(31,27,24,.13);border-radius:14px;background:#fffdf8;color:#191613;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.sky-relationships-export-head{display:flex;align-items:center;justify-content:space-between;padding:0 2px 10px;font-size:16px}.sky-relationships-export-head>span{padding:5px 9px;border-radius:999px;background:#f0ebe4;font-size:12px;font-weight:800}.sky-relationships-export-summary{margin:0 0 10px;padding:8px 10px;border-radius:8px;background:#f6f0e8;color:#5d554e;font-size:12px;font-weight:700}.sky-relationships-export-frame{overflow:visible}.sky-relationships-export-groups{display:grid;gap:12px}.sky-relationships-export-group{display:grid;gap:6px}.sky-relationships-export-group-title{padding:6px 9px;border-radius:7px;background:#f2ece5;color:#3b3530;font:900 12px/1.2 system-ui,sans-serif}.sky-relationships-export-group.sky-a .sky-relationships-export-group-title{border-left:4px solid #c9211e}.sky-relationships-export-group.sky-b .sky-relationships-export-group-title{border-left:4px solid #2462d0}.sky-relationships-export-group.sky-ab .sky-relationships-export-group-title{border-left:4px solid #7655aa}.sky-relationships-export-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.sky-relationships-export-grid>.sky-foundation-relationship-row{margin:0!important}
  `;document.head.appendChild(style)}

  function button(id,label){const b=document.createElement('button');b.type='button';b.id=id;b.className='sky-export-icon-button';b.innerHTML=ICON;b.setAttribute('aria-label',label);b.title=label;return b}
  function ensureWheelControl(){
    const heading=document.querySelector('#skyFoundationComparison>.sky-foundation-heading');if(!heading)return;
    heading.querySelector('.sky-snapshot-actions')?.remove();heading.querySelector(`#${STATUS_ID}`)?.remove();
    let slot=heading.querySelector('.sky-export-wheel-slot');if(!slot){slot=document.createElement('span');slot.className='sky-export-wheel-slot';const b=button(WHEEL_ID,'Download wheel snapshot');b.addEventListener('click',()=>exportKind('wheel',b));slot.appendChild(b);heading.appendChild(slot);const s=document.createElement('span');s.id=STATUS_ID;s.setAttribute('role','status');s.setAttribute('aria-live','polite');heading.appendChild(s)}
  }
  function ensureRelationshipControl(){
    const heading=document.querySelector('#skyFoundationRelationships>.sky-foundation-relationships-heading');if(!heading)return;
    let actions=heading.querySelector('.sky-relationship-heading-actions');if(!actions){actions=document.createElement('span');actions.className='sky-relationship-heading-actions';const copy=[...heading.querySelectorAll('button')].find(b=>/^copy$/i.test(b.textContent.trim()));if(copy){heading.insertBefore(actions,copy);actions.appendChild(copy)}else heading.appendChild(actions)}
    if(!actions.querySelector(`#${REL_ID}`)){const b=button(REL_ID,'Download Relationships snapshot');b.dataset.relationshipExportOwner='columns-v2';actions.appendChild(b)}
  }
  function invalidate(){pendingIOS=null;document.querySelectorAll('.sky-export-icon-button[data-export-ready]').forEach(b=>delete b.dataset.exportReady)}
  function ensure(){installStyles();ensureWheelControl();ensureRelationshipControl()}
  function start(){ensure();prewarm();new MutationObserver(ensure).observe(document.getElementById('skyFoundationComparison')||document.body,{childList:true,subtree:true});['relphi:sky-foundation-ready','relphi:sky-orb-limit-changed','relphi:sky-harmonic-window-visibility-changed','relphi:sky-placement-multiselect-changed','relphi:sky-house-multiselect-changed','relphi:sky-aspect-multiselect-changed','relphi:sky-zodiac-filter-changed'].forEach(name=>window.addEventListener(name,()=>{invalidate();ensure()}));window.addEventListener('storage',invalidate)}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();