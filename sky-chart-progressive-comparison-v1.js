// Progressive symbolic reading: glyph -> name -> referent. No duplicate prose layer.
(function(){
  'use strict';
  if(window.__relphiSkyProgressiveComparisonV2)return;
  window.__relphiSkyProgressiveComparisonV2=true;
  window.__relphiSkyProgressiveComparisonV1=true;

  const NS='http://www.w3.org/2000/svg';
  const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const SIGN_REFERENTS={
    Aries:'initiative, directness, courage, impulse, and beginning',
    Taurus:'embodiment, value, pleasure, endurance, and material continuity',
    Gemini:'language, exchange, curiosity, movement, and multiplicity',
    Cancer:'care, protection, memory, belonging, and attachment',
    Leo:'radiance, creativity, pride, loyalty, and recognition',
    Virgo:'discernment, service, refinement, repair, and usefulness',
    Libra:'relationship, balance, fairness, dialogue, and mutual recognition',
    Scorpio:'intensity, secrecy, survival, bonding, and emotional truth',
    Sagittarius:'meaning, faith, exploration, philosophy, and freedom',
    Capricorn:'structure, responsibility, endurance, mastery, and worldly form',
    Aquarius:'systems, reform, collective intelligence, detachment, and future orientation',
    Pisces:'surrender, imagination, compassion, permeability, and release'
  };
  const PLACEMENT_REFERENTS={
    sun:'identity, vitality, and conscious purpose',moon:'feelings, instincts, memory, and emotional needs',mercury:'thought, perception, language, and communication',venus:'values, attraction, affection, pleasure, and relating',mars:'drive, assertion, desire, conflict, and action',jupiter:'growth, confidence, meaning, opportunity, and expansion',saturn:'structure, limits, responsibility, time, and commitment',uranus:'freedom, disruption, originality, awakening, and change',neptune:'imagination, sensitivity, surrender, ideals, and vision',pluto:'power, depth, compulsion, elimination, and transformation',chiron:'wounding, healing intelligence, and the capacity to guide healing',asc:'the way a person enters life and is immediately perceived',dsc:'the way a person meets partners and encounters the other',mc:'public direction, vocation, visibility, and the role a person grows toward',ic:'roots, home, private foundations, and inherited belonging','north-node':'growth through unfamiliar experience and developing capacity','south-node':'familiar patterns, inherited capacity, and the known path',lilith:'instinctive autonomy, refusal, exile, and uncompromised desire','part-of-fortune':'the meeting place of body, feeling, circumstance, and ease',vertex:'encounters that feel consequential or outside ordinary control'
  };
  const ASPECTS={
    conjunction:['Conjunction','a concentrated relationship in which the two functions operate together'],
    'semi-sextile':['Semi-Sextile','a subtle 30° relationship that asks neighboring functions to accommodate one another'],
    octile:['Octile','a 45° relationship of focused friction and adjustment'],
    sextile:['Sextile','a cooperative 60° opening that becomes useful through participation'],
    quintile:['Quintile','a creative 72° relationship associated with pattern-making and specialized skill'],
    square:['Square','a 90° relationship of activating pressure and development'],
    trine:['Trine','a flowing 120° relationship that supports low-resistance exchange'],
    'tri-octile':['Tri-Octile','a 135° relationship of accumulated friction and redirection'],
    'bi-quintile':['Bi-Quintile','a creative 144° relationship associated with refined pattern-making'],
    quincunx:['Quincunx','a 150° relationship that requires continuing adjustment and translation'],
    opposition:['Opposition','a 180° polarity that creates awareness through contrast and exchange']
  };
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
  const norm=value=>((Number(value)%360)+360)%360;
  const signFor=record=>SIGNS[Math.floor(norm(record.value)/30)];

  function token(spec){
    return `<span class="sky-progressive-token" data-progressive-stage="glyph" data-progressive-field="${esc(spec.field)}" data-progressive-glyph-id="${esc(spec.glyphId)}"><button type="button" class="sky-progressive-level sky-progressive-glyph" data-progressive-level="glyph" aria-label="Reveal ${esc(spec.name)}" aria-expanded="false"><span class="sky-progressive-canonical-slot" aria-hidden="true"></span></button><button type="button" class="sky-progressive-level sky-progressive-name" data-progressive-level="name" aria-label="Reveal the referent of ${esc(spec.name)}" aria-expanded="false" hidden>${esc(spec.name)}</button><button type="button" class="sky-progressive-level sky-progressive-meaning" data-progressive-level="meaning" aria-label="Referent of ${esc(spec.name)}" hidden>${esc(spec.referent)}</button></span>`;
  }

  function symbolicReading(relation){
    const signA=signFor(relation.left),signB=signFor(relation.right),aspect=ASPECTS[relation.aspect.id]||[relation.aspect.id,'a measured relationship between the two placements'];
    return `<div class="sky-progressive-reading sky-progressive-symbolic"><div class="sky-progressive-symbol-row"><div class="sky-progressive-symbol-side sky-a" aria-label="Sky A symbols">${token({field:'A-placement',glyphId:relation.left.id,name:relation.left.entry.name,referent:PLACEMENT_REFERENTS[relation.left.id]||'a calculated point in Sky A'})}${token({field:'A-sign',glyphId:signA.toLowerCase(),name:signA,referent:SIGN_REFERENTS[signA]})}</div><div class="sky-progressive-symbol-aspect" aria-label="Relationship symbol">${token({field:'aspect',glyphId:relation.aspect.id,name:aspect[0],referent:aspect[1]})}</div><div class="sky-progressive-symbol-side sky-b" aria-label="Sky B symbols">${token({field:'B-placement',glyphId:relation.right.id,name:relation.right.entry.name,referent:PLACEMENT_REFERENTS[relation.right.id]||'a calculated point in Sky B'})}${token({field:'B-sign',glyphId:signB.toLowerCase(),name:signB,referent:SIGN_REFERENTS[signB]})}</div></div></div>`;
  }

  async function drawGlyph(host){
    const id=host.dataset.progressiveGlyphId,slot=host.querySelector('.sky-progressive-canonical-slot');
    const registry=window.RelphiGlyphRegistry,component=window.RelphiGlyphComponent,entry=registry&&(registry.get(id)||registry.resolve(id));
    if(!slot||!entry||!component?.createBubble){host.dataset.glyphUnavailable='true';return}
    const svg=document.createElementNS(NS,'svg');
    svg.setAttribute('viewBox','-32 -32 64 64');
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    svg.setAttribute('aria-hidden','true');
    slot.replaceChildren(svg);
    const field=host.dataset.progressiveField;
    const color=field==='A-placement'||field==='A-sign'?'#c9211e':field==='B-placement'||field==='B-sign'?'#2462d0':'#191714';
    const bubble=component.createBubble(svg,entry.id,{radius:19,padding:1,color});
    bubble.circle.style.opacity='0';
    bubble.circle.setAttribute('aria-hidden','true');
    await bubble.ready;
    host.dataset.canonicalProgressiveGlyph='true';
  }

  async function render(event){
    const relation=event.detail?.relation,panel=document.getElementById('skySelectedRelationship'),old=panel?.querySelector('.sky-selected-progressive');
    if(!relation||!old)return;
    const section=document.createElement('section');
    section.className='sky-selected-progressive';
    section.setAttribute('aria-label','Progressive comparison reading');
    section.innerHTML=symbolicReading(relation);
    old.replaceWith(section);
    await Promise.allSettled(Array.from(section.querySelectorAll('[data-progressive-glyph-id]')).map(drawGlyph));
    window.dispatchEvent(new CustomEvent('relphi:sky-progressive-symbols-ready',{detail:{relation}}));
  }

  window.addEventListener('relphi:selected-relationship-rendered',render);
})();
