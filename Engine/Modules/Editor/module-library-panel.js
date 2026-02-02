/**
 * Basalt Module Library Panel — UE5-style module browser
 * Lists atomized modules (Lighting, Physics, Weapon, etc.) with enable/disable toggles.
 * Drag-and-drop to add modules to project (future: sync with modules.config).
 */

import { MODULE_MANIFESTS, getEnabledModuleIds, setEnabledModuleIds } from '../Core/module-library.js';

export function createModuleLibraryPanel(container, options = {}) {
  if (!container) return { dispose: () => {} };

  const { onModuleToggle, getModuleEnabled } = options;
  const manifests = Object.values(MODULE_MANIFESTS);

  const root = document.createElement('div');
  root.className = 'module-library-panel';
  root.innerHTML = `
    <style>
      .module-library-panel {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #161b22;
        color: #c9d1d9;
        font-size: 11px;
        overflow: hidden;
      }
      .ml-header {
        padding: 8px 12px;
        border-bottom: 1px solid #30363d;
        font-weight: 600;
        font-size: 12px;
      }
      .ml-search {
        padding: 6px 8px;
        margin: 8px;
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: 4px;
        color: #c9d1d9;
        font-size: 11px;
      }
      .ml-search:focus { outline: none; border-color: #4c65d4; }
      .ml-search::placeholder { color: #6e7681; }
      .ml-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }
      .ml-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        margin-bottom: 6px;
        background: #21262d;
        border: 1px solid #30363d;
        border-radius: 4px;
        cursor: grab;
        transition: background 0.15s, border-color 0.15s;
      }
      .ml-item:hover { background: #30363d; border-color: #4c65d4; }
      .ml-item-icon { font-size: 20px; opacity: 0.9; }
      .ml-item-content { flex: 1; min-width: 0; }
      .ml-item-name { font-weight: 600; font-size: 12px; }
      .ml-item-desc { font-size: 10px; color: #8b949e; margin-top: 2px; }
      .ml-item-toggle {
        width: 36px;
        height: 20px;
        background: #30363d;
        border-radius: 10px;
        cursor: pointer;
        position: relative;
        transition: background 0.2s;
      }
      .ml-item-toggle.enabled { background: #388bfd; }
      .ml-item-toggle::after {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        background: #fff;
        border-radius: 50%;
        top: 2px;
        left: 2px;
        transition: left 0.2s;
      }
      .ml-item-toggle.enabled::after { left: 18px; }
    </style>
    <div class="ml-header">Module Library</div>
    <input type="text" class="ml-search" placeholder="Search modules..." id="ml-search" />
    <div class="ml-list" id="ml-list"></div>
  `;

  const searchInput = root.querySelector('#ml-search');
  const listEl = root.querySelector('#ml-list');
  let searchQuery = '';
  let enabledIds = getEnabledModuleIds() || [];

  const isEnabled = (id) => {
    if (getModuleEnabled && typeof getModuleEnabled === 'function') return getModuleEnabled(id);
    return enabledIds.includes(id);
  };

  const toggleModule = (id) => {
    if (enabledIds.includes(id)) {
      enabledIds = enabledIds.filter((x) => x !== id);
    } else {
      enabledIds = [...enabledIds, id];
    }
    setEnabledModuleIds(enabledIds);
    onModuleToggle?.(id, enabledIds.includes(id));
    render();
  };

  const render = () => {
    const q = searchQuery.toLowerCase();
    const filtered = manifests.filter(
      (m) => !q || m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
    );
    listEl.innerHTML = filtered
      .map(
        (m) => `
      <div class="ml-item" data-id="${m.id}" draggable="true">
        <span class="ml-item-icon material-symbols-outlined">${m.icon || 'extension'}</span>
        <div class="ml-item-content">
          <div class="ml-item-name">${escapeHtml(m.name)}</div>
          <div class="ml-item-desc">${escapeHtml(m.description)}</div>
        </div>
        <div class="ml-item-toggle ${isEnabled(m.id) ? 'enabled' : ''}" data-id="${m.id}" title="Enable/Disable"></div>
      </div>
    `
      )
      .join('');

    listEl.querySelectorAll('.ml-item').forEach((el) => {
      const id = el.dataset.id;
      el.ondragstart = (e) => {
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'copy';
      };
      el.querySelector('.ml-item-toggle').onclick = (e) => {
        e.stopPropagation();
        toggleModule(id);
      };
    });
  };

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  searchInput.oninput = () => {
    searchQuery = searchInput.value;
    render();
  };

  render();
  container.appendChild(root);

  return {
    refresh: render,
    dispose() {
      root.remove();
    },
  };
}
