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
  {id:'grand-cross',label:'Grand Cross / Grand Square',vertices:4},
  {id:'minor-grand-trine',label:'Minor Grand Trine',vertices:3},
  {id:'grand-sextile',label:'Grand Sextile',vertices:6},
  {id:'cradle',label:'Cradle',vertices:4},
  {id:'thors-hammer',label:"Thor's Hammer / Fist of God",vertices:3}
]);
const TYPE_MAP=new Map(TYPES.map(type=>[type.id,type]));
const TYPE_IDS=Object.freeze(TYPES.map(type=>type.id));
const SCOPES=Object.freeze([
  {id:'A-A',label:'A↔A'},
  {id:'B-B',label:'B↔B'},
  {id:'A-B',label:'A↔B'}
]);
const PLACEMENT_SYMBOLS=Object.freeze({sun:'☉',moon:'☽',mercury:'☿',venus:'♀',mars:'♂',jupiter:'♃',saturn:'♄',uranus:'♅',neptune:'♆',pluto:'♇',chiron:'⚷','north-node':'☊','south-node':'☋',lilith:'⚸','part-of-fortune':'⊗',vertex:'Vx','anti-vertex':'AVx',asc:'Asc',dsc:'Dsc',mc:'MC',ic:'IC'});
const RESULT_PANEL_ID='skyFoundationConfigurations';
const RESULT_KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const RESULT_COLORS={A:'#c9211e',B:'#2462d0'};
const RESULT_ASPECT_COLORS=Object.freeze({conjunction:'#e53935','semi-sextile':'#7c9b49',octile:'#b86d43',sextile:'#d3b727',quintile:'#8b6cc2',square:'#d6534d',trine:'#4e9e69','tri-octile':'#9f5944','bi-quintile':'#7655aa',quincunx:'#4b8e88',opposition:'#5961c8'});
const RESULT_ALIASES=Object.freeze({rising:'asc',ascendant:'asc',ac:'asc',descendant:'dsc',dc:'dsc',midheaven:'mc','imum coeli':'ic',imumcoeli:'ic',vx:'vertex','anti vertex':'anti-vertex','anti-vertex':'anti-vertex',antivertex:'anti-vertex',avx:'anti-vertex','north node':'north-node',node:'north-node','true node':'north-node','south node':'south-node',fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune'});
const CONFIG_STRUCTURE=Object.freeze({
  'grand-trine':'three trines forming a closed triangle',
  kite:'a grand trine extended by an opposition and two sextiles',
  yod:'two quincunxes converging on an apex from a sextile base',
  'mystic-rectangle':'two oppositions linked by two trines and two sextiles',
  't-square':'an opposition whose ends both square a third placement',
  'grand-cross':'two oppositions joined by four squares',
  'minor-grand-trine':'one trine feeding a third placement through two sextiles',
  'grand-sextile':'six placements linked by six sextiles, six trines, and three oppositions',
  cradle:'an opposition supported by two trines and three sextiles',
  'thors-hammer':'one square whose ends converge on an apex through two tri-octiles'
});
const CONFIG_INTERPRETATION=Object.freeze({
  'grand-trine':'A self-reinforcing circuit of easy exchange. Energy moves readily among all three points, making the pattern coherent and available without much friction.',
  kite:'A flowing grand-trine circuit given direction by an opposition. The opposing point creates a channel through which the otherwise self-contained ease can become purposeful.',
  yod:'Two different adjustment demands converge on one apex. The structure repeatedly redirects attention toward the apex, where incompatible conditions must be translated into one response.',
  'mystic-rectangle':'Two polarities are held inside a network of trines and sextiles. The tensions remain visible, but the surrounding connections give the system several routes for exchange and integration.',
  't-square':'A polarity discharges through a third point. The apex carries concentrated pressure and becomes the place where the opposition demands action, adaptation, or development.',
  'grand-cross':'Two oppositions lock into four squares. Pressure is distributed across four points, creating a highly activated structure that continually forces movement among competing demands.',
  'minor-grand-trine':'A trine feeds a third point through two sextiles. Existing ease becomes usable through participation, giving the pattern a practical outlet rather than a closed circuit.',
  'grand-sextile':'Six points form an unusually dense network of cooperative links and polarities. The configuration offers many routes for exchange while still preserving three opposing axes.',
  cradle:'An opposition is held inside a supportive web of trines and sextiles. The polarity remains central, but several low-resistance pathways help carry and distribute it.',
  'thors-hammer':'A square concentrates its friction through two tri-octiles onto an apex. The apex becomes the pressure point where accumulated tension is forced into a sharper redirection.'
});
let openConfigurationTile=null;

function resultNorm(value){return((Number(value)%360)+360)%360}
function resultSource(payload){const source=[payload?.placements,payload?.positions,payload?.points,payload?.bodies].find(value=>value&&typeof value==='object')||payload||{};return Array.isArray(source)?source.map((item,index)=>[String(item?.name||item?.id||index),item]):Object.entries(source)}
function resultRead(slot){try{return JSON.parse(localStorage.getItem(RESULT_KEYS[slot])||'null')}catch(_){return null}}
function resultLongitude(item){if(Number.isFinite(Number(item?.longitude)))return resultNorm(item.longitude);const signs=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'],sign=signs.indexOf(String(item?.sign||item?.zodiac||'').trim().toLowerCase());return sign<0?NaN:resultNorm(sign*30+Number(item?.degree||item?.degrees||0)+Number(item?.minute||item?.minutes||0)/60+Number(item?.second||item?.seconds||0)/3600)}
function resultCanonical(key,item){const registry=window.RelphiGlyphRegistry;for(const candidate of[item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]){if(!candidate)continue;const raw=String(candidate).trim(),alias=RESULT_ALIASES[raw.toLowerCase()]||raw,entry=registry?.resolve?.(alias)||registry?.get?.(alias);if(entry)return entry.id}return''}
function resultVertexRecord(key){
  const [sky,id]=String(key||'').split(':');if(!RESULT_KEYS[sky]||!id)return null;
  for(const [sourceKey,item] of resultSource(resultRead(sky))){if(!item||typeof item!=='object'||Array.isArray(item))continue;const canonical=resultCanonical(sourceKey,item);if(canonical!==id)continue;const value=resultLongitude(item);if(Number.isFinite(value))return{sky,id,value,label:placementLabel(id)}}
  return null;
}
function resultPoint(value,radius=47){const angle=(resultNorm(value)-180)*Math.PI/180;return{x:60+radius*Math.cos(angle),y:60+radius*Math.sin(angle)}}
function placementLabel(id){return PLACEMENT_SYMBOLS[id]||window.RelphiGlyphRegistry?.get?.(id)?.fallback||String(id||'').replace(/-/g,' ')}
function vertexLabel(key){const [sky,id]=String(key||'').split(':');return{sky,id,label:placementLabel(id)}}
function patternScopeLabel(pattern){const scope=patternScope(pattern);return SCOPES.find(item=>item.id===scope)?.label||scope}
function structureText(pattern){const recipe=CONFIG_STRUCTURE[pattern.type]||'a compound aspect pattern';const names=pattern.vertices.map(key=>{const item=vertexLabel(key);return 'Sky '+item.sky+' '+item.label}).join(' · ');return recipe+(names?' — '+names:'')}
function interpretationText(pattern){return CONFIG_INTERPRETATION[pattern.type]||'A compound relationship pattern formed by several aspect edges operating together.'}
function miniConfigurationMarkup(pattern,{compact=false,interactive=true}={}){
  const records=new Map(pattern.vertices.map(key=>[key,resultVertexRecord(key)]).filter(([,record])=>record));
  const lines=pattern.edges.map(edge=>{
    const left=records.get(edge.left),right=records.get(edge.right);if(!left||!right)return'';
    const a=resultPoint(left.value),b=resultPoint(right.value),stroke=RESULT_ASPECT_COLORS[edge.aspect]||'#777';
    return'<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" class="sky-configuration-mini-aspect" data-aspect="'+edge.aspect+'" style="stroke:'+stroke+'"/>';
  }).join('');
  const radii=[...records.values()].map(record=>{const p=resultPoint(record.value),color=RESULT_COLORS[record.sky]||'#777';return'<line x1="60" y1="60" x2="'+p.x+'" y2="'+p.y+'" class="sky-configuration-mini-radius" style="stroke:'+color+'"/>'}).join('');
  const points=[...records.values()].map(record=>{const p=resultPoint(record.value),color=RESULT_COLORS[record.sky]||'#777';return'<g class="sky-configuration-mini-point" data-sky="'+record.sky+'"><circle cx="'+p.x+'" cy="'+p.y+'" r="'+(compact?4.7:5.4)+'" style="fill:'+color+';stroke:'+color+'"/><text x="'+p.x+'" y="'+(p.y+.4)+'" text-anchor="middle" dominant-baseline="middle">'+record.sky+'</text></g>'}).join('');
  const classes='sky-configuration-mini-wheel'+(compact?' is-compact':'');
  const attrs=interactive?' role="button" tabindex="0" aria-label="Reveal configuration name, structure, and interpretation"':' aria-hidden="true"';
  return'<div class="'+classes+'"'+attrs+'><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="47" class="sky-configuration-mini-ring"/>'+radii+lines+points+'</svg></div>';
}
function aspectColorRail(pattern){
  const seen=[];
  pattern.edges.forEach(edge=>{const color=RESULT_ASPECT_COLORS[edge.aspect]||'#777';if(!seen.some(item=>item.aspect===edge.aspect))seen.push({aspect:edge.aspect,color})});
  return'<span class="sky-configuration-result-color-rail" aria-hidden="true">'+seen.map(item=>'<i data-aspect="'+item.aspect+'" style="background:'+item.color+'"></i>').join('')+'</span>';
}
function ensureResultsPanel(){
  const relationships=document.getElementById('skyFoundationRelationships'),comparison=document.getElementById('skyFoundationComparison');if(!relationships||!comparison)return null;
  let panel=document.getElementById(RESULT_PANEL_ID);
  if(!panel){panel=document.createElement('section');panel.id=RESULT_PANEL_ID;panel.className='sky-configuration-results-panel';panel.setAttribute('aria-label','Configuration matches');panel.innerHTML='<header class="sky-configuration-results-heading"><h2>Configurations</h2><span class="sky-configuration-results-count" aria-live="polite"></span></header><div class="sky-configuration-results-grid"></div>'}
  if(panel.parentElement!==comparison||panel.nextElementSibling!==relationships)comparison.insertBefore(panel,relationships);
  return panel;
}
function clearPatternHighlight(){
  document.querySelectorAll('.sky-foundation-relationship-row.is-configuration-result-peer').forEach(row=>row.classList.remove('is-configuration-result-peer'));
  document.querySelectorAll('.sky-chart-configuration-line.is-configuration-result-line').forEach(line=>line.classList.remove('is-configuration-result-line'));
  document.querySelector('[data-layer="configurations"]')?.classList.remove('is-result-focus');
  const wheel=document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel');
  wheel?.classList.remove('has-configuration-result-focus');
  wheel?.querySelectorAll('.is-configuration-result-kept').forEach(node=>node.classList.remove('is-configuration-result-kept'));
}
function highlightPattern(pattern){
  clearPatternHighlight();if(!pattern)return;
  const keys=new Set(pattern.edges.map(edge=>edgeNodeKey(edge)));
  const placements=new Set(),houses=new Set(),signs=new Set(),relationIndexes=new Set();
  pattern.edges.forEach(edge=>{
    const row=edge?.row;if(!row)return;
    const index=String(row.dataset.relationIndex||'');if(index)relationIndexes.add(index);
    [['left','leftSky','leftPlacement','leftHouse','leftSign'],['right','rightSky','rightPlacement','rightHouse','rightSign']].forEach(([,skyKey,placementKey,houseKey,signKey])=>{
      const sky=String(row.dataset[skyKey]||'').toUpperCase(),placement=String(row.dataset[placementKey]||''),house=String(row.dataset[houseKey]||''),sign=String(row.dataset[signKey]||'');
      if((sky==='A'||sky==='B')&&placement)placements.add(sky+':'+placement);
      if((sky==='A'||sky==='B')&&house)houses.add(sky+':'+house);
      if(sign!=='')signs.add(sign);
    });
  });
  document.querySelectorAll('.sky-foundation-relationship-row').forEach(row=>{if(keys.has(relationNodeKey(row)))row.classList.add('is-configuration-result-peer')});
  const layer=document.querySelector('[data-layer="configurations"]');layer?.classList.add('is-result-focus');
  layer?.querySelectorAll('.sky-chart-configuration-line').forEach(line=>line.classList.toggle('is-configuration-result-line',keys.has(String(line.dataset.configurationKey||''))));
  const wheel=document.querySelector('#skyFoundationWheelMount>.sky-foundation-wheel');if(!wheel)return;
  wheel.classList.add('has-configuration-result-focus');
  wheel.querySelectorAll('[data-layer="aspects"] .sky-foundation-aspect[data-relation-index]').forEach(node=>node.classList.toggle('is-configuration-result-kept',relationIndexes.has(String(node.dataset.relationIndex||''))));
  wheel.querySelectorAll('[data-layer="placements"] [data-sky][data-placement],[data-layer="leaders"] [data-sky][data-placement]').forEach(node=>node.classList.toggle('is-configuration-result-kept',placements.has(String(node.dataset.sky)+':'+String(node.dataset.placement))));
  wheel.querySelectorAll('.sky-foundation-house-sector[data-sky][data-house]').forEach(node=>node.classList.toggle('is-configuration-result-kept',houses.has(String(node.dataset.sky)+':'+String(node.dataset.house))));
  wheel.querySelectorAll('.sky-foundation-sign-sector[data-sign],.sky-foundation-sign-glyph[data-zodiac-sign]').forEach(node=>{
    let sign=String(node.dataset.sign||'');
    if(sign===''){const ids=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];sign=String(ids.indexOf(String(node.dataset.zodiacSign||'').toLowerCase()))}
    node.classList.toggle('is-configuration-result-kept',signs.has(sign));
  });
}
function closeConfigurationTile(tile){
  if(!tile)return;tile.classList.remove('is-expanded');tile.setAttribute('aria-expanded','false');const detail=tile.querySelector(':scope>.sky-configuration-result-detail');if(detail)detail.hidden=true;tile.dataset.revealLevel='';clearPatternHighlight();if(openConfigurationTile===tile)openConfigurationTile=null
}
function revealConfiguration(tile,pattern){
  const reveal=tile.querySelector('.sky-configuration-result-reveal');if(!reveal)return;
  const current=tile.dataset.revealLevel||'',next=current===''?'name':current==='name'?'structure':current==='structure'?'interpretation':'';
  tile.dataset.revealLevel=next;
  if(!next){reveal.hidden=true;reveal.textContent='';delete reveal.dataset.level;return}
  reveal.dataset.level=next;reveal.hidden=false;
  if(next==='name')reveal.textContent=TYPE_MAP.get(pattern.type)?.label||pattern.type;
  if(next==='structure')reveal.textContent=structureText(pattern);
  if(next==='interpretation')reveal.textContent=interpretationText(pattern);
}
function openConfiguration(tile,pattern){
  if(tile.classList.contains('is-expanded')){closeConfigurationTile(tile);return}
  if(openConfigurationTile&&openConfigurationTile!==tile)closeConfigurationTile(openConfigurationTile);
  openConfigurationTile=tile;tile.classList.add('is-expanded');tile.setAttribute('aria-expanded','true');highlightPattern(pattern);
  let detail=tile.querySelector(':scope>.sky-configuration-result-detail');
  if(!detail){detail=document.createElement('div');detail.className='sky-configuration-result-detail';detail.innerHTML='<div class="sky-configuration-result-reveal" role="status" aria-live="polite" hidden></div><div class="sky-configuration-result-visual">'+miniConfigurationMarkup(pattern)+'</div><div class="sky-configuration-result-instance">'+pattern.vertices.map(key=>{const item=vertexLabel(key);return'<span data-sky="'+item.sky+'"><b>'+item.sky+'</b>'+item.label+'</span>'}).join('')+'</div>';tile.appendChild(detail);const wheel=detail.querySelector('.sky-configuration-mini-wheel');const activate=event=>{event.preventDefault();event.stopPropagation();revealConfiguration(tile,pattern)};wheel?.addEventListener('click',activate);wheel?.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){activate(event)}})}
  detail.hidden=false;
}
function resultTile(pattern,index){
  const type=TYPE_MAP.get(pattern.type),tile=document.createElement('article');tile.className='sky-configuration-result-tile';tile.dataset.configurationResult=pattern.key;tile.dataset.configurationScope=patternScope(pattern);tile.setAttribute('aria-expanded','false');
  const button=document.createElement('button');button.type='button';button.className='sky-configuration-result-summary';
  const thumb=document.createElement('span');thumb.className='sky-configuration-result-thumb';thumb.innerHTML=miniConfigurationMarkup(pattern,{compact:true,interactive:false});
  const copy=document.createElement('span');copy.className='sky-configuration-result-summary-copy';
  const top=document.createElement('span');top.className='sky-configuration-result-summary-top';
  const name=document.createElement('strong');name.textContent=type?.label||pattern.type;
  const meta=document.createElement('span');meta.className='sky-configuration-result-meta';
  const scope=document.createElement('span');scope.className='sky-configuration-result-scope';scope.textContent=patternScopeLabel(pattern);
  const exact=document.createElement('span');exact.className='sky-configuration-result-exactness';exact.textContent=Number.isFinite(pattern.maxPhase)?pattern.maxPhase.toFixed(2)+'°':'';
  meta.append(scope,exact);top.append(name,meta);
  const rail=document.createElement('span');rail.innerHTML=aspectColorRail(pattern);copy.append(top,rail.firstElementChild);
  button.append(thumb,copy);button.setAttribute('aria-label',(type?.label||pattern.type)+', '+patternScopeLabel(pattern)+', configuration '+(index+1)+'. Expand configuration.');
  button.addEventListener('click',event=>{event.preventDefault();openConfiguration(tile,pattern)});
  tile.addEventListener('pointerenter',()=>highlightPattern(pattern));tile.addEventListener('focusin',()=>highlightPattern(pattern));tile.addEventListener('pointerleave',()=>{if(!tile.classList.contains('is-expanded'))clearPatternHighlight()});tile.addEventListener('focusout',event=>{if(!tile.contains(event.relatedTarget)&&!tile.classList.contains('is-expanded'))clearPatternHighlight()});
  tile.appendChild(button);return tile;
}
function renderResultsPanel(){
  const panel=ensureResultsPanel();if(!panel)return;
  if(!patterns.length){panel.hidden=true;clearPatternHighlight();openConfigurationTile=null;return}
  panel.hidden=false;
  const count=panel.querySelector('.sky-configuration-results-count'),grid=panel.querySelector('.sky-configuration-results-grid');
  if(count)count.textContent=patterns.length+' match'+(patterns.length===1?'':'es');
  if(grid){grid.replaceChildren();patterns.forEach((pattern,index)=>grid.appendChild(resultTile(pattern,index)));openConfigurationTile=null}
}
const CONFIG_STORAGE_KEY='relphiSkyConfigurationMatrixV1';
const configurationState=Object.fromEntries(SCOPES.map(scope=>[scope.id,new Set()]));
(function loadPersistedConfigurationState(){try{const saved=JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY)||'null');if(!saved||typeof saved!=='object')return;SCOPES.forEach(scope=>{if(Array.isArray(saved[scope.id]))configurationState[scope.id]=new Set(saved[scope.id].filter(type=>TYPE_IDS.includes(type)))})}catch(_){}})();
let patterns=[];
let queued=false;
let applying=false;
let peerHoverRow=null,peerHoverFrozen=false,configurationObserver=null,observedConfigurationBody=null;

