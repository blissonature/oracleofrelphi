const nodes={linkAddresses:document.getElementById('addresses'),linkDates:document.getElementById('dates'),dateOrder:document.getElementById('dateOrder')};
const status=document.getElementById('status');
chrome.storage.local.get({linkAddresses:false,linkDates:false,dateOrder:'unambiguous'},data=>{
  nodes.linkAddresses.checked=!!data.linkAddresses;nodes.linkDates.checked=!!data.linkDates;nodes.dateOrder.value=data.dateOrder;
});
async function save(){
  await chrome.storage.local.set({linkAddresses:nodes.linkAddresses.checked,linkDates:nodes.linkDates.checked,dateOrder:nodes.dateOrder.value});
  status.textContent='Saved. Open pages will update.';
}
Object.values(nodes).forEach(element=>element.addEventListener('change',()=>{void save()}));
