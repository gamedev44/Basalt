/**
 * Basalt Blueprint Graph — Compact blueprint editor panel
 * Shows Blueprint Editor button (opens full editor in new window) + categories, variables, data table for selected blueprint.
 * Replaces Content Drawer as the non-expanded BP editor.
 */

import { CONFIG_SCHEMA } from '../Core/config.js';
import { config } from '../Core/config.js';
import { WEAPON_SLOT, WEAPON_DEFINITIONS } from '../Weapons/weapon-switch-component.js';

/** Blueprint-specific variable schemas — BP_Player uses config, BP_Weapon uses weapon data */
function getBlueprintVariables(assetId, configRef) {
  const cfg = configRef ?? config;
  if (assetId === 'bp_player') {
    const byCat = {};
    CONFIG_SCHEMA.forEach((item) => {
      if (!byCat[item.category]) byCat[item.category] = [];
      byCat[item.category].push({
        name: item.name,
        type: item.type,
        value: cfg[item.name] ?? item.value,
        min: item.min,
        max: item.max,
      });
    });
    return byCat;
  }
  if (assetId === 'bp_weapon') {
    const ov = cfg.WEAPON_OVERRIDES ?? {};
    return {
      'Weapon Stats': [
        { name: 'Rifle Damage', type: 'number', value: ov[WEAPON_SLOT.RIFLE]?.damage ?? 34 },
        { name: 'Rifle Mag', type: 'number', value: ov[WEAPON_SLOT.RIFLE]?.ammoCount ?? 30 },
        { name: 'Pistol Damage', type: 'number', value: ov[WEAPON_SLOT.PISTOL]?.damage ?? 24 },
        { name: 'Pistol Mag', type: 'number', value: ov[WEAPON_SLOT.PISTOL]?.ammoCount ?? 12 },
      ],
      'Data Table': [
        { name: 'DT_Weapons', type: 'link', value: 'Open in Content Browser' },
      ],
    };
  }
  if (assetId === 'bp_interactable') {
    return {
      Default: [
        { name: 'InteractionRange', type: 'number', value: 2 },
        { name: 'CanInteract', type: 'bool', value: true },
      ],
      Events: [
        { name: 'OnInteract', type: 'event', value: '—' },
        { name: 'OnHover', type: 'event', value: '—' },
      ],
    };
  }
  return {
    Default: [
      { name: '(No variables)', type: 'string', value: 'Select a blueprint' },
    ],
  };
}

/** Data table / enum summary for selected blueprint */
function getDataTableSummary(assetId) {
  if (assetId === 'bp_weapon') {
    return {
      table: 'DT_Weapons',
      columns: ['Display Name', 'DMG', 'MAG', 'Camera Base', 'Camera ADS', 'URL', 'File'],
      rows: [
        { slot: 'Rifle', name: WEAPON_DEFINITIONS[WEAPON_SLOT.RIFLE]?.name ?? 'Rifle', dmg: 34, mag: 30 },
        { slot: 'Pistol', name: WEAPON_DEFINITIONS[WEAPON_SLOT.PISTOL]?.name ?? 'Pistol', dmg: 24, mag: 12 },
      ],
    };
  }
  if (assetId === 'bp_player') {
    return {
      table: 'Enums',
      columns: ['WEAPON_SLOT', 'ATTACHMENT_SCOPE', 'ATTACHMENT_MUZZLE'],
      enums: ['Rifle / Pistol', 'Iron / Scope 1–3', 'None / Silencer'],
    };
  }
  return null;
}

