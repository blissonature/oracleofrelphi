(function () {
  'use strict';
  if (window.__relphiSelectedRelationshipWheelBridgeV1) return;
  window.__relphiSelectedRelationshipWheelBridgeV1 = true;

  const NS='http://www.w3.org/2000/svg';
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

  function lineForSelectedRow(){
    const row=selectedRow();
    if(!row||row.hidden||getComputedStyle(row).display==='none')return null;
    const index=String(row.dataset.relationIndex||'');
    if(!index)return null;
    return Array.from(document.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)'))
      .find(line=>String(line.dataset.relationIndex||'')===index)||null;
  }

  function selectedLine(){
    return lineForSelectedRow() ||
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
  }

  function chartCenter(svg){
    const box=svg?.viewBox?.baseVal;
    if(box&&Number.isFinite(box.width)&&box.width>0)return{x:box.x+box.width/2,y:box.y+box.height/2};
    return{x:(Number(svg?.getAttribute('width'))||1200)/2,y:(Number(svg?.getAttribute('height'))||1200)/2};
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

  function buildAperture(line){
    removeAperture();
    if(!line)return;
    const orb=Math.abs(Number(line.dataset.orb||line.dataset.sourceOrb));
    if(!Number.isFinite(orb)||orb<=0)return;
    const x1=Number(line.getAttribute('x1')),y1=Number(line.getAttribute('y1')),x2=Number(line.getAttribute('x2')),y2=Number(line.getAttribute('y2'));
    if(![x1,y1,x2,y2].every(Number.isFinite))return;
    const svg=line.ownerSVGElement,c=chartCenter(svg),dx=x2-c.x,dy=y2-c.y,radius=Math.hypot(dx,dy);
    if(!radius)return;
    const angle=Math.atan2(dy,dx),delta=orb*Math.PI/180;
    const pA={x:c.x+radius*Math.cos(angle-delta),y:c.y+radius*Math.sin(angle-delta)};
    const pB={x:c.x+radius*Math.cos(angle+delta),y:c.y+radius*Math.sin(angle+delta)};
    const path=document.createElementNS(NS,'path');
    path.classList.add('sky-relationship-orb-aperture');
    path.setAttribute('d',`M ${x1} ${y1} L ${pA.x} ${pA.y} L ${pB.x} ${pB.y} Z`);
    path.setAttribute('pointer-events','none');
    path.setAttribute('aria-hidden','true');
    path.dataset.relationIndex=line.dataset.relationIndex||'';
    path.dataset.orb=String(orb);
    line.parentNode.insertBefore(path,line);
    aperture=path;linkedLine=line;syncVisual();
  }

  function syncSelection(){
    queued=false;installHitTargets();
    const line=selectedLine();
    forceLine(line);
    if(!line){removeAperture();return}
    const orb=Math.abs(Number(line.dataset.orb||line.dataset.sourceOrb));
    if(line!==linkedLine||!aperture||Number(aperture.dataset.orb)!==orb)buildAperture(line);else syncVisual();
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
