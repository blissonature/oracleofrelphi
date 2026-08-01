// Explicit numeric orb filter combined with the wheel-owned relationship isolation.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyOrbControlV1)return;
  window.__relphiSkyOrbControlV1=true;

  let queued=false;
  let wheelIndexes=null;

  function orbFromRow(row){
    const explicit=Number(row.dataset.orb);
    if(Number.isFinite(explicit))return explicit;
    const match=String(row.getAttribute('aria-label')||'').match(/orb\s+([0-9]+(?:\.[0-9]+)?)/i);
    return match?Number(match[1]):NaN;
  }

  function apply(){
    queued=false;
    const input=document.querySelector('[data-filter="orb"]');
    if(!input)return;
    const raw=input.value.trim();
    const limit=raw===''?Infinity:Number(raw);
    const valid=raw===''||(Number.isFinite(limit)&&limit>=0);
    input.setCustomValidity(valid?'':'Enter an orb of 0 or greater.');
    if(!valid)return;

    document.querySelectorAll('.sky-foundation-relationship-row').forEach(row=>{
      const orb=orbFromRow(row);
      const hiddenByOrb=Number.isFinite(orb)&&orb>limit;
      const hiddenByWheel=wheelIndexes&&!wheelIndexes.has(String(row.dataset.relationIndex));
      row.classList.toggle('sky-chart-orb-hidden',hiddenByOrb);
      row.hidden=row.classList.contains('sky-chart-filter-hidden')||hiddenByOrb||hiddenByWheel;
      row.setAttribute('aria-hidden',row.hidden?'true':'false');
      document.querySelectorAll(`[data-layer="aspects"] [data-relation-index="${row.dataset.relationIndex}"]`).forEach(node=>{
        node.classList.toggle('sky-chart-orb-hidden',hiddenByOrb);
      });
    });

    const rows=[...document.querySelectorAll('.sky-foundation-relationship-row')];
    const visible=rows.filter(row=>!row.hidden).length;
    const count=document.getElementById('skyFoundationRelationshipCount');
    if(count)count.textContent=`${visible}/${rows.length}`;
    const empty=document.getElementById('skyFoundationRelationshipEmpty');
    if(empty)empty.hidden=visible!==0;
  }

  function schedule(){if(queued)return;queued=true;requestAnimationFrame(apply)}

  function install(){
    const bar=document.querySelector('.sky-chart-filter-bar');
    if(!bar||bar.querySelector('[data-filter="orb"]'))return;
    const field=document.createElement('div');
    field.className='sky-orb-number-field';
    const caption=document.createElement('span');
    caption.textContent='Maximum Orb';
    const input=document.createElement('input');
    input.type='number';
    input.min='0';
    input.step='0.1';
    input.inputMode='decimal';
    input.placeholder='All';
    input.dataset.filter='orb';
    input.setAttribute('aria-label','Maximum orb in degrees');
    field.append(caption,input);
    bar.appendChild(field);
    input.addEventListener('input',schedule);
    input.addEventListener('change',schedule);
    schedule();
  }

  function start(){
    install();
    window.addEventListener('relphi:sky-foundation-interactions-ready',()=>{install();schedule()});
    window.addEventListener('relphi:sky-foundation-filter-changed',event=>{
      wheelIndexes=event.detail?.state?new Set((event.detail.relationshipIndexes||[]).map(String)):null;
      schedule();
    });
    window.addEventListener('relphi:selected-relationship-rendered',schedule);
    document.getElementById('skyFoundationRelationships')?.addEventListener('change',schedule);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
