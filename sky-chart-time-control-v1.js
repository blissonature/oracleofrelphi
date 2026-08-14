// Compact no-scroll local-time control for Sky Chart Where and When.
// The hidden canonical data-ww-field="time" input remains the HH:MM calculation authority.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyTimeControlV2)return;
  window.__relphiSkyTimeControlV1=true;
  window.__relphiSkyTimeControlV2=true;

  const TIME_SELECTOR='.sky-where-when-editor [data-ww-field="time"]';
  let observer=null;

  const pad=value=>String(value).padStart(2,'0');
  function parseCanonical(value){
    const match=String(value||'').match(/^(\d{1,2}):(\d{2})$/);
    if(!match)return{hour:'',minute:'',period:''};
    const hour24=Number(match[1]),minute=Number(match[2]);
    if(!Number.isInteger(hour24)||hour24<0||hour24>23||!Number.isInteger(minute)||minute<0||minute>59)return{hour:'',minute:'',period:''};
    return{hour:String(hour24%12||12),minute:pad(minute),period:hour24>=12?'PM':'AM'};
  }
  function toCanonical(state){
    const hour=Number(state.hour),minute=Number(state.minute);
    if(!Number.isInteger(hour)||hour<1||hour>12||!Number.isInteger(minute)||minute<0||minute>59||!['AM','PM'].includes(state.period))return'';
    let hour24=hour%12;
    if(state.period==='PM')hour24+=12;
    return`${pad(hour24)}:${pad(minute)}`;
  }
  function stateFor(control){return{hour:control.dataset.hour||'',minute:control.dataset.minute||'',period:control.dataset.period||''}}
  function setState(control,state){control.dataset.hour=state.hour||'';control.dataset.minute=state.minute||'';control.dataset.period=state.period||''}
  function displayTime(state){return toCanonical(state)?`${state.hour}:${pad(state.minute)} ${state.period}`:'Choose time'}

  function syncVisual(control){
    const state=stateFor(control);
    const display=control.querySelector('[data-sky-time-display]');
    if(display)display.querySelector('span').textContent=displayTime(state);
    control.querySelectorAll('[data-sky-time-hour]').forEach(button=>{
      const active=button.dataset.skyTimeHour===state.hour;
      button.classList.toggle('is-selected',active);
      button.setAttribute('aria-pressed',active?'true':'false');
    });
    control.querySelectorAll('[data-sky-time-period]').forEach(button=>{
      const active=button.dataset.skyTimePeriod===state.period;
      button.classList.toggle('is-selected',active);
      button.setAttribute('aria-pressed',active?'true':'false');
    });
    const minute=control.querySelector('[data-sky-time-minute]');
    if(minute&&minute.value!==state.minute)minute.value=state.minute;
  }
  function commit(control){
    const input=control.__canonicalInput;
    if(!input)return false;
    const canonical=toCanonical(stateFor(control));
    if(!canonical)return false;
    if(input.value!==canonical){
      input.value=canonical;
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));
    }
    syncVisual(control);
    return true;
  }
  function open(control){
    document.querySelectorAll('.sky-time-control.is-open').forEach(other=>{if(other!==control)close(other)});
    control.classList.add('is-open');
    control.querySelector('[data-sky-time-display]')?.setAttribute('aria-expanded','true');
    control.querySelector('[data-sky-time-panel]')?.removeAttribute('hidden');
  }
  function close(control){
    if(!control)return;
    control.classList.remove('is-open');
    control.querySelector('[data-sky-time-display]')?.setAttribute('aria-expanded','false');
    control.querySelector('[data-sky-time-panel]')?.setAttribute('hidden','');
  }
  function syncFromCanonical(input){
    const control=input.__skyTimeControl;
    if(!control)return;
    setState(control,parseCanonical(input.value));
    syncVisual(control);
  }

  function enhance(input){
    if(!(input instanceof HTMLInputElement)||input.dataset.skyTimeEnhanced==='true')return;
    input.dataset.skyTimeEnhanced='true';
    input.type='hidden';
    input.hidden=true;
    input.setAttribute('aria-hidden','true');

    const initial=parseCanonical(input.value);
    const control=document.createElement('div');
    control.className='sky-time-control';
    control.__canonicalInput=input;
    input.__skyTimeControl=control;
    setState(control,initial);

    const hours=Array.from({length:12},(_,index)=>String(index+1))
      .map(hour=>`<button type="button" class="sky-time-choice sky-time-hour" data-sky-time-hour="${hour}" aria-pressed="false">${hour}</button>`).join('');
    control.innerHTML=`
      <button type="button" class="sky-time-display" data-sky-time-display aria-haspopup="dialog" aria-expanded="false"><span>Choose time</span><i aria-hidden="true"></i></button>
      <div class="sky-time-panel" data-sky-time-panel role="dialog" aria-label="Choose local time" hidden>
        <div class="sky-time-hour-grid" role="group" aria-label="Hour">${hours}</div>
        <div class="sky-time-compact-row">
          <input class="sky-time-minute" type="text" inputmode="numeric" pattern="[0-5]?[0-9]" maxlength="2" autocomplete="off" data-sky-time-minute aria-label="Minute, 00 through 59" placeholder="00">
          <button type="button" class="sky-time-choice sky-time-period" data-sky-time-period="AM" aria-pressed="false">AM</button>
          <button type="button" class="sky-time-choice sky-time-period" data-sky-time-period="PM" aria-pressed="false">PM</button>
        </div>
      </div>`;
    input.insertAdjacentElement('afterend',control);
    syncVisual(control);
  }
  function enhanceAll(){document.querySelectorAll(TIME_SELECTOR).forEach(enhance)}

  document.addEventListener('click',event=>{
    const display=event.target.closest?.('[data-sky-time-display]');
    if(display){
      event.preventDefault();
      const control=display.closest('.sky-time-control');
      if(control?.classList.contains('is-open'))close(control);else if(control)open(control);
      return;
    }
    const hour=event.target.closest?.('[data-sky-time-hour]');
    if(hour){
      event.preventDefault();
      const control=hour.closest('.sky-time-control'),state=stateFor(control);
      state.hour=hour.dataset.skyTimeHour;
      setState(control,state);commit(control);syncVisual(control);
      return;
    }
    const period=event.target.closest?.('[data-sky-time-period]');
    if(period){
      event.preventDefault();
      const control=period.closest('.sky-time-control'),state=stateFor(control);
      state.period=period.dataset.skyTimePeriod;
      setState(control,state);commit(control);syncVisual(control);
      return;
    }
    document.querySelectorAll('.sky-time-control.is-open').forEach(control=>{if(!control.contains(event.target))close(control)});
    if(event.target.closest?.('[data-ww-action="apply-inference"]'))requestAnimationFrame(()=>document.querySelectorAll(TIME_SELECTOR).forEach(syncFromCanonical));
  },true);

  document.addEventListener('input',event=>{
    const minute=event.target.closest?.('[data-sky-time-minute]');
    if(!minute)return;
    minute.value=minute.value.replace(/\D/g,'').slice(0,2);
    const control=minute.closest('.sky-time-control'),state=stateFor(control);
    const value=Number(minute.value);
    state.minute=minute.value!==''&&Number.isInteger(value)&&value>=0&&value<=59?minute.value:'';
    setState(control,state);commit(control);syncVisual(control);
  },true);
  document.addEventListener('blur',event=>{
    const minute=event.target.closest?.('[data-sky-time-minute]');
    if(!minute)return;
    const control=minute.closest('.sky-time-control'),state=stateFor(control),value=Number(minute.value);
    if(minute.value!==''&&Number.isInteger(value)&&value>=0&&value<=59)state.minute=pad(value);
    else if(minute.value!=='')state.minute='';
    setState(control,state);commit(control);syncVisual(control);
  },true);
  document.addEventListener('keydown',event=>{
    const control=event.target.closest?.('.sky-time-control');
    if(!control)return;
    if(event.key==='Escape'){
      event.preventDefault();close(control);control.querySelector('[data-sky-time-display]')?.focus({preventScroll:true});
    } else if(event.key==='Enter'&&event.target.matches?.('[data-sky-time-minute]')&&commit(control)){
      event.preventDefault();close(control);control.querySelector('[data-sky-time-display]')?.focus({preventScroll:true});
    }
  },true);

  function start(){
    enhanceAll();
    const root=document.getElementById('skyFoundationRoot')||document.body;
    observer=new MutationObserver(records=>{if(records.some(record=>record.addedNodes.length))requestAnimationFrame(enhanceAll)});
    observer.observe(root,{childList:true,subtree:true});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
