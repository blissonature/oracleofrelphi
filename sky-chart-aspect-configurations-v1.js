// Compound aspect configuration detector + Aspects popover integration.
// Detection is driven by the full relationship pool inside the active Harmonic Window,
// not by the current simple-aspect visibility choices.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyAspectConfigurationsV1)return;
window.__relphiSkyAspectConfigurationsV1=true;

const SIMPLE_GROUPS=Object.freeze([
  {id:'major',label:'Major',aspects:['conjunction','opposition','trine','square','sextile']},
  {id:'minor',label:'Minor',aspects:['semi-sextile','octile','tri-octile','quincunx']},
  {id:'harmonic',label:'Harmonic',aspects:['quintile','bi-quintile']}
]);
const TYPES=Object.freeze([
  {id:'grand-trine',label:'Grand Trine',vertices:3},
  {id:'kite',label:'Kite',vertices:4},
  {id:'yod',label:'Yod / Finger of God',vertices:3},
  {id:'mystic-rectangle',label:'Mystic Rectangle',vertices:4},
  {id:'t-square',label:'T-Square',vertices:3},
  {id:'grand-cross',label:'Grand Cross',vertices:4},
  {id:'minor-grand-trine',label:'Minor Grand Trine',vertices:3},
  {id:'grand-sextile',label:'Grand Sextile',vertices:6},
  {id:'cradle',label:'Cradle',vertices:4},
  {id:'thors-hammer',label:"Thor's Hammer / Fist of God",vertices:3}
]);
const TYPE_MAP=new Map(TYPES.map(type=>[type.id,type]));
const PLACEMENT_SYMBOLS=Object.freeze({sun:'☉',moon:'☽',mercury:'☿',venus:'♀',mars:'♂',jupiter:'♃',saturn:'♄',uranus:'♅',neptune:'♆',pluto:'♇',chiron:'⚷','north-node':'☊','south-node':'☋',lilith:'⚸','part-of-fortune':'⊗',vertex:'Vx','anti-vertex':'AVx',asc:'Asc',dsc:'Dsc',mc:'MC',ic:'IC'});
const selectedTypes=new Set();
let patterns=[];
let queued=false;
let applying=false;
let activePatternKey='';

