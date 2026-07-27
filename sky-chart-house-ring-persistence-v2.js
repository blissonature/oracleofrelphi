// Keeps the last complete house-ring structure visible until a complete replacement is ready.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS='http://www.w3.org/2000/svg';
  const WHEELS='.unified-sky-wheel svg.chart-wheel-svg,#chartOutput svg.chart-wheel-svg,#currentSkyOutput svg.chart-wheel-svg,.sky-output-box svg.chart-wheel-svg';
  const STRUCTURE='relphi-dual-house-rings';
  const CACHE='relphiSkyChartCompleteHouseStructureV2';
  let queued=false;

  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch(_){return null;}}
  function placements(payload){const value=payload&&(payload.placements||payload);return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
  function expected(){return Object.keys(placements(read('relphiSkyChartB'))).length?2:1;}
  function complete(layer){return layer&&layer.dataset.ready==='true'&&layer.querySelectorAll(':scope>.relphi-house-ring').length>=expected()&&layer.querySelectorAll('.relphi-zodiac-plain-host[data-ready="true"]').length===12;}
  function save(layer){if(!complete(layer))return;try{localStorage.setItem(CACHE,layer.outerHTML);}catch(_){}}
  function restore(svg){let html='';try{html=localStorage.getItem(CACHE)||'';}catch(_){}if(!html)return null;const shell=document.createElementNS(NS,'svg');shell.innerHTML=html;const layer=shell.firstElementChild;if(!layer||layer.querySelectorAll(':scope>.relphi-house-ring').length<expected())return null;layer.dataset.relphiPersistentHouseFallback='true';svg.insertBefore(layer,svg.firstChild);return layer;}
  function maintain(svg){
    const ready=Array.from(svg.querySelectorAll(':scope>.'+STRUCTURE+'[data-ready="true"]'));
    const good=ready.filter(complete);
    const newest=good[good.length-1];
    if(newest){save(newest);ready.forEach(function(layer){if(layer!==newest&&!complete(layer))layer.remove();});return;}
    ready.forEach(function(layer){if(!complete(layer))layer.style.visibility='hidden';});
    if(!svg.querySelector(':scope>.'+STRUCTURE+'[data-relphi-persistent-house-fallback="true"]'))restore(svg);
  }
  function run(){queued=false;document.querySelectorAll(WHEELS).forEach(maintain);}
  function queue(){if(queued)return;queued=true;requestAnimationFrame(run);}
  function start(){queue();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-ready']});window.addEventListener('relphi:house-system-changed',queue);window.addEventListener('relphi:extra-points-updated',queue);window.addEventListener('storage',queue);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();