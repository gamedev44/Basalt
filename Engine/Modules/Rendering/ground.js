/**
 * Basalt Ground — Ground mesh or Mantle terrain
 * Uses simple ground when MANTLE_ENABLED=0, Mantle terrain when MANTLE_ENABLED=1
 */

import { createMantle } from '../World/mantle/mantle.js';

export function createGround(scene, config) {
  const MAP_SIZE = config.MAP_SIZE ?? 80;
  const mat1 = new BABYLON.StandardMaterial('mat0', scene);
  mat1.diffuseTexture = new BABYLON.Texture('https://i.imgur.com/HADnUQr.png', scene);
  mat1.diffuseTexture.uScale = MAP_SIZE;
  mat1.diffuseTexture.vScale = MAP_SIZE;

  const ground = BABYLON.MeshBuilder.CreateGround(
    'ground',
    { height: MAP_SIZE, width: MAP_SIZE, subdivisions: 4 },
    scene
  );
  ground.material = mat1;
  ground.checkCollisions = true;

  return ground;
}

/** Create ground or Mantle terrain based on config. Returns { ground, mantle?, spawnHeight } */
export async function createGroundOrMantle(scene, config) {
  const useMantle = (config.MANTLE_ENABLED ?? 0) !== 0;
  const PLAYER_HEIGHT = config.PLAYER_HEIGHT ?? 1.7;

  if (!useMantle) {
    const ground = createGround(scene, config);
    // Ground surface at y=0; spawn eyes at PLAYER_HEIGHT so feet are on ground
    const spawnHeight = Math.max(PLAYER_HEIGHT, 0.5);
    return { ground, mantle: null, spawnHeight };
  }

  const mantle = createMantle(scene, {
    terrain: {
      mapSize: config.MANTLE_MAP_SIZE ?? 256,
      scale: config.MANTLE_SCALE ?? 80,
      elevationScale: config.MANTLE_ELEVATION ?? 10,
      numErosionIterations: config.MANTLE_EROSION_ITER ?? 5000
    },
    painting: {},
    foliage: {},
    actors: {}
  });

  const heightmapUrl = (config.MANTLE_HEIGHTMAP_URL ?? '').trim();
  await mantle.generate({
    heightmapUrl: heightmapUrl || undefined,
    erode: (config.MANTLE_EROSION_ITER ?? 0) > 0,
    erodeIterations: config.MANTLE_EROSION_ITER ?? 5000
  });

  const ground = mantle.terrain.mesh;
  ground.name = 'ground';
  const centerHeight = mantle.terrain.getCenterHeight();
  // Ensure spawn is above terrain surface (eyes at terrain + PLAYER_HEIGHT)
  const spawnHeight = Math.max(centerHeight + PLAYER_HEIGHT, centerHeight + 0.5);

  return { ground, mantle, spawnHeight };
}
