# 🪨 BASALT ENGINE
> "Forged in Blender. Hardened in Basalt."

Basalt is a high-performance, web-based game engine built on top of **Babylon.js**. It is architected to rival the workflow and visceral "feel" of Source 1 (Hammer) while utilizing modern, mesh-based editing and the high-fidelity power of WebGPU.

The **IronWill Pipeline** serves as the primary bridge, transforming Blender into a professional-grade map editor, entity manager, and logic sequencer, eliminating the need for fragmented third-party tools.

---

## 📍 Table of Contents
* [🏗️ Core Architecture](#️-core-architecture-the-basalt-stack)
* [🔄 The IronWill Workflow](#-the-ironwill-workflow)
* [📜 The IronWill Contract](#-the-ironwill-contract-schema)
* [🛠️ World Generation Tools](#️-world-generation-tools)
* [🚀 Getting Started](#-getting-started)
* [📈 Development Status](#-development-status)
* [⚖️ License](#️-license)

---

## 🏗️ Core Architecture (The Basalt Stack)
Basalt is composed of several specialized modules that handle everything from physics to narrative logic.

| Component | Name | Technology | Description |
| :--- | :--- | :--- | :--- |
| **Core Runtime** | Basalt | Babylon.js | The engine loop, renderer, and state manager. |
| **Pipeline** | Iron | Python/JS | The automated export, bake, and sync bridge. |
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

### ✅ Completed Modules
- [x] **Renderer Core:** High-fidelity WebGPU implementation via Babylon.js.
- [x] **Live Editor Viewport:** Real-time synchronization bridge.
- [x] **Inspector System:** Full N-Panel integration for entity metadata tagging.
- [x] **Havok Physics Integration**

### ⌛ Pending Modules
- [ ] **Substrate:** Node Materials
- [ ] **Sonar:** Spatial Audio
- [ ] **Echo:** Narrative Dialog Logic
- [ ] **Facade:** UI Builder
- [ ] **Mantle:** Terrain System

---

## ⚖️ License
Basalt is developed by **Iron Will Interactive Entertainment, LLC**. See `LICENSE` for more information.
