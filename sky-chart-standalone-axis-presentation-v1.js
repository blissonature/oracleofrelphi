// Standalone-only presentation for Asc / Dsc / MC / IC.
// Comparison-wheel angle sizing remains owned exclusively by the approved foundation renderer.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyStandaloneAxisPresentationV1)return;
  window.__relphiSkyStandaloneAxisPresentationV1=true;

  const ANGLES=['asc','dsc','mc','ic'];
  const norm=value=>((Number(value)%360)+360)%360;
  function point(center,radius,degree){
    const angle=(norm(degree)-180)*Math.PI/180;
    return{x:center.x+radius*Math.cos(angle),y:center.y+radius*Math.sin(angle)};
  }

  function apply(){
    const wheel=document.querySelector('#skyFoundationWheelMount .sky-foundation-single-wheel[data-single-sky]');
    const spec=window.RelphiSkyWheelSpec;
    if(!wheel||!spec?.mini?.center||!spec?.miniRole)return;
    const center=spec.mini.center;
    const geometry=spec.miniRole('A');
    const edge=Number(geometry?.edge);
    const inward=Math.max(0,edge-(Number(spec.mini.angleGap)||12));
    if(!Number.isFinite(edge))return;

    ANGLES.forEach(id=>{
      const host=wheel.querySelector(`[data-layer="placements"] [data-angle-axis="true"][data-placement="${id}"]`);
      const line=wheel.querySelector(`[data-layer="leaders"] [data-angle="${id}"]`);
      const degree=Number(line?.dataset?.exactLongitude??host?.dataset?.exactLongitude);
      if(!host||!line||!Number.isFinite(degree))return;

      const innerPoint=point(center,inward,degree);
      const edgePoint=point(center,edge,degree);
      line.setAttribute('x1',String(innerPoint.x));
      line.setAttribute('y1',String(innerPoint.y));
      line.setAttribute('x2',String(edgePoint.x));
      line.setAttribute('y2',String(edgePoint.y));
      line.setAttribute('stroke-width','1.3');
      line.dataset.standaloneAxisDirection='inward';

      if(host.dataset.standaloneAxisScale!=='approved'){
        const transform=String(host.getAttribute('transform')||'').replace(/\s+scale\([^)]*\)\s*$/,'');
        host.setAttribute('transform',`${transform} scale(.77)`);
        host.dataset.standaloneAxisScale='approved';
      }
    });
    wheel.dataset.standaloneAxes='approved';
  }

  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply()});
  }

  function start(){
    window.addEventListener('relphi:sky-single-sky-aspects-rendered',schedule);
    window.addEventListener('relphi:sky-foundation-ready',schedule);
    window.addEventListener('storage',event=>{
      if(!event.key||event.key==='relphiSkyChartA'||event.key==='relphiSkyChartB')schedule();
    });
    schedule();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
