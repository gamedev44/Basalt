/**
 * Basalt Main — Bootstrap via module registry.
 * Template loader: FPS (default) or Empty (Z-up) scene.
 * When #layout-root exists and dock-layout module is enabled, uses Dockview layout.
 * Editor viewport: iframe with Live_Web_Viewport (exact same as Play in New Window).
 */

import { loadModules } from './loader.js';
import { createEmptyTemplate, SCENE_TEMPLATE, getActiveTemplate } from './Core/templates.js';
import { getEnabledModules } from './modules.config.js';
import { log, logError, getLog, renderLogHTML } from './Core/diagnostic-log.js';

const PLAY_VIEW_URL = 'Live_Web_Viewport_W_Inspector.html';

function showError(err) {
  const root = document.getElementById('layout-root');
  if (!root) return;
  const logHtml = getLog().length ? `<div style="margin-top:16px;max-height:200px;overflow-y:auto;text-align:left;font-family:monospace;font-size:10px;">${renderLogHTML()}</div>` : '';
  root.innerHTML = `
    <div style="padding:24px;max-width:560px;margin:auto;color:#c9d1d9;font-family:Segoe UI,sans-serif;">
      <h3 style="color:#f0883e;margin:0 0 12px 0;">Editor failed to load</h3>
      <p style="font-size:13px;margin:0 0 8px 0;color:#c9d1d9;">${(err?.message || String(err)).slice(0, 200)}</p>
      <p style="font-size:11px;color:#6e7681;margin:0 0 16px 0;">Run a local server (npx serve) if using file://. Copy log below for diagnosis.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <a href="Live_Web_Viewport_W_Inspector.html" class="ui-btn" style="display:inline-block;padding:8px 14px;background:#388bfd;color:#fff;text-decoration:none;border-radius:4px;font-size:12px;">Play in New Window</a>
        <a href="?resetLayout=1" class="ui-btn" style="display:inline-block;padding:8px 14px;background:#21262d;border:1px solid #30363d;color:#c9d1d9;text-decoration:none;border-radius:4px;font-size:12px;">Reset layout</a>
        <button onclick="location.reload()" class="ui-btn" style="padding:8px 14px;background:#21262d;border:1px solid #30363d;color:#c9d1d9;cursor:pointer;border-radius:4px;font-size:12px;">Retry</button>
      </div>
      <details style="margin-top:12px;">
        <summary style="cursor:pointer;color:#58a6ff;font-size:11px;">Diagnostic log (click to expand)</summary>
        ${logHtml}
      </details>
    </div>
  `;
}

