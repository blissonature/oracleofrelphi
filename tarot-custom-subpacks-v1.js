// On-the-fly custom sub-packs for Tarot Ledger and Drawing Board.
(function(){
  'use strict';
  if(window.RelphiCustomSubpacks)return;
  const KEY='relphiCustomSubpacksV1';
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const read=()=>{try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value:[]}catch(_){return[]}};
  const write=packs=>{try{localStorage.setItem(KEY,JSON.stringify(packs))}catch(_){}};
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  let dialog=null;

  function savePack(pack){
    const packs=read();
    const index=packs.findIndex(item=>item.id===pack.id);
    if(index>=0)packs[index]=pack;else packs.push(pack);
    write(packs);
    window.dispatchEvent(new CustomEvent('relphi:subpacks-changed',{detail:{pack}}));
    return pack;
  }
  function remove(id){
    write(read().filter(pack=>pack.id!==id));
    window.dispatchEvent(new CustomEvent('relphi:subpacks-changed',{detail:{id,deleted:true}}));
  }
  function close(){dialog?.remove();dialog=null}

  function open({packId='',onSave=null}={}){
    close();
    const prior=read().find(pack=>pack.id===packId);
    const draft={id:prior?.id||uid(),name:prior?.name||'',cardIds:[...(prior?.cardIds||[])]};
    dialog=document.createElement('dialog');
    dialog.className='relphi-subpack-builder';
    dialog.setAttribute('aria-label',prior?'Edit sub-pack':'Create sub-pack');
    dialog.innerHTML='<form method="dialog" class="relphi-subpack-builder-card">'+
      '<header><div><span class="eyebrow">Sub-pack</span><h3>'+(prior?'Edit':'Create')+' sub-pack</h3></div><button type="button" data-subpack-close aria-label="Close">×</button></header>'+
      '<label>Name<input type="text" data-subpack-name maxlength="60" autocomplete="off" value="'+esc(draft.name)+'" placeholder="Name this sub-pack"></label>'+
      '<label>Search Tarot Ledger<input type="search" data-subpack-search autocomplete="off" placeholder="Try Sun, protection, prince, Leo"></label>'+
      '<div class="relphi-subpack-results" data-subpack-results><p>Search the existing Tarot Ledger index to find cards.</p></div>'+
      '<section class="relphi-subpack-members"><div><strong>Members</strong><span data-subpack-count>'+draft.cardIds.length+' selected</span></div><div data-subpack-members></div></section>'+
      '<footer>'+(prior?'<button type="button" data-subpack-delete>Delete</button>':'')+'<span></span><button type="button" data-subpack-cancel>Cancel</button><button type="button" class="primary" data-subpack-save disabled>Done</button></footer>'+
    '</form>';
    document.body.appendChild(dialog);
    const name=dialog.querySelector('[data-subpack-name]');
    const search=dialog.querySelector('[data-subpack-search]');
    const results=dialog.querySelector('[data-subpack-results]');
    const members=dialog.querySelector('[data-subpack-members]');
    const count=dialog.querySelector('[data-subpack-count]');
    const done=dialog.querySelector('[data-subpack-save]');
    let current=[];

    const titleFor=id=>window.RelphiTarotLedgerBridge?.titleFor?.(id)||id;
    const sync=()=>{
      count.textContent=draft.cardIds.length+' selected';
      done.disabled=!draft.name.trim()||!draft.cardIds.length;
      members.innerHTML=draft.cardIds.length?draft.cardIds.map(id=>'<button type="button" data-member-remove="'+esc(id)+'">'+esc(titleFor(id))+' ×</button>').join(''):'<p>No cards selected yet.</p>';
      members.querySelectorAll('[data-member-remove]').forEach(button=>button.addEventListener('click',()=>{draft.cardIds=draft.cardIds.filter(id=>id!==button.dataset.memberRemove);renderResults();sync()}));
    };
    const renderResults=()=>{
      const q=search.value.trim();
      current=q?(window.RelphiTarotLedgerBridge?.searchCards?.(q,60,'full')||[]):[];
      if(!q){results.innerHTML='<p>Search the existing Tarot Ledger index to find cards.</p>';return}
      if(!current.length){results.innerHTML='<p>No matching cards.</p>';return}
      const unselected=current.filter(card=>!draft.cardIds.includes(card.card_id));
      results.innerHTML='<div class="relphi-subpack-result-head"><span>'+current.length+' result'+(current.length===1?'':'s')+'</span><button type="button" data-subpack-add-all '+(!unselected.length?'disabled':'')+'>Add all results</button></div>'+
        current.map(card=>'<button type="button" class="relphi-subpack-result" data-subpack-card="'+esc(card.card_id)+'" aria-pressed="'+String(draft.cardIds.includes(card.card_id))+'"><img src="'+esc(card.image||'')+'" alt=""><span>'+esc(card.title||card.card_id)+'</span><b>'+(draft.cardIds.includes(card.card_id)?'✓':'+')+'</b></button>').join('');
      results.querySelector('[data-subpack-add-all]')?.addEventListener('click',()=>{draft.cardIds=[...new Set([...draft.cardIds,...current.map(card=>card.card_id)])];renderResults();sync()});
      results.querySelectorAll('[data-subpack-card]').forEach(button=>button.addEventListener('click',()=>{
        const id=button.dataset.subpackCard;
        draft.cardIds=draft.cardIds.includes(id)?draft.cardIds.filter(value=>value!==id):[...draft.cardIds,id];
        renderResults();sync();
      }));
    };
    name.addEventListener('input',()=>{draft.name=name.value;sync()});
    search.addEventListener('input',renderResults);
    dialog.querySelector('[data-subpack-close]').addEventListener('click',close);
    dialog.querySelector('[data-subpack-cancel]').addEventListener('click',close);
    dialog.querySelector('[data-subpack-delete]')?.addEventListener('click',()=>{remove(draft.id);close()});
    done.addEventListener('click',()=>{draft.name=name.value.trim();const saved=savePack(draft);close();if(typeof onSave==='function')onSave({...saved})});
    dialog.addEventListener('cancel',event=>{event.preventDefault();close()});
    sync();
    dialog.showModal();
    name.focus();
  }

  window.RelphiCustomSubpacks=Object.freeze({
    all:()=>read().map(pack=>({...pack,cardIds:[...(pack.cardIds||[])]})),
    byId:id=>{const pack=read().find(item=>item.id===id);return pack?{...pack,cardIds:[...(pack.cardIds||[])]}:null},
    open,
    remove
  });
})();
