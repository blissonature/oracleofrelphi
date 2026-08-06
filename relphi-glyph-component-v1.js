(function(){
  'use strict';
  if(window.RelphiGlyphComponent)return;

  const SVG_NS='http://www.w3.org/2000/svg';
  const BLACK=new Set(['#111','#111111','rgb(17, 17, 17)']);

  function setStyleProperty(node,property,value){
    const current=node.getAttribute('style')||'';
    const pattern=new RegExp('(^|;)\\s*'+property+'\\s*:[^;]*','i');
    const declaration=property+': '+value;
    node.setAttribute('style',pattern.test(current)?current.replace(pattern,(match,prefix)=>prefix+declaration):(current.trim()?current.replace(/;?\s*$/,'; ')+declaration:declaration));
  }

  function canonicalEntry(identity){
    const registry=window.RelphiGlyphRegistry;
    return registry?.get(identity)||registry?.resolve(identity)||null;
  }

  function cloneMaster(id){
    const markup=window.RelphiGlyphMasters?.get(id);
    if(!markup)return null;
    const documentNode=new DOMParser().parseFromString(markup,'text/html');
    const root=documentNode.body.firstElementChild;
    if(!root||root.namespaceURI!==SVG_NS)return null;
    return document.importNode(root,true);
  }

  function recolor(root,color){
    if(!root||!color)return root;
    root.querySelectorAll('[fill],[stroke]').forEach(node=>{
      for(const attribute of ['fill','stroke']){
        const value=(node.getAttribute(attribute)||'').trim().toLowerCase();
        if(BLACK.has(value))node.setAttribute(attribute,color);
      }
      const style=node.getAttribute('style')||'';
      const nextStyle=style.replace(/(fill|stroke)\s*:\s*(?:#111111|#111|rgb\(17,\s*17,\s*17\))/gi,(match,property)=>property+': '+color);
      if(nextStyle!==style)node.setAttribute('style',nextStyle);
    });
    return root;
  }

  function setCircle(root,shown){
    const circle=root?.querySelector('.relphi-glyph-bubble > circle[aria-hidden="true"]');
    if(circle)setStyleProperty(circle,'opacity',shown?'1':'0');
    return root;
  }

  function sizeCanvas(root,parent,size){
    const numeric=Number(size);
    if(!Number.isFinite(numeric)||numeric<=0)return;
    root.setAttribute('width',String(numeric));
    root.setAttribute('height',String(numeric));
    if(parent.namespaceURI===SVG_NS){
      root.setAttribute('x',String(-numeric/2));
      root.setAttribute('y',String(-numeric/2));
    }else{
      setStyleProperty(root,'width',numeric+'px');
      setStyleProperty(root,'height',numeric+'px');
    }
  }

  function visibleFailure(parent,identity){
    const id=String(identity||'unknown');
    parent.replaceChildren();
    parent.classList.add('relphi-glyph-missing');
    parent.dataset.missingCanonicalGlyph=id;
    if(parent.namespaceURI===SVG_NS){
      const text=document.createElementNS(SVG_NS,'text');
      text.setAttribute('x','0');
      text.setAttribute('y','0');
      text.setAttribute('text-anchor','middle');
      text.setAttribute('dominant-baseline','central');
      text.setAttribute('fill','#b42318');
      text.setAttribute('font-size','6');
      text.textContent='MISSING: '+id;
      parent.appendChild(text);
    }else{
      const text=document.createElement('span');
      text.className='relphi-glyph-missing-message';
      text.textContent='Missing canonical glyph: '+id;
      parent.appendChild(text);
    }
    throw new Error('Missing canonical glyph master: '+id);
  }

  function mount(parent,identity,options={}){
    if(!parent)throw new Error('A glyph mount target is required.');
    const entry=canonicalEntry(identity);
    const root=entry&&cloneMaster(entry.id);
    if(!entry||!root)return visibleFailure(parent,identity);
    parent.replaceChildren();
    parent.classList.remove('relphi-glyph-missing');
    delete parent.dataset.missingCanonicalGlyph;
    root.classList.add('relphi-glyph-instance');
    root.setAttribute('data-glyph-id',entry.id);
    setCircle(root,options.circle!==false);
    recolor(root,options.color);
    sizeCanvas(root,parent,options.size);
    if(options.label===false){root.setAttribute('aria-hidden','true');root.removeAttribute('aria-label')}
    parent.appendChild(root);
    return root;
  }

  window.RelphiGlyphComponent=Object.freeze({mount,recolor,setCircle,canonicalSource:'glyphs-unified-preview.html'});
})();
