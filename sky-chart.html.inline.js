
  window.addEventListener('load', function(){
    document.getElementById('chartMode')?.click();
    const params = new URLSearchParams(window.location.search);
    const setValue = function(id, value) {
      const el = document.getElementById(id);
      if (el && value) {
        el.value = value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };
    const dateTime = params.get('datetime') || (params.get('date') ? params.get('date') + 'T12:00' : '');
    if (dateTime || params.get('lat') || params.get('lon')) {
      try {
        localStorage.setItem('relphiPlanetaryHoursWhereWhen', JSON.stringify({
          datetime: dateTime,
          lat: params.get('lat') || '',
          lon: params.get('lon') || '',
          tz: params.get('tz') || '',
          loc: params.get('loc') || '',
          savedAt: new Date().toISOString()
        }));
      } catch (error) {}
      document.getElementById('skyCreatorDrawer')?.setAttribute('open', '');
      document.querySelector('.sky-calc-drawer')?.setAttribute('open', '');
      setValue('skyCalcTarget', 'chart');
      setValue('skyCreatorTarget', 'chart');
      setValue('skyCalcDateTime', dateTime);
      setValue('skyCalcLatitude', params.get('lat'));
      setValue('skyCalcLongitude', params.get('lon'));
      setValue('skyCalcTimeZone', params.get('tz'));
      setValue('skyCalcLocation', params.get('loc'));
      setValue('skyCalcName', params.get('name') || 'Planetary Hours date');
      document.getElementById('skyCalcDateTime')?.scrollIntoView({ block: 'center' });
      if (params.get('calc') === '1') setTimeout(function(){ document.getElementById('skyCalcRun')?.click(); }, 250);
    }
  });
  