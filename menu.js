// menu.js
const menuContainer = document.getElementById('menuContainer');
const menuButton = document.getElementById('menuButton');
document.addEventListener('click', function(event) {
  // Toggle menu when logo is clicked
  if (menuButton.contains(event.target)) {
    menuContainer.classList.toggle('active');
  } else {
    // Close if clicked elsewhere
    menuContainer.classList.remove('active');
  }
});
// Accessibility: close with Escape key
document.addEventListener('keydown', function(event) {
  if (event.key === "Escape") {
    menuContainer.classList.remove('active');
  }
});
