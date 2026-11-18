// Paginated Relationships PDF and chart-independent Reference Dictionary PDF.
// Uses existing semantic and visual owners, without duplicating interpretation data.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiRelationshipsPdfV1)return;
window.__relphiRelationshipsPdfV1=true;
const PDF_SRC='https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';
const WIDTH=816,HEIGHT=1056;
let promise=null,busy=false;
const visual=()=>window.RelphiRelationshipExportVisual;
const copy=()=>window.RelphiRelationshipCopySerializer;
const status=message=>{const n=document.getElementById('skyChartExportStatus');if(n)n.textContent=message};
const readable=text=>String(text??'').replace(/[\u2018\u2019]/g,"'").replace(/[\u2013\u2014]/g,'-').replace(/[\u00a0]/g,' ').replace(/[^\x20-\x7e\u00b0]/g,' ');
function pdfLibrary(){
  if(window.jspdf?.jsPDF)return Promise.resolve(window.jspdf.jsPDF);
  if(promise)return promise;
  promise=new Promise((resolve,reject)=>{
    let s=document.querySelector('script[data-relphi-pdf-library]');
    if(!s){s=document.createElement('script');s.src=PDF_SRC;s.async=true;s.dataset.relphiPdfLibrary='true';document.head.appendChild(s)}
    s.addEventListener('load',()=>window.jspdf?.jsPDF?resolve(window.jspdf.jsPDF):reject(Error('PDF library unavailable')),{once:true});
    s.addEventListener('error',()=>reject(Error('PDF library could not load')),{once:true});
  }).catch(e=>{promise=null;throw e});
  return promise;
}
function styles(){
  if(document.getElementById('relphiPdfStyle'))return;
  const s=document.createElement('style');s.id='relphiPdfStyle';
  s.textContent=[
    '#relphiPdfStage{position:fixed;left:-100000px;top:0;width:816px;z-index:-1;color:#29231e;font-family:Arial,system-ui,sans-serif;text-align:left}',
    '#relphiPdfStage .rpdf-page{box-sizing:border-box;width:816px;height:1056px;background:#fffdf8;padding:42px 48px 54px;overflow:hidden}',
    '#relphiPdfStage .rpdf-title{font-size:23px;font-weight:800;line-height:1.2;margin:0 0 6px}',
    '#relphiPdfStage .rpdf-identities{font-size:11px;line-height:1.45;color:#544b44;margin:0 0 6px}',
    '#relphiPdfStage .rpdf-focus{font-size:10px;line-height:1.35;color:#675e56;margin:0 0 14px}',
    '#relphiPdfStage .rpdf-list{display:grid;gap:12px}',
    '#relphiPdfStage .rpdf-relationship{box-sizing:border-box;width:100%;border:1px solid #d8d1c8;border-radius:9px;background:#fff;overflow:hidden;break-inside:avoid}',
    '#relphiPdfStage .rpdf-number{background:#f2ede6;border-bottom:1px solid #e3ddd4;padding:7px 12px;font-size:12px;font-weight:800}',
    '#relphiPdfStage .rpdf-prose{padding:10px 13px;white-space:pre-line;font-size:13px;line-height:1.47;overflow-wrap:anywhere}',
    '#relphiPdfStage .rex-visual{padding:7px 14px 9px;grid-template-columns:110px minmax(132px,1fr) 110px;gap:14px}',
    '#relphiPdfStage .rex-card img{width:63px}',
    '#relphiPdfStage .rex-card b{max-width:105px;font-size:9px}',
    '#relphiPdfStage .rex-wheel svg{width:106px;height:106px}',
    '#skyFoundationRelationships>.rpdf-toolbar{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:8px;padding:6px 12px 10px;border-bottom:1px solid rgba(31,27,24,.1)}',
    '#skyFoundationRelationships>.rpdf-toolbar .rpdf-toolbar-label{color:#655d56;font:750 11px/1.3 system-ui,sans-serif;margin-right:auto}',
    '#skyFoundationRelationships>.rpdf-toolbar button{font:750 11px/1.25 system-ui,sans-serif;padding:7px 10px;min-height:30px;border:1px solid #b5aba0;border-radius:7px;background:#fffdf8;color:#332d28;cursor:pointer}',
    '#skyFoundationRelationships>.rpdf-toolbar button:hover,#skyFoundationRelationships>.rpdf-toolbar button:focus-visible{background:#f0ebe4;border-color:#70655b}',
    '@media(max-width:620px){#skyFoundationRelationships>.rpdf-toolbar{justify-content:flex-start;gap:6px}#skyFoundationRelationships>.rpdf-toolbar .rpdf-toolbar-label{flex:0 0 100%}}'
  ].join('\n');
  document.head.appendChild(s);
}
function pageFor(host,owner,number){
  const p=document.createElement('section');p.className='rpdf-page';
  const title=document.createElement('div');title.className='rpdf-title';title.textContent='Relationships';
  const identities=document.createElement('div');identities.className='rpdf-identities';
  const identity=slot=>'Sky '+slot+': '+owner.name(slot)+(owner.context?.(slot)?' - '+owner.context(slot):'');
  identities.textContent=identity('A')+(owner.present?.('B')?'  |  '+identity('B'):'');
  const focus=document.createElement('div');focus.className='rpdf-focus';
  focus.textContent=number===1?'Focus: '+owner.summary():'Oracle of Relphi  |  Relationships continued';
  const list=document.createElement('div');list.className='rpdf-list';
  p.append(title,identities,focus,list);host.appendChild(p);
  return{page:p,list};
}
function relationshipCard(item,index,owner){
  const card=document.createElement('article');card.className='rpdf-relationship';
  const number=document.createElement('div');number.className='rpdf-number';
  number.textContent=(index+1)+'. '+item.scope;
  const text=document.createElement('div');text.className='rpdf-prose';text.textContent=item.text;
  card.append(number,text);
  const picture=owner.visual(item.row);
  if(picture)card.appendChild(picture);
  return card;
}
function fileName(kind){
  if(kind==='dictionary')return'oracle-of-relphi-reference-dictionary.pdf';
  const owner=visual(),raw=(owner?.name?.('A')||'sky-chart')+(owner?.present?.('B')?'-'+owner.name('B'):'');
  const slug=raw.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,68);
  return(slug||'sky-chart')+'-relationships.pdf';
}
async function relationships(){
  const owner=visual(),serializer=copy();
  if(!owner?.visibleRows||!owner?.visual||!serializer?.collect)throw Error('Relationship exports are not ready');
  const model=serializer.collect(owner.visibleRows());
  if(!model.items.length)throw Error('No relationships match the current filters.');
  const jsPDF=await pdfLibrary(),image=await owner.ensureImages();
  if(typeof image.toPng!=='function')throw Error('The image renderer is unavailable.');
  styles();
  const host=document.createElement('div');host.id='relphiPdfStage';document.body.appendChild(host);
  try{
    const pages=[];let current=pageFor(host,owner,1);pages.push(current);
    for(let i=0;i<model.items.length;i++){
      const card=relationshipCard(model.items[i],i,owner);current.list.appendChild(card);
      // Measure the browser's actual card height before breaking pages.
      if(current.list.getBoundingClientRect().bottom>1002&&current.list.children.length>1){
        card.remove();current=pageFor(host,owner,pages.length+1);pages.push(current);current.list.appendChild(card);
      }
      if(current.list.getBoundingClientRect().bottom>1002)throw Error('Relationship '+(i+1)+' exceeds one PDF page');
    }
    const pdf=new jsPDF({orientation:'portrait',unit:'pt',format:'letter',compress:true});
    for(let i=0;i<pages.length;i++){
      await owner.waitImgs(pages[i].page);
      if(i)pdf.addPage('letter','portrait');
      status('Rendering Relationships PDF page '+(i+1)+' of '+pages.length+'...');
      const png=await image.toPng(pages[i].page,{pixelRatio:1.65,backgroundColor:'#fffdf8',width:WIDTH,height:HEIGHT,canvasWidth:Math.ceil(WIDTH*1.65),canvasHeight:Math.ceil(HEIGHT*1.65),skipAutoScale:true});
      pdf.addImage(png,'PNG',0,0,612,792,undefined,'FAST');
      pdf.setTextColor(100,93,84);pdf.setFontSize(9);
      pdf.text((i+1)+' / '+pages.length,560,777,{align:'right'});
    }
    pdf.save(fileName('relationships'));
    status('Relationships PDF ready - '+model.items.length+' relationships across '+pages.length+' pages.');
    return{pages:pages.length,items:model.items.length};
  }finally{host.remove()}
}
async function dictionary(){
  if(!copy()?.fullDictionary)throw Error('Reference Dictionary is not ready');
  const jsPDF=await pdfLibrary(),groups=copy().fullDictionary();
  const pdf=new jsPDF({orientation:'portrait',unit:'pt',format:'letter',compress:true});
  let page=0,y=0;
  function newPage(){
    if(page)pdf.addPage('letter','portrait');page++;
    pdf.setTextColor(40,35,30);pdf.setFont('helvetica','bold');pdf.setFontSize(21);
    pdf.text('Oracle of Relphi',48,56);
    pdf.setFont('helvetica','normal');pdf.setFontSize(11);pdf.setTextColor(95,86,76);
    pdf.text('Reference Dictionary',48,77);
    pdf.setDrawColor(207,199,188);pdf.line(48,89,564,89);
    y=116;
  }
  function ensure(h){if(y+h>735)newPage()}
  newPage();
  for(let g=0;g<groups.length;g++){
    const group=groups[g];
    if(g>0)newPage();
    pdf.setTextColor(30,28,26);pdf.setFont('helvetica','bold');pdf.setFontSize(17);
    const heading=pdf.splitTextToSize(readable(group.category),515);
    pdf.text(heading,48,y);y+=22*heading.length+8;
    for(const section of group.sections){
      ensure(44);pdf.setFont('helvetica','bold');pdf.setFontSize(12);pdf.setTextColor(96,76,59);
      pdf.text(readable(section.title),48,y);y+=20;
      for(const entry of section.entries){
        pdf.setFont('helvetica','normal');pdf.setFontSize(11);
        const lines=pdf.splitTextToSize(readable(entry.label)+'  -  '+readable(entry.text),506);
        ensure(lines.length*15+8);
        pdf.setTextColor(39,35,30);pdf.text(lines,54,y);y+=lines.length*15+8;
      }
      y+=9;
    }
  }
  const total=pdf.internal.getNumberOfPages();
  for(let i=1;i<=total;i++){
    pdf.setPage(i);pdf.setFont('helvetica','normal');pdf.setFontSize(9);pdf.setTextColor(112,104,94);
    pdf.text('Definitions are independent of any loaded chart.',48,758);
    pdf.text(i+' / '+total,562,758,{align:'right'});
  }
  pdf.save(fileName('dictionary'));
  status('Standalone Reference Dictionary ready - '+groups.length+' sections and '+total+' pages.');
  return{groups:groups.length,pages:total,entries:groups.flatMap(g=>g.sections.flatMap(s=>s.entries)).length};
}
function buttons(){
  const root=document.getElementById('skyFoundationRelationships');
  const heading=root?.querySelector('.sky-foundation-relationships-heading');
  if(!root||!heading)return;
  let bar=root.querySelector(':scope>.rpdf-toolbar');
  if(!bar){
    bar=document.createElement('div');bar.className='rpdf-toolbar';
    const label=document.createElement('span');label.textContent='PDF exports';label.className='rpdf-toolbar-label';
    bar.appendChild(label);
  }
  for(const entry of [
    {id:'skyChartRelationshipsPdf',text:'Relationships PDF',title:'Download the currently selected relationships as a paginated PDF'},
    {id:'skyChartDictionaryPdf',text:'Reference Dictionary PDF',title:'Download the complete chart-independent Reference Dictionary PDF'}
  ]){
    let button=bar.querySelector('#'+entry.id);
    if(button)continue;
    button=document.createElement('button');button.type='button';button.id=entry.id;
    button.textContent=entry.text;button.title=entry.title;button.setAttribute('aria-label',entry.title);
    bar.appendChild(button);
  }
  if(bar.previousElementSibling!==heading)heading.insertAdjacentElement('afterend',bar);
}
async function clicked(event){
  const b=event.target.closest?.('#skyChartRelationshipsPdf,#skyChartDictionaryPdf');
  if(!b||busy)return;
  event.preventDefault();busy=true;b.disabled=true;status('Preparing PDF...');
  try{if(b.id==='skyChartDictionaryPdf')await dictionary();else await relationships()}
  catch(e){console.error(e);status('PDF export failed: '+(e?.message||e))}
  finally{busy=false;b.disabled=false}
}
function start(){
  buttons();
  const root=document.getElementById('skyFoundationRelationships');
  if(root){
    const observer=new MutationObserver(()=>{if(!root.querySelector(':scope>.rpdf-toolbar'))buttons()});
    observer.observe(root,{childList:true});
  }
  window.addEventListener('relphi:sky-foundation-ready',buttons);
  document.addEventListener('click',clicked,true);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
window.RelphiRelationshipsPdf=Object.freeze({relationships,dictionary});
})();