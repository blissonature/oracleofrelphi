// Groups mathematically linked cross-sky structural contacts under Chart Axes.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  let queued=false,running=false;

  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
  function skyNames(){
    const a=read('relphiSkyChartA')||{},b=read('relphiSkyChartB')||{};
    return {a:String(a.name||'').trim().toLowerCase(),b:String(b.name||'').trim().toLowerCase()};
  }
  function compact(node){return String(node.textContent||'').replace(/\s+/g,' ').trim()}
  function relationNames(row){
    const value=compact(row);
    let m=value.match(/^Between\s+(.+?)\s+and\s+(.+?),/i);
    if(m)return [m[1].trim().toLowerCase(),m[2].trim().toLowerCase()];
    m=value.match(/^(.+?)[’']s\s+.+?\s+connects with\s+(.+?)[’']s\s+/i);
    return m?[m[1].trim().toLowerCase(),m[2].trim().toLowerCase()]:null;
  }
  function crossSky(row){
    const pair=relationNames(row),names=skyNames();
    if(!pair||!names.a||!names.b)return false;
    return (pair[0]===names.a&&pair[1]===names.b)||(pair[0]===names.b&&pair[1]===names.a);
  }
  function ids(row){
    const value=compact(row).toLowerCase(),set=new Set();
    if(/\basc\b|ascendant|rising/.test(value))set.add('ASC');
    if(/\bdsc\b|descendant/.test(value))set.add('DSC');
    if(/\bmc\b|midheaven/.test(value))set.add('MC');
    if(/\bic\b|imum coeli/.test(value))set.add('IC');
    if(/☊|north node/.test(value))set.add('NN');
    if(/☋|south node/.test(value))set.add('SN');
    return set;
  }
  function family(row){
    const found=ids(row);
    if(Array.from(found).some(x=>x==='ASC'||x==='DSC')&&Array.from(found).every(x=>x==='ASC'||x==='DSC'))return 'horizon';
    if(Array.from(found).some(x=>x==='MC'||x==='IC')&&Array.from(found).every(x=>x==='MC'||x==='IC'))return 'meridian';
    if(Array.from(found).some(x=>x==='NN'||x==='SN')&&Array.from(found).every(x=>x==='NN'||x==='SN'))return 'nodal';
    return '';
  }
  function aspectClass(row){
    const cls=Array.from(row.classList).find(c=>/^aspect-/.test(c));
    if(cls)return cls;
    const t=compact(row);
    if(t.includes('☌'))return 'aspect-conjunction';
    if(t.includes('☍'))return 'aspect-opposition';
    if(t.includes('□'))return 'aspect-square';
    if(t.includes('△'))return 'aspect-trine';
    if(t.includes('✶'))return 'aspect-sextile';
    if(t.includes('⚻'))return 'aspect-quincunx';
    return 'aspect-other';
  }
  function key(row){
    const pair=relationNames(row)||['',''];
    return [family(row),pair.slice().sort().join('|'),Array.from(ids(row)).sort().join('|'),aspectClass(row),compact(row).replace(/\b(left|right|neutral)\b/ig,'')].join('::');
  }
  function titleFor(name){return name==='horizon'?'Horizon axis':name==='meridian'?'Meridian axis':'Nodal axis'}
  function ensureGroups(axes){
    let host=axes.querySelector('.relphi-cross-axis-groups');
    if(host)return host;
    host=document.createElement('section');
    host.className='relphi-cross-axis-groups';
    host.innerHTML='<h4>A ↔ B</h4><div class="relphi-cross-axis-group-list"></div>';
    axes.appendChild(host);
    return host;
  }
  function makeGroup(name){
    const details=document.createElement('details');
    details.className='relphi-cross-axis-group';
    details.dataset.axisFamily=name;
    details.innerHTML='<summary><span class="relphi-axis-stripes" aria-hidden="true"></span><span class="relphi-axis-group-title">'+titleFor(name)+'</span><span class="relphi-axis-disclosure">⌄</span></summary><div class="relphi-axis-group-members" role="list"></div>';
    return details;
  }
  function render(){
    queued=false;if(running)return;running=true;
    try{
      const axes=document.querySelector('#relphiStructuralRelationshipSections [data-relationship-section="axes"]');
      if(!axes)return;
      const candidates=Array.from(document.querySelectorAll('.relationship-list-row')).filter(row=>!row.closest('.relphi-cross-axis-groups')&&crossSky(row)&&family(row));
      const host=ensureGroups(axes),list=host.querySelector('.relphi-cross-axis-group-list');
      const all=Array.from(list.querySelectorAll('.relationship-list-row')).concat(candidates);
      const unique=new Map();
      all.forEach(row=>{const k=key(row);if(!unique.has(k))unique.set(k,row);else row.remove()});
      list.replaceChildren();
      ['horizon','meridian','nodal'].forEach(name=>{
        const members=Array.from(unique.values()).filter(row=>family(row)===name);
        if(!members.length)return;
        const group=makeGroup(name),memberHost=group.querySelector('.relphi-axis-group-members'),stripes=group.querySelector('.relphi-axis-stripes');
        members.forEach(row=>{
          row.dataset.relphiCrossAxis='true';
          memberHost.appendChild(row);
          const stripe=document.createElement('i');stripe.className=aspectClass(row);stripes.appendChild(stripe);
        });
        list.appendChild(group);
      });
      host.hidden=!list.children.length;
    }finally{running=false}
  }
  function styles(){
    if(document.getElementById('relphi-cross-axis-group-styles'))return;
    const s=document.createElement('style');s.id='relphi-cross-axis-group-styles';
    s.textContent=[
      '.relphi-cross-axis-groups{display:grid;gap:.55rem;margin-top:.35rem;padding-top:.8rem;border-top:1px solid rgba(0,0,0,.12)}',
      '.relphi-cross-axis-groups>h4{margin:0;font-size:.82rem;letter-spacing:.08em;text-transform:uppercase}',
      '.relphi-cross-axis-group-list{display:grid;gap:.5rem}',
      '.relphi-cross-axis-group{overflow:hidden;border:1px solid rgba(0,0,0,.14);border-radius:.8rem;background:rgba(255,255,255,.82)}',
      '.relphi-cross-axis-group>summary{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:.65rem;padding:.68rem .75rem;cursor:pointer;list-style:none;font-weight:800}',
      '.relphi-cross-axis-group>summary::-webkit-details-marker{display:none}',
      '.relphi-axis-stripes{display:flex;align-self:stretch;gap:2px}',
      '.relphi-axis-stripes i{display:block;width:4px;min-height:1.45rem;border-radius:999px;background:#777}',
      '.relphi-axis-stripes .aspect-conjunction{background:#222}.relphi-axis-stripes .aspect-opposition{background:#dc1f18}.relphi-axis-stripes .aspect-square{background:#d26a19}.relphi-axis-stripes .aspect-trine{background:#2473a8}.relphi-axis-stripes .aspect-sextile{background:#348b5b}.relphi-axis-stripes .aspect-quincunx{background:#7b5aa6}',
      '.relphi-axis-disclosure{transition:transform .16s ease}.relphi-cross-axis-group[open] .relphi-axis-disclosure{transform:rotate(180deg)}',
      '.relphi-axis-group-members{display:grid;gap:.45rem;padding:0 .55rem .55rem}',
      '.relphi-axis-group-members .relationship-list-row{margin:0}',
      '@media(max-width:600px){.relphi-cross-axis-group>summary{padding:.62rem}.relphi-axis-group-members{padding:0 .4rem .4rem}}'
    ].join('');
    document.head.appendChild(s);
  }
  function queue(){if(queued)return;queued=true;requestAnimationFrame(render)}
  function start(){styles();render();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true});document.addEventListener('relphi:skyroleschange',queue);window.addEventListener('relphi:sky-builder-v4-loaded',queue)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
