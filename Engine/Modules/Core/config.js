/**
 * Basalt Config — Runtime values from template schemas
 * Each template (fps, empty) defines its own schema in Core/templates/<id>-schema.js
 * DEFAULT_TEMPLATE (in templates.js) selects which schema loads when none stored.
 */

import { DEFAULT_TEMPLATE } from './templates.js';

const STORAGE_KEY = 'basalt_config';

/** Minimal base — used when template schema fails */
const BASE_SCHEMA = [
  { category: 'TEMPLATE', name: 'SCENE_TEMPLATE', type: 'string', value: DEFAULT_TEMPLATE },
  { category: 'TEMPLATE', name: 'PROJECT_NAME', type: 'string', value: 'MyProject' },
];

/** Load schema from template file. Default to DEFAULT_TEMPLATE if missing/invalid. */
async function loadTemplateSchema(templateId) {
  const id = templateId === 'empty' ? 'empty' : templateId === 'fps' ? 'fps' : DEFAULT_TEMPLATE;
  try {
    const mod = await import(`./templates/${id}-schema.js`);
    const schema = mod[`${id.toUpperCase()}_SCHEMA`] ?? mod.FPS_SCHEMA ?? mod.EMPTY_SCHEMA;
    return Array.isArray(schema) ? schema : BASE_SCHEMA;
  } catch (e) {
    console.warn('[Basalt] Config: template schema failed, using base:', e?.message);
    return BASE_SCHEMA;
  }
}

/** Mutable schema array — consumers use CONFIG_SCHEMA.forEach etc. */
export const CONFIG_SCHEMA = [];

let _schemaReady = false;

/** Get stored template id from localStorage (no schema load). Falls back to DEFAULT_TEMPLATE. */
function getStoredTemplate() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    const parsed = s ? JSON.parse(s) : null;
    const v = parsed?.SCENE_TEMPLATE;
    return v === 'empty' ? 'empty' : v === 'fps' ? 'fps' : DEFAULT_TEMPLATE;
  } catch {
    return DEFAULT_TEMPLATE;
  }
}

/** Initialize schema from active template. Call before initConfig. */
export async function loadSchema() {
  const templateId = getStoredTemplate();
  const schema = await loadTemplateSchema(templateId);
  CONFIG_SCHEMA.length = 0;
  CONFIG_SCHEMA.push(...schema);
  _schemaReady = true;
  return schema;
}

// Runtime config object — populated from schema
export const config = {};

/** Initialize config from schema (call once at startup, after loadSchema) */
export function initConfig() {
  if (!_schemaReady) {
    console.warn('[Basalt] Config: loadSchema not called; using base. Call loadSchema() first.');
    CONFIG_SCHEMA.length = 0;
    CONFIG_SCHEMA.push(...BASE_SCHEMA);
  }

  const stored = (() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();

  CONFIG_SCHEMA.forEach((item) => {
    const storedVal = stored?.[item.name];
    if (storedVal !== undefined && (item.type === 'string' || item.type === 'number')) {
      config[item.name] = storedVal;
    } else if (item.type === 'Vector3') {
      config[item.name] = item.value;
    } else {
      config[item.name] = item.value;
    }
  });

  if (!config.SCENE_TEMPLATE || (config.SCENE_TEMPLATE !== 'fps' && config.SCENE_TEMPLATE !== 'empty')) {
    config.SCENE_TEMPLATE = DEFAULT_TEMPLATE;
  }

  if (stored?.WEAPON_OVERRIDES && typeof stored.WEAPON_OVERRIDES === 'object') {
    config.WEAPON_OVERRIDES = stored.WEAPON_OVERRIDES;
  } else if (!config.WEAPON_OVERRIDES) {
    config.WEAPON_OVERRIDES = { 0: {}, 1: {} };
  }
}

/** Persist config to localStorage */
export function persistConfig() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) { /* ignore */ }
}

export function getVector3(name) {
  const v = config[name];
  if (typeof v === 'object' && v !== null && 'x' in v && 'y' in v && 'z' in v) {
    return typeof BABYLON !== 'undefined'
      ? new BABYLON.Vector3(v.x, v.y, v.z)
      : { x: v.x, y: v.y, z: v.z };
  }
  return null;
}

export function setVector3(name, vec) {
  if (vec && typeof vec.x === 'number' && typeof vec.y === 'number' && typeof vec.z === 'number') {
    config[name] = { x: vec.x, y: vec.y, z: vec.z };
  }
}
