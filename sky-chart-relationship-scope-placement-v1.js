// Keeps Chart Axes separate and places scope controls inside the Relationships box.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  let queued=false;

  function relationshipHeading(){
    return Array.from(document.querySelectorAll('h1,h2,h3,h4,[role="heading"]')).find(function(node){
      return /^relationships$/i.test(String(node.textContent||'').trim());
    })||null;
  }

  function ordinaryRows(){
    return Array.from(document.querySelectorAll('.relationship-list-row')).filter(function(row){
      return !row.closest('#relphiStructuralRelationshipSections');
    });
  }

  function relationshipBox(heading){
    let node=heading;
    while(node&&node!==document.body){
      if(ordinaryRows().some(function(row){return node.contains(row)}))return node;
      node=node.parentElement;
    }
    return heading.parentElement;
  }

  function arrange(){
    queued=false;
    const heading=relationshipHeading();
    const control=document.getElementById('relphiRelationshipScope');
    const structural=document.getElementById('relphiStructuralRelationshipSections');
    if(!heading||!control)return;

    const box=relationshipBox(heading);
    if(!box)return;
    box.classList.add('relphi-relationships-box');

    const headingRow=heading.parentElement&&heading.parentElement!==box?heading.parentElement:heading;
    if(control.parentElement!==box||control.previousElementSibling!==headingRow){
      headingRow.insertAdjacentElement('afterend',control);
    }

    if(structural){
      structural.classList.add('relphi-chart-axes-box');
      if(structural.nextElementSibling!==box&&box.parentElement){
        box.parentElement.insertBefore(structural,box);
      }
    }
  }

  function queue(){if(queued)return;queued=true;requestAnimationFrame(arrange)}
  function start(){
    arrange();
    new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
    document.addEventListener('relphi:skyroleschange',queue);
    window.addEventListener('relphi:sky-builder-v4-loaded',queue);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();