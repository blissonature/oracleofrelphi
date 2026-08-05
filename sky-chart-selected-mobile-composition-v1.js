// Mobile composition for the selected relationship: no collisions, duplication, or horizontal overflow.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkySelectedMobileCompositionV1)return;
  window.__relphiSkySelectedMobileCompositionV1=true;

  let queued=false;

  function installStyles(){
    if(document.getElementById('skySelectedMobileCompositionStyles'))return;
    const style=document.createElement('style');
    style.id='skySelectedMobileCompositionStyles';
    style.textContent=`
      #skySelectedRelationship,
      #skySelectedRelationship .sky-selected-body{
        max-width:100%;
        overflow-x:clip;
      }
      #skySelectedRelationship .sky-selected-graphic{
        display:none!important;
      }
      #skySelectedRelationship .sky-redundancy-title{
        width:100%;
        max-width:100%;
        min-width:0;
      }
      #skySelectedRelationship .sky-redundancy-title .sky-progressive-token{
        min-width:0;
        max-width:100%;
      }
      #skySelectedRelationship .sky-mobile-card-composition > *{
        min-width:0;
        max-width:100%;
      }
      #skySelectedRelationship .sky-selected-card{
        min-width:0!important;
        max-width:100%!important;
        overflow:hidden;
      }
      #skySelectedRelationship .sky-selected-card img{
        display:block;
        width:100%;
        height:auto;
        max-width:100%;
      }
      #skySelectedRelationship .sky-redundancy-card-facts{
        max-width:100%;
        min-width:0;
      }
      #skySelectedRelationship .sky-redundancy-card-facts .sky-progressive-token{
        min-width:0;
        max-width:100%;
      }
      #skySelectedRelationship .sky-redundancy-card-facts .sky-progressive-glyph,
      #skySelectedRelationship .sky-redundancy-title .sky-progressive-glyph,
      #skySelectedRelationship .sky-selected-aspect-diagram .sky-progressive-glyph{
        width:2rem!important;
        height:2rem!important;
        min-width:2rem!important;
        max-width:2rem!important;
      }
      #skySelectedRelationship .sky-redundancy-card-facts svg,
      #skySelectedRelationship .sky-redundancy-title svg,
      #skySelectedRelationship .sky-selected-aspect-diagram h4 svg{
        width:100%!important;
        height:100%!important;
        max-width:100%!important;
      }
      #skySelectedRelationship .sky-selected-aspect-diagram{
        min-width:0!important;
        max-width:100%!important;
        overflow:visible!important;
      }
      #skySelectedRelationship .sky-selected-aspect-angle{
        white-space:normal!important;
        overflow-wrap:anywhere;
      }
      #skySelectedRelationship .sky-progressive-reading,
      #skySelectedRelationship [data-transit-timeline]{
        min-width:0;
        max-width:100%;
        overflow-x:clip;
      }
      @media(max-width:560px){
        #skySelectedRelationship{
          padding-inline:.7rem;
        }
        #skySelectedRelationship .sky-redundancy-title{
          display:grid;
          grid-template-columns:repeat(3,minmax(0,1fr));
          align-items:start;
          gap:.35rem;
          margin:.25rem 0 .8rem;
        }
        #skySelectedRelationship .sky-redundancy-title .sky-progressive-token{
          justify-content:center;
          text-align:center;
          font-size:.92rem;
        }
        #skySelectedRelationship .sky-redundancy-title .sky-progressive-token[data-progressive-stage="meaning"]{
          grid-column:1/-1;
        }
        #skySelectedRelationship .sky-mobile-card-composition{
          display:grid!important;
          grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
          grid-template-areas:"sky-a sky-b" "aspect aspect"!important;
          align-items:start!important;
          gap:.75rem!important;
          width:100%!important;
          max-width:100%!important;
          overflow:visible!important;
        }
        #skySelectedRelationship .sky-mobile-card-composition > .sky-selected-card[data-selected-card="A"]{
          grid-area:sky-a!important;
        }
        #skySelectedRelationship .sky-mobile-card-composition > .sky-selected-card[data-selected-card="B"]{
          grid-area:sky-b!important;
        }
        #skySelectedRelationship .sky-mobile-card-composition > .sky-selected-aspect-diagram{
          grid-area:aspect!important;
          width:min(100%,18rem)!important;
          justify-self:center!important;
          margin:.15rem auto .35rem!important;
          padding:.65rem!important;
        }
        #skySelectedRelationship .sky-selected-card{
          width:100%!important;
          padding:.55rem!important;
          border-radius:1rem!important;
        }
        #skySelectedRelationship .sky-selected-card-label{
          margin:.05rem 0 .35rem!important;
          line-height:1.2;
        }
        #skySelectedRelationship .sky-selected-card h4{
          margin:.45rem 0 .25rem!important;
          font-size:1rem!important;
          line-height:1.15!important;
          overflow-wrap:anywhere;
        }
        #skySelectedRelationship .sky-redundancy-card-facts{
          display:grid!important;
          grid-template-columns:repeat(2,minmax(0,1fr));
          align-items:start;
          justify-items:center;
          gap:.3rem .2rem!important;
          margin:.35rem 0 0!important;
        }
        #skySelectedRelationship .sky-redundancy-card-facts .sky-progressive-token{
          width:100%;
          justify-content:center;
          text-align:center;
          font-size:.78rem!important;
          overflow-wrap:anywhere;
        }
        #skySelectedRelationship .sky-redundancy-card-facts .sky-progressive-token[data-progressive-stage="name"],
        #skySelectedRelationship .sky-redundancy-card-facts .sky-progressive-token[data-progressive-stage="meaning"]{
          grid-column:1/-1;
        }
        #skySelectedRelationship .sky-redundancy-card-facts .sky-progressive-level{
          max-width:100%;
          white-space:normal!important;
          text-align:center;
          overflow-wrap:anywhere;
        }
        #skySelectedRelationship .sky-selected-aspect-diagram svg{
          width:min(100%,9rem)!important;
          height:auto!important;
          margin-inline:auto;
        }
        #skySelectedRelationship .sky-selected-aspect-diagram h4,
        #skySelectedRelationship .sky-selected-aspect-angle,
        #skySelectedRelationship .sky-selected-aspect-diagram strong{
          width:100%;
          max-width:100%;
          text-align:center;
        }
        #skySelectedRelationship details,
        #skySelectedRelationship .sky-progressive-reading{
          width:100%;
          max-width:100%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function commonParent(a,b){
    if(!a||!b)return null;
    let node=a.parentElement;
    while(node&&!node.contains(b))node=node.parentElement;
    return node;
  }

  function compose(panel){
    const cardA=panel.querySelector('.sky-selected-card[data-selected-card="A"]');
    const cardB=panel.querySelector('.sky-selected-card[data-selected-card="B"]');
    const diagram=panel.querySelector('.sky-selected-aspect-diagram');
    const parent=commonParent(cardA,cardB);
    if(parent&&diagram&&parent.contains(diagram))parent.classList.add('sky-mobile-card-composition');

    const synthesis=panel.querySelector('details[data-redundancy-role="synthesis"]');
    const reading=panel.querySelector('.sky-progressive-reading');
    if(synthesis&&reading&&synthesis.nextElementSibling!==reading){
      synthesis.insertAdjacentElement('afterend',reading);
    }

    panel.querySelectorAll('*').forEach(node=>{
      if(node.scrollWidth>node.clientWidth+2&&getComputedStyle(node).overflowX==='auto'){
        node.style.overflowX='clip';
      }
    });
    panel.dataset.mobileComposition='two-cards-one-aspect';
  }

  function apply(){
    queued=false;
    const panel=document.getElementById('skySelectedRelationship');
    if(!panel||panel.hidden)return;
    compose(panel);
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(apply))}
  function start(){
    installStyles();
    ['relphi:selected-relationship-rendered','relphi:selected-relationship-redundancy-pass-ready'].forEach(name=>window.addEventListener(name,schedule));
    new MutationObserver(mutations=>{if(mutations.some(m=>m.addedNodes.length))schedule()}).observe(document.body,{childList:true,subtree:true});
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
