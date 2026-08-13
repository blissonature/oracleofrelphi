// Keep Sky Chart filter popovers dimensionally stable and prevent background-page drift while they are open.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyFilterPopoverStabilityV1)return;
  window.__relphiSkyFilterPopoverStabilityV1=true;

  const CONFIGS=[
    {selector:'#skyChartPlacementPopover.sky-chart-placement-filter-popover.is-portaled:not([hidden])',min:280,max:360},
    {selector:'#skyChartHousePopover.sky-chart-house-filter-popover.is-portaled:not([hidden])',min:280,max:330},
    {selector:'#skyChartAspectPopover.sky-chart-aspect-filter-popover.is-portaled:not([hidden])',min:240,max:270}
  ];
  const WIDTH_ATTR='data-relphi-locked-popover-width';
  let syncQueued=false;
  let unlockQueued=false;
  let pageLocked=false;
  let scrollX=0,scrollY=0;
  let bodyRestore=null,htmlRestore=null;
  const observedMenus=new Set();

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
    const width=clamp(window.innerWidth-24,config.min,config.max);
    menu.setAttribute(WIDTH_ATTR,String(width));
    return width;
  }
  function stabilizeMenu(menu,config){
    const width=lockedWidth(menu,config);
    const px=`${width}px`;
    if(menu.style.width!==px)menu.style.width=px;
    if(menu.style.minWidth!==px)menu.style.minWidth=px;
    if(menu.style.maxWidth!==px)menu.style.maxWidth=px;
    menu.style.boxSizing='border-box';
    menu.style.scrollbarGutter='stable';
    menu.style.overscrollBehavior='contain';
    menu.style.touchAction='pan-y';
    menu.style.webkitOverflowScrolling='touch';
  }
  function clearClosedWidthLocks(){
    document.querySelectorAll(`[${WIDTH_ATTR}]`).forEach(menu=>{
      if(menu.classList.contains('is-portaled')&&!menu.hidden)return;
      menu.removeAttribute(WIDTH_ATTR);
      resizeObserver.unobserve(menu);
      observedMenus.delete(menu);
    });
  }

  function lockPage(){
    if(pageLocked||!document.body)return;
    pageLocked=true;
    scrollX=window.scrollX||window.pageXOffset||0;
    scrollY=window.scrollY||window.pageYOffset||0;
    const body=document.body,html=document.documentElement;
    const scrollbar=Math.max(0,window.innerWidth-html.clientWidth);
    const computedPaddingRight=parseFloat(getComputedStyle(body).paddingRight)||0;
    bodyRestore={
      position:body.style.position,top:body.style.top,left:body.style.left,right:body.style.right,
      width:body.style.width,overflow:body.style.overflow,paddingRight:body.style.paddingRight
    };
    htmlRestore={overflow:html.style.overflow,overscrollBehavior:html.style.overscrollBehavior,scrollbarGutter:html.style.scrollbarGutter};

    html.style.overflow='hidden';
    html.style.overscrollBehavior='none';
    html.style.scrollbarGutter='stable';
    body.style.position='fixed';
    body.style.top=`-${scrollY}px`;
    body.style.left=`-${scrollX}px`;
    body.style.right='0';
    body.style.width='auto';
    body.style.overflow='hidden';
    if(scrollbar>0)body.style.paddingRight=`${computedPaddingRight+scrollbar}px`;
    document.documentElement.dataset.skyFilterPopoverPageLocked='true';
  }
  function restoreStyle(node,property,value){
    if(value)node.style[property]=value;
    else node.style.removeProperty(property.replace(/[A-Z]/g,match=>`-${match.toLowerCase()}`));
  }
  function unlockPageNow(){
    unlockQueued=false;
    if(activeMenus().length||!pageLocked||!document.body)return;
    const body=document.body,html=document.documentElement;
    const savedBody=bodyRestore||{},savedHtml=htmlRestore||{};
    ['position','top','left','right','width','overflow','paddingRight'].forEach(property=>restoreStyle(body,property,savedBody[property]||''));
    ['overflow','overscrollBehavior','scrollbarGutter'].forEach(property=>restoreStyle(html,property,savedHtml[property]||''));
    pageLocked=false;
    bodyRestore=null;htmlRestore=null;
    delete document.documentElement.dataset.skyFilterPopoverPageLocked;
    window.scrollTo(scrollX,scrollY);
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

  function sync(){
    syncQueued=false;
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

  function start(){
    new MutationObserver(scheduleSync).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','style']});
    window.addEventListener('wheel',preventBackgroundScroll,{capture:true,passive:false});
    window.addEventListener('touchmove',preventBackgroundScroll,{capture:true,passive:false});
    document.addEventListener('keydown',preventBackgroundKeys,true);
    window.addEventListener('resize',scheduleSync);
    window.visualViewport?.addEventListener('resize',scheduleSync);
    window.addEventListener('pagehide',()=>{if(pageLocked){document.body.style.position=bodyRestore?.position||'';document.body.style.top=bodyRestore?.top||'';document.body.style.left=bodyRestore?.left||'';document.body.style.right=bodyRestore?.right||'';document.body.style.width=bodyRestore?.width||'';document.body.style.overflow=bodyRestore?.overflow||'';document.body.style.paddingRight=bodyRestore?.paddingRight||''}});
    scheduleSync();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
