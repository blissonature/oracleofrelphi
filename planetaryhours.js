
// Planetary Hours calculator for Oracle of Relphi

// Core planetary metadata
var planets = [
  {key:'saturn',  sym:'\u2644', name:'Saturn',  color:'var(--saturn)',  focusDay:'Structure, limits, karmic audit',         focusHour:'Consolidate, prune, commit'},
  {key:'jupiter', sym:'\u2643', name:'Jupiter', color:'var(--jupiter)', focusDay:'Expansion, blessing, philosophical sight', focusHour:'Expand, publish, mentor'},
  {key:'mars',    sym:'\u2642', name:'Mars',    color:'var(--mars)',    focusDay:'Courage, cutting, ignition',              focusHour:'Act, compete, cauterize'},
  {key:'sun',     sym:'\u2609', name:'Sun',     color:'var(--sun)',     focusDay:'Heart, visibility, authority',            focusHour:'Lead, clarify, spotlight'},
  {key:'venus',   sym:'\u2640', name:'Venus',   color:'var(--venus)',   focusDay:'Attraction, bonds, aesthetics',           focusHour:'Relate, attract, refine'},
  {key:'mercury', sym:'\u263F', name:'Mercury', color:'var(--mercury)', focusDay:'Signal, trade, analysis',                 focusHour:'Write, ship, negotiate'},
  {key:'moon',    sym:'\u263D', name:'Moon',    color:'var(--moon)',    focusDay:'Tides, mood, memory',                     focusHour:'Nourish, adapt, reflect'}
];

var byKey = {};
for (var i=0;i<planets.length;i++){
  byKey[planets[i].key] = planets[i];
}

// Chaldean order from slowest to fastest
var chaldean = ['saturn','jupiter','mars','sun','venus','mercury','moon'];

function rotateTo(dayKey){
  var idx = chaldean.indexOf(dayKey);
  if (idx < 0) idx = 0;
  var seq = [];
  for (var i=0;i<24;i++){
    seq.push(chaldean[(idx + i) % 7]);
  }
  return seq;
}

function pad(n){ return String(n).padStart(2,'0'); }

function fmtHM(d){
  var h = d.getHours();
  var m = d.getMinutes();
  var am = h < 12;
  var hh = h % 12 || 12;
  return pad(hh) + ":" + pad(m) + " " + (am ? "AM" : "PM");
}

function fmtHM24(d){
  return pad(d.getHours()) + ":" + pad(d.getMinutes());
}

function ordinalName(n){
  var s = (n%10===1 && n%100!==11) ? 'st' :
          (n%10===2 && n%100!==12) ? 'nd' :
          (n%10===3 && n%100!==13) ? 'rd' : 'th';
  var harmonics = ['\u2014','Fundamental','Octave','Fifth','Double Octave'];
  var harmonic = harmonics[n] || (n + 'th');
  return {label: n + s, harmonic: harmonic};
}

