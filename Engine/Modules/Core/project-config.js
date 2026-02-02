/**
 * Basalt Project Config — Per-project INI config (.BProject or basalt-project.ini)
 * Configures which modules to use per game/template project.
 * INI format; JSON fallback supported.
 */

const PROJECT_FILE = 'basalt-project.ini';
const PROJECT_JSON = 'basalt-project.json';
const STORAGE_KEY = 'basalt_project_config';

/** Parse simple INI: [section] key=value */
export function parseINI(text) {
  const result = {};
  let section = '_';
  if (!text || typeof text !== 'string') return result;
  text.split(/\r?\n/).forEach((line) => {
    line = line.trim();
    if (line.startsWith('[')) {
      section = line.slice(1, line.indexOf(']')).trim();
      if (!result[section]) result[section] = {};
    } else if (line && !line.startsWith(';') && !line.startsWith('#') && line.includes('=')) {
      const idx = line.indexOf('=');
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (k && section) {
        if (!result[section]) result[section] = {};
        result[section][k] = v;
      }
    }
  });
  return result;
}

/** Default project config — Advanced FPS template, all modules */
export const DEFAULT_PROJECT = {
  project: {
    name: 'MyProject',
    template: 'fps',
  },
  modules: {},
};

/** Load project config from URL or localStorage. Returns merged config. */
export async function loadProjectConfig(baseUrl = '') {
  let raw = null;
  const urls = [
    baseUrl ? `${baseUrl}/${PROJECT_JSON}` : PROJECT_JSON,
    baseUrl ? `${baseUrl}/${PROJECT_FILE}` : PROJECT_FILE,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) raw = await res.text();
    } catch (_) {}
    if (raw) break;
  }

  const stored = (() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();

  const merged = { ...DEFAULT_PROJECT };
  if (raw) {
    const isJson = raw.trim().startsWith('{');
    if (isJson) {
      try {
        Object.assign(merged, JSON.parse(raw));
      } catch (_) {}
    } else {
      const ini = parseINI(raw);
      if (ini.project) merged.project = { ...merged.project, ...ini.project };
      if (ini.modules) merged.modules = { ...merged.modules, ...ini.modules };
    }
  }
  if (stored) {
    if (stored.project) merged.project = { ...merged.project, ...stored.project };
    if (stored.modules) merged.modules = { ...merged.modules, ...stored.modules };
  }
  return merged;
}

/** Save project config to localStorage */
export function saveProjectConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (_) {}
}
