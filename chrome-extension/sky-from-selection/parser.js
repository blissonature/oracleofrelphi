/* Selection parser: event labels are metadata, not dates or locations. */
(function(root){
  'use strict';
  const MONTHS={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
  const DATE=/\b(?:(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Sept(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2}),?\s+(\d{4})|(\d{4})[-/]([01]?\d)[-/]([0-3]?\d))\b/gi;
  const LABEL=/\b(born|birth|died|death|married|divorced|founded|dissolved|established|closed)\b/gi;
  const TIME=/\b(?:at\s+)?(?:(?:approximately|approx\.?|about|around)\s+)?(\d{1,2}):(\d{2})(?:\s*(a\.?m\.?|p\.?m\.?))?(?=\s|[,;]|$)|\b(?:at\s+)?(?:(?:approximately|approx\.?|about|around)\s+)?(\d{1,2})\s*(a\.?m\.?|p\.?m\.?)(?=\s|[,;]|$)/i;
  const ZONE=/^\s*[,;]?\s*((?:P\.?S\.?T|P\.?D\.?T|M\.?S\.?T|M\.?D\.?T|C\.?S\.?T|C\.?D\.?T|E\.?S\.?T|E\.?D\.?T|A\.?K\.?S\.?T|A\.?K\.?D\.?T|H\.?S\.?T|U\.?T\.?C|G\.?M\.?T)\.?)(?=\s|[,;]|$)\s*[,;]?\s*/i;
  function dropClockZone(after){const m=after.match(ZONE);return {after:m?after.slice(m[0].length):after,timeZoneAbbreviation:m?m[1].replace(/\./g,'').toUpperCase():null}}
  const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
  const cleanLocation=s=>{const value=clean(s).replace(/^(?:in|at|on)\s+/i,'');return /(?:\b[A-Za-z]\.){2,}$/.test(value)?value:value.replace(/\.$/,'')};
  function dateISO(m){
    const y=Number(m[3]||m[4]),mo=m[1]?MONTHS[m[1].slice(0,3).toLowerCase()]:Number(m[5]),day=Number(m[2]||m[6]);
    const d=new Date(0);d.setUTCFullYear(y,mo-1,day);d.setUTCHours(0,0,0,0);
    if(d.getUTCFullYear()!==y||d.getUTCMonth()!==mo-1||d.getUTCDate()!==day)return null;
    return `${String(y).padStart(4,'0')}-${String(mo).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }
  function parse(text){
    const source=clean(text).slice(0,6000),matches=Array.from(source.matchAll(DATE));
    if(matches.length!==2)throw new Error('Select exactly two complete dates and their locations.');
    const events=matches.map((m,i)=>{
      const date=dateISO(m);if(!date)throw new Error('One selected date is invalid.');
      const previousEnd=i===0?0:matches[i-1].index+matches[i-1][0].length;
      const before=source.slice(previousEnd,m.index);
      const tags=Array.from(before.matchAll(LABEL));
      const label=tags.length?tags.at(-1)[0]:null;
      if(i===1 && before.replace(LABEL,'').replace(/[\s,;|:–—-]/g,'').length>0){
        // All words between the dates belong to the first event until an event label.
      }
      const nextStart=i===1?source.length:matches[i+1].index;
      let after=source.slice(m.index+m[0].length,nextStart);
      const nextLabels=Array.from(after.matchAll(LABEL));
      if(nextLabels.length)after=after.slice(0,nextLabels[0].index);
      let time=null,timeZoneAbbreviation=null;
      const tm=after.match(TIME);
      if(tm){
        let hour=Number(tm[1]||tm[4]),min=Number(tm[2]||0);
        const period=(tm[3]||tm[5]||'').replace(/\./g,'').toLowerCase();
        if(hour>23||min>59||(period&&(hour<1||hour>12)))throw new Error('Invalid time in selection.');
        if(period)hour=hour%12+(period==='pm'?12:0);
        time=`${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
        const remaining=dropClockZone(after.slice(tm.index+tm[0].length));
        timeZoneAbbreviation=remaining.timeZoneAbbreviation;
        after=after.slice(0,tm.index)+' '+remaining.after;
      }
      const location=cleanLocation(after.replace(/^[\s,;:|–—-]+/,'').replace(/[,;|\s–—-]+$/,''));
      if(!location)throw new Error(`No location was found for ${date}.`);
      return {label:label?label.toLowerCase():null,date,time,location,timeZoneAbbreviation};
    });
    return events;
  }
  function parseSingle(text){
    const source=clean(text).slice(0,6000);
    const dates=Array.from(source.matchAll(DATE));
    if(dates.length!==1)throw new Error('Highlight one complete date with its location, or choose Compare two dates.');
    const match=dates[0],date=dateISO(match);
    if(!date)throw new Error('The highlighted date is invalid.');
    let before=source.slice(0,match.index).trim();
    const labelMatch=Array.from(before.matchAll(LABEL)).at(-1);
    const label=labelMatch?.[0]?.toLowerCase()||null;
    let after=source.slice(match.index+match[0].length).trim();
    // A date is not a location. Extract the optional clock time before the place.
    let time=null,timeZoneAbbreviation=null;
    const clock=after.match(TIME);
    if(clock){
      let hour=Number(clock[1]||clock[4]),minute=Number(clock[2]||0);
      const period=(clock[3]||clock[5]||'').toLowerCase().replace(/\./g,'');
      if(hour>23||minute>59||(period&&(hour<1||hour>12)))throw new Error('The selected time is invalid.');
      if(period)hour=(hour%12)+(period==='pm'?12:0);
      time=String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0');
      const remaining=dropClockZone(after.slice(clock.index+clock[0].length));
      timeZoneAbbreviation=remaining.timeZoneAbbreviation;
      after=after.slice(0,clock.index)+' '+remaining.after;
    }
    let location=cleanLocation(after.replace(/^[\s,;:|–—-]+/,'').replace(/^(?:at|on|in)\b\s*/i,'').replace(/^[\s,;:|–—-]+/,'').replace(/[,;|\s–—-]+$/,''));
    // Support a common alternate order: 'Rochester, NY — October 29, 1971'.
    if(!location&&before){
      location=clean(before.replace(LABEL,'').replace(/^(?:at|on|in)\b\s*/i,'').replace(/[,;|\s–—-]+$/,''));
    }
    if(!location||location.length>200)throw new Error('Select a complete date and a city/location together.');
    return {label,date,time,location,timeZoneAbbreviation};
  }
  function parseDate(text){
    const dates=Array.from(clean(text).matchAll(DATE));
    if(dates.length!==1)throw new Error('Select exactly one date.');
    const date=dateISO(dates[0]);
    if(!date)throw new Error('Invalid selected date.');
    return date;
  }
  root.RelphiSelectionParser=Object.freeze({parse,parseSingle,parseDate});
})(typeof globalThis==='object'?globalThis:this);