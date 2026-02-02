# Mantle Module Reference

Terrain generator, heightmap import, painting, foliage layers (up to 20), and actor scatter.

---

## Overview

| Component | Description |
|-----------|-------------|
| **TerrainGenerator** | Procedural simplex noise + hydraulic erosion (C90R62) |
| **HeightMapGenerator** | Multi-octave simplex noise (CPU) |
| **Heightmap Import** | From image URL or Float32Array |
| **TerrainPainter** | Brush-based raise/lower/flatten/smooth |
| **FoliageLayerManager** | Up to 20 layers or group layers |
| **ActorScatterManager** | Scatter any mesh on terrain surface |

---

## TerrainGenerator

```js
import { TerrainGenerator } from './World/mantle/terrain-generator.js';

const terrain = new TerrainGenerator(scene, {
  mapSize: 256,
  scale: 80,
  elevationScale: 10,
  numErosionIterations: 20000,
  seed: 12345
});

terrain.generateHeightMap();
terrain.erode(20000);
terrain.constructMesh();
```

### Heightmap Import

```js
// From image URL (grayscale = height)
await terrain.importHeightMapFromImage('https://example.com/heightmap.png');

// From Float32Array (mapSize * mapSize)
terrain.importHeightMapFromArray(float32Array);
```

---

## TerrainPainter

```js
import { TerrainPainter } from './World/mantle/terrain-painting.js';

const painter = new TerrainPainter(terrain, {
  brushRadius: 5,
  brushStrength: 0.1,
  mode: 'raise'  // 'raise' | 'lower' | 'flatten' | 'smooth'
});

// Paint at world position (e.g. from raycast hit)
painter.paintAt(worldX, worldZ, delta);
painter.rebuildMesh();  // After painting
```

---

## Foliage Layers (up to 20)

```js
import { FoliageLayer, FoliageGroupLayer, FoliageLayerManager } from './World/mantle/foliage-layers.js';

const foliage = new FoliageLayerManager(terrain, scene);

const grassLayer = new FoliageLayer({
  name: 'Grass',
  density: 0.02,
  meshUrl: 'https://assets.babylonjs.com/meshes/grass.glb',
  heightMin: 0, heightMax: 0.5,
  slopeMin: 0, slopeMax: 0.3
});
grassLayer.setSeed(42);
foliage.addLayer(grassLayer);

const treeGroup = new FoliageGroupLayer({ name: 'Trees' });
treeGroup.addLayer(new FoliageLayer({ name: 'Oak', meshUrl: '...', density: 0.001 }));
treeGroup.addLayer(new FoliageLayer({ name: 'Pine', meshUrl: '...', density: 0.0005 }));
foliage.addLayer(treeGroup);

await foliage.scatterAll();
```

---

## Actor Scatter

```js
import { ActorScatterLayer, ActorScatterManager } from './World/mantle/actor-scatter.js';

const actors = new ActorScatterManager(terrain, scene);

const rockLayer = new ActorScatterLayer({
  name: 'Rocks',
  meshUrl: 'https://assets.babylonjs.com/meshes/rock.glb',
  density: 0.005,
  minScale: 0.5, maxScale: 1.5
});
actors.addLayer(rockLayer);

await actors.scatterAll();

// Single placement
actors.scatterAt(x, z, meshOrUrl, { scale: 1, rotationY: 0 });
```

---

## Unified API (createMantle)

```js
import { createMantle } from './World/mantle/mantle.js';

const mantle = createMantle(scene, {
  terrain: { mapSize: 256, scale: 80, elevationScale: 10 },
  painting: {},
  foliage: {},
  actors: {}
});

await mantle.generate({
  heightmapUrl: 'https://...',  // optional
  erode: true,
  erodeIterations: 20000
});

// mantle.terrain, mantle.painter, mantle.foliage, mantle.actors
```

---

## Config Variables (MANTLE category)

| Name | Type | Default |
|-----|------|---------|
| MANTLE_ENABLED | number | 1 |
| MANTLE_MAP_SIZE | number | 256 |
| MANTLE_SCALE | number | 80 |
| MANTLE_ELEVATION | number | 10 |
| MANTLE_EROSION_ITER | number | 20000 |
| MANTLE_HEIGHTMAP_URL | string | '' |

Set `MANTLE_ENABLED` to 0 for simple flat ground.
