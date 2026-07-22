// Page adapters for the shared Relphi glyph system: Tarot Ledger, Planetary Hours, and Glyph Trainer.
(function(){
'use strict';
const path=location.pathname;
if(!/(^|\/)(tarot|planetaryhours|glyphs|astrology-foundations)\.html$/.test(path))return;
const PLANET_NAMES=new Set(['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto']);
let queued=false,running=false;
function api(){return window.RelphiUnifiedGlyphs}
function number(v){const n=Number(v);return Number.isFinite(n)?n:0}
function translation(node){const raw=node.getAttribute('transform')||'',m=raw.match(/translate\(\s*([-\d.]+)[ ,]+([-\d.]+)/);return m?{x:number(m[1]),y:number(m[2])}:null}
function colorFor(node){const c=getComputedStyle(node).color||getComputedStyle(node).fill;return c&&c!=='none'&&c!=='rgb(0, 0, 0)'?c:'#dc1f18'}
function wheelLike(svg){const key=((svg.id||'')+' '+(svg.getAttribute('class')||'')).toLowerCase();if(/zodiac|wheel|chart|astro|sky|planet/.test(key))return true;let count=0;svg.querySelectorAll('text').forEach(t=>{if(/[♈-♓]/.test(t.textContent||''))count++});return count>=4}
function upgradeWheel(svg){const G=api();if(!G||!wheelLike(svg))return;svg.querySelectorAll('text').forEach(node=>{if(node.closest('.relphi-glyph-bubble'))return;const id=G.identity(node.textContent);if(!PLANET_NAMES.has(id)&&!['☊','☋','⚸','FORTUNE','ASC','DSC','MC','IC','Vx'].includes(id))return;const size=parseFloat(getComputedStyle(node).fontSize)||18;G.replaceTextNode(node,{radius:Math.max(12,Math.min(18,size*.68)),color:colorFor(node)})});const bubbles=Array.from(svg.querySelectorAll('.relphi-glyph-bubble')).map((group,index)=>{const p=translation(group);if(!p)return null;const vb=svg.viewBox?.baseVal,center=vb&&vb.width?{x:vb.x+vb.width/2,y:vb.y+vb.height/2}:{x:svg.clientWidth/2,y:svg.clientHeight/2};const vx=p.x-center.x,vy=p.y-center.y,len=Math.hypot(vx,vy)||1;return{index,group,anchor:{x:p.x,y:p.y},radial:{x:vx/len,y:vy/len},tangent:{x:-vy/len,y:vx/len},outward:0,offset:0}}).filter(Boolean);if(bubbles.length>1)G.radialLayout(bubbles,{outward:0,gap:38,maxTangent:60,passes:40})}
function trainerPlanetName(host){const card=host.closest('.glyph-card'),name=card?.querySelector('.glyph-name')?.textContent?.trim();if(name)return name;const flash=document.getElementById('flashAnswer')?.textContent||'';return flash.match(/^(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto)\b/i)?.[1]||''}
function upgradeTrainer(root){const G=api();if(!G)return;(root||document).querySelectorAll('.glyph-symbol,#flashSymbol').forEach(host=>{if(host.dataset.relphiCanonical==='1')return;const name=trainerPlanetName(host);const id=G.identity(name||host.textContent);if(!PLANET_NAMES.has(id))return;host.dataset.relphiCanonical='1';host.textContent='';const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','-40 -40 80 80');svg.setAttribute('aria-hidden','true');svg.style.width='75%';svg.style.height='75%';svg.style.overflow='visible';host.appendChild(svg);G.renderGlyph(svg,id,{color:'currentColor',radius:31,padding:2})})}
function run(){if(running)return;const G=api();if(!G){setTimeout(schedule,30);return}running=true;try{if(/(tarot|planetaryhours)\.html$/.test(path))document.querySelectorAll('svg').forEach(upgradeWheel);if(/(glyphs|astrology-foundations)\.html$/.test(path))upgradeTrainer(document)}finally{running=false}}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()})}
function start(){schedule();new MutationObserver(records=>{if(records.some(r=>Array.from(r.addedNodes||[]).some(n=>n.nodeType===1&&!n.closest?.('.relphi-glyph-bubble'))))schedule()}).observe(document.body,{childList:true,subtree:true,characterData:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
