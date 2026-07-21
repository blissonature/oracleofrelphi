// Branch-only support for pasted Part of Fortune, Lilith, North Node, and Vertex placements.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SLOT_KEYS = { chart:'relphiSkyChartA', currentSky:'relphiSkyChartB' };
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const POINTS = [
    { name:'Part of Fortune', aliases:['part of fortune','fortune','pars fortunae','pof'], glyph:'⊗' },
    { name:'Lilith', aliases:['black moon lilith','lilith','bml'], glyph:'⚸' },
    { name:'North Node', aliases:['true north node','mean north node','north node','ascending node','node'], glyph:'☊' },
    { name:'Vertex', aliases:['vertex','vx'], glyph:'Vx' }
  ];

  function readJson(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } }
  function writeJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } }
  function esc(value) { return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function pointFor(line) {
    const lower = line.toLowerCase();
    return POINTS.find(function (point) {
      return point.aliases.some(function (alias) { return new RegExp('(^|[^a-z])' + esc(alias) + '([^a-z]|$)', 'i').test(lower); });
    }) || null;
  }

  function parseLine(line) {
    const point = pointFor(line);
    if (!point) return null;
    const sign = SIGNS.find(function (candidate) { return new RegExp('\\b' + candidate + '\\b', 'i').test(line); });
    if (!sign) return null;
    const coordinate = line.match(/(\d{1,2})(?:\s*[°º]|\s+deg(?:ree)?s?)\s*(\d{1,2})?\s*(?:[′'’]|min(?:ute)?s?)?/i) ||
      line.match(new RegExp('\\b' + sign + '\\b\\s*(\d{1,2})(?:[:°º\\s]+(\d{1,2}))?', 'i'));
    if (!coordinate) return null;
    const degree = Math.max(0, Math.min(29, Number(coordinate[1])));
    const minute = Math.max(0, Math.min(59, Number(coordinate[2] || 0)));
    const houseMatch = line.match(/(?:in\s*)?(\d{1,2})(?:st|nd|rd|th)?\s*house/i);
    const retrograde = /(?:\bretrograde\b|\bRx\b|℞)/i.test(line);
    return {
      name:point.name,
      value:{ sign:sign, degree:degree, minute:minute, house:houseMatch ? Number(houseMatch[1]) : '', retrograde:retrograde, glyph:point.glyph, source:'pasted-extra-point' }
    };
  }

  function parse(text) {
    const result = {};
    String(text || '').split(/\r?\n/).forEach(function (line) {
      const parsed = parseLine(line);
      if (parsed) result[parsed.name] = parsed.value;
    });
    return result;
  }

  function targetKey() {
    const target = document.getElementById('skyCreatorTarget')?.value || 'chart';
    return SLOT_KEYS[target] || SLOT_KEYS.chart;
  }

  function mergeNow() {
    const textarea = document.getElementById('skyCreatorPaste');
    if (!textarea) return false;
    const extras = parse(textarea.value);
    if (!Object.keys(extras).length) return false;
    const key = targetKey();
    const payload = readJson(key) || { placements:{} };
    payload.placements = payload.placements && typeof payload.placements === 'object' ? payload.placements : {};
    Object.assign(payload.placements, extras);
    writeJson(key, payload);
    const loadButton = document.getElementById(key === SLOT_KEYS.currentSky ? 'loadCurrentSky' : 'loadChart');
    loadButton?.click();
    window.dispatchEvent(new CustomEvent('relphi:extra-points-updated', { detail:{ names:Object.keys(extras) } }));
    return true;
  }

  function install() {
    document.addEventListener('click', function (event) {
      if (!event.target.closest?.('#skyCreatorSaveWizard,#saveChart,#saveCurrentSky,[data-action="finish-placements"]')) return;
      setTimeout(mergeNow, 0);
    }, true);
    document.addEventListener('change', function (event) {
      if (event.target?.id === 'skyCreatorPaste') setTimeout(mergeNow, 0);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
