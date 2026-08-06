(function(){
'use strict';
const state={entries:[],filtered:[],flashIndex:0};
const $=selector=>document.querySelector(selector);
function category(entry){
 if(['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','chiron','lilith'].includes(entry.id))return 'planet';
 if(['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'].includes(entry.id))return 'sign';
 if(['fire','water','air','earth'].includes(entry.id))return 'element';
 if(['conjunction','opposition','trine','square','sextile','semi-sextile','quincunx','octile','tri-octile','quintile','bi-quintile'].includes(entry.id))return 'aspect';
 if(entry.id.startsWith('hebrew-'))return 'hebrew';
 if(entry.id.startsWith('greek-'))return 'greek';
 if(['vertex','asc','dsc','mc','ic'].includes(entry.id))return 'angle';
 if(['north-node','south-node','part-of-fortune'].includes(entry.id))return 'point';
 return 'other';
}
function labelFor(kind){return({planet:'Planet or planetary point',sign:'Zodiac sign',element:'Element',aspect:'Aspect',angle:'Angle or calculated position',point:'Calculated or symbolic point',hebrew:'Hebrew letter',greek:'Greek letter',other:'Glyph'})[kind]||'Glyph';}
function makeSvg(entry,flash){
 const holder=document.createElement('span');
 try{return window.RelphiGlyphComponent.mount(holder,entry.id,{size:flash?64:56,circle:false,color:'currentColor'})}
 catch(_){return holder}
}
function card(entry){
 const article=document.createElement('article');article.className='glyph-card';
 const art=document.createElement('div');art.className='glyph-art';art.appendChild(makeSvg(entry,false));
 const copy=document.createElement('div');
 const kind=document.createElement('p');kind.className='glyph-kind';kind.textContent=labelFor(category(entry));
 const name=document.createElement('h3');name.textContent=entry.name;
 const aliases=document.createElement('p');aliases.className='glyph-aliases';aliases.textContent=entry.aliases.length?'Also recognized as: '+entry.aliases.join(', '):'Canonical identifier: '+entry.id;
 copy.append(kind,name,aliases);article.append(art,copy);return article;
}
function applyFilters(){
 const query=$('#glyphSearch').value.trim().toLowerCase();const selected=$('#glyphCategory').value;
 state.filtered=state.entries.filter(entry=>{const kind=category(entry);const hay=[entry.id,entry.name,...entry.aliases].join(' ').toLowerCase();return(selected==='all'||kind===selected)&&(!query||hay.includes(query));});
 state.flashIndex=Math.min(state.flashIndex,Math.max(0,state.filtered.length-1));renderGrid();renderFlash();
}
function renderGrid(){
 const grid=$('#glyphGrid');grid.replaceChildren();
 $('#glyphMeta').textContent=state.filtered.length+' glyph'+(state.filtered.length===1?'':'s')+' shown.';
 if(!state.filtered.length){const empty=document.createElement('p');empty.className='glyph-empty';empty.textContent='No glyphs match this filter.';grid.appendChild(empty);return;}
 state.filtered.forEach(entry=>grid.appendChild(card(entry)));
}
function renderFlash(){
 const entry=state.filtered[state.flashIndex];const art=$('#flashArt');art.replaceChildren();
 if(!entry){$('#flashName').textContent='No glyph selected';$('#flashKind').textContent='';return;}
 art.appendChild(makeSvg(entry,true));$('#flashName').textContent=entry.name;$('#flashKind').textContent=labelFor(category(entry));
}
function show(mode){$('#browsePanel').hidden=mode!=='browse';$('#flashPanel').hidden=mode!=='flash';}
function start(){
 if(!window.RelphiGlyphRegistry||!window.RelphiGlyphComponent){setTimeout(start,30);return;}
 state.entries=window.RelphiGlyphRegistry.entries.slice();state.filtered=state.entries.slice();
 $('#glyphSearch').addEventListener('input',applyFilters);$('#glyphCategory').addEventListener('change',applyFilters);
 $('#showBrowse').addEventListener('click',()=>show('browse'));$('#showFlash').addEventListener('click',()=>show('flash'));
 $('#prevFlash').addEventListener('click',()=>{if(!state.filtered.length)return;state.flashIndex=(state.flashIndex-1+state.filtered.length)%state.filtered.length;renderFlash();});
 $('#nextFlash').addEventListener('click',()=>{if(!state.filtered.length)return;state.flashIndex=(state.flashIndex+1)%state.filtered.length;renderFlash();});
 applyFilters();show('browse');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