async function init() {
  log('main', 'Loading modules...');
  const m = await loadModules();
  log('main', `Loaded ${Object.keys(m).length} modules`);

  if (!m.config) {
    const err = new Error('config module required');
    logError('main:config', err);
    throw err;
  }
  log('main', 'Loading config schema...');
  await m.config.loadSchema?.();
  m.config.initConfig?.();
  const config = m.config.config ?? {};
  log('main', `Config ready, template=${config.SCENE_TEMPLATE ?? 'fps'}`);

  let canvas = document.getElementById('renderCanvas');
  let layoutContainers = null;
  let dockLayout = null;
  let useIframeViewport = false;

  const layoutRoot = document.getElementById('layout-root');
  const isBlueprintEditor = document.body?.dataset?.mode === 'blueprint-editor';
  if (layoutRoot && m['dock-layout']?.createDockLayout) {
    log('main', 'Creating dock layout...');
    const DOCK_TIMEOUT_MS = 25000;
    const dockPromise = m['dock-layout'].createDockLayout(layoutRoot, {
      layoutType: isBlueprintEditor ? 'blueprint' : 'editor',
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Dock layout timed out (CDN/network?)')), DOCK_TIMEOUT_MS)
    );
    try {
      layoutRoot.innerHTML = '';
      dockLayout = await Promise.race([dockPromise, timeoutPromise]);
      log('main', 'Dock layout ready');
    } catch (e) {
      logError('main:dock-layout', e);
      console.error('[Basalt] Dock layout failed:', e);
      showError(e);
      throw e;
    }
    layoutContainers = dockLayout.containers;
    for (let i = 0; i < 40; i++) {
      if (layoutContainers.viewport || layoutContainers.blueprint) break;
      await new Promise((r) => requestAnimationFrame(r));
    }
    if (layoutContainers.viewport && !isBlueprintEditor) {
      useIframeViewport = true;
      const iframe = document.createElement('iframe');
      iframe.id = 'basalt-viewport-iframe';
      iframe.src = new URL(PLAY_VIEW_URL, window.location.href).href;
      iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
      layoutContainers.viewport.appendChild(iframe);
      canvas = document.createElement('canvas');
      canvas.id = 'renderCanvas';
      canvas.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;';
      document.body.appendChild(canvas);
    } else if (isBlueprintEditor) {
      canvas = document.createElement('canvas');
      canvas.id = 'renderCanvas';
      canvas.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;';
      document.body.appendChild(canvas);
    }
  }

  if (!canvas) throw new Error('renderCanvas not found');

  const playUrl = typeof window !== 'undefined' && window.location?.href
    ? new URL(PLAY_VIEW_URL, window.location.href).href
    : PLAY_VIEW_URL;

  if (useIframeViewport) {
    await initEditorShell(m, config, layoutContainers, dockLayout, playUrl);
    return;
  }

  const engine = m.engine?.createEngine?.(canvas) ?? new BABYLON.Engine(canvas, true);

  if (layoutContainers?.viewport && canvas.parentElement && !isBlueprintEditor) {
    const ro = new ResizeObserver(() => engine.resize());
    ro.observe(canvas.parentElement);
    setTimeout(() => engine.resize(), 100);
    setTimeout(() => engine.resize(), 500);
  }
  const templateId = getActiveTemplate(config);

  let scene;
  let fpsController = null;

  if (templateId === SCENE_TEMPLATE.EMPTY) {
    const out = createEmptyTemplate(engine, canvas, config, m);
    scene = out.scene;
  } else {
    scene = m.scene?.createScene?.(engine) ?? new BABYLON.Scene(engine);
    if (m.lights?.createDefaultLights) m.lights.createDefaultLights(scene);

    let ground = null;
    let mantle = null;
    let spawnHeight = config.PLAYER_HEIGHT ?? 1.7;

    if (m.ground?.createGroundOrMantle) {
      const out = await m.ground.createGroundOrMantle(scene, config);
      ground = out.ground;
      mantle = out.mantle ?? null;
      spawnHeight = out.spawnHeight ?? spawnHeight;
    } else if (m.ground?.createGround) {
      ground = m.ground.createGround(scene, config);
    }

    if (m['fps-controller']?.createFpsController) {
      fpsController = m['fps-controller'].createFpsController(scene, canvas, config, {
        ground,
        mantle,
        spawnHeight,
      });
      // Apply synced viewport from editor (Play in New Window)
      if (fpsController?.player && !layoutContainers) {
        try {
          const raw = sessionStorage.getItem('basalt_viewport_sync');
          if (raw) {
            const data = JSON.parse(raw);
            sessionStorage.removeItem('basalt_viewport_sync');
            if (data?.position) {
              fpsController.player.position.set(data.position.x, data.position.y, data.position.z);
            }
            if (data?.rotation) {
              fpsController.player.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
            }
          }
        } catch (_) {}
      }
    }
  }

  const inspectorParent = layoutContainers?.inspector || null;
  let editorMode = null;
  const gizmoHandler = m['gizmo-handler']?.createGizmoHandler
    ? m['gizmo-handler'].createGizmoHandler(scene, canvas, () => editorMode?.isEditing ?? false)
    : null;
  if (layoutContainers && fpsController && m['editor-mode']?.createEditorMode) {
    editorMode = m['editor-mode'].createEditorMode(
      scene,
      canvas,
      fpsController,
      fpsController.input,
      gizmoHandler
    );
  }
  const onPlayInNewWindow = layoutContainers ? () => {
    const cam = scene?.activeCamera;
    if (cam) {
      try {
        const pos = cam.getAbsolutePosition?.() ?? cam.position.clone();
        const rot = cam.rotation.clone();
        sessionStorage.setItem('basalt_viewport_sync', JSON.stringify({
          position: { x: pos.x, y: pos.y, z: pos.z },
          rotation: { x: rot.x, y: rot.y, z: rot.z },
        }));
      } catch (_) {}
    }
    window.open(playUrl, '_blank');
  } : null;
  if (m.toolbar?.createToolbar) {
    m.toolbar.createToolbar(
      scene,
      fpsController?.hud,
      inspectorParent,
      dockLayout?.resetLayout,
      onPlayInNewWindow,
      null,
      null,
      {
        gizmoHandler,
        editorMode,
        config: m.config?.config ?? {},
        onSave: () => m.config?.persistConfig?.(),
        onUndo: () => {},
        onRedo: () => {},
        openPanel: dockLayout?.openPanel,
        restorablePanels: dockLayout?.restorablePanels ?? [],
      }
    );
  }
  // Toggle Inspector / Stats show as viewport overlays when clicked
  const variablesContainer = layoutContainers?.variablesPanel || layoutContainers?.objectSpawn || null;
  if (m['variable-panel']?.createVariablePanel && variablesContainer) {
    m['variable-panel'].createVariablePanel(config, null, () => {
      m.config?.persistConfig?.();
    }, fpsController?.reloadWeapon, variablesContainer);
  }
  const componentsContainer = layoutContainers?.componentsPanel || null;
  if (m['components-panel']?.createComponentsPanel && componentsContainer) {
    m['components-panel'].createComponentsPanel(scene, componentsContainer);
  }
  let selectedAsset = null;
  const contentDrawerContainer = layoutContainers?.contentDrawer || null;
  if (m['blueprint-graph']?.createBlueprintGraph && contentDrawerContainer) {
    m['blueprint-graph'].createBlueprintGraph(contentDrawerContainer, {
      getSelectedAsset: () => selectedAsset,
      config,
      persistConfig: () => m.config?.persistConfig?.(),
      onOpenBlueprintEditor() {
        dockLayout?.openPanel?.('blueprint');
      },
      onOpenDataTable(name) {
        if (name === 'DT_Weapons' && m['weapon-data-table']?.createWeaponDataTable && dockLayout?.api) {
          const panelId = 'dt_weapons_' + Date.now();
          dockLayout.registerPopulator?.(panelId, (el) => {
            m['weapon-data-table'].createWeaponDataTable(config, () => m.config?.persistConfig?.(), fpsController?.reloadWeapon, el);
          });
          dockLayout.api.addPanel({
            id: panelId,
            component: 'slot',
            title: 'DT_Weapons',
            params: { panelId, type: 'weapon-data-table' },
            position: { referencePanel: 'contentBrowser', direction: 'right' },
            initialWidth: 520,
            minimumWidth: 400,
          });
        }
      },
    });
  }
  const detailsPanelRefNonIframe = { refresh: () => {} };
  const levelOutlinerContainer = layoutContainers?.levelOutliner || null;
  let selectedNodeNonIframe = null;
  const getSelectedNodeNonIframe = () => selectedNodeNonIframe;
  if (m['level-outliner']?.createLevelOutliner && levelOutlinerContainer) {
    m['level-outliner'].createLevelOutliner(scene, levelOutlinerContainer, {
      getScene: () => scene,
      setSelectedNode: (n) => { selectedNodeNonIframe = n; },
      getSelectedNode: getSelectedNodeNonIframe,
      onSelectionChange: (node) => {
        gizmoHandler?.setAttachedNode?.(node ?? null);
        detailsPanelRefNonIframe.refresh();
      },
    });
  }
  const contentBrowserContainer = layoutContainers?.contentBrowser || null;
  if (m['content-browser']?.createContentBrowser && dockLayout?.api && contentBrowserContainer) {
    try {
      m['content-browser'].createContentBrowser(contentBrowserContainer, dockLayout.api, {
        onSaveAll: () => m.config?.persistConfig?.(),
        onSelectionChange: (asset) => { selectedAsset = asset; },
        getScene: () => scene,
        getSelectedNode: getSelectedNodeNonIframe,
        getProjectName: () => config?.PROJECT_NAME,
      onAssignMeshToSelected: async (asset, node) => {
        if (!scene || !BABYLON || !node) return;
        try {
          if (asset.file) {
            const url = URL.createObjectURL(asset.file);
            const result = await BABYLON.SceneLoader.ImportMeshAsync('', '', url, scene);
            URL.revokeObjectURL(url);
            const meshes = result?.meshes ?? [];
            if (meshes.length) {
              const root = meshes[0];
              root.name = (asset.name || 'Mesh') + '_' + Date.now();
              root.parent = node;
              root.position.set(0, 0, 0);
            }
          } else {
            const mesh = BABYLON.MeshBuilder.CreateBox((asset.name || 'Mesh') + '_' + Date.now(), { size: 1 }, scene);
            mesh.parent = node;
            mesh.position.set(0, 0, 0);
          }
        } catch (e) { console.warn('[content-browser] Assign mesh:', e); }
      },
      onOpenWeaponTable(panelId) {
        if (!m['weapon-data-table']?.createWeaponDataTable) return;
        dockLayout.registerPopulator?.(panelId, (el) => {
          m['weapon-data-table'].createWeaponDataTable(
            config,
            () => m.config?.persistConfig?.(),
            fpsController?.reloadWeapon,
            el
          );
        });
      },
      onOpenBlueprint(asset, asFloat) {
        if (asFloat) {
          window.open(window.location?.href?.replace(/Editor_Layout\.html.*$/, 'Blueprint_Editor.html') ?? 'Blueprint_Editor.html', '_blank');
        } else if (dockLayout?.openPanel) {
          dockLayout.openPanel('blueprint');
        }
      },
      onOpenFolder(files) {
        if (!files?.length || !dockLayout?.registerPopulator || !dockLayout?.api) return;
        const panelId = 'monacoFolder_' + Date.now();
        const folderName = files[0]?.webkitRelativePath?.split('/')[0] || 'Project';
        dockLayout.registerPopulator(panelId, (el) => {
          import('./Editor/monaco-folder-panel.js').then((mod) => {
            mod.createMonacoFolderPanel(el, files);
          });
        });
        dockLayout.api.addPanel({
          id: panelId,
          component: 'slot',
          title: 'Folder: ' + folderName,
          params: { panelId },
          position: { referencePanel: 'contentBrowser', direction: 'right' },
          initialWidth: 640,
          minimumWidth: 400,
        });
      },
    });
    } catch (e) {
      console.warn('[Basalt] Content Browser failed (editor continues):', e);
    }
  }
  if (dockLayout?.registerPopulator && m['details-panel']?.createDetailsPanel) {
    dockLayout.registerPopulator('detailsPanel', (el) => {
      const dp = m['details-panel'].createDetailsPanel(el, {
        getSelectedNode: getSelectedNodeNonIframe,
        getScene: () => scene,
        openContentBrowser: () => dockLayout?.openPanel?.('contentBrowser'),
      });
      detailsPanelRefNonIframe.refresh = () => dp?.refresh?.();
    });
  }
  if (isBlueprintEditor && dockLayout?.registerPopulator && m['blueprint-panel']?.createBlueprintPanel) {
    dockLayout.registerPopulator('blueprint', (el) => {
      const bp = m['blueprint-panel'].createBlueprintPanel(el, {
        config,
        persistConfig: () => m.config?.persistConfig?.(),
        getScene: () => scene,
      });
      bp.init(m);
    });
  }
  const thermometersContainer = layoutContainers?.thermometers || null;
  if (m['thermometers-panel']?.createThermometersPanel && thermometersContainer) {
    m['thermometers-panel'].createThermometersPanel(engine, scene, thermometersContainer, {
      getLogicCount: (behaviorCount) => (behaviorCount ?? 0) + getEnabledModules().length,
    });
  }
  const detailsPanelContainer = layoutContainers?.detailsPanel || null;
  if (m['play-mode-panel']?.createPlayModePanel && editorMode && detailsPanelContainer) {
    m['play-mode-panel'].createPlayModePanel(
      editorMode,
      onPlayInNewWindow ?? (() => window.open(playUrl, '_blank')),
      detailsPanelContainer
    );
  }

  scene.onBeforeRenderObservable.add(() => {
    if (editorMode?.isEditing) {
      editorMode.runFreeFly();
    } else if (fpsController?.run) {
      fpsController.run(engine);
    }
  });

  engine.runRenderLoop(() => scene.render());

  // Expose scene/hud/gizmo/editor when loaded in iframe (editor dock viewport)
  if (typeof window !== 'undefined' && window !== window.top) {
    window.basaltScene = scene;
    window.basaltHud = fpsController?.hud ?? null;
    window.basaltGizmoHandler = gizmoHandler ?? null;
    window.basaltEditorMode = editorMode ?? null;
    try {
      window.parent?.postMessage?.({ type: 'basalt_scene_ready' }, '*');
    } catch (_) {}
  }
}

/** Editor shell when viewport is iframe (Live_Web_Viewport) — same page docked */
async function initEditorShell(m, config, layoutContainers, dockLayout, playUrl) {
  const iframe = document.getElementById('basalt-viewport-iframe');
  const getScene = () => iframe?.contentWindow?.basaltScene ?? null;
  const getHud = () => iframe?.contentWindow?.basaltHud ?? null;
  let selectedNode = null;
  const getSelectedNode = () => selectedNode;
  const setSelectedNode = (n) => { selectedNode = n; };

  const onPlayInNewWindow = () => {
    const cam = getScene()?.activeCamera;
    if (cam) {
      try {
        const pos = cam.getAbsolutePosition?.() ?? cam.position.clone();
        const rot = cam.rotation.clone();
        sessionStorage.setItem('basalt_viewport_sync', JSON.stringify({
          position: { x: pos.x, y: pos.y, z: pos.z },
          rotation: { x: rot.x, y: rot.y, z: rot.z },
        }));
      } catch (_) {}
    }
    window.open(playUrl, '_blank');
  };

  const menuBarContainer = document.getElementById('menu-bar-container');
  if (m['menu-bar']?.createMenuBar && menuBarContainer) {
    m['menu-bar'].createMenuBar(menuBarContainer, {
      onSave: () => m.config?.persistConfig?.(),
      onUndo: () => {},
      onRedo: () => {},
      openPanel: dockLayout?.openPanel,
      restorablePanels: dockLayout?.restorablePanels ?? [],
      renamePanel: dockLayout?.renamePanel,
      setTheme: dockLayout?.setTheme,
      setLayoutPreset: dockLayout?.setLayoutPreset,
      themeOptions: m['theme-manager']?.THEME_OPTIONS ?? [],
      layoutPresetOptions: m['theme-manager']?.LAYOUT_PRESET_OPTIONS ?? [],
      onEditorSettings: () => {},
      onProjectSettings: () => {},
      onInspectorPopup: () => {
        const scene = iframe?.contentWindow?.basaltScene ?? null;
        if (scene?.debugLayer) scene.debugLayer.show({ popup: true });
      },
    });
  }
  if (m.toolbar?.createToolbar) {
    const getGizmoHandler = () => iframe?.contentWindow?.basaltGizmoHandler ?? null;
    const getEditorMode = () => iframe?.contentWindow?.basaltEditorMode ?? null;
    m.toolbar.createToolbar(
      null,
      null,
      null,
      dockLayout?.resetLayout,
      onPlayInNewWindow,
      getScene,
      getHud,
      {
        openPanel: dockLayout?.openPanel,
        restorablePanels: dockLayout?.restorablePanels ?? [],
        getGizmoHandler,
        getEditorMode,
        config: m.config?.config ?? {},
        onSave: () => m.config?.persistConfig?.(),
        onUndo: () => {},
        onRedo: () => {},
        getInspectorParent: () => layoutContainers?.inspectorPanel ?? null,
      }
    );
  }
  let selectedAsset = null;
  const contentDrawerContainer = layoutContainers?.contentDrawer || null;
  if (m['blueprint-graph']?.createBlueprintGraph && contentDrawerContainer) {
    m['blueprint-graph'].createBlueprintGraph(contentDrawerContainer, {
      getSelectedAsset: () => selectedAsset,
      config,
      persistConfig: () => m.config?.persistConfig?.(),
      onOpenBlueprintEditor() {
        dockLayout?.openPanel?.('blueprint');
      },
      onOpenDataTable(name) {
        if (name === 'DT_Weapons' && m['weapon-data-table']?.createWeaponDataTable && dockLayout?.api) {
          const panelId = 'dt_weapons_' + Date.now();
          dockLayout.registerPopulator?.(panelId, (el) => {
            m['weapon-data-table'].createWeaponDataTable(config, () => m.config?.persistConfig?.(), null, el);
          });
          dockLayout.api.addPanel({
            id: panelId,
            component: 'slot',
            title: 'DT_Weapons',
            params: { panelId, type: 'weapon-data-table' },
            position: { referencePanel: 'contentBrowser', direction: 'right' },
            initialWidth: 520,
            minimumWidth: 400,
          });
        }
      },
    });
  }
  if (dockLayout?.registerPopulator && layoutContainers) {
    dockLayout.registerPopulator('inspectorPanel', (el) => {
      const scene = getScene?.();
      if (scene?.debugLayer) {
        scene.debugLayer.show({ parentElement: el, embedMode: true });
      }
    });
  }
  if (dockLayout?.registerPopulator && m['place-actors-panel']?.createPlaceActorsPanel) {
    dockLayout.registerPopulator('placeActors', (el) => {
      m['place-actors-panel'].createPlaceActorsPanel(el, {
        getScene: () => iframe?.contentWindow?.basaltScene ?? null,
      });
    });
  }
  if (dockLayout?.registerPopulator && m['blueprint-panel']?.createBlueprintPanel) {
    dockLayout.registerPopulator('blueprint', (el) => {
      const bp = m['blueprint-panel'].createBlueprintPanel(el, {
        config,
        persistConfig: () => m.config?.persistConfig?.(),
        getScene: () => iframe?.contentWindow?.basaltScene ?? null,
      });
      bp.init(m);
    });
  }
  const contentBrowserContainer = layoutContainers?.contentBrowser || null;
  if (m['content-browser']?.createContentBrowser && dockLayout?.api && contentBrowserContainer) {
    try {
      m['content-browser'].createContentBrowser(contentBrowserContainer, dockLayout.api, {
        onSaveAll: () => m.config?.persistConfig?.(),
        onSelectionChange: (asset) => { selectedAsset = asset; },
        getScene,
        getSelectedNode,
        getProjectName: () => m.config?.config?.PROJECT_NAME,
      onAssignMeshToSelected: async (asset, node) => {
        const scene = getScene?.();
        if (!scene || !BABYLON || !node) return;
        try {
          if (asset.file) {
            const url = URL.createObjectURL(asset.file);
            const result = await BABYLON.SceneLoader.ImportMeshAsync('', '', url, scene);
            URL.revokeObjectURL(url);
            const meshes = result?.meshes ?? [];
            if (meshes.length) {
              const root = meshes[0];
              root.name = (asset.name || 'Mesh') + '_' + Date.now();
              root.parent = node;
              root.position.set(0, 0, 0);
            }
          } else {
            const mesh = BABYLON.MeshBuilder.CreateBox((asset.name || 'Mesh') + '_' + Date.now(), { size: 1 }, scene);
            mesh.parent = node;
            mesh.position.set(0, 0, 0);
          }
        } catch (e) { console.warn('[content-browser] Assign mesh:', e); }
      },
      onOpenWeaponTable(panelId) {
        if (!m['weapon-data-table']?.createWeaponDataTable) return;
        dockLayout.registerPopulator?.(panelId, (el) => {
          m['weapon-data-table'].createWeaponDataTable(
            config,
            () => m.config?.persistConfig?.(),
            null,
            el
          );
        });
      },
      onOpenBlueprint(asset, asFloat) {
        if (asFloat) {
          window.open(window.location?.href?.replace(/Editor_Layout\.html.*$/, 'Blueprint_Editor.html') ?? 'Blueprint_Editor.html', '_blank');
        } else if (dockLayout?.openPanel) {
          dockLayout.openPanel('blueprint');
        }
      },
      onOpenFolder(files) {
        if (!files?.length || !dockLayout?.registerPopulator || !dockLayout?.api) return;
        const panelId = 'monacoFolder_' + Date.now();
        const folderName = files[0]?.webkitRelativePath?.split('/')[0] || 'Project';
        dockLayout.registerPopulator(panelId, (el) => {
          import('./Editor/monaco-folder-panel.js').then((mod) => {
            mod.createMonacoFolderPanel(el, files);
          });
        });
        dockLayout.api.addPanel({
          id: panelId,
          component: 'slot',
          title: 'Folder: ' + folderName,
          params: { panelId },
          position: { referencePanel: 'contentBrowser', direction: 'right' },
          initialWidth: 640,
          minimumWidth: 400,
        });
      },
    });
    } catch (e) {
      console.warn('[Basalt] Content Browser failed (editor continues):', e);
    }
  }
  const detailsPanelRef = { refresh: () => {} };
  const levelOutlinerRef = { refresh: () => {} };
  const levelOutlinerContainer = layoutContainers?.levelOutliner || null;
  if (m['level-outliner']?.createLevelOutliner && levelOutlinerContainer) {
    const lo = m['level-outliner'].createLevelOutliner(null, levelOutlinerContainer, {
      getScene,
      setSelectedNode,
      getSelectedNode,
      onSelectionChange: (node) => {
        iframe?.contentWindow?.basaltGizmoHandler?.setAttachedNode?.(node ?? null);
        detailsPanelRef.refresh();
      },
    });
    if (lo?.refresh) levelOutlinerRef.refresh = lo.refresh;
  }
  // Poll Level Outliner / Details when iframe loads — scene is created async in iframe
  if (iframe) {
    const pollScene = () => {
      levelOutlinerRef.refresh();
      detailsPanelRef.refresh();
    };
    iframe.onload = () => {
      let attempts = 0;
      const maxAttempts = 80; // ~20s at 250ms
      let iv = null;
      let checkDone = null;
      const stop = () => {
        if (iv) { clearInterval(iv); iv = null; }
        if (checkDone) { clearInterval(checkDone); checkDone = null; }
      };
      iv = setInterval(() => {
        pollScene();
        if (++attempts >= maxAttempts) stop();
      }, 250);
      checkDone = setInterval(() => {
        const s = getScene();
        if (s && (s.meshes?.length > 0 || s.lights?.length > 0)) stop();
      }, 500);
    };
    // Listen for scene-ready message from iframe (faster than polling)
    window.addEventListener('message', (e) => {
      if (e?.data?.type === 'basalt_scene_ready' && e.source === iframe.contentWindow) {
        pollScene();
      }
    });
  }
  if (dockLayout?.registerPopulator && m['details-panel']?.createDetailsPanel) {
    dockLayout.registerPopulator('detailsPanel', (el) => {
      const dp = m['details-panel'].createDetailsPanel(el, {
        getSelectedNode,
        getScene,
        openContentBrowser: () => dockLayout?.openPanel?.('contentBrowser'),
      });
      detailsPanelRef.refresh = () => dp?.refresh?.();
    });
  }
  const thermometersContainer = layoutContainers?.thermometers || null;
  if (m['thermometers-panel']?.createThermometersPanel && thermometersContainer) {
    m['thermometers-panel'].createThermometersPanel(null, null, thermometersContainer, {
      getScene: () => iframe?.contentWindow?.basaltScene ?? null,
      getLogicCount: (behaviorCount) => (behaviorCount ?? 0) + getEnabledModules().length,
    });
  }
  const statusBarContainer = document.getElementById('status-bar-container');
  if (m['status-bar']?.createStatusBar && statusBarContainer) {
    m['status-bar'].createStatusBar(statusBarContainer, {
      openPanel: dockLayout?.openPanel,
      onToggleContentDrawer: () => dockLayout?.openPanel?.('contentDrawer'),
    });
  }
  const moduleLibraryContainer = layoutContainers?.moduleLibrary || null;
  if (m['module-library-panel']?.createModuleLibraryPanel && dockLayout?.registerPopulator) {
    dockLayout.registerPopulator('moduleLibrary', (el) => {
      m['module-library-panel'].createModuleLibraryPanel(el, {
        onModuleToggle: (id, enabled) => {
          console.log('[Basalt] Module', id, enabled ? 'enabled' : 'disabled', '— reload to apply');
        },
      });
    });
  }
}

init().catch((err) => {
  console.error('[Basalt] Init failed:', err);
  logError('main:init', err);
  showError(err);
});
