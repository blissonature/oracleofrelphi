// Canonical SVG glyph component. Imports complete, pre-inscribed Master Glyph List artwork.
// There is no runtime inscription geometry, font substitution, artwork fitting or path editing.
(function(){
  'use strict';
  if(window.RelphiGlyphComponent)return;
  const MASTER_RADIUS=19,VIEWBOX='-32 -32 64 64';
  const parser=new DOMParser(),templates=new Map();
  function entryFor(identity){
    const registry=window.RelphiGlyphRegistry;
    const entry=registry?.get(identity)||registry?.resolve(identity);
    if(!entry)throw new Error('Canonical glyph identity is not approved: '+identity);
    return entry;
  }
  function templateFor(entry){
    if(templates.has(entry.id))return templates.get(entry.id);
    const source=window.RelphiInscribedGlyphMastersV1?.[entry.id];
    if(typeof source!=='string')throw new Error('Approved inscribed SVG is missing: '+entry.id);
    const doc=parser.parseFromString(source,'image/svg+xml');
    if(doc.querySelector('parsererror')||doc.documentElement?.getAttribute('viewBox')!==VIEWBOX)
      throw new Error('Invalid authored glyph artboard: '+entry.id);
    const root=doc.documentElement.querySelector(':scope > g.relphi-glyph-bubble');
    const circle=root?.querySelector(':scope > circle');
    const artwork=root?.querySelector('.relphi-canonical-glyph');
    if(!root||!circle||!artwork||root.querySelectorAll(':scope > circle').length!==1||
      artwork.dataset.canonicalGlyphId!==entry.id)
      throw new Error('Incomplete approved inscribed SVG: '+entry.id);
    const preserved=doc.importNode(root,true);
    templates.set(entry.id,preserved);
    return preserved;
  }
  function createBubble(parent,identity,options={}){
    const entry=entryFor(identity),radius=Number(options.radius??MASTER_RADIUS);
    if(!Number.isFinite(radius)||radius<=0)throw new TypeError('Display radius must be positive and finite.');
    const root=parent.ownerDocument.importNode(templateFor(entry),true);
    const circle=root.querySelector(':scope > circle');
    const artwork=root.querySelector('.relphi-canonical-glyph');
    // Scale the complete authored artboard once, not individual lettering or paths.
    root.setAttribute('transform','scale('+(radius/MASTER_RADIUS)+')');
    root.style.color=options.color||'#dc1f18';
    if(options.fill)circle.setAttribute('fill',options.fill);
    root.dataset.canonicalMasterSource='approved-inscribed-svg';
    root.dataset.canonicalMasterRadius=String(MASTER_RADIUS);
    root.dataset.requestedDisplayRadius=String(radius);
    root.dataset.glyphId=entry.id;
    parent.appendChild(root);
    return{root,circle,entry,ready:Promise.resolve(artwork)};
  }
  function draw(parent,identity,options){
    const composed=createBubble(parent,identity,options);
    composed.circle.style.opacity='0';
    composed.circle.setAttribute('aria-hidden','true');
    return composed.ready;
  }
  function recolor(root,color){root.style.color=color;}
  window.RelphiGlyphComponent=Object.freeze({
    draw,createBubble,recolor,
    canonicalBubbleRadius:MASTER_RADIUS,
    canonicalBubblePresentation:'uniform-master-scale',
    canonicalSource:'approved-inscribed-svg'
  });
})();
