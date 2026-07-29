// Three-panel Sky Chart workspace: Sky A | wheel | optional Sky B.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SLOT_KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  const STATE_KEY = 'relphiSkyBuilderV4State';
  const ORDER = [
    ['Sun'],['Moon'],['Rising','Ascendant','ASC','AC'],['Mercury'],['Venus'],['Mars'],['Jupiter'],['Saturn'],['Uranus'],['Neptune'],['Pluto'],['Chiron'],
    ['North Node','Node','NN'],['South Node','SouthNode','SN'],['Lilith'],['Vertex','Vx'],['Part of Fortune','Fortune','PoF'],['MC','Midheaven'],['IC','Imum Coeli'],['Dsc','DSC','Descendant']
  ];
  const LABEL = { Ascendant:'Rising',ASC:'Rising',AC:'Rising',Dsc:'Descendant',DSC:'Descendant',Midheaven:'Midheaven','Imum Coeli':'Imum Coeli' };
  const ID = {
    Sun:'sun',Moon:'moon',Rising:'asc',Ascendant:'asc',ASC:'asc',AC:'asc',Mercury:'mercury',Venus:'venus',Mars:'mars',Jupiter:'jupiter',Saturn:'saturn',Uranus:'uranus',Neptune:'neptune',Pluto:'pluto',Chiron:'chiron',
    'North Node':'north-node',Node:'north-node',NN:'north-node','South Node':'south-node',SouthNode:'south-node',SN:'south-node',Lilith:'lilith',Vertex:'vertex',Vx:'vertex','Part of Fortune':'part-of-fortune',Fortune:'part-of-fortune',PoF:'part-of-fortune',MC:'mc',Midheaven:'mc',IC:'ic','Imum Coeli':'ic',Dsc:'dsc',DSC:'dsc',Descendant:'dsc'
  };
  let queued = false;
  let originalOutputParent = null;
  let originalOutputNext = null;
  let selected = null;

  function read(storage, key, fallback) { try { const raw = storage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; } }
  function placements(payload) { const value = payload && (payload.placements || payload); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  function findEntry(map, names) { const wanted = names.map(function (name) { return String(name).trim().toLowerCase(); }); const key = Object.keys(map).find(function (candidate) { return wanted.includes(String(candidate).trim().toLowerCase()); }); return key ? { key:key, item:map[key] } : null; }
  function ordered(map) { const used = new Set(), rows = []; ORDER.forEach(function (names) { const found = findEntry(map,names); if (found && !used.has(found.key)) { used.add(found.key); rows.push(found); } }); Object.keys(map).forEach(function (key) { if (!used.has(key)) rows.push({key:key,item:map[key]}); }); return rows; }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function identity(key) { return ID[key] || window.RelphiGlyphRegistry?.resolve(key)?.id || ''; }
  function coordinate(item) { if (!item) return ''; const degree = item.degree == null || item.degree === '' ? '' : Number(item.degree) + '°'; const minute = item.minute == null || item.minute === '' ? '' : String(Number(item.minute)).padStart(2,'0') + '′'; return degree + minute; }
  function complete(payload) { return ordered(placements(payload)).length >= 20; }
  function profile(payload) { return payload?.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {}; }
  function dateAndTime(value) { if (!value) return {date:'Not recorded',time:'Not recorded'}; const match = String(value).match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/); if (!match) return {date:String(value),time:''}; const date = new Date(Number(match[1]),Number(match[2])-1,Number(match[3]),Number(match[4]),Number(match[5])); return { date:date.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}), time:date.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}) }; }
  function signature(payload) { const p = profile(payload); return [payload?.name,p.dateTime,p.location,p.houseSystem,ordered(placements(payload)).map(function(e){return [e.key,e.item?.sign,e.item?.degree,e.item?.minute,e.item?.house,e.item?.retrograde?'R':''].join(':');}).join('|')].join('||'); }

  function glyph(identityValue, label) { return '<svg class="relphi-workspace-glyph" data-workspace-glyph="'+esc(identityValue)+'" viewBox="-20 -20 40 40" aria-label="'+esc(label)+'" role="img"></svg>'; }
  function row(entry, slot, index) {
    const item = entry.item || {};
    const label = LABEL[entry.key] || entry.key;
    const id = identity(entry.key);
    const signId = window.RelphiGlyphRegistry?.resolve(item.sign || '')?.id || '';
    return '<button type="button" class="relphi-workspace-placement" data-slot="'+slot+'" data-placement-key="'+esc(entry.key)+'" data-glyph-id="'+esc(id)+'" aria-pressed="false">'+
      '<span class="relphi-workspace-index">'+(index+1)+'</span>'+
      '<span class="relphi-workspace-body">'+glyph(id,label)+'<span>'+esc(label)+'</span></span>'+
      '<span class="relphi-workspace-degree">'+esc(coordinate(item))+'</span>'+
      '<span class="relphi-workspace-sign">'+(signId?glyph(signId,item.sign):'')+'<span>'+esc(item.sign || '')+'</span></span>'+
      '<span class="relphi-workspace-house">'+(item.house == null || item.house === '' ? '—' : esc(item.house))+(item.retrograde?' <b title="Retrograde">℞</b>':'')+'</span>'+
    '</button>';
  }
  function plainText(payload) { return ordered(placements(payload)).map(function(entry){ const item=entry.item||{}; return [LABEL[entry.key]||entry.key,item.sign||'',coordinate(item),item.house==null||item.house===''?'':'H'+item.house,item.retrograde?'R':''].filter(Boolean).join(' '); }).join('\n'); }
  function panel(slot,payload) {
    const p = profile(payload); const dt = dateAndTime(p.dateTime); const rows = ordered(placements(payload)); const accent = slot === 'skyB' ? 'blue' : 'red';
    return '<aside class="relphi-workspace-sky is-'+accent+'" data-workspace-slot="'+slot+'">'+
      '<header class="relphi-workspace-sky-header"><span class="relphi-workspace-tab">'+(slot==='skyA'?'Sky A':'Sky B')+'</span><div class="relphi-workspace-actions"><button type="button" data-workspace-action="edit" aria-label="Edit '+slot+'">Edit</button><button type="button" data-workspace-action="copy" aria-label="Copy placements">Copy</button><button type="button" data-workspace-action="clear" aria-label="Clear '+slot+'">Clear</button></div></header>'+
      '<div class="relphi-workspace-title-row"><h2>'+esc(payload?.name || (slot==='skyA'?'Sky A':'Sky B'))+'</h2><span class="relphi-workspace-status '+(complete(payload)?'is-complete':'is-enriching')+'">'+(complete(payload)?'Complete ✓':'Enriching…')+'</span></div>'+
      '<dl class="relphi-workspace-meta"><div><dt>Date</dt><dd>'+esc(dt.date)+'</dd></div><div><dt>Time</dt><dd>'+esc(dt.time)+'</dd></div><div><dt>Location</dt><dd>'+esc(p.location || 'Not recorded')+'</dd></div><div><dt>Houses</dt><dd>'+esc(p.houseSystem || 'Not recorded')+'</dd></div></dl>'+
      '<section class="relphi-workspace-placement-section"><div class="relphi-workspace-placement-heading"><h3>Placements</h3><span>'+rows.length+'</span></div><div class="relphi-workspace-table" role="list" aria-label="'+esc((payload?.name||slot)+' placements')+'">'+rows.map(function(entry,index){return row(entry,slot,index);}).join('')+'</div><p>Sorted by standard order</p></section>'+
      '<footer><button type="button" data-workspace-action="edit">Edit '+(slot==='skyA'?'Sky A':'Sky B')+'</button></footer>'+
    '</aside>';
  }

  function drawGlyphs(root) {
    const component = window.RelphiGlyphComponent; if (!component?.createBubble) return;
    root.querySelectorAll('svg[data-workspace-glyph]:not([data-ready])').forEach(function(svg){ const id=svg.dataset.workspaceGlyph; if(!id)return; svg.dataset.ready='pending'; const bubble=component.createBubble(svg,id,{radius:14,padding:1,color:'#111',fill:'#fff',strokeWidth:2.35}); bubble.ready.then(function(){svg.dataset.ready='true';}).catch(function(){svg.dataset.ready='failed';}); });
  }
  function sourceButton(slot, action) { const panel = document.querySelector('.relphi-v4-sky-panel[data-slot="'+slot+'"]'); return panel?.querySelector(action==='edit'?'[data-edit]':'[data-clear]'); }
  function clearFocus() { selected=null; document.querySelectorAll('.relphi-workspace-placement').forEach(function(row){row.classList.remove('is-selected','is-dimmed');row.setAttribute('aria-pressed','false');}); document.querySelectorAll('.relphi-canonical-marker-host').forEach(function(host){host.style.opacity='';host.classList.remove('relphi-workspace-selected-marker');}); document.querySelectorAll('.relphi-canonical-marker-leader').forEach(function(line){line.style.opacity='';}); const note=document.getElementById('relphiWorkspaceSelection'); if(note){note.innerHTML='<strong>No placement selected</strong><span>Choose any placement to focus its marker and related chart information.</span>';}}
  function focus(slot,key,glyphId,label,coordinateText) {
    selected={slot:slot,key:key,glyphId:glyphId};
    document.querySelectorAll('.relphi-workspace-placement').forEach(function(row){const active=row.dataset.slot===slot&&row.dataset.placementKey===key;row.classList.toggle('is-selected',active);row.classList.toggle('is-dimmed',!active);row.setAttribute('aria-pressed',String(active));});
    document.querySelectorAll('.relphi-canonical-marker-host').forEach(function(host){const active=host.dataset.sky===slot&&host.dataset.glyphId===glyphId;host.style.opacity=active?'1':'.18';host.classList.toggle('relphi-workspace-selected-marker',active);});
    document.querySelectorAll('.relphi-canonical-marker-leader').forEach(function(line){line.style.opacity=line.dataset.glyphId===glyphId?'1':'.12';});
    const note=document.getElementById('relphiWorkspaceSelection'); if(note)note.innerHTML='<strong>Selected: '+esc(label)+' '+esc(coordinateText)+'</strong><button type="button" data-workspace-action="clear-selection">Clear selection</button>';
    window.dispatchEvent(new CustomEvent('relphi:placement-focus',{detail:{slot:slot,key:key,glyphId:glyphId}}));
  }

  function bind(workspace,payloads) {
    if (workspace.dataset.bound==='true') return; workspace.dataset.bound='true';
    workspace.addEventListener('click',function(event){
      const placement=event.target.closest('.relphi-workspace-placement');
      if(placement){const slot=placement.dataset.slot,key=placement.dataset.placementKey,payload=payloads[slot],entry=findEntry(placements(payload),[key]);if(entry)focus(slot,key,placement.dataset.glyphId,LABEL[key]||key,coordinate(entry.item));return;}
      const action=event.target.closest('[data-workspace-action]');if(!action)return;const sky=action.closest('[data-workspace-slot]')?.dataset.workspaceSlot;
      if(action.dataset.workspaceAction==='edit'&&sky)sourceButton(sky,'edit')?.click();
      if(action.dataset.workspaceAction==='clear'&&sky)sourceButton(sky,'clear')?.click();
      if(action.dataset.workspaceAction==='copy'&&sky){const text=plainText(payloads[sky]);navigator.clipboard?.writeText(text);action.textContent='Copied';setTimeout(function(){action.textContent='Copy';},1200);}
      if(action.dataset.workspaceAction==='clear-selection')clearFocus();
    });
  }

  function ensureStyles(){if(document.getElementById('relphi-workspace-style'))return;const style=document.createElement('style');style.id='relphi-workspace-style';style.textContent=`
    #relphiSkyWorkspace{display:grid;grid-template-columns:minmax(290px,390px) minmax(520px,1fr);gap:18px;align-items:start;margin:1rem 0 1.5rem}.has-sky-b#relphiSkyWorkspace{grid-template-columns:minmax(275px,350px) minmax(480px,1fr) minmax(275px,350px)}
    #relphiSkyWorkspace .relphi-workspace-center{min-width:0}.relphi-workspace-sky{--panel-accent:#dc1f18;border:1px solid color-mix(in srgb,var(--panel-accent) 65%,#d9dfe9);border-top:5px solid var(--panel-accent);border-radius:12px;background:#fff;overflow:hidden;min-width:0}.relphi-workspace-sky.is-blue{--panel-accent:#7651c9}
    .relphi-workspace-sky-header{display:flex;align-items:center;justify-content:space-between;padding:0 14px 0 0}.relphi-workspace-tab{display:inline-block;background:var(--panel-accent);color:#fff;padding:.65rem 1.25rem;font-weight:800;clip-path:polygon(0 0,100% 0,86% 100%,0 100%)}.relphi-workspace-actions{display:flex;gap:.25rem}.relphi-workspace-actions button{border:0;background:transparent;padding:.55rem;font-weight:700;cursor:pointer}
    .relphi-workspace-title-row{display:flex;gap:.65rem;align-items:center;justify-content:space-between;padding:14px 16px 8px}.relphi-workspace-title-row h2{margin:0;font-size:1.35rem}.relphi-workspace-status{font-size:.78rem;font-weight:800;padding:.3rem .55rem;border-radius:.35rem;background:#eef9f1;color:#08752b;white-space:nowrap}.relphi-workspace-status.is-enriching{background:#fff6df;color:#865d00}
    .relphi-workspace-meta{display:grid;gap:.4rem;margin:0;padding:0 16px 12px}.relphi-workspace-meta div{display:grid;grid-template-columns:68px 1fr;gap:.5rem}.relphi-workspace-meta dt{font-weight:800;color:#4e5663}.relphi-workspace-meta dd{margin:0;min-width:0;overflow-wrap:anywhere}
    .relphi-workspace-placement-section{margin:0 9px 10px;border:1px solid #dfe3ea;border-radius:9px;overflow:hidden}.relphi-workspace-placement-heading{display:flex;align-items:center;gap:.5rem;padding:.6rem .7rem;background:#fafbfc;border-bottom:1px solid #dfe3ea}.relphi-workspace-placement-heading h3{margin:0;font-size:1rem}.relphi-workspace-placement-heading span{background:#e9edf3;border-radius:999px;padding:.1rem .45rem;font-size:.75rem;font-weight:800}
    .relphi-workspace-table{display:grid}.relphi-workspace-placement{display:grid;grid-template-columns:22px minmax(105px,1.2fr) 58px minmax(82px,1fr) 34px;gap:.35rem;align-items:center;width:100%;min-height:31px;padding:.25rem .45rem;border:0;border-bottom:1px solid #edf0f4;background:#fff;color:#111;text-align:left;font:inherit;cursor:pointer}.relphi-workspace-placement:hover,.relphi-workspace-placement:focus-visible{background:color-mix(in srgb,var(--panel-accent) 8%,#fff)}.relphi-workspace-placement.is-selected{background:color-mix(in srgb,var(--panel-accent) 14%,#fff);box-shadow:inset 3px 0 var(--panel-accent)}.relphi-workspace-placement.is-dimmed{opacity:.48}.relphi-workspace-index{font-size:.72rem;color:#6f7782}.relphi-workspace-body,.relphi-workspace-sign{display:flex;align-items:center;gap:.35rem;min-width:0}.relphi-workspace-body span,.relphi-workspace-sign span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.relphi-workspace-body span{font-weight:700}.relphi-workspace-glyph{width:18px;height:18px;flex:0 0 18px;overflow:visible}.relphi-workspace-degree,.relphi-workspace-house{font-variant-numeric:tabular-nums}.relphi-workspace-placement-section>p{margin:0;padding:.45rem .7rem;color:#6d7480;font-size:.75rem;background:#fafbfc}
    .relphi-workspace-sky footer{padding:8px 16px 14px}.relphi-workspace-sky footer button{width:100%;border:1px solid var(--panel-accent);border-radius:5px;background:#fff;color:var(--panel-accent);padding:.6rem;font-weight:800;cursor:pointer}
    .relphi-workspace-center .sky-output-box{margin:0!important}.relphi-workspace-selection{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-top:.75rem;padding:.8rem 1rem;border:1px solid #dfe3ea;border-radius:9px;background:#fff}.relphi-workspace-selection strong,.relphi-workspace-selection span{display:block}.relphi-workspace-selection button{border:0;background:transparent;color:#174ea6;font-weight:700;cursor:pointer}.relphi-workspace-selected-marker .relphi-glyph-bubble>circle{stroke-width:3.5!important}
    #relphiSkyBuilderV4 .relphi-v4-complete{display:none!important}.relphi-workspace-active #skyResultsToolbar{display:none!important}
    @media(max-width:1100px){#relphiSkyWorkspace,.has-sky-b#relphiSkyWorkspace{grid-template-columns:minmax(260px,340px) minmax(440px,1fr)}.has-sky-b#relphiSkyWorkspace .relphi-workspace-sky[data-workspace-slot="skyB"]{grid-column:1}.has-sky-b#relphiSkyWorkspace .relphi-workspace-center{grid-column:2;grid-row:1/3}}
    @media(max-width:760px){#relphiSkyWorkspace,.has-sky-b#relphiSkyWorkspace{grid-template-columns:1fr}.has-sky-b#relphiSkyWorkspace .relphi-workspace-center,.has-sky-b#relphiSkyWorkspace .relphi-workspace-sky[data-workspace-slot="skyB"]{grid-column:auto;grid-row:auto}.relphi-workspace-center{order:2}.relphi-workspace-sky[data-workspace-slot="skyB"]{order:3}}
  `;document.head.appendChild(style);}

  function restoreOutput(){const output=document.querySelector('.sky-output-box');if(output&&originalOutputParent&&output.parentElement!==originalOutputParent)originalOutputParent.insertBefore(output,originalOutputNext||null);}
  function render(){queued=false;ensureStyles();const root=document.getElementById('relphiSkyBuilderV4');const output=document.querySelector('.sky-output-box');const completeView=root?.querySelector('.relphi-v4-complete');if(!root||!output||!completeView){document.getElementById('relphiSkyWorkspace')?.remove();document.body.classList.remove('relphi-workspace-active');restoreOutput();return;}
    if(!originalOutputParent){originalOutputParent=output.parentElement;originalOutputNext=output.nextSibling;}
    const a=read(localStorage,SLOT_KEYS.skyA,null);const b=read(localStorage,SLOT_KEYS.skyB,null);if(!a||!Object.keys(placements(a)).length)return;
    const sig=signature(a)+'|||'+signature(b);let workspace=document.getElementById('relphiSkyWorkspace');if(!workspace||workspace.dataset.signature!==sig){workspace?.remove();workspace=document.createElement('section');workspace.id='relphiSkyWorkspace';workspace.dataset.signature=sig;workspace.className=b?'has-sky-b':'';workspace.innerHTML=panel('skyA',a)+'<section class="relphi-workspace-center"><div class="relphi-workspace-wheel-slot"></div><div id="relphiWorkspaceSelection" class="relphi-workspace-selection"><div><strong>No placement selected</strong><span>Choose any placement to focus its marker and related chart information.</span></div></div></section>'+(b?panel('skyB',b):'');root.insertAdjacentElement('afterend',workspace);workspace.querySelector('.relphi-workspace-wheel-slot').appendChild(output);bind(workspace,{skyA:a,skyB:b});drawGlyphs(workspace);selected=null;}else if(output.parentElement!==workspace.querySelector('.relphi-workspace-wheel-slot'))workspace.querySelector('.relphi-workspace-wheel-slot').appendChild(output);
    document.body.classList.add('relphi-workspace-active');drawGlyphs(workspace);
  }
  function queue(){if(queued)return;queued=true;requestAnimationFrame(render);}
  function start(){render();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});window.addEventListener('storage',queue);window.addEventListener('relphi:sky-builder-v4-loaded',queue);window.addEventListener('relphi:extra-points-updated',queue);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();