export function createBlueprintGraph(container, { onOpenBlueprintEditor, getSelectedAsset, config: configRef, persistConfig, onOpenDataTable } = {}) {
  if (!container) return { dispose: () => {} };

  const root = document.createElement('div');
  root.className = 'blueprint-graph';
  root.innerHTML = `
    <style>
      .blueprint-graph {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: var(--basalt-panel-bg, #161b22);
        color: var(--basalt-text, #c9d1d9);
        font-size: 11px;
        overflow: hidden;
      }
      .bg-section {
        padding: 8px;
        border-bottom: 1px solid #30363d;
        flex-shrink: 0;
      }
      .bg-section-title {
        font-size: 10px;
        color: #888;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .bg-card {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        background: #21262d;
        border: 1px solid #30363d;
        border-radius: 4px;
        cursor: pointer;
        margin-bottom: 6px;
        transition: background 0.15s, border-color 0.15s;
      }
      .bg-card:hover {
        background: rgba(255,255,255,0.08);
        border-color: var(--basalt-accent, #4c65d4);
      }
      .bg-card-icon { font-size: 20px; opacity: 0.9; }
      .bg-card-label { flex: 1; }
      .bg-card-desc { font-size: 9px; color: #666; margin-top: 2px; }
      .bg-content {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }
      .bg-category {
        margin-bottom: 12px;
      }
      .bg-category-title {
        padding: 4px 8px;
        background: var(--basalt-panel-bg, #21262d);
        border-left: 3px solid var(--basalt-accent, #4c65d4);
        font-size: 10px;
        font-weight: bold;
        margin-bottom: 4px;
      }
      .bg-var-row {
        display: flex;
        align-items: center;
        padding: 4px 8px;
        gap: 8px;
        font-size: 11px;
      }
      .bg-var-row:hover { background: rgba(255,255,255,0.04); }
      .bg-var-name { flex: 1; min-width: 0; }
      .bg-var-value { color: #8b949e; font-size: 10px; }
      .bg-placeholder {
        padding: 12px;
        color: #666;
        font-size: 10px;
      }
      .bg-datatable {
        margin-top: 12px;
        border: 1px solid #30363d;
        border-radius: 4px;
        overflow: hidden;
      }
      .bg-datatable-title {
        padding: 6px 8px;
        background: #21262d;
        font-size: 10px;
        color: #888;
      }
      .bg-datatable table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10px;
      }
      .bg-datatable th, .bg-datatable td {
        padding: 4px 8px;
        text-align: left;
        border-bottom: 1px solid #30363d;
      }
      .bg-datatable th { background: #0d1117; color: #8b949e; }
      .bg-var-link:hover { background: rgba(56,139,253,0.15); }
      .bg-var-link .bg-var-value { color: #58a6ff; }
    </style>
    <div class="bg-section">
      <div class="bg-section-title">Blueprint Editor</div>
      <div class="bg-card" id="bg-open-editor">
        <span class="bg-card-icon material-symbols-outlined">account_tree</span>
        <div class="bg-card-label">
          <div>Open Full Blueprint Editor</div>
          <div class="bg-card-desc" id="bg-editor-desc">Opens docked MC logic graph / Monaco editor panel</div>
        </div>
      </div>
    </div>
    <div class="bg-content" id="bg-content">
      <div class="bg-placeholder">Select a blueprint in Content Browser to view categories, variables, and data tables</div>
    </div>
  `;

  const contentEl = root.querySelector('#bg-content');
  const editorDesc = root.querySelector('#bg-editor-desc');
  const editorBtn = root.querySelector('#bg-open-editor');

  const renderContent = () => {
    const asset = typeof getSelectedAsset === 'function' ? getSelectedAsset() : null;
    if (editorDesc && asset?.name) {
      editorDesc.textContent = `Open ${asset.name} in full editor`;
    } else if (editorDesc) {
      editorDesc.textContent = 'Opens docked MC logic graph / Monaco editor panel';
    }

    contentEl.innerHTML = '';
    if (!asset || asset.type !== 'blueprint') {
      contentEl.innerHTML = '<div class="bg-placeholder">Select a blueprint in Content Browser to view categories, variables, and data tables</div>';
      return;
    }

    const vars = getBlueprintVariables(asset.id, configRef);
    const dataTable = getDataTableSummary(asset.id);

    Object.entries(vars).forEach(([cat, items]) => {
      const catDiv = document.createElement('div');
      catDiv.className = 'bg-category';
      catDiv.innerHTML = `<div class="bg-category-title">${cat}</div>`;
      items.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'bg-var-row' + (item.type === 'link' ? ' bg-var-link' : '');
        const valStr = typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value);
        row.innerHTML = `
          <span class="bg-var-name">${escapeHtml(item.name)}</span>
          <span class="bg-var-value">${escapeHtml(valStr)}</span>
        `;
        if (item.type === 'link' && onOpenDataTable) {
          row.style.cursor = 'pointer';
          row.title = 'Click to open';
          row.onclick = () => onOpenDataTable(item.name, asset?.id);
        }
        catDiv.appendChild(row);
      });
      contentEl.appendChild(catDiv);
    });

    if (dataTable) {
      const dtDiv = document.createElement('div');
      dtDiv.className = 'bg-datatable';
      dtDiv.innerHTML = `<div class="bg-datatable-title">${escapeHtml(dataTable.table)}</div>`;
      if (dataTable.rows) {
        const table = document.createElement('table');
        const cols = dataTable.columns || ['Slot', 'Name', 'DMG', 'MAG'];
        table.innerHTML = `<thead><tr>${cols.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead><tbody>
          ${dataTable.rows.map((r) => `<tr>${Object.values(r).map((v) => `<td>${escapeHtml(String(v))}</td>`).join('')}</tr>`).join('')}
        </tbody>`;
        dtDiv.appendChild(table);
      } else if (dataTable.enums) {
        const table = document.createElement('table');
        table.innerHTML = `<thead><tr>${(dataTable.columns || []).map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead><tbody>
          <tr><td>${(dataTable.enums || []).join('</td><td>')}</td></tr>
        </tbody>`;
        dtDiv.appendChild(table);
      }
      contentEl.appendChild(dtDiv);
    }
  };

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  if (editorBtn) {
    editorBtn.onclick = () => {
      if (onOpenBlueprintEditor) onOpenBlueprintEditor();
    };
  }

  renderContent();
  const interval = setInterval(renderContent, 500);

  container.innerHTML = '';
  container.appendChild(root);

  return {
    refresh: renderContent,
    dispose() {
      clearInterval(interval);
      root.remove();
    },
  };
}
