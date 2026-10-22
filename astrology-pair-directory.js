(function(){
 'use strict';
 const search=document.getElementById('pairSearch'),groups=document.getElementById('pairGroups');
 if(!search||!groups)return;
 const sections=Array.from(groups.querySelectorAll('.pair-group'));
 const no=document.getElementById('pairNoMatches');
 function filter(){
  const terms=search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let shown=0;
  sections.forEach(section=>{
   const links=[...section.querySelectorAll('.pair-link')];
   let count=0;
   links.forEach(link=>{
    const label=link.dataset.pairLabel||'';
    const visible=terms.every(term=>label.includes(term));
    link.hidden=!visible;if(visible)count++;
   });
   section.hidden=count===0;shown+=count;
  });
  if(no)no.hidden=shown>0;
 }
 search.addEventListener('input',filter);
})();
