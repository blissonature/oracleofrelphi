// Cumulative progressive reveal: glyph -> name -> referent, event-driven only.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyProgressiveRevealContractV3)return;
  window.__relphiSkyProgressiveRevealContractV3=true;
  window.__relphiSkyProgressiveRevealContractV2=true;
  window.__relphiSkyProgressiveRevealContractV1=true;

  const levels={glyph:0,name:1,meaning:2};
  const names=['glyph','name','meaning'];
  const remembered=new Map();
  let queued=false;

  function keyFor(token,index){
    const relation=token.closest('[data-relation-index]')?.dataset?.relationIndex||'current';
    return `${relation}:${token.dataset.progressiveField||token.dataset.progressiveGlyphId||`token-${index}`}`;
  }

  function setStage(token,stage,remember=true){
    const numeric=Math.max(0,Math.min(2,Number(stage)||0));
    const buttons=Array.from(token.querySelectorAll(':scope > .sky-progressive-level'));
    buttons.forEach(button=>{
      const level=levels[button.dataset.progressiveLevel];
      const visible=Number.isInteger(level)&&level<=numeric;
      button.hidden=!visible;
      button.setAttribute('aria-hidden',visible?'false':'true');
      button.setAttribute('aria-expanded',level<numeric?'true':'false');
      button.tabIndex=visible?0:-1;
    });
    token.dataset.progressiveStage=names[numeric];
    token.dataset.progressiveLevel=String(numeric);
    if(remember)remembered.set(keyFor(token,0),numeric);
  }

  function prepareToken(token,index){
    if(!(token instanceof HTMLElement))return;
    const key=keyFor(token,index);
    const current=levels[token.dataset.progressiveStage];
    const stage=remembered.has(key)?remembered.get(key):(Number.isInteger(current)?current:0);
    token.dataset.progressiveRevealContract='cumulative';
    setStage(token,stage,false);

    token.querySelectorAll(':scope > .sky-progressive-level').forEach(button=>{
      const level=button.dataset.progressiveLevel;
      if(level==='glyph')button.setAttribute('title','Reveal the name; click again later to return to the glyph.');
      if(level==='name')button.setAttribute('title','Reveal the referent; click again later to return to the name.');
      if(level==='meaning')button.setAttribute('title','Referent revealed.');
    });
  }

  function prepare(root=document){
    root.querySelectorAll?.('.sky-progressive-token').forEach(prepareToken);
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      prepare(document);
    });
  }

  function handleClick(event){
    const button=event.target.closest('.sky-progressive-level');
    if(!button)return;
    const token=button.closest('.sky-progressive-token');
    if(!token)return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const clicked=levels[button.dataset.progressiveLevel];
    const current=levels[token.dataset.progressiveStage]??0;
    let next=current;

    if(clicked===0)next=current===0?1:0;
    else if(clicked===1)next=current===1?2:1;
    else if(clicked===2)next=2;

    setStage(token,next,true);
    const focusTarget=token.querySelector(`:scope > [data-progressive-level="${names[next]}"]`);
    focusTarget?.focus({preventScroll:true});
  }

  function installStyles(){
    if(document.getElementById('skyProgressiveRevealContractStyles'))return;
    const style=document.createElement('style');
    style.id='skyProgressiveRevealContractStyles';
    style.textContent=`
      .sky-progressive-token[data-progressive-reveal-contract="cumulative"]{
        display:inline-flex;
        flex-wrap:wrap;
        align-items:baseline;
        gap:.18em;
        vertical-align:baseline;
      }
      .sky-progressive-token[data-progressive-reveal-contract="cumulative"] > .sky-progressive-level{
        display:inline-flex;
        align-items:center;
        min-width:0;
      }
      .sky-progressive-token[data-progressive-reveal-contract="cumulative"] > .sky-progressive-level[hidden]{
        display:none !important;
      }
      .sky-progressive-token[data-progressive-reveal-contract="cumulative"] > .sky-progressive-meaning{
        white-space:normal;
      }
      .sky-progressive-token[data-progressive-reveal-contract="cumulative"] > .sky-progressive-level:focus-visible{
        outline:2px solid currentColor;
        outline-offset:2px;
      }
    `;
    document.head.appendChild(style);
  }

  function start(){
    installStyles();
    prepare(document);
    document.addEventListener('click',handleClick,true);
    window.addEventListener('relphi:selected-relationship-rendered',schedule);
    window.addEventListener('relphi:sky-relationship-selected',schedule);
    window.addEventListener('relphi:sky-progressive-symbols-ready',schedule);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
