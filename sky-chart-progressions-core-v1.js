// Pure timing and relationship helpers for Sky Chart calendar-time Progressions.
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.RelphiSkyProgressionsCore=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const DAY=86400000;
  const TROPICAL_YEAR_DAYS=365.2422;
  const YEAR=DAY*TROPICAL_YEAR_DAYS;
  const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ASPECTS=[
    {id:'conjunction',name:'Conjunction',angle:0,color:'#e53935'},
    {id:'semi-sextile',name:'Semi-Sextile',angle:30,color:'#7c9b49'},
    {id:'octile',name:'Octile',angle:45,color:'#b86d43'},
    {id:'sextile',name:'Sextile',angle:60,color:'#d3b727'},
    {id:'quintile',name:'Quintile',angle:72,color:'#8b6cc2'},
    {id:'square',name:'Square',angle:90,color:'#d6534d'},
    {id:'trine',name:'Trine',angle:120,color:'#4e9e69'},
    {id:'tri-octile',name:'Tri-Octile',angle:135,color:'#9f5944'},
    {id:'bi-quintile',name:'Bi-Quintile',angle:144,color:'#7655aa'},
    {id:'quincunx',name:'Quincunx',angle:150,color:'#4b8e88'},
    {id:'opposition',name:'Opposition',angle:180,color:'#5961c8'}
  ];
  const norm=value=>((Number(value)%360)+360)%360;
  const wrap=value=>((Number(value)+540)%360)-180;
  const separation=(a,b)=>Math.abs(wrap(norm(a)-norm(b)));
  const aspectError=(a,b,angle)=>Math.abs(separation(a,b)-Number(angle));
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

  // Compatibility names retained because the first Progressions controller shipped with
  // secondary-progression terminology. The interaction model is now literal calendar time:
  // a target date is the ephemeris date that is drawn.
  function secondaryProgressedMs(epochMs,targetMs){
    const target=Number(targetMs);
    return Number.isFinite(target)?target:NaN;
  }
  function targetMsFromProgressedMs(epochMs,progressedMs){
    const value=Number(progressedMs);
    return Number.isFinite(value)?value:NaN;
  }
  function calendarSkyMs(targetMs){
    const value=Number(targetMs);
    return Number.isFinite(value)?value:NaN;
  }

  function signState(longitude,speed,corridor=1){
    const value=norm(longitude),index=Math.floor(value/30),degree=value-index*30,window=Math.max(0.01,Math.min(15,Number(corridor)||1)),retrograde=Number(speed)<0;
    let kind=null,progress=null;
    if(!retrograde&&degree<window){kind='ingress';progress=degree/window}
    else if(!retrograde&&degree>=30-window){kind='egress';progress=(degree-(30-window))/window}
    else if(retrograde&&degree>=30-window){kind='ingress';progress=(30-degree)/window}
    else if(retrograde&&degree<window){kind='egress';progress=(window-degree)/window}
    return{signIndex:index,sign:SIGNS[index],degree,kind,direction:retrograde?'retrograde':'direct',progress:progress==null?null:clamp(progress,0,1)};
  }
  function classifyMotion(beforeError,afterError,epsilon=.015){
    const before=Number(beforeError),after=Number(afterError);
    if(!Number.isFinite(before)||!Number.isFinite(after))return'unknown';
    if(Math.abs(after-before)<=epsilon)return'exact';
    return after<before?'applying':'separating';
  }
  function activeRelationships(leftRecords,rightRecords,orb,{mode='inter',aspects=ASPECTS}={}){
    const left=Array.isArray(leftRecords)?leftRecords:[],right=Array.isArray(rightRecords)?rightRecords:[],limit=Math.max(0,Number(orb)||0),rows=[];
    if(mode==='intra'){
      for(let i=0;i<left.length;i+=1)for(let j=i+1;j<left.length;j+=1){
        for(const aspect of aspects){const error=aspectError(left[i].value,left[j].value,aspect.angle);if(error<=limit)rows.push({mode,left:left[i],right:left[j],aspect,error})}
      }
      return rows;
    }
    for(const a of left)for(const b of right){
      for(const aspect of aspects){const error=aspectError(a.value,b.value,aspect.angle);if(error<=limit)rows.push({mode,left:a,right:b,aspect,error})}
    }
    return rows;
  }
  return{DAY,YEAR,TROPICAL_YEAR_DAYS,SIGNS,ASPECTS,norm,wrap,separation,aspectError,secondaryProgressedMs,targetMsFromProgressedMs,calendarSkyMs,signState,classifyMotion,activeRelationships};
});
