// Sky Chart adapter: native placement groups supply data only; this adapter owns visible markers.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
const NS='http://www.w3.org/2000/svg';
const SVG_SELECTOR='.unified-sky-wheel svg, #chartOutput svg, #currentSkyOutput svg, .sky-output-box svg';
const NATIVE='.chart-wheel-placement-stick';
let queued=false,running=false;
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:NaN};
const bare=v=>String(v||'').replace(/[\uFE0E\uFE0F]/g,'').trim();
function rootPoint(svg,node,x,y){const p=svg.createSVGPoint();p.x=x;p.y=y;const m=node.getCTM?.();return m?p.matrixTransform(m):p;}
function bodyOf(group){for(const value of [group.dataset.body,group.dataset.name,group.dataset.placement,group.getAttribute('aria-label'),group.querySelector('.chart-wheel-marker-name')?.textContent,group.querySelector('.chart-wheel-marker-glyph')?.textContent]){const v=bare(value);if(v)return v}return'';}
function centerOf(svg){const vb=svg.viewBox?.baseVal;return vb&&vb.width?{x:vb.x+vb.width/2,y:vb.y+vb.height/2}:{x:svg.clientWidth/2,y:svg.clientHeight/2};}
function removeOldLayer(svg){svg.querySelector(':scope > g.relphi-sky-marker-layer')?.remove();}
function restoreNative(svg){svg.querySelectorAll(NATIVE).forEach(g=>{g.style.removeProperty('display');g.removeAttribute('aria-hidden')});}
async function render(svg){const Core=window.RelphiGlyphCore;if(!Core||running)return;running=true;try{await Core.preload();removeOldLayer(svg);restoreNative(svg);const source=Array.from(svg.querySelectorAll(NATIVE));if(!source.length)return;const models=[];for(let index=0;index<source.length;index++){const group=source[index],contact=group.querySelector('circle.chart-wheel-contact-dot'),body=bodyOf(group);if(!contact||!body)continue;const cx=num(contact.getAttribute('cx')),cy=num(contact.getAttribute('cy'));if(!Number.isFinite(cx)||!Number.isFinite(cy))continue;const anchor=rootPoint(svg,contact,cx,cy);models.push({id:`${index}:${body}`,body,anchor:{x:anchor.x,y:anchor.y},native:group,color:group.classList.contains('sky-b')?'#3166e2':'#dc1f18'});}if(!models.length)return;const layer=document.createElementNS(NS,'g');layer.classList.add('relphi-sky-marker-layer');svg.appendChild(layer);const markers=models.map(model=>Core.createAtomicMarker(layer,model,{color:model.color,radius:16.5,padding:1.4,strokeWidth:2.2,leaderWidth:1.45}));Core.solveRadial(markers,{center:centerOf(svg),outward:61,gap:40,maxTangent:82,passes:64});await Promise.all(markers.map(m=>m.ready));models.forEach(model=>{model.native.style.setProperty('display','none','important');model.native.setAttribute('aria-hidden','true')});layer.style.setProperty('pointer-events','auto');}finally{running=false}}
function scan(){document.querySelectorAll(SVG_SELECTOR).forEach(render);}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})}
function relevant(records){return records.some(r=>Array.from(r.addedNodes||[]).some(n=>n.nodeType===1&&(n.matches?.(NATIVE)||n.querySelector?.(NATIVE)||n.matches?.(SVG_SELECTOR))));}
function start(){schedule();new MutationObserver(records=>{if(!running&&relevant(records))schedule()}).observe(document.body,{childList:true,subtree:true});window.addEventListener('resize',schedule,{passive:true});window.addEventListener('relphi:sky-builder-v4-loaded',schedule);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();