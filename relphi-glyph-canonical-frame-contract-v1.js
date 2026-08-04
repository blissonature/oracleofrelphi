// Preserve the Master Glyph List frame exactly: standard master first, uniform outer scale only.
(function(){
  'use strict';
  if(window.__relphiGlyphCanonicalFrameContractV1)return;
  window.__relphiGlyphCanonicalFrameContractV1=true;

  const original=window.RelphiGlyphComponent;
  if(!original?.createBubble)return;

  const NS='http://www.w3.org/2000/svg';
  const MASTER_RADIUS=Number(original.canonicalBubbleRadius)||19;
  const svg=name=>document.createElementNS(NS,name);

  function requestedRadius(options,fallback){
    const value=Number(options?.radius);
    return Number.isFinite(value)&&value>0?value:fallback;
  }

  function masterWrapper(parent,radius,mode){
    const wrapper=svg('g');
    wrapper.classList.add('relphi-canonical-master-frame');
    wrapper.dataset.canonicalGlyphFrame='master-preserved';
    wrapper.dataset.canonicalGlyphPresentation=mode;
    wrapper.dataset.canonicalMasterRadius=String(MASTER_RADIUS);
    wrapper.dataset.requestedDisplayRadius=String(radius);
    wrapper.setAttribute('transform',`scale(${radius/MASTER_RADIUS})`);
    parent.appendChild(wrapper);
    return wrapper;
  }

  function createMaster(parent,identity,options,showCircle){
    const radius=requestedRadius(options,MASTER_RADIUS);
    const wrapper=masterWrapper(parent,radius,showCircle?'circled':'uncircled');
    const master=original.createBubble(wrapper,identity,{
      radius:MASTER_RADIUS,
      padding:1,
      color:options?.color,
      fill:options?.fill
    });

    // The uncircled version is not refitted. It is the identical master with
    // only its circle hidden, preserving the authored whitespace and position.
    master.circle.style.opacity=showCircle?'1':'0';
    master.circle.style.pointerEvents='none';
    master.circle.setAttribute('aria-hidden','true');

    const ready=Promise.resolve(master.ready).then(art=>{
      wrapper.dataset.canonicalMasterReady='true';
      return art;
    });

    return {wrapper,master,ready};
  }

  async function draw(parent,identity,options){
    const result=createMaster(parent,identity,options,false);
    await result.ready;
    return result.wrapper;
  }

  function createBubble(parent,identity,options){
    const result=createMaster(parent,identity,options,true);
    return {
      root:result.wrapper,
      circle:result.master.circle,
      entry:result.master.entry,
      ready:result.ready
    };
  }

  window.RelphiGlyphComponent=Object.freeze({
    draw,
    createBubble,
    fit:original.fit,
    recolor:original.recolor,
    canonicalBubbleRadius:MASTER_RADIUS,
    canonicalSource:original.canonicalSource,
    canonicalFrameContract:'standard-master-then-uniform-outer-scale'
  });
})();