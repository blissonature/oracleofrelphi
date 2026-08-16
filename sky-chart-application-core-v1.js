// One application core owns relationship data, interaction state, indexed rendering, and tiles.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.RelphiSkyChartApplication)return;

  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const COLORS={A:'#c9211e',B:'#2462d0'};
  const HOUSE_COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
  const HOUSE_NAMES=['','First House','Second House','Third House','Fourth House','Fifth House','Sixth House','Seventh House','Eighth House','Ninth House','Tenth House','Eleventh House','Twelfth House'];
  const HOUSE_REFERENTS=['','self, embodiment, appearance, approach, and the immediate way life is entered','resources, possessions, money, personal values, and what is held as one’s own','communication, learning, siblings, neighbors, short journeys, and the local environment','home, roots, family, ancestry, privacy, and the foundations of life','creativity, pleasure, romance, children, play, and personal self-expression','work, service, routines, health practices, maintenance, and practical obligations','partnership, contracts, one-to-one relationship, and encounters with the other','shared resources, intimacy, debt, inheritance, vulnerability, and transformation','worldview, religion, philosophy, higher learning, long journeys, and the search for meaning','vocation, public standing, reputation, authority, achievement, and visible responsibility','friends, networks, groups, alliances, hopes, and participation in a larger collective','retreat, hidden processes, solitude, confinement, surrender, spirituality, and closure'];
  const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const SIGN_NAMES=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const SIGN_REFERENTS={Aries:'initiative, directness, courage, impulse, and beginning',Taurus:'embodiment, value, pleasure, endurance, and material continuity',Gemini:'language, exchange, curiosity, movement, and multiplicity',Cancer:'care, protection, memory, belonging, and attachment',Leo:'radiance, creativity, pride, loyalty, and recognition',Virgo:'discernment, service, refinement, repair, and usefulness',Libra:'relationship, balance, fairness, dialogue, and mutual recognition',Scorpio:'intensity, secrecy, survival, bonding, and emotional truth',Sagittarius:'meaning, faith, exploration, philosophy, and freedom',Capricorn:'structure, responsibility, endurance, mastery, and worldly form',Aquarius:'systems, reform, collective intelligence, detachment, and future orientation',Pisces:'surrender, imagination, compassion, permeability, and release'};
  const ORDER=['sun','moon','asc','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','north-node','south-node','chiron','lilith','part-of-fortune','vertex','mc','ic','dsc'];
  const ALIASES={rising:'asc',ascendant:'asc',ac:'asc',descendant:'dsc',dc:'dsc',midheaven:'mc','imum coeli':'ic',imumcoeli:'ic',vx:'vertex','north node':'north-node',node:'north-node','true node':'north-node','mean node':'north-node','south node':'south-node','black moon lilith':'lilith',fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune'};
  const PLACEMENT_REFERENTS={sun:'identity, vitality, and conscious purpose',moon:'feelings, instincts, memory, and emotional needs',mercury:'thought, perception, language, and communication',venus:'values, attraction, affection, pleasure, and relating',mars:'drive, assertion, desire, conflict, and action',jupiter:'growth, confidence, meaning, opportunity, and expansion',saturn:'structure, limits, responsibility, time, and commitment',uranus:'freedom, disruption, originality, awakening, and change',neptune:'imagination, sensitivity, surrender, ideals, and vision',pluto:'power, depth, compulsion, elimination, and transformation',chiron:'wounding, healing intelligence, and the capacity to guide healing',asc:'the way a person enters life and is immediately perceived',dsc:'the way a person meets partners and encounters the other',mc:'public direction, vocation, visibility, and the role a person grows toward',ic:'roots, home, private foundations, and inherited belonging','north-node':'growth through unfamiliar experience and developing capacity','south-node':'familiar patterns, inherited capacity, and the known path',lilith:'instinctive autonomy, refusal, exile, and uncompromised desire','part-of-fortune':'the meeting place of body, feeling, circumstance, and ease',vertex:'encounters that feel consequential or outside ordinary control'};
  const ASPECT_REFERENTS={conjunction:'the two functions operate together','semi-sextile':'neighboring functions accommodate one another',octile:'focused friction and adjustment',sextile:'a cooperative opening activated through participation',quintile:'creative pattern-making and specialized skill',square:'activating pressure and development',trine:'low-resistance exchange','tri-octile':'accumulated friction and redirection','bi-quintile':'refined creative pattern-making',quincunx:'continuing adjustment and translation',opposition:'awareness through polarity, contrast, and exchange'};
  const DECANS=[[['two_of_wands','Two of Wands'],['three_of_wands','Three of Wands'],['four_of_wands','Four of Wands']],[['five_of_pentacles','Five of Pentacles'],['six_of_pentacles','Six of Pentacles'],['seven_of_pentacles','Seven of Pentacles']],[['eight_of_swords','Eight of Swords'],['nine_of_swords','Nine of Swords'],['ten_of_swords','Ten of Swords']],[['two_of_cups','Two of Cups'],['three_of_cups','Three of Cups'],['four_of_cups','Four of Cups']],[['five_of_wands','Five of Wands'],['six_of_wands','Six of Wands'],['seven_of_wands','Seven of Wands']],[['eight_of_pentacles','Eight of Pentacles'],['nine_of_pentacles','Nine of Pentacles'],['ten_of_pentacles','Ten of Pentacles']],[['two_of_swords','Two of Swords'],['three_of_swords','Three of Swords'],['four_of_swords','Four of Swords']],[['five_of_cups','Five of Cups'],['six_of_cups','Six of Cups'],['seven_of_cups','Seven of Cups']],[['eight_of_wands','Eight of Wands'],['nine_of_wands','Nine of Wands'],['ten_of_wands','Ten of Wands']],[['two_of_pentacles','Two of Pentacles'],['three_of_pentacles','Three of Pentacles'],['four_of_pentacles','Four of Pentacles']],[['five_of_swords','Five of Swords'],['six_of_swords','Six of Swords'],['seven_of_swords','Seven of Swords']],[['eight_of_cups','Eight of Cups'],['nine_of_cups','Nine of Cups'],['ten_of_cups','Ten of Cups']]];
  const REVEAL_FIELDS=['left-placement','left-sign','left-house','aspect','right-placement','right-sign','right-house'];
  const FILTER_HIDDEN_CLASSES=['sky-foundation-single-sky-cross-hidden','sky-chart-filter-hidden','sky-chart-orb-hidden','sky-orb-filter-hidden','sky-chart-multiselect-hidden','sky-chart-house-multiselect-hidden','sky-chart-aspect-multiselect-hidden'];
  const NS='http://www.w3.org/2000/svg';

  const harmonic=window.RelphiHarmonicEngine;
  const modelApi=window.RelphiSkyRelationshipModel;
  if(!harmonic||!modelApi)throw new Error('Sky Chart application core requires harmonic and relationship models.');

  const state={hover:null,locked:null,expandedId:null,revealStages:new Map()};
  const metrics={modelBuilds:0,structuralRenders:0,rowRenders:0,wheelIndexBuilds:0,pointerTransitions:0,expansionTransitions:0,progressiveTransitions:0,listReplacements:0,observerCount:0,boundListeners:0,fullScansInPointerPath:0};
  const view={relationships:new Map(),placements:new Map(),houses:new Map(),signs:new Map(),rows:new Map(),relationNodes:new Map(),visibleLines:new Map(),hits:new Map()};
  const relationIndex={placement:new Map(),house:new Map(),sign:new Map(),aspect:new Map()};
  const glyphTemplates=new Map();
  let model=null,modelFingerprint='',root=null,list=null,count=null,empty=null,clearButton=null,hoverFrame=0,pendingHover=null,glyphObserver=null;

  const norm=value=>harmonic.normalizeAngle(value);
  const esc=value=>String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const read=key=>{try{const raw=window.RelphiSkyStartupMode?.read?.(key)??localStorage.getItem(key),parsed=JSON.parse(raw||'null'),angled=window.RelphiAnglePlacements?.normalizePayload?.(parsed)||parsed;return window.RelphiSkyDataPreparation?.prepare?.(angled,angled)||angled}catch(error){console.error('Sky Chart storage parse failed:',key,error);return null}};
  const addToIndex=(index,key,value)=>{if(!index.has(key))index.set(key,new Set());index.get(key).add(value)};
  const addNode=(index,key,node)=>{if(!index.has(key))index.set(key,new Set());index.get(key).add(node)};
  const sameTarget=(left,right)=>!!left&&!!right&&left.kind===right.kind&&left.key===right.key;

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
    const registry=window.RelphiGlyphRegistry;
    for(const candidate of [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]){
      if(candidate==null)continue;
      const raw=String(candidate).trim(),id=ALIASES[raw.toLowerCase()]||raw,entry=registry?.resolve?.(id)||registry?.get?.(id);
      if(entry)return entry;
    }
    return null;
  }
  function profile(payload){return payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{}}
  function ascendant(payload,records){const record=records.find(item=>item.id==='asc');if(record)return record.value;const value=Number(profile(payload).ascendant??payload?.ascendant??payload?.asc);return Number.isFinite(value)?norm(value):0}
  function houseCusps(payload,records){
    const data=profile(payload);
    for(const raw of [data.houseCusps,data.cusps,payload?.houseCusps,payload?.cusps,payload?.houses]){
      if(!raw)continue;
      const values=(Array.isArray(raw)?raw:Object.values(raw)).map(item=>typeof item==='object'?Number(item.longitude??item.value??item.cusp):Number(item)).slice(0,12);
      if(values.length===12&&values.every(Number.isFinite))return values.map(norm);
    }
    const asc=ascendant(payload,records),system=String(data.houseSystem||payload?.houseSystem||'whole-sign').toLowerCase(),start=system.includes('whole')?Math.floor(asc/30)*30:asc;
    return Array.from({length:12},(_,index)=>norm(start+index*30));
  }
  function houseFor(value,cusps){for(let index=0;index<12;index++){const start=cusps[index],span=norm(cusps[(index+1)%12]-start)||30;if(norm(value-start)<span)return index+1}return 12}
  function records(payload,sky){
    const items=source(payload).map(([key,item])=>{const entry=canonical(key,item),value=longitude(item);return{key,item,entry,id:entry?.id||'',value}}).filter(record=>record.entry&&Number.isFinite(record.value)).sort((left,right)=>{const a=ORDER.indexOf(left.id),b=ORDER.indexOf(right.id);return(a<0?999:a)-(b<0?999:b)||left.value-right.value});
    const cusps=houseCusps(payload,items);
    return{cusps,items:items.map(record=>({...record,sky,sign:Math.floor(record.value/30),house:houseFor(record.value,cusps)}))};
  }
  function buildModel(){
    const preparedA=records(read(KEYS.A),'A'),preparedB=records(read(KEYS.B),'B');
    const next=modelApi.build({leftPlacements:preparedA.items,rightPlacements:preparedB.items,phaseWindow:harmonic.defaultWindow});
    metrics.modelBuilds++;
    return next;
  }
  function fingerprint(next){return next.relationships.map(relation=>`${relation.id}@${relation.left.longitude.toFixed(8)}:${relation.right.longitude.toFixed(8)}:${relation.left.house}:${relation.right.house}:${relation.phaseError.toFixed(8)}`).join(';')}
  function coordinate(endpoint){const sign=Math.floor(endpoint.longitude/30),within=endpoint.longitude-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60+1e-9);return{sign,text:`${degree}°${String(minute).padStart(2,'0')}′`}}
  function houseInk(hex){const value=String(hex||'').replace('#','');const red=parseInt(value.slice(0,2),16),green=parseInt(value.slice(2,4),16),blue=parseInt(value.slice(4,6),16);return .299*red+.587*green+.114*blue>160?'#211d1a':'#fff'}

  function ensurePanel(){
    let panel=document.getElementById('skyFoundationRelationships');
    if(!panel){
      const comparison=document.getElementById('skyFoundationComparison');
      if(!comparison)return null;
      panel=document.createElement('section');panel.id='skyFoundationRelationships';panel.setAttribute('aria-label','Relationships');
      panel.innerHTML='<header class="sky-foundation-relationships-heading"><h2>Relationships</h2><span id="skyFoundationRelationshipCount">0/0</span><button id="skyFoundationClearIsolation" type="button" hidden>Clear</button></header><div id="skyFoundationRelationshipList"></div><p id="skyFoundationRelationshipEmpty" hidden>No relationships match the current view.</p>';
      comparison.appendChild(panel);
    }
    list=panel.querySelector('#skyFoundationRelationshipList');count=panel.querySelector('#skyFoundationRelationshipCount');empty=panel.querySelector('#skyFoundationRelationshipEmpty');clearButton=panel.querySelector('#skyFoundationClearIsolation');
    return panel;
  }
  function medallionMarkup(house,field){const color=HOUSE_COLORS[house-1]||'#777',ink=houseInk(color);return`<button type="button" class="relphi-house-medallion" data-house="${house}" data-reveal-field="${field}" style="--house-color:${color};--house-ink:${ink}" title="${esc(HOUSE_NAMES[house])}" aria-label="Reveal ${esc(HOUSE_NAMES[house])}">${house}</button>`}
  function placementMarkup(relation,side){
    const endpoint=side==='left'?relation.left:relation.right,position=coordinate(endpoint),tone=side==='left'?'A':'B',sign=SIGNS[position.sign],signName=SIGN_NAMES[position.sign];
    return`<span class="sky-foundation-relationship-placement sky-foundation-relationship-placement--${side}"><span class="sky-foundation-relationship-symbol-pair"><button type="button" class="sky-progressive-trigger sky-foundation-relationship-glyph sky-foundation-relationship-glyph--${side}" data-glyph-id="${esc(endpoint.id)}" data-glyph-color="${COLORS[tone]}" data-reveal-field="${side}-placement" tabindex="-1" aria-label="Reveal ${esc(endpoint.name)}"></button><span class="sky-foundation-relationship-in" aria-hidden="true">in</span><button type="button" class="sky-progressive-trigger sky-foundation-relationship-sign" data-glyph-id="${sign}" data-glyph-color="${COLORS[tone]}" data-reveal-field="${side}-sign" tabindex="-1" aria-label="Reveal ${signName}"></button></span><span class="sky-foundation-relationship-copy"><small class="relphi-house-coordinate" data-relationship-coordinate="${position.text}"><span class="relphi-house-coordinate-value">${position.text}</span>${medallionMarkup(endpoint.house,`${side}-house`)}</small></span></span>`;
  }
  function rowMarkup(relation,index){
    const aria=`${relation.left.name} ${relation.aspect.label} ${relation.right.name}, orb ${relation.ordinaryOrb.toFixed(2)} degrees, harmonic ${relation.harmonicOrder}, phase error ${relation.phaseError.toFixed(2)} degrees, coherence ${relation.coherencePercent.toFixed(0)} percent`;
    return`<article class="sky-foundation-relationship-row" role="button" tabindex="0" aria-expanded="false" aria-label="${esc(aria)}" data-interactive="relationship" data-interaction-key="${esc(relation.id)}" data-relationship-id="${esc(relation.id)}" data-relation-index="${index}" data-aspect="${relation.aspect.id}" data-left-placement="${esc(relation.left.id)}" data-right-placement="${esc(relation.right.id)}" data-source-orb="${relation.ordinaryOrb.toFixed(6)}" data-orb="${relation.ordinaryOrb.toFixed(6)}" data-harmonic-order="${relation.harmonicOrder}" data-harmonic-numerator="${relation.harmonicNumerator}" data-phase-error="${relation.phaseError.toFixed(6)}" data-signed-phase-error="${relation.signedPhaseError.toFixed(6)}" data-harmonic-window="${relation.masterWindow.toFixed(6)}" data-window-fraction="${relation.normalizedPhaseError.toFixed(6)}" data-harmonic-coherence="${relation.coherence.toFixed(8)}" data-left-house="${relation.left.house}" data-right-house="${relation.right.house}" data-left-sign="${relation.left.sign}" data-right-sign="${relation.right.sign}" style="--relationship-stripe:${relation.aspect.color};--aspect-color:${relation.aspect.color}">${placementMarkup(relation,'left')}<button type="button" class="sky-progressive-trigger sky-foundation-relationship-glyph sky-foundation-relationship-glyph--aspect" data-glyph-id="${relation.aspect.id}" data-glyph-color="${relation.aspect.color}" data-reveal-field="aspect" tabindex="-1" aria-label="Reveal ${esc(relation.aspect.label)}"></button><span class="sky-foundation-relationship-orb" aria-label="Orb ${relation.ordinaryOrb.toFixed(2)} degrees">${relation.ordinaryOrb.toFixed(2)}°</span>${placementMarkup(relation,'right')}</article>`;
  }
  function resetIndexes(){
    Object.values(relationIndex).forEach(index=>index.clear());
    view.rows.clear();view.relationNodes.clear();view.visibleLines.clear();view.hits.clear();
  }
  function indexRelationships(){
    model.relationships.forEach(relation=>{
      addToIndex(relationIndex.placement,`A:${relation.left.id}`,relation.id);addToIndex(relationIndex.placement,`B:${relation.right.id}`,relation.id);
      addToIndex(relationIndex.house,`A:${relation.left.house}`,relation.id);addToIndex(relationIndex.house,`B:${relation.right.house}`,relation.id);
      addToIndex(relationIndex.sign,String(relation.left.sign),relation.id);addToIndex(relationIndex.sign,String(relation.right.sign),relation.id);
      addToIndex(relationIndex.aspect,relation.aspect.id,relation.id);
    });
  }
  function renderRows(){
    if(!ensurePanel())return;
    list.innerHTML=model.relationships.map(rowMarkup).join('');
    metrics.structuralRenders++;metrics.rowRenders+=model.relationships.length;metrics.listReplacements++;
    model.relationships.forEach((relation,index)=>{
      const row=list.children[index];view.rows.set(relation.id,row);view.relationNodes.set(relation.id,new Set([row]));
    });
    count.dataset.total=String(model.relationships.length);updateCount();
    glyphObserver?.disconnect();metrics.observerCount=0;
    if('IntersectionObserver'in window){
      glyphObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){paintRow(entry.target);glyphObserver.unobserve(entry.target)}}),{root:list,rootMargin:'180px 0px'});
      metrics.observerCount=1;view.rows.forEach(row=>glyphObserver.observe(row));
    }else view.rows.forEach(paintRow);
  }
  async function glyphTemplate(id,color){
    const entry=window.RelphiGlyphRegistry?.get?.(id)||window.RelphiGlyphRegistry?.resolve?.(id),component=window.RelphiGlyphComponent,key=`${entry?.id||id}|${color}`;
    if(!entry||!component?.createBubble)return null;
    if(glyphTemplates.has(key))return glyphTemplates.get(key);
    const promise=(async()=>{const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','-32 -32 64 64');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.dataset.relationshipCanonicalHost='sky-chart-application-core-v1';const bubble=component.createBubble(svg,entry.id,{radius:19,padding:1,color});bubble.circle.style.opacity='0';bubble.circle.setAttribute('aria-hidden','true');await Promise.resolve(bubble.ready);return svg})();
    glyphTemplates.set(key,promise);return promise;
  }
  async function paintRow(row){
    if(!row?.isConnected||row.dataset.glyphsPainted==='true')return;
    row.dataset.glyphsPainted='pending';
    const slots=[...row.querySelectorAll('[data-glyph-id]')];
    await Promise.all(slots.map(async slot=>{const template=await glyphTemplate(slot.dataset.glyphId,slot.dataset.glyphColor);if(template&&row.isConnected)slot.replaceChildren(template.cloneNode(true))}));
    if(row.isConnected)row.dataset.glyphsPainted='true';
  }
  function annotateStaticTargets(){
    view.placements.clear();view.houses.clear();view.signs.clear();
    const placementsBySky={A:model.placements.A,B:model.placements.B};
    document.querySelectorAll('[data-layer="placements"]>g[data-sky][data-placement], [data-layer="leaders"]>line[data-sky][data-placement]').forEach(node=>{const key=`${node.dataset.sky}:${node.dataset.placement}`;node.dataset.interactive='placement';node.dataset.interactionKey=key;node.classList.add('sky-foundation-interactive');addNode(view.placements,key,node);if(node.tagName.toLowerCase()==='g'){node.setAttribute('tabindex','0');node.setAttribute('role','button')}});
    ['A','B'].forEach(sky=>{const panel=document.getElementById(`skyFoundation${sky}`);panel?.querySelectorAll('.sky-foundation-row').forEach((row,index)=>{const record=placementsBySky[sky][index];if(!record)return;const key=`${sky}:${record.id}`;Object.assign(row.dataset,{interactive:'placement',interactionKey:key,sky,placement:record.id,house:String(record.house),sign:String(record.sign)});row.setAttribute('tabindex','0');row.setAttribute('role','button');addNode(view.placements,key,row)})});
    [['a-houses','A'],['b-houses','B']].forEach(([layerName,sky])=>{const layer=document.querySelector(`[data-layer="${layerName}"]`);[...layer?.children||[]].filter(node=>node.tagName?.toLowerCase()==='path').forEach((node,index)=>{const key=`${sky}:${index+1}`;Object.assign(node.dataset,{interactive:'house',interactionKey:key,sky,house:String(index+1)});node.classList.add('sky-foundation-interactive');node.setAttribute('tabindex','0');node.setAttribute('role','button');node.setAttribute('aria-label',`Sky ${sky} house ${index+1}`);addNode(view.houses,key,node)})});
    const zodiac=document.querySelector('[data-layer="zodiac"]');[...zodiac?.children||[]].filter(node=>node.tagName?.toLowerCase()==='path').forEach((node,index)=>{const key=String(index);Object.assign(node.dataset,{interactive:'sign',interactionKey:key,sign:key});node.classList.add('sky-foundation-interactive');node.setAttribute('tabindex','0');node.setAttribute('role','button');node.setAttribute('aria-label',SIGN_NAMES[index]);addNode(view.signs,key,node)});
  }
  function installWheelIndex(){
    document.querySelectorAll('[data-layer="aspects"]>.sky-foundation-aspect-hit').forEach(node=>node.remove());
    const raw=[...document.querySelectorAll('[data-layer="aspects"]>line.sky-foundation-aspect')];
    const positions=new Map(model.relationships.map((relation,index)=>[relation.id,index]));
    raw.forEach(line=>{
      const id=modelApi.stableId({sky:'A',id:line.dataset.leftPlacement},{id:line.dataset.aspect},{sky:'B',id:line.dataset.rightPlacement}),relation=model.byId.get(id);
      if(!relation){line.remove();return}
      const index=positions.get(id);
      Object.assign(line.dataset,{relationshipId:id,relationIndex:String(index),harmonicOrder:String(relation.harmonicOrder),harmonicNumerator:String(relation.harmonicNumerator),phaseError:relation.phaseError.toFixed(6),harmonicCoherence:relation.coherence.toFixed(8)});
      line.style.pointerEvents='none';line.setAttribute('aria-hidden','true');view.visibleLines.set(id,line);view.relationNodes.get(id)?.add(line);
      const hit=line.cloneNode(false);hit.removeAttribute('stroke');hit.classList.add('sky-foundation-aspect-hit','sky-foundation-interactive');Object.assign(hit.dataset,{interactive:'relationship',interactionKey:id,relationshipId:id});hit.setAttribute('tabindex','0');hit.setAttribute('role','button');hit.setAttribute('aria-hidden','false');hit.setAttribute('aria-label',`${relation.left.name} ${relation.aspect.label} ${relation.right.name}, harmonic ${relation.harmonicOrder}, phase error ${relation.phaseError.toFixed(2)} degrees`);line.after(hit);view.hits.set(id,hit);view.relationNodes.get(id)?.add(hit);
    });
    annotateStaticTargets();metrics.wheelIndexBuilds++;
  }
  function targetFrom(node){const interactive=node?.closest?.('[data-interactive]');if(!interactive||!root?.contains(interactive))return null;return{kind:interactive.dataset.interactive,key:interactive.dataset.interactionKey,node:interactive}}
  function relatedIds(target){
    if(!target)return new Set();
    if(target.kind==='relationship')return new Set([target.key]);
    if(target.kind==='placement')return new Set(relationIndex.placement.get(target.key)||[]);
    if(target.kind==='house')return new Set(relationIndex.house.get(target.key)||[]);
    if(target.kind==='sign')return new Set(relationIndex.sign.get(target.key)||[]);
    return new Set();
  }
  function directNodes(target){
    if(!target)return new Set();
    if(target.kind==='relationship')return view.relationNodes.get(target.key)||new Set();
    if(target.kind==='placement')return view.placements.get(target.key)||new Set();
    if(target.kind==='house')return view.houses.get(target.key)||new Set();
    if(target.kind==='sign')return view.signs.get(target.key)||new Set();
    return new Set();
  }
  function toggleNodes(nodes,className,enabled){nodes?.forEach(node=>node.classList.toggle(className,enabled))}
  function applyRelationDelta(previous,next,className){
    previous.forEach(id=>{if(!next.has(id))toggleNodes(view.relationNodes.get(id),className,false)});
    next.forEach(id=>{if(!previous.has(id))toggleNodes(view.relationNodes.get(id),className,true)});
  }
  function commitHover(next){
    if(state.locked)next=null;
    if(sameTarget(state.hover,next)||(!state.hover&&!next))return;
    metrics.pointerTransitions++;
    toggleNodes(directNodes(state.hover),'is-hovered',false);toggleNodes(directNodes(next),'is-hovered',true);
    pendingHover={previous:relatedIds(state.hover),next:relatedIds(next)};state.hover=next;
    if(!hoverFrame)hoverFrame=requestAnimationFrame(()=>{hoverFrame=0;const work=pendingHover;pendingHover=null;if(work)applyRelationDelta(work.previous,work.next,'is-related-hover')});
  }
  function applyLockedVisibility(){
    const allowed=relatedIds(state.locked),locked=!!state.locked;
    model.relationships.forEach(relation=>{
      const keep=!locked||allowed.has(relation.id),row=view.rows.get(relation.id),line=view.visibleLines.get(relation.id),hit=view.hits.get(relation.id);
      if(row){row.hidden=!keep;row.setAttribute('aria-hidden',keep?'false':'true')}
      line?.classList.toggle('is-interaction-hidden',!keep);hit?.classList.toggle('is-interaction-hidden',!keep);
    });
    clearButton.hidden=!locked;updateCount();
  }
  function commitSelection(next){
    const resolved=sameTarget(state.locked,next)?null:next;
    toggleNodes(directNodes(state.locked),'is-selected-target',false);commitHover(null);state.locked=resolved;toggleNodes(directNodes(state.locked),'is-selected-target',true);applyLockedVisibility();
    window.dispatchEvent(new CustomEvent('relphi:sky-interaction-selection-changed',{detail:{target:state.locked?{kind:state.locked.kind,key:state.locked.key}:null,relationshipIds:[...relatedIds(state.locked)]}}));
  }
  function externallyVisible(row){return row&&!row.hidden&&!FILTER_HIDDEN_CLASSES.some(className=>row.classList.contains(className))}
  function updateCount(){if(!count||!model)return;const visible=[...view.rows.values()].filter(externallyVisible).length;count.textContent=`${visible}/${model.relationships.length}`;empty.hidden=visible!==0}
  function card(endpoint){const value=norm(endpoint.longitude),sign=Math.floor(value/30),degree=Math.floor(value-sign*30),[id,title]=DECANS[sign][Math.min(2,Math.floor(degree/10))];return{id,title,image:`assets/tarot/rws-export/${id}.webp`}}
  function point(value,radius=48){const angle=(norm(value)-180)*Math.PI/180;return{x:60+radius*Math.cos(angle),y:60+radius*Math.sin(angle)}}
  function wheelMarkup(relation){const left=point(relation.left.longitude),right=point(relation.right.longitude);return`<div class="inline-rel-wheel"><div class="inline-rel-wheel-stage"><svg viewBox="0 0 120 120" role="img" aria-label="Isolated ${esc(relation.left.name)} ${esc(relation.aspect.label)} ${esc(relation.right.name)} relationship"><circle cx="60" cy="60" r="48" class="inline-rel-ring"/><line x1="60" y1="60" x2="${left.x}" y2="${left.y}" class="inline-rel-radius a"/><line x1="60" y1="60" x2="${right.x}" y2="${right.y}" class="inline-rel-radius b"/><line x1="${left.x}" y1="${left.y}" x2="${right.x}" y2="${right.y}" class="inline-rel-aspect"/><circle cx="${left.x}" cy="${left.y}" r="5.4" class="inline-rel-point inline-rel-point-a"/><circle cx="${right.x}" cy="${right.y}" r="5.4" class="inline-rel-point inline-rel-point-b"/></svg></div><div class="inline-rel-orb"><span style="--orb:${Math.min(1,relation.normalizedPhaseError)}"></span><strong>${relation.ordinaryOrb.toFixed(2)}°</strong></div></div>`}
  function cardMarkup(sky,cardData){const href=window.RelphiTarotLedgerNavigation.hrefForCard(cardData.id);return`<a class="inline-rel-card sky-${sky.toLowerCase()}" data-ledger-card="${cardData.id}" href="${esc(href)}" aria-label="Open full ${esc(cardData.title)} Tarot Ledger entry"><small>Sky ${sky}</small><img loading="lazy" decoding="async" src="${esc(cardData.image)}" alt="${esc(cardData.title)}"><b>${esc(cardData.title)}</b></a>`}
  function ensureDetail(id){
    const row=view.rows.get(id),relation=model.byId.get(id);if(!row||!relation)return null;
    let detail=row.querySelector(':scope>.inline-rel-detail');if(detail)return detail;
    detail=document.createElement('div');detail.className='inline-rel-detail';detail.hidden=true;
    detail.innerHTML=`<div class="inline-rel-progressive-strip" aria-label="Progressive symbolic reveal">${REVEAL_FIELDS.map(field=>`<div class="inline-rel-progressive-token" data-field="${field}" style="--token-color:${field.startsWith('left')?COLORS.A:field.startsWith('right')?COLORS.B:relation.aspect.color}" hidden><strong></strong><span hidden></span></div>`).join('')}</div><div class="inline-rel-visual">${cardMarkup('A',card(relation.left))}${wheelMarkup(relation)}${cardMarkup('B',card(relation.right))}</div>`;
    row.appendChild(detail);return detail;
  }
  function setExpanded(id,open){
    const row=view.rows.get(id);if(!row)return;
    const detail=open?ensureDetail(id):row.querySelector(':scope>.inline-rel-detail');
    row.classList.toggle('is-inline-expanded',open);row.setAttribute('aria-expanded',open?'true':'false');if(detail)detail.hidden=!open;
    row.querySelectorAll('[data-reveal-field]').forEach(control=>control.tabIndex=open?0:-1);
  }
  function toggleExpanded(id){
    const next=state.expandedId===id?null:id,previous=state.expandedId;
    if(previous)setExpanded(previous,false);state.expandedId=next;if(next)setExpanded(next,true);metrics.expansionTransitions++;
  }
  function revealInfo(relation,field){
    if(field==='left-placement')return{name:relation.left.name,referent:PLACEMENT_REFERENTS[relation.left.id]||'a calculated placement in Sky A'};
    if(field==='right-placement')return{name:relation.right.name,referent:PLACEMENT_REFERENTS[relation.right.id]||'a calculated placement in Sky B'};
    if(field==='left-sign'||field==='right-sign'){const endpoint=field.startsWith('left')?relation.left:relation.right,name=SIGN_NAMES[endpoint.sign];return{name,referent:SIGN_REFERENTS[name]||'a zodiacal mode'}}
    if(field==='left-house'||field==='right-house'){const endpoint=field.startsWith('left')?relation.left:relation.right;return{name:HOUSE_NAMES[endpoint.house]||'House',referent:HOUSE_REFERENTS[endpoint.house]||'a calculated house context'}}
    return{name:relation.aspect.label,referent:ASPECT_REFERENTS[relation.aspect.id]||'a measured relationship between two placements'};
  }
  function revealStages(id){if(!state.revealStages.has(id))state.revealStages.set(id,new Map());return state.revealStages.get(id)}
  function activateReveal(id,field){
    const relation=model.byId.get(id),detail=ensureDetail(id);if(!relation||!detail)return;
    const stages=revealStages(id),next=((stages.get(field)||0)+1)%3;stages.set(field,next);metrics.progressiveTransitions++;
    const token=detail.querySelector(`[data-field="${field}"]`),info=revealInfo(relation,field);token.hidden=next===0;token.dataset.stage=String(next);token.querySelector('strong').textContent=info.name;const referent=token.querySelector('span');referent.textContent=info.referent;referent.hidden=next<2;
  }
  function handlePointerOver(event){const next=targetFrom(event.target);if(!next||next.node.contains(event.relatedTarget))return;commitHover(next)}
  function handlePointerOut(event){const current=targetFrom(event.target);if(!current||current.node.contains(event.relatedTarget))return;commitHover(targetFrom(event.relatedTarget))}
  function handleFocusIn(event){commitHover(targetFrom(event.target))}
  function handleFocusOut(event){if(!root.contains(event.relatedTarget))commitHover(null)}
  function handleClick(event){
    if(event.target.closest('[data-ledger-card]'))return;
    const row=event.target.closest('.sky-foundation-relationship-row[data-relationship-id]'),reveal=event.target.closest('[data-reveal-field]');
    if(row&&reveal&&row.classList.contains('is-inline-expanded')){event.preventDefault();event.stopPropagation();activateReveal(row.dataset.relationshipId,reveal.dataset.revealField);return}
    if(row){event.preventDefault();event.stopPropagation();toggleExpanded(row.dataset.relationshipId);return}
    const target=targetFrom(event.target);if(target){event.preventDefault();commitSelection(target);return}
    if(event.target.closest('#skyFoundationWheelMount,#skyFoundationComparison'))commitSelection(null);
  }
  function handleKey(event){
    if(event.key==='Escape'){commitSelection(null);return}
    if(!['Enter',' '].includes(event.key))return;
    const row=event.target.closest('.sky-foundation-relationship-row[data-relationship-id]');if(row&&event.target===row){event.preventDefault();toggleExpanded(row.dataset.relationshipId);return}
    const target=targetFrom(event.target);if(target){event.preventDefault();commitSelection(target)}
  }
  function bind(){
    if(root.dataset.skyApplicationBound==='true')return;root.dataset.skyApplicationBound='true';
    root.addEventListener('pointerover',handlePointerOver);root.addEventListener('pointerout',handlePointerOut);root.addEventListener('focusin',handleFocusIn);root.addEventListener('focusout',handleFocusOut);root.addEventListener('click',handleClick);root.addEventListener('keydown',handleKey);metrics.boundListeners+=6;
    clearButton.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();commitSelection(null)});metrics.boundListeners++;
    ['relphi:sky-placement-multiselect-changed','relphi:sky-house-multiselect-changed','relphi:sky-aspect-multiselect-changed','relphi:sky-zodiac-filter-changed','relphi:sky-harmonic-window-visibility-changed'].forEach(name=>{window.addEventListener(name,()=>requestAnimationFrame(updateCount));metrics.boundListeners++});
  }
  function refresh(){
    root=document.getElementById('skyFoundationRoot');if(!root||root.getAttribute('aria-busy')!=='false')return;
    const next=buildModel(),nextFingerprint=fingerprint(next),structuralChange=nextFingerprint!==modelFingerprint||!list?.isConnected;
    model=next;window.RelphiSkyChartModel=model;resetIndexes();indexRelationships();
    if(structuralChange){modelFingerprint=nextFingerprint;renderRows()}else{model.relationships.forEach(relation=>{const row=list.querySelector(`[data-relationship-id="${CSS.escape(relation.id)}"]`);if(row){view.rows.set(relation.id,row);view.relationNodes.set(relation.id,new Set([row]))}})}
    installWheelIndex();bind();applyLockedVisibility();
    if(state.expandedId&&view.rows.has(state.expandedId))setExpanded(state.expandedId,true);
    else state.expandedId=null;
    document.documentElement.dataset.skyApplicationCore='v1';
    window.dispatchEvent(new CustomEvent('relphi:sky-foundation-interactions-ready',{detail:{modelVersion:model.version,relationshipCount:model.relationships.length}}));
  }
  function start(){window.addEventListener('relphi:sky-foundation-ready',refresh);metrics.boundListeners++;if(document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy')==='false')refresh()}

  window.RelphiSkyChartApplication=Object.freeze({state,metrics,refresh,get model(){return model},get view(){return view}});
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
