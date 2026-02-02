# Node Geometry Editor (NGE) — Integration Reference

**URL:** https://nge.babylonjs.com

Visual node-based procedural geometry editor — Blender Geometry Nodes–style authoring in the browser.

---

## Overview

- **NGE** — Node Geometry Editor for Babylon.js
- **Purpose** — Procedural mesh generation via node graph (primitives, transforms, instances, etc.)
- **Output** — JSON; load at runtime via `NodeGeometry.Parse()` or similar
- **Complements** — NME (materials) + Mantle (terrain); NGE for general procedural geometry

---

## Use Cases for Basalt

| Use Case | Description |
|----------|-------------|
| **Procedural props** | Architecture, vegetation, rocks |
| **Terrain variants** | Mantle height map + NGE mesh generation |
| **Geometry scripting** | Node graph instead of code for mesh logic |
| **Blender parity** | Geometry Nodes–like workflow in web editor |

---

## Integration Options

1. **Embed iframe** — Load NGE in FlexLayout panel (like NME)
2. **API bridge** — NGE exports JSON; Basalt runtime loads via `NodeGeometry.Parse()`
3. **Custom panel** — Wrap NGE with "Apply to Scene" / "Save to Project"

---

## Basalt Notes

1. **Editor layout** — NGE panel alongside NME, viewport, code
2. **IronWill** — Future: `geo_` prefix for procedural geometry objects; `basalt_geo_snippet` custom prop
3. **Mantle** — NGE for terrain mesh variants, LOD meshes, or procedural detail
4. **Export** — NodeGeometry → mesh → glTF or scene injection
