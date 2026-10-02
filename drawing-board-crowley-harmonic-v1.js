// Crowley harmonic divination helper for the Drawing Board.
(function(){
  'use strict';
  if(!location.pathname.endsWith('/tarot.html') && location.pathname !== 'tarot.html') return;
  if(window.__relphiCrowleyHarmonicV1) return;
  window.__relphiCrowleyHarmonicV1=true;

  const TEMPLATE_ID='crowley-harmonic-divination-12';
  const SIGNIFICATOR_KEY='relphiOpeningKeySignificatorV1';
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
  const DOMAINS=[
    {id:'Yod',letter:'Yod',element:'Fire',suit:'Wands',core:'Work · business · enterprise',explain:'What you are doing, initiating, building, pursuing, or investing energy into.',terms:['work','job','career','business','enterprise','project','goal','action','activity','ambition','initiative','leadership','creative work','creation','build','launch','purpose','vocation','effort','energy','drive','will','competition','performance','profession','employment','coworker','boss','client','company','startup','study project']},
    {id:'Heh',letter:'Heh',element:'Water',suit:'Cups',core:'Love · marriage · pleasure',explain:'What is felt, desired, enjoyed, bonded with, or emotionally related to.',terms:['love','marriage','romance','relationship','partner','dating','friendship','friend','family feeling','affection','emotion','feelings','pleasure','enjoyment','desire','intimacy','connection','bond','reconciliation','heart','social','companionship','attraction','crush','sex','sexuality','celebration','happiness','grief']},
    {id:'Vav',letter:'Vav',element:'Air',suit:'Swords',core:'Trouble · loss · scandal · quarrelling',explain:'What is contested, threatened, disputed, severed, judged, communicated, or mentally fought through.',terms:['trouble','loss','scandal','quarrel','quarrelling','conflict','fight','argument','dispute','legal','lawsuit','court','accusation','gossip','rumor','communication problem','misunderstanding','decision','judgment','strategy','opposition','enemy','breakup','separation','betrayal','crisis','danger','problem','stress','anxiety','competition conflict','complaint','discipline','termination']},
    {id:'Heh-final',letter:'Final Heh',element:'Earth',suit:'Disks',core:'Money · goods · material matters',explain:'What is owned, paid for, embodied, housed, maintained, exchanged, or made materially real.',terms:['money','cash','income','pay','salary','benefits','debt','loan','bill','rent','mortgage','house','home','property','real estate','goods','purchase','shopping','price','cost','budget','savings','bank','finance','financial','material','possession','object','car','vehicle','food','body','health cost','resource','equipment','contract value','asset','inheritance','payment','sale','buy','sell']}
  ];

  let operation=1, anchor=0, countValue=3, pairRadius=1, expectedDomain='', domainLocked=false, revealedDomain='', significatorId='', operationDeck=null;

  function storedSignificator(){
    try{return String(localStorage.getItem(SIGNIFICATOR_KEY)||'');}catch(_){return '';}
  }
  function rememberSignificator(id){
    significatorId=String(id||'');
    try{
      if(significatorId)localStorage.setItem(SIGNIFICATOR_KEY,significatorId);
      else localStorage.removeItem(SIGNIFICATOR_KEY);
    }catch(_){}
    return significatorId;
  }
  function significatorTitle(){
    return window.RelphiTarotLedgerBridge?.titleFor?.(significatorId)||'Selected card';
  }
  function resetAttemptControls(box){
    if(!box)return;
    expectedDomain='';domainLocked=false;revealedDomain='';operationDeck=null;
    const expected=box.querySelector('#crowleyExpectedDomain');if(expected)expected.value='';
    const search=box.querySelector('#crowleyDomainSearch');if(search){search.value='';search.disabled=false;}
    box.querySelectorAll('[data-crowley-domain]').forEach(node=>node.disabled=false);
    const lock=box.querySelector('#crowleyLockDomain');if(lock)lock.disabled=false;
    const reveal=box.querySelector('#crowleyDomainReveal');if(reveal)reveal.hidden=true;
    const invocation=box.querySelector('#crowleyInvocationStep');if(invocation)invocation.hidden=false;
    const invoke=box.querySelector('#crowleyInvoke');if(invoke)invoke.disabled=false;
    const cut=box.querySelector('#crowleyCutStep');if(cut)cut.hidden=true;
    const cutRange=box.querySelector('#crowleyCutRange');if(cutRange)cutRange.value='39';
    const cutNumber=box.querySelector('#crowleyCutNumber');if(cutNumber)cutNumber.value='39';
    const makeCut=box.querySelector('#crowleyMakeCut');if(makeCut)makeCut.disabled=false;
    const actual=box.querySelector('#crowleyActualDomain');if(actual)actual.textContent='Awaiting cuts';
    renderDomainFilter(box);
  }
  function renderSignificatorState(box){
    if(!box)return;
    const has=!!significatorId;
    const choose=box.querySelector('#crowleySignificatorStep');
    const domain=box.querySelector('#crowleyDomainStep');
    const status=box.querySelector('#crowleySignificatorStatus');
    const memory=box.querySelector('#crowleyPersistentSignificator');
    if(choose)choose.hidden=has;
    if(domain)domain.hidden=!has;
    if(status)status.textContent=has?'Significator selected: '+significatorTitle()+' · kept hidden in the deck.':'No Significator selected.';
    if(memory)memory.textContent=has?'Significator: '+significatorTitle():'No Significator selected.';
  }

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
    // Pair Focus is a three-body relationship: both cards are equally distant
    // from the Significator, while their mutual separation is twice that distance.
    const reference=aspectForStep(r);
    const separation=(2*r)%12;
    return {radius:r,reference,separation,between:aspectForStep(separation)};
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
      pair:{...pair,reference:{...pair.reference},between:{...pair.between},referenceInterpretation:interpretiveRelation(pair.reference,'count'),betweenInterpretation:interpretiveRelation(pair.between,'pair'),midpoint:'The Significator is the structural midpoint of this equidistant pair.'}
    };
  }
  function operationFocusMarkup(){
    const op=OPERATIONS[operation-1];
    const pair=pairHarmonic(pairRadius);
    const title={
      1:'Narrative Focus · IHVH',
      2:'Circumstance Focus · House',
      3:'Force Focus · Zodiac',
      4:'Decan Focus · 36-fold field',
      5:'Sephirotic Focus · Tree of Life'
    }[operation]||'Opening Focus';
    const context={
      1:'Read the validated IHVH packet as the beginning of the affair. Story Focus follows each counted card from the Significator; Pair Focus adds the relationship across the Significator.',
      2:'Keep the chosen house visible as the containing area of life while Story and Pair Focus move through its cards.',
      3:'Keep the chosen zodiac sign visible as the containing force while Story and Pair Focus move through its cards.',
      4:'Keep the active decan and its place in the 36-fold zodiacal field visible. The Significator is the central reference for the surrounding ring.',
      5:'Keep the active Sephira and its place on the Tree visible as the containing structure while the final Story and Pair Focus are read.'
    }[operation]||op.note;
    const field={
      1:'IHVH packet',
      2:'House · '+(anchor+1),
      3:'Zodiac position · '+(anchor+1),
      4:'Decan field · 36 positions',
      5:'Tree of Life · Sephira'
    }[operation];
    return '<section class="relphi-focus-surface crowley-crafted-focus crowley-crafted-focus--op'+operation+'" aria-label="'+title+'">'+
      '<header><span class="eyebrow relphi-eyebrow">Operation '+operation+' · '+op.name+'</span><h3 class="relphi-heading">'+title+'</h3><p>'+context+'</p><strong>'+field+'</strong></header>'+
      '<div class="crowley-focus-modes"><article class="relphi-card"><b>Story Focus</b><p>Significator ↔ counted card. Show both card referents and the exact relationship referent.</p></article>'+
      '<article class="relphi-card crowley-pair-focus"><b>Pair Focus · ±'+pair.radius+'</b><div class="crowley-pair-stack"><span>Front card · referent</span><strong>Significator · referent</strong><span>Behind card · referent</span></div><p><b>Front ↔ Significator:</b> '+pair.reference.name+' · <b>Significator ↔ Behind:</b> '+pair.reference.name+' · <b>Front ↔ Behind:</b> '+pair.between.name+'.</p><p><b>Midpoint:</b> the Significator is the structural halfway point of the pair.</p></article></div>'+
      '<details class="crowley-focus-summary"><summary>Operation '+operation+' summary</summary><p>As each Story and Pair step is read, keep its card referents, relationship referents, and notes available here for review.</p></details>'+
      '</section>';
  }
  function renderOperationFocus(){
    const host=document.getElementById('crowleyOperationFocus');
    if(host)host.innerHTML=operationFocusMarkup();
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
    entries.push('<article class="relphi-reference-tile"><div class="relphi-reference-token"><span>Pair ±'+pair.radius+'</span><span>Three-body Pair Focus</span></div><p class="relphi-reference-detail"><b>Each card ↔ Significator:</b> '+pair.reference.name+' '+pair.reference.angle+'° (H'+pair.reference.harmonic+'). '+interpretiveRelation(pair.reference,'count')+'</p><p class="relphi-reference-detail"><b>Paired card ↔ paired card:</b> '+pair.between.name+' '+pair.between.angle+'° (H'+pair.between.harmonic+'). '+interpretiveRelation(pair.between,'pair')+'</p><p class="relphi-reference-detail"><b>Midpoint:</b> the Significator is the structural halfway point between the equidistant cards.</p></article>');
    return '<div class="relphi-reading-reference"><strong>Reading Reference</strong><p class="relphi-reference-detail">Symbols and referents participating in this operation.</p><div class="relphi-reading-reference-grid">'+entries.join('')+'</div></div>';
  }
  function renderReadingReference(){
    const host=document.getElementById('crowleyReadingReference');if(host)host.innerHTML=readingReferenceMarkup();
  }
  function clearMarks(){
    items().forEach(el=>{el.classList.remove('crowley-anchor','crowley-target','crowley-pair');el.removeAttribute('data-crowley-aspect');el.removeAttribute('data-crowley-reference-aspect');el.removeAttribute('data-crowley-between-aspect');});
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
      cards[left]?.classList.add('crowley-pair','crowley-pair-front'); cards[right]?.classList.add('crowley-pair','crowley-pair-behind');
      cards[left]?.setAttribute('data-crowley-reference-aspect',pair.reference.name);
      cards[right]?.setAttribute('data-crowley-reference-aspect',pair.reference.name);
      cards[left]?.setAttribute('data-crowley-between-aspect',pair.between.name);
      cards[right]?.setAttribute('data-crowley-between-aspect',pair.between.name);
      cards[target]?.setAttribute('data-crowley-aspect',count.aspect.name);
    }
    const op=OPERATIONS[operation-1];
    const opStatus=document.getElementById('crowleyOperationStatus');
    if(opStatus) opStatus.innerHTML='<b>Operation '+op.n+' · '+op.name+'</b> — '+op.field+'. '+op.note;
    const status=document.getElementById('crowleyHarmonicStatus');
    if(status) status.innerHTML='<b>Story Focus · Count '+count.value+'</b> · move '+count.movement+' · '+count.aspect.name+' '+count.aspect.angle+'° (H'+count.aspect.harmonic+'). '+interpretiveRelation(count.aspect,'count')+'<br><b>Pair Focus · ±'+pair.radius+'</b> · each card ↔ Significator: '+pair.reference.name+' '+pair.reference.angle+'° (H'+pair.reference.harmonic+'); paired cards ↔ each other: '+pair.between.name+' '+pair.between.angle+'° (H'+pair.between.harmonic+'). <b>Midpoint:</b> Significator.';
    renderReadingReference();
    renderOperationFocus();
  }
  function countOptions(){
    const values=[
      [3,'Elemental trump · count 3'],[4,'Knight / Queen / Prince · count 4'],[7,'Princess · count 7'],
      [9,'Planetary trump · count 9'],[11,'Ace · count 11'],[12,'Zodiacal trump · count 12'],
      [2,'Pip 2'],[3,'Pip 3'],[4,'Pip 4'],[5,'Pip 5'],[6,'Pip 6'],[7,'Pip 7'],[8,'Pip 8'],[9,'Pip 9'],[10,'Pip 10']
    ];
    return values.map(([v,l])=>'<option value="'+v+'">'+l+'</option>').join('');
  }
  function domainMatches(query){
    const tokens=String(query||'').toLowerCase().split(/[,;]+|\s+or\s+/).map(value=>value.trim()).filter(Boolean);
    if(!tokens.length)return DOMAINS;
    return DOMAINS.filter(domain=>{
      const haystack=[domain.id,domain.letter,domain.element,domain.suit,domain.core,domain.explain,...domain.terms].join(' ').toLowerCase();
      return tokens.some(token=>haystack.includes(token));
    });
  }
  function domainCardsMarkup(query){
    const matches=domainMatches(query);
    if(!matches.length)return '<p class="crowley-domain-empty">No direct match. Try a broader word such as work, love, conflict, money, home, career, relationship, or legal.</p>';
    return matches.map(domain=>'<button type="button" class="crowley-domain-card relphi-card" data-crowley-domain="'+domain.id+'" aria-pressed="'+(expectedDomain===domain.id?'true':'false')+'"><span class="crowley-domain-token"><b>'+domain.letter+'</b><small>'+domain.element+' · '+domain.suit+'</small></span><strong>'+domain.core+'</strong><span>'+domain.explain+'</span></button>').join('');
  }
  function renderDomainFilter(box){
    const input=box?.querySelector('#crowleyDomainSearch'),host=box?.querySelector('#crowleyDomainResults'),selected=box?.querySelector('#crowleyDomainSelection');
    if(host)host.innerHTML=domainCardsMarkup(input?.value||'');
    if(selected){
      const domain=DOMAINS.find(item=>item.id===expectedDomain);
      selected.textContent=domain?'Selected: '+domain.letter+' · '+domain.element+' — '+domain.core:'No domain selected yet.';
    }
  }
  function domainGateMarkup(){
    return '<fieldset id="crowleyDomainGate" class="relphi-fieldset"><legend>First Operation · Domain Test</legend><div id="crowleySignificatorStep"><p><b>1. Choose the Significator.</b> Draw one digitally or search for the card you intend to use.</p><div class="crowley-controls relphi-toolbar"><button id="crowleyDrawSignificator" class="relphi-button" type="button">Digital draw</button><label class="relphi-field">Search for a card<input id="crowleySignificatorSearch" class="relphi-input" type="search" autocomplete="off" placeholder="Card name"></label></div><div id="crowleySignificatorResults"></div><p id="crowleySignificatorStatus" aria-live="polite">No Significator selected.</p></div><div id="crowleyDomainStep" hidden><div class="crowley-significator-memory"><strong id="crowleyPersistentSignificator"></strong><button type="button" id="crowleyChangeSignificator" class="relphi-button">Change Significator</button></div><p><b>2. Commit to the expected domain</b> before locating the Significator in the four packets.</p><p class="crowley-domain-explainer">The four packets spell <b>Yod · Heh · Vav · Final Heh</b> from right to left. They are the four elemental gates of the First Operation: <b>Fire/Wands</b> for work and enterprise, <b>Water/Cups</b> for love and pleasure, <b>Air/Swords</b> for trouble and conflict, and <b>Earth/Disks</b> for money, goods, and material matters. Search in ordinary language, then choose the domain that best contains the question.</p><label class="relphi-field crowley-domain-search">Filter by what the question is about<input id="crowleyDomainSearch" class="relphi-input" type="search" autocomplete="off" placeholder="Try: career, romance, conflict, rent, legal, home…"></label><div id="crowleyDomainResults" class="crowley-domain-results">'+domainCardsMarkup('')+'</div><input id="crowleyExpectedDomain" type="hidden" value=""><p id="crowleyDomainSelection" class="crowley-domain-selection">No domain selected yet.</p><div class="crowley-controls relphi-toolbar"><button id="crowleyLockDomain" class="relphi-button relphi-button--primary" type="button">Commit domain</button></div></div><div id="crowleyDomainReveal" hidden><div id="crowleyInvocationStep"><p><b>3. Invocation.</b> Before the deck is shuffled, say the invocation:</p><blockquote class="crowley-invocation relphi-card relphi-card--soft">I invoke thee, I A O, that thou wilt send H R U, the great Angel that is set over the operations of this Secret Wisdom, to lay his hand invisibly upon these consecrated cards of art, that thereby we may obtain true knowledge of hidden things, to the glory of thine ineffable Name. Amen.</blockquote><button type="button" id="crowleyInvoke" class="relphi-button relphi-button--primary">I said the invocation · shuffle once</button></div><div id="crowleyCutStep" hidden><p><b>4. Querent cut.</b> Choose the exact cut position. The shuffled deck order is now locked and will not be shuffled again during this operation.</p><div class="crowley-controls relphi-toolbar"><label class="relphi-field">Cut position<input id="crowleyCutRange" class="relphi-range" type="range" min="1" max="77" value="39"></label><label class="relphi-field">Position<input id="crowleyCutNumber" class="relphi-input" type="number" min="1" max="77" value="39"></label><button type="button" id="crowleyMakeCut" class="relphi-button relphi-button--primary">Make cut</button></div><p><b>Significator packet:</b> <span id="crowleyActualDomain">Awaiting cuts</span></p></div></div><p id="crowleyDomainStatus" aria-live="polite"></p></fieldset>';
  }
  function installStyle(){
    if(document.getElementById('crowleyHarmonicStyle')) return;
    const s=document.createElement('style');s.id='crowleyHarmonicStyle';
    s.textContent=`
      /* Method CSS is geometry/state only. Reusable visual styling lives in relphi-design-system.css. */
      #crowleyHarmonicGuide{margin:.75rem 0}
      #crowleyHarmonicGuide[hidden],#crowleyMechanics[hidden]{display:none!important}
      #crowleyHarmonicGuide .crowley-controls{align-items:end}
      #crowleyHarmonicGuide p{line-height:1.45}
      #crowleyHarmonicStatus,#crowleyDomainStatus{margin:.65rem 0 0}
      #crowleyHarmonicGuide .crowley-invocation{margin:.65rem 0 1rem;border-left:3px solid var(--relphi-board-red)}
      #crowleyDomainGate{margin:0 0 .75rem}
      .crowley-significator-memory{display:flex;align-items:center;justify-content:space-between;gap:.6rem;flex-wrap:wrap;margin:0 0 .7rem;padding:.55rem .65rem;border:1px solid var(--relphi-board-line);border-radius:8px;background:#fbf8f4}
      .crowley-significator-memory>strong{font-size:.78rem}
      .crowley-domain-explainer{max-width:78ch;margin:.4rem 0 .8rem}
      .crowley-domain-search{display:grid;gap:.3rem;max-width:44rem}
      .crowley-domain-results{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem;margin:.6rem 0}
      #crowleyDomainGate .crowley-domain-card{display:grid;gap:.28rem;min-width:0;padding:.65rem .72rem;text-align:left;cursor:pointer}
      #crowleyDomainGate .crowley-domain-card[aria-pressed="true"]{outline:2px solid var(--relphi-board-red);outline-offset:1px}
      #crowleyDomainGate .crowley-domain-card:disabled{cursor:default}
      .crowley-domain-token{display:flex;align-items:baseline;justify-content:space-between;gap:.5rem}
      .crowley-domain-token small{color:#6d645e;font-weight:750}
      .crowley-domain-card>span:last-child{font-size:.78rem;line-height:1.4;color:#554d47}
      .crowley-domain-selection{margin:.35rem 0 .6rem;font-weight:800}
      .crowley-domain-empty{grid-column:1/-1;margin:.2rem 0;color:#655d56}
      #crowleySignificatorResults{display:flex;gap:.35rem;flex-wrap:wrap;margin-top:.4rem}
      #shortListPanel .card-row-item.crowley-anchor .card-row-card-wrap{outline:3px solid var(--relphi-board-red)!important;outline-offset:3px}
      #shortListPanel .card-row-item.crowley-target .card-row-card-wrap{outline:3px dashed #725c16!important;outline-offset:3px}
      #shortListPanel .card-row-item.crowley-pair .card-row-card-wrap{box-shadow:0 0 0 3px rgba(55,83,105,.58)!important}
      #crowleyOperationFocus{margin-top:.75rem}
      .crowley-crafted-focus{display:grid;gap:.75rem}
      .crowley-crafted-focus header h3{margin:.15rem 0 .35rem}.crowley-crafted-focus header p{margin:.25rem 0 .55rem;max-width:72ch}
      .crowley-focus-modes{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);gap:.75rem}
      .crowley-pair-stack{display:grid;grid-template-rows:repeat(3,minmax(44px,auto));gap:.4rem;margin:.65rem 0}
      .crowley-pair-stack>*{display:grid;place-items:center;padding:.5rem;border:1px solid var(--relphi-board-line);border-radius:var(--relphi-radius-md);text-align:center}
      .crowley-pair-stack strong{border-color:var(--relphi-board-red)}
      .crowley-focus-summary summary{cursor:pointer;font-weight:800}
      @media(max-width:720px){.crowley-focus-modes,.crowley-domain-results{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }
  function syncSignificatorFromBoard(box){
    if(!box)return;
    if(!significatorId)significatorId=storedSignificator();
    if(!significatorId){
      const snap=window.RelphiDrawingBoardOptionsBridge?.capture?.()||{};
      const ids=Array.isArray(snap.shortList)?snap.shortList.filter(Boolean):[];
      if(ids.length===1)rememberSignificator(ids[0]);
    }
    renderSignificatorState(box);
  }
  function rehydrateDomainGate(box){
    if(!box)return;
    syncSignificatorFromBoard(box);
    if(!significatorId)return;
    const hidden=box.querySelector('#crowleyExpectedDomain');
    if(hidden)hidden.value=expectedDomain||'';
    renderDomainFilter(box);
    const search=box.querySelector('#crowleyDomainSearch');
    const lock=box.querySelector('#crowleyLockDomain');
    const reveal=box.querySelector('#crowleyDomainReveal');
    const invocation=box.querySelector('#crowleyInvocationStep');
    const invoke=box.querySelector('#crowleyInvoke');
    const cut=box.querySelector('#crowleyCutStep');
    if(domainLocked){
      if(search)search.disabled=true;
      box.querySelectorAll('[data-crowley-domain]').forEach(node=>node.disabled=true);
      if(lock)lock.disabled=true;
      if(reveal)reveal.hidden=false;
      if(operationDeck){
        if(invocation)invocation.hidden=true;
        if(invoke)invoke.disabled=true;
        if(cut)cut.hidden=false;
      }else{
        if(invocation)invocation.hidden=false;
        if(invoke)invoke.disabled=false;
        if(cut)cut.hidden=true;
      }
    }else{
      if(search)search.disabled=false;
      box.querySelectorAll('[data-crowley-domain]').forEach(node=>node.disabled=false);
      if(lock)lock.disabled=false;
      if(reveal)reveal.hidden=true;
      if(invocation)invocation.hidden=false;
      if(invoke)invoke.disabled=false;
      if(cut)cut.hidden=true;
    }
    const actual=box.querySelector('#crowleyActualDomain');
    if(actual)actual.textContent=revealedDomain||'Awaiting cuts';
  }

  function ensureGuide(){
    const r=root(); if(!r) return;
    const nativeDrawer=r.querySelector('.card-row-drawing-board');
    if(!nativeDrawer) return;
    installStyle();
    let box=document.getElementById('crowleyHarmonicGuide');
    if(!box){
      box=document.createElement('section');box.id='crowleyHarmonicGuide';box.className='relphi-panel relphi-stack';box.hidden=true;
      box.innerHTML='<span class="eyebrow relphi-eyebrow">Crowley Divination Method</span><h3 class="relphi-heading">The Opening of the Key</h3><p>Relphi will reveal this divination one step at a time.</p>'+domainGateMarkup()+'<div id="crowleyMechanics" class="relphi-stack" hidden><div class="crowley-controls relphi-toolbar"><label class="relphi-field">Operation<select id="crowleyOperation" class="relphi-select">'+OPERATIONS.map(op=>'<option value="'+op.n+'">'+op.n+' · '+op.name+'</option>').join('')+'</select></label><label class="relphi-field">Harmonic reference<select id="crowleyAnchor" class="relphi-select">'+Array.from({length:12},(_,i)=>'<option value="'+i+'">Position '+(i+1)+'</option>').join('')+'</select></label><label class="relphi-field">Card Counting<select id="crowleyCount" class="relphi-select">'+countOptions()+'</select></label><label class="relphi-field">Card Pairing<select id="crowleyPair" class="relphi-select">'+Array.from({length:6},(_,i)=>'<option value="'+(i+1)+'">±'+(i+1)+'</option>').join('')+'</select></label><button id="crowleyAdvance" class="relphi-button" type="button">Continue Card Counting</button></div><p id="crowleyOperationStatus"></p><div id="crowleyOperationFocus"></div><p id="crowleyHarmonicStatus" aria-live="polite"></p><div id="crowleyReadingReference"></div><fieldset class="relphi-fieldset"><legend>Accuracy Test</legend><p>After Card Counting and Card Pairing, confirm whether the main lines of the reading are correct.</p><button id="crowleyMainLinesCorrect" class="relphi-button relphi-button--primary" type="button">Main lines are correct · continue</button> <button id="crowleyMainLinesWrong" class="relphi-button" type="button">Main lines are not correct · abandon</button><p id="crowleyAccuracyStatus" aria-live="polite"></p></fieldset></div>';
      const workspace=r.querySelector('.card-row-workspace');
      if(workspace) workspace.parentNode.insertBefore(box,workspace); else nativeDrawer.insertAdjacentElement('beforebegin',box);
      const ledger=()=>window.RelphiTarotLedgerBridge;
      const chooseSignificator=card=>{
        if(!card?.card_id||significatorId)return;
        rememberSignificator(card.card_id);
        requestAnimationFrame(()=>{
          const live=document.getElementById('crowleyHarmonicGuide');if(!live)return;
          renderSignificatorState(live);
          live.querySelector('#crowleySignificatorResults').innerHTML='';
          live.querySelector('#crowleyDomainSearch')?.focus();
          live.querySelector('#crowleyDomainStep')?.scrollIntoView({block:'nearest'});
        });
      };
      box.querySelector('#crowleyDrawSignificator').addEventListener('click',()=>{
        if(significatorId)return;
        const button=box.querySelector('#crowleyDrawSignificator');button.disabled=true;
        const card=ledger()?.drawOpeningSignificator?.('full') || ledger()?.drawCardForBoard?.('full');
        if(!card){button.disabled=false;return;}
        chooseSignificator(card);
        // Legacy fallback may have put the card on the board. The dedicated
        // drawOpeningSignificator path never mutates the board.
        if(!ledger()?.drawOpeningSignificator)ledger()?.hideOpeningSignificator?.();
      });
      box.querySelector('#crowleySignificatorSearch').addEventListener('input',e=>{
        const q=String(e.target.value||'').trim();
        const host=box.querySelector('#crowleySignificatorResults');
        if(q.length<2){host.innerHTML='';return;}
        const found=ledger()?.searchCards?.(q,8,'full')||[];
        host.innerHTML=found.map(card=>'<button class="relphi-button" type="button" data-crowley-significator="'+card.card_id+'">'+card.title+'</button>').join('');
      });
      box.querySelector('#crowleySignificatorResults').addEventListener('click',e=>{
        const button=e.target.closest?.('[data-crowley-significator]');if(!button||significatorId)return;
        const card=(ledger()?.searchCards?.(button.textContent,24,'full')||[]).find(item=>item.card_id===button.dataset.crowleySignificator);
        if(!card)return;
        // Record the method state before adding the card: adding it rerenders
        // the board and replaces this guide node.
        rememberSignificator(card.card_id);
        // Selection records identity only. The card stays hidden in the deck.
        ledger()?.hideOpeningSignificator?.();
        requestAnimationFrame(()=>{
          const live=document.getElementById('crowleyHarmonicGuide');if(!live)return;
          renderSignificatorState(live);
          live.querySelector('#crowleySignificatorResults').innerHTML='';
          live.querySelector('#crowleyDomainSearch')?.focus();
        });
      });
      box.querySelector('#crowleyChangeSignificator').addEventListener('click',()=>{
        rememberSignificator('');
        resetAttemptControls(box);
        ledger()?.hideOpeningSignificator?.();
        renderSignificatorState(box);
        box.querySelector('#crowleySignificatorResults').innerHTML='';
        const search=box.querySelector('#crowleySignificatorSearch');if(search){search.value='';search.focus();}
        box.querySelector('#crowleyDomainStatus').textContent='Choose a new Significator. It will remain selected until you change it.';
      });
            box.querySelector('#crowleyDomainSearch').addEventListener('input',()=>renderDomainFilter(box));
      box.querySelector('#crowleyDomainResults').addEventListener('click',event=>{
        const card=event.target.closest?.('[data-crowley-domain]');if(!card||domainLocked)return;
        expectedDomain=card.dataset.crowleyDomain||'';
        const hidden=box.querySelector('#crowleyExpectedDomain');if(hidden)hidden.value=expectedDomain;
        renderDomainFilter(box);
      });
      box.querySelector('#crowleyLockDomain').addEventListener('click',()=>{
        const sel=box.querySelector('#crowleyExpectedDomain'); expectedDomain=expectedDomain||sel?.value||'';
        if(!expectedDomain){box.querySelector('#crowleyDomainStatus').textContent='Choose the question domain before committing.';return;}
        if(!significatorId){box.querySelector('#crowleyDomainStatus').textContent='Choose the Significator first.';return;}
        domainLocked=true;
        const search=box.querySelector('#crowleyDomainSearch');if(search)search.disabled=true;
        box.querySelectorAll('[data-crowley-domain]').forEach(node=>node.disabled=true);
        box.querySelector('#crowleyLockDomain').disabled=true;
        box.querySelector('#crowleyDomainStatus').textContent='Domain committed. Resolve the four packets, then reveal which contains the Significator.';
        box.querySelector('#crowleyDomainReveal').hidden=false;
        box.querySelector('#crowleyActualDomain').textContent='Awaiting cuts';
      });
      box.querySelector('#crowleyInvoke').addEventListener('click',()=>{
        if(!domainLocked||!significatorId||operationDeck)return;
        const prepared=ledger()?.openingKeyDeck?.(significatorId);
        if(!prepared?.deck?.length)return;
        operationDeck=prepared.deck.slice();
        box.querySelector('#crowleyInvoke').disabled=true;
        box.querySelector('#crowleyInvocationStep').hidden=true;
        box.querySelector('#crowleyCutStep').hidden=false;
        box.querySelector('#crowleyDomainStatus').textContent='Deck shuffled once and locked. Make the querent cut; no further shuffle is permitted in Operation I.';
      });
      const cutRange=box.querySelector('#crowleyCutRange'),cutNumber=box.querySelector('#crowleyCutNumber');
      cutRange.addEventListener('input',()=>{cutNumber.value=cutRange.value;});
      cutNumber.addEventListener('input',()=>{const v=Math.max(1,Math.min(77,Number(cutNumber.value)||1));cutRange.value=String(v);});
      box.querySelector('#crowleyMakeCut').addEventListener('click',()=>{
        if(!operationDeck)return;
        const first=Math.max(1,Math.min(77,Number(cutNumber.value)||1));
        const result=ledger()?.openingKeyReaderCuts?.(operationDeck,first,significatorId);
        if(!result?.packet)return;
        box.querySelector('#crowleyMakeCut').disabled=true;
        revealedDomain=result.packet;
        box.querySelector('#crowleyActualDomain').textContent=revealedDomain;
        const agrees=revealedDomain===expectedDomain;
        box.querySelector('#crowleyDomainStatus').textContent=agrees
          ? 'Querent cut at '+first+'. Relphi completed the reader cuts without reshuffling. The Significator is in '+revealedDomain+', matching the committed domain. Continue with Operation I.'
          : 'Querent cut at '+first+'. Relphi completed the reader cuts without reshuffling. The Significator is in '+revealedDomain+', not '+expectedDomain+'. The Opening is abandoned.';
        box.querySelector('#crowleyMechanics').hidden=true;
        if(agrees){
          operation=1;
          // Step 6: immediately spread the actual packet containing the
          // Significator. This is method progression, not another user choice.
          const packet=result.packets?.[result.packetIndex]||[];
          ledger()?.showOpeningPacket?.(packet);
          requestAnimationFrame(()=>{
            const live=document.getElementById('crowleyHarmonicGuide');if(!live)return;
            live.querySelector('#crowleyDomainGate').innerHTML='<legend><b>First Operation · Success</b></legend><p><b>'+ (ledger()?.titleFor?.(significatorId)||'The Significator') +'</b> was found in <b>'+revealedDomain+'</b>, the domain you committed to. The reading continues.</p><p>Relphi has spread that packet face up in its preserved deck order. The Significator remains the reference point inside this packet. Next, the cards are read as a connected story by counting from the Significator; each count is also mapped onto the twelve-fold harmonic reference so the card-to-card movement carries an aspect relationship.</p><button type="button" id="crowleyBeginStory">Begin card counting</button>';
            live.querySelector('#crowleyBeginStory')?.addEventListener('click',()=>{live.querySelector('#crowleyDomainGate').innerHTML='<legend><b>First Operation · Story Focus</b></legend><p><b>'+ (ledger()?.titleFor?.(significatorId)||'The Significator') +'</b> is the reference. Read the prescribed counted sequence once, then Pair Focus adds the relationships across that reference.</p>';live.querySelector('#crowleyMechanics').hidden=false;mark();live.querySelector('#crowleyOperationFocus')?.scrollIntoView({block:'nearest'});});
          });
        } else {
          clearMarks();
          // Failed domain test ends this attempt cleanly. Preserve the chosen
          // Significator in method state, but clear every visible card and
          // return to a fresh Operation I attempt.
          ledger()?.hideOpeningSignificator?.();
          requestAnimationFrame(()=>{
            const live=document.getElementById('crowleyHarmonicGuide');if(!live)return;
            resetAttemptControls(live);
            renderSignificatorState(live);
            live.querySelector('#crowleyDomainStatus').textContent='Opening abandoned. Significator retained. Choose the domain again, then invoke and reshuffle for the fresh Operation I attempt.';
          });
        }
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
    if(!box.hidden){rehydrateDomainGate(box);mark();} else clearMarks();
  }
  function start(){
    operation=1;anchor=0;countValue=3;pairRadius=1;significatorId=storedSignificator();
    ensureGuide();
    const box=document.getElementById('crowleyHarmonicGuide');
    if(!box)return false;
    box.hidden=false;
    box.querySelector('#crowleyMechanics').hidden=true;
    resetAttemptControls(box);
    renderSignificatorState(box);
    box.querySelector('#crowleyDomainStatus').textContent=significatorId
      ? 'Significator retained. Commit to the question domain for this fresh Operation I attempt.'
      : 'Begin with Operation I: choose a Significator, then commit to the question domain.';
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