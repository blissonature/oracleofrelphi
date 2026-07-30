(function(){
  'use strict';
  if(window.SkyChartNextGlyphs)return;

  const NS='http://www.w3.org/2000/svg';
  const registry=window.RelphiGlyphRegistry;
  const component=window.RelphiGlyphComponent;
  if(!registry||!component||typeof component.draw!=='function'){
    throw new Error('Canonical glyph system is unavailable.');
  }

  const entries=Object.fromEntries(registry.entries.map(entry=>[entry.id,[entry.name]]));
  const MASTER_RADIUS=19;
  const MASTER_PADDING=1;
  const MASTER_STROKE=2.35;
  const MASTER_FILL='#fffdf8';
  const masterCache=new Map();
  let stagingSvg;

  const svgEl=name=>document.createElementNS(NS,name);

  function resolveEntry(id){
    const entry=registry.get(id)||registry.resolve(id);
    if(!entry)throw new Error('Unknown canonical glyph: '+id);
    return entry;
  }

  function ensureStagingSvg(){
    if(stagingSvg)return stagingSvg;
    stagingSvg=svgEl('svg');
    stagingSvg.setAttribute('viewBox','-32 -32 64 64');
    stagingSvg.setAttribute('width','64');
    stagingSvg.setAttribute('height','64');
    stagingSvg.setAttribute('aria-hidden','true');
    Object.assign(stagingSvg.style,{
      position:'absolute',
      left:'-10000px',
      top:'-10000px',
      width:'64px',
      height:'64px',
      overflow:'visible',
      opacity:'0',
      pointerEvents:'none'
    });
    document.body.appendChild(stagingSvg);
    return stagingSvg;
  }

  function recolorCompleteMaster(root,color){
    [root,...root.querySelectorAll('*')].forEach(node=>{
      if(!node||!node.getAttribute)return;
      const fill=node.getAttribute('fill');
      const stroke=node.getAttribute('stroke');
      const styleFill=node.style&&node.style.fill;
      const styleStroke=node.style&&node.style.stroke;
      if(fill&&fill!=='none')node.setAttribute('fill',color);
      if(stroke&&stroke!=='none')node.setAttribute('stroke',color);
      if(styleFill&&styleFill!=='none')node.style.fill=color;
      if(styleStroke&&styleStroke!=='none')node.style.stroke=color;
    });
  }

  async function buildMaster(id,kind){
    const entry=resolveEntry(id);
    const stage=ensureStagingSvg();
    const master=svgEl('g');
    master.classList.add('scn-canonical-master','scn-canonical-master-'+kind);
    master.dataset.glyphId=entry.id;
    master.dataset.masterKind=kind;
    master.dataset.masterRadius=String(MASTER_RADIUS);
    stage.appendChild(master);

    if(kind==='inscribed'){
      const circle=svgEl('circle');
      circle.classList.add('scn-canonical-inscription');
      circle.setAttribute('cx','0');
      circle.setAttribute('cy','0');
      circle.setAttribute('r',String(MASTER_RADIUS));
      circle.setAttribute('fill',MASTER_FILL);
      circle.setAttribute('stroke','#111111');
      circle.setAttribute('stroke-width',String(MASTER_STROKE));
      master.appendChild(circle);
    }

    const art=await component.draw(master,entry.id,{
      radius:MASTER_RADIUS,
      padding:MASTER_PADDING,
      color:'#111111',
      bubbleStrokeWidth:MASTER_STROKE
    });
    art.classList.add('scn-canonical-master-art');

    const snapshot=master.cloneNode(true);
    master.remove();
    return snapshot;
  }

  function masterFor(id,kind){
    const entry=resolveEntry(id);
    const key=kind+':'+entry.id;
    if(!masterCache.has(key))masterCache.set(key,buildMaster(entry.id,kind));
    return masterCache.get(key);
  }

  async function placeMaster(parent,id,{kind,size=MASTER_RADIUS,color='#171717',fill=MASTER_FILL}={}){
    const entry=resolveEntry(id);
    const source=await masterFor(entry.id,kind);
    const instance=svgEl('g');
    const scale=Number(size)/MASTER_RADIUS;
    instance.classList.add('scn-canonical-master-instance','scn-canonical-'+kind+'-instance');
    instance.dataset.glyphId=entry.id;
    instance.dataset.masterKind=kind;
    instance.setAttribute('transform','scale('+scale.toFixed(6)+')');

    const master=source.cloneNode(true);
    master.querySelectorAll('.scn-canonical-master-art').forEach(art=>recolorCompleteMaster(art,color));
    const circle=master.querySelector('.scn-canonical-inscription');
    if(circle){
      circle.setAttribute('stroke',color);
      circle.setAttribute('fill',fill);
    }
    instance.appendChild(master);
    parent.appendChild(instance);
    return instance;
  }

  function inscribed(parent,id,options={}){
    return placeMaster(parent,id,{...options,kind:'inscribed'});
  }

  function uncircled(parent,id,options={}){
    return placeMaster(parent,id,{...options,kind:'uncircled'});
  }

  window.SkyChartNextGlyphs=Object.freeze({
    inscribed,
    uncircled,
    entries,
    canonicalSource:component.canonicalSource||'glyphs-unified-preview.html'
  });
})();