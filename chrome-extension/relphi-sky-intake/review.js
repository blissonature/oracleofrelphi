const engine=RelphiSkyRecognizer,source=document.getElementById('selection'),report=document.getElementById('report'),status=document.getElementById('status'),button=document.getElementById('open');
const args=new URLSearchParams(location.hash.slice(1));source.value=args.get('text')||'';status.textContent=args.get('reason')||'';history.replaceState(history.state,'',location.pathname);
let dateOrder='unambiguous';
chrome.storage.local.get({dateOrder:'unambiguous'},data=>{dateOrder=data.dateOrder;check()});
function check(){
  const value=engine.recognize(source.value,{dateOrder});
  report.textContent=['Date: '+(value.date||'Not identified'),'Time: '+(value.timeUnknown?'Unknown':value.time||'Not identified'),'Location: '+(value.location||'Not identified'),...value.errors].join('\n');
  button.disabled=!value.hasAny||value.errors.length>0;
}
source.addEventListener('input',check);
button.addEventListener('click',()=>{const value=engine.recognize(source.value,{dateOrder});if(value.hasAny&&!value.errors.length)location.href=engine.skyURL(value);else check()});
check();
