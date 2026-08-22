const LIVE_SOURCES=new Set(['here-now-vnext','update-now-vnext']);

export function isLiveSky(sky){
  const profile=sky?.calcProfile||{};
  return LIVE_SOURCES.has(String(profile.source||''))&&Number.isFinite(Date.parse(profile.instant));
}

export function freshnessText(sky,now=Date.now()){
  if(!isLiveSky(sky))return'';
  const instant=Date.parse(sky.calcProfile.instant),current=Number(now);
  if(!Number.isFinite(current))return'';
  const minutes=Math.max(0,Math.floor((current-instant)/60000));
  if(minutes<1)return'Now';
  return`${minutes} minute${minutes===1?'':'s'} ago`;
}
