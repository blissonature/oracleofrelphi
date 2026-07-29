(function(){
  'use strict';
  if(window.SkyChartNextGlyphs)return;

  const registry=window.RelphiGlyphRegistry;
  const component=window.RelphiGlyphComponent;
  if(!registry||!component||typeof component.draw!=='function'||typeof component.createBubble!=='function'){
    throw new Error('Canonical glyph system is unavailable.');
  }

  const entries=Object.fromEntries(registry.entries.map(entry=>[entry.id,[entry.name]]));
  const REFERENCE_RADIUS=19;
  const REFERENCE_PADDING=1;
  const REFERENCE_STROKE=2.35;

  async function draw(parent,id,{radius=18,color='#171717'}={}){
    const entry=registry.get(id)||registry.resolve(id);
    if(!entry)throw new Error('Unknown canonical glyph: '+id);
    return component.draw(parent,entry.id,{radius,padding:1,color,bubbleStrokeWidth:0});
  }

  async function bubble(parent,id,{radius=REFERENCE_RADIUS,color='#c9211e',fill='#fffdf8'}={}){
    const entry=registry.get(id)||registry.resolve(id);
    if(!entry)throw new Error('Unknown canonical glyph: '+id);

    const scale=Number(radius)/REFERENCE_RADIUS;
    const unit=document.createElementNS('http://www.w3.org/2000/svg','g');
    unit.classList.add('scn-canonical-inscribed-unit');
    unit.dataset.canonicalBubble=entry.id;
    unit.dataset.masterRadius=String(REFERENCE_RADIUS);
    unit.setAttribute('transform','scale('+scale.toFixed(6)+')');
    parent.appendChild(unit);

    const rendered=component.createBubble(unit,entry.id,{
      radius:REFERENCE_RADIUS,
      padding:REFERENCE_PADDING,
      color,
      fill,
      strokeWidth:REFERENCE_STROKE
    });
    await rendered.ready;
    unit.dataset.ready='true';
    return unit;
  }

  window.SkyChartNextGlyphs=Object.freeze({draw,bubble,entries});
})();