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
    '#relphiPdfStage .rpdf-page{box-sizing:border-box;width:816px;height:1056px;background:#fffdf8;padding:40px 48px 54px;overflow:hidden}',
    '#relphiPdfStage .rpdf-masthead{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #ddd4c8}',
    '#relphiPdfStage .rpdf-brand{font:900 13px/1 system-ui,sans-serif;letter-spacing:.03em;color:#2a2420}',
    '#relphiPdfStage .rpdf-brand-rule{height:4px;width:80px;margin-top:7px;background:linear-gradient(90deg,#c9211e 0 48%,#fffdf8 48% 52%,#2462d0 52%)}',
    '#relphiPdfStage .rpdf-page-meta{font:800 10px/1.3 system-ui,sans-serif;color:#766b60;text-align:right}',
    '#relphiPdfStage .rpdf-title{font:900 27px/1.15 system-ui,sans-serif;color:#241e1a;letter-spacing:-.025em;margin:0 0 10px}',
    '#relphiPdfStage .rpdf-identities{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 9px}',
    '#relphiPdfStage .rpdf-identity{padding:9px 11px;border:1px solid #e3dcd3;border-left:4px solid var(--sky-color);border-radius:8px;background:#f7f1e9;color:#453d37;font:650 11px/1.4 system-ui,sans-serif;overflow-wrap:anywhere}',
    '#relphiPdfStage .rpdf-identity b{display:block;margin-bottom:3px;color:var(--sky-color);font:900 10px/1.2 system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase}',
    '#relphiPdfStage .rpdf-focus{font:700 10px/1.45 system-ui,sans-serif;color:#675e56;margin:0 0 15px;padding:8px 11px;border-radius:8px;background:#f4efe8}',
    '#relphiPdfStage .rpdf-list{display:grid;gap:10px}',
    '#relphiPdfStage .rpdf-relationship{box-sizing:border-box;width:100%;border:1px solid #d8d1c8;border-left:5px solid var(--aspect-color,#8b837b);border-radius:10px;background:#fffdfa;overflow:hidden;break-inside:avoid}',
    '#relphiPdfStage .rpdf-number{display:flex;align-items:center;gap:10px;background:#f6efe6;border-bottom:1px solid #e3ddd4;padding:8px 12px;font:850 11px/1.25 system-ui,sans-serif;color:#38302b}',
    '#relphiPdfStage .rpdf-index{display:grid;place-items:center;min-width:22px;height:22px;border:1px solid #d9cfc2;border-radius:50%;background:#fffdf8;font:900 10px/1 system-ui,sans-serif}',
    '#relphiPdfStage .rpdf-aspect-name{margin-left:auto;color:var(--aspect-color,#685e55);font:850 10px/1 system-ui,sans-serif;text-transform:capitalize}',
    '#relphiPdfStage .rpdf-prose{padding:10px 14px 12px;white-space:pre-line;color:#372f29;font:600 11px/1.46 system-ui,sans-serif;overflow-wrap:anywhere}',
    '#relphiPdfStage .rex-visual{padding:12px 16px;grid-template-columns:110px 155px 110px;gap:25px;justify-content:center;border-top:0;border-bottom:1px solid #e5dbce;background:#f9f4eb}',
    '#relphiPdfStage .rex-card img{width:57px}',
    '#relphiPdfStage .rex-card b{max-width:105px;font-size:9px}',
    '#relphiPdfStage .rex-wheel svg{width:105px;height:105px}',
    '#skyFoundationRelationships .rpdf-control{position:relative;display:grid;place-items:center;min-width:30px;align-self:center;justify-self:center;z-index:6}',
    '#skyFoundationRelationships .rpdf-trigger{appearance:none;display:grid;place-items:center;box-sizing:border-box;width:30px;height:30px;min-width:30px;min-height:30px;padding:0;border:1px solid rgba(31,27,24,.2);border-radius:999px;background:#fffdf8;color:#332e2a;font:900 9px/1 system-ui,sans-serif;letter-spacing:-.03em;cursor:pointer}',
    '#skyFoundationRelationships .rpdf-trigger:hover,#skyFoundationRelationships .rpdf-trigger:focus-visible{outline:none;border-color:#2462d0;box-shadow:0 0 0 2px rgba(36,98,208,.12)}',
    '#skyFoundationRelationships .rpdf-trigger[aria-expanded="true"]{border-color:#2462d0;color:#2462d0}',
    '#skyFoundationRelationships .rpdf-menu{position:absolute;z-index:20;top:calc(100% + 6px);right:0;display:grid;gap:3px;box-sizing:border-box;min-width:225px;max-width:min(300px,calc(100vw - 22px));padding:6px;border:1px solid rgba(31,27,24,.16);border-radius:11px;background:#fffdf8;box-shadow:0 7px 22px rgba(31,27,24,.14)}',
    '#skyFoundationRelationships .rpdf-menu[hidden]{display:none}',
    '#skyFoundationRelationships .rpdf-menu button{display:block;width:100%;min-height:36px;margin:0;padding:8px 11px;border:0;border-radius:7px;background:transparent;color:#332e2a;text-align:left;font:750 11px/1.25 system-ui,sans-serif;cursor:pointer}',
    '#skyFoundationRelationships .rpdf-menu button:hover,#skyFoundationRelationships .rpdf-menu button:focus-visible{outline:none;background:#f0ebe4}',
    '#skyFoundationRelationships .rpdf-menu button:disabled{opacity:.6;cursor:wait}',
    '@media(max-width:620px){#skyFoundationRelationships .rpdf-menu{right:0}}'
  ].join('\n');
  document.head.appendChild(s);
}
function pageFor(host,owner,number){
  const p=document.createElement('section');p.className='rpdf-page';
  const masthead=document.createElement('header');masthead.className='rpdf-masthead';
  const brand=document.createElement('div');brand.className='rpdf-brand';brand.textContent='Oracle of Relphi';
  const brandRule=document.createElement('div');brandRule.className='rpdf-brand-rule';brand.appendChild(brandRule);
  const pageMeta=document.createElement('span');pageMeta.className='rpdf-page-meta';pageMeta.textContent='SKY CHART  /  '+String(number).padStart(2,'0');
  masthead.append(brand,pageMeta);
  const title=document.createElement('div');title.className='rpdf-title';title.textContent='Relationships';
  const identities=document.createElement('div');identities.className='rpdf-identities';
  for(const slot of owner.present?.('B')?['A','B']:['A']){
    const item=document.createElement('div');item.className='rpdf-identity';
    item.style.setProperty('--sky-color',slot==='A'?'#c9211e':'#2462d0');
    const label=document.createElement('b');label.textContent='Sky '+slot+' · '+owner.name(slot);
    item.append(label,document.createTextNode(owner.context?.(slot)||'Saved sky'));
    identities.appendChild(item);
  }
  const focus=document.createElement('div');focus.className='rpdf-focus';
  focus.textContent=number===1?'Focus · '+owner.summary():'Relationships · continued';
  const list=document.createElement('div');list.className='rpdf-list';
  p.append(masthead,title,identities,focus,list);host.appendChild(p);
  return{page:p,list};
}
function relationshipCard(item,index,owner){
  const card=document.createElement('article');card.className='rpdf-relationship';
  const aspect=String(item.row?.dataset?.aspect||'').replaceAll('-',' ');
  card.style.setProperty('--aspect-color',getComputedStyle(item.row).getPropertyValue('--relationship-stripe').trim()||
    getComputedStyle(item.row).getPropertyValue('--aspect-color').trim()||'#8b837b');
  const number=document.createElement('div');number.className='rpdf-number';
  const indexPill=document.createElement('span');indexPill.className='rpdf-index';indexPill.textContent=String(index+1);
  const label=document.createElement('strong');label.textContent=item.scope;
  const aspectName=document.createElement('span');aspectName.className='rpdf-aspect-name';aspectName.textContent=aspect;
  number.append(indexPill,label,aspectName);
  const text=document.createElement('div');text.className='rpdf-prose';text.textContent=item.text;
  card.appendChild(number);
  const picture=owner.visual(item.row);
  if(picture)card.appendChild(picture);
  card.appendChild(text);
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
      if(current.list.getBoundingClientRect().bottom-current.page.getBoundingClientRect().top>1002&&current.list.children.length>1){
        card.remove();current=pageFor(host,owner,pages.length+1);pages.push(current);current.list.appendChild(card);
      }
      if(current.list.getBoundingClientRect().bottom-current.page.getBoundingClientRect().top>1002)throw Error('Relationship '+(i+1)+' exceeds one PDF page');
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
  const heading=document.querySelector('#skyFoundationRelationships .sky-foundation-relationships-heading');
  const actions=heading?.querySelector('.sky-relationship-heading-actions');
  if(!actions)return;
  let control=actions.querySelector(':scope>.rpdf-control');
  if(control)return;
  control=document.createElement('div');control.className='rpdf-control';
  const trigger=document.createElement('button');
  trigger.type='button';trigger.className='rpdf-trigger';trigger.id='skyChartPdfMenu';
  trigger.textContent='PDF';trigger.setAttribute('aria-label','PDF download options');
  trigger.setAttribute('aria-haspopup','true');trigger.setAttribute('aria-expanded','false');
  const menu=document.createElement('div');menu.className='rpdf-menu';menu.id='skyChartPdfOptions';menu.hidden=true;
  for(const entry of [
    {id:'skyChartRelationshipsPdf',text:'Relationships PDF',title:'Download the currently selected relationships as a paginated PDF'},
    {id:'skyChartDictionaryPdf',text:'Reference Dictionary PDF',title:'Download the complete chart-independent Reference Dictionary'}
  ]){
    const button=document.createElement('button');button.type='button';button.id=entry.id;
    button.textContent=entry.text;button.title=entry.title;button.setAttribute('aria-label',entry.title);
    menu.appendChild(button);
  }
  trigger.setAttribute('aria-controls',menu.id);
  control.append(trigger,menu);
  actions.appendChild(control);
}
function closeMenu(){
  const trigger=document.getElementById('skyChartPdfMenu');
  const menu=document.getElementById('skyChartPdfOptions');
  if(menu)menu.hidden=true;
  trigger?.setAttribute('aria-expanded','false');
}

