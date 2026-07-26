// Makes each Sky card the authoritative editing context and foregrounds recognizable placements.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  const SLOT={skyA:'relphiSkyChartA',skyB:'relphiSkyChartB'};
  const ORDER=[
    ['Sun'],['Moon'],['Rising','Ascendant','ASC','AC'],['Mercury'],['Venus'],['Mars'],['Jupiter'],['Saturn'],['Uranus'],['Neptune'],['Pluto'],['Chiron'],
    ['North Node','Node','NN'],['South Node','SouthNode','SN'],['Lilith'],['Vertex','Vx'],['Part of Fortune','Fortune','PoF'],['Dsc','DSC','Descendant'],['MC','Midheaven'],['IC','Imum Coeli']
  ];
  const LABEL={Rising:'Rising',Ascendant:'Rising',ASC:'Rising',AC:'Rising',Dsc:'Descendant',DSC:'Descendant',MC:'MC',IC:'IC'};
  const AXES=[
    {left:['Rising','Ascendant','ASC','AC'],right:['Dsc','DSC','Descendant'],leftId:'asc',rightId:'dsc',name:'Ascendant–Descendant',meaning:'the axis between self-presentation and the qualities encountered through partners and counterparts'},
    {left:['MC','Midheaven'],right:['IC','Imum Coeli'],leftId:'mc',rightId:'ic',name:'Midheaven–Imum Coeli',meaning:'the axis between public direction and the private roots that support it'},
    {left:['North Node','Node','NN'],right:['South Node','SouthNode','SN'],leftId:'north-node',rightId:'south-node',name:'North Node–South Node',meaning:'the axis between developmental direction and familiar patterns being integrated'}
  ];
  let queued=false;

  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
  function placements(payload){const p=payload&&(payload.placements||payload);return p&&typeof p==='object'&&!Array.isArray(p)?p:{}}
  function findEntry(map,names){const wanted=names.map(x=>x.toLowerCase());const key=Object.keys(map).find(k=>wanted.includes(String(k).trim().toLowerCase()));return key?{key,item:map[key]}:null}
  function coordinate(item){
    if(!item)return 'Not set';
    const sign=String(item.sign||'').trim();
    const degree=item.degree==null||item.degree===''?'':Number(item.degree)+'°';
    const minute=item.minute==null||item.minute===''?'':String(Number(item.minute)).padStart(2,'0')+'′';
    const retro=item.retrograde?' ℞':'';
    return [sign,[degree,minute].filter(Boolean).join('')].filter(Boolean).join(' ')+retro||'Not set';
  }
  function escapeHtml(value){return String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c])}
  function glyphMount(identity,label){
    return '<svg class="relphi-canonical-card-glyph" data-relphi-glyph="'+escapeHtml(identity)+'" viewBox="-12 -12 24 24" role="img" aria-label="'+escapeHtml(label)+'"></svg>';
  }
  function renderGlyphs(root){
    if(!window.RelphiGlyphComponent)return;
    const panel=root.closest('.relphi-v4-sky-panel');
    const color=(panel&&getComputedStyle(panel).getPropertyValue('--sky-accent').trim())||'#dc1f18';
    root.querySelectorAll('svg[data-relphi-glyph]:not([data-relphi-rendered])').forEach(function(svg){
      svg.dataset.relphiRendered='pending';
      window.RelphiGlyphComponent.draw(svg,svg.dataset.relphiGlyph,{radius:10.3,padding:.9,color:color,bubbleStrokeWidth:0})
        .then(function(){svg.dataset.relphiRendered='true'})
        .catch(function(){svg.dataset.relphiRendered='error';svg.setAttribute('aria-label',(svg.getAttribute('aria-label')||'Glyph')+' unavailable')});
    });
  }
  function identityCard(label,value,identity){
    return '<div class="relphi-sky-identity-item"><span class="relphi-sky-identity-glyph">'+glyphMount(identity,label)+'</span><span class="relphi-sky-identity-copy"><small>'+label+'</small><strong>'+escapeHtml(value)+'</strong></span></div>';
  }
  function orderedEntries(map){
    const used=new Set(),result=[];
    ORDER.forEach(names=>{const found=findEntry(map,names);if(found&&!used.has(found.key)){used.add(found.key);result.push(found)}});
    Object.keys(map).forEach(key=>{if(!used.has(key))result.push({key,item:map[key]})});
    return result;
  }
  function rebuildPreview(panel,map){
    const list=panel.querySelector('.relphi-v4-placement-preview');
    if(!list)return;
    const ordered=orderedEntries(map);
    const shown=ordered.slice(0,6);
    list.innerHTML=shown.map(entry=>'<li><strong>'+escapeHtml(LABEL[entry.key]||entry.key)+'</strong><span>'+escapeHtml(coordinate(entry.item))+'</span></li>').join('')+(ordered.length>6?'<li class="more">+'+(ordered.length-6)+' more</li>':'');
    list.dataset.relphiOrdered='true';
  }
  function axisGlyph(identity){return '<span class="relphi-axis-glyph">'+glyphMount(identity,identity)+'</span>'}
  function axisRow(axis,map){
    const left=findEntry(map,axis.left),right=findEntry(map,axis.right);
    if(!left||!right)return '';
    return '<div class="relphi-card-axis" data-reveal-level="glyph">'+
      '<button type="button" class="relphi-card-axis-symbols" aria-expanded="false">'+axisGlyph(axis.leftId)+'<span class="relphi-axis-coordinate">'+escapeHtml(coordinate(left.item))+'</span><span class="relphi-axis-link" aria-hidden="true">↔</span>'+axisGlyph(axis.rightId)+'<span class="relphi-axis-coordinate">'+escapeHtml(coordinate(right.item))+'</span></button>'+
      '<button type="button" class="relphi-card-axis-name" hidden>'+escapeHtml(axis.name)+'</button>'+
      '<button type="button" class="relphi-card-axis-meaning" hidden>'+escapeHtml(axis.meaning)+'</button>'+
    '</div>';
  }
  function bindAxes(section){
    if(section.dataset.relphiBound)return;
    section.dataset.relphiBound='true';
    section.addEventListener('click',event=>{
      const row=event.target.closest('.relphi-card-axis');if(!row)return;
      const symbols=event.target.closest('.relphi-card-axis-symbols');
      const name=event.target.closest('.relphi-card-axis-name');
      const meaning=event.target.closest('.relphi-card-axis-meaning');
      const nameButton=row.querySelector('.relphi-card-axis-name');
      const meaningButton=row.querySelector('.relphi-card-axis-meaning');
      if(symbols){
        const open=row.dataset.revealLevel!=='glyph';
        row.dataset.revealLevel=open?'glyph':'name';
        nameButton.hidden=open;meaningButton.hidden=true;symbols.setAttribute('aria-expanded',open?'false':'true');
      }else if(name){
        const open=row.dataset.revealLevel==='meaning';
        row.dataset.revealLevel=open?'name':'meaning';meaningButton.hidden=open;
      }else if(meaning){
        row.dataset.revealLevel='name';meaningButton.hidden=true;
      }
    });
  }
  function addAxes(panel,map){
    let section=panel.querySelector('.relphi-card-axes');
    if(!section){
      section=document.createElement('section');section.className='relphi-card-axes';section.innerHTML='<div class="relphi-card-axes-heading"><h4>Chart Axes</h4></div><div class="relphi-card-axes-list"></div>';
      const list=panel.querySelector('.relphi-v4-placement-preview');(list||panel.querySelector('.relphi-v4-panel-copy'))?.insertAdjacentElement('afterend',section);
    }
    const rows=AXES.map(axis=>axisRow(axis,map)).filter(Boolean);
    section.hidden=!rows.length;
    section.querySelector('.relphi-card-axes-list').innerHTML=rows.join('');
    bindAxes(section);
    renderGlyphs(section);
  }
  function enhancePanel(panel){
    const slot=panel.dataset.slot;
    const payload=read(SLOT[slot]);
    if(!payload)return;
    const map=placements(payload);
    const sun=findEntry(map,['Sun']);
    const moon=findEntry(map,['Moon']);
    const rising=findEntry(map,['Rising','Ascendant','ASC','AC']);
    let strip=panel.querySelector('.relphi-sky-identity-strip');
    if(!strip){strip=document.createElement('div');strip.className='relphi-sky-identity-strip';const count=panel.querySelector('.relphi-v4-panel-copy > p');(count||panel.querySelector('.relphi-v4-panel-copy h3'))?.insertAdjacentElement('afterend',strip)}
    const signature=[coordinate(sun&&sun.item),coordinate(moon&&moon.item),coordinate(rising&&rising.item)].join('|');
    if(strip.dataset.signature!==signature){
      strip.innerHTML=identityCard('Sun',coordinate(sun&&sun.item),'sun')+identityCard('Moon',coordinate(moon&&moon.item),'moon')+identityCard('Rising',coordinate(rising&&rising.item),'asc');
      strip.dataset.signature=signature;
    }
    renderGlyphs(strip);
    rebuildPreview(panel,map);
    addAxes(panel,map);
  }
  function hideTargetControl(id){
    const field=document.getElementById(id);if(!field)return;
    const wrapper=field.closest('label,.field-row,.form-row,.sky-field,.sky-calc-field')||field.parentElement;
    if(wrapper){wrapper.hidden=true;wrapper.setAttribute('aria-hidden','true');wrapper.dataset.relphiDeprecatedTarget='true'}
    field.tabIndex=-1;
  }
  function retireStandaloneAxes(){
    const host=document.getElementById('relphiStructuralRelationshipSections');if(!host)return;
    const axes=host.querySelector('[data-relationship-section="axes"]');if(axes)axes.hidden=true;
    const visible=Array.from(host.querySelectorAll('.relphi-relationship-subsection')).some(section=>!section.hidden&&section.dataset.relationshipSection!=='axes');
    host.hidden=!visible;
  }
  function enforceContext(){
    hideTargetControl('skyCalcTarget');
    hideTargetControl('skyCreatorTarget');
    document.querySelectorAll('.relphi-v4-sky-panel[data-slot]').forEach(enhancePanel);
    retireStandaloneAxes();
  }
  function styles(){
    if(document.getElementById('relphi-slot-identity-styles'))return;
    const s=document.createElement('style');s.id='relphi-slot-identity-styles';
    s.textContent='[data-relphi-deprecated-target="true"]{display:none!important}.relphi-sky-identity-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.55rem;margin:.9rem 0 1rem}.relphi-sky-identity-item{display:flex;align-items:center;gap:.55rem;min-width:0;padding:.65rem .7rem;border:1px solid color-mix(in srgb,var(--sky-accent) 24%,#e4ddd6);border-radius:14px;background:color-mix(in srgb,var(--sky-accent) 5%,#fff)}.relphi-sky-identity-glyph{display:grid;place-items:center;flex:0 0 auto;width:1.75rem;height:1.75rem;border-radius:50%;background:#fff}.relphi-canonical-card-glyph{display:block;width:100%;height:100%;overflow:visible}.relphi-sky-identity-copy{display:grid;min-width:0;line-height:1.15}.relphi-sky-identity-copy small{font-size:.68rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#756b64}.relphi-sky-identity-copy strong{font-size:.93rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.relphi-card-axes{margin-top:1rem;padding-top:.9rem;border-top:1px solid #e8e0d9}.relphi-card-axes-heading{display:flex;align-items:center;justify-content:space-between}.relphi-card-axes-heading h4{margin:0 0 .55rem;font-size:.82rem;letter-spacing:.08em;text-transform:uppercase}.relphi-card-axes-list{display:grid;gap:.45rem}.relphi-card-axis{display:grid;gap:.3rem}.relphi-card-axis button{appearance:none;border:0!important;box-shadow:none!important;background:transparent!important;color:inherit;min-height:0!important;padding:.35rem .2rem!important;text-align:left}.relphi-card-axis-symbols{display:grid!important;grid-template-columns:1.45rem minmax(0,1fr) auto 1.45rem minmax(0,1fr);align-items:center;gap:.38rem;width:100%}.relphi-axis-glyph{display:block;width:1.35rem;height:1.35rem}.relphi-axis-coordinate{font-size:.78rem;color:#5f5751}.relphi-axis-link{font-weight:900;color:var(--sky-accent)}.relphi-card-axis-name{font-weight:800!important;text-decoration:underline dotted rgba(17,17,17,.38);text-underline-offset:.18em}.relphi-card-axis-meaning{font-size:.82rem!important;color:#5f5751!important;line-height:1.4}.relphi-card-axis button:hover,.relphi-card-axis button:focus-visible{color:#b81712;outline:2px solid rgba(220,31,24,.28);outline-offset:2px;border-radius:.35rem}@media(max-width:520px){.relphi-sky-identity-strip{grid-template-columns:1fr}.relphi-sky-identity-copy strong{white-space:normal}.relphi-card-axis-symbols{grid-template-columns:1.25rem minmax(0,1fr) auto 1.25rem minmax(0,1fr)}}';
    document.head.appendChild(s);
  }
  function run(){queued=false;enforceContext()}
  function queue(){if(queued)return;queued=true;requestAnimationFrame(run)}
  function start(){styles();run();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});window.addEventListener('storage',queue);document.addEventListener('relphi:skyroleschange',queue);window.addEventListener('relphi:sky-builder-v4-loaded',queue)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();