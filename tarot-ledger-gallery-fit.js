/* Relphi Tarot Ledger · bounded responsive search-card layout.
   No Drawing Board selectors or global card presentation changes. */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.RelphiLedgerGalleryFit=api;
})(typeof window!=="undefined"?window:globalThis,function(){
  "use strict";
  const KEY="relphi-tarot-ledger-gallery-v1";
  const DEFAULTS=Object.freeze({mode:"fit",min:112,max:320,entryVisible:true,view:"grid"});
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  function normalize(raw){
    const cfg=raw&&typeof raw==="object"?raw:{};
    const min=clamp(Math.round(Number(cfg.min)||DEFAULTS.min),64,320);
    const max=clamp(Math.round(Number(cfg.max)||DEFAULTS.max),min,480);
    return {mode:cfg.mode==="manual"?"manual":"fit",min,max,entryVisible:cfg.entryVisible!==false,view:cfg.view==="book"?"book":"grid"};
  }
  function load(storage){
    try{
      const source=storage||(typeof localStorage!=="undefined"?localStorage:null);
      return normalize(JSON.parse(source?.getItem(KEY)||"null"));
    }catch(e){return normalize()}
  }
  function save(cfg,storage){
    try{
      const source=storage||(typeof localStorage!=="undefined"?localStorage:null);
      source?.setItem(KEY,JSON.stringify(normalize(cfg)));
    }catch(e){/* private browsing: retain current session */}
  }
  function plan(availableWidth,availableHeight,count,raw){
    const cfg=normalize(raw),width=Math.max(1,Number(availableWidth)||1),
      height=Math.max(1,Number(availableHeight)||1),n=Math.max(0,Math.floor(Number(count)||0)),
      gap=12,ratio=864/500;
    if(n===0)return {columns:1,cardWidth:cfg.max,rows:0,fits:true};
    let best=null;
    for(let columns=1;columns<=n;columns++){
      const rows=Math.ceil(n/columns);
      const widthBound=(width-gap*(columns-1))/columns;
      if(widthBound<=0)break;
      const heightBound=(height-gap*(rows-1))/(rows*ratio);
      const size=Math.min(cfg.max,widthBound,heightBound);
      if(size+0.001<cfg.min)continue;
      const candidate={columns,rows,cardWidth:Math.round(size*10)/10,fits:true};
      // Maximize legible size; at equal size use fewer rows and fewer empty slots.
      if(!best||candidate.cardWidth>best.cardWidth+.1||
        (Math.abs(candidate.cardWidth-best.cardWidth)<=.1&&(candidate.rows<best.rows||
        (candidate.rows===best.rows&&candidate.columns*candidate.rows-n<best.columns*best.rows-n)))){
        best=candidate;
      }
    }
    if(best)return best;
    // If not all cards can fit vertically even at the user's minimum, preserve
    // that minimum and make the results scroll, rather than violating the bound.
    const columns=Math.max(1,Math.min(n,Math.floor((width+gap)/(cfg.min+gap))));
    const widthBound=Math.max(1,(width-gap*(columns-1))/columns);
    const cardWidth=Math.round(Math.min(cfg.max,widthBound)*10)/10;
    return {columns,rows:Math.ceil(n/columns),cardWidth,fits:false};
  }
  function apply(grid,cfg,count,viewportHeight){
    if(!grid)return null;
    grid.style.removeProperty("max-width");
    const width=grid.clientWidth || grid.parentElement?.clientWidth || grid.getBoundingClientRect?.().width || 500;
    const height=clamp((Number(viewportHeight)||650)*0.67,280,820);
    const layout=plan(width,height,count,cfg);
    const px=layout.cardWidth+"px";
    grid.dataset.resultDensity=layout.cardWidth<105?"tiny":layout.cardWidth<150?"compact":"normal";
    grid.dataset.galleryFit=layout.fits?"complete":"scroll";
    grid.style.setProperty("grid-template-columns","repeat("+layout.columns+", minmax(0, "+px+"))","important");
    grid.style.setProperty("justify-content","center","important");
    grid.style.setProperty("justify-items","stretch","important");
    grid.style.setProperty("width","100%","important");
    grid.style.setProperty("--result-card-w",px);
    grid.style.setProperty("--result-card-h",(layout.cardWidth*864/500).toFixed(2)+"px");
    const cards=grid.querySelectorAll(".or-card.tarot-card-surface");
    cards.forEach(el=>{
      el.style.setProperty("width",px,"important");
      el.style.setProperty("min-width","0","important");
      el.style.setProperty("max-width",px,"important");
      el.style.setProperty("height",(layout.cardWidth*864/500).toFixed(2)+"px","important");
      el.style.setProperty("flex-basis",px,"important");
    });
    return layout;
  }
  function reset(grid){
    if(!grid)return;
    for(const property of ["grid-template-columns","justify-content","justify-items","width","max-width"]){
      grid.style.removeProperty(property);
    }
    delete grid.dataset.galleryFit;
  }
  return {KEY,DEFAULTS,normalize,load,save,plan,apply,reset};
});
