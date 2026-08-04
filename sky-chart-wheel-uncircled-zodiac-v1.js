// Render comparison-wheel zodiac signs exactly as the Master Glyph List uncircled set.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyWheelUncircledZodiacV5)return;
  window.__relphiSkyWheelUncircledZodiacV5=true;

  const NS='http://www.w3.org/2000/svg';
  const MASTER_RADIUS=19;
  const SIGNS=new Set(['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']);
  let queued=false;

  function installStyles(){
    if(document.getElementById('skyWheelCanonLegibilityV5'))return;
    const style=document.createElement('style');
    style.id='skyWheelCanonLegibilityV5';
    style.textContent=`
      #skyFoundationComparison .sky-foundation-house-number{
        font-size:24px!important;font-weight:900!important;fill:#171717!important;
        paint-order:stroke fill;stroke:#fffdf8;stroke-width:3px;stroke-linejoin:round
      }
      #skyFoundationComparison [data-layer="zodiac"] .sky-foundation-sign-glyph .relphi-glyph-bubble > circle{
        opacity:0!important;
        visibility:hidden!important;
        pointer-events:none!important;
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
      await bubble.ready;
      hideCanonicalCircle(host);
      host.dataset.uncircledCanonicalZodiac='ready';
      host.dataset.canonicalImport='master-glyph-list-direct-uncircled';
    }catch(error){
      host.dataset.uncircledCanonicalZodiac='error';
      console.error(error);
    }
  }

  function apply(){
    queued=false;
    document.querySelectorAll('[data-layer="zodiac"] .sky-foundation-sign-glyph[data-zodiac-sign]').forEach(host=>{
      if(host.dataset.canonicalImport!=='master-glyph-list-direct-uncircled')void replaceHost(host);
      else hideCanonicalCircle(host);
    });
  }

  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(apply))}
  function start(){
    installStyles();
    ['relphi:sky-foundation-rendered','relphi:sky-foundation-interactions-ready'].forEach(name=>window.addEventListener(name,schedule));
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();