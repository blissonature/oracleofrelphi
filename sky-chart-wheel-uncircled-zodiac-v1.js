// Comparison-wheel zodiac signs use the uncircled canonical master directly.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyWheelUncircledZodiacV3)return;
  window.__relphiSkyWheelUncircledZodiacV3=true;

  const SIGNS=new Set(['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']);
  let queued=false;

  function installStyles(){
    if(document.getElementById('skyWheelMobileLegibilityV3'))return;
    const style=document.createElement('style');
    style.id='skyWheelMobileLegibilityV3';
    style.textContent=`
      #skyFoundationComparison .sky-foundation-house-number{
        font-size:24px!important;
        font-weight:900!important;
        fill:#171717!important;
        paint-order:stroke fill;
        stroke:#fffdf8;
        stroke-width:3px;
        stroke-linejoin:round;
      }
      #skyFoundationComparison .sky-foundation-sign-glyph .relphi-canonical-master-frame,
      #skyFoundationComparison .sky-foundation-sign-glyph .relphi-canonical-glyph{
        filter:
          drop-shadow(0 0 1.2px rgba(255,253,248,.98))
          drop-shadow(0 0 2.8px rgba(244,244,242,.95))
          drop-shadow(0 0 5px rgba(220,220,216,.72));
      }
      @media(max-width:620px){
        #skyFoundationComparison .sky-foundation-house-number{
          font-size:31px!important;
          stroke-width:4px;
        }
        #skyFoundationComparison .sky-foundation-sign-glyph .relphi-canonical-master-frame,
        #skyFoundationComparison .sky-foundation-sign-glyph .relphi-canonical-glyph{
          filter:
            drop-shadow(0 0 1.6px rgba(255,253,248,1))
            drop-shadow(0 0 3.5px rgba(244,244,242,.98))
            drop-shadow(0 0 6.5px rgba(210,210,206,.78));
        }
      }
    `;
    document.head.appendChild(style);
  }

  function colorFor(host){return host.dataset.zodiacGlyphColor||'#171717'}

  function removeMasterCircle(host){
    host.querySelectorAll('.relphi-glyph-bubble > circle').forEach(circle=>circle.remove());
    host.querySelectorAll('.relphi-canonical-master-frame > .relphi-glyph-bubble > circle').forEach(circle=>circle.remove());
    host.dataset.circlePresentation='removed';
  }

  async function replaceHost(host){
    const id=String(host.dataset.zodiacSign||'').toLowerCase();
    if(!SIGNS.has(id))return;
    const component=window.RelphiGlyphComponent;
    if(!component?.draw)return;

    host.dataset.uncircledCanonicalZodiac='rendering';
    host.replaceChildren();
    try{
      await component.draw(host,id,{
        radius:Number(host.dataset.wheelGlyphRadius)||19,
        padding:1,
        color:colorFor(host)
      });
      removeMasterCircle(host);
      host.dataset.uncircledCanonicalZodiac='ready';
      host.dataset.canonicalFrame='preserved';
      host.dataset.legibilityTreatment='shape-following-white-gray-halo';
    }catch(error){
      host.dataset.uncircledCanonicalZodiac='error';
      console.error(error);
    }
  }

  function apply(){
    queued=false;
    document.querySelectorAll('[data-layer="zodiac"] .sky-foundation-sign-glyph[data-zodiac-sign]').forEach(host=>{
      if(host.dataset.uncircledCanonicalZodiac!=='ready')void replaceHost(host);
      else removeMasterCircle(host);
    });
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>requestAnimationFrame(apply));
  }

  function start(){
    installStyles();
    ['relphi:sky-foundation-rendered','relphi:sky-foundation-interactions-ready'].forEach(name=>window.addEventListener(name,schedule));
    new MutationObserver(mutations=>{
      if(mutations.some(mutation=>Array.from(mutation.addedNodes).some(node=>node.nodeType===1)))schedule();
    }).observe(document.body,{childList:true,subtree:true});
    schedule();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
