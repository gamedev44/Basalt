# Mantle Terrain — C90R62 Playground Reference

**Source:** [https://playground.babylonjs.com/?webgpu#C90R62#21](https://playground.babylonjs.com/?webgpu#C90R62#21)

Notes from the Mantle terrain Playground — ported for the Basalt Mantle module.

---

## Overview

- **TerrainGenerator** — Procedural terrain with simplex noise height map + hydraulic erosion
- **HeightMapGenerator** — Multi-octave simplex noise (GPU compute or CPU fallback)
- **WebGPU** — Compute shaders for height map and erosion (when `engine.getCaps().supportComputeShaders`)
- **NME** — Terrain material from snippet `4W2QH3#4` (NodeMaterial.ParseFromSnippetAsync)
- **GUI** — dat.GUI for erosion, terrain gen, shadows, GPU toggle

---

## Classes

### TerrainGenerator

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mapSize` | number | 512 | Resolution (128, 256, 512, 1024) |
| `scale` | number | 20 | World scale |
| `elevationScale` | number | 10 | Height multiplier |
| `useGPU` | boolean | true | Use compute shaders (requires WebGPU) |
| `numErosionIterations` | number | 100000 | Erosion sim iterations (500k GPU, 80k CPU) |
| `sedimentCapacityFactor` | number | 3 | Carry capacity |
| `evaporateSpeed` | number | 0.01 | Water evaporation |
| `inertia` | number | 0.1 | Droplet direction inertia |
| `erosionRadius` | number | 3 | Erosion brush radius (2–8) |
| `depositSpeed` | number | 0.3 | Sediment deposit rate |
| `erodeSpeed` | number | 0.3 | Erosion rate |
| `gravity` | number | 4 | Droplet gravity |
| `maxLifetime` | number | 30 | Max droplet steps |

**Methods:**
- `generateHeightMap()` — Builds height map (GPU or CPU)
- `erode(numIterations)` — Runs erosion sim
- `contructMesh()` — Builds mesh from height map, applies material, shadows

### HeightMapGenerator

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `numOctaves` | number | 7 | Noise octaves |
| `persistence` | number | 0.4 | Octave falloff |
| `lacunarity` | number | 2 | Octave frequency |
| `initialScale` | number | 2 | Noise scale |

**Methods:**
- `generateHeightMap(mapSize)` — GPU path (ComputeShader)
- `generateHeightMapCPU(mapSize)` — CPU fallback (simplex noise)

---

## Dependencies

- **mulberry32** — Seeded PRNG for reproducible terrain (`seedTerrainGenerator`)
- **dat.GUI** — Parameter tweaking (erosion, terrain, shadows)
- **NME snippet** — `4W2QH3#4` (terrain material with MaxHeight block)
- **BABYLON.ComputeShader** — WebGPU compute (height map + erosion)
- **BABYLON.StorageBuffer** — GPU buffers for height map, brush, random indices
- **BABYLON.UniformBuffer** — Params for compute shaders

---

## Compute Shaders

### heightMapComputeSource

- Simplex noise (webgl-noise / Ashima Arts)
- Multi-octave, lacunarity, persistence
- Output: normalized height map

### erosionComputeSource

- Droplet-based hydraulic erosion
- Bilinear interpolation for height/gradient
- Brush-weighted erosion/deposit
- Workgroup size: 64

---

## Basalt Mantle Notes

1. **Port as module** — `mantle-terrain.js` or `mantle/terrain-generator.js`
2. **Variable inspector** — Expose erosion + terrain params in Basalt variable panel
3. **NME material** — Load snippet or bundle custom terrain material
4. **Havok** — Generate heightmap collider from `TerrainGenerator.map` after erosion
5. **Blender** — Future: export sculpt/Geometry Nodes as Mantle params or height map
6. **LOD** — Add LOD levels for large terrains (not in playground)

---

## Quick Reference

| Item | Value |
|------|-------|
| Playground | https://playground.babylonjs.com/?webgpu#C90R62#21 |
| NME Snippet | `4W2QH3#4` |
| WebGPU | Required for GPU erosion (Chrome/Edge) |
| Resolutions | 128, 256, 512, 1024 |
