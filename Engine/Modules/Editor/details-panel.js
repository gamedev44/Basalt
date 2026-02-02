/**
 * Basalt Details Panel — UE5-style property editor for selected actor
 * Transform (Location, Rotation, Scale), Mobility, Static Mesh
 * Wire to selected node from level-outliner
 */

const CATEGORIES = ['All', 'General', 'Actor', 'LOD', 'Misc', 'Physics', 'Rendering'];
const MOBILITY_OPTIONS = ['Static', 'Stationary', 'Movable'];

export function createDetailsPanel(container, options = {}) {
  if (!container) return { dispose: () => {} };

  const { getSelectedNode, getScene } = options;
  let selectedNode = null;
  let activeCategory = 'All';

  const root = document.createElement('div');
  root.className = 'details-panel';
  root.innerHTML = `
    <style>
      .details-panel {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #161b22;
        color: #c9d1d9;
        font-size: 11px;
        overflow: hidden;
      }
      .dp-search {
        padding: 6px 8px;
        margin: 8px;
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: 4px;
        color: #c9d1d9;
        font-size: 11px;
      }
      .dp-search:focus { outline: none; border-color: #4c65d4; }
      .dp-search::placeholder { color: #6e7681; }
      .dp-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        padding: 0 8px 8px;
        border-bottom: 1px solid #30363d;
      }
      .dp-tab {
        padding: 4px 8px;
        background: #21262d;
        border-radius: 4px;
        cursor: pointer;
        font-size: 10px;
      }
      .dp-tab:hover { background: #30363d; }
      .dp-tab.active { background: #388bfd; color: #fff; }
      .dp-content {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }
      .dp-section {
        margin-bottom: 12px;
      }
      .dp-section-title {
        font-size: 10px;
        font-weight: 600;
        color: #8b949e;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 6px;
      }
      .dp-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
      }
      .dp-label { width: 60px; color: #8b949e; font-size: 10px; }
      .dp-input {
        flex: 1;
        padding: 4px 6px;
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: 2px;
        color: #c9d1d9;
        font-size: 11px;
      }
      .dp-input:focus { outline: none; border-color: #4c65d4; }
      .dp-reset {
        padding: 2px 6px;
        background: #21262d;
        border: 1px solid #30363d;
        border-radius: 2px;
        color: #8b949e;
        cursor: pointer;
        font-size: 10px;
      }
      .dp-reset:hover { background: #30363d; color: #c9d1d9; }
      .dp-empty { color: #6e7681; font-size: 11px; padding: 16px; text-align: center; }
      .dp-mobility select {
        padding: 4px 8px;
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: 2px;
        color: #c9d1d9;
        font-size: 11px;
        width: 100%;
      }
      .dp-mesh-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        background: #21262d;
        border-radius: 4px;
        margin-top: 4px;
      }
      .dp-mesh-thumb {
        width: 48px;
        height: 48px;
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6e7681;
      }
      .dp-mesh-actions { display: flex; gap: 4px; }
      .dp-mesh-btn {
        padding: 4px 8px;
        background: #21262d;
        border: 1px solid #30363d;
        border-radius: 2px;
        color: #c9d1d9;
        cursor: pointer;
        font-size: 10px;
      }
      .dp-mesh-btn:hover { background: #30363d; }
    </style>
    <input type="text" class="dp-search" placeholder="Search..." id="dp-search" />
    <div class="dp-tabs" id="dp-tabs"></div>
    <div class="dp-content" id="dp-content"></div>
  `;

  const searchInput = root.querySelector('#dp-search');
  const tabsEl = root.querySelector('#dp-tabs');
  const contentEl = root.querySelector('#dp-content');

  const updateSelection = () => {
    selectedNode = getSelectedNode ? getSelectedNode() : null;
    render();
  };

  const renderTabs = () => {
    tabsEl.innerHTML = '';
    CATEGORIES.forEach((c) => {
      const tab = document.createElement('div');
      tab.className = 'dp-tab' + (activeCategory === c ? ' active' : '');
      tab.textContent = c;
      tab.onclick = () => {
        activeCategory = c;
        renderTabs();
        renderContent();
      };
      tabsEl.appendChild(tab);
    });
  };

  const renderContent = () => {
    if (!selectedNode) {
      contentEl.innerHTML = '<div class="dp-empty">Select an actor to view details</div>';
      return;
    }

    const pos = selectedNode.position || { x: 0, y: 0, z: 0 };
    const rot = selectedNode.rotation ? (selectedNode.rotationQuaternion ? selectedNode.rotation : { x: 0, y: 0, z: 0 }) : { x: 0, y: 0, z: 0 };
    const scale = selectedNode.scaling || { x: 1, y: 1, z: 1 };

    const formatVec = (v) => (v && typeof v.x === 'number' ? `${v.x.toFixed(2)}, ${(v.y ?? 0).toFixed(2)}, ${(v.z ?? 0).toFixed(2)}` : '0, 0, 0');
    const parseVec = (s) => {
      const parts = String(s).split(',').map((x) => parseFloat(x.trim()) || 0);
      return { x: parts[0] ?? 0, y: parts[1] ?? 0, z: parts[2] ?? 0 };
    };

    const resetPos = () => {
      if (selectedNode?.position) selectedNode.position.set(0, 0, 0);
      renderContent();
    };
    const resetRot = () => {
      if (selectedNode?.rotation) selectedNode.rotation.set(0, 0, 0);
      renderContent();
    };
    const resetScale = () => {
      if (selectedNode?.scaling) selectedNode.scaling.set(1, 1, 1);
      renderContent();
    };

    contentEl.innerHTML = `
      <div class="dp-section">
        <div class="dp-section-title">Transform</div>
        <div class="dp-row">
          <span class="dp-label">Location</span>
          <input type="text" class="dp-input" id="dp-pos" value="${formatVec(pos)}" />
          <button class="dp-reset" id="dp-reset-pos">Reset</button>
        </div>
        <div class="dp-row">
          <span class="dp-label">Rotation</span>
          <input type="text" class="dp-input" id="dp-rot" value="${formatVec(rot)}" />
          <button class="dp-reset" id="dp-reset-rot">Reset</button>
        </div>
        <div class="dp-row">
          <span class="dp-label">Scale</span>
          <input type="text" class="dp-input" id="dp-scale" value="${formatVec(scale)}" />
          <button class="dp-reset" id="dp-reset-scale">Reset</button>
        </div>
      </div>
      <div class="dp-section">
        <div class="dp-section-title">Mobility</div>
        <div class="dp-mobility">
          <select id="dp-mobility">
            ${MOBILITY_OPTIONS.map((o) => `<option value="${o}" ${(selectedNode.metadata?.basaltMobility ?? 'Movable') === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="dp-section">
        <div class="dp-section-title">Static Mesh</div>
        <div class="dp-mesh-row">
          <div class="dp-mesh-thumb"><span class="material-symbols-outlined">view_in_ar</span></div>
          <div class="dp-mesh-actions">
            <button class="dp-mesh-btn" id="dp-browse">Browse</button>
            <button class="dp-mesh-btn" id="dp-reset-mesh">Reset</button>
          </div>
        </div>
      </div>
    `;

    const posInput = contentEl.querySelector('#dp-pos');
    const rotInput = contentEl.querySelector('#dp-rot');
    const scaleInput = contentEl.querySelector('#dp-scale');

    if (posInput && selectedNode?.position) {
      posInput.onchange = () => {
        const v = parseVec(posInput.value);
        selectedNode.position.set(v.x, v.y, v.z);
      };
    }
    if (rotInput && selectedNode?.rotation) {
      rotInput.onchange = () => {
        const v = parseVec(rotInput.value);
        selectedNode.rotation.set(v.x, v.y, v.z);
      };
    }
    if (scaleInput && selectedNode?.scaling) {
      scaleInput.onchange = () => {
        const v = parseVec(scaleInput.value);
        selectedNode.scaling.set(v.x, v.y, v.z);
      };
    }
    contentEl.querySelector('#dp-reset-pos')?.addEventListener('click', resetPos);
    contentEl.querySelector('#dp-reset-rot')?.addEventListener('click', resetRot);
    contentEl.querySelector('#dp-reset-scale')?.addEventListener('click', resetScale);
    const mobilitySelect = contentEl.querySelector('#dp-mobility');
    if (mobilitySelect && selectedNode) {
      mobilitySelect.onchange = () => {
        const val = mobilitySelect.value;
        if (!selectedNode.metadata) selectedNode.metadata = {};
        selectedNode.metadata.basaltMobility = val;
        if (selectedNode.physicsImpostor !== undefined) {
          if (val === 'Static') {
            selectedNode.physicsImpostor?.dispose?.();
            selectedNode.physicsImpostor = null;
          } else if (val === 'Movable' && !selectedNode.physicsImpostor) {
            try {
              const scene = options?.getScene?.();
              if (scene) selectedNode.physicsImpostor = new BABYLON.PhysicsImpostor(selectedNode, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1 }, scene);
            } catch (_) {}
          }
        }
      };
    }
    contentEl.querySelector('#dp-browse')?.addEventListener('click', () => {
      if (typeof openContentBrowser === 'function') openContentBrowser();
      else if (options?.openContentBrowser) options.openContentBrowser();
    });
    contentEl.querySelector('#dp-reset-mesh')?.addEventListener('click', () => {
      if (selectedNode?.scaling) selectedNode.scaling.set(1, 1, 1);
      if (selectedNode?.rotation) selectedNode.rotation.set(0, 0, 0);
      renderContent();
    });
  };

  const render = () => {
    renderTabs();
    renderContent();
  };

  render();

  container.appendChild(root);

  return {
    refresh: updateSelection,
    dispose() {
      root.remove();
    },
  };
}
