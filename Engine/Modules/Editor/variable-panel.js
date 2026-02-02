/**
 * Basalt Variable Panel — Variable list by category; Components section for weapon/attachment state
 */

import { CONFIG_SCHEMA, config } from '../Core/config.js';
import { WEAPON_SLOT, WEAPON_DEFINITIONS } from '../Weapons/weapon-switch-component.js';
import { SCOPE, MUZZLE } from '../Weapons/attachment-component.js';

const STORAGE_KEY = 'basalt_config_overrides';

const SCOPE_LABELS = { [SCOPE.IRON]: 'Iron', [SCOPE.SCOPE_01]: 'Scope 1', [SCOPE.SCOPE_02]: 'Scope 2', [SCOPE.SCOPE_03]: 'Scope 3' };
const MUZZLE_LABELS = { [MUZZLE.NONE]: 'None', [MUZZLE.SILENCER]: 'Silencer' };

export function createVariablePanel(configRef, schemaRef, onConfigChange, onWeaponReload = null, container = null) {
  const schema = schemaRef || CONFIG_SCHEMA;
  const cfg = configRef || config;
  let livePreview = false;
  const isDocked = !!container;

  const panel = document.createElement('div');
  panel.id = 'variable-panel';
  panel.className = 'variable-panel';
  panel.innerHTML = `
    <style>
      .variable-panel {
        ${isDocked ? 'width:100%;height:100%;display:flex;flex-direction:column;' : 'position:fixed;bottom:10px;left:10px;width:280px;max-height:320px;'}
        background: rgba(30, 30, 35, 0.95);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        color: #ddd;
        font-family: 'Segoe UI', sans-serif;
        font-size: 12px;
        z-index: 200;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .variable-panel-header {
        padding: 8px 12px;
        background: rgba(0,0,0,0.3);
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .variable-panel-content {
        overflow-y: auto;
        flex: 1;
        padding: 8px;
      }
      .variable-category {
        margin-bottom: 8px;
      }
      .variable-category-title {
        padding: 4px 8px;
        background: rgba(255,255,255,0.05);
        cursor: pointer;
        font-weight: bold;
        border-radius: 4px;
      }
      .variable-category-title:hover { background: rgba(255,255,255,0.1); }
      .variable-row {
        display: flex;
        align-items: center;
        padding: 4px 8px;
        gap: 8px;
        font-size: 11px;
      }
      .variable-row:hover { background: rgba(255,255,255,0.05); }
      .variable-name { flex: 1; min-width: 0; }
      .variable-value { color: #888; flex: 1; }
      .variable-edit, .variable-delete {
        padding: 2px 6px;
        cursor: pointer;
        border-radius: 4px;
        font-size: 10px;
      }
      .variable-edit { background: rgba(100,150,255,0.3); }
      .variable-delete { background: rgba(255,80,80,0.3); }
      .variable-add-btn {
        margin-top: 8px;
        padding: 6px 12px;
        background: rgba(80,180,80,0.3);
        border: none;
        color: #fff;
        cursor: pointer;
        border-radius: 4px;
        font-size: 11px;
      }
      .variable-add-btn:hover { background: rgba(80,180,80,0.5); }
      .variable-details {
        padding: 12px;
        border-top: 1px solid rgba(255,255,255,0.1);
        background: rgba(0,0,0,0.2);
      }
      .variable-details input, .variable-details select {
        width: 100%;
        padding: 4px 8px;
        margin: 4px 0;
        background: #333;
        border: 1px solid #555;
        color: #fff;
        border-radius: 4px;
      }
    </style>
    <div class="variable-panel-header">
      <span>Variables & Components</span>
      <label style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:normal;">
        <input type="checkbox" id="var-live-preview" />
        Live Preview
      </label>
      <button id="var-panel-toggle" style="background:none;border:none;color:#888;cursor:pointer;font-size:18px;">−</button>
    </div>
    <div class="variable-panel-content" id="var-panel-content"></div>
    <div class="variable-details" id="var-details" style="display:none;"></div>
  `;

  let selectedVar = null;
  let collapsed = false;

  function formatValue(item) {
    const v = cfg[item.name];
    if (item.category === 'TEMPLATE' && item.name === 'SCENE_TEMPLATE') {
      return v === 'empty' ? 'Empty Scene' : 'Advanced FPS';
    }
    if (item.category === 'COMPONENTS') {
      if (item.name === 'WEAPON_SLOT') return WEAPON_DEFINITIONS[v]?.name ?? (v === WEAPON_SLOT.RIFLE ? 'Rifle' : 'Pistol');
      if (item.name === 'ATTACHMENT_SCOPE') return SCOPE_LABELS[v] ?? 'Iron';
      if (item.name === 'ATTACHMENT_MUZZLE') return MUZZLE_LABELS[v] ?? 'None';
    }
    if (item.type === 'Vector3' && typeof v === 'object') {
      return `(${v.x?.toFixed(2)}, ${v.y?.toFixed(2)}, ${v.z?.toFixed(2)})`;
    }
    return String(v);
  }

  function render() {
    const content = panel.querySelector('#var-panel-content');
    content.innerHTML = '';
    const categories = {};
    schema.forEach((item) => {
      if (!categories[item.category]) categories[item.category] = [];
      categories[item.category].push(item);
    });
    const catOrder = ['TEMPLATE', 'COMPONENTS', 'MAP', 'MANTLE', 'CHARACTER', 'WEAPONS', 'ADS', 'ATTACHMENTS', 'MISC'];
    const sortedCats = Object.keys(categories).sort((a, b) => {
      const ia = catOrder.indexOf(a);
      const ib = catOrder.indexOf(b);
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return a.localeCompare(b);
    });
    sortedCats.forEach((cat) => {
      const div = document.createElement('div');
      div.className = 'variable-category';
      div.innerHTML = `<div class="variable-category-title">${cat === 'COMPONENTS' ? 'Components' : cat}</div>`;
      const list = document.createElement('div');
      categories[cat].forEach((item) => {
        const row = document.createElement('div');
        row.className = 'variable-row';
        row.innerHTML = `
          <span class="variable-name">${item.name}</span>
          <span class="variable-value">${formatValue(item)}</span>
          <button class="variable-edit" data-name="${item.name}">Edit</button>
          <button class="variable-delete" data-name="${item.name}">Del</button>
        `;
        row.querySelector('.variable-edit').onclick = () => selectVar(item);
        row.querySelector('.variable-delete').onclick = () => deleteVar(item);
        list.appendChild(row);
      });
      div.appendChild(list);
      content.appendChild(div);
    });
    const addBtn = document.createElement('button');
    addBtn.className = 'variable-add-btn';
    addBtn.textContent = '+ Add Variable';
    addBtn.onclick = showAddForm;
    content.appendChild(addBtn);
  }

  function selectVar(item) {
    selectedVar = item;
    const details = panel.querySelector('#var-details');
    details.style.display = 'block';
    if (item.name === 'WEAPON_SLOT') {
      const val = cfg[item.name] ?? WEAPON_SLOT.RIFLE;
      details.innerHTML = `
        <strong>${item.name}</strong>
        <select id="var-edit-val">
          <option value="${WEAPON_SLOT.RIFLE}" ${val === WEAPON_SLOT.RIFLE ? 'selected' : ''}>${WEAPON_DEFINITIONS[WEAPON_SLOT.RIFLE]?.name ?? 'Rifle'}</option>
          <option value="${WEAPON_SLOT.PISTOL}" ${val === WEAPON_SLOT.PISTOL ? 'selected' : ''}>${WEAPON_DEFINITIONS[WEAPON_SLOT.PISTOL]?.name ?? 'Pistol'}</option>
        </select>
        <button id="var-edit-apply">Apply</button>
        <small style="opacity:0.7">${livePreview ? 'Live Preview ON — will update viewport' : 'Enable Live Preview to update viewport'}</small>
      `;
      details.querySelector('#var-edit-apply').onclick = () => {
        const v = parseInt(details.querySelector('#var-edit-val').value, 10);
        if (!isNaN(v)) {
          cfg[item.name] = v;
          if (onConfigChange) onConfigChange();
          if (livePreview && onWeaponReload) onWeaponReload();
          render();
        }
      };
    } else if (item.type === 'number') {
      const val = cfg[item.name] ?? item.value ?? 0;
      const hasRange = typeof item.min === 'number' && typeof item.max === 'number';
      const step = item.step ?? 0.01;
      details.innerHTML = hasRange
        ? `
        <strong>${item.name}</strong>
        <label style="display:flex;align-items:center;gap:8px;margin:4px 0;">
          <input type="range" id="var-edit-val" value="${val}" min="${item.min}" max="${item.max}" step="${step}" style="flex:1;" />
          <input type="number" id="var-edit-num" value="${val}" min="${item.min}" max="${item.max}" step="${step}" style="width:70px;" />
        </label>
        <button id="var-edit-apply">Apply</button>
      `
        : `
        <strong>${item.name}</strong>
        <input type="number" id="var-edit-val" value="${val}" min="${item.min ?? ''}" max="${item.max ?? ''}" step="${item.step ?? ''}" />
        <button id="var-edit-apply">Apply</button>
      `;
      if (hasRange) {
        const rangeEl = details.querySelector('#var-edit-val');
        const numEl = details.querySelector('#var-edit-num');
        const sync = () => {
          const v = parseFloat(rangeEl.value);
          if (!isNaN(v)) {
            numEl.value = v;
            cfg[item.name] = v;
            if (onConfigChange) onConfigChange();
          }
        };
        rangeEl.oninput = sync;
        numEl.oninput = () => {
          const v = parseFloat(numEl.value);
          if (!isNaN(v)) {
            rangeEl.value = Math.max(item.min, Math.min(item.max, v));
            cfg[item.name] = parseFloat(rangeEl.value);
            if (onConfigChange) onConfigChange();
          }
        };
      }
      details.querySelector('#var-edit-apply').onclick = () => {
        const inputEl = details.querySelector('#var-edit-val');
        const numEl = details.querySelector('#var-edit-num');
        const val = parseFloat(numEl ? numEl.value : inputEl.value);
        if (!isNaN(val)) {
          cfg[item.name] = val;
          if (onConfigChange) onConfigChange();
          render();
        }
      };
    } else if (item.type === 'Vector3') {
      const v = cfg[item.name] || { x: 0, y: 0, z: 0 };
      details.innerHTML = `
        <strong>${item.name}</strong>
        X: <input type="number" id="var-x" value="${v.x}" step="0.01" />
        Y: <input type="number" id="var-y" value="${v.y}" step="0.01" />
        Z: <input type="number" id="var-z" value="${v.z}" step="0.01" />
        <button id="var-edit-apply">Apply</button>
      `;
      details.querySelector('#var-edit-apply').onclick = () => {
        const x = parseFloat(details.querySelector('#var-x').value) || 0;
        const y = parseFloat(details.querySelector('#var-y').value) || 0;
        const z = parseFloat(details.querySelector('#var-z').value) || 0;
        cfg[item.name] = { x, y, z };
        if (onConfigChange) onConfigChange();
        render();
      };
    } else if (item.name === 'SCENE_TEMPLATE') {
      const val = cfg[item.name] ?? 'fps';
      details.innerHTML = `
        <strong>${item.name}</strong>
        <select id="var-edit-val">
          <option value="fps" ${val === 'fps' ? 'selected' : ''}>Advanced FPS</option>
          <option value="empty" ${val === 'empty' ? 'selected' : ''}>Empty Scene (Z-up)</option>
        </select>
        <button id="var-edit-apply">Apply</button>
        <small style="opacity:0.7">Reload page to apply</small>
      `;
      details.querySelector('#var-edit-apply').onclick = () => {
        cfg[item.name] = details.querySelector('#var-edit-val').value;
        if (onConfigChange) onConfigChange();
        render();
      };
    } else if (item.type === 'string') {
      details.innerHTML = `
        <strong>${item.name}</strong>
        <input type="text" id="var-edit-val" value="${cfg[item.name] ?? ''}" placeholder="URL or path" />
        <button id="var-edit-apply">Apply</button>
      `;
      details.querySelector('#var-edit-apply').onclick = () => {
        cfg[item.name] = details.querySelector('#var-edit-val').value;
        if (onConfigChange) onConfigChange();
        render();
      };
    }
  }

  function deleteVar(item) {
    if (!confirm(`Remove ${item.name}?`)) return;
    const idx = schema.indexOf(item);
    if (idx >= 0) schema.splice(idx, 1);
    delete cfg[item.name];
    selectedVar = null;
    panel.querySelector('#var-details').style.display = 'none';
    if (onConfigChange) onConfigChange();
    render();
  }

  function showAddForm() {
    const details = panel.querySelector('#var-details');
    details.style.display = 'block';
    details.innerHTML = `
      <strong>Add Variable</strong>
      <input type="text" id="var-add-name" placeholder="Variable name" />
      <select id="var-add-category">
        <option value="COMPONENTS">Components</option>
        <option value="MAP">MAP</option>
        <option value="MANTLE">MANTLE</option>
        <option value="CHARACTER">CHARACTER</option>
        <option value="WEAPONS">WEAPONS</option>
        <option value="ADS">ADS</option>
        <option value="ATTACHMENTS">ATTACHMENTS</option>
        <option value="MISC">MISC</option>
      </select>
      <select id="var-add-type">
        <option value="number">number</option>
        <option value="string">string</option>
        <option value="Vector3">Vector3</option>
      </select>
      <input type="text" id="var-add-value" placeholder="Value (0 or 0,0,0)" />
      <button id="var-add-apply">Add</button>
    `;
    details.querySelector('#var-add-apply').onclick = () => {
      const cat = details.querySelector('#var-add-category').value;
      const type = details.querySelector('#var-add-type').value;
      const valStr = details.querySelector('#var-add-value').value.trim();
      let value;
      if (type === 'Vector3') {
        const parts = valStr.split(',').map((s) => parseFloat(s.trim()) || 0);
        value = { x: parts[0] || 0, y: parts[1] || 0, z: parts[2] || 0 };
      } else if (type === 'string') {
        value = valStr;
      } else {
        value = parseFloat(valStr) || 0;
      }
      const newName = details.querySelector('#var-add-name').value.trim() || 'NEW_VAR';
      schema.push({ category: cat, name: newName, type, value });
      cfg[newName] = value;
      if (onConfigChange) onConfigChange();
      render();
      details.style.display = 'none';
    };
  }

  panel.querySelector('#var-live-preview').onchange = (e) => {
    livePreview = !!e.target.checked;
  };

  panel.querySelector('#var-panel-toggle').onclick = () => {
    collapsed = !collapsed;
    panel.querySelector('#var-panel-content').style.display = collapsed ? 'none' : 'block';
    panel.querySelector('#var-details').style.display = collapsed ? 'none' : (selectedVar ? 'block' : 'none');
    panel.querySelector('#var-panel-toggle').textContent = collapsed ? '+' : '−';
  };

  render();
  (container || document.body).appendChild(panel);

  return {
    panel,
    render,
    dispose() {
      panel.remove();
    },
  };
}
