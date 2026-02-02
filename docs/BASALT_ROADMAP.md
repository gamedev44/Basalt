# 🪨 Basalt Engine — Roadmap, Features & Example Library

> **"Forged in Blender. Hardened in Basalt."**

Roadmap for the Basalt Engine and Editor: planned features, tech stack, example sources, and implementation order.

**Master status:** [docs/STATUS.md](STATUS.md) — single source of truth for done vs pending.

---

## 📍 Table of Contents

1. [Implementation Schedule (Feb 2026)](#implementation-schedule-feb-2026)
2. [Architectural Vision (2026)](#architectural-vision-2026)
3. [Technology Stack](#technology-stack)
4. [Layout & UI Architecture](#layout--ui-architecture)
5. [Desktop Encapsulation](#desktop-encapsulation)
6. [Substrate (Materials) — NME Integration](#substrate-materials--nme-integration)
7. [Example Library & Playground Imports](#example-library--playground-imports)
8. [Planned Features by Module](#planned-features-by-module)
9. [Babylon.js Doc References](#babylonjs-doc-references)
10. [Implementation Phases](#implementation-phases)

---

## Implementation Schedule (Feb 2026)

| Date | Task | Ref |
|------|------|-----|
| **Wed Feb 4** | Pin CDN versions (Babylon.js, loaders, GUI, Inspector, Havok) | [PLAN_2026_FEB.md](PLAN_2026_FEB.md) |
| **Fri–Sun Feb 6–8** | Babylon Native fork test — validate native build target | [PLAN_2026_FEB.md](PLAN_2026_FEB.md) |

**CDN Pinning:** Replace unpinned `cdn.babylonjs.com` URLs with version-pinned jsDelivr URLs for production stability.

**Babylon Native:** Fork test to validate native desktop build. Shared engine core; web and native as separate build targets. PC + Xbox (UWP) focus.

---

## Architectural Vision (2026)

> **"Independence without Strictness"** — Modules as standalone, swappable units.

### 1. Base Editor

- **DockView API SDK SourceBuild** — Finalize the core Docking/Viewport system.
- **Dynamic Panel Registration** — The Dockview registry must dynamically register new panels from external module manifests (e.g. `module.json` → `panels: [...]`).

### 2. Project Explorer — Template Selection

Entry point for selecting templates:

| Template | Purpose |
|----------|---------|
| **Advanced FPS Template** | Current build integration. Put existing FPS/weapon/terrain logic here for when we want to use it to make the game. |
| **Empty Base Template** | Clean slate for custom module stacking. Z-up, minimal scene, no gameplay logic. |

### 3. System Atomization (The "Single Module" Philosophy)

Every engine feature becomes a **standalone, swappable unit**:

| Module | Scope |
|--------|-------|
| **Lighting Module** | Global Illumination, Volumetrics, Sun settings. Components: Lamps, Flashlights, Spotlights. |
| **Havok Physics CDN Module** | Gravity, Collisions, Raycasting via remote load. |
| **Weapon Module** | Recoil, Fire Rates, Attachments. |

### 4. Loosely Coupled Workflow (Conflict Prevention)

Standard directory and communication layout so modules do not conflict:

```
/modules
   /lighting-core
      ├── module.json      ← "ID Card" (Name, Version, Dependencies)
      ├── logic.js         ← Pure Engine/Babylon (Runs in Game + Editor)
      ├── editor.js        ← Dockview/UI (Stripped during Game export)
      ├── assets/          ← Localized icons/models
      └── styles.css       ← Scoped CSS (CSS Modules or BEM)
```

### 5. Total Isolation (Editor vs Engine vs Game)

| Layer | Responsibility |
|-------|----------------|
| **Editor** | Workspace management, JSON manipulation, layout persistence. |
| **Engine** | Bootloader — reads JSON, initializes modules. |
| **Game** | Final export: **only** Engine Core + `logic.js` of enabled modules. No editor-only dependencies. |

### 6. On-the-Fly Scaling

- **Central Module Registry** — Dragging a module into the Editor auto-injects the necessary Havok/Babylon logic into the active viewport.
- **No full app restart** — Modules load dynamically; viewport updates live.

---

## Technology Stack

| Layer | Choice | Purpose |
|-------|--------|---------|
| **Runtime** | Babylon.js | 3D engine, WebGPU, physics |
| **Materials** | NME (Node Material Editor) | Substrate — visual shader authoring |
| **Geometry** | NGE (Node Geometry Editor) | Procedural geo / geometry nodes |
| **Layout Shell** | [FlexLayout](https://github.com/caplin/FlexLayout) | Docking, tabs, splitters, resizable panels |
| **UI Components** | [Blueprint](https://github.com/palantir/blueprint) (optional) | Buttons, inputs, tree views, dialogs for panel internals |
| **Code Editor** | Monaco Editor | Script editing, Babylon API IntelliSense |
| **Collab** | Firebase (Auth, Firestore) | Real-time pointer presence, chat, DMs, video mode |
| **Desktop Wrapper** | Tauri (recommended) or Electron | Native app shell for web panels |

---

## Layout & UI Architecture

### FlexLayout + Optional Blueprint

- **FlexLayout** — Primary layout container for IDE-style UIs:
  - Splitters, tabs, drag-and-drop
  - Maximize/minimize panels
  - Popout to external windows (multi-monitor)
  - JSON-serializable layout (save/restore)
  - [GitHub](https://github.com/caplin/FlexLayout) | MIT

- **Blueprint** — Optional UI toolkit for panel internals:
  - Tree views (variable inspector, hierarchy)
  - Inputs, sliders, color pickers
  - Dialogs, tooltips, menus
  - [GitHub](https://github.com/palantir/blueprint) | Apache-2.0
  - Includes `@blueprintjs/theme` for Monaco

**Why FlexLayout over Blueprint for layout?** Blueprint is a component library, not a layout manager. FlexLayout handles the shell; Blueprint styles the contents. Use FlexLayout as the base; add Blueprint only if you want polished React components inside panels.

**Custom wrapper?** FlexLayout can be themed (light, dark, underline, gray). A thin custom wrapper (logo, toolbar, status bar) around FlexLayout is enough for a professional look without rebuilding layout logic.

---

## Desktop Encapsulation

### Tauri (Recommended) vs Electron

| Aspect | Tauri | Electron |
|--------|-------|----------|
| **Size** | ~3–10 MB | ~150 MB+ |
| **Memory** | Native WebView | Bundled Chromium |
| **Speed** | Fast startup | Heavier |
| **Tech** | Rust + system WebView | Node + Chromium |
| **Use case** | Lean, responsive editor | Max compatibility |

**Tauri** for Basalt Editor — smaller footprint, faster load, better for a game engine tool. Web panels (NME, Playground, docs) load as WebViews; FlexLayout manages them.

### Panel-as-Website Strategy

- Each panel can be a **URL** (NME, Playground, docs) or a **local HTML/React view**
- FlexLayout supports adding tabs dynamically
- Config: `{ type: "tab", component: "webview", config: { url: "https://nme.babylonjs.com" } }`
- Enables: NME, [NGE](https://nge.babylonjs.com), Babylon Playground, Blender docs, custom editor views — all in one layout

---

## Substrate (Materials) — NME Integration

### Node Material Editor (NME)

- **URL:** https://nme.babylonjs.com
- **Purpose:** Visual node-based shader authoring for Substrate
- **Integration options:**
  1. **Embed iframe** — Load NME in a FlexLayout panel
  2. **API bridge** — NME exports `.json`; Basalt runtime loads via `NodeMaterial.Parse()`
  3. **Custom panel** — Wrap NME in a panel with "Apply to Selection" / "Save to Substrate Library"

### Geometry (NGE) — Node Geometry Editor

- **URL:** https://nge.babylonjs.com
- **Purpose:** Visual node-based procedural geometry (Blender Geometry Nodes–style in-browser)
- **Integration:** Embed iframe; export JSON; load via `NodeGeometry.Parse()` at runtime
- **Use cases:** Procedural meshes, terrain variants, architecture, props; complements Mantle terrain

### Substrate Module Scope

- [ ] NME panel in editor layout
- [ ] Substrate material library (JSON from NME)
- [ ] `substrate_index` custom property → material assignment
- [ ] PBR presets + custom node materials
- [ ] Dynamic texture support ([doc](https://doc.babylonjs.com/features/featuresDeepDive/materials/using/dynamicTexture))
- [ ] Decals ([doc](https://doc.babylonjs.com/features/featuresDeepDive/mesh/decals))

---

## Example Library & Playground Imports

### Strategy

Instead of building everything from scratch, **load Babylon.js examples and playgrounds** as editable panels. Users can:

- Browse a curated list
- Load example into a panel (iframe or embedded Playground)
- Edit code live, hot-reload
- Save favorites to project

### Example Sources

| Category | URL | Description |
|----------|-----|-------------|
| **Blender Export** | [Blender Exporter](https://doc.babylonjs.com/features/featuresDeepDive/Exporters/Blender/) | Blender → Babylon pipeline |
| **Blender Tips** | [Blender Tips](https://doc.babylonjs.com/features/featuresDeepDive/Exporters/Blender_Tips/) | Best practices |
| **Blender → glTF** | [Blender to glTF](https://doc.babylonjs.com/features/featuresDeepDive/Exporters/Blender_to_glTF/) | glTF export workflow |
| **Save Babylon** | [Save Babylon](https://doc.babylonjs.com/features/featuresDeepDive/Exporters/Save_Babylon/) | .babylon format |
| **Mixamo** | [Mixamo to Babylon](https://doc.babylonjs.com/features/featuresDeepDive/Exporters/Mixamo_to_Babylon/) | Character animation pipeline |
| **Playground — FPS** | [BCU1XR](https://playground.babylonjs.com/#BCU1XR#0) | First-person example |
| **Playground — Physics** | [L92PHY](https://playground.babylonjs.com/#L92PHY#217) | Physics demo |
| **Animated Character** | [Animated Character](https://doc.babylonjs.com/features/featuresDeepDive/animation/animatedCharacter) | Character animation |
| **Audio** | [Legacy Audio](https://doc.babylonjs.com/legacy/audio) | Web Audio API |
| **Mesh Behaviors** | [Mesh Behaviors](https://doc.babylonjs.com/features/featuresDeepDive/behaviors/meshBehaviors) | Behaviors system |
| **Cameras** | [Camera Introduction](https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction) | Camera types |
| **Dynamic Texture** | [Dynamic Texture](https://doc.babylonjs.com/features/featuresDeepDive/materials/using/dynamicTexture) | Runtime texture generation |
| **Decals** | [Mesh Decals](https://doc.babylonjs.com/features/featuresDeepDive/mesh/decals) | Decal projection |
| **Mantle Terrain** | [C90R62#21](https://playground.babylonjs.com/?webgpu#C90R62#21) | Procedural terrain, erosion, WebGPU compute |

### Example Library Config (JSON)

```json
{
  "examples": [
    {
      "id": "blender-export",
      "name": "Blender Exporter",
      "category": "Pipeline",
      "url": "https://doc.babylonjs.com/features/featuresDeepDive/Exporters/Blender/",
      "type": "doc"
    },
    {
      "id": "playground-fps",
      "name": "FPS Controller",
      "category": "Gameplay",
      "url": "https://playground.babylonjs.com/#BCU1XR#0",
      "type": "playground"
    },
    {
      "id": "playground-physics",
      "name": "Physics Demo",
      "category": "Physics",
      "url": "https://playground.babylonjs.com/#L92PHY#217",
      "type": "playground"
    }
  ]
}
```

---

## Planned Features by Module

### Pipeline (Iron)

| Feature | Status | Notes |
|---------|--------|------|
| Blender Addon (`iron_devtools.py`) | 📋 Planned | N-Panel, categories, sub-panels |
| Bake & Export | 📋 Planned | glTF, KTX2, metadata |
| Entity Inspector | 📋 Planned | `ent_`, `vol_`, `snd_`, `light_`, `col_` |
| Sync Bridge | 📋 Planned | Live Blender → Basalt |
| Blender 3.6 LTS API | 📋 Planned | `bpy` 3.6.23 |

### Runtime (Basalt)

| Feature | Status | Notes |
|---------|--------|------|
| Core Engine | ✅ Partial | Babylon.js, WebGPU |
| Scene Loader | 📋 Planned | glTF + IronWill metadata |
| Entity System | 📋 Planned | Hydrate from schema |
| Input System | ✅ Partial | In viewport |
| Config / Variables | ✅ Done | Category-based inspector; WEAPON_OVERRIDES; persistConfig |
| Optional Shoulder Cams | 🔮 Future | Right/left shoulder view; shoulder switching (GTA-style). Ref: [SHOULDER_CAM_REFERENCE.md](fps/SHOULDER_CAM_REFERENCE.md) |

### Physics (Havok)

**Reference:** [Havok Plugin (Babylon.js)](https://doc.babylonjs.com/features/featuresDeepDive/physics/havokPlugin#full-in-browser-example-using-the-umd-version) — WebAssembly physics, MIT license, free for web.

| Feature | Status | Notes |
|---------|--------|------|
| Havok Plugin | 📋 Planned | `@babylonjs/havok` (npm) or CDN below |
| Rigid Bodies | 📋 Planned | |
| Collision | 📋 Planned | `moveWithCollisions` |
| Ragdolls | 📋 Future | |
| Heightmap Colliders | 📋 Planned | For Mantle terrain |

**CDN (live web):**
```html
<script src="https://cdn.babylonjs.com/havok/HavokPhysics_umd.js"></script>
<script src="https://cdn.babylonjs.com/babylon.js"></script>
<script src="https://cdn.babylonjs.com/gui/babylon.gui.min.js"></script>
```

**Module (ES):** `https://cdn.babylonjs.com/havok/HavokPhysics_es.js`

**Note:** Requires WebAssembly SIMD — not supported on iOS &lt; 16.4.

### Rendering (Substrate)

| Feature | Status | Notes |
|---------|--------|------|
| NME Integration | 📋 Planned | https://nme.babylonjs.com |
| Material Library | 📋 Planned | JSON from NME |
| PBR Presets | 📋 Planned | |
| Dynamic Textures | 📋 Planned | [doc](https://doc.babylonjs.com/features/featuresDeepDive/materials/using/dynamicTexture) |
| Decals | 📋 Planned | [doc](https://doc.babylonjs.com/features/featuresDeepDive/mesh/decals) |

### Audio (Sonar)

**References:** [Legacy Audio](https://doc.babylonjs.com/legacy/audio) | [PCY1J#6](https://playground.babylonjs.com/#PCY1J#6) — 3 violins, different parts, synchronous playback.

| Feature | Status | Notes |
|---------|--------|------|
| Web Audio API | 📋 Planned | [doc](https://doc.babylonjs.com/legacy/audio) |
| Background Music | 📋 Planned | `BABYLON.Sound` loop + autoplay |
| Multi-Track Sync | 📋 Planned | [PCY1J#6](https://playground.babylonjs.com/#PCY1J#6) — multiple emitters in sync |
| Spatial Audio | 📋 Planned | |
| Reverb Zones | 📋 Planned | `vol_` triggers |
| Occlusion | 📋 Future | |

### Animation (Mixamo / Characters)

**Reference:** [Mixamo to Babylon](https://doc.babylonjs.com/features/featuresDeepDive/Exporters/Mixamo_to_Babylon/) | `docs/animation/MIXAMO_TRIGGER_REFERENCE.md`

| Feature | Status | Notes |
|---------|--------|------|
| Trigger Animations | 📋 Planned | `scene.beginAnimation(skeleton, from, to, loop)` |
| Animation Blending | 📋 Planned | `animationPropertiesOverride.enableBlending`, `blendingSpeed` |
| Weighted Blend | 📋 Planned | `beginWeightedAnimation` + `syncWith()` for walk+strafe |
| Matrix Interpolation | 📋 Planned | `BABYLON.Animation.AllowMatricesInterpolation = true` |
| Babylon.GUI Buttons | 📋 Planned | Trigger anims from UI |

### Narrative (Echo)

| Feature | Status | Notes |
|---------|--------|------|
| Dialogue Graph | 📋 Planned | |
| Event Triggers | 📋 Planned | |
| Branching Logic | 📋 Planned | `echo_id` custom prop |

### Interface (Facade)

| Feature | Status | Notes |
|---------|--------|------|
| HUD System | ✅ Partial | Babylon.GUI in viewport |
| Layout Sync | 📋 Planned | |
| Widget Library | 📋 Planned | |

### World (Mantle)

**Reference:** [Mantle Terrain Playground](https://playground.babylonjs.com/?webgpu#C90R62#21) — procedural terrain with simplex noise, hydraulic erosion, WebGPU compute shaders.

| Feature | Status | Notes |
|---------|--------|------|
| Terrain | 📋 Planned | [C90R62#21](https://playground.babylonjs.com/?webgpu#C90R62#21) — TerrainGenerator + HeightMapGenerator |
| Height Map (Simplex) | 📋 Planned | Multi-octave noise; GPU (ComputeShader) + CPU fallback |
| Hydraulic Erosion | 📋 Planned | Droplet sim; GPU (500k iter) or CPU (80k iter); brush, sediment, evaporate |
| Terrain Material | 📋 Planned | NME snippet `4W2QH3#4`; MaxHeight block |
| Heightmap Colliders | 📋 Planned | Havok heightmap from Mantle output |
| LOD | 📋 Planned | |
| Blender Integration | 📋 Future | Sculpt + Geometry Nodes → Mantle params |
| **Geometry (NGE)** | 📋 Planned | [nge.babylonjs.com](https://nge.babylonjs.com) — procedural geo / geometry nodes |

### Editor Shell

| Feature | Status | Notes |
|---------|--------|------|
| FlexLayout Base | 📋 Planned | Docking, tabs, splitters |
| Monaco Code Panel | 📋 Planned | Live edit, hot reload |
| Variable Inspector | ✅ Partial | Category → variable → details; Live Preview |
| NME Panel | 📋 Planned | iframe or embed |
| Example Browser | 📋 Planned | Load docs + playgrounds |
| Tauri/Electron Wrapper | 📋 Future | Desktop app |

### In-Viewport Editor Mode

**Reference:** `docs/editor/EDITOR_MODE_REFERENCE.md` — Pause, free-fly camera, gizmos, script panel.

| Feature | Status | Notes |
|---------|--------|------|
| Editor Mode Toggle | 📋 Planned | Hotkey (Tab/F2); pause gameplay, switch camera |
| Free-Fly Camera | 📋 Planned | UniversalCamera detached from player; WASD + mouse |
| Gizmo Integration | ✅ Partial | GizmoManager exists; wire to editor-mode visibility |
| Script Attachment Panel | 📋 Planned | Collapsible panel; add/remove scripts on selected node |
| Script Registry | 📋 Planned | `init(scene, node, config)` contract; auto-interface |

### Collab (Real-Time Editor)

**Reference:** `docs/collab/COLLAB_EDITOR_REFERENCE.md` — React + Firebase pointer overlay.

| Feature | Status | Notes |
|---------|--------|------|
| Pointer Presence | 📋 Ready | Firestore real-time; x, y, nickname, color |
| Global Chat | 📋 Ready | Public messages, @mentions |
| DM / Private Chat | 📋 Ready | `@nickname` or target; cyan-tinted |
| Video Mode | 📋 Ready | Webcam + audio level (speaking indicator) |
| Context Menu | 📋 Ready | Shift + Right-click |
| Customizable | 📋 Ready | Nickname, colors, chat bg/text, fonts |
| Config | 📋 Ready | `__firebase_config`, `__app_id`, `__initial_auth_token` |

---

## Babylon.js Doc References

Links I use when implementing each feature.

### Exporters & Pipeline

- [Blender Exporter](https://doc.babylonjs.com/features/featuresDeepDive/Exporters/Blender/)
- [Blender Tips](https://doc.babylonjs.com/features/featuresDeepDive/Exporters/Blender_Tips/)
- [Blender to glTF](https://doc.babylonjs.com/features/featuresDeepDive/Exporters/Blender_to_glTF/)
- [Save Babylon](https://doc.babylonjs.com/features/featuresDeepDive/Exporters/Save_Babylon/)
- [Mixamo to Babylon](https://doc.babylonjs.com/features/featuresDeepDive/Exporters/Mixamo_to_Babylon/)

### Animation & Characters

- [Animated Character](https://doc.babylonjs.com/features/featuresDeepDive/animation/animatedCharacter)

### Audio

- [Legacy Audio](https://doc.babylonjs.com/legacy/audio)

### Physics

- [Havok Plugin](https://doc.babylonjs.com/features/featuresDeepDive/physics/havokPlugin#full-in-browser-example-using-the-umd-version) — WebAssembly physics, UMD/ES CDN, MIT license

### Behaviors

- [Mesh Behaviors](https://doc.babylonjs.com/features/featuresDeepDive/behaviors/meshBehaviors)
- **PointerDragBehavior** — Rail constraint: `dragAxis: new BABYLON.Vector3(1,0,0)` for X-axis only; `dragPlaneNormal` for plane; `onDragStartObservable`, `onDragObservable`, `onDragEndObservable`

### Cameras

- [Camera Introduction](https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction)

### Materials

- [Dynamic Texture](https://doc.babylonjs.com/features/featuresDeepDive/materials/using/dynamicTexture)
- [Mesh Decals](https://doc.babylonjs.com/features/featuresDeepDive/mesh/decals)

### Editor / Gizmos

- [Gizmos](https://doc.babylonjs.com/features/featuresDeepDive/mesh/gizmo) — GizmoManager, position/rotation/scale

### Playground Examples

- [BCU1XR](https://playground.babylonjs.com/#BCU1XR#0) — FPS / gameplay
- [L92PHY](https://playground.babylonjs.com/#L92PHY#217) — Physics
- [C90R62#21](https://playground.babylonjs.com/?webgpu#C90R62#21) — **Mantle** procedural terrain (simplex noise, hydraulic erosion, WebGPU)
- [PCY1J#6](https://playground.babylonjs.com/#PCY1J#6) — **Sonar** 3 violins, different parts, synchronous playback

---

## Implementation Phases

### Phase 1: Editor Shell

1. FlexLayout integration
2. Basic panel structure (Viewport, Code, Variables, Details)
3. Monaco + hot reload
4. Variable parser + category inspector
5. **In-viewport editor mode** — Toggle, free-fly camera, gizmos, script panel (see `docs/editor/EDITOR_MODE_REFERENCE.md`)

### Phase 2: Substrate + NME

1. NME panel (iframe or embed)
2. Substrate material library
3. `substrate_index` → material assignment
4. Dynamic texture + decals (from docs)

### Phase 3: Example Library

1. Example browser panel
2. Load docs + playground URLs
3. Config JSON for curated list
4. "Open in Panel" from browser

### Phase 3b: Mantle (Terrain)

1. Port [C90R62#21](https://playground.babylonjs.com/?webgpu#C90R62#21) — TerrainGenerator + HeightMapGenerator
2. NME terrain material (snippet `4W2QH3#4`)
3. Erosion params → variable inspector
4. Havok heightmap collider from terrain output

### Phase 4: Pipeline (Iron)

1. `iron_devtools.py` Blender addon
2. Bake & export (glTF, metadata)
3. Entity inspector in Blender

### Phase 5: Desktop & Native

1. **Web:** Tauri (or Electron) shell — WebView panels, layout persistence
2. **Native:** Babylon Native fork test (Feb 6–8) — validate native build target
3. Build target selector: web vs native (shared engine core)
4. PC + Xbox (UWP) focus for native

### Phase 6: Multiplayer Foundation (Early Hooks)

1. Run context module (`isServer`, `isClient`, `isOwningClient`)
2. RPC stub (register/call, local-only for single-player)
3. Ownership on entities (`ownerId`); RLS helpers
4. Transport + reliable messaging (future)

---

## Quick Reference Links

| Resource | URL |
|----------|-----|
| NME | https://nme.babylonjs.com |
| NGE | https://nge.babylonjs.com |
| FlexLayout | https://github.com/caplin/FlexLayout |
| Blueprint | https://github.com/palantir/blueprint |
| Babylon.js Docs | https://doc.babylonjs.com |
| Babylon Playground | https://playground.babylonjs.com |
| Havok Physics (UMD) | https://cdn.babylonjs.com/havok/HavokPhysics_umd.js |
| Havok Physics (ES) | https://cdn.babylonjs.com/havok/HavokPhysics_es.js |
| Blender Exporter | https://github.com/BabylonJS/BlenderExporter |
| Tauri | https://tauri.app |
| Gaffer on Games (Networking) | https://gafferongames.com |

---

*Basalt Engine Roadmap — IronWill Interactive*
