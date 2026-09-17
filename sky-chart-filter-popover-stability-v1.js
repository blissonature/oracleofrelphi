// Keep Sky Chart filter popovers dimensionally stable without changing the page's layout geometry while they are open.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyFilterPopoverStabilityV1)return;
  window.__relphiSkyFilterPopoverStabilityV1=true;

  const CONFIGS=[
    {selector:'#skyChartPlacementPopover.sky-chart-placement-filter-popover.is-portaled:not([hidden])',min:280,max:360,gutter:'stable'},
    {selector:'#skyChartHousePopover.sky-chart-house-filter-popover.is-portaled:not([hidden])',min:280,max:430,gutter:'auto'},
    {selector:'#skyChartAspectPopover.sky-chart-aspect-filter-popover.is-portaled:not([hidden])',min:240,max:270,gutter:'stable'}
  ];
  const MENU_SELECTOR='#skyChartPlacementPopover,#skyChartHousePopover,#skyChartAspectPopover';
  const WIDTH_ATTR='data-relphi-locked-popover-width';
  let syncQueued=false;
  let unlockQueued=false;
  let pageLocked=false;
  const observedMenus=new Set();
  const menuObservers=new WeakMap();
  let creationObserver=null;

  function clamp(value,min,max){return Math.max(min,Math.min(max,value))}
  function activeMenus(){
    const result=[];
    CONFIGS.forEach(config=>document.querySelectorAll(config.selector).forEach(menu=>result.push({menu,config})));
    return result;
  }
  function configFor(menu){return CONFIGS.find(config=>menu.matches(config.selector.replace('.is-portaled:not([hidden])','')))||null}
  function lockedWidth(menu,config){
    const existing=Number(menu.getAttribute(WIDTH_ATTR));
    if(Number.isFinite(existing)&&existing>0)return existing;
    const width=clamp(window.innerWidth-16,config.min,config.max);
    menu.setAttribute(WIDTH_ATTR,String(width));
    return width;
  }
  function stabilizeMenu(menu,config){
    const width=lockedWidth(menu,config);
    const px=`${width}px`;
    if(menu.style.width!==px)menu.style.width=px;
    if(menu.style.minWidth!==px)menu.style.minWidth=px;
    if(menu.style.maxWidth!==px)menu.style.maxWidth=px;
    if(menu.style.boxSizing!=='border-box')menu.style.boxSizing='border-box';
    const gutter=config.gutter||'stable';
    if(menu.style.scrollbarGutter!==gutter)menu.style.scrollbarGutter=gutter;
    if(menu.style.overscrollBehavior!=='contain')menu.style.overscrollBehavior='contain';
    if(menu.style.touchAction!=='pan-y')menu.style.touchAction='pan-y';
    if(menu.style.webkitOverflowScrolling!=='touch')menu.style.webkitOverflowScrolling='touch';
  }
  function clearClosedWidthLocks(){
    document.querySelectorAll(`[${WIDTH_ATTR}]`).forEach(menu=>{
      if(menu.classList.contains('is-portaled')&&!menu.hidden)return;
      menu.removeAttribute(WIDTH_ATTR);
      resizeObserver.unobserve(menu);
      observedMenus.delete(menu);
    });
  }

  // Keep the document's scrollbar and box geometry exactly as they are. Background
  // scrolling is blocked by the captured wheel/touch/key handlers below instead of
  // hiding overflow or fixing the body, both of which change the layout viewport.
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

  const resizeObserver=new ResizeObserver(entries=>{
    entries.forEach(entry=>{
      const config=configFor(entry.target);
      if(config&&entry.target.classList.contains('is-portaled')&&!entry.target.hidden)stabilizeMenu(entry.target,config);
    });
  });

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
    clearClosedWidthLocks();
    const active=activeMenus();
    if(active.length){
      active.forEach(({menu,config})=>{
        stabilizeMenu(menu,config);
        if(!observedMenus.has(menu)){observedMenus.add(menu);resizeObserver.observe(menu)}
      });
      lockPage();
    }else scheduleUnlock();
  }
  function scheduleSync(){
    if(syncQueued)return;
    syncQueued=true;
    requestAnimationFrame(sync);
  }

  function insideActiveMenu(target){return activeMenus().some(({menu})=>menu===target||menu.contains(target))}
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
      if(event.target.closest?.('[data-placement-filter-toggle],[data-house-filter-toggle],[data-aspect-filter-toggle]'))requestAnimationFrame(scheduleSync);
    },true);
    window.addEventListener('resize',scheduleSync);
    window.visualViewport?.addEventListener('resize',scheduleSync);
    scheduleSync();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
