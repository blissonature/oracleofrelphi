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
  {id:'grand-sextile',label:'Grand Sextile / Star of David',vertices:6},
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
const CONFIG_PLACEMENT_MEANING=Object.freeze({
  sun:'identity and conscious purpose',
  moon:'feeling, instinct, memory, and emotional need',
  mercury:'thought, perception, language, and communication',
  venus:'values, attraction, affection, pleasure, and relating',
  mars:'drive, assertion, desire, conflict, and action',
  jupiter:'growth, confidence, meaning, opportunity, and expansion',
  saturn:'structure, limits, responsibility, time, and commitment',
  uranus:'freedom, disruption, originality, awakening, and change',
  neptune:'imagination, sensitivity, surrender, ideals, and vision',
  pluto:'power, depth, compulsion, elimination, and transformation',
  chiron:'wounding, healing intelligence, and the capacity to guide healing',
  asc:'the way experience is entered and immediately embodied',
  dsc:'the way the other is met in relationship and encounter',
  mc:'public direction, vocation, visibility, and the role being grown toward',
  ic:'roots, home, private foundations, and inherited belonging',
  'north-node':'growth through unfamiliar experience and developing capacity',
  'south-node':'familiar patterns, inherited capacity, and the known path',
  lilith:'instinctive autonomy, refusal, exile, and uncompromised desire',
  'part-of-fortune':'the meeting place of body, feeling, circumstance, and ease',
  vertex:'encounters that feel consequential or outside ordinary control',
  'anti-vertex':'what becomes accessible through the back door'
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
function placementWord(id){const entry=window.RelphiGlyphRegistry?.get?.(id)||window.RelphiGlyphRegistry?.resolve?.(id);return entry?.name||String(id||'').replace(/-/g,' ').replace(/\b\w/g,letter=>letter.toUpperCase())}
function vertexLabel(key){const [sky,id]=String(key||'').split(':');return{sky,id,label:placementLabel(id)}}
function patternScopeLabel(pattern){const scope=patternScope(pattern);return SCOPES.find(item=>item.id===scope)?.label||scope}
function structureText(pattern){return CONFIG_STRUCTURE[pattern.type]||'a compound aspect pattern'}
function configurationFunction(key){
  const item=vertexLabel(key),meaning=CONFIG_PLACEMENT_MEANING[item.id]||'this function';
  return{...item,meaning,name:item.label};
}
function joinedFunctions(keys){
  const items=keys.map(configurationFunction);
  if(items.length===1)return items[0].meaning;
  if(items.length===2)return items[0].meaning+' and '+items[1].meaning;
  return items.slice(0,-1).map(item=>item.meaning).join(', ')+', and '+items.at(-1).meaning;
}
function interpretationText(pattern){
  const apex=pattern.apex&&pattern.vertices.includes(pattern.apex)?pattern.apex:null;
  const apexInfo=apex?configurationFunction(apex):null;
  const bases=apex?pattern.vertices.filter(key=>key!==apex):pattern.vertices;
  if(pattern.type==='t-square'&&apexInfo)return 'The polarity between '+joinedFunctions(bases)+' discharges through '+apexInfo.meaning+'. The apex becomes the place where that opposition demands action, adaptation, or development.';
  if(pattern.type==='yod'&&apexInfo)return joinedFunctions(bases)+' form the supporting base, while both require continuing adjustment through '+apexInfo.meaning+'. The apex becomes the point where those different demands must be translated into one response.';
  if(pattern.type==='thors-hammer'&&apexInfo)return 'Friction between '+joinedFunctions(bases)+' is concentrated through '+apexInfo.meaning+'. The apex becomes the pressure point where accumulated tension is forced into a sharper redirection.';
  if(pattern.type==='minor-grand-trine'&&apexInfo)return joinedFunctions(bases)+' provide an existing channel of ease that becomes usable through '+apexInfo.meaning+', giving the pattern a practical outlet.';
  if(pattern.type==='grand-trine')return joinedFunctions(pattern.vertices)+' form a self-reinforcing circuit of low-resistance exchange, making these functions especially available to one another.';
  if(pattern.type==='grand-cross')return joinedFunctions(pattern.vertices)+' form two opposing axes locked together by squares, distributing pressure across all four functions and continually forcing movement among competing demands.';
  if(pattern.type==='mystic-rectangle')return joinedFunctions(pattern.vertices)+' hold two polarities inside a network of trines and sextiles, giving the tensions several routes for exchange and integration.';
  if(pattern.type==='cradle')return joinedFunctions(pattern.vertices)+' hold an opposition inside a supportive web of trines and sextiles, preserving the polarity while distributing it through lower-resistance pathways.';
  if(pattern.type==='grand-sextile')return joinedFunctions(pattern.vertices)+' form a dense six-point network of sextiles, trines, and oppositions, offering many routes for exchange while preserving three opposing axes.';
  return CONFIG_INTERPRETATION[pattern.type]||'A compound relationship pattern formed by several aspect edges operating together.';
}
function miniConfigurationMarkup(pattern,{compact=false,interactive=true}={}){
  const records=new Map(pattern.vertices.map(key=>[key,resultVertexRecord(key)]).filter(([,record])=>record));
  const lines=pattern.edges.map(edge=>{
    const left=records.get(edge.left),right=records.get(edge.right);if(!left||!right)return'';
    const a=resultPoint(left.value),b=resultPoint(right.value),stroke=RESULT_ASPECT_COLORS[edge.aspect]||'#777';
    return'<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" class="sky-configuration-mini-aspect" data-aspect="'+edge.aspect+'" style="stroke:'+stroke+'"/>';
  }).join('');
  const radii=[...records.values()].map(record=>{const p=resultPoint(record.value),color=RESULT_COLORS[record.sky]||'#777';return'<line x1="60" y1="60" x2="'+p.x+'" y2="'+p.y+'" class="sky-configuration-mini-radius" style="stroke:'+color+'"/>'}).join('');
  const classes='sky-configuration-mini-wheel'+(compact?' is-compact':'');
  const attrs=interactive?' role="button" tabindex="0" aria-label="Configuration diagram"':' aria-hidden="true"';

  // Preserve the compact data-derived thumbnail exactly as designed before
  // inscribed glyph experiments: colored sky vertices with A/B labels.
  if(compact){
    const points=[...records.values()].map(record=>{
      const p=resultPoint(record.value),color=RESULT_COLORS[record.sky]||'#777';
      return'<g class="sky-configuration-mini-point" data-sky="'+record.sky+'"><circle cx="'+p.x+'" cy="'+p.y+'" r="4.7" style="fill:'+color+';stroke:'+color+'"/><text x="'+p.x+'" y="'+(p.y+.4)+'" text-anchor="middle" dominant-baseline="middle">'+record.sky+'</text></g>';
    }).join('');
    return'<div class="'+classes+'"'+attrs+'><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="47" class="sky-configuration-mini-ring"/>'+radii+lines+points+'</svg></div>';
  }

  // Expanded diagrams keep geometry in the 120×120 SVG, but canonical
  // inscribed vertices live in screen space so wheel scaling cannot alter them.
  const vertices=[...records.values()].map(record=>{
    const p=resultPoint(record.value),left=(p.x/120*100).toFixed(4),top=(p.y/120*100).toFixed(4);
    return'<span class="sky-configuration-vertex-host" data-canonical-placement="'+record.id+'" data-sky="'+record.sky+'" style="left:'+left+'%;top:'+top+'%"></span>';
  }).join('');
  return'<div class="'+classes+'"'+attrs+'><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="47" class="sky-configuration-mini-ring"/>'+radii+lines+'</svg><span class="sky-configuration-vertex-layer" aria-hidden="true">'+vertices+'</span></div>';
}

async function paintConfigurationMiniGlyphs(root){
  if(!root)return;
  const templates=window.RelphiRelationshipGlyphTemplates;
  if(!templates?.clone)return;
  const colors=templates.colors||RESULT_COLORS;
  for(const host of root.querySelectorAll('.sky-configuration-vertex-host[data-canonical-placement]')){
    if(host.dataset.canonicalGlyphReady==='true')continue;
    const id=String(host.dataset.canonicalPlacement||''),sky=String(host.dataset.sky||'A').toUpperCase(),color=colors?.[sky]||RESULT_COLORS[sky]||RESULT_COLORS.A;
    if(!id)continue;
    let glyph=null;
    try{glyph=await templates.clone(id,color)}catch(error){console.error('[Sky Chart] Relationship canonical glyph clone failed:',id,error)}
    if(!glyph)continue;
    // Relationships already owns the canonical master framing and exact display scale.
    // For Configuration vertices, reveal the canonical inscription circle that the
    // Relationships presentation intentionally hides. Do not refit or rescale the art.
    glyph.querySelectorAll('.relphi-glyph-bubble>circle').forEach(circle=>{
      circle.style.opacity='1';
      circle.removeAttribute('aria-hidden');
    });
    glyph.dataset.configurationInscribedClone='true';
    host.replaceChildren(glyph);
    host.dataset.canonicalGlyphReady='true';
  }
}
function aspectColorRail(pattern){
  const seen=[];
  pattern.edges.forEach(edge=>{const color=RESULT_ASPECT_COLORS[edge.aspect]||'#777';if(!seen.some(item=>item.aspect===edge.aspect))seen.push({aspect:edge.aspect,color})});
  return'<span class="sky-configuration-result-color-rail" aria-hidden="true">'+seen.map(item=>'<i data-aspect="'+item.aspect+'" style="background:'+item.color+'"></i>').join('')+'</span>';
}
function ensureResultsPanel(){
  const relationships=document.getElementById('skyFoundationRelationships'),comparison=document.getElementById('skyFoundationComparison');if(!relationships||!comparison)return null;
  let panel=document.getElementById(RESULT_PANEL_ID);
  if(!panel){panel=document.createElement('section');panel.id=RESULT_PANEL_ID;panel.className='sky-configuration-results-panel';panel.setAttribute('aria-label','Configuration matches');panel.innerHTML='<header class="sky-configuration-results-heading"><h2>Configurations</h2><span class="sky-configuration-results-actions"><span class="sky-configuration-results-count" aria-live="polite"></span><button type="button" class="sky-configuration-copy-button">Copy</button><button type="button" class="sky-configuration-download-button" aria-label="Download visible configurations as PNG" title="Download visible configurations as PNG"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3v11m0 0-4-4m4 4 4-4M5 15v4h14v-4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg></button></span></header><div class="sky-configuration-results-grid"></div>'}
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
function nestedConfigurationMarkup(pattern){
  if(!pattern.nested?.length)return'';
  return'<div class="sky-configuration-nested"><strong>Contained configurations</strong><div class="sky-configuration-nested-list">'+pattern.nested.map(child=>{
    const label=TYPE_MAP.get(child.type)?.label||child.type;
    const exact=Number.isFinite(child.maxPhase)?child.maxPhase.toFixed(2)+'°':'';
    return'<span class="sky-configuration-nested-item" data-type="'+child.type+'"><b>'+label+'</b><small>'+exact+'</small></span>';
  }).join('')+'</div></div>';
}
function groupedPatternsForResults(){
  const groups=new Map();
  patternsForResults().forEach(pattern=>{
    if(!groups.has(pattern.type))groups.set(pattern.type,[]);
    groups.get(pattern.type).push(pattern);
  });
  return [...groups.entries()].map(([type,matches])=>({
    type,
    matches:matches.slice().sort((a,b)=>a.maxPhase-b.maxPhase||a.meanPhase-b.meanPhase),
    representative:matches.slice().sort((a,b)=>a.maxPhase-b.maxPhase||a.meanPhase-b.meanPhase)[0]
  })).sort((a,b)=>a.representative.maxPhase-b.representative.maxPhase||a.representative.meanPhase-b.representative.meanPhase);
}
function configurationMatchLabel(pattern){
  return pattern.vertices.map(key=>placementWord(vertexLabel(key).id)).join(' · ');
}
function configurationMatchRow(pattern,index){
  const button=document.createElement('button');
  button.type='button';
  button.className='sky-configuration-match-row';
  button.dataset.configurationMatch=pattern.key;

  const placements=document.createElement('span');
  placements.className='sky-configuration-match-placements';
  pattern.vertices.forEach(key=>{
    const item=vertexLabel(key);
    const glyph=document.createElement('span');
    glyph.className='sky-configuration-match-glyph';
    glyph.dataset.canonicalPlacement=item.id;
    glyph.dataset.sky=item.sky;
    glyph.setAttribute('aria-label','Sky '+item.sky+' '+placementWord(item.id));
    placements.appendChild(glyph);
  });

  const meta=document.createElement('span');
  meta.className='sky-configuration-match-meta';
  const scope=document.createElement('span');
  scope.textContent=patternScopeLabel(pattern);
  const exact=document.createElement('span');
  exact.textContent=Number.isFinite(pattern.maxPhase)?pattern.maxPhase.toFixed(2)+'°':'';
  meta.append(scope,exact);
  button.append(placements,meta);
  button.setAttribute('aria-label','Match '+(index+1)+': '+configurationMatchLabel(pattern)+', '+patternScopeLabel(pattern)+(exact.textContent?', '+exact.textContent:''));

  button.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();
    const tile=button.closest('.sky-configuration-result-tile');
    if(!tile)return;
    selectConfigurationMatch(tile,pattern,button);
  });
  button.addEventListener('pointerenter',()=>highlightPattern(pattern));
  button.addEventListener('focus',()=>highlightPattern(pattern));
  return button;
}
async function paintConfigurationMatchGlyphs(root){
  if(!root)return;
  const templates=window.RelphiRelationshipGlyphTemplates;
  if(!templates?.clone)return;
  const colors=templates.colors||RESULT_COLORS;
  for(const host of root.querySelectorAll('.sky-configuration-match-glyph[data-canonical-placement]')){
    if(host.dataset.canonicalGlyphReady==='true')continue;
    const id=String(host.dataset.canonicalPlacement||''),sky=String(host.dataset.sky||'A').toUpperCase(),color=colors?.[sky]||RESULT_COLORS[sky]||RESULT_COLORS.A;
    if(!id)continue;
    let glyph=null;
    try{glyph=await templates.clone(id,color)}catch(error){console.error('[Sky Chart] Configuration match glyph clone failed:',id,error)}
    if(!glyph)continue;
    host.replaceChildren(glyph);
    host.dataset.canonicalGlyphReady='true';
  }
}
function renderSelectedConfiguration(tile,pattern){
  const detail=tile?.querySelector(':scope>.sky-configuration-result-detail');
  if(!detail)return;
  const visual=detail.querySelector('.sky-configuration-result-visual');
  const structure=detail.querySelector('.sky-configuration-result-structure>span');
  const interpretation=detail.querySelector('.sky-configuration-result-interpretation>span');
  const explanation=detail.querySelector('.sky-configuration-result-explanation');
  if(visual)visual.innerHTML=miniConfigurationMarkup(pattern,{interactive:false});
  if(structure)structure.textContent=structureText(pattern);
  if(interpretation)interpretation.textContent=interpretationText(pattern);
  const oldNested=explanation?.querySelector('.sky-configuration-nested');
  oldNested?.remove();
  if(explanation&&pattern.nested?.length){
    const holder=document.createElement('div');
    holder.innerHTML=nestedConfigurationMarkup(pattern);
    if(holder.firstElementChild)explanation.appendChild(holder.firstElementChild);
  }
  tile.dataset.configurationResult=pattern.key;
  const exact=tile.querySelector(':scope>.sky-configuration-result-summary .sky-configuration-result-exactness');
  if(exact)exact.textContent=Number.isFinite(pattern.maxPhase)?pattern.maxPhase.toFixed(2)+'°':'';
  paintConfigurationMiniGlyphs(visual);
}
async function copySelectedConfiguration(tile,button){
  const pattern=tile?.__configurationSelectedPattern;if(!pattern)return;
  const text='Configurations\n\n'+serializeConfigurationPattern(pattern);
  let ok=false;
  try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);ok=true}}catch(_){}
  if(!ok){
    const area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');
    Object.assign(area.style,{position:'fixed',left:'-10000px',top:'0',opacity:'0'});
    document.body.appendChild(area);area.select();
    try{ok=document.execCommand('copy')}catch(_){}
    area.remove();
  }
  if(ok&&button){
    const prior=button.textContent;button.textContent='Copied';
    clearTimeout(button.__copyTimer);
    button.__copyTimer=setTimeout(()=>{if(button.isConnected)button.textContent=prior||'Copy'},1100);
  }
}
function selectConfigurationMatch(tile,pattern,row){
  tile.querySelectorAll('.sky-configuration-match-row.is-selected').forEach(node=>node.classList.remove('is-selected'));
  row?.classList.add('is-selected');
  tile.__configurationSelectedPattern=pattern;
  renderSelectedConfiguration(tile,pattern);
  highlightPattern(pattern);
}
function openConfiguration(tile,group){
  if(tile.classList.contains('is-expanded')){closeConfigurationTile(tile);return}
  if(openConfigurationTile&&openConfigurationTile!==tile)closeConfigurationTile(openConfigurationTile);
  const pattern=group.representative;
  openConfigurationTile=tile;tile.classList.add('is-expanded');tile.setAttribute('aria-expanded','true');
  let detail=tile.querySelector(':scope>.sky-configuration-result-detail');
  if(!detail){
    detail=document.createElement('div');detail.className='sky-configuration-result-detail';
    detail.innerHTML='<button type="button" class="sky-configuration-tile-copy" aria-label="Copy this expanded configuration">Copy</button><div class="sky-configuration-result-visual"></div><div class="sky-configuration-result-explanation"><div class="sky-configuration-result-structure"><strong>Structure</strong><span></span></div><div class="sky-configuration-result-interpretation"><strong>Interpretation</strong><span></span></div></div>';
    const tileCopy=detail.querySelector('.sky-configuration-tile-copy');
    if(tileCopy){
      tileCopy.dataset.bound='true';
      tileCopy.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();copySelectedConfiguration(tile,tileCopy)});
    }
    const matches=document.createElement('div');matches.className='sky-configuration-match-stack';
    const heading=document.createElement('div');heading.className='sky-configuration-match-stack-heading';heading.textContent=group.matches.length+' match'+(group.matches.length===1?'':'es');
    const list=document.createElement('div');list.className='sky-configuration-match-list';
    group.matches.forEach((match,index)=>list.appendChild(configurationMatchRow(match,index)));
    matches.append(heading,list);detail.appendChild(matches);
    tile.appendChild(detail);
  }
  detail.hidden=false;
  const tileCopy=detail.querySelector('.sky-configuration-tile-copy');
  if(tileCopy&&!tileCopy.dataset.bound){
    tileCopy.dataset.bound='true';
    tileCopy.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();copySelectedConfiguration(tile,tileCopy)});
  }
  paintConfigurationMatchGlyphs(detail);
  const firstRow=detail.querySelector('.sky-configuration-match-row[data-configuration-match="'+CSS.escape(pattern.key)+'"]')||detail.querySelector('.sky-configuration-match-row');
  selectConfigurationMatch(tile,pattern,firstRow);
}
function resultGroupTile(group,index){
  const pattern=group.representative,type=TYPE_MAP.get(group.type),tile=document.createElement('article');
  tile.className='sky-configuration-result-tile sky-configuration-type-tile';
  tile.dataset.configurationResult=pattern.key;
  tile.dataset.configurationType=group.type;
  tile.dataset.configurationCount=String(group.matches.length);
  tile.dataset.hasStack=group.matches.length>1?'true':'false';
  tile.setAttribute('aria-expanded','false');
  const button=document.createElement('button');button.type='button';button.className='sky-configuration-result-summary';
  const thumb=document.createElement('span');thumb.className='sky-configuration-result-thumb';thumb.innerHTML=miniConfigurationMarkup(pattern,{compact:true,interactive:false});
  const copy=document.createElement('span');copy.className='sky-configuration-result-summary-copy';
  const top=document.createElement('span');top.className='sky-configuration-result-summary-top';
  const name=document.createElement('strong');name.textContent=type?.label||group.type;
  const meta=document.createElement('span');meta.className='sky-configuration-result-meta';
  const countChip=document.createElement('span');countChip.className='sky-configuration-count-chip';countChip.textContent='×'+group.matches.length;
  const exact=document.createElement('span');exact.className='sky-configuration-result-exactness';exact.textContent=Number.isFinite(pattern.maxPhase)?pattern.maxPhase.toFixed(2)+'°':'';
  meta.append(countChip,exact);top.append(name,meta);
  const rail=document.createElement('span');rail.innerHTML=aspectColorRail(pattern);copy.append(top,rail.firstElementChild);
  button.append(thumb,copy);
  button.setAttribute('aria-label',(type?.label||group.type)+', '+group.matches.length+' matches. Expand configuration stack.');
  button.addEventListener('click',event=>{event.preventDefault();openConfiguration(tile,group)});
  tile.addEventListener('pointerenter',()=>highlightPattern(pattern));
  tile.addEventListener('focusin',()=>highlightPattern(pattern));
  tile.addEventListener('pointerleave',()=>{if(!tile.classList.contains('is-expanded'))clearPatternHighlight()});
  tile.addEventListener('focusout',event=>{if(!tile.contains(event.relatedTarget)&&!tile.classList.contains('is-expanded'))clearPatternHighlight()});
  tile.appendChild(button);return tile;
}
function configurationFocusActive(){
  return activeScopes().some(scope=>configurationState[scope]?.size>0);
}
function configurationEdgeSignature(edge){return edgeKey(edge.left,edge.right)+':'+String(edge.aspect||'')}
function containsConfiguration(parent,child){
  if(!parent||!child||parent.vertices.length<=child.vertices.length)return false;
  const vertices=new Set(parent.vertices);if(!child.vertices.every(key=>vertices.has(key)))return false;
  const edges=new Set(parent.edges.map(configurationEdgeSignature));
  return child.edges.every(edge=>edges.has(configurationEdgeSignature(edge)));
}
function hierarchicalPatterns(source){
  const list=source.map(pattern=>({...pattern,nested:[]}));
  const parentFor=new Map();
  list.forEach(child=>{
    const candidates=list.filter(parent=>containsConfiguration(parent,child)).sort((a,b)=>a.vertices.length-b.vertices.length||a.edges.length-b.edges.length||a.maxPhase-b.maxPhase);
    if(candidates.length)parentFor.set(child.key,candidates[0].key);
  });
  const byKey=new Map(list.map(pattern=>[pattern.key,pattern]));
  list.forEach(child=>{const parentKey=parentFor.get(child.key);if(parentKey)byKey.get(parentKey)?.nested.push(child)});
  list.forEach(pattern=>pattern.nested.sort((a,b)=>a.maxPhase-b.maxPhase||a.meanPhase-b.meanPhase));
  return list.filter(pattern=>!parentFor.has(pattern.key));
}
function rawPatternsForResults(){return configurationFocusActive()?selectedPatternsForVisibility():patterns}
function patternsForResults(){return hierarchicalPatterns(rawPatternsForResults())}

