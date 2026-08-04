// Move all selected-relationship text into one shared progressive context row.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkySelectedSharedContextRowV1)return;
  window.__relphiSkySelectedSharedContextRowV1=true;

  let queued=false;

  function installStyles(){
    if(document.getElementById('skySelectedSharedContextRowStyles'))return;
    const style=document.createElement('style');
    style.id='skySelectedSharedContextRowStyles';
    style.textContent=`
      #skySelectedRelationship .sky-selected-shared-context{
        grid-area:context;
        display:grid;
        grid-template-columns:minmax(0,1fr) minmax(0,.9fr) minmax(0,1fr);
        gap:.65rem;
        width:100%;
        min-width:0;
        margin:.2rem 0 .45rem;
        padding:.75rem;
        border:1px solid rgba(31,27,24,.16);
        border-radius:1rem;
        background:#fffdfa;
        box-sizing:border-box;
      }
      #skySelectedRelationship .sky-selected-context-group{
        display:grid;
        align-content:start;
        justify-items:center;
        gap:.45rem;
        min-width:0;
        padding:.35rem;
        text-align:center;
      }
      #skySelectedRelationship .sky-selected-context-group[data-context-slot="A"]{
        border-top:4px solid #c9211e;
      }
      #skySelectedRelationship .sky-selected-context-group[data-context-slot="B"]{
        border-top:4px solid #2462d0;
      }
      #skySelectedRelationship .sky-selected-context-group[data-context-slot="relationship"]{
        border-top:4px solid rgba(31,27,24,.45);
      }
      #skySelectedRelationship .sky-selected-context-card-title{
        margin:0;
        font:850 1rem/1.15 system-ui,sans-serif;
        overflow-wrap:anywhere;
      }
      #skySelectedRelationship .sky-selected-context-group .sky-redundancy-card-facts{
        display:flex!important;
        justify-content:center!important;
        align-items:flex-start!important;
        flex-wrap:wrap!important;
        gap:.35rem!important;
        width:100%;
        margin:0!important;
      }
      #skySelectedRelationship .sky-selected-context-group .sky-progressive-token{
        max-width:100%;
        min-width:0;
        justify-content:center;
        text-align:center;
      }
      #skySelectedRelationship .sky-selected-context-group .sky-progressive-level{
        max-width:100%;
        white-space:normal!important;
        overflow-wrap:anywhere;
      }
      #skySelectedRelationship .sky-selected-context-aspect-heading,
      #skySelectedRelationship .sky-selected-context-orb{
        margin:0;
        width:100%;
        text-align:center;
      }
      #skySelectedRelationship .sky-selected-card > h4,
      #skySelectedRelationship .sky-selected-card > .sky-redundancy-card-facts,
      #skySelectedRelationship .sky-selected-aspect-diagram > h4,
      #skySelectedRelationship .sky-selected-aspect-diagram > strong,
      #skySelectedRelationship .sky-selected-aspect-angle{
        display:none!important;
      }
      #skySelectedRelationship .sky-selected-card{
        align-self:start;
      }
      #skySelectedRelationship .sky-selected-card img{
        margin-bottom:0!important;
      }
      #skySelectedRelationship .sky-mobile-card-composition{
        display:grid!important;
        grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
        grid-template-areas:"sky-a sky-b" "context context" "aspect aspect"!important;
        align-items:start!important;
      }
      @media(max-width:560px){
        #skySelectedRelationship .sky-selected-shared-context{
          grid-template-columns:1fr;
          gap:.55rem;
          padding:.65rem;
        }
        #skySelectedRelationship .sky-selected-context-group{
          grid-template-columns:1fr;
          padding:.45rem .25rem;
        }
        #skySelectedRelationship .sky-selected-context-card-title{
          font-size:.95rem;
        }
        #skySelectedRelationship .sky-selected-context-group .sky-progressive-token{
          font-size:.86rem!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureRow(parent,diagram){
    let row=parent.querySelector(':scope > .sky-selected-shared-context');
    if(!row){
      row=document.createElement('section');
      row.className='sky-selected-shared-context';
      row.setAttribute('aria-label','Selected relationship context');
      ['A','relationship','B'].forEach(slot=>{
        const group=document.createElement('div');
        group.className='sky-selected-context-group';
        group.dataset.contextSlot=slot;
        row.appendChild(group);
      });
      parent.insertBefore(row,diagram||null);
    }
    return row;
  }

  function moveCardContext(card,group){
    if(!card||!group)return;
    group.replaceChildren();
    const title=card.querySelector(':scope > h4');
    if(title){
      title.classList.add('sky-selected-context-card-title');
      group.appendChild(title);
    }
    const facts=card.querySelector(':scope > .sky-redundancy-card-facts');
    if(facts)group.appendChild(facts);
  }

  function moveRelationshipContext(diagram,group){
    if(!diagram||!group)return;
    group.replaceChildren();
    const heading=diagram.querySelector(':scope > h4');
    if(heading){
      heading.classList.add('sky-selected-context-aspect-heading');
      group.appendChild(heading);
    }
    const orb=diagram.querySelector(':scope > strong');
    if(orb){
      orb.classList.add('sky-selected-context-orb');
      group.appendChild(orb);
    }
  }

  function apply(){
    queued=false;
    const panel=document.getElementById('skySelectedRelationship');
    if(!panel||panel.hidden)return;
    const cardA=panel.querySelector('.sky-selected-card[data-selected-card="A"]');
    const cardB=panel.querySelector('.sky-selected-card[data-selected-card="B"]');
    const diagram=panel.querySelector('.sky-selected-aspect-diagram');
    const parent=cardA?.parentElement;
    if(!cardA||!cardB||!diagram||!parent||cardB.parentElement!==parent)return;

    parent.classList.add('sky-mobile-card-composition');
    const row=ensureRow(parent,diagram);
    moveCardContext(cardA,row.querySelector('[data-context-slot="A"]'));
    moveRelationshipContext(diagram,row.querySelector('[data-context-slot="relationship"]'));
    moveCardContext(cardB,row.querySelector('[data-context-slot="B"]'));
    panel.dataset.selectedContextPresentation='shared-progressive-row';
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>requestAnimationFrame(apply));
  }

  function start(){
    installStyles();
    ['relphi:selected-relationship-rendered','relphi:selected-relationship-redundancy-pass-ready'].forEach(name=>window.addEventListener(name,schedule));
    new MutationObserver(mutations=>{
      if(mutations.some(m=>m.addedNodes.length||m.removedNodes.length))schedule();
    }).observe(document.body,{childList:true,subtree:true});
    schedule();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
