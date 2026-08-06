// Relationship-list owner: canonical production glyphs, aspect stripe, and dedicated orb.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyRelationshipListLayoutV5) return;
  window.__relphiSkyRelationshipListLayoutV5 = true;

  const NS='http://www.w3.org/2000/svg';
  const STYLE_ID='skyRelationshipListLayoutV5';
  const SKY={A:'#c9211e',B:'#2462d0'};
  const ASPECT_COLORS=Object.freeze({conjunction:'#e53935','semi-sextile':'#7c9b49',octile:'#b86d43',sextile:'#d3b727',quintile:'#8b6cc2',square:'#d6534d',trine:'#4e9e69','tri-octile':'#9f5944','bi-quintile':'#7655aa',quincunx:'#4b8e88',opposition:'#5961c8'});

  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
      .sky-foundation-relationship-row{--relationship-stripe:var(--aspect-color,#777);position:relative;grid-template-columns:30px minmax(0,1fr) 32px 30px minmax(0,1fr) auto;grid-template-areas:"left-glyph left-copy aspect right-glyph right-copy orb";column-gap:6px;row-gap:4px;padding:8px 9px 8px 12px;overflow:hidden}
      .sky-foundation-relationship-row::before{content:"";position:absolute;inset:0 auto 0 0;width:5px;background:var(--relationship-stripe)}
      .sky-relationship-canonical-glyph{display:block;width:30px!important;height:30px!important;max-width:30px!important;max-height:30px!important;overflow:visible;align-self:center}
      .sky-relationship-canonical-glyph[data-role="left"]{grid-area:left-glyph}.sky-relationship-canonical-glyph[data-role="aspect"]{grid-area:aspect;justify-self:center}.sky-relationship-canonical-glyph[data-role="right"]{grid-area:right-glyph}
      .sky-foundation-relationship-row>.sky-foundation-relationship-copy:nth-of-type(1){grid-area:left-copy}.sky-foundation-relationship-row>.sky-foundation-relationship-copy:nth-of-type(2){grid-area:right-copy}
      .sky-foundation-relationship-orb{grid-area:orb;align-self:center;justify-self:end;min-width:48px;padding:5px 7px;border:1px solid color-mix(in srgb,var(--relationship-stripe) 42%,transparent);border-radius:999px;background:color-mix(in srgb,var(--relationship-stripe) 9%,#fffdfa);color:#403a35;text-align:center;white-space:nowrap;font:800 .6rem/1 system-ui,sans-serif;font-variant-numeric:tabular-nums}
      .sky-foundation-relationship-copy{white-space:normal;line-height:1.15}.sky-foundation-relationship-copy small{white-space:normal}
      @media(max-width:620px){.sky-foundation-relationship-row{grid-template-columns:30px minmax(0,1fr) 34px minmax(0,1fr) 30px;grid-template-areas:"left-glyph left-copy aspect right-copy right-glyph" ". orb orb orb .";padding:9px 10px 8px 13px}.sky-foundation-relationship-orb{justify-self:center;min-width:74px;margin-top:2px}.sky-foundation-relationship-row>.sky-foundation-relationship-copy:nth-of-type(2){text-align:right}.sky-relationship-canonical-glyph[data-role="right"]{justify-self:end}}
    `;document.head.appendChild(style);
  }
  function host(role,label){const node=document.createElementNS(NS,'svg');node.classList.add('sky-relationship-canonical-glyph');node.dataset.role=role;node.setAttribute('viewBox','-16 -16 32 32');node.setAttribute('aria-label',label);return node}
  function render(node,id,color,circled){const registry=window.RelphiGlyphRegistry,component=window.RelphiGlyphComponent,entry=registry&&(registry.get(id)||registry.resolve(id));if(!entry||!component?.createBubble){node.remove();console.error('Canonical relationship glyph unavailable:',id);return}const master=component.createBubble(node,entry.id,{radius:12.5,padding:1,color,fill:'#fffdfa',strokeWidth:1.65});master.root.dataset.relationshipCanonical='production-master';master.circle.style.opacity=circled?'1':'0';master.circle.setAttribute('aria-hidden','true');Promise.resolve(master.ready).catch(error=>{node.remove();console.error(error)})}
  function replaceGlyphs(row,color){if(row.dataset.relationshipCanonicalGlyphs==='v5')return;const generic=Array.from(row.querySelectorAll(':scope > svg'));if(generic.length<3)return;const leftId=row.dataset.leftPlacement,aspectId=row.dataset.aspect,rightId=row.dataset.rightPlacement;if(!leftId||!aspectId||!rightId)return;const left=host('left',leftId),aspect=host('aspect',aspectId),right=host('right',rightId);generic[0].replaceWith(left);generic[1].replaceWith(aspect);generic[2].replaceWith(right);render(left,leftId,SKY.A,true);render(aspect,aspectId,color,false);render(right,rightId,SKY.B,true);row.dataset.relationshipCanonicalGlyphs='v5'}
  function compose(row){if(!(row instanceof HTMLElement))return;const aspect=String(row.dataset.aspect||'').toLowerCase(),color=ASPECT_COLORS[aspect]||'#777';row.style.setProperty('--relationship-stripe',color);replaceGlyphs(row,color);if(row.dataset.relationshipLayout==='v5')return;const copies=row.querySelectorAll('.sky-foundation-relationship-copy'),rightSmall=copies[1]?.querySelector('small'),orb=Number(row.dataset.sourceOrb);if(!rightSmall||!Number.isFinite(orb))return;rightSmall.textContent=rightSmall.textContent.replace(/\s*·\s*Orb\s+[\d.]+°?\s*$/i,'').trim();row.querySelector(':scope > .sky-foundation-relationship-orb')?.remove();const badge=document.createElement('span');badge.className='sky-foundation-relationship-orb';badge.textContent=`Orb ${orb.toFixed(2)}°`;badge.setAttribute('aria-label',`Orb ${orb.toFixed(2)} degrees`);row.appendChild(badge);row.dataset.relationshipLayout='v5'}
  function refresh(root){(root||document).querySelectorAll?.('.sky-foundation-relationship-row').forEach(compose)}
  function start(){installStyle();refresh(document);new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType!==1)return;if(node.matches?.('.sky-foundation-relationship-row'))compose(node);refresh(node)}))).observe(document.documentElement,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
