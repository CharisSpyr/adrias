const toggle = document.getElementById("theme-toggle");
if (toggle) {
  const root = document.documentElement;

  // Load saved theme from localStorage
  const savedTheme = localStorage.getItem("theme") || "dark";
  root.setAttribute("data-theme", savedTheme);
  toggle.textContent = savedTheme === "light" ? "🌞" : "🌙";

  // Toggle theme on click
  toggle.addEventListener("click", () => {
    const current = root.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    toggle.textContent = next === "light" ? "🌞" : "🌙";
  });
}
