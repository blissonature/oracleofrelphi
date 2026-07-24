(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
const state={entries:[],filtered:[],flashIndex:0};
const $=selector=>document.querySelector(selector);
function category(entry){
 const asset=String(entry.asset||'');
 if(asset.includes('/planet-glyphs/')) return 'planet';
 if(asset.includes('/zodiac-glyphs/')) return 'sign';
 if(asset.includes('/element-glyphs/')) return 'element';
 if(asset.includes('/aspect-glyphs/')) return 'aspect';
 if(entry.fitMode==='hebrew-letter') return 'hebrew';
 if(entry.fitMode==='greek-letter') return 'greek';
 if(entry.fitMode==='letter') return 'angle';
 if(['north-node','south-node','part-of-fortune','chiron'].includes(entry.id)) return 'point';
 return 'other';
}
function labelFor(kind){return({planet:'Planet or planetary point',sign:'Zodiac sign',element:'Element',aspect:'Aspect',angle:'Angle or calculated position',point:'Calculated or symbolic point',hebrew:'Hebrew letter',greek:'Greek letter',other:'Glyph'})[kind]||'Glyph';}
function makeSvg(entry,flash){
 const svg=document.createElementNS(NS,'svg');
 svg.setAttribute('viewBox','-32 -32 64 64');
 svg.setAttribute('role','img');
 svg.setAttribute('aria-label',entry.name);
 window.RelphiGlyphComponent.draw(svg,entry.id,{radius:flash?27:25,padding:2,color:'currentColor'}).catch(()=>{svg.replaceChildren();});
 return svg;
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