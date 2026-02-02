/**
 * Basalt Scene — Scene creation, right-handed, clearColor
 */

export function createScene(engine) {
  const scene = new BABYLON.Scene(engine);
  scene.useRightHandedSystem = true;
  scene.clearColor = new BABYLON.Color4(0.4, 0.5, 0.6, 1);
  return scene;
}
