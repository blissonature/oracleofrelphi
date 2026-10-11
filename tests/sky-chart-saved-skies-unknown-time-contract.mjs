import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Run the actual dropdown dateTime formatter in isolation, without loading the chart.
const source=fs.readFileSync('sky-chart-saved-skies-labels-v1.js','utf8');
const profileStart=source.indexOf('function profile(record){');
const profileEnd=source.indexOf('\nfunction metadata(record){',profileStart);
const timeStart=source.indexOf('function dateTime(record){');
const timeEnd=source.indexOf('\nfunction place(record){',timeStart);
assert.ok(profileStart>=0&&profileEnd>profileStart&&timeStart>=0&&timeEnd>timeStart,'Saved Sky formatter must remain testable');
const functions=source.slice(profileStart,profileEnd)+'\n'+source.slice(timeStart,timeEnd);

function createFormatter({withLuxon=true}={}){
  const parsedInputs=[];
  const fakeDateTime={
    fromISO(raw){
      parsedInputs.push(raw);
      return{
        isValid:true,
        setZone(){return this},
        toFormat(pattern){
          if(pattern==='MMM d, yyyy')return 'Oct 8, 1985';
          if(pattern==='MMM d, yyyy · h:mm a ZZZZ')return 'Oct 8, 1985 · 12:00 AM EDT';
          throw Error('Unexpected date format: '+pattern);
        }
      };
    }
  };
  const context={window:withLuxon?{luxon:{DateTime:fakeDateTime}}:{},Date};
  const formatter=vm.runInNewContext('(function(){'+functions+'\nreturn dateTime;})()',context);
  return{formatter,parsedInputs};
}

const record={
  name:'Untimed birth',
  calcProfile:{
    timeUnknown:true,
    dateTime:'1985-10-08T00:00:00',
    instant:'1985-10-08T04:00:00.000Z',
    timeZone:'America/New_York'
  }
};
const live=createFormatter();
assert.equal(live.formatter(record),'Oct 8, 1985 · unknown time','Unknown time must replace midnight in Saved Skies');
assert.equal(live.parsedInputs[0],record.calcProfile.dateTime,'Unknown-time date should use the stated calendar date, not the placeholder instant');

const known=createFormatter();
assert.equal(known.formatter({...record,calcProfile:{...record.calcProfile,timeUnknown:false}}),'Oct 8, 1985 · 12:00 AM EDT','Actual midnight must remain a real clock time');
assert.equal(known.parsedInputs[0],record.calcProfile.instant,'Known-time formatting should retain original instant precedence');

const legacy=createFormatter();
assert.equal(legacy.formatter({...record,calcProfile:{...record.calcProfile,timeUnknown:undefined},profile:{timeUnknown:true}}),'Oct 8, 1985 · unknown time','Legacy profile flags should also be honored');

const noLuxon=createFormatter({withLuxon:false});
assert.equal(noLuxon.formatter(record),'1985-10-08 · unknown time','Date must survive even if Luxon fails to load');
assert.equal(noLuxon.formatter({calcProfile:{timeUnknown:true}}),'unknown time','An undated unknown-time sky must not invent a clock time');

assert.match(source,/when\.textContent=dateTime\(record\)/,'Picker timestamp must use the tested formatter');
assert.match(source,/parts=\[name,when,where\]/,'Picker accessibility label must use the same timestamp');
console.log('Saved Skies unknown-time formatting contract passed.');
