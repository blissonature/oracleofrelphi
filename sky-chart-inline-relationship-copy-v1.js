// Relationship semantic serializer v4. Copy reads disclosure state from data only: no style/layout queries.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiInlineRelationshipCopyV4)return;
window.__relphiInlineRelationshipCopyV1=true;window.__relphiInlineRelationshipCopyV2=true;window.__relphiInlineRelationshipCopyV3=true;window.__relphiInlineRelationshipCopyV4=true;

const SIGNS=window.RelphiTermDefinitions.SIGNS;
const SIGN_REFERENTS=window.RelphiTermDefinitions.EXPANDED_SIGN_REFERENTS;
const PLACEMENT_REFERENTS=window.RelphiTermDefinitions.EXPANDED_PLACEMENT_REFERENTS;
const HOUSE_NAMES=window.RelphiTermDefinitions.HOUSE_NAMES;
const HOUSE_REFERENTS=window.RelphiTermDefinitions.EXPANDED_HOUSE_REFERENTS;
const ASPECT_NAMES=window.RelphiTermDefinitions.ASPECT_NAMES;
const ASPECT_REFERENTS=window.RelphiTermDefinitions.EXPANDED_ASPECT_REFERENTS;

function rowSky(row,side){const x=String(row.dataset[side==='left'?'leftSky':'rightSky']||'').toUpperCase();if(x==='A'||x==='B')return x;const m=String(row.dataset.relationshipMode||'A-B').toUpperCase();if(m==='A-A')return'A';if(m==='B-B')return'B';return side==='left'?'A':'B'}
function placementName(id){const e=window.RelphiGlyphRegistry?.get?.(id)||window.RelphiGlyphRegistry?.resolve?.(id);return String(e?.name||id||'').replace(/-/g,' ')}
function coordinate(row,side){const small=row.querySelector(`.sky-foundation-relationship-placement--${side} .sky-foundation-relationship-copy small`);const stored=String(small?.dataset?.relationshipCoordinate||'').trim();return stored||String(small?.textContent||'').match(/\d{1,2}°\d{2}′/)?.[0]||''}
function endpoint(row,side){const id=String(row.dataset[side==='left'?'leftPlacement':'rightPlacement']||''),si=Number(row.dataset[side==='left'?'leftSign':'rightSign']),h=Number(row.dataset[side==='left'?'leftHouse':'rightHouse']);const sky=rowSky(row,side),retrograde=sky&&id&&window.RelphiSkyRetrograde?.forPlacement?.(sky,id);return{sky,id,name:`Sky ${sky}'s ${placementName(id)}${retrograde?' Rx':''}`,retrograde:!!retrograde,sign:SIGNS[si]||'Sign',coordinate:coordinate(row,side),house:window.RelphiRelationshipExportHouses?.include?.(rowSky(row,side))===true&&Number.isFinite(h)&&h>=1&&h<=12?h:0}}
function modeLevel(){let mode=String(document.documentElement.dataset.relationshipDisplay||'');if(!mode){try{mode=localStorage.getItem('relphiSkyRelationshipDisplayV1')||'glyphs'}catch(_){mode='glyphs'}}return mode==='referents'?2:mode==='names'?1:0}
function levelForRow(row){const displayLevel=modeLevel();if(displayLevel===0)return 0;let level=displayLevel;if(!row?.classList?.contains('is-inline-expanded'))return level;for(const token of row.querySelectorAll('[data-inline-progressive-token]')){const n=Number(token.dataset.inlineProgressiveStage||0);if(Number.isFinite(n)&&n>level)level=n;if(level>=2)break}return Math.min(2,level)}
function endpointBlock(ep,level){const first=`${ep.name} in ${ep.sign}${ep.coordinate?` ${ep.coordinate}`:''}${ep.house?` · ${HOUSE_NAMES[ep.house]}`:''}`;if(level<2)return first;const lines=[first];if(PLACEMENT_REFERENTS[ep.id])lines.push(PLACEMENT_REFERENTS[ep.id]);if(SIGN_REFERENTS[ep.sign])lines.push(`${ep.sign} — ${SIGN_REFERENTS[ep.sign]}`);if(ep.house)lines.push(`${HOUSE_NAMES[ep.house]} — ${HOUSE_REFERENTS[ep.house]}`);return lines.join('\n')}
function timingLines(row){const meta=row.querySelector(':scope>.inline-rel-detail .inline-rel-transit-window');if(!meta||meta.hidden)return[];const lines=[];for(const line of meta.querySelectorAll('.inline-rel-transit-row')){if(line.hidden)continue;const k=String(line.querySelector('b')?.textContent||'').trim(),v=String(line.querySelector('span')?.textContent||'').trim();if(k||v)lines.push([k,v].filter(Boolean).join(' '))}return lines}
function tarotLines(row){const out=[];for(const card of row.querySelectorAll(':scope>.inline-rel-detail .inline-rel-card')){if(card.hidden)continue;const sky=String(card.querySelector('small')?.textContent||'').trim(),title=String(card.querySelector('b')?.textContent||card.querySelector('img')?.alt||'').trim();if(sky&&title)out.push(`${sky} — ${title}`)}return out}
function serialize(row,{level=levelForRow(row),includeScope=false}={}){level=Math.max(0,Math.min(2,Number(level)||0));if(level===0)return'';
const layers=exportLayers();
if(layers.referents&&!layers.glyphs&&!layers.names){
  const a=endpoint(row,'left'),b=endpoint(row,'right'),aspect=String(row.dataset.aspect||''),orb=Number(row.dataset.sourceOrb);
  const ep=x=>['Sky '+x.sky+':',PLACEMENT_REFERENTS[x.id]||placementName(x.id),x.retrograde?'retrograde':'',SIGN_REFERENTS[x.sign]||x.sign,x.coordinate,x.house?HOUSE_REFERENTS[x.house]:''].filter(Boolean).join(' · ');
  const middle=[ASPECT_REFERENTS[aspect]||aspect,Number.isFinite(orb)?orb.toFixed(2)+'°':'',...timingLines(row)].filter(Boolean).join(' · ');
  return[(includeScope?a.sky+'↔'+b.sky:''),ep(a),middle,ep(b),...tarotLines(row)].filter(Boolean).join('\n\n');
}
const left=endpoint(row,'left'),right=endpoint(row,'right'),aspectId=String(row.dataset.aspect||''),orb=Number(row.dataset.sourceOrb),aspectLine=`${ASPECT_NAMES[aspectId]||aspectId}${Number.isFinite(orb)?` · ${orb.toFixed(2)}°`:''}`,aspectBlock=[aspectLine];if(level>=2&&ASPECT_REFERENTS[aspectId])aspectBlock.push(ASPECT_REFERENTS[aspectId]);aspectBlock.push(...timingLines(row));const blocks=[];if(includeScope)blocks.push(`${left.sky}↔${right.sky}`);blocks.push(endpointBlock(left,level),aspectBlock.join('\n'),endpointBlock(right,level));const cards=tarotLines(row);if(cards.length)blocks.push(cards.join('\n'));return blocks.filter(Boolean).join('\n\n')}

