export const appearanceStorageKey = 'nexttask:appearance';

export const defaultAppearanceSettings = {
  theme: 'system',
  density: 'comfortable',
  startView: 'dashboard',
  sidebarDefault: 'expanded',
  dateFormat: 'long',
  fontSize: 'normal',
  projectBackgrounds: {},
  reduceMotion: false,
};

export const boardBackgroundOptions = [
  {
    value: 'aurora',
    label: 'Aurora',
    background: 'radial-gradient(circle at top, rgba(157,112,242,0.65), rgba(99,79,219,0.92) 38%, rgba(193,92,195,0.85) 100%)',
  },
  {
    value: 'ocean',
    label: 'Ozean',
    background: 'linear-gradient(135deg, #0f766e 0%, #2563eb 52%, #172554 100%)',
  },
  {
    value: 'forest',
    label: 'Wald',
    background: 'linear-gradient(135deg, #14532d 0%, #15803d 48%, #84cc16 100%)',
  },
  {
    value: 'sunset',
    label: 'Sunset',
    background: 'linear-gradient(135deg, #be123c 0%, #f97316 50%, #facc15 100%)',
  },
];

export function getStoredAppearanceSettings() {
  if (typeof window === 'undefined') return defaultAppearanceSettings;

  try {
    const storedSettings = window.localStorage.getItem(appearanceStorageKey);
    if (!storedSettings) return defaultAppearanceSettings;

    return {
      ...defaultAppearanceSettings,
      ...JSON.parse(storedSettings),
    };
  } catch {
    return defaultAppearanceSettings;
  }
}

export function applyAppearanceTheme(theme) {
  if (typeof document === 'undefined') return;

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const resolvedDark = theme === 'dark' || (theme === 'system' && prefersDark);

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
  document.documentElement.dataset.fontSize = nextSettings.fontSize;
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

export function getBoardBackgroundValue(settings, projectId) {
  const nextSettings = {
    ...defaultAppearanceSettings,
    ...settings,
  };

  return nextSettings.projectBackgrounds?.[projectId] || boardBackgroundOptions[0].value;
}

export function getBoardBackgroundStyle(value) {
  return boardBackgroundOptions.find((option) => option.value === value)?.background || boardBackgroundOptions[0].background;
}
