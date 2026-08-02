// Selected Relationship v3. The clicked relationship row is the contract object.
(function(){
  'use strict';
  if(window.__relphiSkySelectedRelationshipV2)return;
  window.__relphiSkySelectedRelationshipV2=true;

  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'},COLORS={A:'#c9211e',B:'#2462d0'};
  const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ASPECT_COLORS={conjunction:'#e53935','semi-sextile':'#7c9b49',octile:'#b86d43',sextile:'#d3b727',quintile:'#8b6cc2',square:'#d6534d',trine:'#4e9e69','tri-octile':'#9f5944','bi-quintile':'#7655aa',quincunx:'#4b8e88',opposition:'#5961c8'};
  const ASPECT_COPY={
    conjunction:['Conjunction','Two placements occupy nearly the same degree, concentrating their functions into one field of action.'],
    'semi-sextile':['Semi-Sextile','Two neighboring signs make a subtle adjustment that becomes useful through attention and practice.'],
    octile:['Octile','A forty-five-degree contact creates focused friction that asks for a precise change in approach.'],
    sextile:['Sextile','Two placements offer a cooperative opening that becomes useful through deliberate participation.'],
    quintile:['Quintile','A seventy-two-degree contact emphasizes creative patterning, craft, and intentional expression.'],
    square:['Square','Two placements meet at a right angle, producing pressure that asks for action, adjustment, and developed skill.'],
    trine:['Trine','Two placements move through compatible elemental pathways, making their exchange fluent and readily available.'],
    'tri-octile':['Tri-Octile','A one-hundred-thirty-five-degree contact intensifies a developing adjustment and asks for conscious action.'],
    'bi-quintile':['Bi-Quintile','A one-hundred-forty-four-degree contact develops creative coordination between two distinct functions.'],
    quincunx:['Quincunx','A one-hundred-fifty-degree contact joins unlike systems that require continuing calibration and translation.'],
    opposition:['Opposition','Two placements face one another across the zodiac, creating a polarity that asks for awareness, exchange, and balance.']
  };
  const MAJORS=[['the_emperor','The Emperor'],['the_hierophant','The Hierophant'],['the_lovers','The Lovers'],['the_chariot','The Chariot'],['strength','Strength'],['the_hermit','The Hermit'],['justice','Justice'],['death','Death'],['temperance','Temperance'],['the_devil','The Devil'],['the_star','The Star'],['the_moon','The Moon']];
  const DECANS=[
    [['two_of_wands','Two of Wands'],['three_of_wands','Three of Wands'],['four_of_wands','Four of Wands']],
    [['five_of_pentacles','Five of Pentacles'],['six_of_pentacles','Six of Pentacles'],['seven_of_pentacles','Seven of Pentacles']],
    [['eight_of_swords','Eight of Swords'],['nine_of_swords','Nine of Swords'],['ten_of_swords','Ten of Swords']],
    [['two_of_cups','Two of Cups'],['three_of_cups','Three of Cups'],['four_of_cups','Four of Cups']],
    [['five_of_wands','Five of Wands'],['six_of_wands','Six of Wands'],['seven_of_wands','Seven of Wands']],
    [['eight_of_pentacles','Eight of Pentacles'],['nine_of_pentacles','Nine of Pentacles'],['ten_of_pentacles','Ten of Pentacles']],
    [['two_of_swords','Two of Swords'],['three_of_swords','Three of Swords'],['four_of_swords','Four of Swords']],
    [['five_of_cups','Five of Cups'],['six_of_cups','Six of Cups'],['seven_of_cups','Seven of Cups']],
    [['eight_of_wands','Eight of Wands'],['nine_of_wands','Nine of Wands'],['ten_of_wands','Ten of Wands']],
    [['two_of_pentacles','Two of Pentacles'],['three_of_pentacles','Three of Pentacles'],['four_of_pentacles','Four of Pentacles']],
    [['five_of_swords','Five of Swords'],['six_of_swords','Six of Swords'],['seven_of_swords','Seven of Swords']],
    [['eight_of_cups','Eight of Cups'],['nine_of_cups','Nine of Cups'],['ten_of_cups','Ten of Cups']]
  ];
  const ALIASES={rising:'asc',ascendant:'asc',asc:'asc',ac:'asc',descendant:'dsc',dsc:'dsc',dc:'dsc',midheaven:'mc',mc:'mc','imum coeli':'ic',imumcoeli:'ic',ic:'ic',vertex:'vertex',vx:'vertex','north node':'north-node',node:'north-node','true node':'north-node','south node':'south-node',fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune'};
  const APPROVED_FALLBACKS=new Set(['chiron','north-node','south-node','part-of-fortune','vertex']);
  let mount=null,selectedIndex=null;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=value=>((Number(value)%360)+360)%360;

  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
  function source(payload){const known=[payload?.placements,payload?.positions,payload?.points,payload?.bodies].find(value=>value&&typeof value==='object'),value=known||payload||{};return Array.isArray(value)?value.map((item,index)=>[String(item?.name||item?.id||index),item]):Object.entries(value)}
  function longitude(item){if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);const sign=SIGNS.findIndex(name=>name.toLowerCase()===String(item?.sign||item?.zodiac||'').toLowerCase());return sign<0?NaN:norm(sign*30+Number(item.degree||item.degrees||0)+Number(item.minute||item.minutes||0)/60)}
  function canonical(key,item){
    const registry=window.RelphiGlyphRegistry;
    for(const candidate of [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]){
      if(!candidate)continue;const raw=String(candidate).trim(),entry=registry?.resolve?.(ALIASES[raw.toLowerCase()]||raw)||registry?.get?.(ALIASES[raw.toLowerCase()]||raw);
      if(entry?.asset||APPROVED_FALLBACKS.has(entry?.id))return entry;
    }
    return null;
  }
  function recordFor(slot,id,row){
    for(const [key,item] of source(read(KEYS[slot]))){if(!item||typeof item!=='object'||Array.isArray(item))continue;const entry=canonical(key,item),value=longitude(item);if(entry?.id===id&&Number.isFinite(value))return{id,entry,item,value,sky:slot,house:Number(row.dataset[slot==='A'?'leftHouse':'rightHouse']),sign:Number(row.dataset[slot==='A'?'leftSign':'rightSign'])}}
    return null;
  }
  function relationshipRow(index){return document.querySelector(`.sky-foundation-relationship-row[data-relation-index="${index}"]`)}
  function relationFromRow(index){
    const row=relationshipRow(index);if(!row)return null;
    const left=recordFor('A',row.dataset.leftPlacement,row),right=recordFor('B',row.dataset.rightPlacement,row),glyphs=row.querySelectorAll('svg');
    const aspectId=row.dataset.aspect||glyphs[1]?.getAttribute('aria-label')||'',orbMatch=row.getAttribute('aria-label')?.match(/orb\s+([\d.]+)/i);
    if(!left||!right||!ASPECT_COPY[aspectId])return null;
    return{index,row,left,right,aspect:{id:aspectId,color:ASPECT_COLORS[aspectId]},orb:Number(orbMatch?.[1]||0)};
  }
  function name(record){return record.entry.name}
  function position(record){const value=norm(record.value),sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.round((within-degree)*60)%60;return{sign,degree,label:`${degree}°${String(minute).padStart(2,'0')}′ ${SIGNS[sign]}`}}
  function cardFor(record){const p=position(record),decan=Math.min(2,Math.floor(p.degree/10)),[cardId,title]=DECANS[p.sign][decan],[majorId,majorTitle]=MAJORS[p.sign];return{cardId,title,majorId,majorTitle,sign:SIGNS[p.sign],decan:decan+1,image:`assets/tarot/rws/${cardId}.webp?v=border-preserving-crop-352`}}
  function aspectLabel(relation){return ASPECT_COPY[relation.aspect.id][0]}
  function point(longitude,radius=56){const angle=(Number(longitude)-90)*Math.PI/180;return{x:90+radius*Math.cos(angle),y:90+radius*Math.sin(angle)}}
  function diagramMarkup(relation,pA,pB){
    const a=point(relation.left.value),b=point(relation.right.value);
    return `<div class="sky-selected-aspect-diagram" aria-label="Isolated aspect diagram"><svg viewBox="0 0 180 180" role="img"><circle class="sky-selected-aspect-orbit" cx="90" cy="90" r="56"></circle><line class="sky-selected-aspect-radius" x1="90" y1="90" x2="${a.x.toFixed(2)}" y2="${a.y.toFixed(2)}"></line><line class="sky-selected-aspect-radius" x1="90" y1="90" x2="${b.x.toFixed(2)}" y2="${b.y.toFixed(2)}"></line><circle class="sky-selected-aspect-center" cx="90" cy="90" r="4"></circle><circle class="sky-selected-aspect-point sky-a" cx="${a.x.toFixed(2)}" cy="${a.y.toFixed(2)}" r="7"></circle><circle class="sky-selected-aspect-point sky-b" cx="${b.x.toFixed(2)}" cy="${b.y.toFixed(2)}" r="7"></circle></svg><p class="sky-selected-aspect-label sky-a"><span></span>Sky A · ${esc(name(relation.left))} ${esc(pA.label)}</p><p class="sky-selected-aspect-label sky-b"><span></span>Sky B · ${esc(name(relation.right))} ${esc(pB.label)}</p><strong>Orb ${relation.orb.toFixed(2)}°</strong></div>`;
  }
  function ensureMount(){
    if(mount?.isConnected)return mount;const relationships=document.getElementById('skyFoundationRelationships');if(!relationships)return null;
    mount=document.createElement('section');mount.id='skySelectedRelationship';mount.className='sky-selected-relationship';mount.hidden=true;mount.setAttribute('aria-label','Selected Relationship');mount.innerHTML='<h2 class="sky-selected-heading">Selected Relationship</h2><div class="sky-selected-body"></div>';relationships.insertAdjacentElement('afterend',mount);return mount;
  }
  async function draw(target,id,options,bubble){
    const registry=window.RelphiGlyphRegistry,component=window.RelphiGlyphComponent,entry=registry?.get?.(id)||registry?.resolve?.(id);
    if((!entry?.asset&&!APPROVED_FALLBACKS.has(entry?.id))||!(bubble?component?.createBubble:component?.draw)){target?.replaceChildren();if(target){target.classList.add('sky-selected-canonical-error');target.dataset.missingCanonicalGlyph=id||'unknown'}return}
    try{if(bubble){const result=component.createBubble(target,entry.id,options);await result.ready}else await component.draw(target,entry.id,options)}catch(_){target.replaceChildren();target.classList.add('sky-selected-canonical-error');target.dataset.missingCanonicalGlyph=entry.id}
  }
  function markSelected(index){document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]').forEach(row=>row.setAttribute('aria-current',Number(row.dataset.relationIndex)===index?'true':'false'));document.querySelectorAll('.sky-foundation-aspect[data-relation-index]').forEach(line=>line.dataset.selectedRelation=Number(line.dataset.relationIndex)===index?'true':'false')}
  function cardMarkup(slot,record,card){return `<article class="sky-selected-card" data-selected-card="${slot}"><p class="sky-selected-card-label">Sky ${slot} · ${esc(name(record))}</p><img src="${esc(card.image)}" alt="${esc(card.title)} card art"><h4>${esc(card.title)}</h4><p>${esc(card.sign)} · decan ${card.decan}<br>${esc(card.majorTitle)} governs the sign.</p></article>`}
  function copyFor(relation,a,b){const label=aspectLabel(relation),meaning=ASPECT_COPY[relation.aspect.id][1];return{meaning,cards:`${a.title} gives Sky A a ${a.sign} decan image; ${b.title} gives Sky B a ${b.sign} decan image. The cards are the visual vocabulary of the exact degrees involved, not replacements for the placements.`,synthesis:`Between ${name(relation.left)} in Sky A and ${name(relation.right)} in Sky B, the ${label.toLowerCase()} connects ${a.title} with ${b.title}. Notice where the two images reinforce one another, where they require translation, and what becomes possible when both are held in view.`}}
  async function render(index,initiator){
    const relation=relationFromRow(index),panel=ensureMount();if(!relation||!panel)return;
    selectedIndex=index;markSelected(index);panel.hidden=false;panel.dataset.relationIndex=String(index);panel.dataset.selectionSource=initiator;
    const body=panel.querySelector('.sky-selected-body'),pA=position(relation.left),pB=position(relation.right),cardA=cardFor(relation.left),cardB=cardFor(relation.right),copy=copyFor(relation,cardA,cardB),label=aspectLabel(relation);
    body.innerHTML=`<div class="sky-selected-graphic"><svg viewBox="0 0 360 130" role="img" aria-label="${esc(name(relation.left))} ${esc(label)} ${esc(name(relation.right))}"><line class="sky-selected-graphic-line" x1="78" y1="65" x2="282" y2="65" stroke="${relation.aspect.color}"></line><g data-selected-graphic-a transform="translate(78 65)"></g><g data-selected-graphic-aspect transform="translate(180 65)"></g><g data-selected-graphic-b transform="translate(282 65)"></g></svg></div><header class="sky-selected-facts"><h3>${esc(name(relation.left))} ${esc(label)} ${esc(name(relation.right))}</h3><p>Sky A ${esc(pA.label)} · Sky B ${esc(pB.label)} · Orb ${relation.orb.toFixed(2)}°</p></header><div class="sky-selected-cards">${cardMarkup('A',relation.left,cardA)}${diagramMarkup(relation,pA,pB)}${cardMarkup('B',relation.right,cardB)}</div><section class="sky-selected-progressive" aria-label="Progressive relationship interpretation"><details class="sky-selected-reveal" data-reveal-level="symbol"><summary>1 · See the relationship</summary><div class="sky-selected-reveal-content"><span class="sky-selected-reveal-glyph"><svg viewBox="-20 -20 40 40" aria-hidden="true"></svg></span><strong>${esc(label)}</strong><p>${esc(copy.meaning)}</p></div></details><details class="sky-selected-reveal" data-reveal-level="cards"><summary>2 · Read the two cards</summary><div class="sky-selected-reveal-content"><p>${esc(copy.cards)}</p></div></details><details class="sky-selected-reveal" data-reveal-level="synthesis"><summary>3 · Bring the relationship together</summary><div class="sky-selected-reveal-content"><p>${esc(copy.synthesis)}</p></div></details></section>`;
    const graphic=body.querySelector('.sky-selected-graphic svg');
    await Promise.allSettled([draw(graphic.querySelector('[data-selected-graphic-a]'),relation.left.id,{radius:20,padding:1,color:COLORS.A,fill:'#fffdf8',strokeWidth:2.4},true),draw(graphic.querySelector('[data-selected-graphic-aspect]'),relation.aspect.id,{radius:18,padding:1,color:relation.aspect.color,fill:'#fffdf8',strokeWidth:2.2},true),draw(graphic.querySelector('[data-selected-graphic-b]'),relation.right.id,{radius:20,padding:1,color:COLORS.B,fill:'#fffdf8',strokeWidth:2.4},true),draw(body.querySelector('[data-reveal-level="symbol"] svg'),relation.aspect.id,{radius:15,padding:1,color:relation.aspect.color},false)]);
    panel.scrollIntoView({behavior:'smooth',block:'nearest'});window.dispatchEvent(new CustomEvent('relphi:selected-relationship-rendered',{detail:{index,relation,source:initiator}}));
  }
  function indexFrom(node){const value=Number(node?.dataset?.relationIndex);return Number.isInteger(value)?value:null}
  document.addEventListener('click',event=>{const row=event.target.closest?.('.sky-foundation-relationship-row[data-relation-index]');if(!row)return;const index=indexFrom(row);if(index==null)return;queueMicrotask(()=>render(index,'relationship-list'))});
  function onReady(){ensureMount();if(selectedIndex!=null&&relationshipRow(selectedIndex))render(selectedIndex,'foundation-rerender')}
  window.addEventListener('relphi:sky-foundation-ready',onReady);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(ensureMount,0),{once:true});else setTimeout(ensureMount,0);
})();
