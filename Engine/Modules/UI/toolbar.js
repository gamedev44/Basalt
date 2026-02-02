/**
 * Basalt Toolbar — UE5-style main toolbar
 * Project context, Mode, Save/Undo/Redo, Transform (T/R/S), Snap, Play/Pause/Stop, Viewport, Details, Window
 * Optional: gizmoHandler, editorMode, config, windowMenu, inspectorParent, resetLayout, onPlayInNewWindow, getScene, getHud
 */

export function createToolbar(scene, hud, inspectorParent = null, resetLayout = null, onPlayInNewWindow = null, getScene = null, getHud = null, options = {}) {
  const overlay = document.getElementById('ui-overlay');
  if (!overlay) return { dispose: () => {} };

  const opts = typeof options === 'object' && options !== null ? options : {};
  const {
    openPanel,
    restorablePanels = [],
    gizmoHandler,
    editorMode,
    getGizmoHandler,
    getEditorMode,
    config = {},
    onSave,
    onUndo,
    onRedo,
    onToggleDetails,
  } = opts;

  const _gizmo = () => gizmoHandler ?? getGizmoHandler?.() ?? null;
  const _editor = () => editorMode ?? getEditorMode?.() ?? null;
  const windowMenu = opts.windowMenu ?? (openPanel && restorablePanels?.length ? { openPanel, restorablePanels } : null);

  overlay.innerHTML = '';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.gap = '8px';
  overlay.style.padding = '0 12px';
  overlay.style.flexWrap = 'wrap';

  const btnClass = 'ui-btn';
  const sep = () => {
    const s = document.createElement('span');
    s.className = 'toolbar-sep';
    s.style.cssText = 'width:1px;height:20px;background:#30363d;margin:0 4px;flex-shrink:0;';
    return s;
  };

  const createBtn = (text, title, onClick, active = false) => {
    const b = document.createElement('div');
    b.className = btnClass;
    b.textContent = text;
    b.title = title || text;
    if (onClick) b.onclick = onClick;
    if (active) b.style.background = 'rgba(0, 122, 204, 0.3)';
    return b;
  };

  const createIconBtn = (symbol, title, onClick, active = false) => {
    const b = document.createElement('div');
    b.className = btnClass;
    b.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;">${symbol}</span>`;
    b.title = title;
    if (onClick) b.onclick = onClick;
    if (active) b.style.background = 'rgba(0, 122, 204, 0.3)';
    b.style.padding = '0 8px';
    return b;
  };

  const createDropdown = (label, items, onSelect) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;display:flex;align-items:center;';
    const btn = document.createElement('div');
    btn.className = btnClass;
    btn.textContent = label + ' ▾';
    btn.style.minWidth = '100px';
    wrap.appendChild(btn);
    let menuEl = null;
    const close = () => {
      if (menuEl) { menuEl.remove(); menuEl = null; }
      document.removeEventListener('click', close);
    };
    btn.onclick = (e) => {
      e.stopPropagation();
      if (menuEl) { close(); return; }
      menuEl = document.createElement('div');
      menuEl.style.cssText = 'position:absolute;top:100%;left:0;margin-top:4px;background:#161b22;border:1px solid #30363d;border-radius:4px;min-width:160px;z-index:1000;box-shadow:0 4px 12px rgba(0,0,0,0.4);';
      items.forEach((it) => {
        const row = document.createElement('div');
        row.textContent = it.label;
        row.style.cssText = 'padding:8px 12px;cursor:pointer;font-size:11px;color:#c9d1d9;';
        row.onmouseenter = () => { row.style.background = '#21262d'; };
        row.onmouseleave = () => { row.style.background = 'transparent'; };
        row.onclick = () => { onSelect?.(it); close(); };
        menuEl.appendChild(row);
      });
      wrap.appendChild(menuEl);
      setTimeout(() => document.addEventListener('click', close), 0);
    };
    return { wrap, setLabel: (l) => { btn.textContent = l + ' ▾'; } };
  };

  // Project / Template context — shows actual template (Advanced FPS, Empty Base) from config
  const TEMPLATE_LABELS = { fps: 'Advanced FPS', empty: 'Empty Base' };
  const templateId = config.SCENE_TEMPLATE === 'empty' ? 'empty' : 'fps';
  const projectLabel = (config.PROJECT_NAME || 'MyProject') + ' · ' + (TEMPLATE_LABELS[templateId] || 'Advanced FPS');
  const projectDropdown = createDropdown(projectLabel, [
    { id: 'fps', label: 'Advanced FPS' },
    { id: 'empty', label: 'Empty Base' },
  ], (it) => {
    if (config) {
      config.SCENE_TEMPLATE = it.id;
      onSave?.();
      projectDropdown.setLabel((config.PROJECT_NAME || 'MyProject') + ' · ' + it.label);
      window.location.reload();
    }
  });
  overlay.appendChild(projectDropdown.wrap);
  overlay.appendChild(sep());

  // Mode selector (Selection, Terrain, Foliage — stub)
  const modeDropdown = createDropdown('Selection', [
    { id: 'selection', label: 'Selection' },
    { id: 'terrain', label: 'Terrain' },
    { id: 'foliage', label: 'Foliage' },
  ], () => {});
  overlay.appendChild(modeDropdown.wrap);
  overlay.appendChild(sep());

  // Save, Undo, Redo
  overlay.appendChild(createIconBtn('save', 'Save (Ctrl+S)', () => (onSave || config?.persistConfig)?.()));
  overlay.appendChild(createIconBtn('undo', 'Undo', onUndo));
  overlay.appendChild(createIconBtn('redo', 'Redo', onRedo));
  overlay.appendChild(sep());

  // Transform: Translate, Rotate, Scale
  let activeTransform = 'translate';
  const updateTransformBtns = () => {
    tBtn.style.background = activeTransform === 'translate' ? 'rgba(0, 122, 204, 0.3)' : '';
    rBtn.style.background = activeTransform === 'rotate' ? 'rgba(0, 122, 204, 0.3)' : '';
    sBtn.style.background = activeTransform === 'scale' ? 'rgba(0, 122, 204, 0.3)' : '';
  };
  const tBtn = createIconBtn('open_with', 'Translate (W)', () => {
    activeTransform = 'translate';
    updateTransformBtns();
    _gizmo()?.setGizmoMode?.('translate');
  }, true);
  const rBtn = createIconBtn('rotate_right', 'Rotate (E)', () => {
    activeTransform = 'rotate';
    updateTransformBtns();
    _gizmo()?.setGizmoMode?.('rotate');
  });
  const sBtn = createIconBtn('aspect_ratio', 'Scale (R)', () => {
    activeTransform = 'scale';
    updateTransformBtns();
    _gizmo()?.setGizmoMode?.('scale');
  });
  overlay.appendChild(tBtn);
  overlay.appendChild(rBtn);
  overlay.appendChild(sBtn);
  overlay.appendChild(sep());

  // Snap: World/Local, Grid, Rotation, Scale (stub)
  const snapWorld = createBtn('World', 'Snap to World', () => {});
  const snapGrid = createDropdown('10', [
    { id: '1', label: '1' }, { id: '5', label: '5' }, { id: '10', label: '10' }, { id: '50', label: '50' },
  ], () => {});
  snapGrid.wrap.style.minWidth = '50px';
  overlay.appendChild(snapWorld);
  overlay.appendChild(snapGrid.wrap);
  overlay.appendChild(sep());

  // Play, Pause, Stop
  const playBtn = createIconBtn('play_arrow', 'Play');
  const stopBtn = createIconBtn('stop', 'Stop');
  playBtn.onclick = () => {
    const em = _editor();
    if (em) {
      em.toggle();
      const playing = em.isPlaying;
      playBtn.querySelector('.material-symbols-outlined').textContent = playing ? 'pause' : 'play_arrow';
      playBtn.title = playing ? 'Pause' : 'Play';
    }
  };
  stopBtn.onclick = () => {
    const em = _editor();
    if (em?.isPlaying) {
      em.enterEditMode?.();
      playBtn.querySelector('.material-symbols-outlined').textContent = 'play_arrow';
      playBtn.title = 'Play';
    }
  };
  overlay.appendChild(playBtn);
  overlay.appendChild(stopBtn);

  // Play in New Window
  if (onPlayInNewWindow) {
    overlay.appendChild(sep());
    const playNew = document.createElement('a');
    playNew.href = '#';
    playNew.className = btnClass;
    playNew.textContent = 'Play in New Window';
    playNew.title = 'Open full-screen Play in new tab';
    playNew.onclick = (e) => { e.preventDefault(); onPlayInNewWindow(); };
    overlay.appendChild(playNew);
  }

  overlay.appendChild(sep());

  // Viewport: Perspective, Lit, Show (stub)
  const viewportDropdown = createDropdown('Perspective', [
    { id: 'perspective', label: 'Perspective' },
    { id: 'top', label: 'Top' },
    { id: 'front', label: 'Front' },
    { id: 'left', label: 'Left' },
  ], () => {});
  viewportDropdown.wrap.style.minWidth = '90px';
  overlay.appendChild(viewportDropdown.wrap);
  const litDropdown = createDropdown('Lit', [
    { id: 'lit', label: 'Lit' },
    { id: 'unlit', label: 'Unlit' },
    { id: 'wireframe', label: 'Wireframe' },
  ], () => {});
  litDropdown.wrap.style.minWidth = '70px';
  overlay.appendChild(litDropdown.wrap);
  const showDropdown = createDropdown('Show', [
    { id: 'all', label: 'Show All' },
    { id: 'collision', label: 'Collision' },
    { id: 'bounds', label: 'Bounds' },
  ], () => {});
  showDropdown.wrap.style.minWidth = '70px';
  overlay.appendChild(showDropdown.wrap);
  overlay.appendChild(sep());

  // Inspector, Stats
  const getInspectorParent = opts.getInspectorParent ?? (() => inspectorParent);
  const inspectorBtn = createBtn('Inspector', 'Toggle Inspector', () => {
    const s = getScene ? getScene() : scene;
    if (!s?.debugLayer) return;
    if (s.debugLayer.isVisible()) s.debugLayer.hide();
    else {
      const parent = typeof getInspectorParent === 'function' ? getInspectorParent() : getInspectorParent;
      s.debugLayer.show({ embedMode: true, ...(parent && { parentElement: parent }) });
    }
  });
  inspectorBtn.id = 'inspector-btn';
  overlay.appendChild(inspectorBtn);

  const statsBtn = createBtn('Stats', 'Toggle Stats', () => {
    const h = typeof getHud === 'function' ? getHud() : hud;
    const hudRef = h ?? hud;
    if (hudRef?.statsText) hudRef.statsText.isVisible = !hudRef.statsText.isVisible;
  });
  statsBtn.id = 'stats-btn';
  overlay.appendChild(statsBtn);

  overlay.appendChild(sep());

  // Reset Layout
  if (resetLayout) {
    const resetBtn = createBtn('Reset Layout', 'Reset to default layout', resetLayout);
    resetBtn.id = 'reset-layout-btn';
    overlay.appendChild(resetBtn);
  }

  // Window dropdown
  if (windowMenu?.openPanel && Array.isArray(windowMenu.restorablePanels) && windowMenu.restorablePanels.length > 0) {
    overlay.appendChild(sep());
    const winDropdown = createDropdown('Window', windowMenu.restorablePanels.map((p) => ({ id: p.id, label: p.title })), (it) => windowMenu.openPanel(it.id));
    overlay.appendChild(winDropdown.wrap);
  }

  // Initialize gizmo mode if handler provided
  const gh = _gizmo();
  if (gh?.setGizmoMode) gh.setGizmoMode('translate');

  return {
    dispose() {
      overlay.innerHTML = '';
    },
  };
}
