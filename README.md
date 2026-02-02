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

**Basalt** is the modern web engine — high-fidelity WebGPU+Havok, Hammer-style workflow, Built for developers who want desktop-class rendering in the browser without the bloat.

The **IronWill Pipeline** Aims to Make The Path Between Blender and Game Engines Super Easy to Cross With little to No Bloat and Very Little if Any Overhead.
Its Ultimate Goal is to bring The Power and Main Modern Features From Other Game Engines into Its Editor Tools making the Best Of All Worlds Engine that Utilized Ideas From Existing Systems And Builds Upon them Sufficiently.

---
## Why Basalt? Why Not Babylon Editor?

While we utilize **Babylon.js** for its world-class rendering and physics, **Basalt** was engineered as a specialized editor to bridge the gap between web tech and AAA game development workflows.

### Feature Comparison

| Feature | Basalt Editor | Babylon Editor |
| :--- | :--- | :--- |
| **UI Architecture** | **Modular Dockview System.** UE5 Slate-inspired layout. Fully customizable, dockable panels for a professional engine feel. | Fixed/Standard web layout. Less flexibility for complex multi-monitor game dev setups. |
| **Build Pipeline** | **Zero Rebuilds.** Add features, scripts, or UI elements with instant hot-reloading. **No compilation wait times.** | Often requires a full rebuild/compile cycle when extending the editor or adding core features. |
| **Workflow** | **Blender-Centric.** Designed to complement Blender. Model, entity-tag, and bake in one tool without context switching. | General-purpose. Requires more manual importing/exporting and scene setup. |
| **Templates & Logic** | **Ready-to-Play.** Built-in Advanced FPS templates (COD-style crosshairs, weapon switching, dynamic UI), and GPU/CPU shader examples (Water, etc). | Basic scene starters only. No complex, out-of-the-box game logic templates. |
| **Interface Tools** | **Deep Engine Interfacing.** Custom "Thermo-Meters" for optimization, weapon Data-tables, and Enumeration Systems. | Generic 3D tools. Lacks specialized game-logic interfaces like our recoil tables and FPS systems. |
| **Documentation** | **Condensed & Direct.** Layman-friendly docs that get straight to the point. No sifting through fluff. | Extensive but often overwhelming. Requires significant "sifting" to find practical game-dev answers. |
| **UX Heritage** | **"Hammer" & UE5 Feel.** Familiar workflow for Valve/Source and Unreal devs. Includes native PIE (Play In Editor). | Standard 3D software UX. Focused on general scene composition rather than "Game Feel." |
| **Deployment** | **Static & Native.** Runs as static HTML/JS anywhere (GitHub Pages) + upcoming Native desktop fork. | Primarily a desktop-focused application for local development. |

---

### Key Technical Advantages

#### 🏗️ Modular "Slate-Style" UI
By utilizing **Dockview**, Basalt mirrors the high-end modularity of **Unreal Engine 5’s Slate system**. This allows developers to tear off, pin, and stack panels according to their specific task—whether that is weapon tuning, level lighting, or performance profiling. It’s a modern engine layout for modern devs.

#### ⚡ No-Compile Development (Zero Build Step)
One of the biggest bottlenecks in engine development is the "Wait for Build" screen. Basalt eliminates this. You can add features, tweak UI, or update scripts and see the changes **instantly**. While other editors force you to rebuild the entire project to see a new tool in action, Basalt stays lightweight and live.

#### 📦 Already Built-in Templates & even a planned Shader Example and Game Systems Example's Library
Stop starting from scratch. Basalt includes a growing library of production-ready assets:
* **Advanced FPS Template:** Features weapon switching, dynamic UI systems, and Call of Duty style crosshairs.
* **Shader Examples:** Instant-import GPU-accelerated water, custom CPU shaders, and high-end visual effects.
* **Starter Scenes:** From "Empty Basic" to full blockout environments planned soon to come!.

#### 🔗 Deep Engine Interfacing
Basalt isn't just a scene viewer; it’s a direct window into your game's soul. It is built specifically to talk to our custom logic:
* **Real-time Optimization:** Visual "Thermo-Meters" for instant feedback on draw calls and mesh density.
* **Entity Schema:** Directly edit **IronWill** data structures and weapon recoil tables within the UI.
* **Blender Pipeline:** Basalt acts as the interactive bridge that makes Blender a real-time game creation tool.

#### 📖 Documentation for Humans
We hate sifting through 100-page manuals as much as you do. Our documentation is **condensed and layman-friendly**. We focus on the points that actually matter to get your game running, skipping the fluff so you can spend more time creating and less time reading.

> **The Verdict:** Basalt is a **AAA game-engine environment** focused on high-performance workflows (FPS templates, complex schemas, and Blender-heavy pipelines). There is so much more packed under the hood that we can't even list it all here—it simply must be experienced.

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
