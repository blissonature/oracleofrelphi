(function () {
  'use strict';
  if (window.__relphiSelectedRelationshipWheelBridgeV1) return;
  window.__relphiSelectedRelationshipWheelBridgeV1 = true;

  const NS='http://www.w3.org/2000/svg';
  const ASPECT_ANGLES=Object.freeze({
    conjunction:0,'semi-sextile':30,octile:45,sextile:60,quintile:72,square:90,
    trine:120,'tri-octile':135,'bi-quintile':144,quincunx:150,opposition:180
  });
  let aperture=null,linkedLine=null,forcedLine=null,queued=false,observer=null;

  function installHitTargets() {
    document.querySelectorAll('[data-layer="aspects"] > line[data-relation-index]:not(.sky-foundation-aspect-hit)').forEach(function (line) {
      line.classList.add('sky-foundation-aspect');
      if (line.dataset.hitTargetInstalled === 'true') return;
      line.dataset.hitTargetInstalled = 'true';
      const hit = line.cloneNode(false);
      hit.removeAttribute('class');
      hit.classList.add('sky-foundation-aspect-hit');
      hit.setAttribute('stroke', 'transparent');
      hit.setAttribute('stroke-width', '16');
      hit.setAttribute('pointer-events', 'stroke');
      hit.setAttribute('tabindex', '-1');
      hit.setAttribute('aria-hidden', 'true');
      hit.dataset.interactive = 'aspect';
      hit.dataset.focusPiece = 'aspect';
      hit.dataset.relationIndex = line.dataset.relationIndex;
      line.parentNode.insertBefore(hit, line.nextSibling);
    });
  }

  function selectedRow(){
    return document.querySelector('#skyFoundationRelationshipList > .sky-foundation-relationship-row[aria-current="true"]') ||
      document.querySelector('#skyFoundationRelationshipList > .sky-foundation-relationship-row.is-relationship-selected');
  }

  function lineForSelectedRow(row=selectedRow()){
    if(!row||row.hidden||getComputedStyle(row).display==='none')return null;
    const index=String(row.dataset.relationIndex||'');
    if(!index)return null;
    return Array.from(document.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)'))
      .find(line=>String(line.dataset.relationIndex||'')===index)||null;
  }

  function selectedLine(row=selectedRow()){
    return lineForSelectedRow(row) ||
      document.querySelector('[data-layer="aspects"] > line.sky-foundation-aspect.is-relationship-line:not(.sky-foundation-aspect-hit)') ||
      document.querySelector('[data-layer="aspects"] > line.sky-foundation-aspect[data-selected-relation="true"]:not(.sky-foundation-aspect-hit)') ||
      document.querySelector('[data-layer="aspects"] > line.sky-foundation-aspect.is-selected:not(.sky-foundation-aspect-hit)');
  }

  function forceLine(line){
    if(forcedLine&&forcedLine!==line)forcedLine.classList.remove('sky-orb-bridge-selected-line');
    forcedLine=line||null;
    if(!line)return;
    line.classList.add('sky-orb-bridge-selected-line');
    line.removeAttribute('hidden');
    line.classList.remove('sky-chart-relationship-filter-hidden');
    if(line.style.getPropertyValue('display')==='none')line.style.removeProperty('display');
    if(line.style.getPropertyValue('visibility')==='hidden')line.style.removeProperty('visibility');
  }

  function chartCenter(svg){
    const box=svg?.viewBox?.baseVal;
    if(box&&Number.isFinite(box.width)&&box.width>0)return{x:box.x+box.width/2,y:box.y+box.height/2};
    return{x:(Number(svg?.getAttribute('width'))||1200)/2,y:(Number(svg?.getAttribute('height'))||1200)/2};
  }

  function attr(value){return String(value??'').replace(/\\/g,'\\\\').replace(/"/g,'\\"')}
  function rowSkies(row){
    const mode=String(row?.dataset?.relationshipMode||'');
    if(mode==='A-A')return['A','A'];
    if(mode==='B-B')return['B','B'];
    return[String(row?.dataset?.leftSky||'A'),String(row?.dataset?.rightSky||'B')];
  }
  function addAll(set,nodes){nodes.forEach(node=>set.add(node))}
  function endpointNodes(wheel,sky,id){
    if(!wheel||!sky||!id)return[];
    const s=attr(sky),p=attr(id);
    return Array.from(wheel.querySelectorAll(`[data-sky="${s}"][data-placement="${p}"],[data-sky="${s}"][data-angle="${p}"]`));
  }
  function houseNodes(wheel,sky,house){
    if(!wheel||!sky||!Number.isFinite(Number(house))||Number(house)<1)return{sectors:[],numbers:[]};
    const s=attr(sky),h=String(Math.trunc(Number(house)));
    const sectors=Array.from(wheel.querySelectorAll(`[data-sky="${s}"][data-house="${h}"][data-focus-piece="house"],[data-sky="${s}"][data-house="${h}"][data-interactive="house"]`));
    const layer=wheel.querySelector(`[data-layer="${sky==='A'?'a-houses':'b-houses'}"]`);
    const numbers=layer?Array.from(layer.querySelectorAll('.sky-foundation-house-number')).filter((_,index)=>index===Number(h)-1):[];
    return{sectors,numbers};
  }
  function syncClass(wheel,className,desired){
    wheel?.querySelectorAll(`.${className}`).forEach(node=>{if(!desired.has(node))node.classList.remove(className)});
    desired.forEach(node=>{if(!node.classList.contains(className))node.classList.add(className)});
  }
  function syncContext(row){
    const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
    if(!wheel)return;
    const endpoints=new Set(),houses=new Set(),houseNumbers=new Set();
    if(row){
      const[leftSky,rightSky]=rowSkies(row);
      addAll(endpoints,endpointNodes(wheel,leftSky,row.dataset.leftPlacement));
      addAll(endpoints,endpointNodes(wheel,rightSky,row.dataset.rightPlacement));
      const leftHouse=houseNodes(wheel,leftSky,row.dataset.leftHouse),rightHouse=houseNodes(wheel,rightSky,row.dataset.rightHouse);
      addAll(houses,leftHouse.sectors);addAll(houses,rightHouse.sectors);
      addAll(houseNumbers,leftHouse.numbers);addAll(houseNumbers,rightHouse.numbers);
    }
    syncClass(wheel,'sky-orb-bridge-endpoint',endpoints);
    syncClass(wheel,'sky-orb-bridge-house',houses);
    syncClass(wheel,'sky-orb-bridge-house-number',houseNumbers);
  }

  function removeAperture(){aperture?.remove();aperture=null;linkedLine=null}

  function syncVisual(){
    if(!aperture||!linkedLine||!linkedLine.isConnected){removeAperture();return}
    const style=getComputedStyle(linkedLine),hidden=linkedLine.hidden||style.display==='none'||style.visibility==='hidden';
    aperture.hidden=hidden;
    if(hidden)return;
    const opacity=Number.parseFloat(style.opacity),lineOpacity=Number.isFinite(opacity)?opacity:1;
    aperture.style.setProperty('--orb-aspect-color',linkedLine.getAttribute('stroke')||style.stroke||'#777');
    aperture.style.opacity=String(Math.max(0,Math.min(1,lineOpacity)));
  }

  function normAngle(value){const tau=Math.PI*2;return((value%tau)+tau)%tau}
  function angleDistance(a,b){const tau=Math.PI*2,d=Math.abs(normAngle(a)-normAngle(b));return Math.min(d,tau-d)}
  function aspectDefinition(row,line){
    const id=String(row?.dataset?.aspect||line?.dataset?.aspect||'');
    const definition=window.RelphiHarmonicOrb?.byId?.(id)||null;
    const angle=Number(definition?.angle??ASPECT_ANGLES[id]);
    const harmonic=Math.abs(Number(row?.dataset?.harmonicOrder||line?.dataset?.harmonicOrder||definition?.harmonic||1))||1;
    return{id,angle:Number.isFinite(angle)?angle:0,harmonic};
  }
  function apertureMetrics(row,line){
    const definition=aspectDefinition(row,line);
    let masterWindow=Number(row?.dataset?.harmonicWindow);
    if(!Number.isFinite(masterWindow))masterWindow=Number(document.documentElement.dataset.skyHarmonicWindow);
    if(!Number.isFinite(masterWindow))masterWindow=Number(window.RelphiHarmonicOrb?.defaultWindow||0);
    masterWindow=Math.max(0,masterWindow);
    const allowedOrb=definition.harmonic>0?masterWindow/definition.harmonic:0;
    const currentOrb=Math.abs(Number(row?.dataset?.sourceOrb||line?.dataset?.orb||line?.dataset?.sourceOrb||0));
    return{...definition,masterWindow,allowedOrb,currentOrb:Number.isFinite(currentOrb)?currentOrb:0};
  }

  function buildAperture(line,row){
    removeAperture();
    if(!line)return;
    const metrics=apertureMetrics(row,line),orb=metrics.allowedOrb;
    if(!Number.isFinite(orb)||orb<=0)return;
    const x1=Number(line.getAttribute('x1')),y1=Number(line.getAttribute('y1')),x2=Number(line.getAttribute('x2')),y2=Number(line.getAttribute('y2'));
    if(![x1,y1,x2,y2].every(Number.isFinite))return;
    const svg=line.ownerSVGElement,c=chartCenter(svg),radius=Math.hypot(x2-c.x,y2-c.y);
    if(!radius)return;
    const leftAngle=Math.atan2(y1-c.y,x1-c.x),actualRightAngle=Math.atan2(y2-c.y,x2-c.x),targetSeparation=metrics.angle*Math.PI/180;
    const candidateA=leftAngle+targetSeparation,candidateB=leftAngle-targetSeparation;
    const exactRightAngle=angleDistance(candidateA,actualRightAngle)<=angleDistance(candidateB,actualRightAngle)?candidateA:candidateB;
    const delta=orb*Math.PI/180,start=exactRightAngle-delta,end=exactRightAngle+delta;
    const pA={x:c.x+radius*Math.cos(start),y:c.y+radius*Math.sin(start)};
    const pB={x:c.x+radius*Math.cos(end),y:c.y+radius*Math.sin(end)};
    const large=delta*2>Math.PI?1:0;
    const path=document.createElementNS(NS,'path');
    path.classList.add('sky-relationship-orb-aperture');
    path.setAttribute('d',`M ${x1} ${y1} L ${pA.x} ${pA.y} A ${radius} ${radius} 0 ${large} 1 ${pB.x} ${pB.y} Z`);
    path.setAttribute('pointer-events','none');
    path.setAttribute('aria-hidden','true');
    path.dataset.relationIndex=line.dataset.relationIndex||'';
    path.dataset.allowedOrb=String(orb);
    path.dataset.currentOrb=String(metrics.currentOrb);
    path.dataset.harmonicWindow=String(metrics.masterWindow);
    line.parentNode.insertBefore(path,line);
    aperture=path;linkedLine=line;syncVisual();
  }

  function syncSelection(){
    queued=false;installHitTargets();
    const row=selectedRow(),line=selectedLine(row);
    syncContext(row);
    forceLine(line);
    if(!line){removeAperture();return}
    const metrics=apertureMetrics(row,line),allowed=metrics.allowedOrb;
    if(line!==linkedLine||!aperture||Number(aperture.dataset.allowedOrb)!==allowed||String(aperture.dataset.relationIndex||'')!==String(line.dataset.relationIndex||''))buildAperture(line,row);else syncVisual();
  }

  function schedule(){if(queued)return;queued=true;requestAnimationFrame(syncSelection)}

  function observeWheel(){
    observer?.disconnect();
    const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
    if(!wheel)return;
    observer=new MutationObserver(schedule);
    observer.observe(wheel,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden','data-selected-relation']});
  }

  function start(){
    installHitTargets();observeWheel();schedule();
    ['relphi:sky-foundation-interactions-ready','relphi:sky-foundation-ready','relphi:sky-foundation-filter-changed','relphi:sky-relationship-selected','relphi:sky-single-sky-aspects-rendered','relphi:sky-orb-limit-changed','relphi:sky-placement-multiselect-changed'].forEach(name=>window.addEventListener(name,()=>{if(name==='relphi:sky-foundation-ready')observeWheel();schedule()}));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
