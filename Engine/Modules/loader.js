/**
 * Basalt Loader — Dynamically load modules by registry declaration.
 * Only loads modules declared and enabled in modules.config.js.
 * Logs failed modules to diagnostic log for display when editor fails.
 */

import { getEnabledModules } from './modules.config.js';
import { logError } from './Core/diagnostic-log.js';

/**
 * Load all enabled modules. Returns map of { moduleId: moduleExports }.
 * Failed loads are skipped (module omitted from result) and logged.
 */
export async function loadModules() {
  const entries = getEnabledModules();
  const result = {};
  const failed = [];

  for (const { id, path } of entries) {
    try {
      const url = new URL(path, import.meta.url).href;
      const mod = await import(/* @vite-ignore */ url);
      result[id] = mod;
    } catch (e) {
      failed.push({ id, path, err: e });
      logError(`module:${id}`, e);
      console.warn(`[Basalt] Module "${id}" failed to load:`, e);
    }
  }

  if (failed.length) {
    console.warn(`[Basalt] ${failed.length} module(s) failed:`, failed.map((f) => f.id));
  }

  return result;
}