async function clicked(event){
  const trigger=event.target.closest?.('#skyChartPdfMenu');
  if(trigger){
    event.preventDefault();
    const menu=document.getElementById('skyChartPdfOptions');
    if(!menu)return;
    menu.hidden=!menu.hidden;
    trigger.setAttribute('aria-expanded',menu.hidden?'false':'true');
    return;
  }
  const b=event.target.closest?.('#skyChartRelationshipsPdf,#skyChartDictionaryPdf');
  if(!b){if(!event.target.closest?.('.rpdf-control'))closeMenu();return}
  event.preventDefault();
  closeMenu();
  if(busy)return;
  busy=true;b.disabled=true;status('Preparing PDF...');
  try{if(b.id==='skyChartDictionaryPdf')await dictionary();else await relationships()}
  catch(e){console.error(e);status('PDF export failed: '+(e?.message||e))}
  finally{busy=false;b.disabled=false}
}

function start(){
  styles();
  buttons();
  // The chart builds its heading asynchronously. Observe its existing parent
  // until the original heading-actions owner has mounted, then disconnect.
  // No duplicate export controls and no ongoing mutation work.
  const mount=document.getElementById('skyFoundationComparison')||document.body;
  const observer=new MutationObserver(()=>{
    buttons();
    if(document.getElementById('skyChartPdfMenu'))observer.disconnect();
  });
  if(!document.getElementById('skyChartPdfMenu'))observer.observe(mount,{childList:true,subtree:true});
  window.addEventListener('relphi:sky-foundation-ready',buttons);
  window.addEventListener('relphi:sky-foundation-interactions-ready',buttons);
  document.addEventListener('click',clicked,true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
window.RelphiRelationshipsPdf=Object.freeze({relationships,dictionary});
})();