// State
var state = {
  tz: (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'),
  lat: 40.7608,
  lon: -111.8910,
  useSystem: true,
  now: new Date(),
  mode: 'sidereal'
};

// Read hash if present
(function readHash(){
  try{
    if (!location.hash) return;
    var h = new URLSearchParams(location.hash.slice(1));
    if (h.get('lat')) state.lat = parseFloat(h.get('lat'));
    if (h.get('lon')) state.lon = parseFloat(h.get('lon'));
    if (h.get('tz'))  state.tz  = h.get('tz');
    if (h.get('dt'))  state.now = new Date(h.get('dt'));
    if (h.get('mode')) state.mode = h.get('mode');
    if (h.get('useSystem') === '0') state.useSystem = false;
  }catch(e){}
})();

// Element references
var el = {};

function cacheElements(){
  el.clock        = document.getElementById('localClock');
  el.copy         = document.getElementById('copyLink');
  el.useGeo       = document.getElementById('useGeo');
  el.tzSelect     = document.getElementById('tzSelect');
  el.lat          = document.getElementById('lat');
  el.lon          = document.getElementById('lon');
  el.setLatLon    = document.getElementById('setLatLon');
  el.echo         = document.getElementById('echo');
  el.useSystem    = document.getElementById('useSystem');
  el.manualTime   = document.getElementById('manualTime');
  el.datePick     = document.getElementById('datePick');
  el.timePick     = document.getElementById('timePick');
  el.applyDT      = document.getElementById('applyDT');
  el.mode         = document.getElementById('mode');

  el.dayRuler     = document.getElementById('dayRuler');
  el.dayRulerMeta = document.getElementById('dayRulerMeta');
  el.sunTimes     = document.getElementById('sunTimes');
  el.bridgeInfo   = document.getElementById('bridgeInfo');

  el.ticker       = document.getElementById('ticker');
  el.dayStart     = document.getElementById('dayStart');
  el.sunriseBar   = document.getElementById('sunriseBar');
  el.sunsetBar    = document.getElementById('sunsetBar');
  el.dayEnd       = document.getElementById('dayEnd');
  el.progress     = document.getElementById('progress');
  el.lblStart     = document.getElementById('lblStart');
  el.lblEnd       = document.getElementById('lblEnd');

  el.currentHourPill = document.getElementById('currentHourPill');
  el.mult           = document.getElementById('mult');
  el.ordLine        = document.getElementById('ordLine');
  el.hourMeta       = document.getElementById('hourMeta');
  el.legendChips    = document.getElementById('legendChips');

  el.hoursTable     = document.querySelector('#hoursTable tbody');
  el.matrixFilter   = document.getElementById('matrixFilter');
  el.matrixTable    = document.getElementById('matrixTable');
  el.bridgeTable    = document.querySelector('#bridgeTable tbody');
}

function populateTimezones(){
  var sel = el.tzSelect;
  if (!sel) return;
  sel.innerHTML = '';
  var zones = [];
  if (Intl.supportedValuesOf){
    try {
      zones = Intl.supportedValuesOf('timeZone').slice();
    } catch(e){}
  }
  for (var o=-12;o<=14;o++){
    zones.push('UTC' + (o>=0?'+':'') + o);
  }
  // dedupe
  zones = Array.from(new Set(zones));
  zones.sort();
  zones.forEach(function(z){
    var opt = document.createElement('option');
    opt.value = z;
    opt.textContent = z;
    sel.appendChild(opt);
  });
  sel.value = zones.indexOf(state.tz) >= 0 ? state.tz : 'UTC';
}

// Local clock
function tickLocalClock(){
  if (!el.clock) return;
  var d = new Date();
  el.clock.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes());
}

// Utility: convert Date to given TZ ISO (yyyy-mm-ddThh:mm)
function toTZISO(date, tz){
  try{
    var fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit', hour12:false
    });
    var parts = fmt.formatToParts(date);
    var map = {};
    parts.forEach(function(p){ map[p.type] = p.value; });
    return map.year + "-" + map.month + "-" + map.day + "T" + map.hour + ":" + map.minute;
  }catch(e){
    return date.toISOString().slice(0,16);
  }
}

function addDays(d,n){
  var x = new Date(d.getTime());
  x.setDate(x.getDate() + n);
  return x;
}

// Compute sunrise->sunrise frame using SunCalc
function computeDayFrame(now, lat, lon, tz){
  var local = new Date(new Date(now).toLocaleString('en-US', {timeZone: tz}));
  var base  = new Date(local.getTime());
  base.setHours(12,0,0,0); // noon anchor for SunCalc

  var today = SunCalc.getTimes(base, lat, lon);
  var sr = today.sunrise;
  var ss = today.sunset;

  var start, sunrise, sunset, end;

  if (local >= sr){
    var tmr = SunCalc.getTimes(addDays(base, 1), lat, lon);
    start   = sr;
    sunrise = sr;
    sunset  = ss;
    end     = tmr.sunrise;
  } else {
    var yest = SunCalc.getTimes(addDays(base, -1), lat, lon);
    start   = yest.sunrise;
    sunrise = yest.sunrise;
    sunset  = yest.sunset;
    end     = sr;
  }

  return {
    start: start,
    sunrise: sunrise,
    sunset: sunset,
    end: end,
    localNow: local
  };
}

function seqForDay(dayKey){
  return rotateTo(dayKey);
}

function dayRulerKeyForWeekday(localStart){
  var map = {0:'sun',1:'moon',2:'mars',3:'mercury',4:'jupiter',5:'venus',6:'saturn'};
  return map[ localStart.getDay() ];
}

