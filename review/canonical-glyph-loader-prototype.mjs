const LEGAL_STATES=new Set(['plain','circled','day-ruler','hour-ruler','day-and-hour-ruler']);
const FORBIDDEN=/<(?:text|script|foreignObject|image|filter|mask|clipPath|symbol|use|animate|style)\b|\btransform\s*=|\bfont[-\w]*\s*=|\b(?:href|src)\s*=/i;
const SHA=/^[a-f0-9]{64}$/;

export class CanonicalGlyphLoadError extends Error {
  constructor(code,message,details={}){super(message);this.name='CanonicalGlyphLoadError';this.code=code;this.details=details;}
}

const fail=(code,message,details)=>{throw new CanonicalGlyphLoadError(code,message,details);};
const joinUrl=(base,relative)=>new URL(relative,new URL('.',base)).href;

async function digest(bytes,cryptoImpl){const hash=await cryptoImpl.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function fetchExact(url,expected,fetchImpl,cryptoImpl,code){let response;try{response=await fetchImpl(url);}catch(error){fail(code,`Could not load ${url}.`,{cause:error.message});}if(!response?.ok)fail(code,`Could not load ${url}: HTTP ${response?.status??'unknown'}.`);const bytes=await response.arrayBuffer();const actual=await digest(bytes,cryptoImpl);if(!SHA.test(expected)||actual!==expected)fail('HASH_MISMATCH',`SHA-256 mismatch for ${url}.`,{expected,actual});return new TextDecoder().decode(bytes);}
function parseSvg(source,label,documentImpl){if(FORBIDDEN.test(source))fail('PROHIBITED_SVG',`${label} contains prohibited markup.`);const parsed=new documentImpl.defaultView.DOMParser().parseFromString(source,'image/svg+xml');if(parsed.querySelector('parsererror'))fail('MALFORMED_SVG',`${label} is malformed.`);const svg=parsed.documentElement;if(svg.localName!=='svg'||svg.getAttribute('viewBox')!=='0 0 100 100')fail('INVALID_VIEWBOX',`${label} must preserve viewBox="0 0 100 100".`);return documentImpl.importNode(svg,true);}

export function createCanonicalGlyphLoader({manifestUrl='../assets/canonical-glyphs/v1/manifest.json',fetchImpl=globalThis.fetch,documentImpl=globalThis.document,cryptoImpl=globalThis.crypto}={}){
  manifestUrl=new URL(manifestUrl,documentImpl.baseURI).href;
  let manifestPromise;
  async function manifest(){if(!manifestPromise)manifestPromise=(async()=>{let response;try{response=await fetchImpl(manifestUrl);}catch(error){fail('MANIFEST_LOAD_FAILED','Canonical manifest could not be loaded.',{cause:error.message});}if(!response?.ok)fail('MANIFEST_LOAD_FAILED',`Canonical manifest returned HTTP ${response?.status??'unknown'}.`);let value;try{value=await response.json();}catch{fail('MALFORMED_MANIFEST','Canonical manifest is not valid JSON.');}if(!Array.isArray(value.identities)||value.identities.length!==93||!Array.isArray(value.states))fail('MALFORMED_MANIFEST','Canonical manifest structure is invalid.');return value;})();return manifestPromise;}
  async function loadCanonicalGlyph(identity,{state='plain'}={}){
    if(!LEGAL_STATES.has(state))fail('UNKNOWN_STATE',`Unknown canonical glyph state: ${state}`);
    const data=await manifest();
    const entry=data.identities.find(row=>row.canonical_identity===identity);
    if(!entry)fail('UNKNOWN_IDENTITY',`Unknown canonical glyph identity: ${identity}`);
    if(!entry.candidate_path||!entry.candidate_sha256)fail('MASTER_UNAVAILABLE',`Canonical master is unavailable: ${identity}`,{blocker:entry.blocker||null});
    const stateEntry=data.states.find(row=>row.state===state);
    if(!stateEntry)fail('UNKNOWN_STATE',`State is absent from manifest: ${state}`);
    if(state!=='plain'&&(!stateEntry.overlay_path||!stateEntry.sha256))fail('OVERLAY_UNAVAILABLE',`Canonical overlay is unavailable: ${state}`,{blocker:stateEntry.blocker||null});
    const masterUrl=joinUrl(manifestUrl,entry.candidate_path);
    const overlayUrl=state==='plain'?null:joinUrl(manifestUrl,stateEntry.overlay_path);
    const [masterSource,overlaySource]=await Promise.all([
      fetchExact(masterUrl,entry.candidate_sha256,fetchImpl,cryptoImpl,'MASTER_LOAD_FAILED'),
      overlayUrl?fetchExact(overlayUrl,stateEntry.sha256,fetchImpl,cryptoImpl,'OVERLAY_LOAD_FAILED'):Promise.resolve(null)
    ]);
    const master=parseSvg(masterSource,`Master ${identity}`,documentImpl);
    const overlay=overlaySource?parseSvg(overlaySource,`Overlay ${state}`,documentImpl):null;
    const host=documentImpl.createElement('span');host.className='canonical-glyph-prototype';host.dataset.identity=identity;host.dataset.state=state;host.dataset.sourceStatus=entry.status;host.setAttribute('role','img');host.setAttribute('aria-label',entry.display_name||identity);if(entry.status==='approved-with-documented-raster-difference')host.setAttribute('aria-description','Approved with documented raster difference');
    if(overlay){overlay.classList.add('canonical-glyph-prototype__overlay');overlay.setAttribute('aria-hidden','true');host.append(overlay);}
    master.classList.add('canonical-glyph-prototype__master');master.setAttribute('aria-hidden','true');host.append(master);
    return host;
  }
  async function getCanonicalPackageSummary(){const data=await manifest();const available=data.identities.filter(entry=>entry.status==='exact-static-candidate'||entry.status==='approved-with-documented-raster-difference').length;return Object.freeze({available,unavailable:data.identities.length-available,total:data.identities.length});}
  return Object.freeze({loadCanonicalGlyph,getCanonicalPackageSummary});
}

const defaultLoader=typeof document!=='undefined'?createCanonicalGlyphLoader():null;
export const loadCanonicalGlyph=(identity,options)=>{if(!defaultLoader)fail('DOM_UNAVAILABLE','The review loader requires a browser DOM.');return defaultLoader.loadCanonicalGlyph(identity,options);};
export const getCanonicalPackageSummary=()=>{if(!defaultLoader)fail('DOM_UNAVAILABLE','The review loader requires a browser DOM.');return defaultLoader.getCanonicalPackageSummary();};
