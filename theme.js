const THEME_KEY = 'investhood_dashboard_theme';

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark-mode', isDark);
  const button = document.getElementById('themeToggleBtn');
  if (button) button.textContent = isDark ? 'Light Mode' : 'Dark Mode';
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(saved);
}

document.addEventListener('click', event => {
  if (event.target.id !== 'themeToggleBtn') return;
  const isDark = document.body.classList.contains('dark-mode');
  const nextTheme = isDark ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme(nextTheme);
});

window.addEventListener('load', loadTheme);
