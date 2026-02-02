/**
 * Basalt Dock Layout — Dockview-based editor shell
 * Docks viewport, variables, weapon data table, inspector.
 * Layout save/restore via localStorage; panelId in params enables restore.
 * Theme support via theme-manager.
 */

import {
  getStoredThemeId,
  setTheme as applyTheme,
  getThemeConfig,
  getDockviewTheme,
  getLayoutPreset,
  setStoredLayoutPresetId,
  getStoredLayoutPresetId,
  applyLayoutPresetOverrides,
} from './theme-manager.js';

const DOCKVIEW_CSS = 'https://cdn.jsdelivr.net/npm/dockview-core@4.13.1/dist/styles/dockview.css';
const DOCKVIEW_ESM = 'https://esm.sh/dockview-core@4.13.1';
const LAYOUT_STORAGE_KEY = 'basalt_dock_layout';
const LAYOUT_STORAGE_KEY_BLUEPRINT = 'basalt_dock_layout_blueprint';
const NICKNAMES_STORAGE_KEY = 'basalt_panel_nicknames';
const LAYOUT_VERSION = 13;

function loadNicknames() {
  try {
    const s = localStorage.getItem(NICKNAMES_STORAGE_KEY);
    return s ? JSON.parse(s) : {};
  } catch (_) {
    return {};
  }
}

function saveNickname(panelId, nickname) {
  try {
    const n = loadNicknames();
    if (nickname) n[panelId] = nickname;
    else delete n[panelId];
    localStorage.setItem(NICKNAMES_STORAGE_KEY, JSON.stringify(n));
  } catch (_) {}
}

function getNickname(panelId) {
  return loadNicknames()[panelId];
}

/** Load Dockview CSS */
function loadDockviewCss() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = DOCKVIEW_CSS;
  document.head.appendChild(link);
}

/** Create slot component factory — each panel gets its own element */
function createSlotComponent(register) {
  return (options) => {
    const element = document.createElement('div');
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.minWidth = '0';
    element.style.minHeight = '0';
    element.style.overflow = 'auto';
    element.style.background = '#161b22';
    element.style.boxSizing = 'border-box';
    element.style.padding = '5px';

    return {
      element,
      init(parameters) {
        const params = parameters?.params ?? {};
        const panelId = params.panelId ?? params.id ?? options?.id;
        if (panelId && typeof register === 'function') {
          register(panelId, element);
        }
      },
      layout(width, height) {
        if (typeof width === 'number' && width > 0) element.style.width = width + 'px';
        if (typeof height === 'number' && height > 0) element.style.height = height + 'px';
      },
    };
  };
}

/** Character editor layout — blueprint center, components panel bottom-right */
function addCharacterEditorLayout(api) {
  api.addPanel({
    id: 'blueprint',
    component: 'slot',
    title: 'Blueprint / Player Objects',
    params: { panelId: 'blueprint' },
    renderer: 'always',
  });
  api.addPanel({
    id: 'variablesPanel',
    component: 'slot',
    title: 'Variables & Components',
    params: { panelId: 'variablesPanel' },
    position: { referencePanel: 'blueprint', direction: 'left' },
    initialWidth: 280,
    minimumWidth: 200,
  });
  api.addPanel({
    id: 'levelOutliner',
    component: 'slot',
    title: 'Level / Scene Outliner',
    params: { panelId: 'levelOutliner' },
    position: { referencePanel: 'blueprint', direction: 'right' },
    initialWidth: 300,
    minimumWidth: 200,
  });
  api.addPanel({
    id: 'contentDrawer',
    component: 'slot',
    title: 'Blueprint Graph',
    params: { panelId: 'contentDrawer' },
    position: { referencePanel: 'blueprint', direction: 'below' },
    initialHeight: 180,
    minimumHeight: 100,
  });
  api.addPanel({
    id: 'contentBrowser',
    component: 'slot',
    title: 'Content Browser',
    params: { panelId: 'contentBrowser' },
    position: { referencePanel: 'blueprint', direction: 'below' },
    initialHeight: 180,
    minimumHeight: 100,
  });
  api.addPanel({
    id: 'componentsPanel',
    component: 'slot',
    title: 'Components / Variables / Functions',
    params: { panelId: 'componentsPanel' },
    position: { referencePanel: 'levelOutliner', direction: 'below' },
    initialHeight: 220,
    minimumHeight: 120,
  });
}

