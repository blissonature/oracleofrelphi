// Enforce truthful placement displacement: collision offsets may not cross zodiac sign boundaries.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyPlacementSignGuardV1)return;
window.__relphiSkyPlacementSignGuardV1=true;
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const ALIASES={rising:'asc',ascendant:'asc',asc:'asc',ac:'asc',descendant:'dsc',dsc:'dsc',dc:'dsc',midheaven:'mc',mc:'mc','imum coeli':'ic',imumcoeli:'ic',ic:'ic',vertex:'vertex',vx:'vertex','north node':'north-node',node:'north-node','true node':'north-node','south node':'south-node',fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune'};
const norm=value=>((Number(value)%360)+360)%360;
function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function source(payload){if(!payload||typeof payload!=='object')return[];const known=[payload.placements,payload.positions,payload.points,payload.bodies].find(value=>value&&typeof value==='object'),raw=known||payload;if(Array.isArray(raw))return raw.map((item,index)=>[String(item?.name||item?.label||item?.id||index),item]);return Object.entries(raw).filter(([key,item])=>item&&typeof item==='object'&&!Array.isArray(item)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key))}
function longitude(item){if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);const signs=window.RelphiSkyWheelSpec?.SIGNS||[],sign=signs.indexOf(String(item?.sign||item?.zodiac||'').trim().toLowerCase());return sign<0?NaN:norm(sign*30+Number(item?.degree||item?.degrees||0)+Number(item?.minute||item?.minutes||0)/60+Number(item?.second||item?.seconds||0)/3600)}
function canonicalId(key,item){const registry=window.RelphiGlyphRegistry;for(const candidate of [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]){if(candidate==null)continue;const raw=String(candidate).trim(),id=ALIASES[raw.toLowerCase()]||raw,entry=registry?.resolve?.(id)||registry?.get?.(id);if(entry?.id)return entry.id}return''}
function mapFor(slot){const map=new Map();source(read(slot)).forEach(([key,item])=>{const id=canonicalId(key,item),value=longitude(item);if(id&&Number.isFinite(value)&&!map.has(id))map.set(id,value)});return map}
function sameSignDisplay(exact,display){const e=norm(exact),d=norm(display),sign=Math.floor(e/30);if(Math.floor(d/30)===sign)return d;const start=sign*30,end=start+30,delta=((d-e+540)%360)-180,candidate=e+delta,epsilon=.001;return norm(Math.max(start+epsilon,Math.min(end-epsilon,candidate)))}
function point(center,radius,degree){const angle=(norm(degree)-180)*Math.PI/180;return{x:center.x+radius*Math.cos(angle),y:center.y+radius*Math.sin(angle)}}
function xy(group){const match=String(group.getAttribute('transform')||'').match(/translate\(\s*([-+\d.eE]+)[ ,]+([-+\d.eE]+)/);return match?{x:Number(match[1]),y:Number(match[2])}:null}
function guardMini(slot){const shared=window.RelphiSkyWheelSpec,mini=shared?.mini;if(!mini)return;const panel=document.getElementById(`skyFoundation${slot}`),wheel=panel?.querySelector('.sky-placement-mini-wheel');if(!wheel)return;const map=mapFor(slot),leaders=Array.from(wheel.querySelectorAll('[data-mini-layer="leaders"] .sky-foundation-leader'));wheel.querySelectorAll('[data-mini-layer="placements"] g[data-placement]:not([data-angle-axis="true"])').forEach(group=>{const exact=map.get(group.dataset.placement),requested=Number(group.dataset.displayLongitude),lane=Number(group.dataset.placementLane);if(!Number.isFinite(exact)||!Number.isFinite(requested)||!Number.isFinite(lane))return;const display=sameSignDisplay(exact,requested);if(Math.abs(display-requested)<1e-7)return;const old=xy(group),next=point(mini.center,lane,display);group.setAttribute('transform',`translate(${next.x} ${next.y})`);group.dataset.displayLongitude=display.toFixed(8);group.dataset.signGuard='true';if(old){const line=leaders.find(node=>Math.abs(Number(node.getAttribute('x1'))-old.x)<.01&&Math.abs(Number(node.getAttribute('y1'))-old.y)<.01);if(line){line.setAttribute('x1',String(next.x));line.setAttribute('y1',String(next.y))}}});wheel.dataset.crossSignDisplacement='forbidden'}
function guard(){guardMini('A');guardMini('B')}
function afterRender(){requestAnimationFrame(guard)}
window.addEventListener('relphi:sky-foundation-ready',afterRender);
window.addEventListener('relphi:sky-foundation-interactions-ready',afterRender);
window.addEventListener('storage',event=>{if(Object.values(KEYS).includes(event.key))afterRender()});
document.addEventListener('click',event=>{if(event.target.closest('.sky-where-when-actions [data-ww-action="placements"]'))setTimeout(afterRender,0)},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',afterRender,{once:true});else afterRender();
})();
