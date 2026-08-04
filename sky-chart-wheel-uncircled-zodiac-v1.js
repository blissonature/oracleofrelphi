// Comparison-wheel zodiac signs use the uncircled canonical master directly.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyWheelUncircledZodiacV4)return;
  window.__relphiSkyWheelUncircledZodiacV4=true;

  const NS='http://www.w3.org/2000/svg';
  const FILTER_ID='sky-wheel-zodiac-shape-halo-v1';
  const SIGNS=new Set(['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']);
  let queued=false;

  function installStyles(){
    if(document.getElementById('skyWheelMobileLegibilityV4'))return;
    const style=document.createElement('style');
    style.id='skyWheelMobileLegibilityV4';
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
      @media(max-width:620px){
        #skyFoundationComparison .sky-foundation-house-number{
          font-size:31px!important;
          stroke-width:4px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureHaloFilter(svg){
    if(!svg)return null;
    let defs=svg.querySelector(':scope > defs');
    if(!defs){
      defs=document.createElementNS(NS,'defs');
      svg.insertBefore(defs,svg.firstChild);
    }
    let filter=defs.querySelector(`#${FILTER_ID}`);
    if(filter)return filter;

    filter=document.createElementNS(NS,'filter');
    filter.id=FILTER_ID;
    filter.setAttribute('x','-80%');
    filter.setAttribute('y','-80%');
    filter.setAttribute('width','260%');
    filter.setAttribute('height','260%');
    filter.setAttribute('color-interpolation-filters','sRGB');
    filter.innerHTML=`
      <feMorphology in="SourceAlpha" operator="dilate" radius="4.2" result="expanded"/>
      <feGaussianBlur in="expanded" stdDeviation="1.1" result="softExpanded"/>
      <feFlood flood-color="#f8f8f5" flood-opacity="1" result="white"/>
      <feComposite in="white" in2="softExpanded" operator="in" result="whiteHalo"/>
      <feMorphology in="SourceAlpha" operator="dilate" radius="7" result="wideExpanded"/>
      <feGaussianBlur in="wideExpanded" stdDeviation="2.4" result="wideSoft"/>
      <feFlood flood-color="#cfcfca" flood-opacity=".72" result="gray"/>
      <feComposite in="gray" in2="wideSoft" operator="in" result="grayHalo"/>
      <feMerge>
        <feMergeNode in="grayHalo"/>
        <feMergeNode in="whiteHalo"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>`;
    defs.appendChild(filter);
    return filter;
  }

  function colorFor(host){return host.dataset.zodiacGlyphColor||'#171717'}

  function removeMasterCircle(host){
    host.querySelectorAll('.relphi-glyph-bubble > circle').forEach(circle=>circle.remove());
    host.querySelectorAll('.relphi-canonical-master-frame > .relphi-glyph-bubble > circle').forEach(circle=>circle.remove());
    host.dataset.circlePresentation='removed';
  }

  function applyHalo(host){
    const svg=host.ownerSVGElement;
    if(!ensureHaloFilter(svg))return;
    const frame=host.querySelector('.relphi-canonical-master-frame')||host.querySelector('.relphi-canonical-glyph')||host.firstElementChild;
    if(!frame)return;
    frame.setAttribute('filter',`url(#${FILTER_ID})`);
    frame.dataset.legibilityTreatment='svg-alpha-white-gray-halo';
    host.dataset.legibilityTreatment='svg-alpha-white-gray-halo';
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
      applyHalo(host);
      host.dataset.uncircledCanonicalZodiac='ready';
      host.dataset.canonicalFrame='preserved';
    }catch(error){
      host.dataset.uncircledCanonicalZodiac='error';
      console.error(error);
    }
  }

  function apply(){
    queued=false;
    document.querySelectorAll('[data-layer="zodiac"] .sky-foundation-sign-glyph[data-zodiac-sign]').forEach(host=>{
      if(host.dataset.uncircledCanonicalZodiac!=='ready')void replaceHost(host);
      else{
        removeMasterCircle(host);
        applyHalo(host);
      }
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
