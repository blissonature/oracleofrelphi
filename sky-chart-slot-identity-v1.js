// Makes each Sky card the authoritative editing context and foregrounds recognizable placements.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  const SLOT={skyA:'relphiSkyChartA',skyB:'relphiSkyChartB'};
  let queued=false;

  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
  function placements(payload){const p=payload&&(payload.placements||payload);return p&&typeof p==='object'&&!Array.isArray(p)?p:{}}
  function findPlacement(map,names){const wanted=names.map(x=>x.toLowerCase());const key=Object.keys(map).find(k=>wanted.includes(String(k).trim().toLowerCase()));return key?map[key]:null}
  function coordinate(item){
    if(!item)return 'Not set';
    const sign=String(item.sign||'').trim();
    const degree=item.degree==null||item.degree===''?'':Number(item.degree)+'°';
    const minute=item.minute==null||item.minute===''?'':String(Number(item.minute)).padStart(2,'0')+'′';
    return [sign,[degree,minute].filter(Boolean).join('')].filter(Boolean).join(' ')||'Not set';
  }
  function identityCard(label,value,glyph){return '<div class="relphi-sky-identity-item"><span class="relphi-sky-identity-glyph" aria-hidden="true">'+glyph+'</span><span class="relphi-sky-identity-copy"><small>'+label+'</small><strong>'+value+'</strong></span></div>'}
  function enhancePanel(panel){
    const slot=panel.dataset.slot;
    const payload=read(SLOT[slot]);
    if(!payload)return;
    const map=placements(payload);
    const sun=findPlacement(map,['Sun']);
    const moon=findPlacement(map,['Moon']);
    const rising=findPlacement(map,['Rising','Ascendant','ASC','AC']);
    let strip=panel.querySelector('.relphi-sky-identity-strip');
    if(!strip){strip=document.createElement('div');strip.className='relphi-sky-identity-strip';const count=panel.querySelector('.relphi-v4-panel-copy > p');(count||panel.querySelector('.relphi-v4-panel-copy h3'))?.insertAdjacentElement('afterend',strip)}
    strip.innerHTML=identityCard('Sun',coordinate(sun),'☉')+identityCard('Moon',coordinate(moon),'☽')+identityCard('Rising',coordinate(rising),'ASC');
    strip.dataset.signature=[coordinate(sun),coordinate(moon),coordinate(rising)].join('|');
  }
  function hideTargetControl(id){
    const field=document.getElementById(id);if(!field)return;
    const wrapper=field.closest('label,.field-row,.form-row,.sky-field,.sky-calc-field')||field.parentElement;
    if(wrapper){wrapper.hidden=true;wrapper.setAttribute('aria-hidden','true');wrapper.dataset.relphiDeprecatedTarget='true'}
    field.tabIndex=-1;
  }
  function enforceContext(){
    hideTargetControl('skyCalcTarget');
    hideTargetControl('skyCreatorTarget');
    document.querySelectorAll('.relphi-v4-sky-panel[data-slot]').forEach(enhancePanel);
  }
  function styles(){
    if(document.getElementById('relphi-slot-identity-styles'))return;
    const s=document.createElement('style');s.id='relphi-slot-identity-styles';
    s.textContent='[data-relphi-deprecated-target="true"]{display:none!important}.relphi-sky-identity-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.55rem;margin:.9rem 0 1rem}.relphi-sky-identity-item{display:flex;align-items:center;gap:.55rem;min-width:0;padding:.65rem .7rem;border:1px solid color-mix(in srgb,var(--sky-accent) 24%,#e4ddd6);border-radius:14px;background:color-mix(in srgb,var(--sky-accent) 5%,#fff)}.relphi-sky-identity-glyph{display:grid;place-items:center;flex:0 0 auto;width:1.75rem;height:1.75rem;border-radius:50%;font-weight:900;color:var(--sky-accent);background:#fff}.relphi-sky-identity-copy{display:grid;min-width:0;line-height:1.15}.relphi-sky-identity-copy small{font-size:.68rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#756b64}.relphi-sky-identity-copy strong{font-size:.93rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:520px){.relphi-sky-identity-strip{grid-template-columns:1fr}.relphi-sky-identity-copy strong{white-space:normal}}';
    document.head.appendChild(s);
  }
  function run(){queued=false;enforceContext()}
  function queue(){if(queued)return;queued=true;requestAnimationFrame(run)}
  function start(){styles();run();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});window.addEventListener('storage',queue);document.addEventListener('relphi:skyroleschange',queue);window.addEventListener('relphi:sky-builder-v4-loaded',queue)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();