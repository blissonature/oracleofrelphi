// Presentation guard for near-zero collective harmonic labels.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiCollectiveLabelPolishV1)return;
  window.__relphiCollectiveLabelPolishV1=true;

  function numericPercent(text){
    const match=String(text||'').match(/[-+]?\d+(?:\.\d+)?/);
    return match?Number(match[0]):NaN;
  }

  function polishComparison(){
    document.querySelectorAll('.sky-collective-comparison-row').forEach(row=>{
      const score=row.querySelector('.sky-collective-comparison-score');
      const status=row.querySelector('.sky-collective-comparison-line > span:nth-child(2) > strong');
      if(!score||!status)return;
      const shown=numericPercent(score.textContent);
      if(!Number.isFinite(shown)||shown!==0)return;
      const sub=row.querySelector('.sky-collective-comparison-sub')?.textContent||'';
      const hits=Number((sub.match(/(\d+)\s+primitive cross-hit/)||[])[1]||0);
      if(/Resistance leads|Distinctive/i.test(status.textContent||'')){
        status.textContent=hits>0?`Balanced despite ${hits} primitive hit${hits===1?'':'s'}`:'Balanced field';
      }
    });
  }

  function polish(){polishComparison()}
  window.addEventListener('relphi:sky-collective-comparison-rendered',()=>requestAnimationFrame(polish));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(polish),{once:true});
  else requestAnimationFrame(polish);
})();