function buildHours(frame, dayKey){
  var seq = seqForDay(dayKey);
  var daylight = frame.sunset - frame.sunrise;
  var night    = frame.end    - frame.sunset;
  var brightLen = daylight / 12;
  var darkLen   = night / 12;
  var rows = [];
  var t = frame.start.getTime();
  for (var i=0;i<24;i++){
    var isBright = i < 12;
    var len  = isBright ? brightLen : darkLen;
    var start = new Date(t);
    var end   = new Date(t + len);
    var ruler = byKey[ seq[i] ];
    rows.push({
      index: i+1,
      start: start,
      end: end,
      ruler: ruler,
      isBright: isBright,
      ordinal: i+1
    });
    t += len;
  }
  return rows;
}

function hoursHeldToday(rows, key){
  var b=0,d=0;
  for (var i=0;i<rows.length;i++){
    var r = rows[i];
    if (r.ruler.key === key){
      if (r.isBright) b++; else d++;
    }
  }
  return {b:b, d:d, t:b+d};
}

function hourMultiplier(row, dayKey, rows){
  var dayIndex  = chaldean.indexOf(dayKey);
  var hourIndex = chaldean.indexOf(row.ruler.key);
  if (dayIndex  < 0) dayIndex  = 0;
  if (hourIndex < 0) hourIndex = 0;
  var dayW  = 1 + dayIndex;
  var hourW = 1 + hourIndex;
  var sid   = dayW * hourW;

  var held  = hoursHeldToday(rows, row.ruler.key);
  var ratio = held.t > 0 ? (row.isBright ? held.b/held.t : held.d/held.t) : 1;
  var hybrid = sid * ratio;

  var val = sid;
  if (state.mode === 'ratio')  val = ratio * 10;
  if (state.mode === 'hybrid') val = hybrid;

  return {val:val, sidereal:sid, ratio:ratio, hybrid:hybrid};
}

function currentIndex(rows, local){
  var t = local.getTime();
  var firstStart = rows[0].start.getTime();
  var lastEnd    = rows[rows.length-1].end.getTime();
  if (t < firstStart) return 0;
  if (t >= lastEnd)   return rows.length-1;
  var lo = 0, hi = rows.length-1;
  while (lo <= hi){
    var mid = (lo + hi) >> 1;
    var s = rows[mid].start.getTime();
    var e = rows[mid].end.getTime();
    if (t < s) hi = mid - 1;
    else if (t >= e) lo = mid + 1;
    else return mid;
  }
  return Math.max(0, Math.min(rows.length-1, lo));
}

function contextFocus(day, ruler){
  // Simple contextual text using focus fields, can be expanded later
  if (day.key === ruler.key){
    return "Day and hour in the same rulership — amplified field for " + ruler.focusDay.toLowerCase() + ".";
  }
  return ruler.focusHour;
}

function buildMatrixPlaceholder(){
  if (!el.matrixTable) return;
  var thead = el.matrixTable.querySelector('thead');
  var tbody = el.matrixTable.querySelector('tbody');
  thead.innerHTML = "";
  tbody.innerHTML = "";
  var tr = document.createElement('tr');
  tr.innerHTML = "<th>Day</th><th>Note</th>";
  thead.appendChild(tr);
  var row = document.createElement('tr');
  row.innerHTML = "<td>Week matrix</td><td>Detailed 7\u00d77 matrix coming in a later version.</td>";
  tbody.appendChild(row);
}

function buildBridgesPlaceholder(){
  if (!el.bridgeTable) return;
  el.bridgeTable.innerHTML = "";
  var tr = document.createElement('tr');
  var td = document.createElement('td');
  td.colSpan = 5;
  td.textContent = "Bridge-hour breakdown coming in a later version.";
  tr.appendChild(td);
  el.bridgeTable.appendChild(tr);
}

