// Present Sky B comparison presence as paired card-local icon controls.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkySlotCardControlsV1)return;
  window.__relphiSkySlotCardControlsV1=true;

  const SKY_B_KEY='relphiSkyChartB';
  let queued=false;

  function icon(kind){
    const span=document.createElement('span');
    span.className=`sky-slot-card-icon sky-slot-card-icon--${kind}`;
    span.setAttribute('aria-hidden','true');
    return span;
  }
  function hasStoredSkyB(){
    try{
      const value=JSON.parse(localStorage.getItem(SKY_B_KEY)||'null');
      if(!value||typeof value!=='object')return false;
      const source=[value.placements,value.positions,value.points,value.bodies].find(candidate=>candidate&&typeof candidate==='object')||value;
      return Object.entries(source).some(([key,item])=>item&&typeof item==='object'&&!Array.isArray(item)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key)&&(Number.isFinite(Number(item.longitude))||item.sign||item.zodiac));
    }catch(_){return false}
  }

  function startAddSkyB(){
    const internal=document.querySelector('#skyFoundationComparison [data-add-sky-b]');
    if(internal){internal.click();return}
    // Fail visibly into the established editing state rather than silently doing nothing.
    document.documentElement.dataset.skyBEditing='true';
    document.documentElement.dataset.skyLastMode='comparison';
    try{localStorage.setItem('relphiSkyChartLastModeV1','comparison')}catch(_){}
    window.dispatchEvent(new CustomEvent('relphi:sky-b-add-requested'));
  }
  function ensureAddProxy(){
    const heading=document.querySelector('#skyFoundationA > .sky-foundation-heading');
    if(!heading)return;
    let button=heading.querySelector('[data-card-add-sky-b]');
    if(!button){
      button=document.createElement('button');
      button.type='button';
      button.className='sky-slot-card-control sky-slot-card-control--add';
      button.dataset.cardAddSkyB='true';
      button.setAttribute('aria-label','Add Sky B');
      button.title='Add Sky B';
      button.appendChild(icon('plus'));
      button.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();startAddSkyB();
      });
      heading.appendChild(button);
    }
    const editing=document.documentElement.dataset.skyBEditing==='true';
    button.hidden=hasStoredSkyB()||editing;
  }

  function styleRemove(){
    const remove=document.querySelector('#skyFoundationB > .sky-foundation-heading [data-remove-sky-b]');
    if(!remove)return;
    if(remove.dataset.cardIconified==='true')return;
    remove.dataset.cardIconified='true';
    remove.classList.add('sky-slot-card-control','sky-slot-card-control--remove');
    remove.setAttribute('aria-label','Remove Sky B');
    remove.title='Remove Sky B';
    remove.replaceChildren(icon('minus'));
  }

  function suppressInternalAdd(){
    const add=document.querySelector('#skyFoundationComparison > .sky-foundation-heading [data-add-sky-b]');
    if(add){
      add.classList.add('sky-slot-internal-add');
      add.setAttribute('aria-hidden','true');
      add.tabIndex=-1;
    }
  }

  function sync(){queued=false;suppressInternalAdd();ensureAddProxy();styleRemove()}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(sync)}
  function start(){
    sync();
    const root=document.getElementById('skyFoundationRoot')||document.body;
    new MutationObserver(schedule).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
    new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-sky-b-present','data-sky-b-editing','data-sky-last-mode']});
    window.addEventListener('storage',schedule);
    window.addEventListener('relphi:sky-foundation-ready',schedule);
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
