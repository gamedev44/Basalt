# Havok Physics — Integration Reference

**Source:** [Babylon.js Havok Plugin](https://doc.babylonjs.com/features/featuresDeepDive/physics/havokPlugin#full-in-browser-example-using-the-umd-version)

Havok is available for the web via a WebAssembly build. It is free to use under the MIT license.

---

## CDN URLs

| Format | URL |
|--------|-----|
| **UMD** (script tag) | `https://cdn.babylonjs.com/havok/HavokPhysics_umd.js` |
| **ES Module** | `https://cdn.babylonjs.com/havok/HavokPhysics_es.js` |

---

## Live Web Setup (UMD)

```html
<!-- Babylon.js Havok CDN — live web version -->
<script src="https://cdn.babylonjs.com/havok/HavokPhysics_umd.js"></script>
<script src="https://cdn.babylonjs.com/babylon.js"></script>
<script src="https://cdn.babylonjs.com/gui/babylon.gui.min.js"></script>
```

**Load order:** Havok must load **before** Babylon.js.

---

## NPM Package

```bash
npm install @babylonjs/havok
```

```javascript
import HavokPhysics from "@babylonjs/havok";
const havokInstance = await HavokPhysics();
```

---

## Requirements

- **WebAssembly SIMD** — Required for Havok
- **iOS < 16.4** — Not supported (no SIMD)
- **Chrome, Edge, Firefox** — Supported

---

## Basalt Notes

1. Add Havok script **before** Babylon.js in `Live_Web_Viewport_W_Inspector.html` (or editor shell)
2. Initialize: `scene.enablePhysics(null, new BABYLON.HavokPlugin())`
3. Replace custom gravity/jump logic with Havok rigid bodies + `moveWithCollisions` for player
4. Use `basalt_mass`, `basalt_elasticity` from IronWill schema for physics props
5. Mantle heightmap → Havok heightmap collider for terrain
6. Fallback: Detect `!engine.getCaps().supportSIMD` and show warning or use legacy physics
