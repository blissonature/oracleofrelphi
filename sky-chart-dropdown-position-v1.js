// Canonical Sky Chart dropdown geometry. No consumer positions a menu independently.
(function(){
'use strict';
if(window.RelphiSkyDropdownPosition)return;
function position(menu,anchor,targetWidth=330){
  if(!menu||!anchor||menu.hidden)return;
  const rect=anchor.getBoundingClientRect(),margin=12,gap=6;
  const width=Math.min(targetWidth,Math.max(0,window.innerWidth-margin*2));
  menu.style.height='auto';menu.style.maxHeight='none';menu.style.overflowY='hidden';
  const computed=getComputedStyle(menu);
  const borders=(parseFloat(computed.borderTopWidth)||0)+(parseFloat(computed.borderBottomWidth)||0);
  const natural=Math.ceil(menu.scrollHeight+borders);
  const below=Math.max(0,window.innerHeight-margin-rect.bottom-gap);
  const above=Math.max(0,rect.top-gap-margin);
  const useBelow=below>=natural||(below>=above&&above<natural);
  const available=useBelow?below:above;
  const height=Math.max(0,Math.min(natural,available));
  const top=useBelow?rect.bottom+gap:rect.top-gap-height;
  const left=Math.min(window.innerWidth-width-margin,Math.max(margin,rect.left+rect.width/2-width/2));
  Object.assign(menu.style,{position:'fixed',width:width+'px',height:height+'px',maxHeight:height+'px',overflowY:natural>height?'auto':'hidden',left:left+'px',top:top+'px',bottom:'auto'});
  menu.dataset.openDirection=useBelow?'below':'above';
}
window.RelphiSkyDropdownPosition=position;
})();
