/**
 * Basalt Bootstrap — Load STATIC_SCRIPTS from modules.config, then main.js.
 * Havok is optional. Logs all failures to diagnostic log for display.
 */

import { log, logError, getLog, renderLogHTML } from './Core/diagnostic-log.js';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(s);
  });
}

async function init() {
  log('bootstrap', 'Starting...');
  let getScriptUrls;
  try {
    const mod = await import('./modules.config.js');
    getScriptUrls = mod.getScriptUrls;
    log('bootstrap', 'modules.config loaded');
  } catch (e) {
    logError('bootstrap:modules.config', e);
    throw e;
  }

  const urls = getScriptUrls();
  log('bootstrap', `Loading ${urls.length} scripts...`);
  const optional = ['HavokPhysics_umd.js', 'havok'];
  for (const url of urls) {
    try {
      await loadScript(url);
      log('bootstrap', `OK: ${url.split('/').pop()}`);
    } catch (e) {
      const isOptional = optional.some((k) => url.includes(k));
      if (isOptional) {
        log('bootstrap', `Optional failed (continuing): ${url}`, e?.message);
      } else {
        logError('bootstrap:script', e);
        throw e;
      }
    }
  }
  log('bootstrap', 'Scripts done, loading main.js');
  await import('./main.js');
  log('bootstrap', 'Main init complete');
}

function showError(err) {
  let root = document.getElementById('layout-root');
  if (!root) {
    root = document.body;
    if (!root) return;
  }
  const logHtml = getLog().length ? `<div style="margin-top:16px;max-height:200px;overflow-y:auto;text-align:left;font-family:monospace;font-size:10px;">${renderLogHTML()}</div>` : '';
  root.innerHTML = `
    <div style="padding:24px;max-width:560px;margin:auto;color:#c9d1d9;font-family:Segoe UI,sans-serif;">
      <h3 style="color:#f0883e;margin:0 0 12px 0;">Editor failed to load</h3>
      <p style="font-size:13px;margin:0 0 8px 0;color:#c9d1d9;">${(err?.message || String(err)).slice(0, 200)}</p>
      <p style="font-size:11px;color:#6e7681;margin:0 0 16px 0;">Run a local server (npx serve) if using file://. Copy log below for diagnosis.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <a href="Live_Web_Viewport_W_Inspector.html" class="ui-btn" style="display:inline-block;padding:8px 14px;background:#388bfd;color:#fff;text-decoration:none;border-radius:4px;font-size:12px;">Play in New Window</a>
        <a href="?resetLayout=1" class="ui-btn" style="display:inline-block;padding:8px 14px;background:#21262d;border:1px solid #30363d;color:#c9d1d9;text-decoration:none;border-radius:4px;font-size:12px;">Reset layout</a>
        <button onclick="location.reload()" class="ui-btn" style="padding:8px 14px;background:#21262d;border:1px solid #30363d;color:#c9d1d9;cursor:pointer;border-radius:4px;font-size:12px;">Retry</button>
      </div>
      <details style="margin-top:12px;">
        <summary style="cursor:pointer;color:#58a6ff;font-size:11px;">Diagnostic log (click to expand)</summary>
        ${logHtml}
      </details>
    </div>
  `;
}

init().catch((err) => {
  console.error('[Basalt] Bootstrap failed:', err);
  logError('bootstrap:final', err);
  showError(err);
});
