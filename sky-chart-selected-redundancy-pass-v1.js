// Selected relationship redundancy pass: one canonical home per fact.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkySelectedRedundancyPassV1)return;
  window.__relphiSkySelectedRedundancyPassV1=true;

  let queued=false;

  function text(node){return String(node?.textContent||'').replace(/\s+/g,' ').trim()}
  function token(field){
    const source=document.querySelector(`.sky-progressive-token[data-progressive-field="${field}"]`);
    if(!source)return null;
    const clone=source.cloneNode(true);
    clone.dataset.progressiveStage='glyph';
    clone.dataset.progressiveLevel='0';
    clone.querySelectorAll(':scope > .sky-progressive-level').forEach(button=>{
      const visible=button.dataset.progressiveLevel==='glyph';
      button.hidden=!visible;
      button.setAttribute('aria-hidden',visible?'false':'true');
      button.setAttribute('aria-expanded','false');
    });
    return clone;
  }
  function appendToken(parent,field){const node=token(field);if(node)parent.appendChild(node);return node}

  function installStyles(){
    if(document.getElementById('skySelectedRedundancyPassStyles'))return;
    const style=document.createElement('style');
    style.id='skySelectedRedundancyPassStyles';
    style.textContent=`
      #skySelectedRelationship .sky-selected-facts{display:none!important}
      #skySelectedRelationship .sky-redundancy-title{display:flex;justify-content:center;align-items:flex-start;gap:.65rem;flex-wrap:wrap;margin:.2rem auto 1rem;text-align:center}
      #skySelectedRelationship .sky-redundancy-title .sky-progressive-token{font-size:1.2rem;font-weight:700}
      #skySelectedRelationship .sky-redundancy-card-facts{display:flex;justify-content:center;align-items:center;gap:.36rem;flex-wrap:wrap;margin:.42rem 0 0;text-align:center}
      #skySelectedRelationship .sky-redundancy-card-facts .sky-progressive-token{font-size:.92rem}
      #skySelectedRelationship .sky-selected-card > p:not(.sky-selected-card-label):not(.sky-redundancy-card-facts){display:none!important}
      #skySelectedRelationship .sky-selected-card-label{font-size:.74rem;letter-spacing:.08em;text-transform:uppercase}
      #skySelectedRelationship .sky-selected-aspect-label{display:none!important}
      #skySelectedRelationship .sky-selected-aspect-diagram > h4{margin-bottom:.15rem}
      #skySelectedRelationship .sky-selected-aspect-diagram > strong{display:block;margin-top:.3rem}
      #skySelectedRelationship .sky-progressive-intro,
      #skySelectedRelationship .sky-progressive-sky,
      #skySelectedRelationship .sky-progressive-relation{display:none!important}
      #skySelectedRelationship .sky-progressive-meta > p{display:none!important}
      #skySelectedRelationship .sky-progressive-reading{margin-top:.65rem}
      #skySelectedRelationship .sky-redundancy-synthesis{margin:.55rem 0 0;line-height:1.55}
      #skySelectedRelationship details[data-redundancy-role="derivation"] .sky-redundancy-derivation-row{display:grid;grid-template-columns:auto 1fr;gap:.6rem;padding:.3rem 0}
      #skySelectedRelationship details[data-redundancy-role="derivation"] .sky-redundancy-derivation-slot{font-weight:700}
      #skySelectedRelationship .sky-redundancy-note{font-size:.86rem;opacity:.78;margin:.45rem 0 0}
      @media(max-width:560px){#skySelectedRelationship .sky-redundancy-title{gap:.45rem}#skySelectedRelationship .sky-redundancy-title .sky-progressive-token{font-size:1.05rem}}
    `;
    document.head.appendChild(style);
  }

  function buildTitle(panel){
    let title=panel.querySelector('.sky-redundancy-title');
    if(!title){
      title=document.createElement('div');
      title.className='sky-redundancy-title';
      title.setAttribute('aria-label','Selected relationship symbolic title');
      const graphic=panel.querySelector('.sky-selected-graphic');
      graphic?.insertAdjacentElement('afterend',title);
    }
    title.replaceChildren();
    appendToken(title,'A-placement');
    appendToken(title,'aspect');
    appendToken(title,'B-placement');
  }

  function compactCard(card,slot){
    const label=card.querySelector('.sky-selected-card-label');
    if(label)label.textContent=`Sky ${slot}`;
    let facts=card.querySelector('.sky-redundancy-card-facts');
    if(!facts){facts=document.createElement('p');facts.className='sky-redundancy-card-facts';card.appendChild(facts)}
    facts.replaceChildren();
    [`${slot}-placement`,`${slot}-sign`,`${slot}-degree`,`${slot}-house`].forEach(field=>appendToken(facts,field));
  }

  function compactCenter(panel){
    const diagram=panel.querySelector('.sky-selected-aspect-diagram');
    if(!diagram)return;
    const heading=diagram.querySelector('h4');
    const orb=diagram.querySelector('strong');
    const aspect=token('aspect');
    if(heading&&aspect){heading.replaceChildren(aspect)}
    const orbToken=token('orb');
    if(orb&&orbToken){orb.replaceChildren(orbToken)}
  }

  function findDetails(panel,pattern){return Array.from(panel.querySelectorAll('details')).find(node=>pattern.test(text(node.querySelector('summary'))))}

  function compactDerivation(panel){
    const details=findDetails(panel,/how these cards were identified/i);
    if(!details)return;
    details.dataset.redundancyRole='derivation';
    const summary=details.querySelector('summary');
    Array.from(details.children).filter(node=>node!==summary).forEach(node=>node.remove());
    ['A','B'].forEach(slot=>{
      const card=panel.querySelector(`.sky-selected-card[data-selected-card="${slot}"]`);
      if(!card)return;
      const row=document.createElement('div');row.className='sky-redundancy-derivation-row';
      const key=document.createElement('span');key.className='sky-redundancy-derivation-slot';key.textContent=`Sky ${slot}`;
      const value=document.createElement('span');
      const signToken=token(`${slot}-sign`);
      if(signToken)value.appendChild(signToken);
      value.append(` · decan ${card.dataset.cardDecan||''} → ${card.dataset.cardTitle||''}`);
      row.append(key,value);details.appendChild(row);
    });
    const note=document.createElement('p');note.className='sky-redundancy-note';note.textContent='The cards are degree-based decan correspondences, not random draws.';details.appendChild(note);
  }

  function compactMeaning(panel){
    const details=findDetails(panel,/what this relationship means/i);
    if(!details)return;
    details.dataset.redundancyRole='synthesis';
    const summary=details.querySelector('summary');
    const candidates=Array.from(details.querySelectorAll('p'));
    const synthesis=candidates.find(node=>/notice where the two images|what becomes possible when both/i.test(text(node)))||candidates[candidates.length-1];
    const preserved=text(synthesis);
    Array.from(details.children).filter(node=>node!==summary).forEach(node=>node.remove());
    const paragraph=document.createElement('p');paragraph.className='sky-redundancy-synthesis';
    paragraph.textContent=preserved||'Read the two cards together: notice where their images reinforce one another, where they require translation, and what becomes possible when both are held in view.';
    details.appendChild(paragraph);
  }

  function compactProgressiveRecap(panel){
    const reading=panel.querySelector('.sky-progressive-reading');
    if(!reading)return;
    reading.setAttribute('aria-label','Transit timing');
  }

  function apply(){
    queued=false;
    const panel=document.getElementById('skySelectedRelationship');
    if(!panel||panel.hidden)return;
    if(!document.querySelector('.sky-progressive-token[data-progressive-field="A-placement"]'))return;
    buildTitle(panel);
    compactCard(panel.querySelector('.sky-selected-card[data-selected-card="A"]'),'A');
    compactCard(panel.querySelector('.sky-selected-card[data-selected-card="B"]'),'B');
    compactCenter(panel);
    compactProgressiveRecap(panel);
    compactDerivation(panel);
    compactMeaning(panel);
    panel.dataset.redundancyPass='canonical-homes';
    window.dispatchEvent(new CustomEvent('relphi:selected-relationship-redundancy-pass-ready'));
  }

  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(apply))}
  function start(){
    installStyles();
    ['relphi:selected-relationship-rendered','relphi:sky-foundation-interactions-ready'].forEach(name=>window.addEventListener(name,schedule));
    new MutationObserver(mutations=>{if(mutations.some(m=>m.addedNodes.length))schedule()}).observe(document.body,{childList:true,subtree:true});
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
