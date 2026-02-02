/**
 * Basalt Player — TransformNode, head anchor, box targets
 */

export function createPlayer(scene, config, spawnHeight) {
  const PLAYER_HEIGHT = config.PLAYER_HEIGHT ?? 1.7;
  const MAP_SIZE = config.MAP_SIZE ?? 80;
  const y = spawnHeight ?? PLAYER_HEIGHT;

  const head = BABYLON.MeshBuilder.CreateSphere('headAnchor', { diameter: 0.05 }, scene, true);
  head.material = new BABYLON.StandardMaterial('headMat', scene);
  head.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
  head.isVisible = false;

  const box = BABYLON.MeshBuilder.CreateBox('targetBox', { size: 1 }, scene);
  box.isVisible = false;
  for (let index = 0; index < MAP_SIZE / 2; index++) {
    const newInstance = box.createInstance('targetInstance_' + index);
    newInstance.position = new BABYLON.Vector3(
      Math.floor(Math.random() * MAP_SIZE) - MAP_SIZE / 2,
      0.5,
      Math.floor(Math.random() * MAP_SIZE) - MAP_SIZE / 2
    );
  }

  const player = new BABYLON.TransformNode('playerRoot', scene);
  player.position = new BABYLON.Vector3(0, y, 0);

  return { player, head, box };
}