function popoverBody(){return document.querySelector('#skyChartAspectPopover .sky-chart-aspect-filter-body')}
function harmonicWindow(){const model=window.RelphiHarmonicOrb;const value=Number(model?.getWindow?.()??model?.defaultWindow??6);return Number.isFinite(value)?value:6}
function bActive(){const html=document.documentElement;return html.dataset.skyBEditing==='true'||html.dataset.skyBPresent==='true'}
function relationshipMode(row){const raw=String(row?.dataset?.relationshipMode||'').toUpperCase();if(raw==='A-A'||raw==='B-B'||raw==='A-B')return raw;if(raw==='B-A')return'A-B';const l=String(row?.dataset?.leftSky||'').toUpperCase(),r=String(row?.dataset?.rightSky||'').toUpperCase();if(l&&r)return l===r?`${l}-${r}`:'A-B';return'A-B'}
function activeMode(mode){return bActive()?['A-A','B-B','A-B'].includes(mode):mode==='A-A'}
function nodeKey(sky,placement){return`${String(sky||'').toUpperCase()}:${String(placement||'')}`}
function edgeKey(a,b){return[a,b].sort().join('|')}
function patternKey(type,vertices){return`${type}:${vertices.slice().sort().join('|')}`}
function phaseError(row){const direct=Number(row.dataset.phaseError);if(Number.isFinite(direct))return direct;const orb=Number(row.dataset.sourceOrb??row.dataset.orb),harmonic=Number(row.dataset.harmonicOrder)||1;return Number.isFinite(orb)?Math.abs(orb)*harmonic:Number.POSITIVE_INFINITY}
function eligibleRow(row,windowValue){if(!activeMode(relationshipMode(row)))return false;if(row.classList.contains('sky-foundation-single-sky-cross-hidden'))return false;return phaseError(row)<=windowValue+1e-9}
function endpoint(row,side){const prefix=side==='left'?'left':'right';return{key:nodeKey(row.dataset[`${prefix}Sky`],row.dataset[`${prefix}Placement`]),sky:String(row.dataset[`${prefix}Sky`]||'').toUpperCase(),placement:String(row.dataset[`${prefix}Placement`]||''),sign:Number(row.dataset[`${prefix}Sign`]),house:Number(row.dataset[`${prefix}House`])}}
function collectGraph(){
  const windowValue=harmonicWindow(),rows=[...document.querySelectorAll('.sky-foundation-relationship-row[data-aspect]')].filter(row=>eligibleRow(row,windowValue));
  const nodes=new Map(),edges=new Map();
  for(const row of rows){
    const left=endpoint(row,'left'),right=endpoint(row,'right');if(!left.key||!right.key||left.key===right.key)continue;
    nodes.set(left.key,left);nodes.set(right.key,right);
    const key=edgeKey(left.key,right.key),aspect=String(row.dataset.aspect||'');if(!aspect)continue;
    let byAspect=edges.get(key);if(!byAspect){byAspect=new Map();edges.set(key,byAspect)}
    const current=byAspect.get(aspect),phase=phaseError(row);if(!current||phase<current.phase)byAspect.set(aspect,{row,aspect,phase,left:left.key,right:right.key});
  }
  return{windowValue,nodes,edges};
}
function getEdge(graph,a,b,aspect){return graph.edges.get(edgeKey(a,b))?.get(aspect)||null}
function required(graph,pairs){const edges=[];for(const [a,b,aspect] of pairs){const edge=getEdge(graph,a,b,aspect);if(!edge)return null;edges.push(edge)}return edges}
function addPattern(out,type,vertices,edges,meta={}){const key=patternKey(type,vertices);if(out.some(item=>item.key===key))return;const phases=edges.map(edge=>edge.phase).filter(Number.isFinite);out.push({key,type,vertices:vertices.slice(),edges:edges.slice(),maxPhase:phases.length?Math.max(...phases):Number.POSITIVE_INFINITY,meanPhase:phases.length?phases.reduce((sum,value)=>sum+value,0)/phases.length:Number.POSITIVE_INFINITY,...meta})}
function combinations(items,size){const out=[];function walk(start,pick){if(pick.length===size){out.push(pick.slice());return}for(let i=start;i<=items.length-(size-pick.length);i+=1){pick.push(items[i]);walk(i+1,pick);pick.pop()}}walk(0,[]);return out}
function aspectCounts(graph,vertices){const counts=new Map(),edges=[];for(let i=0;i<vertices.length;i+=1)for(let j=i+1;j<vertices.length;j+=1){const byAspect=graph.edges.get(edgeKey(vertices[i],vertices[j]));if(!byAspect||!byAspect.size)return null;let chosen=null;for(const edge of byAspect.values())if(!chosen||edge.phase<chosen.phase)chosen=edge;if(!chosen)return null;counts.set(chosen.aspect,(counts.get(chosen.aspect)||0)+1);edges.push(chosen)}return{counts,edges}}
function countIs(counts,expected){for(const [aspect,count] of Object.entries(expected))if((counts.get(aspect)||0)!==count)return false;let total=0;for(const count of counts.values())total+=count;return total===Object.values(expected).reduce((sum,value)=>sum+value,0)}
function detect(){
  const graph=collectGraph(),nodes=[...graph.nodes.keys()],out=[];
  for(const [a,b,c] of combinations(nodes,3)){
    let edges=required(graph,[[a,b,'trine'],[a,c,'trine'],[b,c,'trine']]);if(edges)addPattern(out,'grand-trine',[a,b,c],edges);
    const triple=[[a,b,c],[a,c,b],[b,c,a]];
    for(const [base1,base2,apex] of triple){
      edges=required(graph,[[base1,base2,'sextile'],[base1,apex,'quincunx'],[base2,apex,'quincunx']]);if(edges)addPattern(out,'yod',[a,b,c],edges,{apex});
      edges=required(graph,[[base1,base2,'opposition'],[base1,apex,'square'],[base2,apex,'square']]);if(edges)addPattern(out,'t-square',[a,b,c],edges,{apex});
      edges=required(graph,[[base1,base2,'trine'],[base1,apex,'sextile'],[base2,apex,'sextile']]);if(edges)addPattern(out,'minor-grand-trine',[a,b,c],edges,{apex});
      edges=required(graph,[[base1,base2,'square'],[base1,apex,'tri-octile'],[base2,apex,'tri-octile']]);if(edges)addPattern(out,'thors-hammer',[a,b,c],edges,{apex});
    }
  }
  for(const vertices of combinations(nodes,4)){
    const info=aspectCounts(graph,vertices);if(!info)continue;
    if(countIs(info.counts,{opposition:2,trine:2,sextile:2}))addPattern(out,'mystic-rectangle',vertices,info.edges);
    if(countIs(info.counts,{opposition:2,square:4}))addPattern(out,'grand-cross',vertices,info.edges);
    if(countIs(info.counts,{trine:3,sextile:2,opposition:1}))addPattern(out,'kite',vertices,info.edges);
    if(countIs(info.counts,{opposition:1,trine:2,sextile:3}))addPattern(out,'cradle',vertices,info.edges);
  }
  const grandTrines=out.filter(pattern=>pattern.type==='grand-trine');
  for(let i=0;i<grandTrines.length;i+=1)for(let j=i+1;j<grandTrines.length;j+=1){
    const union=[...new Set([...grandTrines[i].vertices,...grandTrines[j].vertices])];if(union.length!==6)continue;
    const info=aspectCounts(graph,union);if(info&&countIs(info.counts,{sextile:6,trine:6,opposition:3}))addPattern(out,'grand-sextile',union,info.edges);
  }
  out.sort((a,b)=>a.maxPhase-b.maxPhase||a.meanPhase-b.meanPhase||TYPES.findIndex(type=>type.id===a.type)-TYPES.findIndex(type=>type.id===b.type));
  return{graph,patterns:out};
}
function simpleCategoryHeading(label){const div=document.createElement('div');div.className='sky-chart-aspect-category-heading';div.textContent=label;return div}
function decorateSimpleGroups(){
  const list=document.querySelector('#skyChartAspectPopover [data-aspect-list="matrix"]');if(!list)return;
  list.querySelectorAll('.sky-chart-aspect-category-heading').forEach(node=>node.remove());
  const master=list.querySelector('[data-aspect-matrix-row="all"]');
  if(master&&master.parentElement===list)list.insertBefore(master,list.querySelector('[data-aspect-matrix-row]:not([data-aspect-matrix-row="all"])'));
  let anchor=master;
  for(const group of SIMPLE_GROUPS){
    const heading=simpleCategoryHeading(group.label);if(anchor?.nextSibling)list.insertBefore(heading,anchor.nextSibling);else list.appendChild(heading);anchor=heading;
    for(const id of group.aspects){const row=list.querySelector(`[data-aspect-matrix-row="${id}"]`);if(row){if(anchor.nextSibling)list.insertBefore(row,anchor.nextSibling);else list.appendChild(row);anchor=row}}
  }
}
function provenance(pattern,graph){const skies=new Set(pattern.vertices.map(key=>graph.nodes.get(key)?.sky).filter(Boolean));if(skies.size===1){const sky=[...skies][0];return`${sky}↔${sky}`}return'A+B'}
function vertexLabel(key,graph){const node=graph.nodes.get(key);if(!node)return key;return`${node.sky} ${PLACEMENT_SYMBOLS[node.placement]||node.placement}`}
function typePatterns(type){return patterns.filter(pattern=>pattern.type===type)}
function availableTypes(){return new Set(TYPES.filter(type=>typePatterns(type.id).length).map(type=>type.id))}
function configCheckbox(id,label,count,master=false){
  const row=document.createElement('label');row.className=`sky-chart-configuration-choice${master?' sky-chart-configuration-choice-master':''}`;
  const text=document.createElement('span');text.className='sky-chart-configuration-name';text.textContent=label;
  const badge=document.createElement('span');badge.className='sky-chart-configuration-count';badge.textContent=String(count);
  const input=document.createElement('input');input.type='checkbox';input.dataset.configurationChoice=id;input.setAttribute('aria-label',label);
  row.append(text,badge,input);return row;
}
function syncConfigInputs(){
  const available=availableTypes(),master=document.querySelector('[data-configuration-choice="all"]'),enabled=[...available].filter(id=>selectedTypes.has(id));
  if(master){master.checked=available.size>0&&enabled.length===available.size;master.indeterminate=enabled.length>0&&enabled.length<available.size;master.disabled=available.size===0}
  document.querySelectorAll('[data-configuration-choice]:not([data-configuration-choice="all"])').forEach(input=>{const id=input.dataset.configurationChoice;input.checked=selectedTypes.has(id);input.disabled=!available.has(id)});
}
function renderDetectedList(section,graph){
  const chosen=patterns.filter(pattern=>selectedTypes.has(pattern.type));
  const results=document.createElement('div');results.className='sky-chart-configuration-results';
  if(!chosen.length){const note=document.createElement('div');note.className='sky-chart-configuration-empty';note.textContent=patterns.length?'Select a configuration to highlight it on the wheel.':'No configurations fall within the current Harmonic Window.';results.appendChild(note);section.appendChild(results);return}
  for(const pattern of chosen){
    const button=document.createElement('button');button.type='button';button.className='sky-chart-configuration-result';button.dataset.configurationPattern=pattern.key;if(pattern.key===activePatternKey)button.classList.add('is-active');
    const label=document.createElement('strong');label.textContent=TYPE_MAP.get(pattern.type)?.label||pattern.type;
    const detail=document.createElement('span');detail.textContent=`${provenance(pattern,graph)} · ${pattern.vertices.map(key=>vertexLabel(key,graph)).join(' · ')} · max phase ${Number(pattern.maxPhase.toFixed(2))}°`;
    button.append(label,detail);results.appendChild(button);
  }
  section.appendChild(results);
}
function renderConfigurationSection(graph){
  const body=popoverBody();if(!body)return;
  body.querySelector('.sky-chart-configuration-section')?.remove();
  const section=document.createElement('section');section.className='sky-chart-configuration-section';section.setAttribute('aria-label','Configurations');
  const title=document.createElement('div');title.className='sky-chart-configuration-title';title.textContent='Configurations';section.appendChild(title);
  const list=document.createElement('div');list.className='sky-chart-configuration-list';
  list.appendChild(configCheckbox('all','All configurations',patterns.length,true));
  TYPES.forEach(type=>list.appendChild(configCheckbox(type.id,type.label,typePatterns(type.id).length,false)));
  section.appendChild(list);renderDetectedList(section,graph);body.appendChild(section);syncConfigInputs();
}
function relationIndex(edge){return String(edge?.row?.dataset?.relationIndex||'')}
function matchingBaseLine(edge){
  const row=edge.row,index=relationIndex(edge);if(index){const byIndex=document.querySelector(`[data-layer="aspects"]>.sky-foundation-aspect[data-relation-index="${CSS.escape(index)}"]`);if(byIndex)return byIndex}
  const aspect=String(row.dataset.aspect||''),lp=String(row.dataset.leftPlacement||''),rp=String(row.dataset.rightPlacement||''),ls=String(row.dataset.leftSky||''),rs=String(row.dataset.rightSky||'');
  return[...document.querySelectorAll(`[data-layer="aspects"]>.sky-foundation-aspect[data-aspect="${CSS.escape(aspect)}"]`)].find(line=>String(line.dataset.leftPlacement||'')===lp&&String(line.dataset.rightPlacement||'')===rp&&String(line.dataset.leftSky||'')===ls&&String(line.dataset.rightSky||'')===rs)||null;
}
function ensureOverlay(){
  const wheel=document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel');if(!wheel)return null;
  let layer=wheel.querySelector('[data-layer="configurations"]');if(layer)return layer;
  layer=document.createElementNS('http://www.w3.org/2000/svg','g');layer.dataset.layer='configurations';layer.classList.add('sky-chart-configuration-overlay');const aspectLayer=wheel.querySelector('[data-layer="aspects"]');if(aspectLayer?.nextSibling)wheel.insertBefore(layer,aspectLayer.nextSibling);else wheel.appendChild(layer);return layer;
}
function renderOverlay(){
  const layer=ensureOverlay();if(!layer)return;layer.replaceChildren();
  const chosen=activePatternKey?patterns.filter(pattern=>pattern.key===activePatternKey):patterns.filter(pattern=>selectedTypes.has(pattern.type));
  const seen=new Set();
  for(const pattern of chosen)for(const edge of pattern.edges){const index=relationIndex(edge)||`${edge.left}|${edge.right}|${edge.aspect}`;if(seen.has(index))continue;seen.add(index);const base=matchingBaseLine(edge);if(!base)continue;const line=document.createElementNS('http://www.w3.org/2000/svg','line');['x1','y1','x2','y2','stroke'].forEach(name=>{const value=base.getAttribute(name);if(value!=null)line.setAttribute(name,value)});line.setAttribute('vector-effect','non-scaling-stroke');line.classList.add('sky-chart-configuration-line');line.dataset.configurationRelation=index;layer.appendChild(line)}
  document.documentElement.dataset.skyConfigurationSelection=selectedTypes.size?`${selectedTypes.size}/${TYPES.length}`:'0';
}
function setSelection(id,checked){
  const available=availableTypes();
  if(id==='all'){selectedTypes.clear();if(checked)available.forEach(type=>selectedTypes.add(type))}
  else if(checked&&available.has(id))selectedTypes.add(id);else selectedTypes.delete(id);
  if(activePatternKey&&!patterns.some(pattern=>pattern.key===activePatternKey&&selectedTypes.has(pattern.type)))activePatternKey='';
  syncConfigInputs();renderOverlay();const result=detect();renderConfigurationSection(result.graph);window.dispatchEvent(new CustomEvent('relphi:sky-configuration-selection-changed',{detail:{selected:[...selectedTypes],activePattern:activePatternKey}}));
}
function refresh(){queued=false;if(applying)return;applying=true;try{decorateSimpleGroups();const result=detect();patterns=result.patterns;const available=availableTypes();[...selectedTypes].forEach(id=>{if(!available.has(id))selectedTypes.delete(id)});if(activePatternKey&&!patterns.some(pattern=>pattern.key===activePatternKey))activePatternKey='';renderConfigurationSection(result.graph);renderOverlay();window.RelphiAspectConfigurations=Object.freeze({types:TYPES,patterns:patterns.slice(),harmonicWindow:result.graph.windowValue,refresh:schedule});window.dispatchEvent(new CustomEvent('relphi:sky-configurations-detected',{detail:{patterns:patterns.slice(),harmonicWindow:result.graph.windowValue}}))}finally{applying=false}}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(refresh)}
function handleChange(event){const input=event.target.closest?.('[data-configuration-choice]');if(!input)return;event.stopPropagation();setSelection(input.dataset.configurationChoice,input.checked)}
function handleClick(event){const button=event.target.closest?.('[data-configuration-pattern]');if(!button)return;event.preventDefault();const key=button.dataset.configurationPattern;activePatternKey=activePatternKey===key?'':key;renderOverlay();const result=detect();renderConfigurationSection(result.graph)}
function start(){
  document.addEventListener('change',handleChange,true);document.addEventListener('click',handleClick,true);
  ['relphi:sky-aspect-filter-rendered','relphi:sky-foundation-ready','relphi:sky-intrasky-relationships-ready','relphi:sky-intrasky-b-relationships-ready','relphi:sky-harmonic-window-visibility-changed','relphi:sky-orb-limit-changed','relphi:sky-b-removed','relphi:sky-b-restored','relphi:saved-sky-loaded'].forEach(name=>window.addEventListener(name,schedule));
  new MutationObserver(records=>{if(records.some(record=>record.addedNodes?.length&&[...record.addedNodes].some(node=>node instanceof Element&&(node.matches?.('.sky-foundation-relationship-row')||node.querySelector?.('.sky-foundation-relationship-row')))))schedule()}).observe(document.getElementById('skyFoundationRoot')||document.body,{childList:true,subtree:true});
  schedule();
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();