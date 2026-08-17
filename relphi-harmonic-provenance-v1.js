(function(root,factory){
'use strict';
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
root.RelphiHarmonicProvenance=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const pct=value=>Math.round((Number(value)||0)*100);
function nodeKey(point,side,mode){
  const id=String(point?.id||point?.name||'').trim();
  return mode==='cross'?`${side}:${id}`:id;
}
function nodeLabel(point,side,mode){
  const name=String(point?.name||point?.id||'Placement');
  return mode==='cross'?`Sky ${side} ${name}`:name;
}
function analyze(metric,mode='single'){
  const pairs=Array.isArray(metric?.pairs)?metric.pairs:[];
  const recognized=pairs.filter(pair=>pair?.primitive&&pair?.inWindow);
  const nodes=new Map(),adj=new Map(),degree=new Map(),edges=[];
  function ensure(key,label){
    if(!nodes.has(key))nodes.set(key,{key,label});
    if(!adj.has(key))adj.set(key,new Set());
    if(!degree.has(key))degree.set(key,0);
  }
  recognized.forEach(pair=>{
    const leftKey=nodeKey(pair.left,'A',mode),rightKey=nodeKey(pair.right,'B',mode);
    if(!leftKey||!rightKey||leftKey===rightKey)return;
    ensure(leftKey,nodeLabel(pair.left,'A',mode));ensure(rightKey,nodeLabel(pair.right,'B',mode));
    adj.get(leftKey).add(rightKey);adj.get(rightKey).add(leftKey);
    degree.set(leftKey,(degree.get(leftKey)||0)+1);degree.set(rightKey,(degree.get(rightKey)||0)+1);
    edges.push({leftKey,rightKey,pair});
  });
  const visited=new Set(),components=[];
  nodes.forEach((node,key)=>{
    if(visited.has(key))return;
    const queue=[key],keys=[];visited.add(key);
    while(queue.length){
      const current=queue.shift();keys.push(current);
      (adj.get(current)||[]).forEach(next=>{if(!visited.has(next)){visited.add(next);queue.push(next)}});
    }
    const keySet=new Set(keys),componentEdges=edges.filter(edge=>keySet.has(edge.leftKey)&&keySet.has(edge.rightKey));
    const cycleRank=Math.max(0,componentEdges.length-keys.length+1);
    components.push(Object.freeze({
      nodeCount:keys.length,
      edgeCount:componentEdges.length,
      cycleRank,
      nodes:Object.freeze(keys.map(item=>nodes.get(item))),
      pairs:Object.freeze(componentEdges.map(edge=>edge.pair))
    }));
  });
  components.sort((a,b)=>b.edgeCount-a.edgeCount||b.nodeCount-a.nodeCount);
  let hub=null;
  degree.forEach((value,key)=>{if(!hub||value>hub.degree)hub={...nodes.get(key),degree:value}});
  const totalCycles=components.reduce((sum,item)=>sum+item.cycleRank,0);
  const isolatedLinks=components.filter(item=>item.nodeCount===2&&item.edgeCount===1).length;
  const recognizedSorted=recognized.slice().sort((a,b)=>a.phaseDistance-b.phaseDistance||b.contribution-a.contribution);
  const supporters=(metric?.topSupport||[]).filter(pair=>pair.contribution>0).slice(0,3);
  const resistors=(metric?.topResistance||[]).filter(pair=>pair.contribution<0).slice(0,3);
  return Object.freeze({
    mode,
    recognizedCount:recognized.length,
    participantCount:nodes.size,
    componentCount:components.length,
    isolatedLinks,
    cycleRank:totalCycles,
    hub:hub?Object.freeze({...hub,share:recognized.length?hub.degree/recognized.length:0}):null,
    recognized:Object.freeze(recognizedSorted),
    components:Object.freeze(components),
    supporters:Object.freeze(supporters),
    resistors:Object.freeze(resistors),
    supportPercent:pct(metric?.support),
    resistancePercent:pct(metric?.resistance),
    netPercent:pct(metric?.net)
  });
}
return Object.freeze({analyze});
});
