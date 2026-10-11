// Theme Management for Haul: System, Light, and Dark Mode

export function getSavedTheme() {
  if (typeof window === 'undefined') return 'dark';
  return localStorage.getItem('hual_theme_mode') || 'dark';
}

let systemListener = null;

export function applyTheme(mode) {
  if (typeof window === 'undefined') return;

  const validMode = (mode === 'light' || mode === 'dark') ? mode : 'system';
  localStorage.setItem('hual_theme_mode', validMode);

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  if (systemListener) {
    try {
      mediaQuery.removeEventListener('change', systemListener);
    } catch {}
    systemListener = null;
  }

  if (validMode === 'system') {
    const isDark = mediaQuery.matches;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

    systemListener = (e) => {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    };
    try {
      mediaQuery.addEventListener('change', systemListener);
    } catch {
      mediaQuery.addListener(systemListener);
    }
  } else {
    document.documentElement.setAttribute('data-theme', validMode);
  }
}

export function initTheme() {
  const current = getSavedTheme();
  applyTheme(current);
  return current;
}