// Main rebuild
function rebuild(){
  if (!el.tzSelect) cacheElements();
  var now = state.useSystem ? new Date() : state.now;
  var frame = computeDayFrame(now, state.lat, state.lon, state.tz);
  var dayKey = dayRulerKeyForWeekday(frame.start);
  var day    = byKey[dayKey];
  var rows   = buildHours(frame, dayKey);
  var idx    = currentIndex(rows, frame.localNow);

  // Echo
  if (el.echo){
    el.echo.textContent = state.lat.toFixed(4) + ", " + state.lon.toFixed(4) + " (" + state.tz + ")" + (state.useSystem ? "" : " — manual time");
  }

  // Day summary
  if (el.dayRuler){
    el.dayRuler.innerHTML = '<span class="dot d-'+day.key+'"></span>'+day.sym+' '+day.name;
  }
  if (el.dayRulerMeta){
    el.dayRulerMeta.textContent = "Ruler of " + frame.localNow.toLocaleDateString() + " • " + day.focusDay;
  }
  if (el.sunTimes){
    el.sunTimes.textContent = "Sunrise " + fmtHM(frame.sunrise) + " • Sunset " + fmtHM(frame.sunset) + " • Next sunrise " + fmtHM(frame.end);
  }

  if (el.bridgeInfo){
    var lastHour = rows[rows.length-1];
    var nextDayKey = chaldean[(chaldean.indexOf(dayKey)+1)%7];
    var nextDay = byKey[nextDayKey];
    el.bridgeInfo.textContent = "Bridge: last dark hour ruled by " + lastHour.ruler.name + " hands to " + nextDay.name + " (next day ruler).";
  }

  // Hero band
  if (el.ticker){
    var rect = el.ticker.getBoundingClientRect();
    var span = frame.end.getTime() - frame.start.getTime();
    function xOf(t){
      return ((t.getTime() - frame.start.getTime()) / span) * rect.width;
    }
    if (el.dayStart)  el.dayStart.style.left  = "0px";
    if (el.dayEnd)    el.dayEnd.style.left    = (rect.width - 2) + "px";
    if (el.sunriseBar)el.sunriseBar.style.left = xOf(frame.sunrise) + "px";
    if (el.sunsetBar) el.sunsetBar.style.left  = xOf(frame.sunset)  + "px";
    if (el.lblStart) el.lblStart.textContent = fmtHM(frame.start);
    if (el.lblEnd)   el.lblEnd.textContent   = fmtHM(frame.end);

    function anim(){
      var nowLocal = state.useSystem ? new Date(new Date().toLocaleString('en-US',{timeZone: state.tz})) : frame.localNow;
      var x = xOf(nowLocal);
      var clamped = Math.max(0, Math.min(rect.width-2, x));
      if (el.progress){
        el.progress.style.left = clamped + "px";
      }
      requestAnimationFrame(anim);
    }
    requestAnimationFrame(anim);
  }

  // Current hour hero text
  var cur = rows[idx];
  if (el.currentHourPill){
    el.currentHourPill.innerHTML = '<span class="dot d-'+cur.ruler.key+'"></span>'+cur.ruler.sym+' '+cur.ruler.name;
  }
  var mult = hourMultiplier(cur, dayKey, rows);
  if (el.mult){
    el.mult.textContent = "x" + mult.val.toFixed(3);
  }
  var ord = ordinalName(cur.ordinal);
  if (el.ordLine){
    el.ordLine.textContent = "Power = (day×hour)×(1/ordinal) + ordinal  \u2022  " + ord.label + " (" + (ord.harmonic || "\u2014") + ")";
  }
  if (el.hourMeta){
    var held = hoursHeldToday(rows, cur.ruler.key);
    el.hourMeta.textContent =
      "Hour " + cur.ordinal + "/24 \u2022 " +
      (cur.isBright ? "Bright" : "Dark") +
      " \u2022 " + held.b + " bright / " + held.d + " dark of " + held.t + " today.";
  }

  if (el.legendChips){
    el.legendChips.innerHTML = "";
    function chip(p, txt){
      return '<span class="pill" style="border-color:'+p.color+'"><span class="dot d-'+p.key+'"></span>'+p.sym+' '+txt+'</span>';
    }
    el.legendChips.insertAdjacentHTML('beforeend', chip(day, "Day: " + day.focusDay.split(',')[0]));
    el.legendChips.insertAdjacentHTML('beforeend', chip(cur.ruler, "Hour: " + cur.ruler.focusHour));
  }

  // Hours table
  if (el.hoursTable){
    el.hoursTable.innerHTML = "";
    for (var i=0;i<rows.length;i++){
      var r = rows[i];
      var ordR = ordinalName(r.ordinal);
      var multR = hourMultiplier(r, dayKey, rows);
      var heldRow = hoursHeldToday(rows, r.ruler.key);
      var tr = document.createElement('tr');
      if (i === idx) tr.classList.add('active');
      tr.innerHTML =
        '<td>'+r.index+' <span class="bdg '+(r.isBright?'bright':'dark')+'">'+(r.isBright?'Bright':'Dark')+'</span></td>'+
        '<td>'+fmtHM(r.start)+'–'+fmtHM(r.end)+'</td>'+
        '<td><span class="dot d-'+r.ruler.key+'"></span>'+r.ruler.sym+' '+r.ruler.name+'</td>'+
        '<td>'+ordR.label+' ('+ordR.harmonic+')</td>'+
        '<td>'+r.index+'/24</td>'+
        '<td>'+heldRow.b+'/'+heldRow.d+'/'+heldRow.t+'</td>'+
        '<td>x'+multR.val.toFixed(3)+'</td>'+
        '<td>'+contextFocus(day, r.ruler)+'</td>';
      el.hoursTable.appendChild(tr);
    }
  }

  // Placeholders for matrix + bridges for now
  buildMatrixPlaceholder();
  buildBridgesPlaceholder();

  // Update URL hash
  try{
    var params = new URLSearchParams();
    params.set('lat', state.lat.toFixed(4));
    params.set('lon', state.lon.toFixed(4));
    params.set('tz',  state.tz);
    params.set('mode', state.mode);
    params.set('useSystem', state.useSystem ? '1' : '0');
    params.set('dt', toTZISO(state.useSystem ? new Date() : state.now, state.tz));
    history.replaceState(null, '', '#'+params.toString());
  }catch(e){}
}

