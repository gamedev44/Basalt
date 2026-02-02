/**
 * Basalt Content Browser — UE5-style asset browser
 * Toolbar (+ Add, Import, Save All), breadcrumbs, folder tree, asset grid
 */

const ASSETS = [
  { id: 'folder_game', name: 'Game', type: 'folder', path: '/Game' },
  { id: 'folder_data', name: 'Data', type: 'folder', path: '/Game/Data' },
  { id: 'dt_weapons', name: 'DT_Weapons', type: 'data-table', path: '/Game/Data/DT_Weapons', icon: 'table_chart' },
  { id: 'folder_blueprints', name: 'Blueprints', type: 'folder', path: '/Game/Blueprints' },
  { id: 'bp_player', name: 'BP_Player', type: 'blueprint', path: '/Game/Blueprints/BP_Player', icon: 'account_tree' },
  { id: 'bp_weapon', name: 'BP_Weapon', type: 'blueprint', path: '/Game/Blueprints/BP_Weapon', icon: 'account_tree' },
  { id: 'bp_interactable', name: 'BP_Interactable', type: 'blueprint', path: '/Game/Blueprints/BP_Interactable', icon: 'account_tree' },
  { id: 'folder_maps', name: 'Maps', type: 'folder', path: '/Game/Maps' },
  { id: 'folder_materials', name: 'Materials', type: 'folder', path: '/Game/Materials' },
  { id: 'folder_starter', name: 'StarterContent', type: 'folder', path: '/Game/StarterContent' },
];

const FOLDER_TREE_BASE = [
  { id: 'fav', name: 'Favorites', icon: 'star', children: [] },
  { id: 'level', name: 'LevelDesignProject', icon: 'folder', children: [
    { id: 'content', name: 'Content', path: '/Game' },
    { id: 'blueprints', name: 'Blueprints', path: '/Game/Blueprints' },
    { id: 'starter', name: 'StarterContent', path: '/Game/StarterContent' },
  ]},
  { id: 'collections', name: 'Collections', icon: 'collections_bookmark', children: [] },
];

function getFolderTree(getProjectName) {
  const projectName = typeof getProjectName === 'function' ? getProjectName() : null;
  const name = projectName || 'MyProject';
  const tree = JSON.parse(JSON.stringify(FOLDER_TREE_BASE));
  const level = tree.find((t) => t.id === 'level');
  if (level) level.name = name;
  return tree;
}

