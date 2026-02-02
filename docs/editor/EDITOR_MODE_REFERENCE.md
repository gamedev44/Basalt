# In-Viewport Editor Mode — Design Reference

> Pause, free-fly camera, gizmos, and script-attachment panel for Basalt Engine.

---

## Overview

Editor mode lets you toggle out of play mode, pause the simulation, and fly freely around the scene with a free-fly camera. You can select objects, move them with gizmos, and attach scripts directly from a GUI panel. This document outlines the design and implementation approach.

---

## 1. Editor Mode Toggle

### Concept

- **Play mode**: FPS controller active, player body, pointer lock, physics/movement running.
- **Editor mode**: Paused, free-fly camera, no player body, gizmos enabled, script panel available.

### Implementation Approach

**Option A: Dual-camera switch (recommended)**

- Keep both cameras in the scene; only one is `scene.activeCamera` at a time.
- **Play**: `UniversalCamera` parented to player head, pointer lock, FPS input.
- **Editor**: `UniversalCamera` (or `FlyCamera`) at free-fly position, no parent, WASD + mouse for movement.

**Option B: ArcRotateCamera for editor**

- ArcRotateCamera orbits a target; good for inspecting objects.
- Less “fly-through” feel; better for focused object inspection.
- Can combine: free-fly for navigation, ArcRotate when an object is selected (optional).

**Recommendation:** Use a single `UniversalCamera` for editor mode. Babylon’s `UniversalCamera` already supports free-fly (WASD + mouse). For editor:

1. Detach from player (set `camera.parent = null`).
2. Store/restore camera position when toggling.
3. Disable pointer lock; use regular mouse for look.
4. Pause `scene.onBeforeRenderObservable` callbacks that drive gameplay (movement, firing, etc.).

### Pause Semantics

- **`scene.pause()`** — Stops the render loop. Not ideal if we still want to render (e.g. while moving gizmos).
- **Custom pause flag** — Better: set `editorMode = true` and skip gameplay logic in `onBeforeRenderObservable`:
  - Skip `fpsController.run()`
  - Skip physics step (if using Havok)
  - Skip weapon animations, HUD updates, etc.
- **Render loop** continues so the viewport stays interactive; only gameplay logic is paused.

---

## 2. Free-Fly Camera

### Behavior

- **WASD**: Move forward/back/left/right in camera space.
- **Q / E** (or Space / Ctrl): Move up/down.
- **Mouse**: Look (yaw/pitch). No pointer lock — cursor free for UI.
- **Scroll**: Optional speed adjustment or zoom.

### Babylon.js Notes

- `UniversalCamera` supports this natively with `attachControl(canvas)`.
- `FlyCamera` offers roll correction and banked turns; good for “ghost in space” feel.
- For editor, `UniversalCamera` is sufficient; ensure `camera.parent = null` and `camera.position` / `camera.rotation` are driven by inputs.

### Toggle Flow

```
[Play] → user presses Editor hotkey (e.g. Tab or F2)
  - Store player position, head rotation
  - Detach camera from player
  - Set camera position = head position
  - Disable pointer lock
  - Set editorMode = true
  - Enable gizmo handler, script panel

[Editor] → user presses Play hotkey
  - Attach camera back to player head
  - Restore pointer lock
  - Set editorMode = false
  - Disable gizmos, hide script panel
```

---

## 3. Gizmos (GizmoManager)

### Current State

`Engine/Modules/Editor/gizmo-handler.js` already uses `BABYLON.GizmoManager`:

- `positionGizmoEnabled`, `rotationGizmoEnabled`, `scaleGizmoEnabled`
- `usePointerToAttachGizmos = false` — manual attach via `attachToNode`
- Click-to-select on meshes

### Editor-Mode Integration

- **Only enable gizmos when `editorMode === true`**.
- When entering editor mode: `gizmoHandler.setVisible(true)`.
- When exiting: `gizmoHandler.setVisible(false)` and `attachToNode(null)`.
- Ensure `attachableMeshes` or pick filter excludes UI, skybox, etc.

