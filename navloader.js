function loadNav() {
  fetch("nav.html")
    .then(function(response){ return response.text(); })
    .then(function(data){
      var container = document.getElementById("nav-placeholder");
      if (container) container.innerHTML = data;
    })
    .catch(function(e){ console.error("Failed to load nav:", e); });
}
document.addEventListener("DOMContentLoaded", loadNav);

function toggleMenu() {
  var menu = document.getElementById('menu');
  if (menu) {
    menu.classList.toggle('active');
  }
}
