# Basalt Engine — Master Status

> Single source of truth for what's done vs pending. Update as you complete work.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Done |
| 🔶 | Partial (works but incomplete) and subject to removal or change |
| 📋 | Planned |
| 🔮 | Future |

---

## Editor & Config Systems

| Item | Status | Notes |
|------|--------|-------|
| Dock Layout | ✅ | UE5-style 2x3 grid: Object Spawn, Live Viewport, Inspector | Content Drawer, Content Browser, Details; layout save/restore |
| Play view | ✅ | Full-screen standalone (Live_Web_Viewport); opens from Editor via Play button (new tab) |
| Editor viewport | ✅ | Docked canvas in Editor Layout for editing |
| Viewport mode switch | ✅ | "Play" (new tab) in Editor; "Editor" in Play view |
| Variable Panel | ✅ | Category-based inspector, Live Preview, WEAPON_SLOT dropdown |
| Weapon Data Table | ✅ | UE5-style; display name, damage, mag, full auto, camera base/ADS, URL, file |
| WEAPON_OVERRIDES | ✅ | Merged with WEAPON_DEFINITIONS; persisted to localStorage |
| Config persistence | ✅ | persistConfig() saves full config including WEAPON_OVERRIDES |
| Live Preview | ✅ | Variables + Weapon Data Table sync; camera changes update viewport |
| Inspector Panel | ✅ | Babylon debugLayer show/hide |
| Gizmo Handler | ✅ | GizmoManager; only active in Edit mode |
| Editor Mode Toggle | ✅ | Edit/Play (PIE), free-fly camera (WASD+right-drag+QE) |
| Play Mode panel | ✅ | PIE (Play/Stop in viewport), Play in New Window |
| Place Actors panel | 🔶 | UE5-style; spawns primitives (box, light, trigger); Player Start, Static Mesh, Vehicle wired; UI may change |
| Content Browser | 🔶 | Browse/import glTF; spawn mesh; integration with Place Actors may change |
| Content Drawer / Blueprint Graph | 🔶 | Toggle in status bar; graph panel present; subject to change |
| Script Attachment Panel | 📋 | Add/remove scripts on selected node |

---

## Status Bar & Toolbar (Subject to Change)

| Item | Status | Notes |
|------|--------|-------|
| Content Drawer toggle | ✅ | Blueprint Graph expand/collapse |
| Output Log | 🔶 | Tab present; stub (no log panel yet) |
| Cmd dropdown + input | 🔶 | Stub; Enter does nothing |
| Derived Data | 🔶 | Label only; no functionality |
| **Source Control** | 🔶 | **Subject to removal or change** — "Source Control: Off" placeholder; may be replaced or removed |
| Build Project (menu) | 🔶 | **Subject to removal or change** — stub; no build pipeline |
| Select All / Deselect All | 🔶 | **Subject to removal or change** — menu items; stubs |

---

## FPS / Gameplay

| Item | Status | Notes |
|------|--------|-------|
| FPS Controller | ✅ | Player, camera, input, movement, weapon, firing, HUD |
| Weapon switch (rifle/pistol) | ✅ | Keys 1/2, scroll, Tab wheel |
| Weapon loader | ✅ | ImportMeshAsync, race-safe, stopWeaponAnimations |
| Rifle walk animation | ✅ | Uses result.animationGroups from current load |
| ADS (aim down sights) | ✅ | Per-weapon camera config |
| Rifle camera offset | ✅ | RIFLE_CAMERA in weapon-switch-component |
| Camera offset sliders | ✅ | CAM_OFFSET_X, CAM_OFFSET_Y in Variables (ADS) |
| Firing / tracer | ✅ | Raycast, recoil; damage/ammoCount in data table (not yet wired to health) |
| Air momentum | ✅ | Horizontal velocity persists in air; AIR_DRAG decay; AIR_ACCELERATION |
| Fall respawn | ✅ | FALL_RESPAWN_Y; respawn at spawn position when Y < threshold |
| Movement state API | ✅ | getState(), getVelocity(), MovementMode — for network replication |
| Movement replication design | ✅ | MULTIPLAYER_REFERENCE §7 — velocity, mode, input commands |

---

## Core

| Item | Status | Notes |
|------|--------|-------|
| Engine bootstrap | ✅ | modules.config.js, bootstrap.js, main.js |
| Config schema | ✅ | CONFIG_SCHEMA, initConfig, persistConfig |
| Template loader | ✅ | FPS (default) or Empty scene |
| Scene / lights / ground | ✅ | createScene, createGroundOrMantle |

---

## UI

| Item | Status | Notes |
|------|--------|-------|
| Toolbar | ✅ | Inspector, Stats buttons |
| HUD | ✅ | Crosshair, stats (bullets, jumps) |
| Weapon wheel | ✅ | Tab to open, click to switch |

---

## Planned (Roadmap)

| Item | Status | Ref |
|------|--------|-----|
| **CDN version pinning** | 📋 Wed Feb 4 | PLAN_2026_FEB — Babylon.js, loaders, GUI, Inspector, Havok via jsDelivr |
| **Babylon Native fork test** | 📋 Fri–Sun Feb 6–8 | PLAN_2026_FEB — validate native build target |
| **Base Editor** — DockView + dynamic panel registration from module manifests | 📋 | BASALT_ROADMAP §Architectural Vision |
| **Project Explorer** — Template selection (Advanced FPS vs Empty Base) entry point | 📋 | BASALT_ROADMAP §Architectural Vision |
| **System Atomization** — Single Module philosophy (Lighting, Havok, Weapon) | 📋 | BASALT_ROADMAP §Architectural Vision |
| **Loosely Coupled Workflow** — Module dir standard (module.json, logic.js, editor.js) | 📋 | BASALT_ROADMAP §Architectural Vision |
| **Total Isolation** — Editor vs Engine vs Game layers + Game export | 📋 | BASALT_ROADMAP §Architectural Vision |
| **On-the-Fly Scaling** — Module Registry for drag-inject without restart | 📋 | BASALT_ROADMAP §Architectural Vision |
| Monaco Code Panel | 📋 | BASALT_ROADMAP |
| NME Panel | 📋 | BASALT_ROADMAP |
| In-viewport editor mode | 📋 | EDITOR_MODE_REFERENCE |
| Multiplayer foundation | 📋 | MULTIPLAYER_REFERENCE |
| Havok Physics | 📋 | HAVOK_REFERENCE |
| Mantle terrain | 📋 | MANTLE_MODULE_REFERENCE |

---

## Known Gaps

- **Damage / ammoCount** — Weapon Data Table edits these; firing system does not yet use them (no health system).
- **Gizmo visibility** — Always on; should hide when not in editor mode.
- **Empty template** — Weapon Data Table and weapon-related panels not shown (no fpsController).
- **CDN unpinned** — Babylon.js loaded from `cdn.babylonjs.com` (latest); pin for production (planned Feb 4).

---

*Last updated: 2026-01-30*
