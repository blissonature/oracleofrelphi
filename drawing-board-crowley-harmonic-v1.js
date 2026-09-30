// Crowley harmonic divination helper for the Drawing Board.
(function(){
  'use strict';
  if(!location.pathname.endsWith('/tarot.html') && location.pathname !== 'tarot.html') return;
  if(window.__relphiCrowleyHarmonicV1) return;
  window.__relphiCrowleyHarmonicV1=true;

  const TEMPLATE_ID='crowley-harmonic-divination-12';
  const ASPECTS={
    0:{name:'Conjunction',angle:0,harmonic:1},
    1:{name:'Adjacent / semisextile',angle:30,harmonic:12},
    2:{name:'Sextile',angle:60,harmonic:6},
    3:{name:'Square',angle:90,harmonic:4},
    4:{name:'Trine',angle:120,harmonic:3},
    5:{name:'Quincunx',angle:150,harmonic:12},
    6:{name:'Opposition',angle:180,harmonic:2}
  };
  const OPERATIONS=[
    {n:1,name:'The Situation',field:'IHVH · four piles',note:'Nested cuts form Yod · Heh · Vav · Final Heh from right to left. The Significator pile tests the question domain.'},
    {n:2,name:'Development',field:'12 astrological houses',note:'Deal cyclically into twelve houses. Commit to the expected house before locating the Significator; a cognate house gets one second test.'},
    {n:3,name:'Further Development',field:'12 zodiac signs',note:'Deal cyclically into twelve signs. Commit to the expected sign before locating the Significator; a cognate sign gets one second test.'},
    {n:4,name:'Penultimate Aspects',field:'Significator + 36-card ring',note:'Place the Significator centrally and arrange the following 36 cards around it. Decan correspondences remain attached to the small cards.'},
    {n:5,name:'Final Result',field:'10 Tree of Life piles',note:'Deal cyclically into ten Sephiroth. Commit to the expected Sephira before locating the Significator; an adjacent Sephira gets one second test.'}
  ];
  let operation=1, anchor=0, countValue=3, pairRadius=1, expectedDomain='', domainLocked=false, revealedDomain='', significatorId='';

  function root(){return document.getElementById('shortListPanel');}
  function active(){
    const select=root()?.querySelector('#relphiSpreadTemplateSelect');
    if(select?.value===TEMPLATE_ID) return true;
    const state=window.RelphiDrawingBoardPrefabsBridge?.getState?.();
    return state?.activeLayout?.id===TEMPLATE_ID || state?.currentLayout?.id===TEMPLATE_ID;
  }
  function items(){return Array.from(root()?.querySelectorAll('.card-row-board .card-row-item')||[]).slice(0,12);}
  function circularDistance(a,b){const d=Math.abs(a-b)%12;return Math.min(d,12-d);}
  function aspectForStep(step){
    const normalized=((Number(step)||0)%12+12)%12;
    return ASPECTS[Math.min(normalized,12-normalized)]||ASPECTS[0];
  }
  function countHarmonic(count){
    // The landing algorithm and the harmonic discovery are deliberately separate:
    // inclusive counting moves count-1 cards, while the count VALUE occupies that
    // many 30° units on the twelve-fold harmonic reference.
    const value=Math.max(1,Number(count)||1);
    const step=value%12;
    return {value,movement:value-1,step,aspect:aspectForStep(step)};
  }
  function pairHarmonic(radius){
    const r=Math.max(1,Number(radius)||1);
    const separation=(2*r)%12;
    return {radius:r,separation,aspect:aspectForStep(separation)};
  }
  function interpretiveRelation(aspect,kind){
    const relation={
      0:'acts as one field: meanings fuse, intensify, or become difficult to separate',
      30:'sits beside the other with little shared structure: read the adjustment, translation, or blind spot between them',
      60:'opens a usable channel: the cards can cooperate when the opportunity is taken up',
      90:'creates active friction: each card presses the other into action, conflict, correction, or decision',
      120:'moves through an easy common pattern: the cards reinforce and carry one another with relatively little resistance',
      150:'requires continual recalibration: the cards are connected but do not naturally share a common frame',
      180:'forms a polarity: read the cards as opposing, mirroring, or completing ends of one axis'
    }[aspect.angle] || 'forms a harmonic relationship that modifies how the two meanings combine';
    return (kind==='pair'?'Paired cards':'Counted relationship')+' · '+aspect.name+' ('+aspect.angle+'°, H'+aspect.harmonic+'): '+relation+'.';
  }
  function interpretationContext(){
    const count=countHarmonic(countValue), pair=pairHarmonic(pairRadius), op=OPERATIONS[operation-1];
    return {
      operation:{...op},
      count:{...count,aspect:{...count.aspect},interpretation:interpretiveRelation(count.aspect,'count')},
      pair:{...pair,aspect:{...pair.aspect},interpretation:interpretiveRelation(pair.aspect,'pair')}
    };
  }
  function readingReferenceMarkup(){
    const entries=[];
    const sky=window.RelphiSkyConnector;
    if(operation===2&&sky){
      const h=sky.houseReference(anchor+1);
      entries.push('<article class="relphi-reference-tile"><div class="relphi-reference-token"><span class="house-medallion">'+h.houseNumber+'</span><span>'+h.glyph+' '+h.sign+'</span></div><p class="relphi-reference-detail"><b>'+h.houseName+'</b> · '+h.referent+'</p><p class="relphi-reference-detail">'+h.signReferent+'</p><p class="relphi-reference-detail">'+h.fullReferent+'</p></article>');
    }
    const count=countHarmonic(countValue),pair=pairHarmonic(pairRadius);
    entries.push('<article class="relphi-reference-tile"><div class="relphi-reference-token"><span>'+count.aspect.angle+'°</span><span>'+count.aspect.name+' · H'+count.aspect.harmonic+'</span></div><p class="relphi-reference-detail">'+interpretiveRelation(count.aspect,'count')+'</p></article>');
    entries.push('<article class="relphi-reference-tile"><div class="relphi-reference-token"><span>'+pair.aspect.angle+'°</span><span>'+pair.aspect.name+' · H'+pair.aspect.harmonic+'</span></div><p class="relphi-reference-detail">'+interpretiveRelation(pair.aspect,'pair')+'</p></article>');
    return '<div class="relphi-reading-reference"><strong>Reading Reference</strong><p class="relphi-reference-detail">Symbols and referents participating in this operation.</p><div class="relphi-reading-reference-grid">'+entries.join('')+'</div></div>';
  }
  function renderReadingReference(){
    const host=document.getElementById('crowleyReadingReference');if(host)host.innerHTML=readingReferenceMarkup();
  }
  function clearMarks(){
    items().forEach(el=>{el.classList.remove('crowley-anchor','crowley-target','crowley-pair');el.removeAttribute('data-crowley-aspect');});
  }
  function mark(){
    clearMarks();
    const cards=items();
    const count=countHarmonic(countValue), pair=pairHarmonic(pairRadius);
    // The twelve visible helper positions are a harmonic reference, not a claim
    // that every Opening operation physically contains twelve cards.
    if(cards.length>=12){
      const target=(anchor+count.movement)%12;
      cards[anchor]?.classList.add('crowley-anchor');
      cards[target]?.classList.add('crowley-target');
      const left=(anchor-pairRadius+12)%12, right=(anchor+pairRadius)%12;
      cards[left]?.classList.add('crowley-pair'); cards[right]?.classList.add('crowley-pair');
      cards[target]?.setAttribute('data-crowley-aspect',count.aspect.name);
    }
    const op=OPERATIONS[operation-1];
    const opStatus=document.getElementById('crowleyOperationStatus');
    if(opStatus) opStatus.innerHTML='<b>Operation '+op.n+' · '+op.name+'</b> — '+op.field+'. '+op.note;
    const status=document.getElementById('crowleyHarmonicStatus');
    if(status) status.innerHTML='<b>Count '+count.value+'</b> · move '+count.movement+' · '+count.aspect.name+' '+count.aspect.angle+'° (H'+count.aspect.harmonic+'). '+interpretiveRelation(count.aspect,'count')+'<br><b>Pair ±'+pair.radius+'</b> · separation '+(pair.separation||12)+'/12 · '+pair.aspect.name+' '+pair.aspect.angle+'° (H'+pair.aspect.harmonic+'). '+interpretiveRelation(pair.aspect,'pair');
    renderReadingReference();
  }
  function countOptions(){
    const values=[
      [3,'Elemental trump · count 3'],[4,'Knight / Queen / Prince · count 4'],[7,'Princess · count 7'],
      [9,'Planetary trump · count 9'],[11,'Ace · count 11'],[12,'Zodiacal trump · count 12'],
      [2,'Pip 2'],[3,'Pip 3'],[4,'Pip 4'],[5,'Pip 5'],[6,'Pip 6'],[7,'Pip 7'],[8,'Pip 8'],[9,'Pip 9'],[10,'Pip 10']
    ];
    return values.map(([v,l])=>'<option value="'+v+'">'+l+'</option>').join('');
  }
  function domainGateMarkup(){
    return '<fieldset id="crowleyDomainGate"><legend><b>First Operation · Domain Test</b></legend><div id="crowleySignificatorStep"><p><b>1. Choose the Significator.</b> Draw one digitally or search for the card you intend to use.</p><div class="crowley-controls"><button id="crowleyDrawSignificator" type="button">Digital draw</button><label>Search for a card<input id="crowleySignificatorSearch" type="search" autocomplete="off" placeholder="Card name"></label></div><div id="crowleySignificatorResults"></div><p id="crowleySignificatorStatus" aria-live="polite">No Significator selected.</p></div><div id="crowleyDomainStep" hidden><p><b>2. Commit to the expected domain</b> before locating the Significator in the four packets.</p><div class="crowley-controls"><label>Expected domain<select id="crowleyExpectedDomain"><option value="">Choose before revealing…</option><option value="Yod">Yod</option><option value="Heh">Heh</option><option value="Vav">Vav</option><option value="Heh-final">Final Heh</option></select></label><button id="crowleyLockDomain" type="button">Commit domain</button></div></div><div id="crowleyDomainReveal" hidden><p><b>Next:</b> form the four IHVH packets with the full deck, then locate the selected Significator.</p><p><b>Significator packet:</b> <span id="crowleyActualDomain">Awaiting packet resolution</span></p></div><p id="crowleyDomainStatus" aria-live="polite"></p></fieldset>';
  }
  function installStyle(){
    if(document.getElementById('crowleyHarmonicStyle')) return;
    const s=document.createElement('style');s.id='crowleyHarmonicStyle';
    s.textContent=`
      #crowleyHarmonicGuide{margin:12px 0;padding:12px;border:1px solid rgba(80,65,50,.22);border-radius:12px;background:rgba(255,253,248,.92)}
      #crowleyHarmonicGuide[hidden]{display:none!important}
      #crowleyHarmonicGuide .crowley-controls{display:flex;gap:10px;flex-wrap:wrap;align-items:end}
      #crowleyHarmonicGuide label{display:grid;gap:4px;font-size:.84rem}
      #crowleyHarmonicGuide select,#crowleyHarmonicGuide button{min-height:40px}
      #crowleyHarmonicStatus,#crowleyDomainStatus{margin:.65rem 0 0;font-size:.9rem}\n      #crowleyDomainGate{margin:0 0 12px;padding:10px;border:1px solid rgba(80,65,50,.18);border-radius:10px}\n      #crowleyMechanics[hidden]{display:none!important}
      #shortListPanel .card-row-item.crowley-anchor .card-row-card-wrap{outline:3px solid var(--relphi-red,#8b1e2d)!important;outline-offset:3px}
      #shortListPanel .card-row-item.crowley-target .card-row-card-wrap{outline:3px dashed #725c16!important;outline-offset:3px}
      #shortListPanel .card-row-item.crowley-pair .card-row-card-wrap{box-shadow:0 0 0 3px rgba(55,83,105,.58)!important}
    `;
    document.head.appendChild(s);
  }
  function syncSignificatorFromBoard(box){
    if(significatorId||!box)return;
    const entries=window.RelphiTarotLedgerBridge?.drawingBoardReadingEntries?.()||[];
    if(entries.length!==1)return;
    const card=entries[0];
    const id=card?.cardId||card?.card_id;
    if(!id)return;
    significatorId=id;
    box.querySelector('#crowleySignificatorStatus').textContent='Significator: '+(card.title||window.RelphiTarotLedgerBridge?.titleFor?.(id)||'Selected card');
    box.querySelector('#crowleySignificatorStep').hidden=true;
    box.querySelector('#crowleyDomainStep').hidden=false;
  }
  function ensureGuide(){
    const r=root(); if(!r) return;
    const nativeDrawer=r.querySelector('.card-row-drawing-board');
    if(!nativeDrawer) return;
    installStyle();
    let box=document.getElementById('crowleyHarmonicGuide');
    if(!box){
      box=document.createElement('section');box.id='crowleyHarmonicGuide';box.hidden=true;
      box.innerHTML='<strong>Opening of the Key · Full Divination</strong><p style="margin:.35rem 0 .7rem">Five operations: <b>I · Opening of the Question</b> — IHVH four-pile test; <b>II · Development</b> — twelve astrological houses; <b>III · Further Development</b> — twelve zodiac signs; <b>IV · Penultimate Aspects</b> — Significator with the following 36 cards in a ring; <b>V · Final Result</b> — ten Tree of Life piles. Each operation reshuffles and uses counting and pairing.</p><p style="margin:.35rem 0 .7rem"><b>Operation I.</b> Use the nested cuts to form IHVH from right to left; the Significator pile must agree with the question domain before continuing.</p>'+domainGateMarkup()+'<div id="crowleyMechanics" hidden><div class="crowley-controls"><label>Operation<select id="crowleyOperation">'+OPERATIONS.map(op=>'<option value="'+op.n+'">'+op.n+' · '+op.name+'</option>').join('')+'</select></label><label>Harmonic reference<select id="crowleyAnchor">'+Array.from({length:12},(_,i)=>'<option value="'+i+'">Position '+(i+1)+'</option>').join('')+'</select></label><label>Card Counting<select id="crowleyCount">'+countOptions()+'</select></label><label>Card Pairing<select id="crowleyPair">'+Array.from({length:6},(_,i)=>'<option value="'+(i+1)+'">±'+(i+1)+'</option>').join('')+'</select></label><button id="crowleyAdvance" type="button">Continue Card Counting</button></div><p id="crowleyOperationStatus"></p><p id="crowleyHarmonicStatus" aria-live="polite"></p><div id="crowleyReadingReference"></div><fieldset><legend><b>Accuracy Test</b></legend><p>After Card Counting and Card Pairing, confirm whether the main lines of the reading are correct.</p><button id="crowleyMainLinesCorrect" type="button">Main lines are correct · continue</button> <button id="crowleyMainLinesWrong" type="button">Main lines are not correct · abandon</button><p id="crowleyAccuracyStatus" aria-live="polite"></p></fieldset></div>';
      const workspace=r.querySelector('.card-row-workspace');
      if(workspace) workspace.parentNode.insertBefore(box,workspace); else nativeDrawer.insertAdjacentElement('beforebegin',box);
      const ledger=()=>window.RelphiTarotLedgerBridge;
      const chooseSignificator=card=>{
        if(!card?.card_id)return;
        significatorId=card.card_id;
        box.querySelector('#crowleySignificatorStatus').textContent='Significator: '+card.title;
        box.querySelector('#crowleySignificatorStep').hidden=true;
        box.querySelector('#crowleyDomainStep').hidden=false;
        box.querySelector('#crowleySignificatorResults').innerHTML='';
        const domain=box.querySelector('#crowleyExpectedDomain');
        domain?.focus();
        box.querySelector('#crowleyDomainStep')?.scrollIntoView({block:'nearest'});
      };
      box.querySelector('#crowleyDrawSignificator').addEventListener('click',()=>{
        const card=ledger()?.drawCardForBoard?.('full');
        if(!card)return;
        // Drawing the card rerenders the board and can replace this guide node.
        // Resolve the live guide after the draw, then advance its Significator step.
        requestAnimationFrame(()=>{
          const live=document.getElementById('crowleyHarmonicGuide');
          if(!live)return;
          significatorId=card.card_id;
          live.querySelector('#crowleySignificatorStatus').textContent='Significator: '+card.title;
          live.querySelector('#crowleySignificatorStep').hidden=true;
          live.querySelector('#crowleyDomainStep').hidden=false;
          live.querySelector('#crowleySignificatorResults').innerHTML='';
          live.querySelector('#crowleyExpectedDomain')?.focus();
          live.querySelector('#crowleyDomainStep')?.scrollIntoView({block:'nearest'});
        });
      });
      box.querySelector('#crowleySignificatorSearch').addEventListener('input',e=>{
        const q=String(e.target.value||'').trim();
        const host=box.querySelector('#crowleySignificatorResults');
        if(q.length<2){host.innerHTML='';return;}
        const found=ledger()?.searchCards?.(q,8,'full')||[];
        host.innerHTML=found.map(card=>'<button type="button" data-crowley-significator="'+card.card_id+'">'+card.title+'</button>').join('');
      });
      box.querySelector('#crowleySignificatorResults').addEventListener('click',e=>{
        const button=e.target.closest?.('[data-crowley-significator]');if(!button)return;
        const card=(ledger()?.searchCards?.(button.textContent,24,'full')||[]).find(item=>item.card_id===button.dataset.crowleySignificator);
        if(!card)return;
        if(ledger()?.addCardToBoard?.(card.card_id,'full'))chooseSignificator(card);
      });
      box.querySelector('#crowleyLockDomain').addEventListener('click',()=>{
        const sel=box.querySelector('#crowleyExpectedDomain'); expectedDomain=sel.value;
        if(!expectedDomain){box.querySelector('#crowleyDomainStatus').textContent='Choose the question domain before committing.';return;}
        if(!significatorId){box.querySelector('#crowleyDomainStatus').textContent='Choose the Significator first.';return;}
        domainLocked=true; sel.disabled=true; box.querySelector('#crowleyLockDomain').disabled=true;
        box.querySelector('#crowleyDomainStatus').textContent='Domain committed. Resolve the four packets, then reveal which contains the Significator.';
        box.querySelector('#crowleyDomainReveal').hidden=false;
        box.querySelector('#crowleyActualDomain').textContent='Awaiting packet resolution';
      });
      box.querySelector('#crowleyMainLinesCorrect').addEventListener('click',()=>{box.querySelector('#crowleyAccuracyStatus').textContent='Accuracy gate passed.';});
      box.querySelector('#crowleyMainLinesWrong').addEventListener('click',()=>{box.querySelector('#crowleyMechanics').hidden=true;box.querySelector('#crowleyAccuracyStatus').textContent='The divination is abandoned because its main lines do not correspond.';clearMarks();});
      box.querySelector('#crowleyOperation').addEventListener('change',e=>{operation=Math.max(1,Math.min(5,Number(e.target.value)||1));mark();});
      box.querySelector('#crowleyAnchor').addEventListener('change',e=>{anchor=Number(e.target.value)||0;mark();});
      box.querySelector('#crowleyCount').addEventListener('change',e=>{countValue=Number(e.target.value)||3;mark();});
      box.querySelector('#crowleyPair').addEventListener('change',e=>{pairRadius=Number(e.target.value)||1;mark();});
      box.querySelector('#crowleyAdvance').addEventListener('click',()=>{anchor=(anchor+countHarmonic(countValue).movement)%12;box.querySelector('#crowleyAnchor').value=String(anchor);mark();});
      box.querySelector('#crowleyCount').value='3';
    }
    box.hidden=!active();
    if(!box.hidden){syncSignificatorFromBoard(box);mark();} else clearMarks();
  }
  function start(){
    operation=1;anchor=0;countValue=3;pairRadius=1;expectedDomain='';domainLocked=false;revealedDomain='';significatorId='';
    ensureGuide();
    const box=document.getElementById('crowleyHarmonicGuide');
    if(!box)return false;
    box.hidden=false;
    box.querySelector('#crowleyMechanics').hidden=true;
    const expected=box.querySelector('#crowleyExpectedDomain');
    if(expected){expected.value='';expected.disabled=false;}
    const lock=box.querySelector('#crowleyLockDomain');if(lock)lock.disabled=false;
    box.querySelector('#crowleyDomainReveal').hidden=true;
    box.querySelector('#crowleySignificatorStep').hidden=false;
    box.querySelector('#crowleyDomainStep').hidden=true;
    box.querySelector('#crowleySignificatorStatus').textContent='No Significator selected.';
    box.querySelector('#crowleyDomainStatus').textContent='Begin with Operation I: commit to the question domain before locating the Significator.';
    box.scrollIntoView({block:'nearest'});
    return true;
  }
  window.RelphiCrowleyHarmonicBridge=Object.freeze({start,getInterpretationContext:()=>interpretationContext(),getReadingReference:()=>({html:readingReferenceMarkup(),sky:window.RelphiSkyConnector?.context?.()||null})});
  window.addEventListener('relphi:sky-context-change',()=>{if(active())mark();});
  document.addEventListener('change',e=>{if(e.target?.id==='relphiSpreadTemplateSelect') setTimeout(ensureGuide,0);});
  document.addEventListener('relphi:drawing-board-rendered',()=>setTimeout(ensureGuide,0));
  let guideQueued=false;
  const queueGuide=()=>{
    if(guideQueued)return;
    guideQueued=true;
    requestAnimationFrame(()=>{guideQueued=false;ensureGuide();});
  };
  new MutationObserver(records=>{
    // Ignore mutations inside the guide itself. ensureGuide()/mark() writes its
    // status/reference DOM, which otherwise retriggers this observer forever as
    // soon as Opening of the Key becomes active.
    if(records.every(record=>document.getElementById('crowleyHarmonicGuide')?.contains(record.target)))return;
    queueGuide();
  }).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ensureGuide,{once:true}); else ensureGuide();
})();