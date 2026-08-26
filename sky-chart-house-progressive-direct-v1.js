// House progressive disclosure compatibility v2.
// House interactions are owned by the general progressive controller so the chain is:
// numeric house marker -> full ordinal House name -> referent.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiHouseProgressiveDirectV2)return;
window.__relphiHouseProgressiveDirectV1=true;
window.__relphiHouseProgressiveDirectV2=true;
})();