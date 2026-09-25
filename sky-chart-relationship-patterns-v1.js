// Named multi-aspect pattern recognition for Sky Chart Relationships.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiRelationshipPatternsV1)return;
window.__relphiRelationshipPatternsV1=true;

const MODE_LABELS=Object.freeze({'A-A':'Sky A','B-B':'Sky B'});
const PLACEMENT_NAMES=Object.freeze({
  sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',
  uranus:'Uranus',neptune:'Neptune',pluto:'Pluto',chiron:'Chiron',lilith:'Lilith',
  'north-node':'North Node','south-node':'South Node','part-of-fortune':'Part of Fortune',
  vertex:'Vertex','anti-vertex':'Anti-Vertex',asc:'Ascendant',dsc:'Descendant',mc:'MC',ic:'IC'
});
const SUPPRESSIONS=Object.freeze([
  ['t-square','grand-cross'],
  ['grand-trine','kite'],
  ['yod','boomerang-yod'],
  ['minor-grand-trine','cradle']
]);
let queued=false,observer=null,observedList=null,activePatternKey='',currentPatterns=[];

function harmonicWindow(){
  const model=window.RelphiHarmonicOrb;
  const value=Number(model?.getWindow?.()??document.documentElement.dataset.skyHarmonicWindow??model?.defaultWindow??6);
  return Number.isFinite(value)?value:6;
}
function rowMode(row){
  const explicit=String(row?.dataset?.relationshipMode||'').toUpperCase();
  if(explicit==='A-A'||explicit==='B-B')return explicit;
  const left=String(row?.dataset?.leftSky||'').toUpperCase(),right=String(row?.dataset?.rightSky||'').toUpperCase();
  return left===right&&(left==='A'||left==='B')?left+'-'+right:'';
}
function endpoint(row,side){
  const sky=String(row?.dataset?.[side+'Sky']||'').toUpperCase();
  const placement=String(row?.dataset?.[side+'Placement']||'').trim();
  return sky&&placement?{key:sky+':'+placement,sky,placement}:null;
}
function activeByHarmonic(row,windowValue=harmonicWindow()){
  const phase=Number(row?.dataset?.phaseError);
  return Number.isFinite(phase)?phase<=windowValue+1e-9:true;
}
function edgeKey(a,b){return a<b?a+'|'+b:b+'|'+a}
function bestRow(a,b){
  const ap=Number(a?.dataset?.phaseError),bp=Number(b?.dataset?.phaseError);
  if(Number.isFinite(ap)&&Number.isFinite(bp)&&ap!==bp)return ap-bp;
  const ao=Number(a?.dataset?.sourceOrb),bo=Number(b?.dataset?.sourceOrb);
  if(Number.isFinite(ao)&&Number.isFinite(bo)&&ao!==bo)return ao-bo;
  return 0;
}
function buildGraph(rows,mode){
  const edges=new Map(),nodes=new Map(),windowValue=harmonicWindow();
  for(const row of rows){
    if(rowMode(row)!==mode||!activeByHarmonic(row,windowValue))continue;
    const left=endpoint(row,'left'),right=endpoint(row,'right'),aspect=String(row?.dataset?.aspect||'').trim();
    if(!left||!right||!aspect||left.key===right.key)continue;
    nodes.set(left.key,left);nodes.set(right.key,right);
    const key=edgeKey(left.key,right.key);
    if(!edges.has(key))edges.set(key,new Map());
    const aspectRows=edges.get(key),previous=aspectRows.get(aspect);
    if(!previous||bestRow(row,previous)<0)aspectRows.set(aspect,row);
  }
  return{mode,nodes,edges};
}
function rowFor(graph,a,b,aspect){return graph.edges.get(edgeKey(a,b))?.get(aspect)||null}
function uniqueRows(values){return [...new Set(values.filter(Boolean))]}
function combos(values,size){
  const out=[];
  function walk(start,picked){
    if(picked.length===size){out.push(picked.slice());return}
    for(let i=start;i<=values.length-(size-picked.length);i+=1){picked.push(values[i]);walk(i+1,picked);picked.pop()}
  }
  walk(0,[]);return out;
}
function pattern(graph,id,name,members,rows,extra={}){
  const sorted=[...members].sort(),key=graph.mode+':'+id+':'+sorted.join(',');
  return{id,name,key,scope:graph.mode,members:sorted,rows:uniqueRows(rows),...extra};
}
function labelPlacement(key){
  const placement=String(key||'').split(':').slice(1).join(':');
  return PLACEMENT_NAMES[placement]||placement.replace(/-/g,' ').replace(/\b\w/g,ch=>ch.toUpperCase());
}
function detectTriples(graph,out){
  const nodes=[...graph.nodes.keys()];
  for(const [a,b,c] of combos(nodes,3)){
    const trio=[a,b,c],pairs=[[a,b],[a,c],[b,c]];
    const all=aspect=>pairs.map(pair=>rowFor(graph,pair[0],pair[1],aspect));
    const trines=all('trine');if(trines.every(Boolean))out.push(pattern(graph,'grand-trine','Grand Trine',trio,trines));

    for(const apex of trio){
      const base=trio.filter(node=>node!==apex);
      let rows=[rowFor(graph,apex,base[0],'quincunx'),rowFor(graph,apex,base[1],'quincunx'),rowFor(graph,base[0],base[1],'sextile')];
      if(rows.every(Boolean))out.push(pattern(graph,'yod','Yod / Finger of God',trio,rows,{apex}));

      rows=[rowFor(graph,apex,base[0],'square'),rowFor(graph,apex,base[1],'square'),rowFor(graph,base[0],base[1],'opposition')];
      if(rows.every(Boolean))out.push(pattern(graph,'t-square','T-Square',trio,rows,{apex}));

      rows=[rowFor(graph,apex,base[0],'sextile'),rowFor(graph,apex,base[1],'sextile'),rowFor(graph,base[0],base[1],'trine')];
      if(rows.every(Boolean))out.push(pattern(graph,'minor-grand-trine','Minor Grand Trine',trio,rows,{apex}));

      rows=[rowFor(graph,apex,base[0],'tri-octile'),rowFor(graph,apex,base[1],'tri-octile'),rowFor(graph,base[0],base[1],'square')];
      if(rows.every(Boolean))out.push(pattern(graph,'thors-hammer',"Thor's Hammer / Fist of God",trio,rows,{apex}));
    }
  }
}
function detectMysticRectangle(graph,quad,out){
  const pairs=[];
  for(let i=0;i<quad.length;i+=1)for(let j=i+1;j<quad.length;j+=1)pairs.push([quad[i],quad[j]]);
  const byAspect=aspect=>pairs.map(pair=>({pair,row:rowFor(graph,pair[0],pair[1],aspect)})).filter(item=>item.row);
  const oppositions=byAspect('opposition'),trines=byAspect('trine'),sextiles=byAspect('sextile');
  if(oppositions.length!==2||trines.length!==2||sextiles.length!==2)return;
  const degrees=new Map(quad.map(node=>[node,{opposition:0,trine:0,sextile:0}]));
  for(const item of oppositions)for(const node of item.pair)degrees.get(node).opposition+=1;
  for(const item of trines)for(const node of item.pair)degrees.get(node).trine+=1;
  for(const item of sextiles)for(const node of item.pair)degrees.get(node).sextile+=1;
  if([...degrees.values()].every(value=>value.opposition===1&&value.trine===1&&value.sextile===1)){
    out.push(pattern(graph,'mystic-rectangle','Mystic Rectangle',quad,[...oppositions,...trines,...sextiles].map(item=>item.row)));
  }
}
function detectGrandCross(graph,quad,out){
  const pairs=[];
  for(let i=0;i<quad.length;i+=1)for(let j=i+1;j<quad.length;j+=1)pairs.push([quad[i],quad[j]]);
  const oppositions=pairs.map(pair=>({pair,row:rowFor(graph,pair[0],pair[1],'opposition')})).filter(item=>item.row);
  const squares=pairs.map(pair=>({pair,row:rowFor(graph,pair[0],pair[1],'square')})).filter(item=>item.row);
  if(oppositions.length!==2||squares.length!==4)return;
  const degrees=new Map(quad.map(node=>[node,{opposition:0,square:0}]));
  for(const item of oppositions)for(const node of item.pair)degrees.get(node).opposition+=1;
  for(const item of squares)for(const node of item.pair)degrees.get(node).square+=1;
  if([...degrees.values()].every(value=>value.opposition===1&&value.square===2)){
    out.push(pattern(graph,'grand-cross','Grand Cross',quad,[...oppositions,...squares].map(item=>item.row)));
  }
}
function detectKite(graph,quad,out){
  for(let i=0;i<quad.length;i+=1){
    for(let j=i+1;j<quad.length;j+=1){
      const tail=quad[i],head=quad[j],wings=quad.filter(node=>node!==tail&&node!==head);
      const rows=[
        rowFor(graph,tail,head,'opposition'),
        rowFor(graph,tail,wings[0],'sextile'),rowFor(graph,tail,wings[1],'sextile'),
        rowFor(graph,head,wings[0],'trine'),rowFor(graph,head,wings[1],'trine'),
        rowFor(graph,wings[0],wings[1],'trine')
      ];
      if(rows.every(Boolean)){out.push(pattern(graph,'kite','Kite',quad,rows,{apex:tail,opposite:head}));return}
      const reverse=[
        rowFor(graph,tail,head,'opposition'),
        rowFor(graph,head,wings[0],'sextile'),rowFor(graph,head,wings[1],'sextile'),
        rowFor(graph,tail,wings[0],'trine'),rowFor(graph,tail,wings[1],'trine'),
        rowFor(graph,wings[0],wings[1],'trine')
      ];
      if(reverse.every(Boolean)){out.push(pattern(graph,'kite','Kite',quad,reverse,{apex:head,opposite:tail}));return}
    }
  }
}
function detectCradle(graph,quad,out){
  for(let i=0;i<quad.length;i+=1){
    for(let j=i+1;j<quad.length;j+=1){
      const left=quad[i],right=quad[j],middle=quad.filter(node=>node!==left&&node!==right);
      if(!rowFor(graph,left,right,'opposition'))continue;
      const variants=[
        [
          rowFor(graph,left,right,'opposition'),
          rowFor(graph,left,middle[0],'sextile'),rowFor(graph,left,middle[1],'trine'),
          rowFor(graph,right,middle[0],'trine'),rowFor(graph,right,middle[1],'sextile'),
          rowFor(graph,middle[0],middle[1],'sextile')
        ],
        [
          rowFor(graph,left,right,'opposition'),
          rowFor(graph,left,middle[0],'trine'),rowFor(graph,left,middle[1],'sextile'),
          rowFor(graph,right,middle[0],'sextile'),rowFor(graph,right,middle[1],'trine'),
          rowFor(graph,middle[0],middle[1],'sextile')
        ]
      ];
      const rows=variants.find(items=>items.every(Boolean));
      if(rows){out.push(pattern(graph,'cradle','Cradle',quad,rows));return}
    }
  }
}
function detectBoomerang(graph,quad,out){
  for(const apex of quad){
    for(const focus of quad){
      if(focus===apex)continue;
      const base=quad.filter(node=>node!==apex&&node!==focus);
      const rows=[
        rowFor(graph,apex,base[0],'quincunx'),rowFor(graph,apex,base[1],'quincunx'),
        rowFor(graph,base[0],base[1],'sextile'),rowFor(graph,apex,focus,'opposition'),
        rowFor(graph,focus,base[0],'semi-sextile'),rowFor(graph,focus,base[1],'semi-sextile')
      ];
      if(rows.every(Boolean)){out.push(pattern(graph,'boomerang-yod','Boomerang Yod',quad,rows,{apex,focus}));return}
    }
  }
}
function detectQuads(graph,out){
  const nodes=[...graph.nodes.keys()];
  for(const quad of combos(nodes,4)){
    detectMysticRectangle(graph,quad,out);
    detectGrandCross(graph,quad,out);
    detectKite(graph,quad,out);
    detectCradle(graph,quad,out);
    detectBoomerang(graph,quad,out);
  }
}
function dedupe(patterns){
  const map=new Map();
  for(const item of patterns){
    const existing=map.get(item.key);
    if(!existing||item.rows.length>existing.rows.length)map.set(item.key,item);
  }
  return [...map.values()];
}
function subset(a,b){return a.every(value=>b.includes(value))}
function suppressNested(patterns){
  return patterns.filter(item=>!SUPPRESSIONS.some(([small,large])=>
    item.id===small&&patterns.some(other=>other.id===large&&other.scope===item.scope&&subset(item.members,other.members))
  ));
}
function detectRows(rows){
  const input=Array.from(rows||[]),patterns=[];
  for(const mode of ['A-A','B-B']){
    const graph=buildGraph(input,mode);
    if(graph.nodes.size<3)continue;
    detectTriples(graph,patterns);
    if(graph.nodes.size>=4)detectQuads(graph,patterns);
  }
  return suppressNested(dedupe(patterns)).sort((a,b)=>
    a.scope.localeCompare(b.scope)||a.name.localeCompare(b.name)||a.members.join('|').localeCompare(b.members.join('|'))
  );
}
function clearHighlights(){
  document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row.sky-pattern-member').forEach(row=>row.classList.remove('sky-pattern-member'));
}
function activatePattern(key){
  clearHighlights();
  const next=currentPatterns.find(item=>item.key===key);
  activePatternKey=activePatternKey===key?'':key;
  const buttons=document.querySelectorAll('#skyRelationshipPatterns [data-pattern-key]');
  buttons.forEach(button=>button.setAttribute('aria-pressed',button.dataset.patternKey===activePatternKey?'true':'false'));
  if(!next||!activePatternKey)return;
  next.rows.forEach(row=>row.classList.add('sky-pattern-member'));
  const first=next.rows.find(row=>row.isConnected&&!row.hidden&&getComputedStyle(row).display!=='none');
  first?.scrollIntoView?.({block:'nearest',behavior:'smooth'});
}
function patternMeta(item){
  const parts=[MODE_LABELS[item.scope]||item.scope,item.members.map(labelPlacement).join(' · ')];
  if(item.apex)parts.push('Apex: '+labelPlacement(item.apex));
  if(item.focus)parts.push('Focus: '+labelPlacement(item.focus));
  return parts.filter(Boolean).join(' · ');
}
function ensureStyles(){
  if(document.getElementById('skyRelationshipPatternsV1Styles'))return;
  const style=document.createElement('style');style.id='skyRelationshipPatternsV1Styles';
  style.textContent=`
#skyRelationshipPatterns{display:grid;gap:7px;margin:8px 0 10px;padding:9px 10px;border:1px solid rgba(31,27,24,.13);border-radius:12px;background:#fbf8f4}
#skyRelationshipPatterns .sky-pattern-heading{display:flex;align-items:center;justify-content:space-between;gap:10px}
#skyRelationshipPatterns .sky-pattern-heading strong{font:900 .72rem/1 system-ui,sans-serif;color:#29231e}
#skyRelationshipPatterns .sky-pattern-heading span{font:800 .61rem/1 system-ui,sans-serif;color:#746b63}
#skyRelationshipPatterns .sky-pattern-list{display:flex;flex-wrap:wrap;gap:6px}
#skyRelationshipPatterns .sky-pattern-card{display:grid;gap:3px;min-width:0;max-width:100%;padding:7px 9px;border:1px solid rgba(31,27,24,.16);border-radius:9px;background:#fff;color:#29231e;text-align:left;cursor:pointer}
#skyRelationshipPatterns .sky-pattern-card:hover,#skyRelationshipPatterns .sky-pattern-card:focus-visible{border-color:#6b625a;outline:none}
#skyRelationshipPatterns .sky-pattern-card[aria-pressed="true"]{border-color:#29231e;box-shadow:0 0 0 1px #29231e}
#skyRelationshipPatterns .sky-pattern-card strong{font:900 .67rem/1.1 system-ui,sans-serif}
#skyRelationshipPatterns .sky-pattern-card span{font:700 .58rem/1.25 system-ui,sans-serif;color:#6d645d}
#skyRelationshipPatterns .sky-pattern-empty{margin:0;color:#746b63;font:700 .63rem/1.35 system-ui,sans-serif}
#skyFoundationRelationshipList>.sky-foundation-relationship-row.sky-pattern-member{outline:2px solid currentColor!important;outline-offset:-2px!important}
@media(max-width:620px){#skyRelationshipPatterns .sky-pattern-list{display:grid;grid-template-columns:1fr}#skyRelationshipPatterns .sky-pattern-card{width:100%}}
`;
  document.head.appendChild(style);
}
function render(){
  queued=false;
  const list=document.getElementById('skyFoundationRelationshipList'),panel=document.getElementById('skyFoundationRelationships');
  if(!list||!panel)return;
  ensureStyles();
  currentPatterns=detectRows(list.querySelectorAll(':scope>.sky-foundation-relationship-row'));
  if(activePatternKey&&!currentPatterns.some(item=>item.key===activePatternKey)){activePatternKey='';clearHighlights()}
  let host=document.getElementById('skyRelationshipPatterns');
  if(!host){host=document.createElement('section');host.id='skyRelationshipPatterns';host.setAttribute('aria-label','Named aspect patterns');panel.insertBefore(host,list)}
  const count=currentPatterns.length;
  host.innerHTML='<div class="sky-pattern-heading"><strong>Patterns</strong><span>'+count+' found · '+harmonicWindow().toFixed(2).replace(/\.00$/,'')+'° window</span></div>'+
    (count?'<div class="sky-pattern-list">'+currentPatterns.map(item=>
      '<button type="button" class="sky-pattern-card" data-pattern-key="'+item.key.replace(/"/g,'&quot;')+'" aria-pressed="'+(item.key===activePatternKey?'true':'false')+'"><strong>'+item.name+'</strong><span>'+patternMeta(item)+'</span></button>'
    ).join('')+'</div>':'<p class="sky-pattern-empty">No named multi-aspect patterns at the current harmonic window.</p>');
  host.querySelectorAll('[data-pattern-key]').forEach(button=>button.addEventListener('click',()=>activatePattern(button.dataset.patternKey)));
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(render))}
function observe(){
  const list=document.getElementById('skyFoundationRelationshipList');if(!list||list===observedList)return;
  observer?.disconnect();observedList=list;observer=new MutationObserver(records=>{
    if(records.some(record=>record.type==='childList'||record.type==='attributes'))schedule();
  });
  observer.observe(list,{childList:true,subtree:false,attributes:true,attributeFilter:['data-phase-error','data-aspect','data-left-placement','data-right-placement','data-left-sky','data-right-sky','data-relationship-mode']});
}
function start(){
  ensureStyles();observe();schedule();
  [
    'relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-intrasky-relationships-ready',
    'relphi:sky-harmonic-window-model-changed','relphi:sky-harmonic-window-visibility-changed','relphi:sky-orb-limit-changed'
  ].forEach(name=>window.addEventListener(name,()=>{observe();schedule()}));
}
window.RelphiRelationshipPatterns=Object.freeze({detectRows,schedule,get patterns(){return currentPatterns.slice()}});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();