// Crowley harmonic divination helper for the Drawing Board.
(function(){
  'use strict';
  if(!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if(window.__relphiCrowleyHarmonicV1) return;
  window.__relphiCrowleyHarmonicV1=true;

  const TEMPLATE_ID='crowley-harmonic-divination-12';
  const ASPECTS={0:['Conjunction','0°'],1:['Adjacent','30°'],2:['Sextile','60°'],3:['Square','90°'],4:['Trine','120°'],5:['Quincunx','150°'],6:['Opposition','180°']};
  let anchor=0, stride=2, pairRadius=1;

  function root(){return document.getElementById('shortListPanel');}
  function active(){
    const select=root()?.querySelector('#relphiSpreadTemplateSelect');
    if(select?.value===TEMPLATE_ID) return true;
    const state=window.RelphiDrawingBoardPrefabsBridge?.getState?.();
    return state?.activeLayout?.id===TEMPLATE_ID || state?.currentLayout?.id===TEMPLATE_ID;
  }
  function items(){return Array.from(root()?.querySelectorAll('.card-row-board .card-row-item')||[]).slice(0,12);}
  function circularDistance(a,b){const d=Math.abs(a-b)%12;return Math.min(d,12-d);}
  function aspectForStep(step){return ASPECTS[Math.min(step%12,12-(step%12))]||['Conjunction','0°'];}
  function clearMarks(){
    items().forEach(el=>{el.classList.remove('crowley-anchor','crowley-target','crowley-pair');el.removeAttribute('data-crowley-aspect');});
  }
  function mark(){
    clearMarks();
    const cards=items(); if(cards.length<12) return;
    const target=(anchor+stride)%12;
    cards[anchor]?.classList.add('crowley-anchor');
    cards[target]?.classList.add('crowley-target');
    const left=(anchor-pairRadius+12)%12, right=(anchor+pairRadius)%12;
    cards[left]?.classList.add('crowley-pair'); cards[right]?.classList.add('crowley-pair');
    const a=aspectForStep(stride), pair=aspectForStep((pairRadius*2)%12);
    const status=document.getElementById('crowleyHarmonicStatus');
    if(status) status.textContent='Card Counting: '+(stride+1)+' inclusive → move '+stride+' → '+a[0]+' '+a[1]+'. Card Pairing: ±'+pairRadius+' → separation '+((pairRadius*2)%12||12)+' → '+pair[0]+' '+pair[1]+'.';
  }
  function countOptions(){
    const values=[
      [3,'Elemental trump · count 3'],[4,'Knight / Queen / Prince · count 4'],[7,'Princess · count 7'],
      [9,'Planetary trump · count 9'],[11,'Ace · count 11'],[12,'Zodiacal trump · count 12'],
      [2,'Pip 2'],[3,'Pip 3'],[4,'Pip 4'],[5,'Pip 5'],[6,'Pip 6'],[7,'Pip 7'],[8,'Pip 8'],[9,'Pip 9'],[10,'Pip 10']
    ];
    return values.map(([v,l])=>'<option value="'+v+'">'+l+'</option>').join('');
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
      #crowleyHarmonicStatus{margin:.65rem 0 0;font-size:.9rem}
      #shortListPanel .card-row-item.crowley-anchor .card-row-card-wrap{outline:3px solid var(--relphi-red,#8b1e2d)!important;outline-offset:3px}
      #shortListPanel .card-row-item.crowley-target .card-row-card-wrap{outline:3px dashed #725c16!important;outline-offset:3px}
      #shortListPanel .card-row-item.crowley-pair .card-row-card-wrap{box-shadow:0 0 0 3px rgba(55,83,105,.58)!important}
    `;
    document.head.appendChild(s);
  }
  function ensureGuide(){
    const r=root(); if(!r) return;
    installStyle();
    let box=document.getElementById('crowleyHarmonicGuide');
    if(!box){
      box=document.createElement('section');box.id='crowleyHarmonicGuide';box.hidden=true;
      box.innerHTML='<strong>Opening of the Key · First Operation</strong><p style="margin:.35rem 0 .7rem"><b>Opening of the Question.</b> Choose the Significator position. Use <b>Card Counting</b> to form the narrative string; counting is inclusive, so its geometric movement is count − 1. Use <b>Card Pairing</b> to read cards at equal distances around the Significator. Read both with <b>Elemental Dignities</b>.</p><div class="crowley-controls"><label>Significator<select id="crowleyAnchor">'+Array.from({length:12},(_,i)=>'<option value="'+i+'">Position '+(i+1)+'</option>').join('')+'</select></label><label>Card Counting<select id="crowleyCount">'+countOptions()+'</select></label><label>Card Pairing<select id="crowleyPair">'+Array.from({length:6},(_,i)=>'<option value="'+(i+1)+'">±'+(i+1)+'</option>').join('')+'</select></label><button id="crowleyAdvance" type="button">Continue Card Counting</button></div><p id="crowleyHarmonicStatus" aria-live="polite"></p>';
      const workspace=r.querySelector('.card-row-workspace')||r.firstElementChild;
      if(workspace) workspace.parentNode.insertBefore(box,workspace); else r.prepend(box);
      box.querySelector('#crowleyAnchor').addEventListener('change',e=>{anchor=Number(e.target.value)||0;mark();});
      box.querySelector('#crowleyCount').addEventListener('change',e=>{stride=(Number(e.target.value)||3)-1;mark();});
      box.querySelector('#crowleyPair').addEventListener('change',e=>{pairRadius=Number(e.target.value)||1;mark();});
      box.querySelector('#crowleyAdvance').addEventListener('click',()=>{anchor=(anchor+stride)%12;box.querySelector('#crowleyAnchor').value=String(anchor);mark();});
      box.querySelector('#crowleyCount').value='3';
    }
    box.hidden=!active();
    if(!box.hidden) mark(); else clearMarks();
  }
  document.addEventListener('change',e=>{if(e.target?.id==='relphiSpreadTemplateSelect') setTimeout(ensureGuide,0);});
  document.addEventListener('relphi:drawing-board-rendered',()=>setTimeout(ensureGuide,0));
  new MutationObserver(()=>ensureGuide()).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ensureGuide,{once:true}); else ensureGuide();
})();