// Event wiring
function bindEvents(){
  if (el.useGeo){
    el.useGeo.onclick = function(){
      if (!navigator.geolocation){
        alert('Geolocation not supported in this browser.');
        return;
      }
      el.useGeo.disabled = true;
      navigator.geolocation.getCurrentPosition(function(pos){
        state.lat = pos.coords.latitude;
        state.lon = pos.coords.longitude;
        el.lat.value = state.lat.toFixed(4);
        el.lon.value = state.lon.toFixed(4);
        el.useGeo.disabled = false;
        rebuild();
      }, function(){
        alert('Geolocation failed — falling back to timezone center.');
        el.useGeo.disabled = false;
      });
    };
  }

  if (el.setLatLon){
    el.setLatLon.onclick = function(){
      var lat = parseFloat(el.lat.value);
      var lon = parseFloat(el.lon.value);
      if (!isNaN(lat)) state.lat = lat;
      if (!isNaN(lon)) state.lon = lon;
      rebuild();
    };
  }

  if (el.tzSelect){
    el.tzSelect.onchange = function(){
      state.tz = el.tzSelect.value;
      rebuild();
    };
  }

  if (el.useSystem){
    el.useSystem.onchange = function(){
      state.useSystem = el.useSystem.checked;
      if (el.manualTime){
        el.manualTime.style.display = state.useSystem ? 'none' : 'inline-flex';
      }
      if (state.useSystem){
        state.now = new Date();
      }
      rebuild();
    };
  }

  if (el.applyDT){
    el.applyDT.onclick = function(){
      var d = el.datePick.value;
      var t = el.timePick.value;
      if (d && t){
        // Interpret as local time in chosen TZ as best we can
        state.now = new Date(d + 'T' + t + ':00');
        state.useSystem = false;
        if (el.useSystem){
          el.useSystem.checked = false;
        }
        if (el.manualTime){
          el.manualTime.style.display = 'inline-flex';
        }
        rebuild();
      }
    };
  }

  if (el.mode){
    el.mode.onchange = function(){
      state.mode = el.mode.value;
      rebuild();
    };
  }

  if (el.copy){
    el.copy.onclick = function(){
      try{
        var url = new URL(location.href);
        url.hash = history.state || location.hash;
        navigator.clipboard.writeText(url.toString());
      }catch(e){
        alert('Unable to copy link automatically on this browser.');
      }
    };
  }

  // Matrix filter is a no-op for now; placeholder only
}

// Init
function initPlanetaryHours(){
  cacheElements();
  populateTimezones();
  if (el.lat) el.lat.value = state.lat.toFixed(4);
  if (el.lon) el.lon.value = state.lon.toFixed(4);
  if (el.mode) el.mode.value = state.mode;
  if (el.useSystem){
    el.useSystem.checked = state.useSystem;
    if (el.manualTime) el.manualTime.style.display = state.useSystem ? 'none' : 'inline-flex';
  }
  bindEvents();
  tickLocalClock();
  setInterval(tickLocalClock, 15000);
  rebuild();
}

document.addEventListener('DOMContentLoaded', initPlanetaryHours);