/* Full-list exports share this description model. Single-item Copy retains its
   complete standalone serializer above. Definitions originate here, once. */
function exportLayers(){
  const state=window.RelphiSkyRelationshipDisplay?.getState?.()||{glyphs:true,names:true,referents:true};
  return{glyphs:!!state.glyphs,names:!!state.names,referents:!!state.referents};
}
const EXPORT_GLYPHS={sun:'☉',moon:'☽',mercury:'☿',venus:'♀',mars:'♂',jupiter:'♃',saturn:'♄',uranus:'♅',neptune:'♆',pluto:'♇',chiron:'⚷',asc:'Asc',dsc:'Dsc',mc:'MC',ic:'IC','north-node':'☊','south-node':'☋',lilith:'⚸','part-of-fortune':'⊗',vertex:'Vx','anti-vertex':'AVx'};
const EXPORT_SIGNS=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const EXPORT_ASPECTS={conjunction:'☌','semi-sextile':'⚺',octile:'∠',sextile:'✶',quintile:'Q',square:'□',trine:'△','tri-octile':'⚼','bi-quintile':'BQ',quincunx:'⚻',opposition:'☍'};
const headingWord=text=>String(text||'').split(',')[0].replace(/^(the|a|an) /i,'').trim();
function exportLabel(name,glyph,meaning,layers){
  const parts=[];
  if(layers.glyphs&&glyph)parts.push(glyph);
  if(layers.names&&name)parts.push(name);
  // Referents-only is an intentionally valid, genuinely plain-language view.
  if(!parts.length&&layers.referents)parts.push(headingWord(meaning)||name);
  return parts.join(' ');
}
function exportEndpoint(ep,layers){
  const signIndex=SIGNS.indexOf(ep.sign);
  const planet=exportLabel(placementName(ep.id),EXPORT_GLYPHS[ep.id],PLACEMENT_REFERENTS[ep.id],layers)+(ep.retrograde?(layers.glyphs||layers.names?' Rx':' (retrograde)'):'');
  const sign=exportLabel(ep.sign,EXPORT_SIGNS[signIndex],SIGN_REFERENTS[ep.sign],layers);
  const house=ep.house?exportLabel(HOUSE_NAMES[ep.house],'H'+ep.house,HOUSE_REFERENTS[ep.house],layers):'';
  return ['Sky '+ep.sky+': '+planet,sign,ep.coordinate,house].filter(Boolean).join(' · ');
}
function collect(rows){
  const layers=exportLayers();
  const sets={placements:new Map(),signs:new Map(),houses:new Map(),aspects:new Map()};
  const items=Array.from(rows||[],row=>{
    const left=endpoint(row,'left'),right=endpoint(row,'right');
    const aspectId=String(row.dataset.aspect||''),orb=Number(row.dataset.sourceOrb);
    for(const ep of [left,right]){
      if(PLACEMENT_REFERENTS[ep.id])sets.placements.set(ep.id,{label:exportLabel(placementName(ep.id),EXPORT_GLYPHS[ep.id],PLACEMENT_REFERENTS[ep.id],layers),text:PLACEMENT_REFERENTS[ep.id]});
      if(SIGN_REFERENTS[ep.sign])sets.signs.set(ep.sign,{label:exportLabel(ep.sign,EXPORT_SIGNS[SIGNS.indexOf(ep.sign)],SIGN_REFERENTS[ep.sign],layers),text:SIGN_REFERENTS[ep.sign]});
      if(ep.house&&HOUSE_REFERENTS[ep.house])sets.houses.set(ep.house,{label:exportLabel(HOUSE_NAMES[ep.house],'H'+ep.house,HOUSE_REFERENTS[ep.house],layers),text:HOUSE_REFERENTS[ep.house]});
    }
    if(ASPECT_REFERENTS[aspectId])sets.aspects.set(aspectId,{label:exportLabel(ASPECT_NAMES[aspectId],EXPORT_ASPECTS[aspectId],ASPECT_REFERENTS[aspectId],layers),text:ASPECT_REFERENTS[aspectId]});
    const aspectLabel=exportLabel(ASPECT_NAMES[aspectId]||aspectId,EXPORT_ASPECTS[aspectId],ASPECT_REFERENTS[aspectId],layers);
    const middle=aspectLabel+(Number.isFinite(orb)?' · '+orb.toFixed(2)+'°':'');
    const lines=[exportEndpoint(left,layers),middle,exportEndpoint(right,layers)];
    lines.push(...timingLines(row),...tarotLines(row));
    return{row,scope:left.sky+'↔'+right.sky,text:lines.filter(Boolean).join('\n'),left,right,aspectId,orb};
  });
  const dictionary=layers.referents?Object.entries(sets).map(([category,map])=>({
    category,entries:Array.from(map.values()).sort((a,b)=>a.label.localeCompare(b.label))
  })).filter(group=>group.entries.length):[];
  return{items,dictionary,layers};
}
function dictionaryText(model){
  if(!model?.dictionary?.length)return'';
  const groups=model.dictionary.map(group=>
    group.category[0].toUpperCase()+group.category.slice(1)+'\n'+
    group.entries.map(item=>item.label+' — '+item.text).join('\n')
  );
  return 'Reference Dictionary\n\n'+groups.join('\n\n');
}


