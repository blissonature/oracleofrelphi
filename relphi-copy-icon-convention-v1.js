// ONE clipboard mark for the entire site. Geometry belongs solely to relphi-icons.svg.
(function(){
  'use strict';
  if(window.__relphiCopyIconConventionV2)return;
  window.__relphiCopyIconConventionV2=true;
  window.__relphiCopyIconConventionV1=true;
  const SVG_NS='http://www.w3.org/2000/svg';
  // External SVG <use> cannot reliably render across origins. Exact-revision
  // Sky Chart previews have a cross-origin asset base, so use the same-origin
  // canonical sprite there; production continues to use the usual relative path.
  const IS_SKY_PREVIEW=/(^|\/)sky-chart-preview\/sky-chart\.html$/.test(location.pathname);
  const SOURCE=IS_SKY_PREVIEW?'/relphi-icons.svg#relphi-copy':'relphi-icons.svg#relphi-copy';
  const KNOWN=[
    '.sky-relationship-copy-button',
    '.sky-wheel-copy-button',
    '.sky-quick-copy-button',
    '.sky-card-hits-copy-all',
    '.sky-configuration-copy-button',
    '.sky-configuration-tile-copy',
    '#relphiCopyBespokeQuestions',
    '.relphi-copy-reading',
    '#copyLink',
    'button[data-relphi-clipboard-action]'
  ].join(',');
  let queued=false;

  function icon(){
    const svg=document.createElementNS(SVG_NS,'svg');
    svg.setAttribute('class','relphi-copy-icon');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('width','20');
    svg.setAttribute('height','20');
    svg.setAttribute('aria-hidden','true');
    svg.setAttribute('focusable','false');
    const use=document.createElementNS(SVG_NS,'use');
    use.setAttribute('href',SOURCE);
    svg.appendChild(use);
    return svg;
  }
  function isCopy(button){
    if(!(button instanceof HTMLButtonElement))return false;
    // Invocation Cards are *containers* with their own one icon inside
    // .copy-icon. Their "Copy this question" tooltip must NOT trigger a second
    // copy SVG on the whole button. Decorating both caused a repeated cycle:
    // parent pass removed child icon, child pass recreated it, ad infinitum.
    if(button.matches('.question-card')&&button.querySelector('.copy-icon'))return false;
    if(button.matches(KNOWN))return true;
    const raw=String(button.textContent||'').trim();
    const a=String(button.getAttribute('aria-label')||'').trim();
    const title=String(button.title||'').trim();
    // Copy and Copy Text/PNG/Link are clipboard actions. NOT 'Create a copy',
    // 'Modify a copy', duplicate, or a label mentioning copying in prose.
    return /^(?:copy(?:\b|$)|copied\b|copying\b|copy failed\b)/i.test(raw)||
      /^copy\b/i.test(a)||/^copy\b/i.test(title);
  }
  function isFeedback(raw){
    if(/^Copied\b/i.test(raw))return'done';
    if(/^Copy failed\b/i.test(raw))return'failed';
    if(/^Copying\b|^Preparing.*copy/i.test(raw))return'copying';
    return'idle';
  }
  function enhance(button){
    if(!isCopy(button))return;
    const raw=String(button.textContent||'').trim(),status=isFeedback(raw);
    const provided=String(button.getAttribute('aria-label')||'').trim();
    if(!button.dataset.relphiCopyIconAction){
      button.dataset.relphiCopyIconAction=/^Copy\b/i.test(provided)?provided:
        /^Copy\b/i.test(button.title)?button.title:/^Copy\b/i.test(raw)?raw:'Copy';
    }else if(status==='idle'&&/^Copy\b/i.test(provided)&&provided!==button.dataset.relphiCopyIconAction){
      button.dataset.relphiCopyIconAction=provided;
    }
    const format=raw.match(/^Copy\s+(Text|PNG|SVG|JSON|CSV|HTML|Image)$/i);
    if(format)button.dataset.relphiCopyFormat=format[1];else if(!button.dataset.relphiCopyFormat)delete button.dataset.relphiCopyFormat;
    button.classList.add('relphi-copy-icon-button');
    if(button.dataset.relphiCopyFeedback!==status)button.dataset.relphiCopyFeedback=status;
    const label=status==='done'?raw||'Copied':status==='failed'?'Copy failed':
      status==='copying'?'Copying':button.dataset.relphiCopyIconAction;
    if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);
    if(button.title!==label)button.title=label;
    // The owner may append its own icon after our pass, or replace textContent
    // during feedback. Keep exactly ONE SVG, always referencing the master glyph.
    // Do not rely on :first-of-type: when the owner SVG comes first that selector
    // would delete our canonical one, causing an icon replacement loop.
    const valid=[...button.querySelectorAll('svg.relphi-copy-icon')].filter(node=>
      node.parentElement===button&&
      node.querySelectorAll('use').length===1&&
      node.querySelector('use')?.getAttribute('href')===SOURCE
    );
    const keep=valid[0]||icon();
    for(const node of [...button.querySelectorAll('svg')]){
      if(node!==keep)node.remove();
    }
    if(keep.parentElement!==button)button.appendChild(keep);
  }
  function enhanceQuestionCard(card){
    const mount=card.querySelector('.copy-icon');
    if(!mount)return;
    const standard=mount.querySelector(':scope > svg.relphi-copy-icon > use');
    if(standard?.getAttribute('href')===SOURCE)return;
    mount.replaceChildren(icon());
  }
  function hydrate(){
    queued=false;
    document.querySelectorAll('button').forEach(enhance);
    document.querySelectorAll('.question-card .copy-icon').forEach(node=>enhanceQuestionCard(node.closest('.question-card')));
  }
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(hydrate);
  }
  function start(){
    hydrate();
    new MutationObserver(records=>{
      for(const record of records){
        const target=record.target;
        if(target.nodeType===3){
          if(target.parentElement?.closest?.('button,.question-card .copy-icon')){schedule();return}
          continue;
        }
        if(target.closest?.('button,.question-card .copy-icon')){schedule();return}
        if(record.type==='childList'&&[...record.addedNodes].some(node=>
          node.nodeType===1&&(node.matches?.('button,.question-card .copy-icon')||
            !!node.querySelector?.('button,.question-card .copy-icon')))){
          schedule();return;
        }
      }
    }).observe(document.body,{childList:true,characterData:true,subtree:true});
    ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:drawing-board-rendered'].forEach(event=>window.addEventListener(event,schedule));
  }
  window.RelphiCopyIcon=Object.freeze({hydrate:schedule,source:SOURCE});
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
