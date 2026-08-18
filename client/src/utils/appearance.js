export const appearanceStorageKey = 'nexttask:appearance';

export const defaultAppearanceSettings = {
  theme: 'light',
  density: 'comfortable',
  startView: 'dashboard',
  sidebarDefault: 'expanded',
  dateFormat: 'long',
  fontScale: 100,
  reduceMotion: false,
};

export function getStoredAppearanceSettings() {
  if (typeof window === 'undefined') return defaultAppearanceSettings;

  try {
    const storedSettings = window.localStorage.getItem(appearanceStorageKey);
    if (!storedSettings) return defaultAppearanceSettings;

    const settings = {
      ...defaultAppearanceSettings,
      ...JSON.parse(storedSettings),
    };
    return {
      ...settings,
      theme: settings.theme === 'dark' ? 'dark' : 'light',
      fontScale: settings.fontScale || (settings.fontSize === 'large' ? 112 : 100),
    };
  } catch {
    return defaultAppearanceSettings;
  }
}

export function applyAppearanceTheme(theme) {
  if (typeof document === 'undefined') return;

  const resolvedDark = theme === 'dark';

  document.documentElement.classList.toggle('dark', Boolean(resolvedDark));
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themeResolved = resolvedDark ? 'dark' : 'light';
}

export function applyAppearanceSettings(settings) {
  if (typeof document === 'undefined') return;

  const nextSettings = {
    ...defaultAppearanceSettings,
    ...settings,
  };

  applyAppearanceTheme(nextSettings.theme);
  document.documentElement.dataset.layoutDensity = nextSettings.density;
  document.documentElement.dataset.sidebarDefault = nextSettings.sidebarDefault;
  document.documentElement.style.fontSize = `${nextSettings.fontScale || 100}%`;
  document.documentElement.dataset.reduceMotion = String(nextSettings.reduceMotion);
}

export function storeAppearanceSettings(settings) {
  if (typeof window === 'undefined') return settings;

  const nextSettings = {
    ...defaultAppearanceSettings,
    ...settings,
  };

  window.localStorage.setItem(appearanceStorageKey, JSON.stringify(nextSettings));
  applyAppearanceSettings(nextSettings);
  window.dispatchEvent(new CustomEvent('nexttask:appearance-change', { detail: nextSettings }));

  return nextSettings;
}

export function formatAppearanceDate(value, dateFormat = defaultAppearanceSettings.dateFormat) {
  if (!value) return 'Noch nicht erfasst';

  const options =
    dateFormat === 'numeric'
      ? { day: '2-digit', month: '2-digit', year: 'numeric' }
      : { day: '2-digit', month: 'long', year: 'numeric' };

  return new Intl.DateTimeFormat('de-DE', options).format(new Date(value));
}
