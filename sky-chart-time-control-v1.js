// Hybrid local-time control for Sky Chart Where and When.
// The hidden canonical data-ww-field="time" input remains the HH:MM calculation authority.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyTimeControlV3)return;
  window.__relphiSkyTimeControlV1=true;
  window.__relphiSkyTimeControlV2=true;
  window.__relphiSkyTimeControlV3=true;

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
  function displayTime(state){return toCanonical(state)?`${state.hour}:${pad(state.minute)} ${state.period}`:''}

  function parseTypedTime(raw,currentState){
    const text=String(raw||'').trim().toUpperCase().replace(/\./g,'').replace(/\s+/g,' ');
    if(!text)return null;

    let match=text.match(/^(\d{1,2})\s*:\s*(\d{1,2})\s*([AP])?\s*M?$/);
    if(match){
      const hour=Number(match[1]),minute=Number(match[2]),period=match[3]?`${match[3]}M`:'';
      if(!Number.isInteger(minute)||minute<0||minute>59)return null;
      if(period){
        if(hour<1||hour>12)return null;
        return{hour:String(hour),minute:pad(minute),period};
      }
      if(hour>=0&&hour<=23){
        return parseCanonical(`${pad(hour)}:${pad(minute)}`);
      }
      return null;
    }

    match=text.match(/^(\d{1,2})\s*([AP])\s*M?$/);
    if(match){
      const hour=Number(match[1]);
      if(hour<1||hour>12)return null;
      return{hour:String(hour),minute:'00',period:`${match[2]}M`};
    }

    match=text.match(/^(\d{1,2})(\d{2})\s*([AP])\s*M?$/);
    if(match){
      const hour=Number(match[1]),minute=Number(match[2]);
      if(hour<1||hour>12||minute<0||minute>59)return null;
      return{hour:String(hour),minute:pad(minute),period:`${match[3]}M`};
    }

    // If the user edits only the hour while an AM/PM state already exists, preserve
    // the current minute/period rather than forcing an ambiguous new interpretation.
    match=text.match(/^(\d{1,2})$/);
    if(match&&currentState?.period){
      const hour=Number(match[1]);
      if(hour>=1&&hour<=12)return{hour:String(hour),minute:currentState.minute||'00',period:currentState.period};
    }
    return null;
  }

  function syncVisual(control,{preserveEntry=false}={}){
    const state=stateFor(control);
    const entry=control.querySelector('[data-sky-time-entry]');
    if(entry&&!preserveEntry)entry.value=displayTime(state);
    control.querySelectorAll('[data-sky-time-hour]').forEach(button=>{
      const active=button.dataset.skyTimeHour===state.hour;
      button.classList.toggle('is-selected',active);
      button.setAttribute('aria-selected',active?'true':'false');
    });
    control.querySelectorAll('[data-sky-time-minute]').forEach(button=>{
      const active=button.dataset.skyTimeMinute===state.minute;
      button.classList.toggle('is-selected',active);
      button.setAttribute('aria-selected',active?'true':'false');
    });
    control.querySelectorAll('[data-sky-time-period]').forEach(button=>{
      const active=button.dataset.skyTimePeriod===state.period;
      button.classList.toggle('is-selected',active);
      button.setAttribute('aria-selected',active?'true':'false');
    });
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
  function commitTyped(control){
    const entry=control.querySelector('[data-sky-time-entry]');
    if(!entry)return false;
    const parsed=parseTypedTime(entry.value,stateFor(control));
    entry.classList.toggle('is-invalid',!parsed);
    entry.setAttribute('aria-invalid',parsed?'false':'true');
    if(!parsed)return false;
    setState(control,parsed);
    commit(control);
    entry.classList.remove('is-invalid');
    entry.setAttribute('aria-invalid','false');
    return true;
  }

  function selectedButton(control,kind){
    const state=stateFor(control),value=kind==='hour'?state.hour:state.minute;
    const attr=kind==='hour'?'data-sky-time-hour':'data-sky-time-minute';
    return value?control.querySelector(`[${attr}="${CSS.escape(value)}"]`):null;
  }
  function updateScrollButtons(control,kind){
    const list=control.querySelector(`[data-sky-time-list="${kind}"]`);
    if(!list)return;
    const atStart=list.scrollTop<=1;
    const atEnd=list.scrollTop+list.clientHeight>=list.scrollHeight-1;
    control.querySelectorAll(`[data-sky-time-scroll="${kind}"]`).forEach(button=>{
      const direction=Number(button.dataset.direction||0);
      button.disabled=direction<0?atStart:atEnd;
    });
  }
  function centerSelection(control,kind,behavior='auto'){
    const selected=selectedButton(control,kind);
    selected?.scrollIntoView({block:'center',inline:'nearest',behavior});
    requestAnimationFrame(()=>updateScrollButtons(control,kind));
  }
  function open(control){
    document.querySelectorAll('.sky-time-control.is-open').forEach(other=>{if(other!==control)close(other)});
    control.classList.add('is-open');
    control.querySelector('[data-sky-time-toggle]')?.setAttribute('aria-expanded','true');
    control.querySelector('[data-sky-time-panel]')?.removeAttribute('hidden');
    requestAnimationFrame(()=>{
      centerSelection(control,'hour');
      centerSelection(control,'minute');
    });
  }
  function close(control){
    if(!control)return;
    control.classList.remove('is-open');
    control.querySelector('[data-sky-time-toggle]')?.setAttribute('aria-expanded','false');
    control.querySelector('[data-sky-time-panel]')?.setAttribute('hidden','');
  }
  function syncFromCanonical(input){
    const control=input.__skyTimeControl;
    if(!control)return;
    setState(control,parseCanonical(input.value));
    syncVisual(control);
  }
  function scrollList(control,kind,direction){
    const list=control.querySelector(`[data-sky-time-list="${kind}"]`);
    if(!list)return;
    const sample=list.querySelector('.sky-time-list-option');
    const step=(sample?.getBoundingClientRect().height||30)+4;
    list.scrollBy({top:step*direction,behavior:'smooth'});
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
      .map(hour=>`<button type="button" class="sky-time-list-option" data-sky-time-hour="${hour}" role="option" aria-selected="false">${hour}</button>`).join('');
    const minutes=Array.from({length:60},(_,index)=>pad(index))
      .map(minute=>`<button type="button" class="sky-time-list-option" data-sky-time-minute="${minute}" role="option" aria-selected="false">${minute}</button>`).join('');

    control.innerHTML=`
      <div class="sky-time-entry-shell">
        <input class="sky-time-entry" type="text" inputmode="text" autocomplete="off" spellcheck="false" data-sky-time-entry aria-label="Local time. Type a time such as 8:15 PM, or use the picker." placeholder="8:15 PM">
        <button type="button" class="sky-time-toggle" data-sky-time-toggle aria-haspopup="dialog" aria-expanded="false" aria-label="Open time picker"><i aria-hidden="true"></i></button>
      </div>
      <div class="sky-time-panel" data-sky-time-panel role="dialog" aria-label="Choose local time" hidden>
        <div class="sky-time-wheel-column" data-kind="hour">
          <span class="sky-time-column-label">Hour</span>
          <button type="button" class="sky-time-scroll-arrow sky-time-scroll-arrow--up" data-sky-time-scroll="hour" data-direction="-1" aria-label="Scroll hours up"><i aria-hidden="true"></i></button>
          <div class="sky-time-scroll-list" data-sky-time-list="hour" role="listbox" aria-label="Hour">${hours}</div>
          <button type="button" class="sky-time-scroll-arrow sky-time-scroll-arrow--down" data-sky-time-scroll="hour" data-direction="1" aria-label="Scroll hours down"><i aria-hidden="true"></i></button>
        </div>
        <div class="sky-time-wheel-column" data-kind="minute">
          <span class="sky-time-column-label">Minute</span>
          <button type="button" class="sky-time-scroll-arrow sky-time-scroll-arrow--up" data-sky-time-scroll="minute" data-direction="-1" aria-label="Scroll minutes up"><i aria-hidden="true"></i></button>
          <div class="sky-time-scroll-list" data-sky-time-list="minute" role="listbox" aria-label="Minute">${minutes}</div>
          <button type="button" class="sky-time-scroll-arrow sky-time-scroll-arrow--down" data-sky-time-scroll="minute" data-direction="1" aria-label="Scroll minutes down"><i aria-hidden="true"></i></button>
        </div>
        <div class="sky-time-wheel-column sky-time-period-column" data-kind="period">
          <span class="sky-time-column-label">Period</span>
          <div class="sky-time-period-list" role="listbox" aria-label="AM or PM">
            <button type="button" class="sky-time-list-option" data-sky-time-period="AM" role="option" aria-selected="false">AM</button>
            <button type="button" class="sky-time-list-option" data-sky-time-period="PM" role="option" aria-selected="false">PM</button>
          </div>
        </div>
      </div>`;
    input.insertAdjacentElement('afterend',control);
    syncVisual(control);
  }
  function enhanceAll(){document.querySelectorAll(TIME_SELECTOR).forEach(enhance)}

  document.addEventListener('click',event=>{
    const toggle=event.target.closest?.('[data-sky-time-toggle]');
    if(toggle){
      event.preventDefault();
      const control=toggle.closest('.sky-time-control');
      if(control?.classList.contains('is-open'))close(control);else if(control)open(control);
      return;
    }
    const arrow=event.target.closest?.('[data-sky-time-scroll]');
    if(arrow){
      event.preventDefault();
      const control=arrow.closest('.sky-time-control');
      scrollList(control,arrow.dataset.skyTimeScroll,Number(arrow.dataset.direction||0));
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
    const minute=event.target.closest?.('[data-sky-time-minute]');
    if(minute){
      event.preventDefault();
      const control=minute.closest('.sky-time-control'),state=stateFor(control);
      state.minute=minute.dataset.skyTimeMinute;
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
    const entry=event.target.closest?.('[data-sky-time-entry]');
    if(!entry)return;
    entry.classList.remove('is-invalid');
    entry.setAttribute('aria-invalid','false');
  },true);

  document.addEventListener('blur',event=>{
    const entry=event.target.closest?.('[data-sky-time-entry]');
    if(!entry)return;
    const control=entry.closest('.sky-time-control');
    if(!commitTyped(control))syncVisual(control);
  },true);

  document.addEventListener('keydown',event=>{
    const control=event.target.closest?.('.sky-time-control');
    if(!control)return;
    if(event.key==='Escape'){
      event.preventDefault();
      syncVisual(control);
      close(control);
      control.querySelector('[data-sky-time-entry]')?.focus({preventScroll:true});
      return;
    }
    if(event.key==='Enter'&&event.target.matches?.('[data-sky-time-entry]')){
      event.preventDefault();
      if(commitTyped(control))close(control);
    }
  },true);

  document.addEventListener('scroll',event=>{
    const list=event.target.closest?.('[data-sky-time-list]');
    if(!list)return;
    const control=list.closest('.sky-time-control');
    updateScrollButtons(control,list.dataset.skyTimeList);
  },true);

  function start(){
    enhanceAll();
    const root=document.getElementById('skyFoundationRoot')||document.body;
    observer=new MutationObserver(records=>{if(records.some(record=>record.addedNodes.length))requestAnimationFrame(enhanceAll)});
    observer.observe(root,{childList:true,subtree:true});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