let configurationCopyTimer=0,configurationExportBusy=false,configurationExportLibrary=null;
function configurationVertexText(key){
  const record=resultVertexRecord(key),item=vertexLabel(key);
  if(!record)return 'Sky '+item.sky+' '+item.label;
  const signNames=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const sign=Math.floor(resultNorm(record.value)/30),within=resultNorm(record.value)-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60+1e-7);
  return 'Sky '+item.sky+' '+item.label+' '+degree+'°'+String(minute).padStart(2,'0')+'′ '+signNames[sign];
}
function serializeConfigurationPattern(pattern){
  const type=TYPE_MAP.get(pattern.type)?.label||pattern.type;
  const scope=patternScopeLabel(pattern);
  const exact=Number.isFinite(pattern.maxPhase)?' · max phase '+pattern.maxPhase.toFixed(2)+'°':'';
  const vertices=pattern.vertices.map(configurationVertexText).join(' · ');
  const recipe=CONFIG_STRUCTURE[pattern.type]||'compound aspect pattern';
  const interpretation=interpretationText(pattern);
  const nested=pattern.nested?.length?'\nContained: '+pattern.nested.map(child=>(TYPE_MAP.get(child.type)?.label||child.type)+(Number.isFinite(child.maxPhase)?' '+child.maxPhase.toFixed(2)+'°':'')).join(' · '):'';
  return type+' · '+scope+exact+'\nStructure: '+recipe+'\n'+vertices+'\nInterpretation: '+interpretation+nested;
}
function serializeVisibleConfigurations(){
  const current=patternsForResults();
  if(!current.length)return'';
  return 'Configurations\n\n'+current.map(serializeConfigurationPattern).join('\n\n');
}
async function copyVisibleConfigurations(button){
  const text=serializeVisibleConfigurations();if(!text)return;
  let ok=false;
  try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);ok=true}}catch(_){}
  if(!ok){
    const area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');Object.assign(area.style,{position:'fixed',left:'-10000px',top:'0',opacity:'0'});document.body.appendChild(area);area.select();try{ok=document.execCommand('copy')}catch(_){}area.remove();
  }
  if(ok&&button){
    const count=patternsForResults().length;button.textContent='Copied '+count;clearTimeout(configurationCopyTimer);configurationCopyTimer=setTimeout(()=>{if(button.isConnected)button.textContent='Copy'},1200);
  }
}
function loadConfigurationExporter(){
  if(window.htmlToImage?.toPng)return Promise.resolve(window.htmlToImage);
  if(configurationExportLibrary)return configurationExportLibrary;
  const src='https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js';
  configurationExportLibrary=new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[src="'+src+'"]');
    if(existing){if(window.htmlToImage?.toPng)return resolve(window.htmlToImage);existing.addEventListener('load',()=>window.htmlToImage?.toPng?resolve(window.htmlToImage):reject(new Error('PNG exporter unavailable.')),{once:true});existing.addEventListener('error',()=>reject(new Error('PNG exporter did not load.')),{once:true});return}
    const script=document.createElement('script');script.src=src;script.async=true;script.crossOrigin='anonymous';script.addEventListener('load',()=>window.htmlToImage?.toPng?resolve(window.htmlToImage):reject(new Error('PNG exporter unavailable.')),{once:true});script.addEventListener('error',()=>reject(new Error('PNG exporter did not load.')),{once:true});document.head.appendChild(script);
  });
  return configurationExportLibrary;
}
function configurationExportName(){
  const safe=value=>String(value||'sky').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48)||'sky';
  const sky=slot=>{try{const data=resultRead(slot)||{};return data.metadata?.savedSkyName||data.name||data.displayName||data.skyName||data.title||('sky-'+slot.toLowerCase())}catch(_){return'sky-'+slot.toLowerCase()}};
  const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/T(\d{4}).*/, '-$1');
  return safe(sky('A'))+'-vs-'+safe(sky('B'))+'-configurations-'+stamp+'.png';
}
async function downloadVisibleConfigurations(button){
  if(configurationExportBusy)return;
  const source=document.getElementById(RESULT_PANEL_ID);if(!source||source.hidden)return;
  configurationExportBusy=true;if(button){button.disabled=true;button.setAttribute('aria-busy','true')}
  let host=null;
  try{
    const width=Math.max(560,Math.ceil(source.getBoundingClientRect().width||700));
    host=document.createElement('div');Object.assign(host.style,{position:'fixed',left:'-100000px',top:'0',width:width+'px',background:'#fffdf8',zIndex:'-1'});document.body.appendChild(host);
    const clone=source.cloneNode(true);clone.removeAttribute('hidden');clone.querySelector('.sky-configuration-results-actions')?.querySelectorAll('button').forEach(node=>node.remove());clone.style.width=width+'px';host.appendChild(clone);
    if(document.fonts?.ready)await document.fonts.ready.catch(()=>{});
    const exporter=await loadConfigurationExporter();
    const height=Math.max(1,Math.ceil(clone.scrollHeight||clone.getBoundingClientRect().height||300)),pixelRatio=Math.min(2,Math.max(1,window.devicePixelRatio||1));
    const dataUrl=await exporter.toPng(clone,{cacheBust:false,backgroundColor:'#fffdf8',width,height,pixelRatio,canvasWidth:Math.ceil(width*pixelRatio),canvasHeight:Math.ceil(height*pixelRatio),skipAutoScale:true,includeQueryParams:false});
    const a=document.createElement('a');a.href=dataUrl;a.download=configurationExportName();a.style.display='none';document.body.appendChild(a);a.click();a.remove();
  }catch(error){console.error('Configuration export failed:',error)}
  finally{host?.remove();configurationExportBusy=false;if(button?.isConnected){button.disabled=false;button.removeAttribute('aria-busy')}}
}
function bindConfigurationActions(panel){
  const copy=panel?.querySelector('.sky-configuration-copy-button'),download=panel?.querySelector('.sky-configuration-download-button');
  if(copy&&!copy.dataset.bound){copy.dataset.bound='true';copy.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();copyVisibleConfigurations(copy)})}
  if(download&&!download.dataset.bound){download.dataset.bound='true';download.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();downloadVisibleConfigurations(download)})}
}
function renderResultsPanel(){
  const panel=ensureResultsPanel();if(!panel)return;
  const visiblePatterns=patternsForResults(),groups=groupedPatternsForResults();
  if(!visiblePatterns.length){panel.hidden=true;clearPatternHighlight();openConfigurationTile=null;return}
  panel.hidden=false;
  bindConfigurationActions(panel);
  const count=panel.querySelector('.sky-configuration-results-count'),grid=panel.querySelector('.sky-configuration-results-grid');
  if(grid){grid.replaceChildren();groups.forEach((group,index)=>grid.appendChild(resultGroupTile(group,index)));openConfigurationTile=null}
  const currentCount=visiblePatterns.length;
  if(count)count.textContent=currentCount+' match'+(currentCount===1?'':'es');
  paintConfigurationMiniGlyphs(grid);
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
function syntheticAxisOpposition(graph,a,b){
  const [skyA,idA]=String(a||'').split(':'),[skyB,idB]=String(b||'').split(':');
  if(!skyA||skyA!==skyB)return null;
  const ids=[idA,idB].sort().join('|');
  if(ids!=='asc|dsc'&&ids!=='ic|mc')return null;
  const left=resultVertexRecord(a),right=resultVertexRecord(b);
  if(!left||!right)return null;
  const delta=Math.abs(resultNorm(left.value)-resultNorm(right.value));
  const separation=Math.min(delta,360-delta);
  const orb=Math.abs(separation-180);
  const phase=orb*2;
  if(phase>graph.windowValue+1e-9)return null;
  return{row:null,aspect:'opposition',phase,left:a,right:b,synthetic:true,syntheticKind:'axis-opposition'};
}
function getEdge(graph,a,b,aspect){
  const direct=graph.edges.get(edgeKey(a,b))?.get(aspect)||null;
  if(direct)return direct;
  if(aspect==='opposition')return syntheticAxisOpposition(graph,a,b);
  return null;
}
function required(graph,pairs){const edges=[];for(const [a,b,aspect] of pairs){const edge=getEdge(graph,a,b,aspect);if(!edge)return null;edges.push(edge)}return edges}
function addPattern(out,type,vertices,edges,meta={}){const key=patternKey(type,vertices);if(out.some(item=>item.key===key))return;const phases=edges.map(edge=>edge.phase).filter(Number.isFinite);out.push({key,type,vertices:vertices.slice(),edges:edges.slice(),maxPhase:phases.length?Math.max(...phases):Number.POSITIVE_INFINITY,meanPhase:phases.length?phases.reduce((sum,value)=>sum+value,0)/phases.length:Number.POSITIVE_INFINITY,...meta})}
function combinations(items,size){const out=[];function walk(start,pick){if(pick.length===size){out.push(pick.slice());return}for(let i=start;i<=items.length-(size-pick.length);i+=1){pick.push(items[i]);walk(i+1,pick);pick.pop()}}walk(0,[]);return out}
function aspectCounts(graph,vertices,expected=null){
  const pairs=[];
  for(let i=0;i<vertices.length;i+=1)for(let j=i+1;j<vertices.length;j+=1){
    const byAspect=graph.edges.get(edgeKey(vertices[i],vertices[j]));
    if(!byAspect||!byAspect.size)return null;
    pairs.push([...byAspect.values()]);
  }
  if(!expected){
    const counts=new Map(),edges=[];
    for(const options of pairs){
      let chosen=null;
      for(const edge of options)if(!chosen||edge.phase<chosen.phase)chosen=edge;
      if(!chosen)return null;
      counts.set(chosen.aspect,(counts.get(chosen.aspect)||0)+1);edges.push(chosen);
    }
    return{counts,edges};
  }
  const target=new Map(Object.entries(expected)),chosen=[];
  function walk(index,counts){
    if(index===pairs.length){
      for(const [aspect,count] of target)if((counts.get(aspect)||0)!==count)return null;
      return chosen.slice();
    }
    for(const edge of pairs[index]){
      if(!target.has(edge.aspect))continue;
      const next=(counts.get(edge.aspect)||0)+1;
      if(next>target.get(edge.aspect))continue;
      counts.set(edge.aspect,next);chosen.push(edge);
      const found=walk(index+1,counts);if(found)return found;
      chosen.pop();if(next===1)counts.delete(edge.aspect);else counts.set(edge.aspect,next-1);
    }
    return null;
  }
  const edges=walk(0,new Map());if(!edges)return null;
  const counts=new Map();edges.forEach(edge=>counts.set(edge.aspect,(counts.get(edge.aspect)||0)+1));
  return{counts,edges};
}
function countIs(counts,expected){for(const [aspect,count] of Object.entries(expected))if((counts.get(aspect)||0)!==count)return false;let total=0;for(const count of counts.values())total+=count;return total===Object.values(expected).reduce((sum,value)=>sum+value,0)}
function grandSextileEdges(graph,vertices){
  if(vertices.length!==6)return null;
  const ordered=vertices.slice().sort((a,b)=>{
    const av=Number(resultVertexRecord(a)?.value),bv=Number(resultVertexRecord(b)?.value);
    if(!Number.isFinite(av)&&!Number.isFinite(bv))return String(a).localeCompare(String(b));
    if(!Number.isFinite(av))return 1;
    if(!Number.isFinite(bv))return -1;
    return resultNorm(av)-resultNorm(bv);
  });
  if(ordered.some(key=>!Number.isFinite(Number(resultVertexRecord(key)?.value))))return null;
  const pairs=[];
  for(let i=0;i<6;i+=1)pairs.push([ordered[i],ordered[(i+1)%6],'sextile']);
  for(let i=0;i<6;i+=1)pairs.push([ordered[i],ordered[(i+2)%6],'trine']);
  for(let i=0;i<3;i+=1)pairs.push([ordered[i],ordered[i+3],'opposition']);
  const edges=required(graph,pairs);
  return edges?{vertices:ordered,edges}:null;
}
function grandCrossEdges(graph,vertices){
  if(vertices.length!==4)return null;
  const [a,b,c,d]=vertices;
  const pairings=[
    [[a,b],[c,d]],
    [[a,c],[b,d]],
    [[a,d],[b,c]]
  ];
  for(const [[o1a,o1b],[o2a,o2b]] of pairings){
    const edges=required(graph,[
      [o1a,o1b,'opposition'],
      [o2a,o2b,'opposition'],
      [o1a,o2a,'square'],
      [o1a,o2b,'square'],
      [o1b,o2a,'square'],
      [o1b,o2b,'square']
    ]);
    if(edges)return edges;
  }
  return null;
}
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
    let info=aspectCounts(graph,vertices,{opposition:2,trine:2,sextile:2});if(info)addPattern(out,'mystic-rectangle',vertices,info.edges);
    const grandCross=grandCrossEdges(graph,vertices);if(grandCross)addPattern(out,'grand-cross',vertices,grandCross);
    info=aspectCounts(graph,vertices,{trine:3,sextile:2,opposition:1});if(info)addPattern(out,'kite',vertices,info.edges);
    info=aspectCounts(graph,vertices,{opposition:1,trine:2,sextile:3});if(info)addPattern(out,'cradle',vertices,info.edges);
  }
  const grandTrines=out.filter(pattern=>pattern.type==='grand-trine');
  for(let i=0;i<grandTrines.length;i+=1)for(let j=i+1;j<grandTrines.length;j+=1){
    const union=[...new Set([...grandTrines[i].vertices,...grandTrines[j].vertices])];if(union.length!==6)continue;
    const star=grandSextileEdges(graph,union);if(star)addPattern(out,'grand-sextile',star.vertices,star.edges);
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
  new MutationObserver(records=>{
    const relevant=records.some(record=>{
      if(record.type==='attributes')return record.target instanceof Element&&record.target.matches('.sky-foundation-relationship-row');
      if(record.type!=='childList')return false;
      return [...record.addedNodes,...record.removedNodes].some(node=>node instanceof Element&&(node.matches?.('.sky-foundation-relationship-row')||node.querySelector?.('.sky-foundation-relationship-row')));
    });
    if(relevant)schedule();
  }).observe(document.getElementById('skyFoundationRoot')||document.body,{
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:['data-aspect','data-left-placement','data-right-placement','data-left-sky','data-right-sky','data-relationship-mode','data-phase-error','data-source-orb','data-harmonic-order','data-left-house','data-right-house','data-left-sign','data-right-sign']
  });
  ensureConfigurationObserver();schedule();
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();