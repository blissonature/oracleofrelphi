function loadNav() {
  fetch("nav.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("nav-placeholder").innerHTML = data;
    });
}
document.addEventListener("DOMContentLoaded", loadNav);

function toggleMenu() {
  const menu = document.getElementById('menu');
  menu.classList.toggle('active');
}