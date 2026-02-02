/**
 * Basalt Level / Scene Outliner — UE5-style hierarchical scene tree
 * Full scene tree from meshes, lights, cameras; search bar; selection sync with Details
 * Tracks current level; add scenes/sub-levels (zones)
 */

export function createLevelOutliner(scene, container, options = {}) {
  if (!container) return null;

  const { getScene, setSelectedNode, getSelectedNode, onSelectionChange } = options;
  let selectedNode = null;
  let searchQuery = '';
  let currentLevel = { id: 'main', name: 'Persistent Level', path: '/Game/Maps/Main' };
  const subLevels = [];

  const panel = document.createElement('div');
  panel.className = 'level-outliner';
  panel.innerHTML = `
    <style>
      .level-outliner {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #161b22;
        color: #c9d1d9;
        font-family: 'Segoe UI', sans-serif;
        font-size: 11px;
        overflow: hidden;
      }
      .lo-search {
        padding: 6px 8px;
        margin: 8px;
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: 4px;
        color: #c9d1d9;
        font-size: 11px;
      }
      .lo-search:focus { outline: none; border-color: #4c65d4; }
      .lo-search::placeholder { color: #6e7681; }
      .lo-tree {
        flex: 1;
        overflow-y: auto;
        padding: 4px 8px;
      }
      .lo-tree ul { list-style: none; margin: 0; padding: 0; }
      .lo-tree li {
        padding: 4px 8px;
        margin: 2px 0;
        border-radius: 2px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .lo-tree li:hover { background: rgba(255,255,255,0.06); }
      .lo-tree li.selected { background: rgba(56,139,253,0.25); border-left: 2px solid #388bfd; }
      .lo-tree .lo-item-icon { font-size: 16px; opacity: 0.8; }
      .lo-tree .lo-item-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
      .lo-tree .lo-item-type { font-size: 9px; color: #6e7681; }
      .lo-footer {
        padding: 6px 10px;
        border-top: 1px solid #30363d;
        font-size: 10px;
        color: #8b949e;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .lo-footer .lo-settings { cursor: pointer; }
      .lo-footer .lo-settings:hover { color: #c9d1d9; }
      .lo-level-bar {
        padding: 6px 8px;
        border-bottom: 1px solid #30363d;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      .lo-level-label { font-size: 10px; color: #8b949e; }
      .lo-level-name { flex: 1; font-size: 11px; overflow: hidden; text-overflow: ellipsis; }
      .lo-add-zone {
        padding: 4px 8px;
        background: #21262d;
        border: 1px solid #30363d;
        border-radius: 2px;
        color: #c9d1d9;
        font-size: 10px;
        cursor: pointer;
      }
      .lo-add-zone:hover { background: #30363d; border-color: #4c65d4; }
    </style>
    <div class="lo-level-bar" id="lo-level-bar">
      <span class="lo-level-label">Level:</span>
      <span class="lo-level-name" id="lo-level-name">Persistent Level</span>
      <button class="lo-add-zone" id="lo-add-zone" title="Add sub-level / zone">+ Zone</button>
    </div>
    <input type="text" class="lo-search" placeholder="Search..." id="lo-search" />
    <div class="lo-tree" id="lo-tree"></div>
    <div class="lo-footer">
      <span id="lo-count">0 actors</span>
      <span class="lo-settings material-symbols-outlined" title="Settings">settings</span>
    </div>
  `;

  const searchInput = panel.querySelector('#lo-search');
  const treeEl = panel.querySelector('#lo-tree');
  const countEl = panel.querySelector('#lo-count');
  const levelNameEl = panel.querySelector('#lo-level-name');
  const addZoneBtn = panel.querySelector('#lo-add-zone');

  const updateLevelDisplay = () => {
    if (levelNameEl) levelNameEl.textContent = currentLevel.name;
  };

  if (addZoneBtn) {
    addZoneBtn.onclick = () => {
      const name = prompt('Sub-level / Zone name:', `Zone_${subLevels.length + 1}`);
      if (name) {
        subLevels.push({ id: 'zone_' + Date.now(), name, path: `${currentLevel.path}/${name}` });
        updateLevelDisplay();
      }
    };
  }
  updateLevelDisplay();

  const resolveScene = () => scene ?? (typeof getScene === 'function' ? getScene() : null);
  const getType = (node) => {
    if (!node) return '';
    const cls = node.getClassName?.() ?? '';
    if (cls.includes('Mesh')) return 'Mesh';
    if (cls.includes('Light')) return 'Light';
    if (cls.includes('Camera')) return 'Camera';
    if (cls.includes('TransformNode')) return 'Transform';
    return 'Node';
  };
  const getName = (node) => node?.name ?? 'Unnamed';

  const buildTree = () => {
    const s = resolveScene();
    const items = [];
    if (s) {
      (s.meshes || []).forEach((m) => {
        if (m.parent === null || !m.parent?.getClassName?.().includes('Mesh')) items.push({ node: m, type: 'Mesh', icon: 'view_in_ar' });
      });
      (s.lights || []).forEach((l) => items.push({ node: l, type: 'Light', icon: 'lightbulb' }));
      (s.cameras || []).forEach((c) => items.push({ node: c, type: 'Camera', icon: 'videocam' }));
      (s.transformNodes || []).forEach((t) => {
        if (t.parent === null) items.push({ node: t, type: 'Transform', icon: 'account_tree' });
      });
    }
    const q = searchQuery.toLowerCase();
    const filtered = q ? items.filter((i) => getName(i.node).toLowerCase().includes(q)) : items;
    const currentSelected = getSelectedNode ? getSelectedNode() : selectedNode;

    countEl.textContent = `${filtered.length} actor${filtered.length !== 1 ? 's' : ''}${currentSelected ? ' (1 selected)' : ''}`;

    treeEl.innerHTML = '';
    const ul = document.createElement('ul');
    filtered.forEach(({ node, type, icon }) => {
      const li = document.createElement('li');
      li.dataset.id = node.id ?? node.uniqueId ?? '';
      const isSelected = currentSelected === node;
      if (isSelected) li.classList.add('selected');
      li.innerHTML = `
        <span class="lo-item-icon material-symbols-outlined">${icon}</span>
        <span class="lo-item-name">${escapeHtml(getName(node))}</span>
        <span class="lo-item-type">${type}</span>
      `;
      li.onclick = () => {
        selectedNode = node;
        if (setSelectedNode) setSelectedNode(node);
        if (onSelectionChange) onSelectionChange(node);
        buildTree();
      };
      ul.appendChild(li);
    });
    treeEl.appendChild(ul);
  };

  const escapeHtml = (s) => {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  searchInput.oninput = () => {
    searchQuery = searchInput.value;
    buildTree();
  };

  buildTree();
  container.appendChild(panel);

  return {
    panel,
    refresh() {
      buildTree();
    },
    dispose() {
      panel.remove();
    },
  };
}