/** Panel definitions for Window menu — id, title, position config */
const RESTORABLE_PANELS = [
  { id: 'placeActors', title: 'Place Actors', ref: 'viewport', dir: 'left', w: 260, minW: 180 },
  { id: 'blueprint', title: 'MC logic graph FOR Micro chip', ref: 'viewport', dir: 'right', w: 320, minW: 200 },
  { id: 'thermometers', title: 'Thermometers', ref: 'levelOutliner', dir: 'below', h: 200, minH: 120 },
  { id: 'detailsPanel', title: 'Details', ref: 'levelOutliner', dir: 'below', h: 280, minH: 180 },
  { id: 'contentDrawer', title: 'Content Drawer', ref: 'viewport', dir: 'below', h: 220, minH: 120 },
  { id: 'contentBrowser', title: 'Content Browser', ref: 'viewport', dir: 'below', h: 220, minH: 120 },
  { id: 'inspectorPanel', title: 'Inspector', ref: 'viewport', dir: 'right', w: 340, minW: 240 },
  { id: 'moduleLibrary', title: 'Module Library', ref: 'viewport', dir: 'right', w: 280, minW: 200 },
];

/** Default layout — viewport center, Place Actors left, Details/Outliner right, Content Browser bottom */
function addDefaultLayout(api) {
  api.addPanel({
    id: 'viewport',
    component: 'slot',
    title: 'Live Editor Viewport',
    params: { panelId: 'viewport' },
    renderer: 'always',
  });

  api.addPanel({
    id: 'placeActors',
    component: 'slot',
    title: 'Place Actors',
    params: { panelId: 'placeActors' },
    position: { referencePanel: 'viewport', direction: 'left' },
    initialWidth: 260,
    minimumWidth: 180,
  });

  api.addPanel({
    id: 'blueprint',
    component: 'slot',
    title: 'MC logic graph FOR Micro chip',
    params: { panelId: 'blueprint' },
    position: { referencePanel: 'viewport', direction: 'right' },
    initialWidth: 320,
    minimumWidth: 200,
  });

  api.addPanel({
    id: 'levelOutliner',
    component: 'slot',
    title: 'Level / Scene Outliner',
    params: { panelId: 'levelOutliner' },
    position: { referencePanel: 'viewport', direction: 'right' },
    initialWidth: 300,
    minimumWidth: 200,
  });

  api.addPanel({
    id: 'thermometers',
    component: 'slot',
    title: 'Thermometers',
    params: { panelId: 'thermometers' },
    position: { referencePanel: 'levelOutliner', direction: 'below' },
    initialHeight: 200,
    minimumHeight: 120,
  });

  api.addPanel({
    id: 'detailsPanel',
    component: 'slot',
    title: 'Details',
    params: { panelId: 'detailsPanel' },
    position: { referencePanel: 'levelOutliner', direction: 'below' },
    initialHeight: 280,
    minimumHeight: 180,
  });

  api.addPanel({
    id: 'contentDrawer',
    component: 'slot',
    title: 'Blueprint Graph',
    params: { panelId: 'contentDrawer' },
    position: { referencePanel: 'viewport', direction: 'below' },
    initialHeight: 220,
    minimumHeight: 120,
  });

  api.addPanel({
    id: 'contentBrowser',
    component: 'slot',
    title: 'Content Browser',
    params: { panelId: 'contentBrowser' },
    position: { referencePanel: 'viewport', direction: 'below' },
    initialHeight: 220,
    minimumHeight: 120,
  });

}

/**
 * Create dock layout. Returns Promise<{ api, containers, dockview, resetLayout }>.
 * Tries to restore from localStorage; falls back to default layout.
 * @param {HTMLElement} rootElement - Container for dockview
 * @param {{ layoutType?: 'editor'|'blueprint' }} [options] - layoutType: 'blueprint' for blueprint editor
 */
