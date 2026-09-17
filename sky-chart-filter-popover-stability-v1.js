// Keep Sky Chart filter popovers interaction-stable without becoming another geometry owner.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyFilterPopoverStabilityV1)return;
  window.__relphiSkyFilterPopoverStabilityV1=true;

  const MENU_SELECTOR='#skyChartPlacementPopover,#skyChartHousePopover,#skyChartAspectPopover';
  const ACTIVE_SELECTOR='#skyChartPlacementPopover.is-portaled:not([hidden]),#skyChartHousePopover.is-portaled:not([hidden]),#skyChartAspectPopover.is-portaled:not([hidden])';
  let syncQueued=false;
  let unlockQueued=false;
  let pageLocked=false;
  const menuObservers=new WeakMap();
  let creationObserver=null;

  function activeMenus(){return Array.from(document.querySelectorAll(ACTIVE_SELECTOR))}

  // Width, height, left, top, and scrollbar geometry belong to the individual popover
  // controllers. This shared layer only prevents the page behind an open menu from
  // scrolling, so it cannot introduce a second layout pass or a competing width.
  function stabilizeInteraction(menu){
    if(menu.style.overscrollBehavior!=='contain')menu.style.overscrollBehavior='contain';
    if(menu.style.touchAction!=='pan-y')menu.style.touchAction='pan-y';
    if(menu.style.webkitOverflowScrolling!=='touch')menu.style.webkitOverflowScrolling='touch';
  }

  // Keep the document's scrollbar and box geometry exactly as they are. Background
  // scrolling is blocked by captured wheel/touch/key handlers instead of changing
  // html/body overflow, which would change the layout viewport.
  function lockPage(){
    if(pageLocked)return;
    pageLocked=true;
    document.documentElement.dataset.skyFilterPopoverPageLocked='true';
  }
  function unlockPageNow(){
    unlockQueued=false;
    if(activeMenus().length||!pageLocked)return;
    pageLocked=false;
    delete document.documentElement.dataset.skyFilterPopoverPageLocked;
  }
  function scheduleUnlock(){
    if(unlockQueued)return;
    unlockQueued=true;
    requestAnimationFrame(()=>requestAnimationFrame(unlockPageNow));
  }

  function bindMenus(){
    document.querySelectorAll(MENU_SELECTOR).forEach(menu=>{
      if(menuObservers.has(menu))return;
      const observer=new MutationObserver(scheduleSync);
      observer.observe(menu,{attributes:true,attributeFilter:['class','hidden']});
      menuObservers.set(menu,observer);
    });
  }

  function sync(){
    syncQueued=false;
    bindMenus();
    const active=activeMenus();
    if(active.length){
      active.forEach(stabilizeInteraction);
      lockPage();
    }else scheduleUnlock();
  }
  function scheduleSync(){
    if(syncQueued)return;
    syncQueued=true;
    requestAnimationFrame(sync);
  }

  function insideActiveMenu(target){return activeMenus().some(menu=>menu===target||menu.contains(target))}
  function preventBackgroundScroll(event){
    if(!pageLocked||insideActiveMenu(event.target))return;
    event.preventDefault();
  }
  function preventBackgroundKeys(event){
    if(!pageLocked||insideActiveMenu(event.target))return;
    if(event.target?.matches?.('input,textarea,select,[contenteditable="true"]'))return;
    if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))event.preventDefault();
  }
  function containsManagedMenu(node){
    if(!(node instanceof Element))return false;
    return node.matches(MENU_SELECTOR)||!!node.querySelector?.(MENU_SELECTOR);
  }

  function start(){
    bindMenus();
    creationObserver=new MutationObserver(records=>{
      if(records.some(record=>[...record.addedNodes,...record.removedNodes].some(containsManagedMenu))){
        bindMenus();
        scheduleSync();
      }
    });
    creationObserver.observe(document.body,{subtree:true,childList:true});
    window.addEventListener('wheel',preventBackgroundScroll,{capture:true,passive:false});
    window.addEventListener('touchmove',preventBackgroundScroll,{capture:true,passive:false});
    document.addEventListener('keydown',event=>{
      preventBackgroundKeys(event);
      if(event.key==='Escape')requestAnimationFrame(scheduleSync);
    },true);
    document.addEventListener('click',event=>{
      if(event.target.closest?.('[data-placement-filter-toggle],[data-house-filter-toggle],[data-aspect-filter-toggle],[data-aspect-filter-value]'))requestAnimationFrame(scheduleSync);
    },true);
    scheduleSync();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
