// Give renderers one stable maximum candidate window. The visible Harmonic Window
// is a lightweight visibility threshold and must not participate in render signatures.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyHarmonicWindowCeilingV1)return;
  window.__relphiSkyHarmonicWindowCeilingV1=true;
  const input=document.createElement('input');
  input.type='hidden';
  input.value=String(window.RelphiHarmonicOrb?.maxWindow??12);
  input.dataset.filter='orb';
  input.dataset.orbCandidateCeiling='true';
  input.setAttribute('aria-hidden','true');
  document.body.appendChild(input);
})();