export async function createDockLayout(rootElement, options = {}) {
  const isBlueprintEditor = options?.layoutType === 'blueprint';
  loadDockviewCss();

  const mod = await import(/* @vite-ignore */ DOCKVIEW_ESM);
  const { createDockview, themeDark } = mod;
  const storedThemeId = getStoredThemeId();
  const themeConfig = await getThemeConfig(storedThemeId);
  const initialTheme = await getDockviewTheme(themeConfig?.dockviewTheme ?? 'themeDark');
  const theme = initialTheme ?? themeDark;

  const containers = {
    viewport: null,
    placeActors: null,
    objectSpawn: null,
    variablesPanel: null,
    levelOutliner: null,
    detailsPanel: null,
    thermometers: null,
    contentDrawer: null,
    contentBrowser: null,
    inspectorPanel: null,
    moduleLibrary: null,
  };

  /** Pending populators: panelId -> (element) => void. Called when panel element is ready. */
  const pendingPopulators = {};

  const register = (id, el) => {
    containers[id] = el;
    if (id === 'viewport') {
      el.style.background = '#000';
      el.style.overflow = 'hidden';
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.minWidth = '200px';
      el.style.minHeight = '200px';
      el.style.padding = '0';
    }
    if (id === 'blueprint') {
      el.style.background = '#0d1117';
      el.style.overflow = 'hidden';
      el.style.padding = '0';
      el.style.minWidth = '200px';
      el.style.minHeight = '200px';
    }
    if (id === 'variablesPanel') {
      el.style.minHeight = '200px';
      el.style.minWidth = '200px';
      el.style.overflow = 'auto';
    }
    if (id === 'placeActors') {
      el.style.minHeight = '150px';
      el.style.minWidth = '180px';
      el.style.overflow = 'auto';
    }
    if (id === 'inspectorPanel') {
      el.style.minHeight = '200px';
      el.style.minWidth = '240px';
      el.style.overflow = 'auto';
      el.style.padding = '0';
    }
    if (id === 'levelOutliner' || id === 'thermometers') {
      el.style.minHeight = '120px';
      el.style.minWidth = '180px';
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.overflow = 'auto';
    }
    if (id === 'contentDrawer') {
    }
    const populator = pendingPopulators[id];
    if (populator) {
      try {
        populator(el);
      } catch (e) {
        console.warn('[dock-layout] populator error:', e);
      }
      delete pendingPopulators[id];
    }
  };

  const registerPopulator = (panelId, fn) => {
    const el = containers[panelId] ?? Object.values(containers).find((c) => c?.dataset?.panelId === panelId);
    if (el) {
      try {
        fn(el);
      } catch (e) {
        console.warn('[dock-layout] populator error:', e);
      }
    } else {
      pendingPopulators[panelId] = fn;
    }
  };

  const slotFactory = createSlotComponent(register);

  const dockApiRef = {};
  /** Right-side: expand/fullscreen + popout buttons per group */
  const createRightHeaderActionComponent = (groupOrProps) => {
    const group = groupOrProps?.group ?? groupOrProps;
    const el = document.createElement('div');
    el.className = 'dv-header-action-right';
    el.style.cssText = 'display:flex;align-items:center;gap:2px;';
    const doPopout = () => {
      try {
        const dockApi = dockApiRef.api ?? groupOrProps?.api ?? group?.model?.containerApi;
        const g = group?.id ?? group?.api?.id;
        if (g && dockApi?.addPopoutGroup) dockApi.addPopoutGroup({ id: g });
      } catch (_) {}
    };
    const expandBtn = document.createElement('div');
    expandBtn.title = 'Expand / Fullscreen';
    expandBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;">fullscreen</span>';
    expandBtn.style.cssText = 'padding:2px 4px;cursor:pointer;color:var(--dv-inactivegroup-visiblepanel-tab-color,#8b949e);display:flex;align-items:center;justify-content:center;';
    expandBtn.onmouseenter = () => { expandBtn.style.color = 'var(--dv-activegroup-visiblepanel-tab-color,#c9d1d9)'; expandBtn.style.background = 'var(--dv-icon-hover-background-color,rgba(255,255,255,0.08))'; };
    expandBtn.onmouseleave = () => { expandBtn.style.color = ''; expandBtn.style.background = ''; };
    expandBtn.onclick = (e) => { e.stopPropagation(); doPopout(); };
    const popoutBtn = document.createElement('div');
    popoutBtn.title = 'Pop out to new window';
    popoutBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;">open_in_new</span>';
    popoutBtn.style.cssText = 'padding:2px 4px;cursor:pointer;color:var(--dv-inactivegroup-visiblepanel-tab-color,#8b949e);display:flex;align-items:center;justify-content:center;';
    popoutBtn.onmouseenter = () => { popoutBtn.style.color = 'var(--dv-activegroup-visiblepanel-tab-color,#c9d1d9)'; popoutBtn.style.background = 'var(--dv-icon-hover-background-color,rgba(255,255,255,0.08))'; };
    popoutBtn.onmouseleave = () => { popoutBtn.style.color = ''; popoutBtn.style.background = ''; };
    popoutBtn.onclick = (e) => { e.stopPropagation(); doPopout(); };
    el.appendChild(expandBtn);
    el.appendChild(popoutBtn);
    return {
      element: el,
      init(_params) {},
      update(_params) {},
      dispose() {},
    };
  };

  /** Plus button per group → adds chosen panel as tab to THIS group */
  const createLeftHeaderActionComponent = (groupOrProps) => {
    const group = groupOrProps?.group ?? groupOrProps;
    const el = document.createElement('div');
    el.className = 'dv-header-action-plus';
    el.style.cssText = 'display:flex;align-items:center;justify-content:center;width:24px;height:24px;flex-shrink:0;cursor:pointer;color:var(--dv-inactivegroup-visiblepanel-tab-color,#8b949e);font-size:16px;';
    el.innerHTML = '<span style="line-height:1;">+</span>';
    el.title = 'Add panel to this tab group';
    let menuEl = null;
    const closeMenu = () => {
      if (menuEl) { menuEl.remove(); menuEl = null; }
      document.removeEventListener('click', closeMenu);
    };
    el.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (menuEl) { closeMenu(); return; }
      menuEl = document.createElement('div');
      menuEl.style.cssText = 'position:fixed;background:#161b22;border:1px solid #30363d;border-radius:4px;min-width:180px;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,0.4);';
      RESTORABLE_PANELS.forEach((p) => {
        const item = document.createElement('div');
        item.textContent = p.title;
        item.style.cssText = 'padding:8px 12px;cursor:pointer;font-size:11px;color:#c9d1d9;';
        item.onmouseenter = () => { item.style.background = '#21262d'; };
        item.onmouseleave = () => { item.style.background = 'transparent'; };
        item.onclick = (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          openPanel(p.id, group);
          closeMenu();
        };
        menuEl.appendChild(item);
      });
      const rect = el.getBoundingClientRect();
      menuEl.style.left = rect.left + 'px';
      menuEl.style.top = rect.bottom + 'px';
      document.body.appendChild(menuEl);
      setTimeout(() => document.addEventListener('click', closeMenu), 0);
    };
    return {
      element: el,
      init(_params) {},
      update(_params) {},
      dispose() { closeMenu(); },
    };
  };

  const api = createDockview(rootElement, {
    theme,
    createComponent: (opts) => slotFactory(opts),
    createLeftHeaderActionComponent: isBlueprintEditor ? undefined : createLeftHeaderActionComponent,
    createRightHeaderActionComponent,
    disableDnd: false,
    locked: false,
    singleTabMode: 'default',
    dndEdges: {
      size: { value: 80, type: 'pixels' },
      activationSize: { value: 10, type: 'percentage' },
    },
  });
  dockApiRef.api = api;

  const storageKey = isBlueprintEditor ? LAYOUT_STORAGE_KEY_BLUEPRINT : LAYOUT_STORAGE_KEY;
  let restored = false;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const data = JSON.parse(saved);
      if (data?.version === LAYOUT_VERSION) {
        const { version, ...layout } = data;
        api.fromJSON(layout);
        restored = true;
      }
    }
  } catch (_) { /* restore failed */ }

  if (!restored) {
    if (isBlueprintEditor) addCharacterEditorLayout(api);
    else addDefaultLayout(api);
  }

  api.onDidLayoutChange(() => {
    try {
      const data = api.toJSON();
      const toSave = data && typeof data === 'object' ? { ...data, version: LAYOUT_VERSION } : data;
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    } catch (_) { /* ignore */ }
  });

  /** Apply stored nicknames and layout preset names to all panels */
  const applyNicknames = async () => {
    try {
      const nicknames = loadNicknames();
      const preset = await getLayoutPreset(getStoredLayoutPresetId());
      const presetNames = preset?.panelNames ?? {};
      const groups = api.groups ?? [];
      for (const g of groups) {
        const panels = g.api?.panels ?? g.panels ?? [];
        for (const p of panels) {
          const id = p.id ?? p.params?.panelId;
          const nick = id && nicknames[id];
          const title = nick ?? presetNames[id] ?? RESTORABLE_PANELS.find((r) => r.id === id)?.title ?? id;
          if (title && p.api?.setTitle) p.api.setTitle(title);
        }
      }
    } catch (_) {}
  };

  setTimeout(async () => {
    await applyLayoutPresetOverrides();
    await applyNicknames();
  }, 100);

  const resetLayout = () => {
    try {
      localStorage.removeItem(storageKey);
      window.location.reload();
    } catch (e) {
      console.warn('[dock-layout] reset:', e);
    }
  };

  /** Open or focus a panel by id; add if closed. targetGroup = add as tab to that group (from + button). */
  const openPanel = (panelId, targetGroup = null) => {
    try {
      const p = api.getPanel(panelId);
      if (p) {
        p.api.setActive();
        return;
      }
      const def = RESTORABLE_PANELS.find((d) => d.id === panelId);
      if (!def) return;
      const title = getNickname(panelId) || def.title;
      const opts = {
        id: panelId,
        component: 'slot',
        title,
        params: { panelId },
        ...(def.w && { initialWidth: def.w }),
        ...(def.h && { initialHeight: def.h }),
        ...(def.minW && { minimumWidth: def.minW }),
        ...(def.minH && { minimumHeight: def.minH }),
      };
      if (targetGroup) {
        opts.position = { referenceGroup: targetGroup, direction: 'within' };
      } else {
        opts.position = { referencePanel: def.ref, direction: def.dir };
      }
      api.addPanel(opts);
    } catch (e) {
      console.warn('[dock-layout] openPanel:', e);
    }
  };

  /** Rename active panel (nickname); persists to localStorage */
  const renamePanel = () => {
    try {
      const active = api.activePanel;
      if (!active) return;
      const id = active.id ?? active.params?.panelId;
      const current = active.api?.title ?? id;
      const nick = prompt('Nickname for panel:', getNickname(id) || current);
      if (nick != null && nick !== '') {
        saveNickname(id, nick);
        active.api?.setTitle?.(nick);
      }
    } catch (e) {
      console.warn('[dock-layout] renamePanel:', e);
    }
  };

  const getActivePanel = () => api.activePanel;

  const closedPanelIds = new Set();
  if (!isBlueprintEditor) {
    api.onDidRemovePanel?.((e) => {
      const id = e?.panel?.id ?? e?.id;
      if (id && RESTORABLE_PANELS.some((d) => d.id === id)) closedPanelIds.add(id);
    });
  }

  const setTheme = (themeId) => applyTheme(themeId, api);

  const setLayoutPreset = async (presetId) => {
    setStoredLayoutPresetId(presetId);
    await applyLayoutPresetOverrides(presetId);
    await applyNicknames();
  };

  return {
    api,
    containers,
    dockview: api,
    registerPopulator,
    resetLayout,
    openPanel,
    setTheme,
    setLayoutPreset,
    renamePanel,
    getActivePanel,
    restorablePanels: RESTORABLE_PANELS,
    popoutGroup(groupId) {
      try {
        api.addPopoutGroup({ id: groupId });
      } catch (e) {
        console.warn('[dock-layout] popout:', e);
      }
    },
  };
}
