// Sky Chart interaction controller v6: ownership-aware wheel focus plus filter-reactive locked isolation.
// A locked wheel selection is recomputed whenever relationship eligibility changes, so stale endpoints cannot remain illuminated.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyFoundationInteractionsV6)return;
  window.__relphiSkyFoundationInteractionsV2=true;
  window.__relphiSkyFoundationInteractionsV3=true;
  window.__relphiSkyFoundationInteractionsV4=true;
  window.__relphiSkyFoundationInteractionsV5=true;
  window.__relphiSkyFoundationInteractionsV6=true;

  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const SIGN_NAMES=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ORDER=['sun','moon','asc','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','north-node','south-node','chiron','lilith','part-of-fortune','vertex','anti-vertex','mc','ic','dsc'];
  const HARMONIC=window.RelphiHarmonicOrb;
  const ASPECTS=HARMONIC?.aspects||[];
  const ALIASES={rising:'asc',ascendant:'asc',asc:'asc',ac:'asc',descendant:'dsc',dsc:'dsc',dc:'dsc',midheaven:'mc',mc:'mc','imum coeli':'ic',imumcoeli:'ic',ic:'ic',vertex:'vertex',vx:'vertex','anti vertex':'anti-vertex','anti-vertex':'anti-vertex',antivertex:'anti-vertex',avx:'anti-vertex','north node':'north-node',node:'north-node','true node':'north-node','mean node':'north-node','south node':'south-node',chiron:'chiron',lilith:'lilith','black moon lilith':'lilith',fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune'};

  let lockedState=null,hoverState=null,rowLockedState=null,rowHoverState=null,selectionOrigin=null,refreshQueued=false,selectionClearObserver=null,renderedRelationshipSignature=null,wheelOnlyExternal=false;
  let current={listA:[],listB:[],relations:[],cuspsA:[],cuspsB:[]};

  const norm=value=>((Number(value)%360)+360)%360;
  const separation=(a,b)=>Math.abs(((a-b+180)%360+360)%360-180);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  function read(key){try{return JSON.parse(window.RelphiSkyWorkingStorage.getItem(key)||'null')}catch(_){return null}}
  function source(payload){
    if(!payload||typeof payload!=='object')return[];
    const known=[payload.placements,payload.positions,payload.points,payload.bodies].find(value=>value&&typeof value==='object'),value=known||payload;
    if(Array.isArray(value))return value.map((item,index)=>[String(item?.name||item?.label||item?.id||index),item]);
    return Object.entries(value).filter(([key,item])=>item&&typeof item==='object'&&!Array.isArray(item)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key)&&(Number.isFinite(Number(item.longitude))||item.sign||item.zodiac));
  }
  function longitude(item){return window.RelphiSkyCoordinatePrecision.longitude(item)}
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
  function prepare(payload,slot){const list=records(payload),timeUnknown=profile(payload).timeUnknown===true,houseCusps=timeUnknown?[]:cusps(payload,list);list.forEach(record=>{record.sky=slot;record.sign=Math.floor(record.value/30);record.house=timeUnknown?null:houseFor(record.value,houseCusps)});return{list,houseCusps,timeUnknown}}
  function relationships(listA,listB){
    const result=[],windowValue=HARMONIC?.windowFromControl?.()??10;
    listA.forEach(left=>listB.forEach(right=>{
      const distance=separation(left.value,right.value);
      ASPECTS.forEach(aspect=>{const relation=HARMONIC?.relation?.(left,right,aspect,distance,windowValue);if(relation)result.push(relation)})
    }));
    // By-sign relationships are distinct from harmonic-degree matches.
    // Include sign-only pairs even if their phase error exceeds the maximum window.
    const bySign=window.RelphiSkyBySign;
    if(bySign?.selected?.size){
      const existing=new Set(result.map(r=>`${r.left.id}|${r.aspect.id}|${r.right.id}`));
      listA.forEach(left=>listB.forEach(right=>{
        const distance=separation(left.value,right.value);
        const steps=Math.min((left.sign-right.sign+12)%12,(right.sign-left.sign+12)%12);
        ASPECTS.forEach(aspect=>{
          if(!bySign.enabled(aspect.id)||bySign.steps[aspect.id]!==steps)return;
          const key=`${left.id}|${aspect.id}|${right.id}`;
          if(existing.has(key))return;
          const metrics=HARMONIC?.metrics?.(distance,aspect,12);
          if(!metrics)return;
          result.push({left,right,aspect,distance,orb:metrics.ordinaryOrb,...metrics,
            temporal:HARMONIC.motion(metrics,left.angularVelocity,right.angularVelocity),bySignOnly:true});
          existing.add(key);
        });
      }));
    }
    return result.sort((a,b)=>a.phaseError-b.phaseError||a.harmonicOrder-b.harmonicOrder||a.orb-b.orb);
  }
  function learnAsc(){return window.RelphiSkyStartupMode?.readLearnAscendant?.()||0}
  function learnSignContext(index){
    if(!Number.isInteger(index)||index<0||index>11)return null;
    const name=SIGN_NAMES[index],house=(index-learnAsc()+12)%12+1,source=window.RELPHI_RISING_SIGN_HOUSE_OFFSET_EFFECTS;
    const entry=source?.entries?.find(item=>item.sign===name&&Number(item.houseNumber)===house);
    const ingredients=source?.signIngredients?.[name];if(!entry||!ingredients)return null;
    const tarot=(window.RELPHI_TAROT_CARDS||[]).find(item=>item.arcana==='Major'&&String(item.astrology?.sign||'').split(',').map(x=>x.trim()).includes(name));
    return {index,name,house,ruler:ingredients.ruler,modality:ingredients.modality,element:ingredients.element,polarity:['fire','air'].includes(ingredients.element)?'masculine':'feminine',structure:ingredients.structure||ingredients.modality+' '+ingredients.element,field:entry.ingredients.houseField,description:entry.description,card:tarot?{id:tarot.card_id,title:tarot.name,image:'assets/tarot/rws-export/'+tarot.card_id+'.webp'}:null};
  }
  function learnSignForState(state){
    if(!state)return null;
    if(state.kind==='sign')return Number(state.value);
    if(state.kind==='house')return (learnAsc()+Number(state.value)-1)%12;
    if(state.kind==='aspect'){const rel=current.relations.find(r=>r.learn&&('A:'+r.left.id+'|'+r.aspect.id+'|B:'+r.right.id)===state.value);if(rel)return [rel.left.sign,rel.right.sign].includes(state.learnAnchor)?state.learnAnchor:rel.left.sign}
    return null;
  }
  function learnPairContext(left,right){
    const a=learnSignContext(left),b=learnSignContext(right);if(!a||!b)return null;
    const selected=learnSignForState(lockedState),first=selected===right?b:a,second=first===a?b:a;
    const planet=c=>['Sun','Moon'].includes(c.ruler)?'the '+c.ruler:c.ruler;
    const field=c=>c.house===12?'hidden things':c.house===9?'belief, travel, study, and law':c.field;
    const sentence="While "+planet(first)+"'s affairs of "+first.structure+" concern "+field(first)+", "+planet(second)+" in "+second.structure+" has jurisdiction over "+field(second)+".";
    return {left:a,right:b,sentence,modality:a.modality===b.modality?'Same':'Different',polarity:a.polarity===b.polarity?'Same':'Different',element:a.element===b.element?'Same':'Different',adjacent:[1,11].includes(Math.abs(left-right))?'Yes':'No'};
  }
  function updateLearnCore(state){
    const mount=document.getElementById('skyFoundationWheelMount');if(!mount)return;
    let core=document.getElementById('skyFoundationLearnCore');
    const active=window.RelphiSkyStartupMode?.readMode?.()==='learn';
    if(!active){if(core)core.hidden=true;return}
    if(!core){
      core=document.createElement('section');core.id='skyFoundationLearnCore';core.className='sky-foundation-panel';core.setAttribute('aria-label','Sky Card Core');
      core.innerHTML='<header><h2>Sky Card Core</h2></header><div class="sky-card-hits-structure-tabs sky-core-tabs" role="tablist" aria-label="Core views"><button type="button" class="sky-card-hits-structure-tab" data-core-tab="houses" role="tab" aria-selected="true">Houses</button><button type="button" class="sky-card-hits-structure-tab" data-core-tab="signs" role="tab" aria-selected="false">Signs</button><button type="button" class="sky-card-hits-structure-tab" data-core-tab="rulers" role="tab" aria-selected="false">Rulers</button><button type="button" class="sky-card-hits-structure-tab" data-core-tab="vocab" role="tab" aria-selected="false">Vocab</button></div><div data-core-structure class="sky-card-hits-structure"></div><div data-core-prompt>Select a sign or house on the wheel to explore its twelve house manifestations.</div><div data-core-content hidden><div class="sky-learn-core-identity"><div><h3 data-core-title></h3><p data-core-qualities></p><p data-core-description></p></div><a data-core-card><img alt=""><span></span></a></div></div>';
      mount.after(core);
    }
    core.hidden=false;
    const tab=core.dataset.coreActiveTab||'houses',asc=learnAsc(),ruler=state?.kind==='ruler'?state.value:'';
    const structure=core.querySelector('[data-core-structure]'),structureKey=[tab,asc,ruler].join('|');
    const detail=core.querySelector('[data-core-content]'),prompt=core.querySelector('[data-core-prompt]');
    if(structure.dataset.structureKey!==structureKey){
      if(structure.contains(detail))structure.after(detail);
      structure.dataset.structureKey=structureKey;
      core.querySelectorAll('button[data-core-tab]').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.coreTab===tab)));
      if(tab==='vocab')window.RelphiSkyVocab?.renderTemplate?.(structure,asc);
      else window.RelphiSkyCardHitsStructure?.renderTemplate?.(structure,asc,ruler,tab);
    }
    const index=learnSignForState(state),ctx=Number.isInteger(index)?learnSignContext(index):null;
    structure.querySelectorAll('[data-core-select-sign]').forEach(tile=>{const selected=Number(tile.dataset.coreSelectSign)===index;tile.classList.toggle('is-selected',selected);tile.setAttribute('aria-pressed',String(selected))});
    const selectedTile=(tab==='houses'||tab==='signs')&&ctx?structure.querySelector('[data-core-select-sign="'+index+'"]'):null;
    if(selectedTile){
      if(selectedTile.nextElementSibling!==detail)selectedTile.after(detail);
    }else if(structure.contains(detail))structure.after(detail);
    structure.querySelectorAll('[data-core-select-sign]').forEach(tile=>tile.setAttribute('aria-expanded',String(tile===selectedTile)));
    prompt.hidden=!!ctx;detail.hidden=!ctx;
    if(!ctx){delete core.dataset.coreSign;delete core.dataset.coreHouse;return}
    if(core.dataset.coreSign===String(index)&&core.dataset.coreHouse===String(ctx.house))return;
    core.dataset.coreSign=String(index);core.dataset.coreHouse=String(ctx.house);
    const title=core.querySelector('[data-core-title]'),shared=window.RelphiSkyCardHitsStructure;
    title.innerHTML=(shared?.glyphMarkup(index)||'')+' '+ctx.name+' in House '+(shared?.houseMedallionMarkup(ctx.house)||ctx.house);
    shared?.hydrateCanonicalGlyphs(title);shared?.hydrateHouseMedallions(title);
    core.querySelector('[data-core-qualities]').textContent=ctx.ruler+' · '+ctx.structure+' · '+ctx.polarity;
    core.querySelector('[data-core-description]').textContent=ctx.description;
    const link=core.querySelector('[data-core-card]');link.hidden=!ctx.card;
    if(ctx.card){link.dataset.inlineLedger=ctx.card.id;link.href='tarot.html?card='+encodeURIComponent(ctx.card.id);link.querySelector('img').src=ctx.card.image;link.querySelector('img').alt=ctx.card.title;link.querySelector('span').textContent=ctx.card.title}
  }
  function templateRelationships(){
    const aspectsByStep=['','semi-sextile','sextile','square','trine','quincunx','opposition'];
    const aspectById=new Map(ASPECTS.map(aspect=>[aspect.id,aspect]));
    const registry=window.RelphiGlyphRegistry;
    const signs=SIGN_NAMES.map((name,index)=>{
      const entry=registry?.resolve?.(name)||registry?.get?.(name.toLowerCase())||{id:name.toLowerCase(),name};
      return{id:name.toLowerCase(),entry:{...entry,name},value:index*30+15,sign:index,sky:'A',house:(index-learnAsc()+12)%12+1};
    });
    const relations=[];
    for(let i=0;i<12;i++)for(let j=i+1;j<12;j++){
      const steps=Math.min(j-i,12-(j-i)),aspect=aspectById.get(aspectsByStep[steps]);
      if(!aspect)continue;
      const left=signs[i],right={...signs[j],sky:'B'};
      const angle=steps*30;
      const harmonicOrder=aspect.harmonic||12;
      relations.push({left,right,aspect,distance:angle,orb:0,bySignOnly:true,learn:true,
        harmonicOrder,harmonicNumerator:1,phaseError:0,signedPhaseError:0,
        masterWindow:12,windowFraction:0,coherence:1,coherencePercent:100});
    }
    return relations;
  }
  function relationshipSignature(relations){
    return relations.map(relation=>[
      relation.left.id,relation.aspect.id,relation.right.id,relation.orb.toFixed(6),
      relation.harmonicOrder,relation.harmonicNumerator,relation.phaseError.toFixed(6),relation.bySignOnly?'sign':'degree',
      relation.signedPhaseError.toFixed(6),relation.masterWindow.toFixed(6),
      Number.isFinite(relation.windowFraction)?relation.windowFraction.toFixed(6):String(relation.windowFraction),
      relation.coherence.toFixed(8),relation.left.house,relation.right.house,relation.left.sign,relation.right.sign
    ].join('|')).join(';');
  }
  function relationshipRowsIntact(relations){
    const list=document.getElementById('skyFoundationRelationshipList');if(!list)return false;
    const rows=[...list.children].filter(node=>node.classList?.contains('sky-foundation-relationship-row')&&
      String(node.dataset.relationshipMode||'A-B').toUpperCase()==='A-B');
    if(rows.length!==relations.length)return false;
    const asc=Number(document.documentElement.dataset.skyLearnAscendant||0);
    const identity=(left,aspect,right)=>left+'|'+aspect+'|'+right;
    const byIdentity=new Map(rows.map(row=>[identity(row.dataset.leftPlacement,row.dataset.aspect,row.dataset.rightPlacement),row]));
    if(byIdentity.size!==rows.length)return false;
    return relations.every(relation=>{
      const row=byIdentity.get(identity(relation.left.id,relation.aspect.id,relation.right.id));
      if(!row||Number(row.dataset.sourceOrb).toFixed(6)!==relation.orb.toFixed(6))return false;
      const houseLeft=relation.learn?(relation.left.sign-asc+12)%12+1:relation.left.house;
      const houseRight=relation.learn?(relation.right.sign-asc+12)%12+1:relation.right.house;
      return (row.dataset.leftHouse==null?null:Number(row.dataset.leftHouse))===houseLeft&&
        (row.dataset.rightHouse==null?null:Number(row.dataset.rightHouse))===houseRight;
    });
  }
    function coordinate(record){const p=window.RelphiSkyCoordinatePrecision.format(record.value);return{sign:p.signIndex,text:p.text}}

  function ensurePanel(){
    let panel=document.getElementById('skyFoundationRelationships');if(panel)return panel;
    const comparison=document.getElementById('skyFoundationComparison');if(!comparison)return null;
    panel=document.createElement('section');panel.id='skyFoundationRelationships';panel.setAttribute('aria-label','Filtered relationships');panel.innerHTML='<header class="sky-foundation-relationships-heading"><h2>Relationships</h2><span id="skyFoundationRelationshipCount">0/0</span><button id="skyFoundationClearIsolation" type="button" hidden>Clear</button></header><div id="skyFoundationRelationshipList"></div><p id="skyFoundationRelationshipEmpty" hidden>No relationships involve this selection.</p>';comparison.appendChild(panel);
    panel.querySelector('#skyFoundationClearIsolation').addEventListener('click',event=>{event.preventDefault();event.stopPropagation();lockedState=null;hoverState=null;rowLockedState=null;rowHoverState=null;selectionOrigin=null;applyState()});return panel;
  }
  function glyphSlot(role,label){
    const slot=document.createElement('span');
    slot.className='sky-foundation-relationship-glyph sky-foundation-relationship-glyph--'+role;
    slot.dataset.glyphRole=role;
    slot.setAttribute('aria-label',label);
    return slot;
  }
  function sourceHouseCoordinate(small,coordinateValue,house,field){
    const marker=window.RelphiHouseMedallion?.decorateCoordinate?.(small,coordinateValue,house,field,false);
    if(!marker)throw new Error('House medallion source primitive is unavailable.');
  }
  async function renderRows(relations){
    const list=document.getElementById('skyFoundationRelationshipList'),count=document.getElementById('skyFoundationRelationshipCount');if(!list||!count)return;
    const selectionCleared=document.getElementById('skyFoundationRoot')?.dataset.relationshipSelectionCleared==='true',selected=selectionCleared?null:document.querySelector('.sky-foundation-relationship-row[aria-current="true"]');const selectedKey=selected?[selected.dataset.leftPlacement,selected.dataset.aspect,selected.dataset.rightPlacement,selected.getAttribute('aria-label')].join('|'):'';
    const expanded=window.RelphiInlineRelationship?.selected?.();const expandedKey=expanded?.dataset.learnRelationship==='true'?relationshipIdentity(expanded):'';
    list.replaceChildren();count.textContent=relations.length+'/'+relations.length;count.dataset.total=String(relations.length);
    relations.forEach((relation,index)=>{
      const left=coordinate(relation.left),right=coordinate(relation.right),row=document.createElement('button');
      const ascIndex=Number(document.documentElement.dataset.skyLearnAscendant||0);
      const learnHouses=relation.learn?{left:(relation.left.sign-ascIndex+12)%12+1,right:(relation.right.sign-ascIndex+12)%12+1}:null;row.type='button';row.className='sky-foundation-relationship-row';row.dataset.relationshipSelection='true';row.dataset.relationIndex=String(index);row.dataset.relationshipMode='A-B';row.dataset.relationScope='inter';row.dataset.leftSky='A';row.dataset.rightSky='B';row.dataset.aspect=relation.aspect.id;if(relation.learn)row.dataset.learnRelationship='true';if(relation.bySignOnly)row.dataset.bySignOnly='true';row.dataset.leftPlacement=relation.left.id;row.dataset.rightPlacement=relation.right.id;row.dataset.sourceOrb=relation.orb.toFixed(6);row.dataset.harmonicOrder=String(relation.harmonicOrder);row.dataset.harmonicNumerator=String(relation.harmonicNumerator);row.dataset.phaseError=relation.phaseError.toFixed(6);row.dataset.signedPhaseError=relation.signedPhaseError.toFixed(6);row.dataset.harmonicWindow=relation.masterWindow.toFixed(6);row.dataset.windowFraction=Number.isFinite(relation.windowFraction)?relation.windowFraction.toFixed(6):String(relation.windowFraction);row.dataset.harmonicCoherence=relation.coherence.toFixed(8);if(relation.learn){row.dataset.leftHouse=String(learnHouses.left);row.dataset.rightHouse=String(learnHouses.right);}else{if(relation.left.house!=null)row.dataset.leftHouse=String(relation.left.house);if(relation.right.house!=null)row.dataset.rightHouse=String(relation.right.house);}row.dataset.leftSign=String(left.sign);row.dataset.rightSign=String(right.sign);row.setAttribute('aria-label',relation.learn?relation.left.entry.name+' '+relation.aspect.id+' '+relation.right.entry.name:relation.left.entry.name+' '+relation.aspect.id+' '+relation.right.entry.name+(relation.bySignOnly?', by sign':', orb '+relation.orb.toFixed(2)+' degrees, harmonic '+relation.harmonicOrder+', phase error '+relation.phaseError.toFixed(2)+' degrees, coherence '+relation.coherencePercent.toFixed(0)+' percent'));
      const leftGlyph=glyphSlot('left',relation.left.entry.name),aspectGlyph=glyphSlot('aspect',relation.aspect.id),rightGlyph=glyphSlot('right',relation.right.entry.name),leftCopy=document.createElement('span'),rightCopy=document.createElement('span'),leftMeta=document.createElement('small'),rightMeta=document.createElement('small');
      leftCopy.className=rightCopy.className='sky-foundation-relationship-copy';
      leftCopy.append(document.createTextNode(relation.left.entry.name),leftMeta);rightCopy.append(document.createTextNode(relation.right.entry.name),rightMeta);
      if(relation.learn){sourceHouseCoordinate(leftMeta,'House',learnHouses.left,'left-house');sourceHouseCoordinate(rightMeta,'House',learnHouses.right,'right-house')}else{if(relation.left.house!=null)sourceHouseCoordinate(leftMeta,left.text,relation.left.house,'left-house');else leftMeta.textContent=left.text;if(relation.right.house!=null)sourceHouseCoordinate(rightMeta,right.text,relation.right.house,'right-house');else rightMeta.textContent=right.text;}
      row.append(leftGlyph,leftCopy,aspectGlyph,rightGlyph,rightCopy);list.appendChild(row);
      const key=[row.dataset.leftPlacement,row.dataset.aspect,row.dataset.rightPlacement,row.getAttribute('aria-label')].join('|');if(key===selectedKey)row.setAttribute('aria-current','true');
    });
    if(expandedKey){const replacement=[...list.querySelectorAll('[data-learn-relationship="true"]')].find(row=>relationshipIdentity(row)===expandedKey);if(replacement)window.RelphiInlineRelationship?.expand?.(replacement)}
  }
  function annotateHouseLayer(layerName,slot){const layer=document.querySelector(`[data-layer="${layerName}"]`);if(!layer)return;Array.from(layer.children).filter(node=>node.tagName?.toLowerCase()==='path').forEach((node,index)=>{node.classList.add('sky-foundation-interactive','sky-foundation-house-sector');Object.assign(node.dataset,{interactive:'house',focusPiece:'house',sky:slot,house:String(index+1)});node.setAttribute('tabindex','0');node.setAttribute('role','button');node.setAttribute('aria-label',window.RelphiSkyStartupMode?.readMode?.()==='learn'?`House ${index+1}`:`Sky ${slot} house ${index+1}`)})}
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
        line.dataset.interactive='aspect';line.dataset.focusPiece='aspect';line.style.removeProperty('pointer-events');
        return;
      }
      const index=indexes.get(relationKey(line.dataset.leftPlacement,line.dataset.aspect,line.dataset.rightPlacement,line.dataset.orb)),relation=relations[index];
      if(!relation){delete line.dataset.relationIndex;return}
      line.classList.add('sky-foundation-interactive','sky-foundation-aspect');
      Object.assign(line.dataset,{interactive:'aspect',focusPiece:'aspect',relationIndex:String(index),relationshipMode:'A-B',leftSky:'A',rightSky:'B',aspect:relation.aspect.id,leftPlacement:relation.left.id,rightPlacement:relation.right.id,leftHouse:relation.left.house==null?'':String(relation.left.house),rightHouse:relation.right.house==null?'':String(relation.right.house),leftSign:String(relation.left.sign),rightSign:String(relation.right.sign),harmonicOrder:String(relation.harmonicOrder),harmonicNumerator:String(relation.harmonicNumerator),phaseError:relation.phaseError.toFixed(6),harmonicCoherence:relation.coherence.toFixed(8)});
      line.setAttribute('tabindex','0');line.setAttribute('role','button');line.setAttribute('aria-label',relation.learn?`${relation.left.entry.name} ${relation.aspect.id} ${relation.right.entry.name}, by sign`:`Sky A ${relation.left.entry.name} ${relation.aspect.id} Sky B ${relation.right.entry.name}, harmonic ${relation.harmonicOrder}, phase error ${relation.phaseError.toFixed(2)} degrees`);line.style.removeProperty('pointer-events')
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

  function relationshipSlots(node){
    const left=String(node?.dataset?.leftSky||'').toUpperCase(),right=String(node?.dataset?.rightSky||'').toUpperCase(),mode=String(node?.dataset?.relationshipMode||'').toUpperCase();
    return{left:left==='A'||left==='B'?left:mode==='B-B'?'B':'A',right:right==='A'||right==='B'?right:mode==='A-A'?'A':'B'}
  }
  function relationshipIdentity(node){
    if(!node)return'';
    const slots=relationshipSlots(node),left=String(node.dataset.leftPlacement||''),aspect=String(node.dataset.aspect||''),right=String(node.dataset.rightPlacement||'');
    if(!left||!aspect||!right)return'';
    // Intrasky relationships are undirected: a row may enumerate the same two
    // points in reverse order from its rendered aspect line.
    if(slots.left===slots.right){const [first,second]=[left,right].sort();return `${slots.left}:${first}|${aspect}|${slots.right}:${second}`;}
    return `${slots.left}:${left}|${aspect}|${slots.right}:${right}`
  }
  function specFrom(node){const kind=node?.dataset?.interactive;if(kind==='house')return{kind,sky:node.dataset.sky,value:Number(node.dataset.house)};if(kind==='sign')return{kind,sky:null,value:Number(node.dataset.sign)};if(kind==='placement')return{kind,sky:node.dataset.sky,value:node.dataset.placement};if(kind==='aspect')return{kind,sky:null,value:relationshipIdentity(node)};return null}
  function selectionLabel(spec){
    if(!spec)return'';
    if(spec.kind==='placement'){
      const list=spec.sky==='A'?current.listA:current.listB;
      return String(list.find(record=>record.id===spec.value)?.entry?.name||spec.value||'');
    }
    if(spec.kind==='sign')return SIGN_NAMES[Number(spec.value)]||'';
    if(spec.kind==='house')return 'House '+String(spec.value||'');
    if(spec.kind==='aspect')return String(spec.value||'');
    return String(spec.value||'');
  }
  function selectionSource(node){
    if(node?.closest?.('#skyFoundationLearnCore'))return'Sky Card Core';
    if(node?.closest?.('.sky-foundation-row[data-placement]'))return'Placements';
    if(node?.closest?.('#skyFoundationWheelMount'))return'Zodiac Wheel';
    if(node?.closest?.('[data-sky-vocab-panel]'))return'Vocab';
    return'Sky Chart';
  }
  function originFromNode(node,spec){
    if(!spec)return null;
    return Object.freeze({
      kind:spec.kind,
      sky:spec.sky||null,
      value:spec.value,
      label:selectionLabel(spec),
      source:selectionSource(node)
    });
  }
  function originFromExternal(raw,spec){
    if(!spec)return null;
    const supplied=raw?.origin&&typeof raw.origin==='object'?raw.origin:{};
    return Object.freeze({
      kind:spec.kind,
      sky:spec.sky||null,
      value:spec.value,
      label:String(supplied.label||raw?.label||selectionLabel(spec)||''),
      source:String(supplied.source||raw?.source||'External')
    });
  }
  function same(a,b){return!!a&&!!b&&a.kind===b.kind&&a.sky===b.sky&&a.value===b.value}
  function relationMatches(relation,index,state){if(!state)return true;if(state.kind==='aspect')return String(index)===String(state.value);if(state.kind==='sign')return relation.left.sign===state.value||relation.right.sign===state.value;if(state.kind==='house')return state.sky==='A'?relation.left.house===state.value:relation.right.house===state.value;if(state.kind==='placement')return state.sky==='A'?relation.left.id===state.value:relation.right.id===state.value;return true}
  function arcsOverlap(start,span,targetStart,targetSpan){const samples=[start,norm(start+span-.0001),targetStart,norm(targetStart+targetSpan-.0001)];const inside=(value,arcStart,arcSpan)=>norm(value-arcStart)<arcSpan;return samples.some((value,index)=>index<2?inside(value,targetStart,targetSpan):inside(value,start,span))}
  function housesForSign(houseCusps,sign){const result=[];const targetStart=sign*30;houseCusps.forEach((start,index)=>{const span=norm(houseCusps[(index+1)%12]-start)||30;if(arcsOverlap(start,span,targetStart,30))result.push(index+1)});return result}
  const PERSISTENT_HIDDEN_CLASSES=['sky-foundation-single-sky-cross-hidden','sky-chart-filter-hidden','sky-chart-orb-hidden','sky-orb-filter-hidden','sky-chart-multiselect-hidden','sky-chart-house-multiselect-hidden','sky-chart-aspect-multiselect-hidden','sky-chart-sign-filter-hidden','sky-chart-zodiac-filter-hidden','sky-chart-semantic-hidden'];
  function rowSlots(row){return relationshipSlots(row)}
  function rowEligibleForWheel(row){return!PERSISTENT_HIDDEN_CLASSES.some(name=>row.classList.contains(name))}
  // Share house illumination through the comparison ring by zodiac longitude,
  // not by assuming that the two skies have the same house divisions.
  function houseFocusPlacements(state){
    const keys=new Set();
    if(state?.kind!=='house'||!['A','B'].includes(state.sky))return keys;
    const house=Number(state.value),cusps=state.sky==='A'?current.cuspsA:current.cuspsB;
    if(!Number.isInteger(house)||house<1||house>12||cusps.length!==12)return keys;
    const own=state.sky==='A'?current.listA:current.listB;
    const other=state.sky==='A'?current.listB:current.listA;
    own.filter(record=>record.house===house).forEach(record=>keys.add(`${record.sky}:${record.id}`));
    const start=cusps[house-1],span=norm(cusps[house%12]-start)||30;
    other.forEach(record=>{
      if(norm(record.value-start)<span)keys.add(`${record.sky}:${record.id}`);
    });
    return keys;
  }
  function rowMatchesState(row,state,houseKeys){
    if(!state)return true;
    const slots=rowSlots(row);
    if(state.kind==='aspect')return relationshipIdentity(row)===String(state.value);
    if(state.kind==='ruler'){const signs=window.RelphiSkyCardHitsStructure?.templateRulerSigns(state.value)||[];return signs.includes(Number(row.dataset.leftSign))||signs.includes(Number(row.dataset.rightSign))}
    if(state.kind==='sign')return Number(row.dataset.leftSign)===state.value||Number(row.dataset.rightSign)===state.value;
    if(state.kind==='house'&&window.RelphiSkyStartupMode?.readMode?.()==='learn'){
      const asc=Number(document.documentElement.dataset.skyLearnAscendant||0);
      const sign=(asc+Number(state.value)-1)%12;
      return Number(row.dataset.leftSign)===sign||Number(row.dataset.rightSign)===sign;
    }
    if(state.kind==='house')return (slots.left===state.sky&&Number(row.dataset.leftHouse)===state.value)||
      (slots.right===state.sky&&Number(row.dataset.rightHouse)===state.value)||
      !!houseKeys?.has(`${slots.left}:${row.dataset.leftPlacement}`)||
      !!houseKeys?.has(`${slots.right}:${row.dataset.rightPlacement}`);
    if(state.kind==='placement')return(slots.left===state.sky&&row.dataset.leftPlacement===state.value)||(slots.right===state.sky&&row.dataset.rightPlacement===state.value);
    return true;
  }
  function keepSets(state){
    const matched=new Set(),relationships=new Set(),placements=new Set(),houses=new Set(),signs=new Set();
    const houseKeys=houseFocusPlacements(state);
    document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]').forEach(row=>{
      if(!rowEligibleForWheel(row)||!rowMatchesState(row,state,houseKeys))return;
      const slots=rowSlots(row),index=String(row.dataset.relationIndex||''),identity=relationshipIdentity(row);if(index)matched.add(index);if(identity)relationships.add(identity);
      if(row.dataset.leftPlacement)placements.add(`${slots.left}:${row.dataset.leftPlacement}`);
      if(row.dataset.rightPlacement)placements.add(`${slots.right}:${row.dataset.rightPlacement}`);
      if(row.dataset.leftHouse)houses.add(`${slots.left}:${row.dataset.leftHouse}`);
      if(row.dataset.rightHouse)houses.add(`${slots.right}:${row.dataset.rightHouse}`);
      if(row.dataset.leftSign!=='')signs.add(Number(row.dataset.leftSign));
      if(row.dataset.rightSign!=='')signs.add(Number(row.dataset.rightSign));
    });
    if(state?.kind==='house'){
      houses.add(`${state.sky}:${state.value}`);
      [...current.listA,...current.listB].forEach(record=>{
        const key=`${record.sky}:${record.id}`;
        if(!houseKeys.has(key))return;
        placements.add(key);
        signs.add(record.sign);
        if(record.house!=null)houses.add(`${record.sky}:${record.house}`);
      });
    }
    if(state?.kind==='sign'){signs.add(state.value);[...current.listA,...current.listB].filter(record=>record.sign===state.value).forEach(record=>placements.add(`${record.sky}:${record.id}`));housesForSign(current.cuspsA,state.value).forEach(house=>houses.add(`A:${house}`));housesForSign(current.cuspsB,state.value).forEach(house=>houses.add(`B:${house}`))}
    if(state?.kind==='placement'){
      placements.add(`${state.sky}:${state.value}`);
      const list=state.sky==='A'?current.listA:current.listB,record=list.find(item=>item.id===state.value);if(record){if(record.house!=null)houses.add(`${state.sky}:${record.house}`);signs.add(record.sign)}
      // Placement hover is a relationship-model operation, not a DOM-order operation.
      // Resolve A↔B counterparts from the canonical relation set, then honor the
      // rendered row's current filter eligibility for that exact relationship.
      const eligible=new Set();
      document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]').forEach(row=>{if(String(row.dataset.relationshipMode||'A-B').toUpperCase()==='A-B'&&rowEligibleForWheel(row))eligible.add(relationshipIdentity(row))});
      current.relations.forEach(relation=>{
        const identity=`A:${relation.left.id}|${relation.aspect.id}|B:${relation.right.id}`;
        if(!eligible.has(identity))return;
        if(state.sky==='A'&&relation.left.id===state.value)placements.add(`B:${relation.right.id}`);
        if(state.sky==='B'&&relation.right.id===state.value)placements.add(`A:${relation.left.id}`);
      });
    }
    // Rendered aspect geometry is the authority for wheel isolation. Relationship
    // rows can be filtered, reordered or temporarily hidden independently of lines.
    // Build the visible endpoints from the actual line being displayed so an
    // isolated aspect never loses its two placements.
    if(state&&(state.kind==='placement'||state.kind==='aspect'||state.kind==='house'||state.kind==='sign')){
      const lineVisible=line=>{
        if(line.hidden||line.style.display==='none')return false;
        const skip=['sky-chart-filter-hidden','sky-chart-orb-hidden','sky-orb-filter-hidden',
          'sky-chart-multiselect-hidden','sky-chart-aspect-multiselect-hidden',
          'sky-chart-house-multiselect-hidden','sky-chart-sign-filter-hidden',
          'sky-chart-semantic-hidden'];
        return !skip.some(name=>line.classList.contains(name));
      };
      document.querySelectorAll('#skyFoundationWheelMount [data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)').forEach(line=>{
        if(!lineVisible(line))return;
        const identity=relationshipIdentity(line),slots=relationshipSlots(line);
        const left=String(line.dataset.leftPlacement||''),right=String(line.dataset.rightPlacement||'');
        if(!left||!right||!identity)return;
        const matches=state.kind==='aspect'?identity===String(state.value):
          state.kind==='house'&&window.RelphiSkyStartupMode?.readMode?.()==='learn'?(()=>{const sign=(Number(document.documentElement.dataset.skyLearnAscendant||0)+Number(state.value)-1)%12;return Number(line.dataset.leftSign)===sign||Number(line.dataset.rightSign)===sign})():
          state.kind==='house'?((slots.left===state.sky&&Number(line.dataset.leftHouse)===state.value)||
            (slots.right===state.sky&&Number(line.dataset.rightHouse)===state.value)||
            houseKeys.has(`${slots.left}:${left}`)||houseKeys.has(`${slots.right}:${right}`)):
          state.kind==='sign'?Number(line.dataset.leftSign)===state.value||Number(line.dataset.rightSign)===state.value:
          ((slots.left===state.sky&&left===state.value)||(slots.right===state.sky&&right===state.value));
        if(!matches)return;
        relationships.add(identity);
        for(const [slot,id,side] of [[slots.left,left,'left'],[slots.right,right,'right']]){
          placements.add(slot+':'+id);
          const house=line.dataset[side+'House'],sign=line.dataset[side+'Sign'];
          if(house!==undefined&&house!=='')houses.add(slot+':'+house);
          if(sign!==undefined&&sign!=='')signs.add(Number(sign));
        }
      });
    }
    if(window.RelphiSkyStartupMode?.readMode?.()==='learn'){
      if(state?.kind==='ruler'){signs.clear();(window.RelphiSkyCardHitsStructure?.templateRulerSigns(state.value)||[]).forEach(sign=>signs.add(sign));}
      houses.clear();
      signs.forEach(sign=>housesForSign(current.cuspsA,sign).forEach(house=>houses.add(`A:${house}`)));
    }
    return{matched,relationships,placements,houses,signs,houseKeys};
  }
  function kept(node,keep){const type=node.dataset.focusPiece;if(type==='aspect')return keep.relationships.has(relationshipIdentity(node));if(type==='house')return keep.houses.has(`${node.dataset.sky}:${node.dataset.house}`);if(type==='sign')return keep.signs.has(Number(node.dataset.sign));if(type==='placement'||type==='leader')return keep.placements.has(`${node.dataset.sky}:${node.dataset.placement}`);return false}
  function matchesNode(node,state){if(!state)return false;const type=node.dataset.interactive;if(state.kind==='aspect')return type==='aspect'&&relationshipIdentity(node)===String(state.value);if(state.kind==='house')return type==='house'&&node.dataset.sky===state.sky&&Number(node.dataset.house)===state.value;if(state.kind==='sign')return type==='sign'&&Number(node.dataset.sign)===state.value;if(state.kind==='placement')return type==='placement'&&node.dataset.sky===state.sky&&node.dataset.placement===state.value;return false}
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
    return relationshipIdentity(node)===state.key;
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
      if(window.RelphiSkyStartupMode?.readMode?.()==='learn')return [state.left.house,state.right.house].includes(Number(node.dataset.house));
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
    const rulerPreview=hoverState?.kind==='ruler'?hoverState:null;
    const focusState=lockedState||(!rowLockedState&&!rulerPreview&&hoverState),aspectFocus=focusState?.kind==='aspect',filterState=aspectFocus?null:focusState,filterKeep=keepSets(focusState),rowState=rowLockedState||rowHoverState,wheelFocus=rulerPreview||focusState,wheelKeep=rulerPreview?keepSets(rulerPreview):filterKeep,wheelState=wheelFocus||rowState,wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
    if(wheel){
      wheel.classList.toggle('has-isolation',!!wheelState);
      wheel.classList.toggle('has-locked-isolation',!!(lockedState||rowLockedState));
      wheel.querySelectorAll('[data-focus-piece]').forEach(node=>{
        const isRowDriven=!wheelFocus&&!!rowState,isKept=!!wheelState&&(isRowDriven?rowKeeps(node,rowState):kept(node,wheelKeep)||!!wheelFocus&&wheelFocus.kind==='aspect'&&matchesNode(node,wheelFocus)),type=node.dataset.focusPiece;
        node.classList.toggle('is-kept',isKept);
        if(type==='aspect')node.setAttribute('tabindex',(!lockedState&&!rowLockedState||isKept)?'0':'-1');
        node.classList.toggle('is-aspect-endpoint',(isRowDriven||aspectFocus)&&isKept&&(type==='placement'||type==='leader'));
        node.classList.toggle('is-selected',!!lockedState&&matchesNode(node,lockedState)||(!filterState&&!!rowLockedState&&rowMarksNode(node,rowLockedState)));
        node.classList.toggle('is-hovered',!!hoverState&&!lockedState&&matchesNode(node,hoverState)||(!filterState&&!rowLockedState&&!!rowHoverState&&rowMarksNode(node,rowHoverState)));
      });
    }
    // A ruler hover previews the wheel only; the click lock owns the expanded
    // tile and the Relationships list, including when previewing another ruler.
    if(rulerPreview)return;
    updateLearnCore(lockedState);
    if(wheelOnlyExternal)return;
    ['A','B'].forEach(slot=>{const panel=document.getElementById(slot==='A'?'skyFoundationA':'skyFoundationB');if(!panel)return;panel.classList.toggle('has-ledger-isolation',!!filterState);panel.querySelectorAll('.sky-foundation-row[data-placement]').forEach(row=>{row.classList.toggle('is-kept',!!filterState&&filterKeep.placements.has(`${slot}:${row.dataset.placement}`));row.classList.toggle('is-selected',!!lockedState&&matchesNode(row,lockedState));row.classList.toggle('is-hovered',!!hoverState&&!lockedState&&matchesNode(row,hoverState))})});
    // A clicked/tapped wheel selection temporarily narrows the Relationships
    // scroll window. Hover is preview-only; never hide tiles while hovering.
    // Preserve source eligibility and DOM rows; clearing the lock restores them.
    document.querySelectorAll('.sky-foundation-relationship-row').forEach(row=>{
      const matches=!filterState||rowMatchesState(row,filterState,filterKeep.houseKeys);
      const temporarilyExcluded=!!lockedState&&!rowMatchesState(row,lockedState,filterKeep.houseKeys);
      row.classList.toggle('is-wheel-dimmed',!!filterState&&!matches);
      row.classList.toggle('is-wheel-selection-excluded',temporarilyExcluded);
      if(rowEligibleForWheel(row)){
        row.hidden=false;
        row.setAttribute('aria-hidden',temporarilyExcluded?'true':'false');
      }
    });
    const allRows=[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]')];
    // This label represents the list the user can actually inspect, not the
    // pre-selection total. Hover is preview-only and never changes the count.
    const visibleCount=allRows.filter(row=>rowEligibleForWheel(row)&&!row.hidden&&
      (!lockedState||!row.classList.contains('is-wheel-selection-excluded'))).length;
    const count=document.getElementById('skyFoundationRelationshipCount'),
      empty=document.getElementById('skyFoundationRelationshipEmpty'),
      clear=document.getElementById('skyFoundationClearIsolation');
    if(count){
      count.textContent=String(visibleCount);
      count.dataset.matchCount=String(visibleCount);
      count.dataset.countLabel='matches';
      count.setAttribute('aria-label',visibleCount+' matching relationships');
    }
    if(empty)empty.hidden=visibleCount!==0;
    if(clear)clear.hidden=!(lockedState||rowLockedState);
    const relationshipIndexes=focusState?.kind==='aspect'?Array.from(filterKeep.matched):filterState?Array.from(filterKeep.matched):allRows.map(row=>String(row.dataset.relationIndex||'')).filter(Boolean);
    window.dispatchEvent(new CustomEvent('relphi:sky-foundation-filter-changed',{detail:{state:focusState?{...focusState,mode:lockedState?'selected':'hover'}:null,origin:lockedState&&selectionOrigin?{...selectionOrigin}:null,relationshipIndexes}}));
  }
  function distanceToSegment(x,y,a,b){const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;if(!length)return Math.hypot(x-a.x,y-a.y);const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/length)),px=a.x+t*dx,py=a.y+t*dy;return Math.hypot(x-px,y-py)}
  // The same eligibility rule governs native SVG hits, nearest-line fallback,
  // keyboard activation and virtual/mobile pointers. Hover is not a lock.
  function aspectInteractive(line){
    if(!line||line.hidden||PERSISTENT_HIDDEN_CLASSES.some(name=>line.classList.contains(name)))return false;
    if((lockedState||rowLockedState)&&!line.classList.contains('is-kept'))return false;
    const style=getComputedStyle(line);
    return style.display!=='none'&&style.visibility!=='hidden'&&style.pointerEvents!=='none';
  }
  function nearestAspect(event){
    if(!Number.isFinite(event.clientX)||!Number.isFinite(event.clientY))return null;
    let nearest=null,best=Infinity;
    document.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)').forEach(line=>{
      if(!aspectInteractive(line))return;
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
      // A struck SVG aspect already identifies its exact endpoints and
      // harmonic. Do not replace it with a geometrically nearby crossing line.
      if(node.dataset.interactive!=='aspect'||aspectInteractive(node))return node;
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
    document.querySelector('.sky-wheel-sector-description')?.setAttribute('hidden','');
    lockedState=null;hoverState=null;rowLockedState=null;rowHoverState=null;selectionOrigin=null;const root=document.getElementById('skyFoundationRoot');if(root)root.dataset.relationshipSelectionCleared='true';applyState();clearSelectionMarks();clearWheelTargets();window.RelphiInlineRelationship?.collapse?.();
    selectionClearObserver?.disconnect();selectionClearObserver=new MutationObserver(()=>{if(root?.dataset.relationshipSelectionCleared==='true')clearSelectionMarks();else{selectionClearObserver.disconnect();selectionClearObserver=null}});if(root)selectionClearObserver.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-current','data-selected-relation']});
    window.dispatchEvent(new CustomEvent('relphi:sky-foundation-clear-selection',{detail:{source:'white-space'}}));requestAnimationFrame(clearSelectionMarks)
  }
  let interactionReapplyQueued=false;
  function reapplyInteractionState(){
    if(interactionReapplyQueued)return;
    interactionReapplyQueued=true;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      interactionReapplyQueued=false;
      if(lockedState||hoverState||rowLockedState||rowHoverState)applyState();
    }));
  }
  function normalizeExternalSpec(spec){
    if(!spec||typeof spec!=='object')return null;
    const kind=String(spec.kind||'');
    if(kind==='placement'){
      const sky=String(spec.sky||'').toUpperCase(),value=String(spec.value||'');
      return(sky==='A'||sky==='B')&&value?{kind,sky,value}:null;
    }
    if(kind==='house'){
      const sky=String(spec.sky||'').toUpperCase(),value=Number(spec.value);
      return(sky==='A'||sky==='B')&&Number.isInteger(value)&&value>=1&&value<=12?{kind,sky,value}:null;
    }
    if(kind==='sign'){
      const value=Number(spec.value);
      return Number.isInteger(value)&&value>=0&&value<12?{kind,sky:null,value}:null;
    }
    return null;
  }
  function previewExternalWheel(spec){
    const next=normalizeExternalSpec(spec);if(!next||lockedState&&!wheelOnlyExternal)return false;
    wheelOnlyExternal=true;rowLockedState=null;rowHoverState=null;hoverState=next;applyState();return true;
  }
  function clearExternalWheelPreview(){
    if(!wheelOnlyExternal||lockedState)return false;
    hoverState=null;rowHoverState=null;applyState();wheelOnlyExternal=false;return true;
  }
  function toggleExternalWheel(spec){
    const next=normalizeExternalSpec(spec);if(!next)return false;
    wheelOnlyExternal=true;rowLockedState=null;rowHoverState=null;
    if(same(lockedState,next)){lockedState=null;selectionOrigin=null}
    else{lockedState=next;selectionOrigin=originFromExternal(spec,next)}
    hoverState=null;applyState();
    if(!lockedState)wheelOnlyExternal=false;
    return!!lockedState;
  }
  function clearExternalWheel(){
    if(!wheelOnlyExternal)return false;
    lockedState=null;hoverState=null;rowLockedState=null;rowHoverState=null;selectionOrigin=null;applyState();wheelOnlyExternal=false;return true;
  }
  function cloneFocusValue(value){return value==null?null:JSON.parse(JSON.stringify(value))}
  function captureFocus(){return Object.freeze({
    lockedState:cloneFocusValue(lockedState),
    rowLockedState:cloneFocusValue(rowLockedState),
    selectionOrigin:cloneFocusValue(selectionOrigin),
    wheelOnlyExternal:!!wheelOnlyExternal
  })}
  function restoreFocus(snapshot){
    if(!snapshot||typeof snapshot!=='object')return false;
    lockedState=cloneFocusValue(snapshot.lockedState);
    rowLockedState=cloneFocusValue(snapshot.rowLockedState);
    selectionOrigin=cloneFocusValue(snapshot.selectionOrigin);
    hoverState=null;rowHoverState=null;wheelOnlyExternal=!!snapshot.wheelOnlyExternal;
    applyState();
    return!!(lockedState||rowLockedState);
  }
  function getSelectionOrigin(){return selectionOrigin?{...selectionOrigin}:null}

  // The mobile pointer uses the same hit-testing, selection and isolation owner
  // as mouse and keyboard. Do not dispatch synthetic mouse/touch events:
  // those would collide with the wheel's gesture adapters.
  function virtualPointerTarget(clientX,clientY){
    if(!Number.isFinite(clientX)||!Number.isFinite(clientY))return null;
    const wheel=document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel');
    if(!wheel)return null;
    const target=document.elementsFromPoint(clientX,clientY).find(node=>wheel.contains(node));
    return target?interactive({target,clientX,clientY}):null;
  }
  function beginVirtualPointer(){
    wheelOnlyExternal=false;
    if(lockedState||rowLockedState){
      lockedState=null;rowLockedState=null;selectionOrigin=null;
      clearWheelTargets();
      window.RelphiInlineRelationship?.collapse?.();
    }
    rowHoverState=null;
    hoverState=null;
    applyState();
    return true;
  }
  function previewVirtualPointer(clientX,clientY){
    const node=virtualPointerTarget(clientX,clientY);
    const next=specFrom(node);
    if(lockedState)return null;
    if(!same(hoverState,next)){
      hoverState=next;
      rowHoverState=null;
      applyState();
      showSectorDescription(node,next);
    }
    return next?{...next}:null;
  }
  function commitVirtualPointer(clientX,clientY){
    const node=virtualPointerTarget(clientX,clientY);
    if(node){
      toggleInteractiveNode(node);
      return specFrom(node);
    }
    hoverState=null;
    applyState();
    showSectorDescription(null,null);
    return null;
  }
  function clearVirtualPointer(){
    if(lockedState)return;
    hoverState=null;
    rowHoverState=null;
    applyState();
    showSectorDescription(null,null);
  }

  window.RelphiSkyFoundationInteractions=Object.freeze({
    beginVirtualPointer,
    previewVirtualPointer,
    commitVirtualPointer,
    clearVirtualPointer,
    previewWheel:previewExternalWheel,
    clearWheelPreview:clearExternalWheelPreview,
    toggleWheel:toggleExternalWheel,
    clearWheel:clearExternalWheel,
    captureFocus,
    restoreFocus,
    getSelectionOrigin,
    learnSignContext,
    learnPairContext,
    // Read-only access to the same resolved geometry that produced the relationship rows.
    relationshipEndpoint(slot,id){
      const list=slot==='B'?current.listB:current.listA;
      const cusps=slot==='B'?current.cuspsB:current.cuspsA;
      const record=list.find(item=>item.id===id);
      if(!record)return null;
      const house=record.house;
      const cusp=house!=null?cusps[house-1]:null;
      const sun=list.find(item=>item.id==='sun');
      const asc=list.find(item=>item.id==='asc');
      const day=cusps.length===12&&sun&&asc?norm(sun.value-asc.value)>=180:null;
      return {longitude:record.value,sign:record.sign,house,cusp:Number.isFinite(cusp)?cusp:null,day};
    },
    syncLearnHouseRing(){
      current.cuspsA=Array.from({length:12},(_,i)=>(learnAsc()*30+i*30)%360);
      annotateHouseLayer('a-houses','A');
      applyState();
    }
  });
  // Wheel-to-Relationships navigation uses endpoint identity rather than a
  // transient list index, so A↔A, B↔B and A↔B survive sorting and filtering.
  function revealSelectedRelationship(spec){
    if(spec?.kind!=='aspect')return;
    const target=String(spec.value||'');
    const locate=()=>[...document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row')]
      .find(row=>relationshipIdentity(row)===target);
    const row=locate();
    if(!row){
      // Intrasky and intersky tiles can finish rendering after the wheel click.
      // Retain the locked selection and resolve it on the next Relationships-ready event.
      return;
    }
    // A focus state must not remove the very tile being navigated to.
    if(!rowEligibleForWheel(row))return;
    window.RelphiInlineRelationship?.expand?.(row);
    row.classList.add('is-wheel-target');
    row.setAttribute('aria-current','true');
    row.classList.add('is-selected');
    document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row').forEach(other=>{
      if(other!==row){other.classList.remove('is-wheel-target','is-selected');other.removeAttribute('aria-current')}
    });
    // Scroll only the Relationships list; scrollIntoView would move the entire page and wheel.
    const list=document.getElementById('skyFoundationRelationshipList');
    if(list){
      const itemRect=row.getBoundingClientRect(),panelRect=list.getBoundingClientRect();
      const delta=(itemRect.top+itemRect.height/2)-(panelRect.top+panelRect.height/2);
      list.scrollTo({top:list.scrollTop+delta,behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    }
  }
  function clearWheelTargets(){
    document.querySelectorAll('#skyFoundationRelationshipList > .sky-foundation-relationship-row.is-wheel-target').forEach(row=>{row.classList.remove('is-wheel-target');row.removeAttribute('aria-current')});
  }
  // Place the selected label in the unused corner outside the circular wheel,
  // not over the sign ring, house divisions, or existing glyphs.
  function showSectorDescription(node,spec){
    const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
    if(!wheel)return;
    const mount=wheel.parentElement;
    if(!mount)return;
    let label=mount.querySelector(':scope > .sky-wheel-sector-description');
    if(!label){label=document.createElement('div');label.className='sky-wheel-sector-description';label.setAttribute('role','status');label.setAttribute('aria-live','polite');mount.appendChild(label)}
    if(!spec||!['house','sign','placement','aspect'].includes(spec.kind)){label.hidden=true;return}
    const vocab=window.RelphiSkyVocab?.describeFocus?.(spec.kind,spec.kind==='aspect'?node?.dataset?.aspect:spec.value)||
      (spec.kind==='sign'?{name:SIGN_NAMES[Number(spec.value)],description:'Explore this zodiac sign and its relationships.'}:
       spec.kind==='house'?{name:'House '+spec.value,description:'Explore this house of experience.'}:null);
    if(!vocab?.description){label.hidden=true;return}
    if(wheel.dataset.skyExperience==='learn'){const index=learnSignForState(spec),ctx=Number.isInteger(index)?learnSignContext(index):null;if(ctx)node=wheel.querySelector('[data-layer="a-houses"] [data-house="'+ctx.house+'"]')||node}
    const bbox=node?.getBoundingClientRect(),outer=wheel.getBoundingClientRect();
    // Four corner spaces outside the circular perimeter, determined by the
    // activated node position. Use the upper/lower and left/right half of wheel.
    const x=bbox?(bbox.left+bbox.right)/2:outer.left+outer.width/2;
    const y=bbox?(bbox.top+bbox.bottom)/2:outer.top+outer.height/2;
    label.dataset.corner=(y<outer.top+outer.height/2?'top':'bottom')+'-'+(x<outer.left+outer.width/2?'left':'right');
    label.replaceChildren();
    const heading=document.createElement('strong'),description=document.createElement('span');
    heading.textContent=vocab.name;
    description.textContent=vocab.description;
    label.append(heading,description);
    label.hidden=false;
  }
  // Every input method uses the same selection state transition. Touch invokes
  // it directly rather than dispatching a second click through unrelated
  // capture-phase listeners (which can retarget or consume that click).
  function toggleInteractiveNode(node){
    if(!node||(node.dataset.interactive==='aspect'&&!aspectInteractive(node)))return;
    wheelOnlyExternal=false;
    rowLockedState=null;rowHoverState=null;
    const next=specFrom(node);
    if(next?.kind==='aspect'&&window.RelphiSkyStartupMode?.readMode?.()==='learn')next.learnAnchor=learnSignForState(lockedState);
    if(same(lockedState,next)){lockedState=null;selectionOrigin=null}
    else{lockedState=next;selectionOrigin=originFromNode(node,next)}
    hoverState=null;applyState();
    showSectorDescription(node,lockedState);
    if(lockedState?.kind==='aspect')requestAnimationFrame(()=>revealSelectedRelationship(lockedState));
    else {
      clearWheelTargets();
      // Explicit selection changes close the previous tile; hover never does.
      window.RelphiInlineRelationship?.collapse?.();
    }
  }
  // One touch-to-click adapter owned by the foundation controller. Touch hover is
  // never selection state; one completed tap produces exactly one click.
  let touchGesture=null,ignoreNativeClickUntil=0,lastTouchPoint=null,lastMousePointerSelection=null;
  function touchInWheel(event){return !!event.target.closest?.('#skyFoundationWheelMount .sky-foundation-wheel')}
  function beginTouch(event){
    if(!['touch','pen'].includes(event.pointerType)||!touchInWheel(event))return;
    touchGesture={id:event.pointerId,x:event.clientX,y:event.clientY,target:event.target,moved:false,priorLocked:cloneFocusValue(lockedState)};
    hoverState=null;rowHoverState=null;
  }
  function moveTouch(event){
    if(!touchGesture||touchGesture.id!==event.pointerId)return;
    if(Math.hypot(event.clientX-touchGesture.x,event.clientY-touchGesture.y)>10)touchGesture.moved=true;
  }
  function finishTouch(event){
    if(!touchGesture||touchGesture.id!==event.pointerId)return;
    const gesture=touchGesture;touchGesture=null;
    ignoreNativeClickUntil=performance.now()+750;
    lastTouchPoint={x:event.clientX,y:event.clientY};
    if(gesture.moved)return;
    // A legacy handler can emit a click *inside the same pointerup dispatch*
    // before this listener executes. If it has already changed the foundation
    // lock, treat the gesture as handled. Toggling again would immediately undo
    // a successful tap (or reselect an aspect the user just toggled off).
    if(JSON.stringify(gesture.priorLocked)!==JSON.stringify(lockedState)){
      event.preventDefault();
      return;
    }
    const wheel=document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel');
    if(!wheel)return;
    const original=gesture.target?.isConnected?gesture.target:null;
    const underFinger=document.elementFromPoint(event.clientX,event.clientY);
    // Browser touch target can be stale after a wheel redraw, collision-order
    // pass, or scroll layout update. Prefer the element physically under the
    // released finger instead of dispatching to an old placement that moved
    // over a house; fall back to the original only if hit testing cannot resolve.
    const target=underFinger&&wheel.contains(underFinger)?underFinger:
      original&&wheel.contains(original)?original:null;
    if(!target)return; // A removed wheel target must not become a blank-area clear.
    // Use the controller's one selection transition directly, not a fabricated
    // DOM click subject to competing capture handlers or double activation.
    const node=interactive({target,clientX:event.clientX,clientY:event.clientY});
    if(node)toggleInteractiveNode(node);
    else if(clearableWhitespace({target}))clearFromWhitespace();
    event.preventDefault();
  }
  function cancelTouch(event){if(touchGesture?.id===event.pointerId)touchGesture=null}
  function bind(){
    const root=document.getElementById('skyFoundationRoot');if(!root||root.dataset.foundationInteractionsV2Bound==='true')return;root.dataset.foundationInteractionsV2Bound='true';
    // Capture wheel gestures at document level: foreground placements,
    // progressive-disclosure handlers and tap hit overlays may stop bubbling
    // before pointerup reaches the wheel root. The gesture begins only inside
    // this wheel, so unrelated document touches remain completely untouched.
    document.addEventListener('pointerdown',beginTouch,{capture:true,passive:true});
    document.addEventListener('pointermove',moveTouch,{capture:true,passive:true});
    document.addEventListener('pointerup',finishTouch,{capture:true,passive:false});
    // Real browser traces show Moon B pointerdown/pointerup but NO subsequent
    // click when a wheel update replaces the SVG target during the gesture.
    // Commit mouse selection on pointerup, before that click can disappear.
    document.addEventListener('pointerup',event=>{
      if(event.pointerType!=='mouse'||event.button!==0)return;
      const target=event.target;
      const onWheel=target.closest?.('#skyFoundationWheelMount .sky-foundation-wheel');
      const onLedger=target.closest?.('#skyFoundationA .sky-foundation-row[data-interactive="placement"],#skyFoundationB .sky-foundation-row[data-interactive="placement"]');
      if(!onWheel&&!onLedger)return;
      const node=interactive(event);
      if(node){
        toggleInteractiveNode(node);
        // A mouse pointerup can be followed by a native click. Do not toggle
        // the same house/placement twice for one physical gesture.
        lastMousePointerSelection={spec:specFrom(node),at:performance.now()};
      }
    },{capture:true,passive:true});
    document.addEventListener('pointercancel',cancelTouch,{capture:true});
    // Compatibility clicks may be retargeted to the wheel/root after a
    // redraw, not to the original SVG element. Suppress the trusted native
    // follow-up and other legacy synthetic clicks targeting the wheel: a
    // competing pointerup handler was observed dispatching an untrusted click
    // after our touch handler already committed selection. Suppress both kinds
    // of duplicate click, without blocking interactions outside the wheel.
    document.addEventListener('click',event=>{
      if(performance.now()<ignoreNativeClickUntil&&touchInWheel(event)){
        event.preventDefault();event.stopImmediatePropagation();
      }
    },true);
    root.addEventListener('pointerover',event=>{
      if(event.pointerType==='touch'||event.pointerType==='pen'||(event.pointerType==='mouse'&&performance.now()<ignoreNativeClickUntil))return;
      wheelOnlyExternal=false;
      const ruler=event.target.closest?.('#skyFoundationLearnCore button[data-core-ruler]');
      if(ruler){if(ruler.contains(event.relatedTarget))return;const next={kind:'ruler',sky:null,value:ruler.dataset.coreRuler};if(!same(hoverState,next)){hoverState=next;applyState()}return}
      const row=event.target.closest?.('.sky-foundation-relationship-row[data-relation-index]');
      if(row)return;
      if(lockedState)return;
      const node=interactive(event);if(!node||node.contains(event.relatedTarget))return;
      rowHoverState=null;hoverState=specFrom(node);applyState()
    });
    root.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||event.pointerType==='pen')return;if(lockedState||!event.target.closest?.('#skyFoundationWheelMount'))return;const direct=event.target.closest?.('[data-interactive]:not([data-interactive="aspect"])');if(direct)return;rowHoverState=null;const next=specFrom(nearestAspect(event));if(same(hoverState,next)||(!hoverState&&!next))return;hoverState=next;applyState()});
    root.addEventListener('pointerout',event=>{
      if(event.pointerType==='touch'||event.pointerType==='pen')return;
      const ruler=event.target.closest?.('#skyFoundationLearnCore button[data-core-ruler]');
      if(ruler){if(!ruler.contains(event.relatedTarget)&&hoverState?.kind==='ruler'&&hoverState.value===ruler.dataset.coreRuler){hoverState=null;applyState()}return}
      const row=event.target.closest?.('.sky-foundation-relationship-row[data-relation-index]');
      if(row)return;
      if(lockedState)return;
      const node=interactive(event);if(!node||node.contains(event.relatedTarget))return;hoverState=null;applyState()
    });
    root.addEventListener('focusin',event=>{
      const row=event.target.closest?.('.sky-foundation-relationship-row[data-relation-index]');
      if(row)return;
      if(lockedState)return;const node=interactive(event);if(!node)return;rowHoverState=null;hoverState=specFrom(node);applyState()
    });
    root.addEventListener('focusout',event=>{
      const row=event.target.closest?.('.sky-foundation-relationship-row[data-relation-index]');
      if(row)return;
      if(lockedState)return;const node=interactive(event);if(!node||node.contains(event.relatedTarget))return;hoverState=null;applyState()
    });
    // Own actual wheel click selection in capture phase. Other legacy
    // bubbling handlers must not interpret this same click as a hover reset.
    root.addEventListener('click',event=>{
      if(event.defaultPrevented||performance.now()<ignoreNativeClickUntil)return;
      // Both SVG placements and Sky A/B placement ledger rows are selection surfaces.
      // Previously capture ownership covered only the SVG wheel; ledger clicks
      // could be consumed by other handlers and leave a hover-only highlight.
      const onWheel=!!event.target.closest?.('#skyFoundationWheelMount .sky-foundation-wheel');
      const onLedger=!!event.target.closest?.('#skyFoundationA .sky-foundation-row[data-interactive="placement"],#skyFoundationB .sky-foundation-row[data-interactive="placement"]');
      if(!onWheel&&!onLedger)return;
      const node=interactive(event);
      if(!node)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const duplicate=event.detail>0&&lastMousePointerSelection&&
        performance.now()-lastMousePointerSelection.at<750&&
        same(lastMousePointerSelection.spec,specFrom(node));
      lastMousePointerSelection=null;
      if(!duplicate)toggleInteractiveNode(node);
    },true);
    root.addEventListener('click',event=>{
      wheelOnlyExternal=false;
      const core=event.target.closest?.('#skyFoundationLearnCore');
      if(core){
        const tab=event.target.closest('button[data-core-tab]'),ruler=event.target.closest('[data-core-ruler]'),sign=event.target.closest('[data-core-select-sign]'),clear=event.target.closest('[data-core-clear-ruler]');
        if(tab){core.dataset.coreActiveTab=tab.dataset.coreTab;updateLearnCore(lockedState);return}
        if(sign){toggleInteractiveNode(sign);return}
        if(ruler||clear){const next=clear?null:ruler?{kind:'ruler',sky:null,value:ruler.dataset.coreRuler}:{kind:'sign',sky:null,value:Number(sign.dataset.coreSelectSign)};
          lockedState=same(lockedState,next)?null:next;hoverState=null;rowLockedState=null;rowHoverState=null;selectionOrigin=lockedState?{source:'Sky Card Core',...lockedState}:null;
          clearWheelTargets();window.RelphiInlineRelationship?.collapse?.();applyState();}
        return;
      }
      const row=event.target.closest?.('.sky-foundation-relationship-row[data-relation-index]');
      if(row)return;
      const node=interactive(event);if(node){event.preventDefault();toggleInteractiveNode(node);return}if(clearableWhitespace(event))clearFromWhitespace()
    });
    root.addEventListener('keydown',event=>{wheelOnlyExternal=false;if(event.key==='Escape'){clearFromWhitespace();return}if(event.target.closest('.sky-foundation-relationship-row'))return;if(!['Enter',' '].includes(event.key))return;const node=interactive(event);if(!node)return;event.preventDefault();toggleInteractiveNode(node)});
  }
  function whereWhenEditing(){return document.documentElement.dataset.skyWhereWhenEditing==='true'}
  async function refresh(){
    refreshQueued=false;if(whereWhenEditing()&&!(records(read(KEYS.A)).length===0&&records(read(KEYS.B)).length>0))return;const root=document.getElementById('skyFoundationRoot'),wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');if(!root||!wheel||root.getAttribute('aria-busy')!=='false'||!HARMONIC)return;ensurePanel();
    const isLearn=wheel.dataset.skyExperience==='learn';
    const preparedA=isLearn?{list:[],houseCusps:Array.from({length:12},(_,i)=>(Number(document.documentElement.dataset.skyLearnAscendant||0)*30+i*30)%360)}:prepare(read(KEYS.A),'A'),preparedB=isLearn?{list:[],houseCusps:[]}:prepare(read(KEYS.B),'B'),relations=isLearn?templateRelationships():relationships(preparedA.list,preparedB.list),nextSignature=relationshipSignature(relations);current={listA:preparedA.list,listB:preparedB.list,relations,cuspsA:preparedA.houseCusps,cuspsB:preparedB.houseCusps};
    annotateHouseLayer('a-houses','A');annotateHouseLayer('b-houses','B');annotateSigns();annotatePlacements(current.listA,current.listB);annotateAspects(relations);annotateLedger('A',current.listA);annotateLedger('B',current.listB);
    if(!isLearn&&(!preparedA.list.length||!preparedB.list.length)){
      // In either single-sky state the intrasky renderer owns the remaining
      // A↔A or B↔B rows. Remove only orphaned intersky rows.
      const list=document.getElementById('skyFoundationRelationshipList');
      list?.querySelectorAll(':scope > .sky-foundation-relationship-row[data-relationship-mode="A-B"]')
        .forEach(row=>row.remove());
      renderedRelationshipSignature='';
    }else if(renderedRelationshipSignature!==nextSignature||!relationshipRowsIntact(relations)){
      await renderRows(relations);renderedRelationshipSignature=nextSignature;
    }
    bind();applyState();
    if(lockedState?.kind==='aspect')requestAnimationFrame(()=>revealSelectedRelationship(lockedState));
    window.dispatchEvent(new Event('relphi:sky-foundation-interactions-ready'));
  }
  function schedule(){if(refreshQueued)return;refreshQueued=true;requestAnimationFrame(refresh)}
  function start(){
    window.addEventListener('relphi:sky-foundation-ready',schedule);
    window.addEventListener('relphi:sky-b-removed',schedule);
    window.addEventListener('relphi:sky-orb-limit-changed',schedule);
    window.addEventListener('relphi:sky-by-sign-changed',schedule);
    [
      'relphi:sky-aspect-multiselect-changed',
      'relphi:sky-placement-multiselect-changed',
      'relphi:sky-house-multiselect-changed',
      'relphi:sky-zodiac-filter-changed',
      'relphi:sky-harmonic-window-visibility-changed',
      'relphi:sky-by-sign-changed'
    ].forEach(name=>window.addEventListener(name,reapplyInteractionState));
    if(document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy')==='false')schedule()
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
