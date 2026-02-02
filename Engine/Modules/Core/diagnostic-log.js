/**
 * Basalt Diagnostic Log — Captures load errors for display when editor fails.
 * Read directly from the error panel; also stored in sessionStorage for copy/paste.
 */

const LOG_KEY = 'basalt_load_log';
const MAX_ENTRIES = 100;

const entries = [];

export function log(phase, message, detail = null) {
  const entry = {
    ts: new Date().toISOString(),
    phase,
    message: String(message),
    detail: detail != null ? String(detail) : null,
  };
  entries.push(entry);
  try {
    const stored = sessionStorage.getItem(LOG_KEY);
    const list = stored ? JSON.parse(stored) : [];
    list.push(entry);
    sessionStorage.setItem(LOG_KEY, JSON.stringify(list.slice(-MAX_ENTRIES)));
  } catch (_) {}
  return entry;
}

export function logError(phase, err) {
  const msg = err?.message ?? String(err);
  const stack = err?.stack ?? null;
  log(phase, msg, stack);
  return entries[entries.length - 1];
}

export function getLog() {
  return [...entries];
}

export function getLogText() {
  return entries
    .map((e) => `[${e.ts}] ${e.phase}: ${e.message}${e.detail ? '\n  ' + e.detail : ''}`)
    .join('\n');
}

export function renderLogHTML() {
  const lines = entries.map((e) => {
    const d = e.detail ? `<div style="font-size:10px;color:#6e7681;margin-top:2px;white-space:pre-wrap;word-break:break-all;">${escapeHtml(e.detail)}</div>` : '';
    return `<div style="margin-bottom:8px;padding:6px;background:#0d1117;border-radius:2px;border-left:3px solid #f0883e;">
      <span style="color:#8b949e;font-size:10px;">[${e.ts}] ${escapeHtml(e.phase)}</span>
      <div style="color:#c9d1d9;font-size:11px;margin-top:2px;">${escapeHtml(e.message)}</div>
      ${d}
    </div>`;
  });
  return lines.join('');
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function clearLog() {
  entries.length = 0;
  try {
    sessionStorage.removeItem(LOG_KEY);
  } catch (_) {}
}
