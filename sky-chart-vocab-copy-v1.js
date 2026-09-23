// Vocab clipboard serializer: semantic Vocab output with canonical glyph conversion.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyVocabCopyV1)return;
window.__relphiSkyVocabCopyV1=true;

function clean(value){return String(value||'').replace(/[\t\f\v ]+/g,' ').replace(/ *\n */g,'\n').trim()}
function slotFor(node){return node?.closest('#skyFoundationA')?'A':node?.closest('#skyFoundationB')?'B':''}
function skyName(slot){
  const panel=document.getElementById(slot==='A'?'skyFoundationA':'skyFoundationB');
  return clean(panel?.querySelector('.sky-foundation-name')?.textContent)||`Sky ${slot}`;
}
function canonicalGlyph(tokenNode,nameVisible){
  const kind=String(tokenNode?.dataset?.vocabKind||''),name=clean(tokenNode?.dataset?.vocabName),fallback=clean(tokenNode?.dataset?.vocabFallbackGlyph),id=clean(tokenNode?.dataset?.vocabGlyphId);
  if(kind==='house')return nameVisible?(fallback||name):name;
  const serializer=window.RelphiGlyphCopySerializer;
  if(serializer&&id){
    const unicode=clean(serializer.unicodeFor?.(id));
    const text=clean(serializer.serializeGlyph?.(id,nameVisible&&unicode?'unicode':undefined));
    if(text)return text;
  }
  return fallback||name;
}
function serializeToken(tokenNode){
  if(!(tokenNode instanceof HTMLElement)||tokenNode.hidden)return'';
  const lead=String(tokenNode.dataset.vocabLead||'');
  const glyph=tokenNode.querySelector('.sky-vocab-glyph'),nameNode=tokenNode.querySelector('.sky-vocab-name'),referentNode=tokenNode.querySelector('.sky-vocab-referent');
  const name=clean(nameNode?.textContent),referent=clean(referentNode?.textContent),parts=[];
  let glyphText='';
  if(glyph)glyphText=canonicalGlyph(tokenNode,!!nameNode);
  if(glyphText)parts.push(glyphText);
  if(referent)parts.push(referent);
  if(name){
    const duplicate=!window.RelphiGlyphCopySerializer?.unicodeFor?.(tokenNode.dataset.vocabGlyphId)&&clean(glyphText).toLowerCase()===name.toLowerCase();
    if(!duplicate)parts.push(`(${name})`);
  }
  return lead+parts.join(' ');
}
function serializeNode(node){
  const clone=node.cloneNode(true);
  clone.querySelectorAll('.sky-vocab-token').forEach(token=>token.replaceWith(document.createTextNode(serializeToken(token))));
  return clean(clone.textContent);
}
function serializePanel(panel){
  if(!(panel instanceof HTMLElement))return'';
  const paragraph=panel.querySelector('[data-sky-vocab-paragraph]');if(!paragraph)return'';
  const slot=String(panel.dataset.skyVocabPanel||slotFor(panel)).toUpperCase(),lines=[`${skyName(slot)} — Vocab`,''];
  [...paragraph.children].forEach(node=>{
    if(node.hidden)return;
    const value=serializeNode(node);if(!value)return;
    if(node.matches('.sky-vocab-structures-heading,.sky-vocab-placements-heading')){
      if(lines[lines.length-1]!=='')lines.push('');
      lines.push(value.toUpperCase(),'');
      return;
    }
    if(node.matches('.sky-vocab-structure-subheading')){
      if(lines[lines.length-1]!=='')lines.push('');
      lines.push(value,'');
      return;
    }
    lines.push(value);
  });
  return lines.join('\n').replace(/\n{3,}/g,'\n\n').trim();
}
async function writeClipboard(text){
  if(!text)return false;
  try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true}}catch(_){}
  const active=document.activeElement,area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');area.setAttribute('aria-hidden','true');Object.assign(area.style,{position:'fixed',left:'-9999px',top:'0',opacity:'0',pointerEvents:'none'});document.body.appendChild(area);
  try{area.focus({preventScroll:true})}catch(_){area.focus()}
  area.select();area.setSelectionRange(0,area.value.length);const ok=document.execCommand('copy')===true;area.remove();
  try{active?.focus?.({preventScroll:true})}catch(_){}
  return ok;
}
let feedbackTimer=0;
function feedback(button,state){
  if(!button)return;clearTimeout(feedbackTimer);
  button.dataset.copyState=state==='done'?'done':'';
  button.textContent=state==='done'?'Copied':state==='failed'?'Copy failed':'Copy';
  if(state!=='idle')feedbackTimer=window.setTimeout(()=>{if(button.isConnected){button.dataset.copyState='';button.textContent='Copy'}},state==='done'?1200:1600);
}
async function copyVocab(button){
  const panel=button?.closest('.sky-where-when-placement-view')?.querySelector('[data-sky-vocab-panel]')||document.querySelector(`[data-sky-vocab-panel="${button?.dataset?.copyVocab||''}"]`);
  const text=serializePanel(panel);if(!text)return;
  try{if(!await writeClipboard(text))throw new Error('Copy command failed');feedback(button,'done')}
  catch(error){console.error('[Sky Chart] Vocab copy failed',error);feedback(button,'failed')}
}
document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-copy-vocab]');if(!button)return;
  event.preventDefault();event.stopPropagation();void copyVocab(button);
});
window.RelphiVocabCopySerializer=Object.freeze({serializeToken,serializePanel});
})();
