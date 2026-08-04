// Comparison-wheel zodiac signs use the uncircled canonical master directly.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyWheelUncircledZodiacV1)return;
  window.__relphiSkyWheelUncircledZodiacV1=true;

  const SIGNS=new Set(['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']);
  let queued=false;

  function colorFor(host){
    return host.dataset.zodiacGlyphColor||'#171717';
  }

  async function replaceHost(host){
    const id=String(host.dataset.zodiacSign||'').toLowerCase();
    if(!SIGNS.has(id)||host.dataset.uncircledCanonicalZodiac==='ready')return;
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
      host.dataset.uncircledCanonicalZodiac='ready';
      host.dataset.circlePresentation='never-created';
      host.dataset.canonicalFrame='preserved';
    }catch(error){
      host.dataset.uncircledCanonicalZodiac='error';
      console.error(error);
    }
  }

  function apply(){
    queued=false;
    document.querySelectorAll('[data-layer="zodiac"] .sky-foundation-sign-glyph[data-zodiac-sign]').forEach(replaceHost);
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>requestAnimationFrame(apply));
  }

  function start(){
    ['relphi:sky-foundation-rendered','relphi:sky-foundation-interactions-ready'].forEach(name=>window.addEventListener(name,schedule));
    new MutationObserver(mutations=>{
      if(mutations.some(mutation=>Array.from(mutation.addedNodes).some(node=>node.nodeType===1)))schedule();
    }).observe(document.body,{childList:true,subtree:true});
    schedule();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
