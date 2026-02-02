# 🪨 BASALT ENGINE
> "Forged in Blender. Hardened in Basalt."

[![Basalt](https://img.shields.io/badge/Basalt-Engine-1a1c1e?labelColor=0a0b0c)](https://github.com/gamedev44/Basalt)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Babylon.js](https://img.shields.io/badge/Babylon.js-8.x-F36422?logo=babylon.js&logoColor=white)](https://www.babylonjs.com/)
[![WebGPU](https://img.shields.io/badge/WebGPU-333333?logo=webgpu&logoColor=white)](https://gpuweb.github.io/gpuweb/)
[![dockview](https://img.shields.io/badge/dockview-4.13.1-4c65d4)](https://github.com/mathuo/dockview)
[![Havok](https://img.shields.io/badge/Havok-WASM-8B0000)](https://doc.babylonjs.com/features/featuresDeepDive/physics/havokPlugin)

**Hidden CDN Backend** *(API-accessible, not in repo)*

[![Backend JS](https://img.shields.io/badge/JavaScript-62%25-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Backend TS](https://img.shields.io/badge/TypeScript-13.8%25-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Backend SCSS](https://img.shields.io/badge/SCSS-12.6%25-CC6699?logo=sass&logoColor=white)](https://sass-lang.com/)
[![Backend HLSL](https://img.shields.io/badge/HLSL-6.5%25-007ACC)](https://docs.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl)
[![Backend Wolfram](https://img.shields.io/badge/Wolfram-2%25-DD1100)](https://www.wolfram.com/)
[![Backend ObjC++](https://img.shields.io/badge/Objective--C++-1.5%25-6866FB)](https://developer.apple.com/)
[![Backend C](https://img.shields.io/badge/C-1%25-A8B9CC?logo=c&logoColor=black)](https://en.wikipedia.org/wiki/C_(programming_language))
[![Backend Roff](https://img.shields.io/badge/Roff-0.4%25-333333)](https://en.wikipedia.org/wiki/Roff)
[![Backend HTML](https://img.shields.io/badge/HTML-0.2%25-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)

---

**Basalt** is the modern web engine — high-fidelity WebGPU (via Babylon.js), Hammer-style workflow, mesh-based editing. Built for developers who want desktop-class rendering in the browser without the bloat.

The **IronWill Pipeline** transforms Blender into a professional-grade map editor, entity manager, and logic sequencer — one workflow, no fragmented tools.

---

## Why Basalt? Why Not Babylon Editor?

We use **Babylon.js** for rendering and physics — it's excellent. But we built **Basalt** as our own editor instead of using the Babylon Editor. Here's why:

| Our Path | Why |
|----------|-----|
| **Blender-centric** | Model, entity-tag, and bake in one tool. No switching between editors. Basalt Lives To Compliment The Blender Workflow Making it Easier to Make Games Using Blender as your Creative Tool. |
| **Hammer feel** | UE5-style dock layout, PIE (Play in Editor), familiar workflow for Source/Valve and unreal engine 5.5 devs. |
| **Zero build step** | Static HTML/JS. Run anywhere — GitHub Pages, local, no npm install. |
| **Full control** | We own the editor UX. Tailor panels, variables, weapon tables to game dev, not generic 3D. |
| **Web-first** | Runs in browser. No desktop install. Share a link, and it works. |
| **Mesh-based** | No BSP brushes. Modern glTF pipeline. Sculpt in Blender, export, play. |
| **Native path** | Babylon Native fork test (coming soon Feb 10th) — same engine, desktop build. Babylon Editor is a separate product. |

**Babylon Editor** is a great general-purpose editor. Basalt is **AAA game-engine focused around Blender Heavy Worflows and Pipelines** — FPS templates, weapon systems, IronWill schema, Blender integration. Different goals, different tools.

---

## 🎮 Try it (Early) Now (not yet finished) (WIP)
Experience the engine directly in your browser while as it Evolves and is being Developed into a full fledge engine with editor by IronWill:

# [Basalt Engine : Live Web Test](https://gamedev44.github.io/Basalt/)

---

## 📍 Table of Contents
* [STATUS](docs/STATUS.md) — Master checklist: done vs pending
* [ROADMAP](docs/BASALT_ROADMAP.md) — Architectural vision, atomization, module philosophy
* [Why Basalt?](#why-basalt-why-not-babylon-editor) — Why we chose this path over Babylon Editor
* [CHANGELOG](CHANGELOG.md) — New features, fixes, reliability systems
* [🛠️ Tech Stack](#️-tech-stack)
* [🏗️ Core Architecture](#️-core-architecture-the-basalt-stack)
* [🔄 The IronWill Workflow](#-the-ironwill-workflow)
* [📜 The IronWill Contract](#-the-ironwill-contract-schema)
* [🛠️ World Generation Tools](#️-world-generation-tools)
* [🚀 Getting Started](#-getting-started)
* [📈 Development Status](#-development-status)
* [⚖️ License](#️-license)

---

## 🛠️ Tech Stack

**Frontend** badges above = Basalt's visible stack (JS, HTML, CSS, Babylon.js, WebGPU, dockview, Havok).  
**Hidden CDN Backend** badges = underlying runtime stack — not in this repo; callable via API.

### Programming Languages
| Language | Where Used |
| :--- | :--- |
| **JavaScript (ES6+)** | Engine runtime, editor UI, game logic, modules |
| **HTML5** | Entry pages, structure, canvas |
| **CSS3** | Styling, layout, themes |
| **Python** | IronWill Blender add-on, pipeline scripts (external) |

### Libraries & Frameworks
| Library | Version | Purpose |
| :--- | :--- | :--- |
| **Babylon.js** | CDN (pin planned Feb 4) | 3D engine, WebGPU/WebGL, scene graph, physics |
| **Babylon.js Loaders** | CDN | glTF/GLB import |
| **Babylon.js GUI** | CDN | HUD, crosshair, stats overlay |
| **Babylon.js Inspector** | CDN | Scene debug layer |
| **dockview-core** | 4.13.1 | Docking layout, panels, tabs (UE5-style editor shell) |

### Dependencies
- **No npm/Node** — Main app runs as static HTML/JS; no build step.
- **CDN delivery** — Babylon.js from `cdn.babylonjs.com`; dockview from `esm.sh` and `cdn.jsdelivr.net`.
- **ES Modules** — Native `import`/`export`; dynamic module loader.

### Storage & APIs
| API | Purpose |
| :--- | :--- |
| **localStorage** | Layout persistence, config |
| **sessionStorage** | Viewport camera sync |
| **Web Audio API** | Audio (Sonar, planned) |
| **WebGPU / WebGL** | Rendering |

### Hosting
- **GitHub Pages** — Static file hosting; no server required.

---

## 🏗️ Core Architecture (The Basalt Stack)
Basalt is composed of several specialized modules that handle everything from physics to narrative logic.

| Component | Name | Technology | Description |
| :--- | :--- | :--- | :--- |
| **Core Runtime** | Basalt | Babylon.js | The engine loop, renderer, and state manager. |
| **Pipeline** | Iron | Python/JS | The automated export, bake, and sync bridge. | (Coming Soon.)
| **Physics** | Havok | Havok WASM | Real-time rigid body dynamics and ragdolls. |
| **Materials** | Substrate | PBR / Node | Custom shader system for realistic surfaces. |
| **Audio** | Sonar | Web Audio API | Spatial 3D audio and acoustic simulation. |
| **Narrative** | Echo | Logic Graph | Branching dialogue and event-triggering. |
| **Interface** | Facade | HTML/CSS/Canvas | HUD and UI builder with layout synchronization. |

---

## 🔄 The IronWill Workflow
The IronWill Pipeline replaces the traditional "Hammer" workflow with a modern **WYSIWYG** (What You See Is What You Get) approach.

1.  **Modeling/Mapping (The Forge):** Build worlds in Blender using standard mesh tools. No BSP brushes or primitive constraints.
2.  **Entity Tagging:** Use the IronWill Inspector (Blender Add-on) to define entities (e.g., `ent_prop_physics`, `ent_light_point`).
3.  **IronWill Bake:** A single-click script that compresses textures into KTX2, converts meshes to optimized glTF, and exports Echo and Facade metadata.
4.  **Basalt Injection:** The runtime loads the glTF and hydrates the scene, instantiating Havok physics, Sonar audio emitters, and JS logic components automatically.

---

## 📜 The IronWill Contract (Schema)
To ensure the engine correctly interprets Blender data, Basalt follows a strict naming and property convention.

### Naming Prefixes
* `ent_`: Interactive logic entities (e.g., player spawns, items).
* `vol_`: Invisible boundary boxes for triggers and reverb zones.
* `snd_`: Audio emitters for Sonar.
* `light_`: Dynamic lighting points.
* `col_`: Invisible physics-only meshes for complex geometry.

### Custom Properties
Reserved keys in Blender’s **Custom Properties** panel:
* `basalt_mass`: Float value for Havok weight calculation.
* `basalt_elasticity`: Bounciness factor for physics.
* `echo_id`: Links an object to a specific Echo narrative branch.
* `substrate_index`: Forces a specific shader variant from the Substrate library.

---

## 🛠️ World Generation Tools

### Mantle (Landscape & Terrain)
Handles massive scale terrain using Blender’s Sculpt Mode and Geometry Nodes. Basalt interprets this data to generate Havok heightmap colliders and LOD-based meshes.

### Atmos.js (Planetary & Space)
Space-simulation rendering featuring Rayleigh & Mie scattering, procedural planet generation, and seamless transition from orbit to surface.

---

## 🚀 Getting Started
1.  **Install the Toolkit:** Download `iron_devtools.py` and run it in the Blender Text Editor to enable the custom 'IronWill' UI and N-Panel inspector.
2.  **Define your Project Path:** In the Iron Panel settings, bind your local Basalt Editor project folder.
3.  **Build & Play:** Use the **Integrated Panel Play Button** operator to clean the last scene render web window and bake your scene. This instantly launches the Basalt previewer.

---

## 📈 Development Status

**Master status:** [docs/STATUS.md](docs/STATUS.md) — single source of truth for done vs pending.

### ✅ Completed Modules
- [x] **Renderer Core:** High-fidelity WebGPU implementation via Babylon.js.
- [x] **Live Editor Viewport:** Real-time synchronization bridge.
- [x] **Inspector System:** Babylon debugLayer show/hide; entity metadata tagging (N-Panel planned).
- [x] **Havok Physics Integration:** Vehicle rig, chassis, wheels; physics bodies.
- [x] **FPS Controller:** Player, camera, input, weapon switch, firing, HUD, ADS.
- [x] **Editor Shell:** DockView layout, Variable Panel, Weapon Data Table, Gizmo Handler, Play Mode.

### 🔶 Partial / In Progress
- [ ] **Place Actors panel:** UE5-style; spawns primitives; UI subject to change.
- [ ] **Content Browser / Content Drawer:** Import glTF; Blueprint Graph toggle; subject to change.
- [ ] **Status bar items:** Source Control, Build Project, Select All/Deselect All — stubs; subject to removal or change.
- [ ] **Blueprint Panel For Logic**

### ⌛ Pending Modules
- [ ] **Substrate:** Node Materials
- [ ] **Sonar:** Spatial Audio
- [ ] **Echo:** Narrative Dialog Logic
- [ ] **Facade:** UI Builder
- [ ] **Mantle:** Terrain System

### 📅 Planned (Feb 2026)
- [ ] **CDN version pinning** (Wed Feb 4) — Babylon.js, loaders, GUI, Inspector, Havok via jsDelivr.
- [ ] **Babylon Native fork test** (Fri–Sun Feb 6–8) — validate native build target; PC + Xbox (UWP).

---

## ⚖️ License
Basalt is developed by **IronWill Interactive Entertainment**. See `LICENSE` and `docs/IWI_PCL_BASALT.md` for terms.
