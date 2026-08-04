// Runtime verification that Sky Chart consumes the approved registry/component without substitutes.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyGlyphAuditV3) return;
  window.__relphiSkyGlyphAuditV1 = true;
  window.__relphiSkyGlyphAuditV2 = true;
  window.__relphiSkyGlyphAuditV3 = true;

  const APPROVED='0d56ee7ec0ea0fc3e44debcb809afde09f3271ab';
  const ANGLES=new Set(['asc','dsc','mc','ic']);
  const ANGLE_TEXT={asc:'Asc',dsc:'Dsc',mc:'MC',ic:'IC'};
  const CENTER={x:600,y:600};
  const MAX_AXIS_SEGMENT=12.01;
  let timer=0;
  let lastSignature='';

  function textOf(node){
    if(!node)return'';
    return node.matches?.('text')?node.textContent:(node.querySelector('text')?.textContent||'');
  }

  function boxesOverlap(a,b,clearance=2){
    return a.left<b.right+clearance&&a.right>b.left-clearance&&a.top<b.bottom+clearance&&a.bottom>b.top-clearance;
  }

  function angleAt(x,y){
    return((Math.atan2(y-CENTER.y,x-CENTER.x)*180/Math.PI)+180+360)%360;
  }

  function angleDifference(a,b){
    return Math.abs(((a-b+180)%360+360)%360-180);
  }

  function lineLength(line){
    return Math.hypot(
      Number(line.getAttribute('x2'))-Number(line.getAttribute('x1')),
      Number(line.getAttribute('y2'))-Number(line.getAttribute('y1'))
    );
  }

  function run(){
    timer=0;
    const issues=[];
    const registry=window.RelphiGlyphRegistry;
    const component=window.RelphiGlyphComponent;
    try{window.RelphiGlyphSourceIntegrity?.assert('runtime-audit');}
    catch(error){issues.push(error.message);}
    if(!registry)issues.push('Approved RelphiGlyphRegistry is missing');
    if(!component)issues.push('Approved RelphiGlyphComponent is missing');
    if(document.documentElement.dataset.relphiGlyphSourceCommit!==APPROVED)issues.push('Approved source commit marker is missing');

    const scripts=Array.from(document.scripts).map(script=>script.getAttribute('src')||'').filter(Boolean);
    if(scripts.filter(src=>src.includes('relphi-glyph-registry-v1.js')).length!==1)issues.push('Registry script count is not one');
    if(scripts.filter(src=>src.includes('relphi-glyph-component-v1.js')).length!==1)issues.push('Component script count is not one');
    scripts.filter(src=>/(canon-binding|atomic-loader|neptune-cross|moon-stroke|glyph-framing|glyph-size-guard|live-integrity|e9344099|unified-marker)/.test(src))
      .forEach(src=>issues.push(`Competing glyph script is loaded: ${src}`));

    document.querySelectorAll('.relphi-canonical-glyph').forEach((art,index)=>{
      const classId=Array.from(art.classList).find(name=>name.startsWith('relphi-glyph-'))?.slice('relphi-glyph-'.length)||'';
      if(!classId||!registry?.get(classId))issues.push(`Rendered glyph ${index+1} does not resolve through the approved registry`);
    });

    if(registry?.get('neptune')?.asset!=='assets/planet-glyphs/neptune.svg')issues.push('Neptune registry source is not the approved asset');
    document.querySelectorAll('.relphi-glyph-neptune').forEach((art,index)=>{
      if(!art.querySelector('path')||art.querySelector('text'))issues.push(`Neptune ${index+1} did not render from the approved SVG asset`);
    });
    if(window.__relphiNeptuneCrossConnectionInstalled)issues.push('Neptune-specific wrapper is active');

    const north=Array.from(document.querySelectorAll('.relphi-glyph-north-node')).map(textOf);
    const south=Array.from(document.querySelectorAll('.relphi-glyph-south-node')).map(textOf);
    if(north.length&&!north.every(value=>value==='☊'))issues.push('North Node differs from the approved registry fallback');
    if(south.length&&!south.every(value=>value==='☋'))issues.push('South Node differs from the approved registry fallback');

    const chart=document.querySelector('.sky-foundation-wheel');
    if(chart){
      if(chart.dataset.angleCollisionState==='unresolved'||chart.querySelector('[data-angle-collision-error]'))issues.push('Comparison wheel reports an unresolved Angle collision');
      const hosts=Array.from(chart.querySelectorAll('[data-layer="placements"] > g[data-angle-axis="true"]'));
      if(hosts.length!==8)issues.push(`Comparison wheel has ${hosts.length} Angle labels instead of 8`);
      const angleBoxes=[];
      hosts.forEach(host=>{
        const id=host.dataset.placement||'';
        const slot=host.dataset.sky||'';
        if(!ANGLES.has(id))issues.push(`Invalid Angle identity: ${id}`);
        const root=host.querySelector(':scope > .relphi-glyph-bubble');
        const art=root?.querySelector('.relphi-canonical-glyph');
        const circle=root?.querySelector(':scope > circle');
        if(!root)issues.push(`Sky ${slot} ${id} is not using the approved master composition`);
        if(!circle||Number(getComputedStyle(circle).opacity)!==0)issues.push(`Sky ${slot} ${id} has a visible or missing canonical circle`);
        if(root?.dataset.circlePresentation!=='hidden-only')issues.push(`Sky ${slot} ${id} is not the approved Without circles presentation`);
        if(textOf(art)!==ANGLE_TEXT[id])issues.push(`Sky ${slot} ${id} does not use the approved label`);
        if(/rotate\s*\(/i.test(art?.getAttribute('transform')||''))issues.push(`Sky ${slot} ${id} is rotated`);
        const longitude=Number(host.dataset.angleLongitude);
        const match=/translate\(([-\d.]+)\s+([-\d.]+)\)/.exec(host.getAttribute('transform')||'');
        if(!match||!Number.isFinite(longitude)||angleDifference(angleAt(Number(match[1]),Number(match[2])),longitude)>.01)issues.push(`Sky ${slot} ${id} moved off its longitude`);
        const lines=Array.from(chart.querySelectorAll(`[data-layer="leaders"] .sky-foundation-angle-axis[data-sky="${slot}"][data-angle="${id}"]`));
        if(lines.length<1||lines.length>2)issues.push(`Sky ${slot} ${id} has ${lines.length} axis segments instead of 1 or 2 short stubs`);
        lines.forEach((line,index)=>{
          if(lineLength(line)>MAX_AXIS_SEGMENT)issues.push(`Sky ${slot} ${id} axis segment ${index+1} is too long`);
        });
        angleBoxes.push({slot,id,box:host.getBoundingClientRect()});
      });
      for(let i=0;i<angleBoxes.length;i+=1)for(let j=i+1;j<angleBoxes.length;j+=1){
        if(boxesOverlap(angleBoxes[i].box,angleBoxes[j].box))issues.push(`Angle labels overlap: Sky ${angleBoxes[i].slot} ${angleBoxes[i].id} and Sky ${angleBoxes[j].slot} ${angleBoxes[j].id}`);
      }
      const obstacles=Array.from(chart.querySelectorAll('[data-layer="placements"] > g[data-placement]:not([data-angle-axis="true"]),[data-layer="zodiac"] > g,.sky-foundation-house-number'));
      angleBoxes.forEach(angle=>obstacles.forEach(node=>{
        if(boxesOverlap(angle.box,node.getBoundingClientRect()))issues.push(`Sky ${angle.slot} ${angle.id} overlaps another wheel object`);
      }));
      chart.querySelectorAll('[data-layer="placements"] > g[data-placement]:not([data-angle-axis="true"])').forEach((host,index)=>{
        if(!host.querySelector(':scope > .relphi-glyph-bubble > circle'))issues.push(`Ordinary placement ${index+1} is missing its approved bubble`);
      });
    }

    const unique=Array.from(new Set(issues));
    const signature=JSON.stringify(unique);
    document.documentElement.dataset.skyGlyphAudit=unique.length?'failed':'passed';
    document.documentElement.dataset.skyGlyphAuditCount=String(unique.length);
    window.__relphiSkyGlyphAuditIssues=unique;
    if(unique.length&&signature!==lastSignature)console.error('Sky Chart approved glyph audit failed:',unique);
    lastSignature=signature;
    window.dispatchEvent(new CustomEvent('relphi:sky-glyph-audit-complete',{detail:{passed:!unique.length,issues:unique.slice()}}));
    return unique;
  }

  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(()=>requestAnimationFrame(()=>requestAnimationFrame(run)),120);
  }

  window.RelphiSkyGlyphAudit=Object.freeze({run,get lastIssues(){return(window.__relphiSkyGlyphAuditIssues||[]).slice();}});
  function start(){
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
    ['relphi:sky-foundation-ready','relphi:selected-relationship-rendered'].forEach(name=>window.addEventListener(name,schedule));
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
