/**
 * Basalt Weapon Data Table — UE5-style per-gun property editor
 * Edit weapon constants on the fly; changes apply via config.WEAPON_OVERRIDES
 */

import { WEAPON_SLOT, WEAPON_DEFINITIONS } from '../Weapons/weapon-switch-component.js';

export function createWeaponDataTable(config, onApply, onWeaponReload = null, container = null) {
  if (!config.WEAPON_OVERRIDES) config.WEAPON_OVERRIDES = { [WEAPON_SLOT.RIFLE]: {}, [WEAPON_SLOT.PISTOL]: {} };
  const isDocked = !!container;

  const panel = document.createElement('div');
  panel.id = 'weapon-data-table';
  panel.className = 'weapon-data-table';
  panel.innerHTML = `
    <style>
      .weapon-data-table {
        ${isDocked ? 'width:100%;height:100%;display:flex;flex-direction:column;' : 'position:fixed;top:50px;right:10px;width:520px;max-height:85vh;'}
        background: #0f0f0f;
        border: 1px solid #222;
        border-radius: 4px;
        color: #a0a0a0;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 11px;
        z-index: 199;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      }
      .wdt-header {
        background: #1c1c1c;
        border-bottom: 1px solid #000;
        padding: 6px 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .wdt-title {
        font-weight: bold;
        font-size: 10px;
        letter-spacing: 0.05em;
        color: #888;
      }
      .wdt-toolbar {
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .wdt-btn {
        padding: 4px 10px;
        background: #333;
        border: 1px solid #444;
        border-radius: 3px;
        color: #ccc;
        cursor: pointer;
        font-size: 10px;
      }
      .wdt-btn:hover { background: #444; }
      .wdt-btn-apply { background: rgba(234,88,12,0.4); border-color: rgba(234,88,12,0.6); color: #fff; }
      .wdt-btn-apply:hover { background: rgba(234,88,12,0.6); }
      .wdt-search {
        width: 140px;
        padding: 4px 8px;
        background: #0a0a0a;
        border: 1px solid #222;
        border-radius: 3px;
        color: #a0a0a0;
        font-size: 10px;
      }
      .wdt-search:focus { outline: none; border-color: rgba(234,88,12,0.4); }
      .wdt-body { overflow: auto; flex: 1; }
      .wdt-table { width: 100%; border-collapse: collapse; }
      .wdt-th {
        background: #1c1c1c;
        padding: 6px 8px;
        text-align: left;
        font-size: 9px;
        letter-spacing: 0.05em;
        color: #666;
        border-bottom: 1px solid #000;
        border-right: 1px solid #000;
      }
      .wdt-td {
        padding: 8px;
        border-bottom: 1px solid #111;
        border-right: 1px solid #111;
        vertical-align: top;
      }
      .wdt-row:hover { background: #151515; }
      .wdt-label {
        font-size: 8px;
        color: rgba(234,88,12,0.7);
        font-weight: bold;
        margin-bottom: 2px;
        text-transform: uppercase;
      }
      .wdt-input {
        width: 100%;
        padding: 4px 6px;
        background: #050505;
        border: 1px solid #222;
        border-radius: 2px;
        color: #e0e0e0;
        font-size: 10px;
      }
      .wdt-input:focus { outline: none; border-color: rgba(234,88,12,0.3); }
      .wdt-input-num { width: 56px; text-align: center; }
      .wdt-vec3 { display: flex; gap: 4px; }
      .wdt-vec3 input { flex: 1; }
      .wdt-footer {
        background: #111;
        border-top: 1px solid #000;
        padding: 4px 10px;
        font-size: 9px;
        color: #555;
      }
    </style>
    <div class="wdt-header">
      <span class="wdt-title">Weapon_Data_Table / Game / Data</span>
      <div class="wdt-toolbar">
        <input type="text" class="wdt-search" id="wdt-search" placeholder="Search..." />
        <button class="wdt-btn wdt-btn-apply" id="wdt-apply">Apply</button>
        <button class="wdt-btn" id="wdt-toggle">−</button>
      </div>
    </div>
    <div class="wdt-body" id="wdt-body">
      <table class="wdt-table" id="wdt-table"></table>
    </div>
    <div class="wdt-footer" id="wdt-footer">Weapons: 2 | Runtime Ready</div>
  `;

  let collapsed = false;
  let livePreview = false;

  function getEffective(slot) {
    const base = WEAPON_DEFINITIONS[slot] ?? WEAPON_DEFINITIONS[WEAPON_SLOT.RIFLE];
    const ov = config.WEAPON_OVERRIDES?.[slot] ?? {};
    return {
      name: ov.name ?? base.name,
      url: ov.url ?? base.url,
      file: ov.file ?? base.file,
      camera: {
        base: { ...(base.camera?.base ?? {}), ...(ov.camera?.base ?? {}) },
        ads: { ...(base.camera?.ads ?? {}), ...(ov.camera?.ads ?? {}) },
        camGlobalOffset: { ...(base.camera?.camGlobalOffset ?? {}), ...(ov.camera?.camGlobalOffset ?? {}) },
      },
      damage: ov.damage ?? 34,
      ammoCount: ov.ammoCount ?? 30,
      isFullAuto: ov.isFullAuto ?? true,
    };
  }

  function updateOverride(slot, path, value) {
    if (!config.WEAPON_OVERRIDES[slot]) config.WEAPON_OVERRIDES[slot] = {};
    const keys = path.split('.');
    let cur = config.WEAPON_OVERRIDES[slot];
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!cur[k] || typeof cur[k] !== 'object') cur[k] = {};
      cur = cur[k];
    }
    cur[keys[keys.length - 1]] = value;
  }

  function render() {
    const table = panel.querySelector('#wdt-table');
    const search = (panel.querySelector('#wdt-search')?.value ?? '').toLowerCase();
    table.innerHTML = `
      <thead>
        <tr>
          <th class="wdt-th" style="width:28px">#</th>
          <th class="wdt-th">Identity</th>
          <th class="wdt-th">Core Stats</th>
          <th class="wdt-th">Camera (Base / ADS)</th>
          <th class="wdt-th">Asset Paths</th>
        </tr>
      </thead>
      <tbody>
        ${[WEAPON_SLOT.RIFLE, WEAPON_SLOT.PISTOL]
          .filter((s) => {
            const w = getEffective(s);
            return !search || (w.name || '').toLowerCase().includes(search);
          })
          .map(
            (slot, idx) => {
              const w = getEffective(slot);
              const base = WEAPON_DEFINITIONS[slot];
              const camBase = w.camera?.base ?? base?.camera?.base ?? { x: 0, y: 0, z: 0 };
              const camAds = w.camera?.ads ?? base?.camera?.ads ?? { x: 0, y: 0, z: 0 };
              return `
              <tr class="wdt-row" data-slot="${slot}">
                <td class="wdt-td" style="text-align:center;opacity:0.5">${idx}</td>
                <td class="wdt-td" style="min-width:140px">
                  <div class="wdt-label">Display Name</div>
                  <input class="wdt-input" data-slot="${slot}" data-path="name" value="${escapeHtml(w.name)}" />
                  <div class="wdt-label" style="margin-top:6px;color:#555">Internal</div>
                  <span style="font-size:9px;color:#666">WEP_${slot === WEAPON_SLOT.RIFLE ? 'Rifle' : 'Pistol'}</span>
                </td>
                <td class="wdt-td" style="min-width:100px">
                  <div class="wdt-label">DMG</div>
                  <input type="number" class="wdt-input wdt-input-num" data-slot="${slot}" data-path="damage" value="${w.damage}" />
                  <div class="wdt-label" style="margin-top:6px">MAG</div>
                  <input type="number" class="wdt-input wdt-input-num" data-slot="${slot}" data-path="ammoCount" value="${w.ammoCount}" />
                  <div style="margin-top:6px;font-size:9px">
                    <label><input type="checkbox" data-slot="${slot}" data-path="isFullAuto" ${w.isFullAuto ? 'checked' : ''} /> Full Auto</label>
                  </div>
                </td>
                <td class="wdt-td" style="min-width:180px">
                  <div class="wdt-label">Base (X,Y,Z)</div>
                  <div class="wdt-vec3">
                    <input type="number" step="0.01" class="wdt-input" data-slot="${slot}" data-path="camera.base.x" value="${camBase.x ?? 0}" placeholder="X" />
                    <input type="number" step="0.01" class="wdt-input" data-slot="${slot}" data-path="camera.base.y" value="${camBase.y ?? 0}" placeholder="Y" />
                    <input type="number" step="0.01" class="wdt-input" data-slot="${slot}" data-path="camera.base.z" value="${camBase.z ?? 0}" placeholder="Z" />
                  </div>
                  <div class="wdt-label" style="margin-top:6px">ADS (X,Y,Z)</div>
                  <div class="wdt-vec3">
                    <input type="number" step="0.01" class="wdt-input" data-slot="${slot}" data-path="camera.ads.x" value="${camAds.x ?? 0}" placeholder="X" />
                    <input type="number" step="0.01" class="wdt-input" data-slot="${slot}" data-path="camera.ads.y" value="${camAds.y ?? 0}" placeholder="Y" />
                    <input type="number" step="0.01" class="wdt-input" data-slot="${slot}" data-path="camera.ads.z" value="${camAds.z ?? 0}" placeholder="Z" />
                  </div>
                </td>
                <td class="wdt-td" style="min-width:160px">
                  <div class="wdt-label">URL</div>
                  <input class="wdt-input" style="font-size:9px" data-slot="${slot}" data-path="url" value="${escapeHtml(w.url)}" />
                  <div class="wdt-label" style="margin-top:6px">File</div>
                  <input class="wdt-input" style="font-size:9px" data-slot="${slot}" data-path="file" value="${escapeHtml(w.file)}" />
                </td>
              </tr>
            `;
            }
          )
          .join('')}
      </tbody>
    `;

    panel.querySelectorAll('.wdt-input, input[type="checkbox"]').forEach((el) => {
      const slot = parseInt(el.dataset.slot, 10);
      const path = el.dataset.path;
      if (!path) return;
      const handler = () => {
        let val = el.type === 'checkbox' ? el.checked : el.value;
        if (el.type === 'number' || path.includes('x') || path.includes('y') || path.includes('z') || path === 'damage' || path === 'ammoCount') {
          val = parseFloat(val);
          if (isNaN(val)) return;
        }
        updateOverride(slot, path, val);
        if (livePreview && onWeaponReload && path.startsWith('camera')) onWeaponReload();
      };
      el.oninput = handler;
      el.onchange = handler;
    });
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function apply() {
    if (onApply) onApply();
    if (onWeaponReload) onWeaponReload();
    render();
  }

  panel.querySelector('#wdt-search').oninput = render;
  panel.querySelector('#wdt-apply').onclick = apply;
  panel.querySelector('#wdt-toggle').onclick = () => {
    collapsed = !collapsed;
    panel.querySelector('#wdt-body').style.display = collapsed ? 'none' : 'block';
    panel.querySelector('#wdt-toggle').textContent = collapsed ? '+' : '−';
  };

  const syncLivePreview = () => {
    const liveCheck = document.getElementById('var-live-preview');
    if (liveCheck) {
      livePreview = !!liveCheck.checked;
    }
  };
  document.addEventListener('change', (e) => {
    if (e.target?.id === 'var-live-preview') syncLivePreview();
  });
  syncLivePreview();

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
