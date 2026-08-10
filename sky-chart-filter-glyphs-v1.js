// Visual glyph cues for Sky Chart relationship filter menus.
// Canonical artwork only: every glyph is resolved and drawn through the Relphi registry/component.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyFilterGlyphsV2)return;
window.__relphiSkyFilterGlyphsV2=true;window.__relphiSkyFilterGlyphsV1=true;
const ASPECT_COLORS={conjunction:'#e53935','semi-sextile':'#7c9b49',octile:'#b86d43',sextile:'#d3b727',quintile:'#8b6cc2',square:'#d6534d',trine:'#4e9e69','tri-octile':'#9f5944','bi-quintile':'#7655aa',quincunx:'#4b8e88',opposition:'#5961c8'};
const SIGN_COLORS={aries:'#ef5350',taurus:'#ff7043',gemini:'#ffa726',cancer:'#ffca28',leo:'#d4e157',virgo:'#9ccc65',libra:'#66bb6a',scorpio:'#26a69a',sagittarius:'#42a5f5',capricorn:'#5c6bc0',aquarius:'#7e57c2',pisces:'#ab47bc'};
const SIGN_IDS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
const ANGLE_NAMES={asc:'Ascendant',dsc:'Descendant',mc:'Medium Coeli',ic:'Imum Coeli'};
function canonicalHost(identity,color,kind){const host=document.createElement('span');host.className='sky-filter-symbol sky-filter-symbol-'+kind;host.dataset.canonicalGlyph=identity;host.setAttribute('aria-hidden','true');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','-18 -18 36 36');svg.setAttribute('width','22');svg.setAttribute('height','22');svg.style.overflow='visible';host.appendChild(svg);const component=window.RelphiGlyphComponent,registry=window.RelphiGlyphRegistry,entry=registry&&(registry.get(identity)||registry.resolve(identity));if(!component||!entry){host.remove();return null}component.draw(svg,entry.id,{radius:14,padding:1,color:color||'currentColor'}).catch(error=>{console.error('[Sky filter canonical glyph]',identity,error);host.remove()});return host}
function prepend(label,identity,color,kind){if(!label||label.querySelector(':scope > [data-canonical-glyph]'))return;const host=canonicalHost(identity,color,kind);if(host)label.prepend(host)}
function setLabelText(label,text){if(!label)return;Array.from(label.childNodes).filter(n=>n.nodeType===Node.TEXT_NODE).forEach(n=>n.remove());label.appendChild(document.createTextNode(text))}
function decorateAspects(){document.querySelectorAll('.sky-chart-aspect-list-item[data-aspect-list-item]').forEach(row=>{const id=row.dataset.aspectListItem;if(id!=='all'&&ASPECT_COLORS[id])prepend(row.querySelector('.sky-chart-aspect-list-label'),id,ASPECT_COLORS[id],'aspect')})}
function decoratePlacements(){document.querySelectorAll('.sky-chart-placement-list-item-placement[data-placement-list-item]').forEach(row=>{const id=row.dataset.placementListItem,label=row.querySelector('.sky-chart-placement-list-label');if(ANGLE_NAMES[id])setLabelText(label,ANGLE_NAMES[id]);prepend(label,id,'currentColor','placement')})}
function decorateSigns(){document.querySelectorAll('[data-sign-list-item]').forEach(row=>{const id=String(row.dataset.signListItem||'').trim().toLowerCase();if(SIGN_IDS.includes(id)&&!row.closest('.sky-chart-zodiac-filter-menu'))prepend(row.querySelector('.sky-chart-sign-list-label,[data-sign-label],strong,span'),id,SIGN_COLORS[id],'sign')})}
function decorate(){if(!window.RelphiGlyphRegistry||!window.RelphiGlyphComponent)return;decorateAspects();decoratePlacements();decorateSigns();document.documentElement.dataset.skyFilterGlyphs='canonical'}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate()})}
['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-placement-multiselect-changed','relphi:sky-aspect-multiselect-changed'].forEach(name=>window.addEventListener(name,schedule));
const root=document.getElementById('skyFoundationRelationships')||document.getElementById('skyFoundationRoot');if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();