// Phase one: bridge Sky Chart to Tarot Ledger through auditable Chart Hits and progressive reveal.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyLedgerBridgeV1)return;
  window.__relphiSkyLedgerBridgeV1=true;

  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const COLORS={A:'#c9211e',B:'#2462d0'};
  const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const SIGN_RULERS=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
  const EXALTATIONS=['Sun','Moon',null,'Jupiter',null,'Mercury','Saturn',null,null,'Mars',null,'Venus'];
  const DECAN_RULERS=[
    ['Mars','Sun','Venus'],['Mercury','Moon','Saturn'],['Jupiter','Mars','Sun'],['Venus','Mercury','Moon'],
    ['Saturn','Jupiter','Mars'],['Sun','Venus','Mercury'],['Moon','Saturn','Jupiter'],['Mars','Sun','Venus'],
    ['Mercury','Moon','Saturn'],['Jupiter','Mars','Sun'],['Venus','Mercury','Moon'],['Saturn','Jupiter','Mars']
  ];
  const PLANET_ALIASES={asc:'Ascendant',dsc:'Descendant',mc:'Midheaven',ic:'Imum Coeli'};
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let dialog=null;
  let queued=false;

  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
  function source(payload){
    const known=[payload?.placements,payload?.positions,payload?.points,payload?.bodies].find(value=>value&&typeof value==='object');
    const raw=known||payload||{};
    return Array.isArray(raw)?raw.map((item,index)=>[String(item?.name||item?.id||index),item]):Object.entries(raw);
  }
  function longitude(item){
    if(Number.isFinite(Number(item?.longitude)))return ((Number(item.longitude)%360)+360)%360;
    const sign=SIGNS.findIndex(name=>name.toLowerCase()===String(item?.sign||item?.zodiac||'').toLowerCase());
    if(sign<0)return NaN;
    return sign*30+Number(item.degree||item.degrees||0)+Number(item.minute||item.minutes||0)/60;
  }
  function nameFor(key,item){
    const raw=String(item?.name||item?.label||item?.body||item?.planet||item?.point||key||'').trim();
    return PLANET_ALIASES[raw.toLowerCase()]||raw.replace(/(^|-)([a-z])/g,(_,dash,char)=>(dash?' ':'')+char.toUpperCase());
  }
  function cardIndex(){
    const cards=Array.isArray(window.RELPHI_TAROT_CARDS)?window.RELPHI_TAROT_CARDS:[];
    const byId=new Map(cards.map(card=>[card.card_id,card]));
    const byPlanet=new Map();
    cards.forEach(card=>{
      const planet=String(card?.astrology?.planet||'').trim().toLowerCase();
      if(planet&&!byPlanet.has(planet))byPlanet.set(planet,card);
    });
    return{cards,byId,byPlanet};
  }
  function decanCard(sign,degree,index){
    const rank=Math.max(0,Math.min(2,Math.floor(degree/10)));
    return index.cards.find(card=>{
      const signName=String(card?.astrology?.sign||'').toLowerCase();
      const span=String(card?.astrology?.degree_span||card?.astrology?.zodiac_range||'');
      if(signName!==SIGNS[sign].toLowerCase())return false;
      const first=Number((span.match(/(\d+)/)||[])[1]);
      return Number.isFinite(first)?Math.floor(first/10)===rank:false;
    })||null;
  }
  function add(ledger,card,reason,tokens){
    if(!card)return;
    const id=card.card_id;
    if(!ledger.has(id))ledger.set(id,{card,hits:[]});
    ledger.get(id).hits.push({reason,tokens:tokens.filter(Boolean)});
  }
  function buildLedger(slot){
    const payload=read(KEYS[slot]);
    const index=cardIndex();
    const ledger=new Map();
    if(!payload)return ledger;

    source(payload).forEach(([key,item])=>{
      if(!item||typeof item!=='object'||Array.isArray(item))return;
      const value=longitude(item);if(!Number.isFinite(value))return;
      const planet=nameFor(key,item),sign=Math.floor(value/30),degree=value-sign*30,decan=Math.min(2,Math.floor(degree/10));
      const position=`${planet} in ${SIGNS[sign]} at ${Math.floor(degree)}°${String(Math.floor((degree%1)*60)).padStart(2,'0')}′`;
      add(ledger,index.byPlanet.get(planet.toLowerCase()),`Direct placement: ${position}.`,[planet,SIGNS[sign]]);
      add(ledger,index.byPlanet.get(SIGN_RULERS[sign].toLowerCase()),`${SIGN_RULERS[sign]} rules ${SIGNS[sign]}, the sign occupied by ${planet}.`,[planet,SIGNS[sign],SIGN_RULERS[sign]]);
      add(ledger,index.byPlanet.get(DECAN_RULERS[sign][decan].toLowerCase()),`${DECAN_RULERS[sign][decan]} rules decan ${decan+1} of ${SIGNS[sign]}, occupied by ${planet}.`,[planet,SIGNS[sign],DECAN_RULERS[sign][decan]]);
      if(EXALTATIONS[sign])add(ledger,index.byPlanet.get(EXALTATIONS[sign].toLowerCase()),`${EXALTATIONS[sign]} is exalted in ${SIGNS[sign]}, occupied by ${planet}.`,[planet,SIGNS[sign],EXALTATIONS[sign]]);
      const decanCardEntry=decanCard(sign,degree,index);
      add(ledger,decanCardEntry,`${position} falls in ${SIGNS[sign]} decan ${decan+1}.`,[planet,SIGNS[sign],`Decan ${decan+1}`]);
    });

    const profile=payload.calcProfile||payload.metadata||{};
    [['dayRuler','planetary day ruler'],['hourRuler','planetary hour ruler'],['planetaryDayRuler','planetary day ruler'],['planetaryHourRuler','planetary hour ruler']].forEach(([field,label])=>{
      const planet=String(profile[field]||payload[field]||'').trim();
      if(planet)add(ledger,index.byPlanet.get(planet.toLowerCase()),`${planet} is the ${label}.`,[planet,label]);
    });
    return ledger;
  }
  function imageFor(card){return `assets/tarot/rws/${card.card_id}.webp?v=border-preserving-crop-352`}

  function installStyles(){
    if(document.getElementById('skyLedgerBridgeStyles'))return;
    const style=document.createElement('style');style.id='skyLedgerBridgeStyles';style.textContent=`
      .sky-chart-hits{margin:.75rem 0 0;padding:.65rem;border-top:3px solid var(--sky-hit-color);background:rgba(255,255,255,.72)}
      .sky-chart-hits h3{margin:0 0 .5rem;font:800 .85rem/1.2 system-ui,sans-serif;letter-spacing:.03em;text-transform:uppercase}
      .sky-chart-hit-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:.5rem}
      .sky-chart-hit{position:relative;display:grid;gap:.25rem;justify-items:center;border:0;background:transparent;padding:.1rem;cursor:pointer;color:inherit}
      .sky-chart-hit img{display:block;width:100%;max-width:72px;aspect-ratio:2/3;object-fit:cover;border:2px solid var(--sky-hit-color);border-radius:.35rem}
      .sky-chart-hit-count{position:absolute;right:0;top:-.2rem;min-width:1.7rem;padding:.2rem .35rem;border-radius:999px;background:var(--sky-hit-color);color:white;font:800 .75rem/1 system-ui,sans-serif}
      .sky-chart-hit-name{font:700 .72rem/1.15 system-ui,sans-serif;text-align:center}
      .sky-ledger-dialog{width:min(94vw,720px);max-height:88vh;border:0;border-radius:1rem;padding:0;box-shadow:0 18px 60px rgba(0,0,0,.3)}
      .sky-ledger-dialog::backdrop{background:rgba(0,0,0,.48)}
      .sky-ledger-shell{display:grid;grid-template-rows:auto 1fr;max-height:88vh;background:#fffdfa;color:#1f1b18}
      .sky-ledger-header{display:flex;align-items:center;gap:.75rem;padding:.8rem 1rem;border-bottom:1px solid rgba(31,27,24,.15)}
      .sky-ledger-header img{width:46px;border-radius:.25rem}.sky-ledger-header h2{margin:0;font-size:1.1rem}.sky-ledger-header button{margin-left:auto}
      .sky-ledger-body{overflow:auto;padding:1rem}.sky-ledger-section{margin:0 0 1.15rem}.sky-ledger-section h3{margin:0 0 .55rem;font-size:1rem}
      .sky-ledger-hit,.sky-ledger-ingredient{border-top:1px solid rgba(31,27,24,.12);padding:.55rem 0}
      .sky-ledger-progressive{display:grid;grid-template-columns:auto 1fr;gap:.35rem .6rem;align-items:start}
      .sky-ledger-progressive button{border:0;background:transparent;padding:.15rem;text-align:left;color:inherit;font:inherit;cursor:pointer}
      .sky-ledger-glyphs{font-size:1.15rem;font-weight:800;letter-spacing:.08em}.sky-ledger-names{font-weight:750}.sky-ledger-referent{grid-column:1/-1;margin:.1rem 0 0;color:#3c3530}
      .sky-ledger-level[hidden]{display:none!important}.sky-ledger-ingredient-label{font-weight:800}.sky-ledger-empty{margin:0;color:#5f5751}
      @media(max-width:560px){.sky-chart-hit-list{grid-template-columns:repeat(4,minmax(0,1fr))}.sky-chart-hit-name{font-size:.66rem}.sky-ledger-dialog{width:100vw;max-width:none;height:100dvh;max-height:none;border-radius:0}.sky-ledger-shell{max-height:100dvh;height:100dvh}}
    `;document.head.appendChild(style);
  }
  function ingredientRows(card){
    const rows=[];
    const push=(label,glyph,name,referent)=>{if(name||glyph)rows.push({label,glyph:glyph||'•',name:name||glyph,referent:referent||''})};
    push('Hebrew letter',card?.hebrew?.letter,card?.hebrew?.letter_name,card?.hebrew?.letter_class||'');
    push('Planet',card?.astrology?.planet,card?.astrology?.planet,card?.astrology?.logic||'');
    push('Zodiac sign',card?.astrology?.sign,card?.astrology?.sign,card?.astrology?.degree_span||card?.astrology?.zodiac_range||'');
    push('Element of suit',card?.element,card?.element,card?.suit?`${card.suit} carries the ${card.element} element.`:'');
    push('Element of rank',card?.rank,card?.rank,card?.card_type||'');
    push('Number',String(card?.number||card?.rank||''),String(card?.number||card?.rank||''),'');
    const systems=card?.systems||{};
    Object.entries(systems).forEach(([system,value])=>{if(value?.title)push(system.replaceAll('_',' '),'',value.title,value.notes||'')});
    return rows;
  }
  function progressiveMarkup(glyphs,names,referent,label){
    return `<div class="sky-ledger-progressive" data-stage="0"><button class="sky-ledger-level sky-ledger-glyphs" data-level="0" aria-label="Reveal names for ${esc(label)}">${esc(glyphs.join?glyphs.join(' · '):glyphs)}</button><button class="sky-ledger-level sky-ledger-names" data-level="1" hidden>${esc(names)}</button><p class="sky-ledger-level sky-ledger-referent" data-level="2" hidden>${esc(referent)}</p></div>`;
  }
  function ensureDialog(){
    if(dialog?.isConnected)return dialog;
    dialog=document.createElement('dialog');dialog.className='sky-ledger-dialog';dialog.innerHTML='<div class="sky-ledger-shell"><header class="sky-ledger-header"><img alt=""><h2></h2><button type="button" data-close-ledger aria-label="Close">Close</button></header><div class="sky-ledger-body"></div></div>';
    document.body.appendChild(dialog);
    dialog.addEventListener('click',event=>{
      if(event.target===dialog)dialog.close();
      if(event.target.closest('[data-close-ledger]'))dialog.close();
      const level=event.target.closest('.sky-ledger-level');if(!level)return;
      const group=level.closest('.sky-ledger-progressive');const clicked=Number(level.dataset.level),stage=Number(group.dataset.stage||0);
      const next=clicked===0?(stage===0?1:0):clicked===1?(stage===1?2:1):2;group.dataset.stage=String(next);
      group.querySelectorAll('.sky-ledger-level').forEach(node=>node.hidden=Number(node.dataset.level)>next);
      group.querySelector(`[data-level="${next}"]`)?.focus?.({preventScroll:true});
    });
    return dialog;
  }
  function openEntry(slot,entry){
    const modal=ensureDialog(),card=entry.card,header=modal.querySelector('.sky-ledger-header'),body=modal.querySelector('.sky-ledger-body');
    header.style.borderTop=`5px solid ${COLORS[slot]}`;header.querySelector('img').src=imageFor(card);header.querySelector('img').alt=`${card.name} card`;header.querySelector('h2').textContent=`${card.name} ×${entry.hits.length}`;
    const hits=entry.hits.map((hit,index)=>`<article class="sky-ledger-hit"><span class="sky-ledger-ingredient-label">Activation ${index+1}</span>${progressiveMarkup(hit.tokens,hit.tokens.join(' · '),hit.reason,`activation ${index+1}`)}</article>`).join('');
    const ingredients=ingredientRows(card).map(row=>`<article class="sky-ledger-ingredient"><span class="sky-ledger-ingredient-label">${esc(row.label)}</span>${progressiveMarkup(row.glyph,row.name,row.referent,row.label)}</article>`).join('');
    body.innerHTML=`<section class="sky-ledger-section"><h3>Chart activations</h3>${hits||'<p class="sky-ledger-empty">No activation records.</p>'}</section><section class="sky-ledger-section"><h3>Tarot Ledger ingredients</h3>${ingredients||'<p class="sky-ledger-empty">No Ledger ingredients are available for this card yet.</p>'}</section>`;
    modal.showModal();
  }
  function renderSlot(slot){
    const panel=document.getElementById(`skyFoundation${slot}`);if(!panel)return;
    let section=panel.querySelector(':scope > .sky-chart-hits');if(!section){section=document.createElement('section');section.className='sky-chart-hits';section.style.setProperty('--sky-hit-color',COLORS[slot]);section.innerHTML='<h3>Chart Card Hits</h3><div class="sky-chart-hit-list"></div>';panel.appendChild(section)}
    const ledger=buildLedger(slot),entries=Array.from(ledger.values()).sort((a,b)=>b.hits.length-a.hits.length||a.card.name.localeCompare(b.card.name));
    const list=section.querySelector('.sky-chart-hit-list');list.replaceChildren();
    entries.slice(0,12).forEach(entry=>{const button=document.createElement('button');button.type='button';button.className='sky-chart-hit';button.dataset.cardId=entry.card.card_id;button.setAttribute('aria-label',`${entry.card.name}, ${entry.hits.length} chart activations`);button.innerHTML=`<img src="${esc(imageFor(entry.card))}" alt=""><span class="sky-chart-hit-count">×${entry.hits.length}</span><span class="sky-chart-hit-name">${esc(entry.card.name)}</span>`;button.addEventListener('click',()=>openEntry(slot,entry));list.appendChild(button)});
    if(!entries.length)list.innerHTML='<p class="sky-ledger-empty">Add or calculate placements to see card activations.</p>';
    section.dataset.hitCount=String(entries.length);
  }
  function wireDualCards(){
    document.querySelectorAll('#skySelectedRelationship .sky-selected-card[data-card-title]').forEach(card=>{
      if(card.dataset.ledgerBridgeReady)return;card.dataset.ledgerBridgeReady='true';card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',`${card.dataset.cardTitle}. Open Tarot Ledger bridge.`);
      const open=()=>{const index=cardIndex(),entry=index.cards.find(item=>item.name===card.dataset.cardTitle);if(!entry)return;const slot=card.dataset.selectedCard||'A',ledger=buildLedger(slot),record=ledger.get(entry.card_id)||{card:entry,hits:[]};openEntry(slot,record)};
      card.addEventListener('click',open);card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open()}});
    });
  }
  function apply(){queued=false;installStyles();renderSlot('A');renderSlot('B');wireDualCards();window.dispatchEvent(new CustomEvent('relphi:sky-ledger-bridge-ready'))}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(apply))}
  function start(){installStyles();['relphi:sky-foundation-rendered','relphi:selected-relationship-rendered','storage'].forEach(name=>window.addEventListener(name,schedule));new MutationObserver(m=>{if(m.some(x=>x.addedNodes.length||x.removedNodes.length))schedule()}).observe(document.body,{childList:true,subtree:true});schedule()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
