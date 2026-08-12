// Placement filters are endpoint selectors, not an AND gate across both endpoints.
// A relationship remains visible when either endpoint matches a selected placement
// in that endpoint's sky. If no placements are selected anywhere, no relationship
// is shown.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyPlacementFilterSemanticsV1)return;
  window.__relphiSkyPlacementFilterSemanticsV1=true;

  const selected={A:new Set(),B:new Set()};
  const aliases={
    ascendant:'asc',asc:'asc',ac:'asc',rising:'asc',
    descendant:'dsc',descendant:'dsc',dsc:'dsc',desc:'dsc',dc:'dsc',
    midheaven:'mc','medium coeli':'mc',mc:'mc',
    'imum coeli':'ic',imumcoeli:'ic',ic:'ic',
    'north node':'north-node',northnode:'north-node',
    'south node':'south-node',southnode:'south-node',
    'part of fortune':'part-of-fortune',partoffortune:'part-of-fortune',fortune:'part-of-fortune',
    'black moon lilith':'lilith',lilith:'lilith',vertex:'vertex',vx:'vertex'
  };

  function canonical(value){
    const raw=String(value||'').trim().toLowerCase().replace(/_/g,'-').replace(/[.]+$/g,'').replace(/\s+/g,' ');
    const compact=raw.replace(/[\s-]+/g,'');
    return aliases[raw]||aliases[compact]||raw.replace(/\s+/g,'-');
  }

  function relationshipSlots(row){
    const mode=row.dataset.relationshipMode||document.documentElement.dataset.skyRelationshipMode||'A-B';
    if(mode==='A-A')return['A','A'];
    if(mode==='B-B')return['B','B'];
    return[row.dataset.leftSky||'A',row.dataset.rightSky||'B'];
  }

  function matches(row){
    const any=selected.A.size>0||selected.B.size>0;
    if(!any)return false;
    const [leftSky,rightSky]=relationshipSlots(row);
    const left=canonical(row.dataset.leftPlacement);
    const right=canonical(row.dataset.rightPlacement);
    return (!!left&&selected[leftSky]?.has(left)) || (!!right&&selected[rightSky]?.has(right));
  }

  function setAspectVisibility(row,visible){
    const index=CSS.escape(String(row.dataset.relationIndex||''));
    if(!index)return;
    document.querySelectorAll(`[data-layer="aspects"] [data-relation-index="${index}"]`).forEach(node=>{
      node.classList.toggle('sky-chart-multiselect-hidden',!visible);
    });
  }

  function updateCount(){
    requestAnimationFrame(()=>{
      const rows=[...document.querySelectorAll('.sky-foundation-relationship-row')]
        .filter(row=>!row.classList.contains('sky-foundation-single-sky-cross-hidden'));
      const visible=rows.filter(row=>
        !row.hidden&&
        !row.classList.contains('sky-chart-filter-hidden')&&
        !row.classList.contains('sky-chart-orb-hidden')&&
        !row.classList.contains('sky-orb-filter-hidden')&&
        !row.classList.contains('sky-chart-multiselect-hidden')&&
        !row.classList.contains('sky-chart-house-multiselect-hidden')&&
        !row.classList.contains('sky-chart-aspect-multiselect-hidden')&&
        !row.classList.contains('sky-chart-sign-filter-hidden')&&
        !row.classList.contains('sky-chart-semantic-hidden')
      ).length;
      const count=document.getElementById('skyFoundationRelationshipCount');
      const empty=document.getElementById('skyFoundationRelationshipEmpty');
      if(count)count.textContent=`${visible}/${rows.length}`;
      if(empty)empty.hidden=visible!==0;
    });
  }

  function apply(){
    document.querySelectorAll('.sky-foundation-relationship-row').forEach(row=>{
      const visible=matches(row);
      row.classList.toggle('sky-chart-multiselect-hidden',!visible);
      setAspectVisibility(row,visible);
    });
    document.documentElement.dataset.skyPlacementFilterSemantics='endpoint-or';
    updateCount();
  }

  window.addEventListener('relphi:sky-placement-multiselect-changed',event=>{
    selected.A=new Set((event.detail?.A||[]).map(canonical));
    selected.B=new Set((event.detail?.B||[]).map(canonical));
    apply();
  });
})();
