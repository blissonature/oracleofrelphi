// Standalone aspect parity: the canonical harmonic A↔A relationship rows own the standalone wheel lines.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyStandaloneAspectParityV1)return;
window.__relphiSkyStandaloneAspectParityV1=true;

const NS='http://www.w3.org/2000/svg';
const COLORS=Object.freeze({
  conjunction:'#e53935','semi-sextile':'#7c9b49',octile:'#b86d43',sextile:'#d3b727',quintile:'#8b6cc2',square:'#d6534d',trine:'#4e9e69','tri-octile':'#9f5944','bi-quintile':'#7655aa',quincunx:'#4b8e88',opposition:'#5961c8'
});
const STYLE_ID='skyStandaloneAspectParityV1Style';
let queued=false,building=false;

const num=value=>{const n=Number(value);return Number.isFinite(n)?n:NaN};
const norm=value=>((Number(value)%360)+360)%360;
function installStyle(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');style.id=STYLE_ID;
  style.textContent='#skyFoundationWheelMount>svg.sky-foundation-wheel[data-single-sky="A"]:not([data-standalone-aspect-parity="ready"]) [data-layer="aspects"]{opacity:0}';
  document.head.appendChild(style);
}
function wheel(){return document.querySelector('#skyFoundationWheelMount>svg.sky-foundation-wheel[data-single-sky="A"]')}
function layer(chart){return chart?.querySelector('[data-layer="aspects"]')||null}
function rows(){return [...document.querySelectorAll('#skyFoundationRelationshipList>.sky-intrasky-generated[data-relationship-mode="A-A"][data-relation-index]')]}
function center(){return window.RelphiSkyWheelSpec?.comparison?.center||{x:600,y:600}}
function aspectRadius(){return Math.max(1,Number(window.RelphiSkyWheelSpec?.role?.('A')?.inner||166)-1)}
function longitude(chart,id){
  const node=chart.querySelector(`[data-layer="placements"] [data-sky="A"][data-placement="${CSS.escape(String(id||''))}"]`);
  const exact=num(node?.dataset?.exactLongitude??node?.dataset?.angleLongitude);
  return Number.isFinite(exact)?norm(exact):NaN;
}
function point(value){const c=center(),radius=aspectRadius(),angle=(norm(value)-180)*Math.PI/180;return{x:c.x+radius*Math.cos(angle),y:c.y+radius*Math.sin(angle)}}
function copyDataset(line,row,key,target=key){const value=row.dataset[key];if(value!==undefined&&value!=='')line.dataset[target]=value}
function makeLine(chart,row){
  const left=longitude(chart,row.dataset.leftPlacement),right=longitude(chart,row.dataset.rightPlacement);if(!Number.isFinite(left)||!Number.isFinite(right))return null;
  const a=point(left),b=point(right),aspect=String(row.dataset.aspect||'');
  const line=document.createElementNS(NS,'line');
  line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);line.setAttribute('x2',b.x);line.setAttribute('y2',b.y);
  line.setAttribute('stroke',COLORS[aspect]||'#7655aa');line.setAttribute('class','sky-foundation-aspect');
  line.dataset.aspect=aspect;line.dataset.leftPlacement=String(row.dataset.leftPlacement||'');line.dataset.rightPlacement=String(row.dataset.rightPlacement||'');
  line.dataset.leftSky='A';line.dataset.rightSky='A';line.dataset.relationshipMode='A-A';line.dataset.relationIndex=String(row.dataset.relationIndex||'');
  copyDataset(line,row,'sourceOrb','orb');copyDataset(line,row,'leftHouse');copyDataset(line,row,'rightHouse');copyDataset(line,row,'leftSign');copyDataset(line,row,'rightSign');
  copyDataset(line,row,'harmonicOrder');copyDataset(line,row,'harmonicNumerator');copyDataset(line,row,'phaseError');copyDataset(line,row,'harmonicCoherence');
  line.dataset.interactive='aspect';line.dataset.focusPiece='aspect';line.setAttribute('tabindex','0');line.setAttribute('role','button');
  line.setAttribute('aria-label',row.getAttribute('aria-label')||`Sky A ${row.dataset.leftPlacement||''} ${aspect} Sky A ${row.dataset.rightPlacement||''}`);
  return line;
}
function rebuild(){
  queued=false;if(building)return;
  const chart=wheel(),aspectLayer=layer(chart);if(!chart||!aspectLayer)return;
  const canonicalRows=rows();if(!canonicalRows.length){chart.dataset.standaloneAspectParity='waiting';schedule();return}
  building=true;
  try{
    aspectLayer.replaceChildren();
    let count=0;canonicalRows.forEach(row=>{const line=makeLine(chart,row);if(line){aspectLayer.appendChild(line);count++}});
    chart.dataset.standaloneAspectParity='ready';chart.dataset.standaloneAspectCount=String(count);
    window.dispatchEvent(new CustomEvent('relphi:sky-single-sky-aspects-rendered',{detail:{slot:'A',mode:'A-A',count,source:'harmonic-row-parity'}}));
  }finally{building=false}
}
function schedule(){if(queued||building)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(rebuild))}
function start(){
  installStyle();schedule();
  ['relphi:sky-foundation-ready','relphi:sky-intrasky-relationships-ready','relphi:sky-b-removed','relphi:sky-where-when-committed','relphi:saved-sky-loaded','relphi:sky-harmonic-window-visibility-changed'].forEach(name=>window.addEventListener(name,schedule));
  const mount=document.getElementById('skyFoundationWheelMount');if(mount)new MutationObserver(records=>{if(building)return;if(records.some(record=>record.type==='childList'))schedule()}).observe(mount,{childList:true,subtree:false});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
