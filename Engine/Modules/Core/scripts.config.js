/**
 * Basalt Scripts Config — Static/CDN script URLs loaded before modules.
 * Imported by modules.config.js. Add or remove URLs to control what loads.
 * Modules may declare optional `scripts: [url, ...]` for module-specific deps.
 */

/** Babylon.js core and extensions — loaded before any module */
export const BABYLON_SCRIPTS = [
  'https://cdn.babylonjs.com/babylon.js',
  'https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js',
  'https://cdn.babylonjs.com/gui/babylon.gui.min.js',
];

/** Editor/inspector — required for scene.debugLayer */
export const INSPECTOR_SCRIPT = 'https://cdn.babylonjs.com/inspector/babylon.inspector.bundle.js';

/** Havok physics — must load before Babylon.js */
export const HAVOK_SCRIPT = 'https://cdn.babylonjs.com/havok/HavokPhysics_umd.js';

/** Default static scripts (Havok before Babylon, then inspector) */
export const DEFAULT_STATIC_SCRIPTS = [
  HAVOK_SCRIPT,
  ...BABYLON_SCRIPTS,
  INSPECTOR_SCRIPT,
];
