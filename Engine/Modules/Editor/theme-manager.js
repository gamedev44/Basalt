/**
 * Basalt Theme Manager — Dockview theme switch + JSON custom themes
 * Persists selection to localStorage (basalt_theme).
 */

const THEME_STORAGE_KEY = 'basalt_theme';
const LAYOUT_PRESET_KEY = 'basalt_layout_preset';
const DOCKVIEW_ESM = 'https://esm.sh/dockview-core@4.13.1';

/** Built-in dockview theme map */
const DOCKVIEW_THEME_MAP = {
  themeDark: null,
  themeLight: null,
  themeVisualStudio: null,
  themeAbyss: null,
  themeDracula: null,
  themeReplit: null,
  themeLightSpaced: null,
  themeAbyssSpaced: null,
};

let themeCache = null;

/** Load themes from themes.json */
export async function loadThemesConfig() {
  if (themeCache) return themeCache;
  try {
    const base = import.meta.url ? new URL('.', import.meta.url).href : '';
    const res = await fetch(new URL('themes.json', base).href);
    const data = await res.json();
    themeCache = data;
    return data;
  } catch (_) {
    themeCache = { themes: [], custom: [] };
    return themeCache;
  }
}

/** Get stored theme id from localStorage */
export function getStoredThemeId() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
  } catch (_) {
    return 'dark';
  }
}

/** Store theme id to localStorage */
export function setStoredThemeId(id) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch (_) {}
}

/** Get dockview theme object by id (loads from dockview-core) */
export async function getDockviewTheme(dockviewThemeName) {
  if (!DOCKVIEW_THEME_MAP[dockviewThemeName]) {
    const mod = await import(/* @vite-ignore */ DOCKVIEW_ESM);
    DOCKVIEW_THEME_MAP[dockviewThemeName] = mod[dockviewThemeName] ?? mod.themeDark;
  }
  return DOCKVIEW_THEME_MAP[dockviewThemeName];
}

/** Get theme config by id from themes.json */
export async function getThemeConfig(themeId) {
  const config = await loadThemesConfig();
  const builtIn = config.themes?.find((t) => t.id === themeId);
  if (builtIn) return builtIn;
  const custom = config.custom?.find((t) => t.id === themeId);
  return custom ?? config.themes?.[0] ?? { id: 'dark', dockviewTheme: 'themeDark' };
}

/** Apply theme to dockview api and optionally apply CSS overrides */
export async function setTheme(themeId, dockviewApi) {
  const config = await getThemeConfig(themeId);
  if (!config) return;
  setStoredThemeId(themeId);
  const themeObj = await getDockviewTheme(config.dockviewTheme);
  if (dockviewApi?.updateOptions && themeObj) {
    dockviewApi.updateOptions({ theme: themeObj });
  }
  if (config.overrides && typeof document !== 'undefined') {
    const root = document.documentElement;
    Object.entries(config.overrides).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }
}

/** Theme options for UI (id, name) — built-in + custom from themes.json */
export const THEME_OPTIONS = [
  { id: 'dark', name: 'Dark' },
  { id: 'light', name: 'Light' },
  { id: 'visualStudio', name: 'Visual Studio' },
  { id: 'abyss', name: 'Abyss' },
  { id: 'dracula', name: 'Dracula' },
  { id: 'replit', name: 'Replit' },
  { id: 'lightSpaced', name: 'Light Spaced' },
  { id: 'abyssSpaced', name: 'Abyss Spaced' },
];

/** Get theme options including custom themes from themes.json */
export async function getThemeOptions() {
  const config = await loadThemesConfig();
  const builtIn = THEME_OPTIONS;
  const custom = (config.custom || []).map((t) => ({ id: t.id, name: t.name }));
  return [...builtIn, ...custom];
}

/** Get layout preset by id from themes.json */
export async function getLayoutPreset(presetId) {
  const config = await loadThemesConfig();
  return config.layoutPresets?.[presetId] ?? null;
}

/** Get stored layout preset id */
export function getStoredLayoutPresetId() {
  try {
    return localStorage.getItem(LAYOUT_PRESET_KEY) || 'ue5';
  } catch (_) {
    return 'ue5';
  }
}

/** Store layout preset id */
export function setStoredLayoutPresetId(id) {
  try {
    localStorage.setItem(LAYOUT_PRESET_KEY, id);
  } catch (_) {}
}

/** Get panel display name for a panel id given layout preset */
export async function getPanelDisplayName(panelId, presetId) {
  const preset = await getLayoutPreset(presetId || getStoredLayoutPresetId());
  return preset?.panelNames?.[panelId] ?? panelId;
}

const LAYOUT_PRESET_CSS_VARS = [
  '--basalt-panel-bg', '--basalt-bg', '--basalt-text', '--basalt-text-muted',
  '--basalt-border', '--basalt-accent', '--basalt-accent-hover',
];

/** Apply layout preset CSS overrides (colors, etc.) and body class for layout tweaks */
export async function applyLayoutPresetOverrides(presetId) {
  const id = presetId || getStoredLayoutPresetId();
  const preset = await getLayoutPreset(id);
  if (typeof document === 'undefined') return;
  document.body?.setAttribute('data-layout-preset', id);
  const root = document.documentElement;
  if (preset?.overrides && Object.keys(preset.overrides).length > 0) {
    Object.entries(preset.overrides).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  } else {
    LAYOUT_PRESET_CSS_VARS.forEach((key) => root.style.removeProperty(key));
  }
}

/** Layout preset options for UI */
export const LAYOUT_PRESET_OPTIONS = [
  { id: 'ue5', name: 'Unreal Engine 5' },
  { id: 'godot', name: 'Godot' },
  { id: 'unity', name: 'Unity' },
];