export function createContentBrowser(container, dockApi, { onOpenWeaponTable, onOpenBlueprint, onOpenFolder, onSaveAll, onSelectionChange, getScene, onLoadMeshIntoScene, getSelectedNode, onAssignMeshToSelected, getProjectName } = {}) {
  if (!container) return { dispose: () => {} };

  let currentPath = '/Game';
  const pathToBreadcrumbs = (p) => ['All', ...(p || '/Game').replace(/^\//, '').split('/').filter(Boolean)];
  let breadcrumbs = pathToBreadcrumbs(currentPath);

  const root = document.createElement('div');
  root.className = 'content-browser';
  root.innerHTML = `
    <style>
      .content-browser {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #161b22;
        color: #c9d1d9;
        font-size: 11px;
        overflow: hidden;
      }
      .cb-toolbar {
        padding: 6px 8px;
        border-bottom: 1px solid #30363d;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      .cb-toolbar-btn {
        padding: 4px 8px;
        background: #21262d;
        border: 1px solid #30363d;
        border-radius: 2px;
        color: #c9d1d9;
        cursor: pointer;
        font-size: 10px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .cb-toolbar-btn:hover { background: #30363d; }
      .cb-breadcrumbs {
        padding: 4px 8px;
        border-bottom: 1px solid #30363d;
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
        font-size: 10px;
        color: #8b949e;
      }
      .cb-breadcrumb {
        cursor: pointer;
      }
      .cb-breadcrumb:hover { color: #c9d1d9; }
      .cb-breadcrumb-sep { color: #6e7681; }
      .cb-body {
        flex: 1;
        display: flex;
        min-height: 0;
      }
      .cb-tree {
        width: 180px;
        min-width: 140px;
        border-right: 1px solid #30363d;
        overflow-y: auto;
        padding: 8px;
      }
      .cb-tree-item {
        padding: 4px 8px;
        margin: 2px 0;
        border-radius: 2px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
      }
      .cb-tree-item:hover { background: rgba(255,255,255,0.06); }
      .cb-tree-item .material-symbols-outlined { font-size: 16px; opacity: 0.8; }
      .cb-tree-children { padding-left: 16px; }
      .cb-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .cb-search {
        flex: 1;
        min-width: 0;
        padding: 4px 8px;
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: 2px;
        color: #c9d1d9;
        font-size: 11px;
      }
      .cb-search:focus { outline: none; border-color: #4c65d4; }
      .cb-grid {
        flex: 1;
        overflow: auto;
        padding: 8px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 8px;
        align-content: start;
      }
      .cb-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 72px;
        padding: 8px;
        background: #21262d;
        border: 1px solid #30363d;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s;
      }
      .cb-card:hover {
        background: #30363d;
        border-color: #4c65d4;
      }
      .cb-card:active { background: #388bfd; }
      .cb-card-icon {
        font-size: 24px;
        margin-bottom: 4px;
        opacity: 0.9;
      }
      .cb-card-name {
        font-size: 10px;
        text-align: center;
        word-break: break-all;
        line-height: 1.2;
      }
      .cb-card[data-type="folder"] .cb-card-icon { color: #f0883e; }
      .cb-card[data-type="data-table"] .cb-card-icon { color: #58a6ff; }
      .cb-card[data-type="blueprint"] .cb-card-icon { color: #a371f7; }
      .cb-card.cb-card-selected { border-color: #4c65d4; background: #30363d; }
      .cb-footer {
        padding: 4px 8px;
        border-top: 1px solid #30363d;
        font-size: 10px;
        color: #8b949e;
        flex-shrink: 0;
      }
    </style>
    <div class="cb-toolbar">
      <button class="cb-toolbar-btn" id="cb-add" title="Add"><span class="material-symbols-outlined" style="font-size:16px;">add</span> Add</button>
      <button class="cb-toolbar-btn" id="cb-import" title="Import">Import</button>
      <label class="cb-toolbar-btn" for="cb-folder-input" title="Open Folder (Monaco file browser)" style="cursor:pointer;margin:0;"><span class="material-symbols-outlined" style="font-size:16px;">folder_open</span> Open Folder</label>
      <input type="file" id="cb-folder-input" webkitdirectory directory multiple style="position:absolute;width:0;height:0;opacity:0;pointer-events:none;">
      <button class="cb-toolbar-btn" id="cb-save" title="Save All">Save All</button>
      <input type="text" class="cb-search" placeholder="Search assets..." id="cb-search" />
    </div>
    <div class="cb-breadcrumbs" id="cb-breadcrumbs">All &gt; Content &gt; StarterContent</div>
    <div class="cb-body">
      <div class="cb-tree" id="cb-tree"></div>
      <div class="cb-main">
        <div class="cb-grid" id="cb-grid"></div>
        <div class="cb-footer" id="cb-footer">0 items</div>
      </div>
    </div>
  `;

  const grid = root.querySelector('#cb-grid');
  const searchInput = root.querySelector('#cb-search');
  const breadcrumbsEl = root.querySelector('#cb-breadcrumbs');
  const treeEl = root.querySelector('#cb-tree');
  const footerEl = root.querySelector('#cb-footer');
  let filter = '';

  const renderBreadcrumbs = () => {
    breadcrumbs = pathToBreadcrumbs(currentPath);
    breadcrumbsEl.innerHTML = breadcrumbs.map((b, i) => `
      ${i > 0 ? '<span class="cb-breadcrumb-sep">&gt;</span>' : ''}
      <span class="cb-breadcrumb" data-idx="${i}">${escapeHtml(b)}</span>
    `).join('');
    breadcrumbsEl.querySelectorAll('.cb-breadcrumb').forEach((el) => {
      const idx = parseInt(el.dataset.idx, 10);
      el.onclick = () => {
        breadcrumbs = breadcrumbs.slice(0, idx + 1);
        currentPath = '/' + breadcrumbs.slice(1).join('/') || '/Game';
        renderBreadcrumbs();
        renderCards();
      };
    });
  };

  const renderTree = () => {
    const FOLDER_TREE = getFolderTree(getProjectName);
    treeEl.innerHTML = FOLDER_TREE.map((item) => `
      <div class="cb-tree-item" data-id="${item.id}">
        <span class="material-symbols-outlined">${item.icon}</span>
        <span>${escapeHtml(item.name)}</span>
      </div>
      ${(item.children || []).map((c) => `
        <div class="cb-tree-children">
          <div class="cb-tree-item" data-path="${c.path || ''}">${escapeHtml(c.name)}</div>
        </div>
      `).join('')}
    `).join('');
    treeEl.querySelectorAll('.cb-tree-item').forEach((el) => {
      el.onclick = () => {
        const path = el.dataset.path;
        if (path) {
          currentPath = path;
          renderBreadcrumbs();
          renderCards();
        }
      };
    });
  };

  function renderCards() {
    const q = filter.toLowerCase();
    const base = (currentPath === '/Game' ? '/Game' : currentPath).replace(/\/$/, '');
    const isDirectChild = (a) => {
      if (a.path === base) return true;
      if (!a.path.startsWith(base + '/')) return false;
      const rest = a.path.slice(base.length + 1);
      return rest.indexOf('/') < 0;
    };
    const filtered = ASSETS.filter(
      (a) => isDirectChild(a) && (!q || a.name.toLowerCase().includes(q) || a.path.toLowerCase().includes(q))
    );
    const assetMap = {};
    filtered.forEach((a) => (assetMap[a.id] = a));
    grid.innerHTML = filtered
      .map(
        (asset) => `
      <div class="cb-card" data-id="${asset.id}" data-type="${asset.type}">
        <span class="cb-card-icon material-symbols-outlined">${asset.type === 'folder' ? 'folder' : asset.type === 'blueprint' ? 'account_tree' : asset.type === 'mesh' ? 'view_in_ar' : 'table_chart'}</span>
        <span class="cb-card-name">${escapeHtml(asset.name)}</span>
      </div>
    `
      )
      .join('');

    if (footerEl) footerEl.textContent = `${filtered.length} item${filtered.length !== 1 ? 's' : ''}`;
    let selectedAsset = null;
    grid.querySelectorAll('.cb-card').forEach((card) => {
      const asset = assetMap[card.dataset.id];
      if (!asset) return;
      card.onclick = () => {
        selectedAsset = asset;
        grid.querySelectorAll('.cb-card').forEach((c) => c.classList.remove('cb-card-selected'));
        card.classList.add('cb-card-selected');
        onSelectionChange?.(asset);
      };
      card.ondblclick = (e) => {
        if (asset.type === 'folder' && asset.path) {
          currentPath = asset.path;
          renderBreadcrumbs();
          renderCards();
        } else if (asset.type === 'mesh') {
          loadMeshIntoScene(asset);
        } else {
          openAsset(asset);
        }
      };
      card.oncontextmenu = (e) => {
        e.preventDefault();
        selectedAsset = asset;
        onSelectionChange?.(asset);
        const menu = document.createElement('div');
        menu.className = 'cb-context-menu';
        menu.style.cssText = 'position:fixed;background:#21262d;border:1px solid #30363d;border-radius:4px;padding:4px 0;min-width:180px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.4);';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        const items = asset.type === 'folder'
          ? [{ label: 'Open', fn: () => { currentPath = asset.path; renderBreadcrumbs(); renderCards(); } }]
          : asset.type === 'blueprint'
          ? [
              { label: 'Open Blueprint Editor (Docked)', fn: () => openAsset(asset, false) },
              { label: 'Open Blueprint Editor in New Window', fn: () => openAsset(asset, true) },
            ]
          : asset.type === 'data-table'
            ? [
                { label: 'Open (Docked)', fn: () => openAsset(asset, false) },
                { label: 'Open in New Window', fn: () => openAsset(asset, true) },
              ]
            : asset.type === 'mesh'
              ? (() => {
                  const items = [{ label: 'Load into scene', fn: () => loadMeshIntoScene(asset) }];
                  const sel = typeof getSelectedNode === 'function' ? getSelectedNode() : null;
                  if (sel && onAssignMeshToSelected) items.push({ label: 'Assign to selected actor', fn: () => onAssignMeshToSelected(asset, sel) });
                  return items;
                })()
              : [
                  { label: 'Open (Docked)', fn: () => openAsset(asset, false) },
                  { label: 'Open in New Window', fn: () => openAsset(asset, true) },
                ];
        items.forEach(({ label, fn }) => {
          const item = document.createElement('div');
          item.textContent = label;
          item.style.cssText = 'padding:6px 12px;cursor:pointer;font-size:11px;color:#c9d1d9;';
          item.onmouseenter = () => (item.style.background = '#30363d');
          item.onmouseleave = () => (item.style.background = '');
          item.onclick = () => { fn(); menu.remove(); };
          menu.appendChild(item);
        });
        document.body.appendChild(menu);
        const close = () => { menu.remove(); document.removeEventListener('click', close); };
        setTimeout(() => document.addEventListener('click', close), 0);
      };
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

  async function loadMeshIntoScene(asset) {
    if (onLoadMeshIntoScene) {
      onLoadMeshIntoScene(asset);
      return;
    }
    const scene = typeof getScene === 'function' ? getScene() : getScene;
    if (!scene || !BABYLON) return;
    try {
      if (asset.file) {
        const url = URL.createObjectURL(asset.file);
        const name = asset.name || 'ImportedMesh';
        const result = await BABYLON.SceneLoader.ImportMeshAsync('', '', url, scene);
        URL.revokeObjectURL(url);
        const meshes = result?.meshes ?? [];
        if (meshes.length) {
          const root = meshes[0];
          root.name = name + '_' + Date.now();
          root.position.set(0, 0, 0);
        }
      } else {
        const mesh = BABYLON.MeshBuilder.CreateBox(asset.name + '_' + Date.now(), { size: 1 }, scene);
        mesh.position.set(0, 0.5, 0);
      }
    } catch (e) {
      console.warn('[content-browser] Load mesh:', e);
    }
  }

  function openAsset(asset, asFloat = false) {
    if (!dockApi?.addPanel) return;
    if (asset.type === 'data-table' && asset.id === 'dt_weapons') {
      const panelId = 'dt_weapons_' + Date.now();
      if (onOpenWeaponTable) onOpenWeaponTable(panelId);
      const panel = dockApi.addPanel({
        id: panelId,
        component: 'slot',
        title: 'DT_Weapons',
        params: { panelId, type: 'weapon-data-table' },
        position: { referencePanel: 'contentBrowser', direction: 'right' },
        initialWidth: 520,
        minimumWidth: 400,
      });
      if (asFloat && panel && dockApi.addPopoutGroup) {
        try {
          dockApi.addPopoutGroup(panel);
        } catch (_) {}
      }
    } else if (asset.type === 'blueprint') {
      if (onOpenBlueprint) {
        onOpenBlueprint(asset, asFloat);
      } else if (dockApi.openPanel) {
        dockApi.openPanel('blueprint');
      }
    }
  }

  searchInput.oninput = () => {
    filter = searchInput.value;
    renderCards();
  };

  root.querySelector('#cb-add')?.addEventListener('click', () => {
    const name = prompt('New folder name:', 'NewFolder');
    if (name && /^[a-zA-Z0-9_]+$/.test(name)) {
      const newPath = currentPath.replace(/\/$/, '') + '/' + name;
      ASSETS.push({ id: 'folder_' + name.toLowerCase(), name, type: 'folder', path: newPath });
      renderCards();
    } else if (name) alert('Use letters, numbers, underscores only.');
  });
  root.querySelector('#cb-import')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.glb,.gltf,.fbx,.json';
    input.multiple = true;
    input.onchange = () => {
      const files = Array.from(input.files || []);
      files.forEach((f) => {
        const ext = (f.name.split('.').pop() || '').toLowerCase();
        const name = f.name.replace(/\.[^/.]+$/, '');
        const path = currentPath.replace(/\/$/, '') + '/' + name;
        ASSETS.push({ id: 'import_' + Date.now() + '_' + name, name, type: ext === 'glb' || ext === 'gltf' ? 'mesh' : 'asset', path, file: f });
      });
      renderCards();
    };
    input.click();
  });

  const folderInput = root.querySelector('#cb-folder-input');
  folderInput?.addEventListener('change', (e) => {
    const files = Array.from(e.target?.files || []);
    if (files.length && onOpenFolder) onOpenFolder(files);
  });
  root.querySelector('#cb-save')?.addEventListener('click', () => onSaveAll?.());

  renderBreadcrumbs();
  renderTree();
  renderCards();
  container.appendChild(root);

  return {
    dispose() {
      root.remove();
    },
  };
}
