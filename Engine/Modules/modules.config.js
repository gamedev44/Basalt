/**
 * Basalt Module Registry — Declare which modules load.
 * Only declared modules are loaded; undeclared modules have no effect.
 * Toggle by setting enabled: true/false or remove from array.
 * Loosely coupled: missing modules are skipped; main.js guards all usage.
 *
 * STATIC_SCRIPTS: Pulled from Core/scripts.config.js. Module entries may include
 * optional `scripts: [url, ...]` for module-specific dependencies.
 */

import { DEFAULT_STATIC_SCRIPTS } from './Core/scripts.config.js';

/** Scripts loaded before any module — from scripts.config + module-declared */
export const STATIC_SCRIPTS = [...DEFAULT_STATIC_SCRIPTS];

export const MODULES = [
  // Core (required for bootstrap)
  { id: 'config', path: './Core/config.js', enabled: true },
  { id: 'engine', path: './Core/engine.js', enabled: true },
  { id: 'scene', path: './Core/scene.js', enabled: true },
  // Rendering
  { id: 'lights', path: './Rendering/lights.js', enabled: true },
  { id: 'ground', path: './Rendering/ground.js', enabled: true },
  // Starter: FPS controller — player, gun, movement, HUD (uses config variables)
  { id: 'fps-controller', path: './Starter/fps-controller.js', enabled: true },
  // UI
  { id: 'toolbar', path: './UI/toolbar.js', enabled: true },
  // Editor
  { id: 'dock-layout', path: './Editor/dock-layout.js', enabled: true },
  { id: 'editor-mode', path: './Editor/editor-mode.js', enabled: true },
  { id: 'play-mode-panel', path: './Editor/play-mode-panel.js', enabled: true },
  { id: 'inspector-panel', path: './Editor/inspector-panel.js', enabled: true },
  { id: 'level-outliner', path: './Editor/level-outliner.js', enabled: true },
  { id: 'components-panel', path: './Editor/components-panel.js', enabled: true },
  { id: 'thermometers-panel', path: './Editor/thermometers-panel.js', enabled: true },
  { id: 'theme-manager', path: './Editor/theme-manager.js', enabled: true },
  { id: 'menu-bar', path: './Editor/menu-bar.js', enabled: true },
  { id: 'status-bar', path: './Editor/status-bar.js', enabled: true },
  { id: 'place-actors-panel', path: './Editor/place-actors-panel.js', enabled: true },
  { id: 'details-panel', path: './Editor/details-panel.js', enabled: true },
  { id: 'gizmo-handler', path: './Editor/gizmo-handler.js', enabled: true },
  { id: 'variable-panel', path: './Editor/variable-panel.js', enabled: true },
  { id: 'content-browser', path: './Editor/content-browser.js', enabled: true },
  { id: 'blueprint-panel', path: './Editor/blueprint-panel.js', enabled: true },
  { id: 'content-drawer', path: './Editor/content-drawer.js', enabled: false },
  { id: 'blueprint-graph', path: './Editor/blueprint-graph.js', enabled: true },
  { id: 'weapon-data-table', path: './Editor/weapon-data-table.js', enabled: true },
  { id: 'module-library-panel', path: './Editor/module-library-panel.js', enabled: true },
  // Vehicle — Havok physics vehicle with easy rigging
  { id: 'vehicle', path: './Vehicle/vehicle-component.js', enabled: true },
];

/** Get enabled module entries */
export function getEnabledModules() {
  return MODULES.filter((m) => m.enabled !== false);
}

/** Get all script URLs to load (STATIC_SCRIPTS + scripts from enabled modules, deduped) */
export function getScriptUrls() {
  const base = STATIC_SCRIPTS || [];
  const fromModules = getEnabledModules()
    .flatMap((m) => m.scripts || [])
    .filter(Boolean);
  return [...new Set([...base, ...fromModules])];
}
