
class RelphiNav {
  static init() {
    document.addEventListener("DOMContentLoaded", () => {
      const placeholder = document.getElementById("nav-placeholder");
      const injectNav = (html) => {
        if (placeholder) {
          placeholder.innerHTML = html;
        } else {
          // Fallback: inject at top of body
          const div = document.createElement("div");
          div.innerHTML = html;
          document.body.insertBefore(div, document.body.firstChild);
        }
        // Attach menu behavior
        if (!document.querySelector('script[src="menu.js"]')) {
          const s = document.createElement("script");
          s.src = "menu.js";
          document.body.appendChild(s);
        }
      };

      fetch("nav.html")
        .then(r => r.text())
        .then(injectNav)
        .catch(err => console.error("RelphiNav: failed to load nav.html", err));
    });
  }
}

// Initialize immediately
RelphiNav.init();
