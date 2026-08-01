// Sky Chart interaction controller v2: the wheel owns hover/isolation; rows only select readings.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyFoundationInteractionsV2)return;
  window.__relphiSkyFoundationInteractionsV2=true;

  const NS='http://www.w3.org/2000/svg';
  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const SKY={A:'#c9211e',B:'#2462d0'};
  const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const SIGN_NAMES=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ORDER=['sun','moon','asc','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','north-node','south-node','chiron','lilith','part-of-fortune','vertex','mc','ic','dsc'];
  const ASPECTS=[
    {id:'conjunction',angle:0,orb:3,color:'#e53935'},
    {id:'semi-sextile',angle:30,orb:2,color:'#7c9b49'},
    {id:'octile',angle:45,orb:2,color:'#b86d43'},
    {id:'sextile',angle:60,orb:3,color:'#d3b727'},
    {id:'quintile',angle:72,orb:2,color:'#8b6cc2'},
    {id:'square',angle:90,orb:3,color:'#d6534d'},
    {id:'trine',angle:120,orb:3,color:'#4e9e69'},
    {id:'tri-octile',angle:135,orb:2,color:'#9f5944'},
    {id:'bi-quintile',angle:144,orb:2,color:'#7655aa'},
    {id:'quincunx',angle:150,orb:2,color:'#4b8e88'},
    {id:'opposition',angle:180,orb:3,color:'#5961c8'}
  ];
  const ALIASES={rising:'asc',ascendant:'asc',asc:'asc',ac:'asc',descendant:'dsc',dsc:'dsc',dc:'dsc',midheaven:'mc',mc:'mc','imum coeli':'ic',imumcoeli:'ic',ic:'ic',vertex:'vertex',vx:'vertex','north node':'north-node',node:'north-node','true node':'north-node','mean node':'north-node','south node':'south-node',chiron:'chiron',lilith:'lilith','black moon lilith':'lilith',fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune'};

  let lockedState=null,hoverState=null,refreshQueued=false;
  let current={listA:[],listB:[],relations:[],cuspsA:[],cuspsB:[]};

  const norm=value=>((Number(value)%360)+360)%360;
  const separation=(a,b)=>Math.abs(((a-b+180)%360+360)%360-180);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
  function source(payload){
    if(!payload||typeof payload!=='object')return[];
    const known=[payload.placements,payload.positions,payload.points,payload.bodies].find(value=>value&&typeof value==='object'),value=known||payload;
    if(Array.isArray(value))return value.map((item,index)=>[String(item?.name||item?.label||item?.id||index),item]);
    return Object.entries(value).filter(([key,item])=>item&&typeof item==='object'&&!Array.isArray(item)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key)&&(Number.isFinite(Number(item.longitude))||item.sign||item.zodiac));
  }
  function longitude(item){
    if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);
    const sign=SIGNS.indexOf(String(item?.sign||item?.zodiac||'').trim().toLowerCase());
    return sign<0?NaN:norm(sign*30+Number(item.degree||item.degrees||0)+Number(item.minute||item.minutes||0)/60+Number(item.second||item.seconds||0)/3600);
  }
  function canonical(key,item){
    const registry=window.RelphiGlyphRegistry;if(!registry)return null;
    for(const candidate of [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]){
      if(candidate==null)continue;const raw=String(candidate).trim(),entry=registry.resolve(ALIASES[raw.toLowerCase()]||raw)||registry.get(ALIASES[raw.toLowerCase()]||raw);if(entry)return entry;
    }
    return null;
  }
  function records(payload){
    return source(payload).map(([key,item])=>{const entry=canonical(key,item),value=longitude(item);return{key,item,entry,id:entry?.id||'',value}}).filter(record=>record.entry&&Number.isFinite(record.value)).sort((a,b)=>{const ai=ORDER.indexOf(a.id),bi=ORDER.indexOf(b.id);return(ai<0?999:ai)-(bi<0?999:bi)||a.value-b.value});
  }
  function profile(payload){return payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{}}
  function ascendant(payload,list){const record=list.find(item=>item.id==='asc');if(record)return record.value;const value=Number(profile(payload).ascendant??payload?.ascendant??payload?.asc);return Number.isFinite(value)?norm(value):0}
  function cusps(payload,list){
    const p=profile(payload);for(const raw of [p.houseCusps,p.cusps,payload?.houseCusps,payload?.cusps,payload?.houses]){if(!raw)continue;const values=(Array.isArray(raw)?raw:Object.values(raw)).map(item=>typeof item==='object'?Number(item.longitude??item.value??item.cusp):Number(item)).slice(0,12);if(values.length===12&&values.every(Number.isFinite))return values.map(norm)}
    const asc=ascendant(payload,list),system=String(p.houseSystem||payload?.houseSystem||'whole-sign').toLowerCase(),start=system.includes('whole')?Math.floor(asc/30)*30:asc;return Array.from({length:12},(_,index)=>norm(start+index*30));
  }
  function houseFor(value,houseCusps){for(let index=0;index<12;index++){const start=houseCusps[index],span=norm(houseCusps[(index+1)%12]-start)||30;if(norm(value-start)<span)return index+1}return 12}
  function prepare(payload,slot){const list=records(payload),houseCusps=cusps(payload,list);list.forEach(record=>{record.sky=slot;record.sign=Math.floor(record.value/30);record.house=houseFor(record.value,houseCusps)});return{list,houseCusps}}
  function relationships(listA,listB){const result=[];listA.forEach(left=>listB.forEach(right=>{const distance=separation(left.value,right.value);ASPECTS.forEach(aspect=>{const orb=Math.abs(distance-aspect.angle);if(orb<=aspect.orb)result.push({left,right,aspect,orb,distance})})}));return result.sort((a,b)=>a.orb-b.orb)}
  function coordinate(record){const sign=Math.floor(record.value/30),within=record.value-sign*30,degree=Math.floor(within),minute=Math.round((within-degree)*60)%60;return{sign,text:`${degree}°${String(minute).padStart(2,'0')}′`}}

  function ensurePanel(){
    let panel=document.getElementById('skyFoundationRelationships');if(panel)return panel;
    const comparison=document.getElementById('skyFoundationComparison');if(!comparison)return null;
    panel=document.createElement('section');panel.id='skyFoundationRelationships';panel.setAttribute('aria-label','Filtered relationships');panel.innerHTML='<header class="sky-foundation-relationships-heading"><h2>Relationships</h2><span id="skyFoundationRelationshipCount">0/0</span><button id="skyFoundationClearIsolation" type="button" hidden>Clear</button></header><div id="skyFoundationRelationshipList"></div><p id="skyFoundationRelationshipEmpty" hidden>No relationships involve this selection.</p>';comparison.appendChild(panel);
    panel.querySelector('#skyFoundationClearIsolation').addEventListener('click',event=>{event.preventDefault();event.stopPropagation();lockedState=null;hoverState=null;applyState()});return panel;
  }
  async function draw(parent,id,options){
    const registry=window.RelphiGlyphRegistry,component=window.RelphiGlyphComponent,entry=registry?.get(id)||registry?.resolve(id);if(!entry||!component?.draw)throw new Error('Approved registry glyph unavailable: '+id);return component.draw(parent,entry.id,options);
  }
  function makeSvg(label){const node=document.createElementNS(NS,'svg');node.setAttribute('viewBox','-20 -20 40 40');node.setAttribute('aria-label',label);return node}
  async function renderRows(relations){
    const list=document.getElementById('skyFoundationRelationshipList'),count=document.getElementById('skyFoundationRelationshipCount');if(!list||!count)return;
    const selected=document.querySelector('.sky-foundation-relationship-row[aria-current="true"]');const selectedKey=selected?`${selected.dataset.leftPlacement}|${selected.dataset.aspect}|${selected.dataset.rightPlacement}|${selected.getAttribute('aria-label')}`:'';
    list.replaceChildren();count.textContent=`${relations.length}/${relations.length}`;count.dataset.total=String(relations.length);const jobs=[];
    relations.forEach((relation,index)=>{
      const left=coordinate(relation.left),right=coordinate(relation.right),row=document.createElement('button');row.type='button';row.className='sky-foundation-relationship-row';row.dataset.relationshipSelection='true';row.dataset.relationIndex=String(index);row.dataset.aspect=relation.aspect.id;row.dataset.leftPlacement=relation.left.id;row.dataset.rightPlacement=relation.right.id;row.dataset.leftHouse=String(relation.left.house);row.dataset.rightHouse=String(relation.right.house);row.dataset.leftSign=String(relation.left.sign);row.dataset.rightSign=String(relation.right.sign);row.setAttribute('aria-label',`${relation.left.entry.name} ${relation.aspect.id} ${relation.right.entry.name}, orb ${relation.orb.toFixed(2)} degrees`);
      const leftGlyph=makeSvg(relation.left.entry.name),aspectGlyph=makeSvg(relation.aspect.id),rightGlyph=makeSvg(relation.right.entry.name),leftCopy=document.createElement('span'),rightCopy=document.createElement('span');leftCopy.className=rightCopy.className='sky-foundation-relationship-copy';leftCopy.innerHTML=`${esc(relation.left.entry.name)}<small>${left.text} ${esc(SIGN_NAMES[left.sign])} · H${relation.left.house}</small>`;rightCopy.innerHTML=`${esc(relation.right.entry.name)}<small>${right.text} ${esc(SIGN_NAMES[right.sign])} · H${relation.right.house} · Orb ${relation.orb.toFixed(2)}°</small>`;row.append(leftGlyph,leftCopy,aspectGlyph,rightGlyph,rightCopy);list.appendChild(row);
      const key=`${row.dataset.leftPlacement}|${row.dataset.aspect}|${row.dataset.rightPlacement}|${row.getAttribute('aria-label')}`;if(key===selectedKey)row.setAttribute('aria-current','true');
      jobs.push(draw(leftGlyph,relation.left.id,{radius:15,padding:1,color:SKY.A}).catch(error=>{leftGlyph.remove();console.error(error)}),draw(aspectGlyph,relation.aspect.id,{radius:15,padding:1,color:relation.aspect.color}).catch(error=>{aspectGlyph.remove();console.error(error)}),draw(rightGlyph,relation.right.id,{radius:15,padding:1,color:SKY.B}).catch(error=>{rightGlyph.remove();console.error(error)}));
    });
    await Promise.allSettled(jobs);
  }
  function annotateHouseLayer(layerName,slot){const layer=document.querySelector(`[data-layer="${layerName}"]`);if(!layer)return;Array.from(layer.children).filter(node=>node.tagName?.toLowerCase()==='path').forEach((node,index)=>{node.classList.add('sky-foundation-interactive','sky-foundation-house-sector');Object.assign(node.dataset,{interactive:'house',focusPiece:'house',sky:slot,house:String(index+1)});node.setAttribute('tabindex','0');node.setAttribute('role','button');node.setAttribute('aria-label',`Sky ${slot} house ${index+1}`)})}
  function annotateSigns(){const layer=document.querySelector('[data-layer="zodiac"]');if(!layer)return;const paths=Array.from(layer.children).filter(node=>node.tagName?.toLowerCase()==='path'),glyphs=Array.from(layer.children).filter(node=>node.tagName?.toLowerCase()==='g');paths.forEach((node,index)=>{node.classList.add('sky-foundation-interactive','sky-foundation-sign-sector');Object.assign(node.dataset,{interactive:'sign',focusPiece:'sign',sign:String(index)});node.setAttribute('tabindex','0');node.setAttribute('role','button');node.setAttribute('aria-label',SIGN_NAMES[index])});glyphs.forEach((node,index)=>{node.classList.add('sky-foundation-sign-glyph');Object.assign(node.dataset,{focusPiece:'sign',sign:String(index)});node.style.pointerEvents='none'})}
  function annotatePlacements(listA,listB){
    const maps={A:new Map(listA.map(record=>[record.id,record])),B:new Map(listB.map(record=>[record.id,record]))},nodes=Array.from(document.querySelectorAll('[data-layer="placements"] > g[data-sky][data-placement]')),leaders=Array.from(document.querySelectorAll('[data-layer="leaders"] > line'));
    nodes.forEach((node,index)=>{const slot=node.dataset.sky,record=maps[slot]?.get(node.dataset.placement);if(!record)return;node.classList.add('sky-foundation-interactive','sky-foundation-placement');Object.assign(node.dataset,{interactive:'placement',focusPiece:'placement',sign:String(record.sign),house:String(record.house)});node.setAttribute('tabindex','0');node.setAttribute('role','button');node.setAttribute('aria-label',`Sky ${slot} ${record.entry.name}, house ${record.house}`);const leader=leaders[index];if(leader){leader.classList.add('sky-foundation-focus-piece');Object.assign(leader.dataset,{focusPiece:'leader',sky:slot,placement:record.id,sign:String(record.sign),house:String(record.house)})}});
  }
  function annotateAspects(relations){Array.from(document.querySelectorAll('[data-layer="aspects"] > line:not(.sky-foundation-aspect-hit)')).forEach((line,index)=>{const relation=relations[index];if(!relation)return;line.classList.add('sky-foundation-interactive','sky-foundation-aspect');Object.assign(line.dataset,{interactive:'aspect',focusPiece:'aspect',relationIndex:String(index),aspect:relation.aspect.id,leftPlacement:relation.left.id,rightPlacement:relation.right.id,leftHouse:String(relation.left.house),rightHouse:String(relation.right.house),leftSign:String(relation.left.sign),rightSign:String(relation.right.sign)});line.setAttribute('tabindex','0');line.setAttribute('role','button');line.setAttribute('aria-label',`Sky A ${relation.left.entry.name} ${relation.aspect.id} Sky B ${relation.right.entry.name}`);line.style.pointerEvents='stroke'})}
  function annotateLedger(slot,list){const panel=document.getElementById(slot==='A'?'skyFoundationA':'skyFoundationB');if(!panel)return;Array.from(panel.querySelectorAll('.sky-foundation-row')).forEach((row,index)=>{const record=list[index];if(!record)return;Object.assign(row.dataset,{interactive:'placement',sky:slot,placement:record.id,house:String(record.house),sign:String(record.sign)});row.setAttribute('tabindex','0');row.setAttribute('role','button');row.setAttribute('aria-label',`Sky ${slot} ${record.entry.name}, house ${record.house}`)})}

  function specFrom(node){const kind=node?.dataset?.interactive;if(kind==='house')return{kind,sky:node.dataset.sky,value:Number(node.dataset.house)};if(kind==='sign')return{kind,sky:null,value:Number(node.dataset.sign)};if(kind==='placement')return{kind,sky:node.dataset.sky,value:node.dataset.placement};if(kind==='aspect')return{kind,sky:null,value:Number(node.dataset.relationIndex)};return null}
  function same(a,b){return!!a&&!!b&&a.kind===b.kind&&a.sky===b.sky&&a.value===b.value}
  function relationMatches(relation,index,state){if(!state)return true;if(state.kind==='aspect')return index===state.value;if(state.kind==='sign')return relation.left.sign===state.value||relation.right.sign===state.value;if(state.kind==='house')return state.sky==='A'?relation.left.house===state.value:relation.right.house===state.value;if(state.kind==='placement')return state.sky==='A'?relation.left.id===state.value:relation.right.id===state.value;return true}
  function arcsOverlap(start,span,targetStart,targetSpan){const samples=[start,norm(start+span-.0001),targetStart,norm(targetStart+targetSpan-.0001)];const inside=(value,arcStart,arcSpan)=>norm(value-arcStart)<arcSpan;return samples.some((value,index)=>index<2?inside(value,targetStart,targetSpan):inside(value,start,span))}
  function housesForSign(houseCusps,sign){const result=[];const targetStart=sign*30;houseCusps.forEach((start,index)=>{const span=norm(houseCusps[(index+1)%12]-start)||30;if(arcsOverlap(start,span,targetStart,30))result.push(index+1)});return result}
  function keepSets(state){
    const matched=new Set(),placements=new Set(),houses=new Set(),signs=new Set();current.relations.forEach((relation,index)=>{if(!relationMatches(relation,index,state))return;matched.add(index);placements.add(`A:${relation.left.id}`);placements.add(`B:${relation.right.id}`);houses.add(`A:${relation.left.house}`);houses.add(`B:${relation.right.house}`);signs.add(relation.left.sign);signs.add(relation.right.sign)});
    if(state?.kind==='house'){houses.add(`${state.sky}:${state.value}`);const list=state.sky==='A'?current.listA:current.listB;list.filter(record=>record.house===state.value).forEach(record=>{placements.add(`${state.sky}:${record.id}`);signs.add(record.sign)})}
    if(state?.kind==='sign'){signs.add(state.value);[...current.listA,...current.listB].filter(record=>record.sign===state.value).forEach(record=>placements.add(`${record.sky}:${record.id}`));housesForSign(current.cuspsA,state.value).forEach(house=>houses.add(`A:${house}`));housesForSign(current.cuspsB,state.value).forEach(house=>houses.add(`B:${house}`))}
    if(state?.kind==='placement'){placements.add(`${state.sky}:${state.value}`);const list=state.sky==='A'?current.listA:current.listB,record=list.find(item=>item.id===state.value);if(record){houses.add(`${state.sky}:${record.house}`);signs.add(record.sign)}}
    return{matched,placements,houses,signs};
  }
  function kept(node,keep){const type=node.dataset.focusPiece;if(type==='aspect')return keep.matched.has(Number(node.dataset.relationIndex));if(type==='house')return keep.houses.has(`${node.dataset.sky}:${node.dataset.house}`);if(type==='sign')return keep.signs.has(Number(node.dataset.sign));if(type==='placement'||type==='leader')return keep.placements.has(`${node.dataset.sky}:${node.dataset.placement}`);return false}
  function matchesNode(node,state){if(!state)return false;const type=node.dataset.interactive;if(state.kind==='aspect')return type==='aspect'&&Number(node.dataset.relationIndex)===state.value;if(state.kind==='house')return type==='house'&&node.dataset.sky===state.sky&&Number(node.dataset.house)===state.value;if(state.kind==='sign')return type==='sign'&&Number(node.dataset.sign)===state.value;if(state.kind==='placement')return type==='placement'&&node.dataset.sky===state.sky&&node.dataset.placement===state.value;return false}
  function applyState(){
    const state=lockedState||hoverState,keep=keepSets(state),wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');if(wheel){wheel.classList.toggle('has-isolation',!!state);wheel.querySelectorAll('[data-focus-piece]').forEach(node=>{node.classList.toggle('is-kept',!!state&&kept(node,keep));node.classList.toggle('is-selected',!!lockedState&&matchesNode(node,lockedState));node.classList.toggle('is-hovered',!!hoverState&&!lockedState&&matchesNode(node,hoverState))})}
    ['A','B'].forEach(slot=>{const panel=document.getElementById(slot==='A'?'skyFoundationA':'skyFoundationB');if(!panel)return;panel.classList.toggle('has-ledger-isolation',!!state);panel.querySelectorAll('.sky-foundation-row[data-placement]').forEach(row=>{row.classList.toggle('is-kept',!!state&&keep.placements.has(`${slot}:${row.dataset.placement}`));row.classList.toggle('is-selected',!!lockedState&&matchesNode(row,lockedState));row.classList.toggle('is-hovered',!!hoverState&&!lockedState&&matchesNode(row,hoverState))})});
    document.querySelectorAll('.sky-foundation-relationship-row').forEach(row=>{const visible=!state||keep.matched.has(Number(row.dataset.relationIndex));row.hidden=!visible;row.setAttribute('aria-hidden',visible?'false':'true')});
    const visibleCount=state?keep.matched.size:current.relations.length,count=document.getElementById('skyFoundationRelationshipCount'),empty=document.getElementById('skyFoundationRelationshipEmpty'),clear=document.getElementById('skyFoundationClearIsolation');if(count)count.textContent=`${visibleCount}/${current.relations.length}`;if(empty)empty.hidden=visibleCount!==0;if(clear)clear.hidden=!lockedState;
    window.dispatchEvent(new CustomEvent('relphi:sky-foundation-filter-changed',{detail:{state:state?{...state,mode:lockedState?'selected':'hover'}:null,relationshipIndexes:Array.from(state?keep.matched:current.relations.map((_,index)=>index))}}));
  }
  function interactive(event){const node=event.target.closest?.('[data-interactive]'),root=document.getElementById('skyFoundationRoot');return node&&root?.contains(node)?node:null}
  function bind(){
    const root=document.getElementById('skyFoundationRoot');if(!root||root.dataset.foundationInteractionsV2Bound==='true')return;root.dataset.foundationInteractionsV2Bound='true';
    root.addEventListener('pointerover',event=>{if(lockedState)return;const node=interactive(event);if(!node||node.closest('.sky-foundation-relationship-row')||node.contains(event.relatedTarget))return;hoverState=specFrom(node);applyState()});
    root.addEventListener('pointerout',event=>{if(lockedState)return;const node=interactive(event);if(!node||node.closest('.sky-foundation-relationship-row')||node.contains(event.relatedTarget))return;hoverState=null;applyState()});
    root.addEventListener('focusin',event=>{if(lockedState)return;const node=interactive(event);if(!node||node.closest('.sky-foundation-relationship-row'))return;hoverState=specFrom(node);applyState()});
    root.addEventListener('focusout',event=>{if(lockedState)return;const node=interactive(event);if(!node||node.closest('.sky-foundation-relationship-row')||node.contains(event.relatedTarget))return;hoverState=null;applyState()});
    root.addEventListener('click',event=>{if(event.target.closest('.sky-foundation-relationship-row'))return;const node=interactive(event);if(node){event.preventDefault();const next=specFrom(node);lockedState=same(lockedState,next)?null:next;hoverState=null;applyState();return}if(lockedState&&event.target.closest?.('#skyFoundationWheelMount')){lockedState=null;hoverState=null;applyState()}});
    root.addEventListener('keydown',event=>{if(event.key==='Escape'){lockedState=null;hoverState=null;applyState();return}if(!['Enter',' '].includes(event.key)||event.target.closest('.sky-foundation-relationship-row'))return;const node=interactive(event);if(!node)return;event.preventDefault();const next=specFrom(node);lockedState=same(lockedState,next)?null:next;hoverState=null;applyState()});
  }
  async function refresh(){
    refreshQueued=false;const root=document.getElementById('skyFoundationRoot'),wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');if(!root||!wheel||root.getAttribute('aria-busy')!=='false')return;ensurePanel();
    const preparedA=prepare(read(KEYS.A),'A'),preparedB=prepare(read(KEYS.B),'B'),relations=relationships(preparedA.list,preparedB.list);current={listA:preparedA.list,listB:preparedB.list,relations,cuspsA:preparedA.houseCusps,cuspsB:preparedB.houseCusps};
    annotateHouseLayer('a-houses','A');annotateHouseLayer('b-houses','B');annotateSigns();annotatePlacements(current.listA,current.listB);annotateAspects(relations);annotateLedger('A',current.listA);annotateLedger('B',current.listB);await renderRows(relations);bind();applyState();window.dispatchEvent(new Event('relphi:sky-foundation-interactions-ready'));
  }
  function schedule(){if(refreshQueued)return;refreshQueued=true;requestAnimationFrame(refresh)}
  function start(){window.addEventListener('relphi:sky-foundation-ready',schedule);if(document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy')==='false')schedule()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
