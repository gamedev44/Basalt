# Basalt Engine — February 2026 Plan

> **"Forged in Blender. Hardened in Basalt."**

Scheduled work for February 2026: CDN version pinning and Babylon Native fork test.

---

## Schedule

| Date | Task | Notes |
|------|------|-------|
| **Wed Feb 4** | Pin CDN versions | Babylon.js, loaders, GUI, Inspector, Havok — pin to specific versions via jsDelivr |
| **Fri–Sun Feb 6–8** | Babylon Native fork test | Fork Basalt; integrate Babylon Native host; test viewport/engine in native build |

---

## Wed Feb 4 — Pin CDN Versions

**Goal:** Replace unpinned `cdn.babylonjs.com` URLs with version-pinned jsDelivr URLs for production stability.

**Files to update:**
- `Engine/Modules/Core/scripts.config.js` — BABYLON_SCRIPTS, INSPECTOR_SCRIPT, HAVOK_SCRIPT
- `Engine/Modules/Rendering/Live_Web_Viewport_W_Inspector.html`
- `Engine/Modules/Rendering/Editor_Layout.html`
- `Engine/Modules/Rendering/Viewport_Standalone.html`
- `Engine/Modules/Rendering/Project_Browser.html` (if it loads Babylon)
- `Engine/Modules/Rendering/Blueprint_Editor.html` (if applicable)

**Target version:** Pin to a stable Babylon.js 8.x release (e.g. `8.45.3` or latest at time of change).

**Example format:**
```
https://cdn.jsdelivr.net/npm/babylonjs@8.45.3/dist/babylon.js
https://cdn.jsdelivr.net/npm/babylonjs-loaders@8.45.3/babylonjs.loaders.min.js
https://cdn.jsdelivr.net/npm/babylonjs-gui@8.45.3/babylon.gui.min.js
```

---

## Fri–Sun Feb 6–8 — Babylon Native Fork Test

**Goal:** Validate Babylon Native as a build target for Basalt. Create a fork that tests the native host with Basalt engine modules.

**Steps:**
1. Fork Basalt (or create a `basalt-native` branch).
2. Clone Babylon Native: `git clone https://github.com/BabylonJS/BabylonNative.git`
3. Build Babylon Native Playground on Windows: `cmake -B build\win32` → open `BabylonNative.sln`.
4. Identify how Playground loads JS; plan how to inject Basalt engine modules.
5. Replace or augment Playground `experience.js` with Basalt viewport/scene logic.
6. Document findings: what works, what needs adaptation (DOM, storage, UI).

**Deliverables:**
- Working native build that runs Basalt viewport (or minimal subset).
- Notes on required adaptations for full Basalt native build.
- Decision: proceed with native as second build target or defer.

---

## References

- [STATUS.md](STATUS.md) — Current done vs pending
- [BASALT_ROADMAP.md](BASALT_ROADMAP.md) — Roadmap with CDN + Native phases
- [Babylon Native BUILDING.md](https://github.com/BabylonJS/BabylonNative/blob/master/BUILDING.md)

---

*Basalt Engine Plan — IronWill Interactive*
