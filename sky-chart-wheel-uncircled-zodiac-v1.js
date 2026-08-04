// Render comparison-wheel zodiac signs exactly as the Master Glyph List uncircled set.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyWheelUncircledZodiacV6)return;
  window.__relphiSkyWheelUncircledZodiacV6=true;

  const NS='http://www.w3.org/2000/svg';
  const MASTER_RADIUS=19;
  const SIGNS=new Set(['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']);
  let queued=false;

  function installStyles(){
    if(document.getElementById('skyWheelCanonLegibilityV6'))return;
    const style=document.createElement('style');
    style.id='skyWheelCanonLegibilityV6';
    style.textContent=`
      #skyFoundationComparison .sky-foundation-house-number{
        font-size:24px!important;font-weight:900!important;fill:#171717!important;
        paint-order:stroke fill;stroke:#fffdf8;stroke-width:3px;stroke-linejoin:round
      }
      #skyFoundationComparison [data-layer="zodiac"] .sky-foundation-sign-glyph .relphi-glyph-bubble > circle{
        opacity:0!important;visibility:hidden!important;pointer-events:none!important
      }
      @media(max-width:620px){
        #skyFoundationComparison .sky-foundation-house-number{font-size:31px!important;stroke-width:4px}
      }
    `;
    document.head.appendChild(style);
  }

  function hideCanonicalCircle(host){
    host.querySelectorAll('.relphi-glyph-bubble > circle').forEach(circle=>{
      circle.style.setProperty('opacity','0','important');
      circle.style.setProperty('visibility','hidden','important');
      circle.style.setProperty('pointer-events','none','important');
      circle.setAttribute('aria-hidden','true');
    });
    host.dataset.circlePresentation='canonical-hidden';
  }

  function addHalo(stage,art,id){
    if(!art)return;
    const filterId=`zodiac-canon-halo-${id}-${Math.random().toString(36).slice(2,8)}`;
    const defs=document.createElementNS(NS,'defs');
    const filter=document.createElementNS(NS,'filter');
    filter.setAttribute('id',filterId);
    filter.setAttribute('x','-45%');
    filter.setAttribute('y','-45%');
    filter.setAttribute('width','190%');
    filter.setAttribute('height','190%');
    filter.setAttribute('color-interpolation-filters','sRGB');
    filter.innerHTML=`
      <feMorphology in="SourceAlpha" operator="dilate" radius="1.65" result="expanded"/>
      <feFlood flood-color="#fffdf8" flood-opacity="1" result="white"/>
      <feComposite in="white" in2="expanded" operator="in" result="whiteEdge"/>
      <feMorphology in="SourceAlpha" operator="dilate" radius="3.2" result="wide"/>
      <feGaussianBlur in="wide" stdDeviation="1.8" result="soft"/>
      <feFlood flood-color="#c8c8c4" flood-opacity="0.78" result="gray"/>
      <feComposite in="gray" in2="soft" operator="in" result="grayGlow"/>
      <feMerge><feMergeNode in="grayGlow"/><feMergeNode in="whiteEdge"/><feMergeNode in="SourceGraphic"/></feMerge>`;
    defs.appendChild(filter);
    stage.insertBefore(defs,stage.firstChild);
    art.setAttribute('filter',`url(#${filterId})`);
    art.dataset.zodiacHalo='white-gray-shape-following';
  }

  async function replaceHost(host){
    const id=String(host.dataset.zodiacSign||'').toLowerCase();
    const component=window.RelphiGlyphComponent;
    if(!SIGNS.has(id)||!component?.createBubble)return;

    host.dataset.uncircledCanonicalZodiac='rendering';
    host.replaceChildren();
    const stage=document.createElementNS(NS,'svg');
    stage.setAttribute('viewBox','-32 -32 64 64');
    stage.setAttribute('preserveAspectRatio','xMidYMid meet');
    stage.setAttribute('aria-hidden','true');
    stage.setAttribute('x','-32');
    stage.setAttribute('y','-32');
    stage.setAttribute('width','64');
    stage.setAttribute('height','64');
    stage.style.overflow='visible';
    host.appendChild(stage);

    try{
      const bubble=component.createBubble(stage,id,{
        radius:MASTER_RADIUS,
        padding:1,
        color:host.dataset.zodiacGlyphColor||'#171717'
      });
      hideCanonicalCircle(host);
      const art=await bubble.ready;
      hideCanonicalCircle(host);
      addHalo(stage,art,id);
      host.dataset.uncircledCanonicalZodiac='ready';
      host.dataset.canonicalImport='master-glyph-list-direct-uncircled';
      host.dataset.anchorContract='canonical-origin-at-wheel-sign-midpoint';
    }catch(error){
      host.dataset.uncircledCanonicalZodiac='error';
      console.error(error);
    }
  }

  function apply(){
    queued=false;
    document.querySelectorAll('[data-layer="zodiac"] .sky-foundation-sign-glyph[data-zodiac-sign]').forEach(host=>{
      const stage=host.querySelector(':scope > svg');
      const positioned=stage?.getAttribute('x')==='-32'&&stage?.getAttribute('y')==='-32';
      const halo=!!host.querySelector('[data-zodiac-halo]');
      if(host.dataset.canonicalImport!=='master-glyph-list-direct-uncircled'||!positioned||!halo)void replaceHost(host);
      else hideCanonicalCircle(host);
    });
  }

  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(apply))}
  function start(){
    installStyles();
    ['relphi:sky-foundation-rendered','relphi:sky-foundation-interactions-ready'].forEach(name=>window.addEventListener(name,schedule));
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','transform']});
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();