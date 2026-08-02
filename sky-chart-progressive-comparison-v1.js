// Progressive symbolic reading for the selected dual-card relationship.
(function(){
  'use strict';
  if(window.__relphiSkyProgressiveComparisonV1)return;
  window.__relphiSkyProgressiveComparisonV1=true;

  const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const SIGN_MEANINGS={
    Aries:'initiative, directness, courage, impulse, and beginning',Taurus:'embodiment, value, pleasure, endurance, and material continuity',Gemini:'language, exchange, curiosity, movement, and multiplicity',Cancer:'care, protection, memory, belonging, and attachment',Leo:'radiance, creativity, pride, loyalty, and recognition',Virgo:'discernment, service, refinement, repair, and usefulness',Libra:'relationship, balance, fairness, dialogue, and mutual recognition',Scorpio:'intensity, secrecy, survival, bonding, and emotional truth',Sagittarius:'meaning, faith, exploration, philosophy, and freedom',Capricorn:'structure, responsibility, endurance, mastery, and worldly form',Aquarius:'systems, reform, collective intelligence, detachment, and future orientation',Pisces:'surrender, imagination, compassion, permeability, and release'
  };
  const PLACEMENT_MEANINGS={
    sun:'identity, vitality, and conscious purpose',moon:'feelings, instincts, and emotional needs',mercury:'thought, perception, and communication',venus:'values, attraction, affection, and relating',mars:'drive, assertion, desire, and action',jupiter:'growth, confidence, meaning, and expansion',saturn:'structure, limits, responsibility, and commitment',uranus:'freedom, disruption, originality, and change',neptune:'imagination, sensitivity, surrender, and vision',pluto:'power, depth, transformation, and compulsion',chiron:'the wound, the healing intelligence developed around it, and the capacity to guide healing',asc:'the way a person enters life, meets the world, and is immediately perceived',dsc:'the way a person meets partners and encounters the other',mc:'public direction, vocation, visibility, and the role a person grows toward',ic:'roots, home, private foundations, and inherited belonging','north-node':'growth through unfamiliar experience and developing capacity','south-node':'familiar patterns, inherited capacity, and the known path',lilith:'instinctive autonomy, refusal, exile, and uncompromised desire','part-of-fortune':'the meeting place of body, feeling, circumstance, and ease',vertex:'encounters that feel consequential, fated, or outside ordinary control'
  };
  const HOUSE_NAMES=['First House','Second House','Third House','Fourth House','Fifth House','Sixth House','Seventh House','Eighth House','Ninth House','Tenth House','Eleventh House','Twelfth House'];
  const HOUSE_MEANINGS=['identity, embodiment, approach, and first impressions','resources, values, possessions, and self-support','learning, language, siblings, and the immediate environment','home, roots, ancestry, and private foundations','creativity, pleasure, play, children, and self-expression','daily work, service, practice, health, and maintenance','partnership, agreements, exchange, and the encountered other','shared resources, intimacy, loss, inheritance, and transformation','worldview, faith, higher learning, travel, and meaning','vocation, public life, responsibility, and visible contribution','friends, groups, networks, hopes, and collective futures','retreat, endings, dreams, hidden life, and surrender'];
  const ASPECTS={
    conjunction:['Conjunction','a concentrated relationship in which the two functions operate together and intensify one another'],'semi-sextile':['Semi-Sextile','a subtle relationship that asks neighboring functions to notice and accommodate one another'],octile:['Octile','a focused friction that presses for action and a precise change in approach'],sextile:['Sextile','a cooperative opening that becomes useful through deliberate participation'],quintile:['Quintile','a creative relationship that supports specialized talent and intentional pattern-making'],square:['Square','a tense, activating relationship that demands movement, effort, and development'],trine:['Trine','a flowing, low-resistance relationship in which the two functions support one another naturally'],'tri-octile':['Tri-Octile','an intensified friction that presses a developing adjustment into expression'],'bi-quintile':['Bi-Quintile','a creative relationship that supports refined skill and unusual synthesis'],quincunx:['Quincunx','an awkward but productive relationship that requires continuing adjustment and translation'],opposition:['Opposition','a polarized relationship that creates awareness through contrast, mirroring, and negotiation']
  };
  const ASPECT_LANGUAGE={
    conjunction:['joins','in'],'semi-sextile':['gently nudges','toward accommodation through'],octile:['applies focused pressure to','through'],sextile:['opens a cooperative path to','through'],quintile:['shapes a creative pattern with','through'],square:['presses against','through'],trine:['flows easily with','through'],'tri-octile':['intensifies the pressure on','through'],'bi-quintile':['refines an unusual synthesis with','through'],quincunx:['keeps adjusting to','through'],opposition:['faces and mirrors','across']
  };
  const DURATION={
    moon:['Several hours','The Moon moves quickly, so its closest transit passage is usually contained within part of a day.'],mercury:['Several days','Mercury moves quickly; the closest passage is usually strongest for hours to a day.'],venus:['Several days','Venus moves quickly; the closest passage is usually strongest for about a day.'],sun:['Several days','The Sun moves steadily; the closest passage is usually strongest for about a day.'],mars:['One to several weeks','Mars develops a transit over days and can keep the closest passage active for several days.'],jupiter:['Several weeks to a few months','Jupiter develops a transit slowly, and the closest passage can remain active for weeks.'],saturn:['Several months','Saturn develops a structural transit slowly, and the closest passage can remain active for weeks.'],uranus:['Many months','Uranus moves slowly; repeated exact passages may extend the story beyond a year.'],neptune:['Many months','Neptune moves slowly; repeated exact passages may extend the story beyond a year.'],pluto:['Many months','Pluto moves slowly; repeated exact passages may extend the story beyond a year.']
  };
  const APPROVED_FALLBACKS=new Set(['chiron','north-node','south-node','part-of-fortune','vertex']);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const norm=value=>((Number(value)%360)+360)%360;

  function read(slot){try{return JSON.parse(localStorage.getItem(slot==='A'?'relphiSkyChartA':'relphiSkyChartB')||'null')}catch(_){return null}}
  function signFor(record){return SIGNS[Math.floor(norm(record.value)/30)]}
  function movingSlot(){
    const a=String(read('A')?.name||''),b=String(read('B')?.name||''),dynamic=/planetary hours|transit|current sky|\bnow\b/i,staticSky=/birth|natal|static/i;
    if(dynamic.test(a)!==dynamic.test(b))return dynamic.test(a)?'A':'B';
    if(staticSky.test(a)!==staticSky.test(b))return staticSky.test(a)?'B':'A';
    try{const roles=window.RelphiSkyRoles||JSON.parse(localStorage.getItem('relphiSkyChartRoles')||'null');if(roles?.chart==='dynamic'&&roles?.currentSky!=='dynamic')return'A';if(roles?.currentSky==='dynamic'&&roles?.chart!=='dynamic')return'B'}catch(_){}
    return'B';
  }
  function durationFor(relation){
    const slot=movingSlot(),record=slot==='A'?relation.left:relation.right,known=DURATION[record.id];
    if(known)return{name:known[0],meaning:`${record.entry.name} in Sky ${slot} is the moving placement. ${known[1]}`};
    return{name:'Variable timing',meaning:`${record.entry.name} in Sky ${slot} is the moving point. Its timing depends on the chart time, location, or cycle used to calculate it.`};
  }
  function token(spec){
    const glyph=spec.glyphId?'<svg viewBox="-20 -20 40 40" aria-hidden="true"></svg>':`<span aria-hidden="true">${esc(spec.symbol)}</span>`;
    return `<span class="sky-progressive-token" data-progressive-stage="glyph"${spec.field?` data-progressive-field="${esc(spec.field)}"`:''}${spec.glyphId?` data-progressive-glyph-id="${esc(spec.glyphId)}"`:''}><button type="button" class="sky-progressive-level sky-progressive-glyph" data-progressive-level="glyph" aria-label="Reveal ${esc(spec.name)}" aria-expanded="false">${glyph}</button><button type="button" class="sky-progressive-level sky-progressive-name" data-progressive-level="name" aria-label="Reveal what ${esc(spec.name)} stands for" aria-expanded="false" hidden>${esc(spec.name)}</button><button type="button" class="sky-progressive-level sky-progressive-meaning" data-progressive-level="meaning" aria-label="Meaning of ${esc(spec.name)}" hidden>(${esc(spec.meaning)})</button></span>`;
  }
  function side(slot,record){
    const sign=signFor(record),house=Math.max(1,Math.min(12,Number(record.house)||1));
    return `<article class="sky-progressive-side" data-progressive-sky="${slot}"><h4>Sky ${slot}</h4><dl><div><dt>Placement</dt><dd>${token({glyphId:record.id,name:record.entry.name,meaning:PLACEMENT_MEANINGS[record.id]||'a calculated point in this sky'})}</dd></div><div><dt>Sign</dt><dd>${token({glyphId:sign.toLowerCase(),name:sign,meaning:SIGN_MEANINGS[sign]})}</dd></div><div><dt>House</dt><dd>${token({symbol:`H${house}`,name:HOUSE_NAMES[house-1],meaning:HOUSE_MEANINGS[house-1]})}</dd></div></dl></article>`;
  }
  function relationship(relation){
    const aspect=ASPECTS[relation.aspect.id]||[relation.aspect.id,'a measured relationship between the two placements'],duration=durationFor(relation),orb=relation.orb.toFixed(2);
    return `<article class="sky-progressive-relationship"><h4>Relationship</h4><dl><div><dt>Aspect</dt><dd>${token({glyphId:relation.aspect.id,name:aspect[0],meaning:aspect[1]})}</dd></div><div><dt>Orb</dt><dd>${token({symbol:'±',name:`Orb ${orb}°`,meaning:`The placements are ${orb} degrees from an exact ${aspect[0].toLowerCase()}. A smaller orb is closer to exact.`})}</dd></div><div><dt>Transit length</dt><dd>${token({symbol:'Δt',name:duration.name,meaning:duration.meaning})}</dd></div></dl></article>`;
  }
  function placementPhrase(slot,record){
    const sign=signFor(record),house=Math.max(1,Math.min(12,Number(record.house)||1));
    return `${token({field:`${slot}-placement`,glyphId:record.id,name:record.entry.name,meaning:PLACEMENT_MEANINGS[record.id]||'a calculated point in this sky'})} in ${token({field:`${slot}-sign`,glyphId:sign.toLowerCase(),name:sign,meaning:`sign: ${SIGN_MEANINGS[sign]}`})} and ${token({field:`${slot}-house`,symbol:`H${house}`,name:HOUSE_NAMES[house-1],meaning:`house: ${HOUSE_MEANINGS[house-1]}`})}`;
  }
  function proseReading(relation){
    const aspect=ASPECTS[relation.aspect.id]||[relation.aspect.id,'a measured relationship between the two placements'],language=ASPECT_LANGUAGE[relation.aspect.id]||['relates to','through'],duration=durationFor(relation),orb=relation.orb.toFixed(2);
    return `<p class="sky-progressive-reading">In Sky A, ${placementPhrase('A',relation.left)} ${language[0]} ${placementPhrase('B',relation.right)} in Sky B ${language[1]} ${token({field:'aspect',glyphId:relation.aspect.id,name:aspect[0],meaning:`aspect: ${aspect[1]}`})}. Their ${token({field:'orb',symbol:'\u00b1',name:`orb of ${orb} degrees`,meaning:`the placements are ${orb} degrees from exact; a smaller orb is closer to exact`})} shows how closely the pattern is aligned. The likely transit length is ${token({field:'transit-length',symbol:'\u0394t',name:duration.name,meaning:duration.meaning})}.</p>`;
  }
  function setStage(tokenNode,stage){
    const rank={glyph:0,name:1,meaning:2},value=rank[stage]??0;tokenNode.dataset.progressiveStage=stage;
    tokenNode.querySelector('[data-progressive-level="name"]').hidden=value<1;tokenNode.querySelector('[data-progressive-level="meaning"]').hidden=value<2;
    tokenNode.querySelector('[data-progressive-level="glyph"]').setAttribute('aria-expanded',value>0?'true':'false');tokenNode.querySelector('[data-progressive-level="name"]').setAttribute('aria-expanded',value>1?'true':'false');
  }
  function bind(section){
    section.addEventListener('click',event=>{const button=event.target.closest?.('[data-progressive-level]');if(!button)return;event.stopPropagation();const host=button.closest('.sky-progressive-token'),rank={glyph:0,name:1,meaning:2},current=rank[host.dataset.progressiveStage]??0,clicked=rank[button.dataset.progressiveLevel]??0;setStage(host,clicked<current?button.dataset.progressiveLevel:(clicked<2?['name','meaning'][clicked]: 'meaning'))});
  }
  async function draw(section){
    const component=window.RelphiGlyphComponent,registry=window.RelphiGlyphRegistry;
    await Promise.allSettled(Array.from(section.querySelectorAll('[data-progressive-glyph-id]')).map(async host=>{const id=host.dataset.progressiveGlyphId,entry=registry?.get?.(id)||registry?.resolve?.(id),svg=host.querySelector('svg');if((!entry?.asset&&!APPROVED_FALLBACKS.has(entry?.id))||!component?.draw){host.dataset.missingCanonicalGlyph=id;return}try{await component.draw(svg,entry.id,{radius:14,padding:1,color:'#191714'})}catch(_){host.dataset.missingCanonicalGlyph=id}}));
  }
  async function render(event){
    const relation=event.detail?.relation,panel=document.getElementById('skySelectedRelationship'),old=panel?.querySelector('.sky-selected-progressive');if(!relation||!old)return;
    const section=document.createElement('section');section.className='sky-selected-progressive';section.setAttribute('aria-label','Progressive comparison reading');section.innerHTML=`${proseReading(relation)}<p class="sky-progressive-hint">Select symbols to unfold them; select an earlier revealed level to fold back to it.</p>`;old.replaceWith(section);bind(section);await draw(section);
  }
  window.addEventListener('relphi:selected-relationship-rendered',render);
})();
