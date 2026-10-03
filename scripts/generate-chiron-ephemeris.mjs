import https from 'node:https';
import fs from 'node:fs/promises';
const START='1900-01-01', END='2150-01-01', STEP='1 d';
function get(url){return new Promise((resolve,reject)=>https.get(url,r=>{let s='';r.on('data',d=>s+=d);r.on('end',()=>r.statusCode===200?resolve(s):reject(new Error(`HTTP ${r.statusCode}`)));}).on('error',reject));}
function addYears(date,n){const d=new Date(date+'T00:00:00Z');d.setUTCFullYear(d.getUTCFullYear()+n);return d.toISOString().slice(0,10)}
function query(start,stop){const p=new URLSearchParams({format:'text',COMMAND:"'2060;'",OBJ_DATA:"'NO'",MAKE_EPHEM:"'YES'",EPHEM_TYPE:"'OBSERVER'",CENTER:"'500@399'",START_TIME:`'${start}'`,STOP_TIME:`'${stop}'`,STEP_SIZE:`'${STEP}'`,QUANTITIES:"'31'",CSV_FORMAT:"'YES'",ANG_FORMAT:"'DEG'",CAL_FORMAT:"'JD'",TIME_DIGITS:"'SECONDS'"});return 'https://ssd.jpl.nasa.gov/api/horizons.api?'+p;}
function parse(text){const a=text.indexOf('$$SOE'),b=text.indexOf('$$EOE');if(a<0||b<0)throw new Error(text.slice(0,1000));return text.slice(a+5,b).trim().split(/\r?\n/).filter(Boolean).map(line=>{const c=line.split(',').map(x=>x.trim());const jd=Number(c[0]),lon=Number(c.find((x,i)=>i>0&&/^[-+]?\d+(?:\.\d+)?$/.test(x)));return {jd,lon};});}
let all=[];let cursor=START;
while(cursor<END){const stop=addYears(cursor,20)>END?END:addYears(cursor,20);console.log(cursor,stop);const rows=parse(await get(query(cursor,stop)));if(all.length&&rows.length&&rows[0].jd===all.at(-1).jd)rows.shift();all.push(...rows);cursor=stop;}
if(all.length<90000)throw new Error(`too few rows ${all.length}`);
const scale=1e6;const unwrapped=[];for(const r of all){let v=r.lon;if(unwrapped.length){const prev=unwrapped.at(-1);while(v-prev>180)v-=360;while(v-prev<-180)v+=360;}unwrapped.push(v);}const vals=unwrapped.map(v=>Math.round(v*scale));const deltas=vals.map((v,i)=>i?v-vals[i-1]:v);
const out=`// Generated from NASA/JPL Horizons observer quantity 31 for 2060 Chiron.\n// Geocentric apparent ecliptic-of-date longitude, daily samples, ${START} through ${END}.\n(function(){'use strict';window.RelphiChironEphemerisData=Object.freeze({source:'NASA/JPL Horizons',target:'2060 Chiron',quantity:31,startJD:${all[0].jd},stepDays:1,scale:${scale},deltas:Object.freeze([${deltas.join(',')}])});})();\n`;
await fs.writeFile('relphi-chiron-ephemeris-data-v1.js',out);console.log('wrote',all.length,'samples',out.length,'bytes');