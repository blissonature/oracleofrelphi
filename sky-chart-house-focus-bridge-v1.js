// Make comparison-wheel House taps use the same persistent Houses filter contract
// as Relationships and Card Hits. Blank chart space clears a singular House focus.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyHouseFocusBridgeV1)return;
  window.__relphiSkyHouseFocusBridgeV1=true;

  const HOUSES=Array.from({length:12},(_,i)=>String(i+1));
  let queuedClear=false;

  function choice(slot,house){
    return document.querySelector(`[data-house-choice="${String(slot).toLowerCase()}"][data-house-scope="house"][data-house-target="${house}"]`);
  }
  function master(slot){
    return document.querySelector(`[data-house-choice="${String(slot).toLowerCase()}"][data-house-scope="all"][data-house-target="all"]`);
  }
  function selected(slot){return HOUSES.filter(house=>choice(slot,house)?.checked)}
  function dispatch(input,checked){
    if(!input)return false;
    input.checked=checked;
    input.dispatchEvent(new Event('change',{bubbles:true}));
    return true;
  }
  function setSingle(slot,house){
    const target=String(house),all=master(slot),item=choice(slot,target);
    if(!all||!item||!HOUSES.includes(target))return false;
    const current=selected(slot),already=current.length===1&&current[0]===target;
    if(already)dispatch(all,true);
    else{
      dispatch(all,false);
      dispatch(item,true);
    }
    window.dispatchEvent(new CustomEvent('relphi:sky-house-focus-bridge-changed',{detail:{slot,house:already?null:Number(target),active:!already,source:'comparison-wheel'}}));
    return true;
  }
  function singularSlots(){
    return ['A','B'].filter(slot=>selected(slot).length===1&&master(slot));
  }
  function clearSingularHouseFocus(){
    queuedClear=false;
    const slots=singularSlots();
    if(!slots.length)return;
    slots.forEach(slot=>dispatch(master(slot),true));
    window.dispatchEvent(new CustomEvent('relphi:sky-house-focus-bridge-changed',{detail:{slot:null,house:null,active:false,source:'blank-space'}}));
  }
  function scheduleClear(){
    if(queuedClear)return;
    queuedClear=true;
    requestAnimationFrame(clearSingularHouseFocus);
  }
  function wheelHouse(target){
    return target?.closest?.('#skyFoundationWheelMount [data-interactive="house"][data-sky][data-house]')||null;
  }
  function clearableBlank(target){
    const root=document.getElementById('skyFoundationRoot');
    if(!root?.contains(target))return false;
    if(target.closest?.('[data-interactive],button,input,select,textarea,a,label,summary,details,.sky-foundation-relationship-row,#skySelectedRelationship,.sky-chart-filter-bar,.sky-card-hits-structure,.sky-foundation-relationships-heading'))return false;
    return !!target.closest?.('#skyFoundationWheelMount,#skyFoundationA,#skyFoundationB,#skyFoundationComparison');
  }
  function bind(){
    const root=document.getElementById('skyFoundationRoot');
    if(!root||root.dataset.houseFocusBridgeBound==='true')return;
    root.dataset.houseFocusBridgeBound='true';

    // Capture before the older wheel interaction controller can create its own
    // separate locked House state. The shared Houses checklist is the source of truth.
    root.addEventListener('click',event=>{
      const houseNode=wheelHouse(event.target);
      if(houseNode){
        const slot=String(houseNode.dataset.sky||'').toUpperCase(),house=Number(houseNode.dataset.house);
        if((slot==='A'||slot==='B')&&Number.isInteger(house)&&house>=1&&house<=12){
          event.preventDefault();
          event.stopPropagation();
          setSingle(slot,house);
        }
        return;
      }
      if(clearableBlank(event.target)&&singularSlots().length)scheduleClear();
    },true);

    root.addEventListener('keydown',event=>{
      if(!['Enter',' '].includes(event.key))return;
      const houseNode=wheelHouse(event.target);if(!houseNode)return;
      const slot=String(houseNode.dataset.sky||'').toUpperCase(),house=Number(houseNode.dataset.house);
      if((slot!=='A'&&slot!=='B')||!Number.isInteger(house)||house<1||house>12)return;
      event.preventDefault();
      event.stopPropagation();
      setSingle(slot,house);
    },true);
  }
  function start(){
    bind();
    window.addEventListener('relphi:sky-foundation-ready',bind);
    window.addEventListener('relphi:sky-foundation-interactions-ready',bind);
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();