function popoverBody(){return document.querySelector('#skyChartAspectPopover .sky-chart-aspect-filter-body')}
function harmonicWindow(){const model=window.RelphiHarmonicOrb;const value=Number(model?.getWindow?.()??model?.defaultWindow??6);return Number.isFinite(value)?value:6}
function bActive(){const html=document.documentElement;return html.dataset.skyBEditing==='true'||html.dataset.skyBPresent==='true'}
function relationshipMode(row){const raw=String(row?.dataset?.relationshipMode||'').toUpperCase();if(raw==='A-A'||raw==='B-B'||raw==='A-B')return raw;if(raw==='B-A')return'A-B';const l=String(row?.dataset?.leftSky||'').toUpperCase(),r=String(row?.dataset?.rightSky||'').toUpperCase();if(l&&r)return l===r?`${l}-${r}`:'A-B';return'A-B'}
function activeScopes(){return bActive()?SCOPES.map(scope=>scope.id):['A-A']}
function activeMode(mode){return activeScopes().includes(mode)}
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
function decorateSimpleGroups(){/* Aspect category master rows are rendered by the scope matrix. */}
function patternScope(pattern){
  const skies=new Set((pattern?.vertices||[]).map(key=>String(key).split(':')[0]).filter(sky=>sky==='A'||sky==='B'));
  if(skies.size===1){const sky=[...skies][0];return sky+'-'+sky}
  return'A-B';
}
function configCells(scope,type){
  const scopes=scope==='all'?activeScopes():activeScopes().includes(scope)?[scope]:[];
  const types=type==='all'?TYPE_IDS:TYPE_IDS.includes(type)?[type]:[];
  const out=[];scopes.forEach(scopeId=>types.forEach(typeId=>out.push([scopeId,typeId])));return out;
}
function configCellState(scope,type){
  const target=configCells(scope,type),selected=target.filter(([scopeId,typeId])=>configurationState[scopeId].has(typeId)).length;
  return{available:target.length,selected,checked:target.length>0&&selected===target.length,indeterminate:selected>0&&selected<target.length};
}
function setConfigCells(scope,type,checked){configCells(scope,type).forEach(([scopeId,typeId])=>checked?configurationState[scopeId].add(typeId):configurationState[scopeId].delete(typeId))}
function configurationMatrix(){return Object.fromEntries(SCOPES.map(scope=>[scope.id,TYPE_IDS.filter(type=>configurationState[scope.id].has(type))]))}
function saveConfigurationState(){try{localStorage.setItem(CONFIG_STORAGE_KEY,JSON.stringify(configurationMatrix()))}catch(_){}}
function configChoice(scope,type,labelText){
  const label=document.createElement('label');label.className='sky-chart-aspect-matrix-choice sky-chart-configuration-matrix-choice';
  const input=document.createElement('input');input.type='checkbox';input.dataset.configurationScope=scope;input.dataset.configurationType=type;input.setAttribute('aria-label',labelText);
  const text=document.createElement('span');text.textContent=scope==='all'?'All':SCOPES.find(item=>item.id===scope)?.label||scope;
  label.append(input,text);return label;
}
function configRow(type,labelText,master=false){
  const row=document.createElement('div');row.className='sky-chart-configuration-choice'+(master?' sky-chart-configuration-choice-master':'');row.dataset.configurationRow=type;
  const name=document.createElement('strong');name.className='sky-chart-configuration-name';name.textContent=labelText;
  const choices=document.createElement('div');choices.className='sky-chart-configuration-choices';choices.setAttribute('role','group');choices.setAttribute('aria-label',labelText);
  const scopes=SCOPES.filter(scope=>activeScopes().includes(scope.id));
  choices.append(configChoice('all',type,labelText+': all relationship scopes'),...scopes.map(scope=>configChoice(scope.id,type,labelText+': '+scope.label)));
  row.append(name,choices);return row;
}
function syncConfigInputs(){
  document.querySelectorAll('[data-configuration-scope][data-configuration-type]').forEach(input=>{
    const current=configCellState(input.dataset.configurationScope,input.dataset.configurationType);
    input.checked=current.checked;input.indeterminate=current.indeterminate;input.disabled=current.available===0;
  });
}
function renderConfigurationSection(){
  const body=popoverBody();if(!body)return;
  body.querySelector('.sky-chart-configuration-section')?.remove();
  const section=document.createElement('section');section.className='sky-chart-configuration-section';section.setAttribute('aria-label','Configurations');
  const title=document.createElement('div');title.className='sky-chart-configuration-title';
  const heading=document.createElement('strong');heading.textContent='Configurations';
  const cols=document.createElement('div');cols.className='sky-chart-configuration-title-choices';
  const labels=bActive()?['All','A↔A','B↔B','A↔B']:['All','A↔A'];labels.forEach(text=>{const span=document.createElement('span');span.textContent=text;cols.appendChild(span)});
  title.append(heading,cols);section.appendChild(title);
  const list=document.createElement('div');list.className='sky-chart-configuration-list';
  list.appendChild(configRow('all','All configurations',true));TYPES.forEach(type=>list.appendChild(configRow(type.id,type.label,false)));
  section.appendChild(list);body.appendChild(section);syncConfigInputs();
}
function relationIndex(edge){return String(edge?.row?.dataset?.relationIndex||'')}
function relationNodeKey(node){
  const index=String(node?.dataset?.relationIndex||'');
  if(index)return `idx:${index}`;
  const aspect=String(node?.dataset?.aspect||''),left=nodeKey(node?.dataset?.leftSky,node?.dataset?.leftPlacement),right=nodeKey(node?.dataset?.rightSky,node?.dataset?.rightPlacement);
  return aspect&&left&&right?`${edgeKey(left,right)}:${aspect}`:'';
}
function edgeNodeKey(edge){return relationNodeKey(edge?.row)||`${edgeKey(edge?.left,edge?.right)}:${edge?.aspect||''}`}
function selectedPatternsForVisibility(){return patterns.filter(pattern=>configurationState[patternScope(pattern)]?.has(pattern.type))}
function selectedRelationshipKeys(){const keys=new Set();selectedPatternsForVisibility().forEach(pattern=>pattern.edges.forEach(edge=>{const edgeScope=relationshipMode(edge?.row);if(configurationState[edgeScope]?.has(pattern.type))keys.add(edgeNodeKey(edge))}));return keys}
function participates(node){const key=relationNodeKey(node);return!!key&&selectedRelationshipKeys().has(key)}
function patternsForNode(node){const key=relationNodeKey(node);return key?selectedPatternsForVisibility().filter(pattern=>pattern.edges.some(edge=>edgeNodeKey(edge)===key)):[]}
function markParticipants(){
  const keys=selectedRelationshipKeys();
  document.querySelectorAll('.sky-foundation-relationship-row,[data-layer="aspects"]>.sky-foundation-aspect').forEach(node=>node.classList.toggle('sky-chart-configuration-participant',keys.has(relationNodeKey(node))));
}
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
  const layer=ensureOverlay();if(!layer)return;layer.replaceChildren();clearPeerHighlight();markParticipants();
  const chosen=selectedPatternsForVisibility(),seen=new Set();
  for(const pattern of chosen)for(const edge of pattern.edges){const key=edgeNodeKey(edge);if(seen.has(key))continue;seen.add(key);const base=matchingBaseLine(edge);if(!base)continue;const line=document.createElementNS('http://www.w3.org/2000/svg','line');['x1','y1','x2','y2','stroke'].forEach(name=>{const value=base.getAttribute(name);if(value!=null)line.setAttribute(name,value)});line.setAttribute('vector-effect','non-scaling-stroke');line.classList.add('sky-chart-configuration-line');line.dataset.configurationRelation=relationIndex(edge)||'';line.dataset.configurationKey=key;layer.appendChild(line)}
  const selectedCount=activeScopes().reduce((sum,scope)=>sum+configurationState[scope].size,0);
  document.documentElement.dataset.skyConfigurationSelection=String(selectedCount);
}
function clearPeerHighlight(){
  document.querySelectorAll('.sky-foundation-relationship-row.is-configuration-peer,.sky-foundation-relationship-row.is-configuration-hover-source').forEach(row=>row.classList.remove('is-configuration-peer','is-configuration-hover-source'));
  document.querySelectorAll('.sky-chart-configuration-line.is-configuration-peer-line').forEach(line=>line.classList.remove('is-configuration-peer-line'));
  document.querySelector('[data-layer="configurations"]')?.classList.remove('is-peer-hover');
  peerHoverRow=null;peerHoverFrozen=false;
}
function highlightPeers(row){
  const related=patternsForNode(row);if(!related.length){clearPeerHighlight();return}
  const keys=new Set();related.forEach(pattern=>pattern.edges.forEach(edge=>keys.add(edgeNodeKey(edge))));
  clearPeerHighlight();
  document.querySelectorAll('.sky-foundation-relationship-row').forEach(candidate=>{if(keys.has(relationNodeKey(candidate)))candidate.classList.add('is-configuration-peer')});
  row.classList.add('is-configuration-hover-source');
  peerHoverRow=row;peerHoverFrozen=false;
  const layer=document.querySelector('[data-layer="configurations"]');layer?.classList.add('is-peer-hover');
  layer?.querySelectorAll('.sky-chart-configuration-line').forEach(line=>line.classList.toggle('is-configuration-peer-line',keys.has(String(line.dataset.configurationKey||''))));
}
function freezePeerHoverOnExternalExit(event,row){
  if(!row||row.contains(event.relatedTarget)||event.relatedTarget!==null)return false;
  peerHoverFrozen=!!peerHoverRow;
  return peerHoverFrozen;
}
function reconcileFrozenPeerHover(event){
  if(!peerHoverFrozen)return;
  peerHoverFrozen=false;
  const row=event.target?.closest?.('.sky-foundation-relationship-row')||null;
  if(row)highlightPeers(row);else clearPeerHighlight();
}
function setSelection(scope,type,checked){
  setConfigCells(scope,type,checked);saveConfigurationState();syncConfigInputs();renderOverlay();renderResultsPanel();
  const matrix=configurationMatrix();
  window.dispatchEvent(new CustomEvent('relphi:sky-configuration-selection-changed',{detail:{matrix,selectedPatterns:selectedPatternsForVisibility().map(pattern=>pattern.key)}}));
}
function refresh(){queued=false;if(applying)return;applying=true;try{
  decorateSimpleGroups();const result=detect();patterns=result.patterns;renderConfigurationSection();renderResultsPanel();
  window.RelphiAspectConfigurations=Object.freeze({
    types:TYPES,patterns:patterns.slice(),harmonicWindow:result.graph.windowValue,refresh:schedule,participates,
    selectedPatterns:()=>selectedPatternsForVisibility().slice(),matrix:()=>configurationMatrix(),scopeForPattern:patternScope
  });
  renderOverlay();window.dispatchEvent(new CustomEvent('relphi:sky-configurations-detected',{detail:{patterns:patterns.slice(),harmonicWindow:result.graph.windowValue}}))
}finally{applying=false}}
function ensureConfigurationObserver(){
  const body=popoverBody();if(!body||body===observedConfigurationBody)return;
  configurationObserver?.disconnect();observedConfigurationBody=body;
  configurationObserver=new MutationObserver(()=>{
    if(body.querySelector('[data-aspect-list="matrix"]')&&!body.querySelector('.sky-chart-configuration-section'))schedule();
  });
  configurationObserver.observe(body,{childList:true});
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(refresh)}
function handleChange(event){const input=event.target.closest?.('[data-configuration-scope][data-configuration-type]');if(!input)return;event.stopPropagation();setSelection(input.dataset.configurationScope,input.dataset.configurationType,input.checked)}
function start(){
  document.addEventListener('change',handleChange,true);
  document.addEventListener('pointerover',event=>{const row=event.target.closest?.('.sky-foundation-relationship-row');if(row&&row!==event.relatedTarget?.closest?.('.sky-foundation-relationship-row')){peerHoverFrozen=false;highlightPeers(row)}});
  document.addEventListener('pointermove',reconcileFrozenPeerHover,true);
  document.addEventListener('pointerdown',reconcileFrozenPeerHover,true);
  document.addEventListener('pointerout',event=>{const row=event.target.closest?.('.sky-foundation-relationship-row');if(!row||row.contains(event.relatedTarget))return;if(freezePeerHoverOnExternalExit(event,row))return;clearPeerHighlight()});
  document.addEventListener('focusin',event=>{const row=event.target.closest?.('.sky-foundation-relationship-row');if(row)highlightPeers(row)});
  document.addEventListener('focusout',event=>{const row=event.target.closest?.('.sky-foundation-relationship-row');if(!row||row.contains(event.relatedTarget))return;if(freezePeerHoverOnExternalExit(event,row))return;clearPeerHighlight()});
  window.addEventListener('blur',()=>{if(peerHoverRow)peerHoverFrozen=true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&peerHoverRow)peerHoverFrozen=true});
  ['relphi:sky-aspect-filter-rendered','relphi:sky-foundation-ready','relphi:sky-intrasky-relationships-ready','relphi:sky-intrasky-b-relationships-ready','relphi:sky-harmonic-window-visibility-changed','relphi:sky-orb-limit-changed','relphi:sky-b-removed','relphi:sky-b-restored','relphi:saved-sky-loaded'].forEach(name=>window.addEventListener(name,()=>{ensureConfigurationObserver();schedule()}));
  new MutationObserver(records=>{if(records.some(record=>record.addedNodes?.length&&[...record.addedNodes].some(node=>node instanceof Element&&(node.matches?.('.sky-foundation-relationship-row')||node.querySelector?.('.sky-foundation-relationship-row')))))schedule()}).observe(document.getElementById('skyFoundationRoot')||document.body,{childList:true,subtree:true});
  ensureConfigurationObserver();schedule();
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();