// Complete, chart-independent glossary. Uses the same authored definitions as
// relationship Copy and PNG; nothing is derived from the currently loaded sky.
function fullDictionary(){
  const keyed=(ids,map,names)=>ids.filter(id=>map[id]).map(id=>({label:names?.[id]||placementName(id),text:map[id]}));
  const planetIds=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  const angleIds=['asc','dsc','mc','ic'];
  const otherIds=Object.keys(PLACEMENT_REFERENTS).filter(id=>!planetIds.includes(id)&&!angleIds.includes(id));
  const angleNames={asc:'Ascendant',dsc:'Descendant',mc:'Midheaven (m.c.)',ic:'Imum Coeli (i.c.)'};
  const rows=[
    {category:'Planets, Angles, and Other Points',sections:[
      {title:'Planets and Luminaries',entries:keyed(planetIds,PLACEMENT_REFERENTS)},
      {title:'Angles',entries:keyed(angleIds,PLACEMENT_REFERENTS,angleNames)},
      {title:'Other Points',entries:keyed(otherIds,PLACEMENT_REFERENTS)}
    ]},
    {category:'Signs',sections:[{title:'Zodiac Signs',entries:SIGNS.map(sign=>({label:sign,text:SIGN_REFERENTS[sign]}))}]},
    {category:'Houses',sections:[{title:'The Twelve Houses',entries:HOUSE_NAMES.slice(1).map((label,i)=>({label,text:HOUSE_REFERENTS[i+1]}))}]},
    {category:'Aspect Types',sections:[{title:'Aspects',entries:Object.keys(ASPECT_REFERENTS).map(id=>({label:ASPECT_NAMES[id]||id,text:ASPECT_REFERENTS[id]}))}]}
  ];
  return rows;
}

window.RelphiRelationshipCopySerializer=Object.freeze({serialize,levelForRow,modeLevel,collect,dictionaryText,fullDictionary});
})();
