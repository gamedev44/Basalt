/**
 * Mantle — Terrain, Painting, Foliage, Actor Scatter
 * Unified API for Basalt World module
 */

import { TerrainGenerator, HeightMapGenerator } from './terrain-generator.js';
import { TerrainPainter } from './terrain-painting.js';
import { FoliageLayer, FoliageGroupLayer, FoliageLayerManager } from './foliage-layers.js';
import { ActorScatterLayer, ActorScatterManager } from './actor-scatter.js';

export { TerrainGenerator, HeightMapGenerator } from './terrain-generator.js';
export { TerrainPainter } from './terrain-painting.js';
export { FoliageLayer, FoliageGroupLayer, FoliageLayerManager } from './foliage-layers.js';
export { ActorScatterLayer, ActorScatterManager } from './actor-scatter.js';

/** Create Mantle terrain system with optional painting, foliage, actor scatter */
export function createMantle(scene, options = {}) {
  const terrain = new TerrainGenerator(scene, options.terrain ?? {});
  const painter = options.painting !== false ? new TerrainPainter(terrain, options.painting ?? {}) : null;
  const foliage = options.foliage !== false ? new FoliageLayerManager(terrain, scene, options.foliage ?? {}) : null;
  const actors = options.actors !== false ? new ActorScatterManager(terrain, scene, options.actors ?? {}) : null;

  return {
    terrain,
    painter,
    foliage,
    actors,
    async generate(options = {}) {
      if (options.heightmapUrl) {
        await terrain.importHeightMapFromImage(options.heightmapUrl);
      } else if (options.heightmapArray) {
        terrain.importHeightMapFromArray(options.heightmapArray);
      } else {
        terrain.generateHeightMap();
      }
      if (options.erode !== false && (options.erodeIterations ?? terrain.numErosionIterations) > 0) {
        terrain.erode(options.erodeIterations);
      }
      await terrain.constructMesh(options.mesh ?? {});
      if (foliage) await foliage.scatterAll();
      if (actors) await actors.scatterAll();
      return terrain.mesh;
    },
    dispose() {
      terrain.dispose();
      foliage?.dispose();
      actors?.dispose();
    }
  };
}
