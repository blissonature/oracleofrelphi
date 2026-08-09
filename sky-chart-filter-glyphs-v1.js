// Visual glyph cues for Sky Chart relationship filter menus.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyFilterGlyphsV1)return;
window.__relphiSkyFilterGlyphsV1=true;
const ASPECT={conjunction:['☌','#e53935'],'semi-sextile':['⚺','#7c9b49'],octile:['∠','#b86d43'],sextile:['⚹','#d3b727'],quintile:['Q','#8b6cc2'],square:['□','#d6534d'],trine:['△','#4e9e69'],'tri-octile':['⚼','#9f5944'],'bi-quintile':['bQ','#7655aa'],quincunx:['⚻','#4b8e88'],opposition:['☍','#5961c8']};
const SIGN={aries:'♈',taurus:'♉',gemini:'♊',cancer:'♋',leo:'♌',virgo:'♍',libra:'♎',scorpio:'♏',sagittarius:'♐',capricorn:'♑',aquarius:'♒',pisces:'♓'};
const PLACEMENT={sun:'☉',moon:'☽',mercury:'☿',venus:'♀',mars:'♂',jupiter:'♃',saturn:'♄',uranus:'♅',neptune:'♆',pluto:'♇',asc:'Asc',dsc:'Dsc',mc:'MC',ic:'IC','north-node':'☊','south-node':'☋',chiron:'⚷',lilith:'⚸','part-of-fortune':'⊗',vertex:'Vx'};
const COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
function badge(text,color,kind){const n=document.createElement('span');n.className='sky-filter-symbol sky-filter-symbol-'+kind;n.textContent=text;n.style.setProperty('--filter-symbol-color',color||'currentColor');n.setAttribute('aria-hidden','true');return n}
function prepend(label,symbol,color,kind){if(!label||label.querySelector(':scope > .sky-filter-symbol'))return;label.prepend(badge(symbol,color,kind))}
function decorateAspects(){document.querySelectorAll('.sky-chart-aspect-list-item[data-aspect-list-item]').forEach(row=>{const id=row.dataset.aspectListItem;if(id==='all')return;const meta=ASPECT[id];if(meta)prepend(row.querySelector('.sky-chart-aspect-list-label'),meta[0],meta[1],'aspect')})}
function decoratePlacements(){document.querySelectorAll('.sky-chart-placement-list-item-placement[data-placement-list-item]').forEach(row=>{const id=row.dataset.placementListItem,symbol=PLACEMENT[id];if(symbol)prepend(row.querySelector('.sky-chart-placement-list-label'),symbol,'currentColor','placement')})}
function decorateSigns(){document.querySelectorAll('select[data-filter="sign"] option,select[data-sign-filter] option').forEach(option=>{const raw=String(option.value||option.textContent||'').trim().toLowerCase(),key=raw.replace(/^.*?:\s*/,'').replace(/\s+/g,'-'),symbol=SIGN[key];if(symbol&&!option.textContent.trim().startsWith(symbol))option.textContent=symbol+'  '+option.textContent});document.querySelectorAll('[data-sign-list-item]').forEach(row=>{const raw=String(row.dataset.signListItem||'').toLowerCase(),symbol=SIGN[raw],index=Object.keys(SIGN).indexOf(raw);if(symbol)prepend(row.querySelector('.sky-chart-sign-list-label,[data-sign-label],strong,span'),symbol,COLORS[index],'sign')})}
function decorate(){decorateAspects();decoratePlacements();decorateSigns();document.documentElement.dataset.skyFilterGlyphs='ready'}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate()})}
['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-placement-multiselect-changed','relphi:sky-aspect-multiselect-changed'].forEach(name=>window.addEventListener(name,schedule));
const root=document.getElementById('skyFoundationRelationships')||document.getElementById('skyFoundationRoot');if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();