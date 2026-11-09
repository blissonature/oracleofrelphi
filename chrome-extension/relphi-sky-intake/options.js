const nodes={linkAddresses:document.getElementById('addresses'),linkDates:document.getElementById('dates'),dateOrder:document.getElementById('dateOrder'),target:document.getElementById('target')};
const status=document.getElementById('status');
chrome.storage.local.get({linkAddresses:false,linkDates:false,dateOrder:'unambiguous',target:'preview'},data=>{
  nodes.linkAddresses.checked=!!data.linkAddresses;nodes.linkDates.checked=!!data.linkDates;nodes.dateOrder.value=data.dateOrder;nodes.target.value=data.target||'preview';
});
async function save(){
  await chrome.storage.local.set({linkAddresses:nodes.linkAddresses.checked,linkDates:nodes.linkDates.checked,dateOrder:nodes.dateOrder.value,target:nodes.target.value});
  status.textContent='Saved. Open pages will update.';
}
Object.values(nodes).forEach(element=>element.addEventListener('change',()=>{void save()}));
