// Smooth Progressions playback: lightweight timed updates, browser-interpolated glyph motion,
// and transport controls kept immediately beside the viewing area.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyProgressionsSmoothPlaybackV1)return;
  window.__relphiSkyProgressionsSmoothPlaybackV1=true;

  const NS='http://www.w3.org/2000/svg';
  const UPDATE_MS=80;
  const TWEEN_MS=76;
  let playing=false;
  let raf=0;
  let lastFrame=0;
  let accumulated=0;
  let playheadDays=0;
  let syntheticInput=false;
  let watchedWheel=null;
  let placementObserver=null;

  function panel(){return document.getElementById('skyProgressionsPanel')}
  function slider(){return panel()?.querySelector('[data-progression-scrubber]')}
  function playButton(){return panel()?.querySelector('[data-progression-play]')}
  function speedControl(){return panel()?.querySelector('[data-progression-speed]')}

  function injectStyle(){
    if(document.getElementById('skyProgressionsSmoothPlaybackStyle'))return;
    const style=document.createElement('style');
    style.id='skyProgressionsSmoothPlaybackStyle';
    style.textContent=`
      .sky-progression-transport{
        position:sticky;top:.35rem;z-index:6;
        margin:.4rem 0 .55rem;padding:.45rem .5rem;
        border:1px solid rgba(25,23,20,.11);border-radius:.75rem;
        background:rgba(255,255,255,.94);backdrop-filter:blur(7px);
      }
      .sky-progression-transport .sky-progression-scrub-row{margin:0}
      .sky-progressions-panel .sky-progression-playback:empty{display:none}
      @media(max-width:520px){.sky-progression-transport{top:.2rem;padding:.4rem}}
    `;
    document.head.appendChild(style);
  }

  function installTransport(){
    const root=panel();if(!root)return false;
    const row=root.querySelector('.sky-progression-scrub-row'),wheel=root.querySelector('.sky-progressions-wheel-shell');
    if(!row||!wheel)return false;
    let transport=root.querySelector('.sky-progression-transport');
    if(!transport){transport=document.createElement('div');transport.className='sky-progression-transport';wheel.before(transport)}
    if(row.parentElement!==transport)transport.appendChild(row);
    const range=slider();if(range)range.step='any';
    return true;
  }

  function parseTranslate(value){
    const match=String(value||'').match(/translate\(\s*(-?\d+(?:\.\d+)?)\s*[ ,]\s*(-?\d+(?:\.\d+)?)\s*\)/i);
    return match?{x:Number(match[1]),y:Number(match[2])}:null;
  }
  function primePlacement(node){
    const point=parseTranslate(node.getAttribute('transform'));if(!point)return;
    node.dataset.progressionSmoothX=String(point.x);node.dataset.progressionSmoothY=String(point.y);
  }
  function animatePlacement(node){
    const next=parseTranslate(node.getAttribute('transform'));if(!next)return;
    const oldX=Number(node.dataset.progressionSmoothX),oldY=Number(node.dataset.progressionSmoothY);
    node.dataset.progressionSmoothX=String(next.x);node.dataset.progressionSmoothY=String(next.y);
    if(!Number.isFinite(oldX)||!Number.isFinite(oldY)||Math.hypot(next.x-oldX,next.y-oldY)<.01)return;
    node.querySelectorAll(':scope > animateTransform[data-progression-smooth-motion]').forEach(animation=>animation.remove());
    const animation=document.createElementNS(NS,'animateTransform');
    animation.setAttribute('data-progression-smooth-motion','true');
    animation.setAttribute('attributeName','transform');
    animation.setAttribute('type','translate');
    animation.setAttribute('from',`${oldX} ${oldY}`);
    animation.setAttribute('to',`${next.x} ${next.y}`);
    animation.setAttribute('dur',`${TWEEN_MS}ms`);
    animation.setAttribute('calcMode','linear');
    animation.setAttribute('fill','freeze');
    node.appendChild(animation);
    try{animation.beginElement()}catch(_){/* SVG animation begins automatically when supported. */}
    setTimeout(()=>animation.remove(),TWEEN_MS+30);
  }
  function watchWheel(){
    const wheel=panel()?.querySelector('[data-progression-shared-wheel="true"]');
    if(!wheel||wheel===watchedWheel)return;
    placementObserver?.disconnect();watchedWheel=wheel;
    wheel.querySelectorAll('[data-layer="placements"] [data-sky][transform]').forEach(primePlacement);
    placementObserver=new MutationObserver(records=>{
      const targets=new Set();
      for(const record of records)if(record.type==='attributes'&&record.attributeName==='transform'&&record.target.matches?.('[data-layer="placements"] [data-sky]'))targets.add(record.target);
      targets.forEach(animatePlacement);
    });
    placementObserver.observe(wheel,{subtree:true,attributes:true,attributeFilter:['transform']});
  }

  function syncButton(){
    const button=playButton();if(!button)return;
    button.dataset.playing=playing?'true':'false';
    button.textContent=playing?'Pause':'Play';
    button.setAttribute('aria-label',playing?'Pause progressions':'Play progressions');
  }
  function stopPlayback(){
    playing=false;lastFrame=0;accumulated=0;
    if(raf)cancelAnimationFrame(raf);raf=0;syncButton();
  }
  function sendPlayhead(){
    const range=slider();if(!range)return;
    syntheticInput=true;
    try{
      range.value=String(playheadDays);
      range.dispatchEvent(new Event('input',{bubbles:true}));
    }finally{syntheticInput=false}
    // The base Progressions input handler intentionally stops its own player.
    // Restore the state of this smoother transport after that handler runs.
    syncButton();
    requestAnimationFrame(()=>{installTransport();watchWheel()});
  }
  function startPlayback(){
    const range=slider();if(!range)return;
    playing=true;playheadDays=Number(range.value)||0;lastFrame=performance.now();accumulated=0;syncButton();
    function frame(now){
      if(!playing)return;
      const elapsed=Math.max(0,now-lastFrame);lastFrame=now;accumulated+=elapsed;
      if(accumulated>=UPDATE_MS){
        const seconds=accumulated/1000;accumulated=0;
        const speed=Number(speedControl()?.value)||30,max=Number(range.max)||0;
        playheadDays+=seconds*speed;
        if(playheadDays>=max){playheadDays=max;sendPlayhead();stopPlayback();return}
        sendPlayhead();
      }
      raf=requestAnimationFrame(frame);
    }
    raf=requestAnimationFrame(frame);
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-progression-play]');
    if(button){
      event.preventDefault();event.stopImmediatePropagation();
      playing?stopPlayback():startPlayback();
      return;
    }
    if(event.target.closest?.('[data-sky-middle-tab="comparison"], [data-progression-now]'))stopPlayback();
  },true);
  document.addEventListener('input',event=>{
    if(event.target.matches?.('[data-progression-scrubber]')&&!syntheticInput){playheadDays=Number(event.target.value)||0;stopPlayback()}
  },true);
  document.addEventListener('change',event=>{
    if(event.target.matches?.('[data-progression-source], [data-progression-reference], [data-progression-range-start], [data-progression-range-end]'))stopPlayback();
  },true);

  window.addEventListener('relphi:sky-foundation-ready',()=>requestAnimationFrame(()=>{installTransport();watchWheel()}));
  const structuralObserver=new MutationObserver(()=>{if(installTransport())watchWheel()});
  function start(){
    injectStyle();installTransport();watchWheel();
    structuralObserver.observe(document.body,{childList:true,subtree:true});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