### GizmoManager API (recap)

```javascript
gizmoManager.positionGizmoEnabled = true;
gizmoManager.rotationGizmoEnabled = true;
gizmoManager.scaleGizmoEnabled = true;
gizmoManager.attachToNode(mesh);  // or attachToMesh in older API
gizmoManager.attachToNode(null);  // deselect
```

### Optional: Bounding Box Gizmo

For complex GLB meshes, `BoundingBoxGizmo` with `MakeNotPickableAndWrapInBoundingBox` improves performance. Consider adding as an option for heavy assets.

---

## 4. Script Attachment Panel

### Concept

A collapsible GUI panel that:

1. Shows when an object is selected in editor mode.
2. Lists scripts already attached to that object.
3. Lets you add new scripts from a registry (modular scripts).
4. Auto-interfaces scripts: each script exports a known shape (e.g. `init(scene, node, config)`), and the panel discovers available scripts from a central registry.

### Script Registry

Basalt uses a modular system (`modules.config.js`). Scripts can be:

- **Engine modules** (e.g. `weapon-component`, `attachment-component`) — loaded by template.
- **Entity scripts** — attached per-node, loaded on demand.

For entity scripts, define a registry:

```javascript
// scripts.config.js or new script-registry.js
export const ENTITY_SCRIPTS = {
  'weapon-spawner': { path: './Scripts/weapon-spawner.js', init: 'init' },
  'trigger-zone': { path: './Scripts/trigger-zone.js', init: 'init' },
  // ...
};
```

Each script exports:

```javascript
export function init(scene, node, config) {
  // config from inspector or defaults
  return { dispose() { /* cleanup */ } };
}
```

### Panel UI

- **Header**: "Scripts" + toggle (collapse/expand).
- **List**: For selected node, show attached scripts with [Remove] button.
- **Add script**: Dropdown or list of available scripts from registry.
- **On add**: Dynamic `import()` of script, call `init(scene, selectedNode, {})`, store reference for dispose on remove.

### Auto-Interface

- Scripts declare an interface: `init(scene, node, config)`.
- Config can be a simple object; the panel could later support a schema per script for custom fields (e.g. `triggerRadius`, `damage`).
- For now, keep it minimal: attach, remove, persist attachment list in node metadata (`node.metadata.scripts = [{ id: 'weapon-spawner', config: {} }]`).

### Persistence

- Store `node.metadata.scripts` as array of `{ id, config }`.
- On scene load, for each node with `metadata.scripts`, run `init` for each script.
- Saves to scene file or a separate `entity-scripts.json` keyed by node id/name.

---

## 5. Implementation Phases

| Phase | Task | Notes |
|-------|------|-------|
| 1 | Editor mode toggle | Hotkey, `editorMode` flag, skip `fpsController.run` when true |
| 2 | Free-fly camera | Detach camera, disable pointer lock, enable free-fly inputs |
| 3 | Gizmo visibility | Show gizmos only in editor mode; wire to toggle |
| 4 | Script registry | `ENTITY_SCRIPTS` map, `init(scene, node, config)` contract |
| 5 | Script panel UI | Collapsible panel, list attached scripts, add/remove |
| 6 | Persistence | `node.metadata.scripts`, hydrate on load |

---

## 6. File Layout (Proposed)

```
Engine/Modules/Editor/
  editor-mode.js       # Toggle, pause, camera switch
  gizmo-handler.js     # (existing) GizmoManager wrapper
  script-panel.js      # Script attachment UI
  script-registry.js   # ENTITY_SCRIPTS, init contract
```

---

## 7. References

- [Babylon.js Cameras](https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction) — UniversalCamera, FlyCamera
- [Babylon.js Gizmos](https://doc.babylonjs.com/features/featuresDeepDive/mesh/gizmo) — GizmoManager, position/rotation/scale
- [Customizing Camera Inputs](https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs)

---

*Basalt Engine — Editor Mode Design*
