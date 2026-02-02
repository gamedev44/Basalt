# Basalt Engine — Full Context for Contributors & Cursor AI

> **"Forged in Blender. Hardened in Basalt."**

This document captures everything a contributor or Cursor AI needs to know to build Basalt effectively. Use it as the single source of context when working on the project.

---

## Table of Contents

1. [What Basalt Is](#1-what-basalt-is)
2. [Architecture Overview](#2-architecture-overview)
3. [Key File Locations](#3-key-file-locations)
4. [Tech Stack & Dependencies](#4-tech-stack--dependencies)
5. [The IronWill Contract (Schema)](#5-the-ironwill-contract-schema)
6. [Module System](#6-module-system)
7. [What's Done vs Partial vs Planned](#7-whats-done-vs-partial-vs-planned)
8. [What to Do — Best Practices](#8-what-to-do--best-practices)
9. [What to Avoid — Pitfalls](#9-what-to-avoid--pitfalls)
10. [Babylon Native & Native Build](#10-babylon-native--native-build)
11. [CDN & Production](#11-cdn--production)
12. [Planned Work (Feb 2026)](#12-planned-work-feb-2026)
13. [Reference Docs](#13-reference-docs) — [Our Docs](#13a-our-docs-docs--which-help-most--how-they-relate) | [Babylon.js Docs](#13b-babylonjs-docs--resources--when-you-need-them)
14. [Quick Tips for Cursor AI](#14-quick-tips-for-cursor-ai)

---

## 1. What Basalt Is

- **Babylon.js-based game engine** — WebGPU, high-fidelity rendering
- **UE5-style editor** — DockView layout, panels, viewport, PIE (Play in Editor)
- **IronWill Pipeline** — Blender → glTF, entity tagging, bake & export
- **Source 1 (Hammer) feel** — Workflow inspired by Valve's Hammer editor
- **Web-first** — Static HTML/JS, no build step; runs in browser
- **Native planned** — Babylon Native fork test Feb 6–8; PC + Xbox (UWP) focus

---

## 2. Architecture Overview

```
Basalt/
├── index.html                    # Splash → redirects to Project_Browser or Editor
├── Engine/
│   └── Modules/
│       ├── bootstrap.js         # Entry; loads scripts, modules
│       ├── main.js              # Engine loop, scene init
│       ├── loader.js            # Dynamic module loader
│       ├── modules.config.js    # Module registry, script URLs
│       ├── Core/                # Config, scene, templates, scripts.config.js
│       ├── Editor/              # Panels, dock layout, menu, status bar
│       ├── Player/              # Character, camera, movement, input, ADS
│       ├── Weapons/             # Weapon component, firing, loader, switch
│       ├── Vehicle/             # Vehicle rig, chassis, wheels (Havok)
│       ├── UI/                  # Crosshair, HUD, toolbar, weapon wheel
│       ├── Rendering/           # HTML entry points, ground, lights
│       ├── Pipeline/            # Import settings, IronWill schema
│       ├── Starter/             # FPS controller template
│       └── World/mantle/        # Terrain, foliage, actor scatter
├── docs/                        # STATUS, ROADMAP, PLAN, reference docs
└── DockingShell/                # Separate React/TS project (mapbox, etc.)
```

**Entry flow:**
- `index.html` → splash → `Project_Browser.html` or `Editor_Layout.html`
- `Editor_Layout.html` loads `bootstrap.js` (type="module")
- Bootstrap loads scripts from `scripts.config.js`, then modules from `modules.config.js`
- Main viewport: `Live_Web_Viewport_W_Inspector.html` (Play) or docked canvas (Editor)

---

## 3. Key File Locations

| Purpose | Path |
|---------|------|
| **Script URLs (CDN)** | `Engine/Modules/Core/scripts.config.js` |
| **Module registry** | `Engine/Modules/Core/modules.config.js` |
| **Config schema** | `Engine/Modules/Core/config.js` |
| **Dock layout** | `Engine/Modules/Editor/dock-layout.js` |
| **Play viewport** | `Engine/Modules/Rendering/Live_Web_Viewport_W_Inspector.html` |
| **Editor shell** | `Engine/Modules/Rendering/Editor_Layout.html` |
| **FPS template** | `Engine/Modules/Core/templates/fps-schema.js` |
| **Weapon definitions** | `Engine/Modules/Editor/weapon-data-table.js` |
| **Status** | `docs/STATUS.md` |
| **Roadmap** | `docs/BASALT_ROADMAP.md` |
| **Plan (Feb 2026)** | `docs/PLAN_2026_FEB.md` |

---

## 4. Tech Stack & Dependencies

| Layer | Choice | Notes |
|-------|--------|------|
| **3D Engine** | Babylon.js | WebGPU/WebGL; CDN (unpinned — pin planned Feb 4) |
| **Layout** | dockview-core 4.13.1 | UE5-style docking; from esm.sh / jsdelivr |
| **Physics** | Havok WASM | `HavokPhysics_umd.js` — must load before Babylon.js |
| **Code Editor** | Monaco | For script editing (Blueprint panel, etc.) |
| **Build** | None | Static HTML/JS; no npm/Node for main app |
| **Hosting** | GitHub Pages | Static deploy |

**Script load order:** Havok → Babylon core → loaders → GUI → Inspector

---

## 5. The IronWill Contract (Schema)

Blender objects use naming prefixes and custom properties so Basalt interprets them correctly.

**Naming prefixes:**
- `ent_` — Interactive entities (spawns, items)
- `vol_` — Triggers, reverb zones
- `snd_` — Audio emitters
- `light_` — Dynamic lights
- `col_` — Physics-only meshes

**Custom properties (Blender):**
- `basalt_mass` — Havok weight
- `basalt_elasticity` — Bounciness
- `echo_id` — Narrative branch
- `substrate_index` — Shader variant

---

## 6. Module System

- **modules.config.js** — Declares which modules load (lights, vehicle, etc.)
- **module-library.js** — Manifest of available modules (lighting, physics, weapon, player, vehicle, mantle, fps-controller)
- **Templates** — FPS (default) or Empty; `templates/fps-schema.js`, `templates/empty-schema.js`
- **WEAPON_DEFINITIONS** — Merged with WEAPON_OVERRIDES; persisted to localStorage
- **persistConfig()** — Saves full config including weapon overrides

---

## 7. What's Done vs Partial vs Planned

### ✅ Done
- Engine bootstrap, config schema, template loader
- Dock layout (UE5 2x3 grid), layout save/restore
- Play view (full-screen), Editor viewport (docked)
- Variable Panel, Weapon Data Table, Live Preview
- Inspector (Babylon debugLayer), Gizmo Handler
- Editor Mode Toggle (Edit/Play, free-fly camera)
- Play Mode panel (PIE, Play in New Window)
- FPS Controller (player, camera, input, weapon switch, firing, HUD, ADS)
- Weapon loader (ImportMeshAsync, race-safe)
- Havok Vehicle (chassis, wheels, suspension)
- Toolbar, HUD, crosshair, weapon wheel

### 🔶 Partial (Subject to Change)
- **Place Actors panel** — Spawns primitives; UI may change
- **Content Browser / Content Drawer** — Import glTF; Blueprint Graph toggle
- **Status bar** — Source Control, Build Project, Select All/Deselect All — stubs; may be removed or changed
- **Output Log** — Tab present; no log panel yet
- **Cmd dropdown** — Stub; Enter does nothing
- **Derived Data** — Label only

### 📋 Planned
- CDN version pinning (Wed Feb 4)
- Babylon Native fork test (Fri–Sun Feb 6–8)
- Monaco Code Panel, NME Panel
- Havok Physics (full), Mantle terrain
- Substrate, Sonar, Echo, Facade

### Known Gaps
- Damage/ammoCount in Weapon Data Table — not wired to health
- Gizmo visibility — always on; should hide when not in editor mode
- Empty template — weapon panels not shown (no fpsController)
- CDN unpinned — pin for production

---

## 8. What to Do — Best Practices

1. **Read STATUS.md first** — Single source of truth for done vs pending
2. **Use globalThis.BABYLON** — Engine modules check `globalThis.BABYLON` before using Babylon API
3. **Keep engine logic pure Babylon.js** — Avoid DOM/storage in core modules; easier native port
4. **Follow IronWill schema** — Use `ent_`, `vol_`, etc. for Blender exports
5. **Pin CDN versions for production** — Use jsDelivr with version (e.g. `@8.45.3`)
6. **Update STATUS.md when completing work** — Keep it current
7. **Use CONFIG_SCHEMA for new variables** — Category-based inspector; persistConfig()
8. **Weapon Data Table** — Add weapons via WEAPON_DEFINITIONS; WEAPON_OVERRIDES for user overrides
9. **Test Play vs Editor** — Play opens new tab; Editor has docked viewport
10. **Check docs/ for reference** — HAVOK_REFERENCE, EDITOR_MODE_REFERENCE, etc.

---

## 9. What to Avoid — Pitfalls

1. **Don't use unpinned CDN in production** — `cdn.babylonjs.com/babylon.js` serves latest; can break
2. **Don't assume DOM exists in engine modules** — Native build has no DOM; use Babylon GUI for HUD
3. **Don't add runtime UI switching** — Two separate builds (web vs native), not one build that switches
4. **Don't use Babylon Editor** — Basalt has its own editor; Babylon Editor is separate
5. **Don't need full Babylon.js source** — Babylon Native provides runtime
6. **Don't over-engineer CDN fix** — Pin version first; npm+bundler when needed for native
7. **Don't assume Source Control / Build Project work** — Stubs; subject to removal
8. **Havok load order** — Havok must load before Babylon.js
9. **Empty template** — No fpsController; weapon panels hidden; handle gracefully
10. **DockingShell** — Separate React/TS project; not the main editor

---

## 10. Babylon Native & Native Build

**Two product versions:**
- **Basalt Web** — Browser; HTML/CSS editor, dockview
- **Basalt Native** — Desktop; native host, Babylon Native

**Build target selector** — Choose web vs native at build time; shared engine core, different shells.

**What transfers to native:**
- Babylon.js scene logic, engine modules, IronWill pipeline
- Core gameplay (movement, input, weapons, vehicles)

**What needs adaptation:**
- DOM/HTML UI → Babylon GUI or native UI
- localStorage/sessionStorage → native persistence
- Editor shell (dockview) → native docking or simpler editor

**Babylon Native setup (Windows):**
- Dependencies: git, CMake, Node.js, Visual Studio 2022 (C++), Python 3
- Clone: `git clone https://github.com/BabylonJS/BabylonNative.git`
- Build: `cmake -B build\win32` → open `BabylonNative.sln` → run Playground
- UWP (Xbox): `cmake -B build/uwp -D CMAKE_SYSTEM_NAME=WindowsStore -D CMAKE_SYSTEM_VERSION=10.0`

**Platforms:** Windows, macOS, Linux, iOS, Android; UWP for Xbox. PlayStation/Xbox consoles require licensing; Babylon Native doesn't officially support them yet.

---

## 11. CDN & Production

**Current:** Babylon.js from `cdn.babylonjs.com` (unpinned) — OK for dev, not production.

**Production options:**
1. **Pin version (simplest)** — `https://cdn.jsdelivr.net/npm/babylonjs@8.45.3/dist/babylon.js`
2. **npm + bundler** — When needed for native; tree-shaking, single bundle
3. **Self-host** — Download from npm, serve from own domain

**Files to update for CDN pinning (Wed Feb 4):**
- `Engine/Modules/Core/scripts.config.js`
- `Engine/Modules/Rendering/Live_Web_Viewport_W_Inspector.html`
- `Engine/Modules/Rendering/Editor_Layout.html`
- `Engine/Modules/Rendering/Viewport_Standalone.html`
- `Engine/Modules/Rendering/Project_Browser.html`
- `Engine/Modules/Rendering/Blueprint_Editor.html`

---

## 12. Planned Work (Feb 2026)

| Date | Task |
|------|------|
| **Wed Feb 4** | Pin CDN versions (Babylon.js, loaders, GUI, Inspector, Havok) via jsDelivr |
| **Fri–Sun Feb 6–8** | Babylon Native fork test — validate native build target |

See `docs/PLAN_2026_FEB.md` for details.

---

## 13. Reference Docs — Our Docs & Babylon.js

### 13a. Our Docs (docs/) — Which Help Most & How They Relate

**Start here (always):**
| Doc | When to Use | Relates To |
|-----|-------------|------------|
| `docs/STATUS.md` | Before any work — know what's done vs partial vs planned | Master checklist; update when completing work |
| `docs/BASALT_ROADMAP.md` | Vision, phases, tech choices, implementation order | References all other docs; contains Babylon.js doc links |
| `docs/PLAN_2026_FEB.md` | CDN pinning (Feb 4), Babylon Native fork (Feb 6–8) | STATUS, ROADMAP |

**By feature area:**
| Doc | When to Use | Relates To |
|-----|-------------|------------|
| `docs/editor/EDITOR_MODE_REFERENCE.md` | Editor mode toggle, free-fly camera, gizmos, pause, script panel | EDITOR_MODE_REFERENCE → Gizmo Handler, Play Mode; uses UniversalCamera |
| `docs/physics/HAVOK_REFERENCE.md` | Havok setup, load order, CDN URLs, SIMD requirements | scripts.config.js (Havok before Babylon); vehicle-component.js; Mantle heightmap colliders |
| `docs/mantle/MANTLE_MODULE_REFERENCE.md` | TerrainGenerator, TerrainPainter, foliage, actor scatter | C90R62_REFERENCE; Havok heightmap; NME terrain material |
| `docs/mantle/C90R62_REFERENCE.md` | Mantle Playground source — erosion params, GPU compute | Mantle module; [C90R62#21](https://playground.babylonjs.com/?webgpu#C90R62#21) |
| `docs/audio/SONAR_REFERENCE.md` | BABYLON.Sound, spatial audio, multi-track sync | IronWill `snd_` prefix; `vol_` reverb zones |
| `docs/animation/MIXAMO_TRIGGER_REFERENCE.md` | Mixamo animations, blending, beginAnimation, beginWeightedAnimation | weapon-loader.js (animationGroups); character animation |
| `docs/behaviors/POINTER_DRAG_REFERENCE.md` | PointerDragBehavior — rail constraint, dragAxis, dragPlaneNormal | Sliders, levers, doors on tracks |
| `docs/geometry/NGE_REFERENCE.md` | Node Geometry Editor — procedural mesh authoring | NGE iframe; complements NME + Mantle |
| `docs/fps/SHOULDER_CAM_REFERENCE.md` | Shoulder camera (future) — right/left view, GTA-style | Player/camera; optional |
| `docs/multiplayer/MULTIPLAYER_REFERENCE.md` | RLS, run contexts (server/client), RPCs, replication | Movement state API; getState(), getVelocity() |
| `docs/collab/COLLAB_EDITOR_REFERENCE.md` | Firebase cursor presence, chat, DMs, video | React + Firebase; separate from main editor |

**Other:**
| Doc | When to Use |
|-----|-------------|
| `docs/examples.json` | Curated example URLs for browser/playground |
| `docs/IWI_PCL_BASALT.md` | License, terms |

**Doc dependency flow:**
```
STATUS ←→ BASALT_ROADMAP ←→ PLAN_2026_FEB
    ↓
EDITOR_MODE_REFERENCE (editor mode, gizmos)
HAVOK_REFERENCE (physics) → vehicle-component, Mantle heightmap
MANTLE_MODULE_REFERENCE ← C90R62_REFERENCE (terrain source)
SONAR_REFERENCE (audio) → snd_, vol_
MIXAMO_TRIGGER_REFERENCE (animation) → weapon-loader
POINTER_DRAG_REFERENCE (behaviors) → sliders/levers
NGE_REFERENCE (geometry) → procedural mesh
MULTIPLAYER_REFERENCE (networking) → movement replication
```

---

### 13b. Babylon.js Docs & Resources — When You Need Them

**Official docs (doc.babylonjs.com):**
| Topic | URL | Use When |
|-------|-----|----------|
| **Havok Plugin** | [Havok Plugin](https://doc.babylonjs.com/features/featuresDeepDive/physics/havokPlugin#full-in-browser-example-using-the-umd-version) | Physics setup; UMD load order |
| **Mesh Behaviors** | [Mesh Behaviors](https://doc.babylonjs.com/features/featuresDeepDive/behaviors/meshBehaviors) | PointerDragBehavior, SixDofDragBehavior |
| **Cameras** | [Camera Introduction](https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction) | UniversalCamera, FlyCamera |
| **Gizmos** | [Gizmos](https://doc.babylonjs.com/features/featuresDeepDive/mesh/gizmo) | GizmoManager, position/rotation/scale |
| **Legacy Audio** | [Legacy Audio](https://doc.babylonjs.com/legacy/audio) | BABYLON.Sound, spatial |
| **Animated Character** | [Animated Character](https://doc.babylonjs.com/features/featuresDeepDive/animation/animatedCharacter) | Skeleton, beginAnimation |
| **Blender Exporter** | [Blender Exporter](https://doc.babylonjs.com/features/featuresDeepDive/Exporters/Blender/) | IronWill pipeline |
| **Mixamo to Babylon** | [Mixamo to Babylon](https://doc.babylonjs.com/features/featuresDeepDive/Exporters/Mixamo_to_Babylon/) | Character pipeline |
| **Dynamic Texture** | [Dynamic Texture](https://doc.babylonjs.com/features/featuresDeepDive/materials/using/dynamicTexture) | Runtime texture gen |
| **Mesh Decals** | [Mesh Decals](https://doc.babylonjs.com/features/featuresDeepDive/mesh/decals) | Decal projection |

**Playgrounds (playground.babylonjs.com):**
| ID | Purpose |
|----|---------|
| [C90R62#21](https://playground.babylonjs.com/?webgpu#C90R62#21) | Mantle terrain — simplex noise, erosion, WebGPU |
| [PCY1J#6](https://playground.babylonjs.com/#PCY1J#6) | Sonar — 3 violins, multi-track sync |
| [BCU1XR](https://playground.babylonjs.com/#BCU1XR#0) | FPS / gameplay |
| [L92PHY#217](https://playground.babylonjs.com/#L92PHY#217) | Physics demo |

**External tools:**
| Tool | URL | Purpose |
|------|-----|---------|
| **NME** | https://nme.babylonjs.com | Node Material Editor — shaders |
| **NGE** | https://nge.babylonjs.com | Node Geometry Editor — procedural mesh |
| **Babylon Native** | https://github.com/BabylonJS/BabylonNative | Native build; BUILDING.md for setup |

**CDN / npm:**
| Package | CDN (unpinned) | jsDelivr (pinned) |
|---------|----------------|-------------------|
| babylonjs | cdn.babylonjs.com/babylon.js | cdn.jsdelivr.net/npm/babylonjs@8.45.3/dist/babylon.js |
| babylonjs-loaders | cdn.babylonjs.com/loaders/babylonjs.loaders.min.js | cdn.jsdelivr.net/npm/babylonjs-loaders@8.45.3/... |
| babylonjs-gui | cdn.babylonjs.com/gui/babylon.gui.min.js | cdn.jsdelivr.net/npm/babylonjs-gui@8.45.3/... |
| Havok | cdn.babylonjs.com/havok/HavokPhysics_umd.js | (Havok may differ; check Babylon docs) |

---

## 14. Quick Tips for Cursor AI

1. **Always check STATUS.md** before assuming something is done or planned
2. **scripts.config.js** — Central place for Babylon/Havok script URLs
3. **modules.config.js** — Controls which modules load
4. **BABYLON** — Use `globalThis.BABYLON` or `typeof BABYLON !== 'undefined'` before Babylon API calls
5. **Place Actors, Content Browser, Source Control** — Partial/stub; don't assume full behavior
6. **Entry points** — `index.html` → `Project_Browser.html` or `Editor_Layout.html`; `Editor_Layout.html` uses `bootstrap.js`
7. **Weapon system** — `weapon-loader.js`, `weapon-component.js`, `weapon-switch-component.js`, `firing.js`; data from `weapon-data-table.js`
8. **Vehicle** — `vehicle-rig.js` (socket config), `vehicle-component.js` (Havok chassis/wheels)
9. **Config** — `CONFIG_SCHEMA` in config.js; `persistConfig()` saves; `initConfig()` loads
10. **Native** — Don't add DOM/storage in shared engine code if native is a goal
11. **Docs** — Read `docs/STATUS.md` first; then feature-specific ref (e.g. HAVOK_REFERENCE for physics). BASALT_ROADMAP has Babylon.js doc links.
12. **Babylon.js** — For API questions: doc.babylonjs.com. For examples: playground.babylonjs.com. For native: github.com/BabylonJS/BabylonNative

---

*Basalt Engine Context — IronWill Interactive — Last updated: February 02, 2026*
