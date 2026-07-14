// Planetary Hours location handoff and mobile settings cleanup.
(function () {
  'use strict';
  if (!/(^|\/)planetaryhours\.html$/.test(location.pathname)) return;

  const DISMISS_KEY = 'relphiPlanetaryHoursLocationPromptDismissed';

  function isGreenwich(lat, lon, name) {
    return Number.isFinite(lat) && Number.isFinite(lon) &&
      Math.abs(lat - 51.4769) < 0.01 && Math.abs(lon + 0.0005) < 0.01 &&
      (!name || String(name).toLowerCase().includes('greenwich'));
  }

  function currentFields() {
    return {
      lat: document.getElementById('lat'),
      lon: document.getElementById('lon'),
      tz: document.getElementById('tzSelect'),
      search: document.getElementById('locationSearch'),
      note: document.getElementById('locationNote'),
      set: document.getElementById('setLatLon'),
      useGeo: document.getElementById('useGeo')
    };
  }

  function isStillGreenwich() {
    const f = currentFields();
    if (!f.lat || !f.lon) return false;
    return isGreenwich(Number(f.lat.value), Number(f.lon.value), f.search && f.search.value);
  }

  function installMobileCleanup() {
    if (document.getElementById('ph-mobile-settings-cleanup-v1')) return;
    const style = document.createElement('style');
    style.id = 'ph-mobile-settings-cleanup-v1';
    style.textContent = `
      @media (max-width: 600px) {
        .planetary-page { width:100% !important; max-width:none !important; margin:4.2rem auto 1rem !important; padding:0 .55rem !important; box-sizing:border-box !important; overflow-x:hidden !important; }
        .planetary-page .ph-panel { width:100% !important; max-width:100% !important; padding:.8rem !important; box-sizing:border-box !important; border-radius:1rem !important; overflow:hidden !important; }
        .planetary-page .ph-settings-body { display:grid !important; gap:.75rem !important; }
        .planetary-page .ph-settings-body > .ph-row { display:grid !important; grid-template-columns:1fr !important; gap:.6rem !important; align-items:stretch !important; justify-items:stretch !important; }
        .planetary-page .ph-settings-body label,
        .planetary-page .ph-location-search,
        .planetary-page .ph-row-system-time { width:100% !important; max-width:100% !important; display:grid !important; grid-template-columns:1fr !important; gap:.3rem !important; text-align:left !important; box-sizing:border-box !important; }
        .planetary-page .ph-input,
        .planetary-page .ph-select,
        .planetary-page .ph-input.short,
        .planetary-page .ph-settings-body button { width:100% !important; max-width:100% !important; box-sizing:border-box !important; margin:0 !important; }
        .planetary-page #localClock { width:100% !important; text-align:center !important; box-sizing:border-box !important; }
        .planetary-page #echo,
        .planetary-page #locationNote { margin:.1rem 0 !important; text-align:left !important; overflow-wrap:anywhere !important; }
        .planetary-page .ph-row-system-time { display:grid !important; }
        .planetary-page .ph-switch { display:flex !important; justify-content:space-between !important; align-items:center !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function removePrompt() {
    const prompt = document.getElementById('phLocationPrompt');
    if (prompt) prompt.remove();
  }

  function showPrompt() {
    if (document.getElementById('phLocationPrompt')) return;

    const wrap = document.createElement('section');
    wrap.id = 'phLocationPrompt';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-labelledby', 'phLocationPromptTitle');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(17,17,17,.58);display:grid;place-items:center;padding:1rem;';

    wrap.innerHTML = '<div style="width:min(92vw,30rem);background:#fff;border:2px solid #dc1f18;border-radius:1.2rem;padding:1rem;box-shadow:0 1.2rem 3rem rgba(0,0,0,.28);text-align:left;">' +
      '<h2 id="phLocationPromptTitle" style="margin:.1rem 0 .45rem;text-align:left;">Use your location?</h2>' +
      '<p style="margin:.2rem 0 .75rem;line-height:1.45;">Planetary Hours is still using the Greenwich demonstration location.</p>' +
      '<p id="phLocationPromptStatus" aria-live="polite" style="min-height:1.35em;margin:.15rem 0 .75rem;color:#8b1511;font-weight:700;"></p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:.55rem;">' +
      '<button type="button" id="phPromptUseLocation" style="font:inherit;font-weight:800;border:0;border-radius:999px;background:#dc1f18;color:#fff;padding:.7rem 1rem;">Use my location</button>' +
      '<button type="button" id="phPromptKeepDemo" style="font:inherit;font-weight:800;border:1.5px solid #111;border-radius:999px;background:#fff;color:#111;padding:.7rem 1rem;">Keep Greenwich for now</button>' +
      '</div></div>';

    document.body.appendChild(wrap);
    const use = document.getElementById('phPromptUseLocation');
    const keep = document.getElementById('phPromptKeepDemo');
    const status = document.getElementById('phLocationPromptStatus');

    use.addEventListener('click', function () {
      const fields = currentFields();
      if (!window.RelphiLocation || !fields.useGeo) {
        status.textContent = 'Geolocation is unavailable in this browser.';
        return;
      }
      use.disabled = true;
      status.textContent = 'Waiting for location permission…';
      window.addEventListener('relphi:location-changed', function (event) {
        if (event.detail && event.detail.source === 'geolocation') {
          try { sessionStorage.removeItem(DISMISS_KEY); } catch (error) {}
          removePrompt();
        }
      }, { once:true });
      fields.useGeo.click();
      setTimeout(function () {
        if (!document.getElementById('phLocationPrompt')) return;
        use.disabled = false;
        status.textContent = document.getElementById('echo')?.textContent || 'Choose a location manually or try again.';
      }, 16000);
    });

    keep.addEventListener('click', function () {
      try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (error) {}
      removePrompt();
    });
    use.focus();
  }

  function start() {
    installMobileCleanup();
    let tries = 0;
    const timer = setInterval(function () {
      tries += 1;
      const f = currentFields();
      if (f.lat && f.lon && f.set) {
        clearInterval(timer);
        let dismissed = false;
        try { dismissed = sessionStorage.getItem(DISMISS_KEY) === '1'; } catch (error) {}
        if (!dismissed && isStillGreenwich()) showPrompt();
      } else if (tries > 80) clearInterval(timer);
    }, 150);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
