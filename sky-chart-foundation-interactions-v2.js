// Sky Chart interaction controller v4: preserve the established intersky tile path and bridge intrasky tiles into the same wheel dim/isolate display.
// Wheel focus follows relationship rows that remain eligible under the active scope/aspect/placement filters.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyFoundationInteractionsV4)return;
  window.__relphiSkyFoundationInteractionsV2=true;
  window.__relphiSkyFoundationInteractionsV3=true;
  window.__relphiSkyFoundationInteractionsV4=true;

  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const SIGN_NAMES=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ORDER=['sun','moon','asc','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','north-node','south-node','chiron','lilith','part-of-fortune','vertex','mc','ic','dsc'];
  const HARMONIC=window.RelphiHarmonicOrb;
  const ASPECTS=HARMONIC?.aspects||[];
  const ALIASES={rising:'asc',ascendant:'asc',asc:'asc',ac:'asc',descendant:'dsc',dsc:'dsc',dc:'dsc',midheaven:'mc',mc:'mc','imum coeli':'ic',imumcoeli:'ic',ic:'ic',vertex:'vertex',vx:'vertex','north node':'north-node',node:'north-node','true node':'north-node','mean node':'north-node','south node':'south-node',chiron:'chiron',lilith:'lilith','black moon lilith':'lilith',fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune'};

  let lockedState=null,hoverState=null,rowLockedState=null,rowHoverState=null,refreshQueued=false,selectionClearObserver=null,renderedRelationshipSignature=null;
  let current={listA:[],listB:[],relations:[],cuspsA:[],cuspsB:[]};

  const norm=value=>((Number(value)%360)+360)%360;
  const separation=(a,b)=>Math.abs(((a-b+180)%360+360)%360-180);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
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
  function relationships(listA,listB){
    const result=[],windowValue=HARMONIC?.windowFromControl?.()??10;
    listA.forEach(left=>listB.forEach(right=>{
      const distance=separation(left.value,right.value);
      ASPECTS.forEach(aspect=>{const relation=HARMONIC?.relation?.(left,right,aspect,distance,windowValue);if(relation)result.push(relation)})
    }));
    return result.sort((a,b)=>a.phaseError-b.phaseError||a.harmonicOrder-b.harmonicOrder||a.orb-b.orb);
  }
  function relationshipSignature(relations){
    return relations.map(relation=>[
      relation.left.id,relation.aspect.id,relation.right.id,relation.orb.toFixed(6),
      relation.harmonicOrder,relation.harmonicNumerator,relation.phaseError.toFixed(6),
      relation.signedPhaseError.toFixed(6),relation.masterWindow.toFixed(6),
      Number.isFinite(relation.windowFraction)?relation.windowFraction.toFixed(6):String(relation.windowFraction),
      relation.coherence.toFixed(8),relation.left.house,relation.right.house,relation.left.sign,relation.right.sign
    ].join('|')).join(';');
  }
  function relationshipRowsIntact(relations){
    const list=document.getElementById('skyFoundationRelationshipList');if(!list)return false;
    const rows=Array.from(list.children).filter(node=>node.classList?.contains('sky-foundation-relationship-row')&&String(node.dataset.relationshipMode||'A-B').toUpperCase()==='A-B');
    if(rows.length!==relations.length)return false;
    return rows.every((row,index)=>{
      const relation=relations[index];
      return row.dataset.leftPlacement===relation.left.id&&row.dataset.aspect===relation.aspect.id&&row.dataset.rightPlacement===relation.right.id&&Number(row.dataset.sourceOrb).toFixed(6)===relation.orb.toFixed(6)&&Number(row.dataset.leftHouse)===relation.left.house&&Number(row.dataset.rightHouse)===relation.right.house;
    });
  }
  function coordinate(record){
    const value=norm(record.value),sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60+1e-9);
    return{sign,text:`${degree}°${String(minute).padStart(2,'0')}′`};
  }

  function ensurePanel(){
    let panel=document.getElementById('skyFoundationRelationships');if(panel)return panel;
    const comparison=document.getElementById('skyFoundationComparison');if(!comparison)return null;
    panel=document.createElement('section');panel.id='skyFoundationRelationships';panel.setAttribute('aria-label','Filtered relationships');panel.innerHTML='<header class="sky-foundation-relationships-heading"><h2>Relationships</h2><span id="skyFoundationRelationshipCount">0/0</span><button id="skyFoundationClearIsolation" type="button" hidden>Clear</button></header><div id="skyFoundationRelationshipList"></div><p id="skyFoundationRelationshipEmpty" hidden>No relationships involve this selection.</p>';comparison.appendChild(panel);
    panel.querySelector('#skyFoundationClearIsolation').addEventListener('click',event=>{event.preventDefault();event.stopPropagation();lockedState=null;hoverState=null;rowLockedState=null;rowHoverState=null;applyState()});return panel;
  }
  function glyphSlot(role,label){
    const slot=document.createElement('span');
    slot.className='sky-foundation-relationship-glyph sky-foundation-relationship-glyph--'+role;
    slot.dataset.glyphRole=role;
    slot.setAttribute('aria-label',label);
    return slot;
  }
  async function renderRows(relations){
    const list=document.getElementById('skyFoundationRelationshipList'),count=document.getElementById('skyFoundationRelationshipCount');if(!list||!count)return;
    const selectionCleared=document.getElementById('skyFoundationRoot')?.dataset.relationshipSelectionCleared==='true',selected=selectionCleared?null:document.querySelector('.sky-foundation-relationship-row[aria-current="true"]');const selectedKey=selected?[selected.dataset.leftPlacement,selected.dataset.aspect,selected.dataset.rightPlacement,selected.getAttribute('aria-label')].join('|'):'';
    list.replaceChildren();count.textContent=relations.length+'/'+relations.length;count.dataset.total=String(relations.length);
    relations.forEach((relation,index)=>{
      const left=coordinate(relation.left),right=coordinate(relation.right),row=document.createElement('button');row.type='button';row.className='sky-foundation-relationship-row';row.dataset.relationshipSelection='true';row.dataset.relationIndex=String(index);row.dataset.relationshipMode='A-B';row.dataset.relationScope='inter';row.dataset.leftSky='A';row.dataset.rightSky='B';row.dataset.aspect=relation.aspect.id;row.dataset.leftPlacement=relation.left.id;row.dataset.rightPlacement=relation.right.id;row.dataset.sourceOrb=relation.orb.toFixed(6);row.dataset.harmonicOrder=String(relation.harmonicOrder);row.dataset.harmonicNumerator=String(relation.harmonicNumerator);row.dataset.phaseError=relation.phaseError.toFixed(6);row.dataset.signedPhaseError=relation.signedPhaseError.toFixed(6);row.dataset.harmonicWindow=relation.masterWindow.toFixed(6);row.dataset.windowFraction=Number.isFinite(relation.windowFraction)?relation.windowFraction.toFixed(6):String(relation.windowFraction);row.dataset.harmonicCoherence=relation.coherence.toFixed(8);row.dataset.leftHouse=String(relation.left.house);row.dataset.rightHouse=String(relation.right.house);row.dataset.leftSign=String(left.sign);row.dataset.rightSign=String(right.sign);row.setAttribute('aria-label',relation.left.entry.name+' '+relation.aspect.id+' '+relation.right.entry.name+', orb '+relation.orb.toFixed(2)+' degrees, harmonic '+relation.harmonicOrder+', phase error '+relation.phaseError.toFixed(2)+' degrees, coherence '+relation.coherencePercent.toFixed(0)+' percent');
      const leftGlyph=glyphSlot('left',relation.left.entry.name),aspectGlyph=glyphSlot('aspect',relation.aspect.id),rightGlyph=glyphSlot('right',relation.right.entry.name),leftCopy=document.createElement('span'),rightCopy=document.createElement('span');leftCopy.className=rightCopy.className='sky-foundation-relationship-copy';leftCopy.innerHTML=esc(relation.left.entry.name)+'<small>'+left.text+' '+esc(SIGN_NAMES[left.sign])+' · H'+relation.left.house+'</small>';rightCopy.innerHTML=esc(relation.right.entry.name)+'<small>'+right.text+' '+esc(SIGN_NAMES[right.sign])+' · H'+relation.right.house+' · Orb '+relation.orb.toFixed(2)+'°</small>';row.append(leftGlyph,leftCopy,aspectGlyph,rightGlyph,rightCopy);list.appendChild(row);
      const key=[row.dataset.leftPlacement,row.dataset.aspect,row.dataset.rightPlacement,row.getAttribute('aria-label')].join('|');if(key===selectedKey)row.setAttribute('aria-current','true');
    });
  }
  function annotateHouseLayer(layerName,slot){const layer=document.querySelector(`[data-layer="${layerName}"]`);if(!layer)return;Array.from(layer.children).filter(node=>node.tagName?.toLowerCase()==='path').forEach((node,index)=>{node.classList.add('sky-foundation-interactive','sky-foundation-house-sector');Object.assign(node.dataset,{interactive:'house',focusPiece:'house',sky:slot,house:String(index+1)});node.setAttribute('tabindex','0');node.setAttribute('role','button');node.setAttribute('aria-label',`Sky ${slot} house ${index+1}`)})}
  function annotateSigns(){const layer=document.querySelector('[data-layer="zodiac"]');if(!layer)return;const paths=Array.from(layer.children).filter(node=>node.tagName?.toLowerCase()==='path'),glyphs=Array.from(layer.children).filter(node=>node.tagName?.toLowerCase()==='g');paths.forEach((node,index)=>{node.classList.add('sky-foundation-interactive','sky-foundation-sign-sector');Object.assign(node.dataset,{interactive:'sign',focusPiece:'sign',sign:String(index)});node.setAttribute('tabindex','0');node.setAttribute('role','button');node.setAttribute('aria-label',SIGN_NAMES[index])});glyphs.forEach((node,index)=>{node.classList.add('sky-foundation-sign-glyph');Object.assign(node.dataset,{focusPiece:'sign',sign:String(index)});node.style.pointerEvents='none'})}
  function annotatePlacements(listA,listB){
    const maps={A:new Map(listA.map(record=>[record.id,record])),B:new Map(listB.map(record=>[record.id,record]))},nodes=Array.from(document.querySelectorAll('[data-layer="placements"] > g[data-sky][data-placement]')),leaders=Array.from(document.querySelectorAll('[data-layer="leaders"] > line'));
    nodes.forEach((node,index)=>{const slot=node.dataset.sky,record=maps[slot]?.get(node.dataset.placement);if(!record)return;node.classList.add('sky-foundation-interactive','sky-foundation-placement');Object.assign(node.dataset,{interactive:'placement',focusPiece:'placement',sign:String(record.sign),house:String(record.house)});node.setAttribute('tabindex','0');node.setAttribute('role','button');node.setAttribute('aria-label',`Sky ${slot} ${record.entry.name}, house ${record.house}`);const leader=leaders[index];if(leader){leader.classList.add('sky-foundation-focus-piece');Object.assign(leader.dataset,{focusPiece:'leader',sky:slot,placement:record.id,sign:String(record.sign),house:String(record.house)})}});
  }
  function relationKey(left,aspect,right,orb){return`${left}|${aspect}|${right}|${Number(orb).toFixed(6)}`}
  function annotateAspects(relations){
    const indexes=new Map();relations.forEach((relation,index)=>indexes.set(relationKey(relation.left.id,relation.aspect.id,relation.right.id,relation.orb),index));
    Array.from(document.querySelectorAll('[data-layer="aspects"] > line:not(.sky-foundation-aspect-hit)')).forEach(line=>{
      const mode=String(line.dataset.relationshipMode||'').toUpperCase();
      if(mode==='A-A'||mode==='B-B'){
        line.classList.add('sky-foundation-interactive','sky-foundation-aspect');
        line.dataset.interactive='aspect';line.dataset.focusPiece='aspect';line.style.pointerEvents='stroke';
        return;
      }
      const index=indexes.get(relationKey(line.dataset.leftPlacement,line.dataset.aspect,line.dataset.rightPlacement,line.dataset.orb)),relation=relations[index];
      if(!relation){delete line.dataset.relationIndex;return}
      line.classList.add('sky-foundation-interactive','sky-foundation-aspect');
      Object.assign(line.dataset,{interactive:'aspect',focusPiece:'aspect',relationIndex:String(index),relationshipMode:'A-B',leftSky:'A',rightSky:'B',aspect:relation.aspect.id,leftPlacement:relation.left.id,rightPlacement:relation.right.id,leftHouse:String(relation.left.house),rightHouse:String(relation.right.house),leftSign:String(relation.left.sign),rightSign:String(relation.right.sign),harmonicOrder:String(relation.harmonicOrder),harmonicNumerator:String(relation.harmonicNumerator),phaseError:relation.phaseError.toFixed(6),harmonicCoherence:relation.coherence.toFixed(8)});
      line.setAttribute('tabindex','0');line.setAttribute('role','button');line.setAttribute('aria-label',`Sky A ${relation.left.entry.name} ${relation.aspect.id} Sky B ${relation.right.entry.name}, harmonic ${relation.harmonicOrder}, phase error ${relation.phaseError.toFixed(2)} degrees`);line.style.pointerEvents='stroke'
    })
  }
  function ledgerRecord(row,list){
    const label=String(row.querySelector('.sky-foundation-row-name')?.textContent||'').trim();if(!label)return null;
    const entry=canonical(label,{name:label});if(!entry?.id)return null;
    return list.find(record=>record.id===entry.id)||null;
  }
  function annotateLedger(slot,list){
    const panel=document.getElementById(slot==='A'?'skyFoundationA':'skyFoundationB');if(!panel)return;
    panel.querySelectorAll('.sky-foundation-row').forEach(row=>{
      const record=ledgerRecord(row,list);
      if(!record){delete row.dataset.interactive;delete row.dataset.sky;delete row.dataset.placement;delete row.dataset.house;delete row.dataset.sign;row.removeAttribute('tabindex');row.removeAttribute('role');return}
      Object.assign(row.dataset,{interactive:'placement',sky:slot,placement:record.id,house:String(record.house),sign:String(record.sign)});
      row.setAttribute('tabindex','0');row.setAttribute('role','button');row.setAttribute('aria-label',`Sky ${slot} ${record.entry.name}, house ${record.house}`)
    })
  }

  function specFrom(node){const kind=node?.dataset?.interactive;if(kind==='house')return{kind,sky:node.dataset.sky,value:Number(node.dataset.house)};if(kind==='sign')return{kind,sky:null,value:Number(node.dataset.sign)};if(kind==='placement')return{kind,sky:node.dataset.sky,value:node.dataset.placement};if(kind==='aspect')return{kind,sky:null,value:String(node.dataset.relationIndex||'')};return null}
  function same(a,b){return!!a&&!!b&&a.kind===b.kind&&a.sky===b.sky&&a.value===b.value}
  function relationMatches(relation,index,state){if(!state)return true;if(state.kind==='aspect')return String(index)===String(state.value);if(state.kind==='sign')return relation.left.sign===state.value||relation.right.sign===state.value;if(state.kind==='house')return state.sky==='A'?relation.left.house===state.value:relation.right.house===state.value;if(state.kind==='placement')return state.sky==='A'?relation.left.id===state.value:relation.right.id===state.value;return true}
  function arcsOverlap(start,span,targetStart,targetSpan){const samples=[start,norm(start+span-.0001),targetStart,norm(targetStart+targetSpan-.0001)];const inside=(value,arcStart,arcSpan)=>norm(value-arcStart)<arcSpan;return samples.some((value,index)=>index<2?inside(value,targetStart,targetSpan):inside(value,start,span))}
  function housesForSign(houseCusps,sign){const result=[];const targetStart=sign*30;houseCusps.forEach((start,index)=>{const span=norm(houseCusps[(index+1)%12]-start)||30;if(arcsOverlap(start,span,targetStart,30))result.push(index+1)});return result}
  const PERSISTENT_HIDDEN_CLASSES=['sky-foundation-single-sky-cross-hidden','sky-chart-filter-hidden','sky-chart-orb-hidden','sky-orb-filter-hidden','sky-chart-multiselect-hidden','sky-chart-house-multiselect-hidden','sky-chart-aspect-multiselect-hidden','sky-chart-sign-filter-hidden','sky-chart-semantic-hidden'];
  function rowSlots(row){
    const left=String(row?.dataset?.leftSky||'').toUpperCase(),right=String(row?.dataset?.rightSky||'').toUpperCase(),mode=String(row?.dataset?.relationshipMode||'').toUpperCase();
    return{left:left==='A'||left==='B'?left:mode==='B-B'?'B':'A',right:right==='A'||right==='B'?right:mode==='A-A'?'A':'B'}
  }
  function rowEligibleForWheel(row){return!PERSISTENT_HIDDEN_CLASSES.some(name=>row.classList.contains(name))}
  function rowMatchesState(row,state){
    if(!state)return true;
    const slots=rowSlots(row),index=String(row.dataset.relationIndex||'');
    if(state.kind==='aspect')return index===String(state.value);
    if(state.kind==='sign')return Number(row.dataset.leftSign)===state.value||Number(row.dataset.rightSign)===state.value;
    if(state.kind==='house')return(slots.left===state.sky&&Number(row.dataset.leftHouse)===state.value)||(slots.right===state.sky&&Number(row.dataset.rightHouse)===state.value);
    if(state.kind==='placement')return(slots.left===state.sky&&row.dataset.leftPlacement===state.value)||(slots.right===state.sky&&row.dataset.rightPlacement===state.value);
    return true;
  }
  function keepSets(state){
    const matched=new Set(),placements=new Set(),houses=new Set(),signs=new Set();
    document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]').forEach(row=>{
      if(!rowEligibleForWheel(row)||!rowMatchesState(row,state))return;
      const slots=rowSlots(row),index=String(row.dataset.relationIndex||'');if(index)matched.add(index);
      if(row.dataset.leftPlacement)placements.add(`${slots.left}:${row.dataset.leftPlacement}`);
      if(row.dataset.rightPlacement)placements.add(`${slots.right}:${row.dataset.rightPlacement}`);
      if(row.dataset.leftHouse)houses.add(`${slots.left}:${row.dataset.leftHouse}`);
      if(row.dataset.rightHouse)houses.add(`${slots.right}:${row.dataset.rightHouse}`);
      if(row.dataset.leftSign!=='')signs.add(Number(row.dataset.leftSign));
      if(row.dataset.rightSign!=='')signs.add(Number(row.dataset.rightSign));
    });
    if(state?.kind==='house'){houses.add(`${state.sky}:${state.value}`);const list=state.sky==='A'?current.listA:current.listB;list.filter(record=>record.house===state.value).forEach(record=>{placements.add(`${state.sky}:${record.id}`);signs.add(record.sign)})}
    if(state?.kind==='sign'){signs.add(state.value);[...current.listA,...current.listB].filter(record=>record.sign===state.value).forEach(record=>placements.add(`${record.sky}:${record.id}`));housesForSign(current.cuspsA,state.value).forEach(house=>houses.add(`A:${house}`));housesForSign(current.cuspsB,state.value).forEach(house=>houses.add(`B:${house}`))}
    if(state?.kind==='placement'){placements.add(`${state.sky}:${state.value}`);const list=state.sky==='A'?current.listA:current.listB,record=list.find(item=>item.id===state.value);if(record){houses.add(`${state.sky}:${record.house}`);signs.add(record.sign)}}
    return{matched,placements,houses,signs};
  }
  function kept(node,keep){const type=node.dataset.focusPiece;if(type==='aspect')return keep.matched.has(String(node.dataset.relationIndex||''));if(type==='house')return keep.houses.has(`${node.dataset.sky}:${node.dataset.house}`);if(type==='sign')return keep.signs.has(Number(node.dataset.sign));if(type==='placement'||type==='leader')return keep.placements.has(`${node.dataset.sky}:${node.dataset.placement}`);return false}
  function matchesNode(node,state){if(!state)return false;const type=node.dataset.interactive;if(state.kind==='aspect')return type==='aspect'&&String(node.dataset.relationIndex||'')===String(state.value);if(state.kind==='house')return type==='house'&&node.dataset.sky===state.sky&&Number(node.dataset.house)===state.value;if(state.kind==='sign')return type==='sign'&&Number(node.dataset.sign)===state.value;if(state.kind==='placement')return type==='placement'&&node.dataset.sky===state.sky&&node.dataset.placement===state.value;return false}
  function intraskyRow(row){const mode=String(row?.dataset?.relationshipMode||'').toUpperCase();return mode==='A-A'||mode==='B-B'}
  function rowEndpointSky(row,side){
    const explicit=String(row?.dataset?.[side==='left'?'leftSky':'rightSky']||'').toUpperCase();
    if(explicit==='A'||explicit==='B')return explicit;
    const mode=String(row?.dataset?.relationshipMode||'A-B').toUpperCase();
    if(mode==='A-A')return'A';
    if(mode==='B-B')return'B';
    return side==='left'?'A':'B';
  }
  function rowWheelState(row){
    if(!row)return null;
    const index=String(row.dataset.relationIndex||''),leftSky=rowEndpointSky(row,'left'),rightSky=rowEndpointSky(row,'right'),leftId=String(row.dataset.leftPlacement||''),rightId=String(row.dataset.rightPlacement||''),aspect=String(row.dataset.aspect||'');
    if(!leftId||!rightId||!aspect)return null;
    return{
      kind:'relationship-row',
      index:index||null,
      key:`${leftSky}:${leftId}|${aspect}|${rightSky}:${rightId}`,
      aspect,
      left:{sky:leftSky,id:leftId,house:Number(row.dataset.leftHouse),sign:Number(row.dataset.leftSign)},
      right:{sky:rightSky,id:rightId,house:Number(row.dataset.rightHouse),sign:Number(row.dataset.rightSign)}
    };
  }
  function sameRowState(a,b){return!!a&&!!b&&a.key===b.key}
  function rowLineMatches(node,state){
    if(!state||node.dataset.focusPiece!=='aspect')return false;
    if(String(node.dataset.leftPlacement||'')!==state.left.id||String(node.dataset.rightPlacement||'')!==state.right.id||String(node.dataset.aspect||'')!==state.aspect)return false;
    const explicitLeft=String(node.dataset.leftSky||'').toUpperCase(),explicitRight=String(node.dataset.rightSky||'').toUpperCase();
    if(explicitLeft&&explicitLeft!==state.left.sky)return false;
    if(explicitRight&&explicitRight!==state.right.sky)return false;
    if(!explicitLeft&&!explicitRight&&state.left.sky===state.right.sky)return String(node.dataset.relationIndex||'')===String(state.index||'');
    return true;
  }
  function rowKeeps(node,state){
    if(!state)return false;
    const type=node.dataset.focusPiece;
    if(type==='aspect')return rowLineMatches(node,state);
    if(type==='placement'||type==='leader'){
      const key=`${node.dataset.sky}:${node.dataset.placement}`;
      return key===`${state.left.sky}:${state.left.id}`||key===`${state.right.sky}:${state.right.id}`;
    }
    if(type==='house'){
      const key=`${node.dataset.sky}:${Number(node.dataset.house)}`;
      return (Number.isFinite(state.left.house)&&key===`${state.left.sky}:${state.left.house}`)||(Number.isFinite(state.right.house)&&key===`${state.right.sky}:${state.right.house}`);
    }
    if(type==='sign'){
      const sign=Number(node.dataset.sign);
      return (Number.isFinite(state.left.sign)&&sign===state.left.sign)||(Number.isFinite(state.right.sign)&&sign===state.right.sign);
    }
    return false;
  }
  function rowMarksNode(node,state){return node.dataset.focusPiece==='aspect'&&rowLineMatches(node,state)}
  function applyState(){
    const filterState=lockedState||hoverState,filterKeep=keepSets(filterState),rowState=rowLockedState||rowHoverState,wheelState=filterState||rowState,wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
    if(wheel){
      wheel.classList.toggle('has-isolation',!!wheelState);
      wheel.querySelectorAll('[data-focus-piece]').forEach(node=>{
        const isRowDriven=!filterState&&!!rowState,isKept=!!wheelState&&(isRowDriven?rowKeeps(node,rowState):kept(node,filterKeep)),type=node.dataset.focusPiece;
        node.classList.toggle('is-kept',isKept);
        node.classList.toggle('is-aspect-endpoint',(isRowDriven||filterState?.kind==='aspect')&&isKept&&(type==='placement'||type==='leader'));
        node.classList.toggle('is-selected',!!lockedState&&matchesNode(node,lockedState)||(!filterState&&!!rowLockedState&&rowMarksNode(node,rowLockedState)));
        node.classList.toggle('is-hovered',!!hoverState&&!lockedState&&matchesNode(node,hoverState)||(!filterState&&!rowLockedState&&!!rowHoverState&&rowMarksNode(node,rowHoverState)));
      });
    }
    ['A','B'].forEach(slot=>{const panel=document.getElementById(slot==='A'?'skyFoundationA':'skyFoundationB');if(!panel)return;panel.classList.toggle('has-ledger-isolation',!!filterState);panel.querySelectorAll('.sky-foundation-row[data-placement]').forEach(row=>{row.classList.toggle('is-kept',!!filterState&&filterKeep.placements.has(`${slot}:${row.dataset.placement}`));row.classList.toggle('is-selected',!!lockedState&&matchesNode(row,lockedState));row.classList.toggle('is-hovered',!!hoverState&&!lockedState&&matchesNode(row,hoverState))})});
    document.querySelectorAll('.sky-foundation-relationship-row').forEach(row=>{const visible=!filterState||filterKeep.matched.has(String(row.dataset.relationIndex||''));row.hidden=!visible;row.setAttribute('aria-hidden',visible?'false':'true')});
    const allRows=[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]')],visibleCount=filterState?filterKeep.matched.size:allRows.filter(row=>rowEligibleForWheel(row)).length,totalCount=allRows.length,count=document.getElementById('skyFoundationRelationshipCount'),empty=document.getElementById('skyFoundationRelationshipEmpty'),clear=document.getElementById('skyFoundationClearIsolation');if(count)count.textContent=`${visibleCount}/${totalCount}`;if(empty)empty.hidden=visibleCount!==0;if(clear)clear.hidden=!(lockedState||rowLockedState);
    const relationshipIndexes=filterState?Array.from(filterKeep.matched):allRows.map(row=>String(row.dataset.relationIndex||'')).filter(Boolean);
    window.dispatchEvent(new CustomEvent('relphi:sky-foundation-filter-changed',{detail:{state:filterState?{...filterState,mode:lockedState?'selected':'hover'}:null,relationshipIndexes}}));
  }
  function distanceToSegment(x,y,a,b){const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;if(!length)return Math.hypot(x-a.x,y-a.y);const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/length)),px=a.x+t*dx,py=a.y+t*dy;return Math.hypot(x-px,y-py)}
  function nearestAspect(event){
    if(!Number.isFinite(event.clientX)||!Number.isFinite(event.clientY))return null;
    let nearest=null,best=Infinity;
    document.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)').forEach(line=>{
      if(line.classList.contains('sky-chart-filter-hidden')||line.classList.contains('sky-chart-orb-hidden')||line.classList.contains('sky-orb-filter-hidden')||getComputedStyle(line).display==='none')return;
      const matrix=line.getScreenCTM(),svg=line.ownerSVGElement;if(!matrix||!svg?.createSVGPoint)return;
      const start=svg.createSVGPoint(),end=svg.createSVGPoint();start.x=Number(line.getAttribute('x1'));start.y=Number(line.getAttribute('y1'));end.x=Number(line.getAttribute('x2'));end.y=Number(line.getAttribute('y2'));
      const distance=distanceToSegment(event.clientX,event.clientY,start.matrixTransform(matrix),end.matrixTransform(matrix));if(distance<best){best=distance;nearest=line}
    });
    return best<=9?nearest:null;
  }
  function interactive(event){
    const root=document.getElementById('skyFoundationRoot');if(!root)return null;
    const node=event.target.closest?.('[data-interactive]');
    if(node&&root.contains(node)){
      if(node.dataset.interactive!=='aspect')return node;
      return nearestAspect(event)||node;
    }
    const wheel=event.target.closest?.('#skyFoundationWheelMount .sky-foundation-wheel');
    if(wheel&&root.contains(event.target))return nearestAspect(event);
    return null;
  }
  function clearableWhitespace(event){
    const root=document.getElementById('skyFoundationRoot'),target=event.target;if(!root?.contains(target))return false;
    if(target.closest?.('button,input,select,textarea,a,label,summary,details,.sky-foundation-relationship-row,#skySelectedRelationship,.sky-chart-filter-bar,.sky-foundation-relationships-heading'))return false;
    return !!target.closest?.('#skyFoundationWheelMount,#skyFoundationA,#skyFoundationB,#skyFoundationComparison');
  }
  function clearSelectionMarks(){document.querySelectorAll('.sky-foundation-relationship-row[aria-current]').forEach(row=>row.removeAttribute('aria-current'));document.querySelectorAll('.sky-foundation-aspect[data-selected-relation]').forEach(line=>delete line.dataset.selectedRelation)}
  function clearFromWhitespace(){
    lockedState=null;hoverState=null;rowLockedState=null;rowHoverState=null;const root=document.getElementById('skyFoundationRoot');if(root)root.dataset.relationshipSelectionCleared='true';applyState();clearSelectionMarks();
    selectionClearObserver?.disconnect();selectionClearObserver=new MutationObserver(()=>{if(root?.dataset.relationshipSelectionCleared==='true')clearSelectionMarks();else{selectionClearObserver.disconnect();selectionClearObserver=null}});if(root)selectionClearObserver.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-current','data-selected-relation']});
    window.dispatchEvent(new CustomEvent('relphi:sky-foundation-clear-selection',{detail:{source:'white-space'}}));requestAnimationFrame(clearSelectionMarks)
  }
  function bind(){
    const root=document.getElementById('skyFoundationRoot');if(!root||root.dataset.foundationInteractionsV2Bound==='true')return;root.dataset.foundationInteractionsV2Bound='true';
    root.addEventListener('pointerover',event=>{
      const row=event.target.closest?.('.sky-foundation-relationship-row[data-relation-index]');
      if(row){
        if(!intraskyRow(row))return;
        if(lockedState||rowLockedState||row.contains(event.relatedTarget))return;
        rowHoverState=rowWheelState(row);hoverState=null;applyState();return;
      }
      if(lockedState)return;
      const node=interactive(event);if(!node||node.contains(event.relatedTarget))return;
      rowHoverState=null;hoverState=specFrom(node);applyState()
    });
    root.addEventListener('pointermove',event=>{if(lockedState||!event.target.closest?.('#skyFoundationWheelMount'))return;const direct=event.target.closest?.('[data-interactive]:not([data-interactive="aspect"])');if(direct)return;rowHoverState=null;const next=specFrom(nearestAspect(event));if(same(hoverState,next)||(!hoverState&&!next))return;hoverState=next;applyState()});
    root.addEventListener('pointerout',event=>{
      const row=event.target.closest?.('.sky-foundation-relationship-row[data-relation-index]');
      if(row){
        if(!intraskyRow(row))return;
        if(lockedState||rowLockedState||row.contains(event.relatedTarget))return;
        rowHoverState=null;applyState();return;
      }
      if(lockedState)return;
      const node=interactive(event);if(!node||node.contains(event.relatedTarget))return;hoverState=null;applyState()
    });
    root.addEventListener('focusin',event=>{
      const row=event.target.closest?.('.sky-foundation-relationship-row[data-relation-index]');
      if(row){if(!intraskyRow(row))return;if(!lockedState&&!rowLockedState){rowHoverState=rowWheelState(row);hoverState=null;applyState()}return}
      if(lockedState)return;const node=interactive(event);if(!node)return;rowHoverState=null;hoverState=specFrom(node);applyState()
    });
    root.addEventListener('focusout',event=>{
      const row=event.target.closest?.('.sky-foundation-relationship-row[data-relation-index]');
      if(row){if(!intraskyRow(row))return;if(!lockedState&&!rowLockedState&&!row.contains(event.relatedTarget)){rowHoverState=null;applyState()}return}
      if(lockedState)return;const node=interactive(event);if(!node||node.contains(event.relatedTarget))return;hoverState=null;applyState()
    });
    root.addEventListener('click',event=>{
      const row=event.target.closest?.('.sky-foundation-relationship-row[data-relation-index]');
      if(row){
        if(!intraskyRow(row))return;
        const next=rowWheelState(row);
        lockedState=null;hoverState=null;rowHoverState=null;rowLockedState=sameRowState(rowLockedState,next)?null:next;applyState();return;
      }
      const node=interactive(event);if(node){event.preventDefault();rowLockedState=null;rowHoverState=null;const next=specFrom(node);lockedState=same(lockedState,next)?null:next;hoverState=null;applyState();return}if(clearableWhitespace(event))clearFromWhitespace()
    });
    root.addEventListener('keydown',event=>{if(event.key==='Escape'){clearFromWhitespace();return}if(event.target.closest('.sky-foundation-relationship-row'))return;if(!['Enter',' '].includes(event.key))return;const node=interactive(event);if(!node)return;event.preventDefault();rowLockedState=null;rowHoverState=null;const next=specFrom(node);lockedState=same(lockedState,next)?null:next;hoverState=null;applyState()});
  }
  function whereWhenEditing(){return document.documentElement.dataset.skyWhereWhenEditing==='true'}
  async function refresh(){
    refreshQueued=false;if(whereWhenEditing())return;const root=document.getElementById('skyFoundationRoot'),wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');if(!root||!wheel||root.getAttribute('aria-busy')!=='false'||!HARMONIC)return;ensurePanel();
    const preparedA=prepare(read(KEYS.A),'A'),preparedB=prepare(read(KEYS.B),'B'),relations=relationships(preparedA.list,preparedB.list),nextSignature=relationshipSignature(relations);current={listA:preparedA.list,listB:preparedB.list,relations,cuspsA:preparedA.houseCusps,cuspsB:preparedB.houseCusps};
    annotateHouseLayer('a-houses','A');annotateHouseLayer('b-houses','B');annotateSigns();annotatePlacements(current.listA,current.listB);annotateAspects(relations);annotateLedger('A',current.listA);annotateLedger('B',current.listB);
    if(renderedRelationshipSignature!==nextSignature||!relationshipRowsIntact(relations)){await renderRows(relations);renderedRelationshipSignature=nextSignature}
    bind();applyState();window.dispatchEvent(new Event('relphi:sky-foundation-interactions-ready'));
  }
  function schedule(){if(refreshQueued)return;refreshQueued=true;requestAnimationFrame(refresh)}
  function start(){window.addEventListener('relphi:sky-foundation-ready',schedule);window.addEventListener('relphi:sky-orb-limit-changed',schedule);if(document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy')==='false')schedule()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();