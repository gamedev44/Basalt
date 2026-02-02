/**
 * Basalt Camera — UniversalCamera, pointer lock, mouse look
 */

export function createCamera(scene, canvas, player, config) {
  const fpsCamera = new BABYLON.UniversalCamera(
    'FPS_Camera',
    new BABYLON.Vector3(0, 0, 0),
    scene
  );
  fpsCamera.parent = player;
  scene.activeCamera = fpsCamera;
  fpsCamera.minZ = 0.0001;

  const MOUSE_SENSITIVITY = config.MOUSE_SENSITIVITY ?? 0.0002;

  const mouseMove = (e) => {
    const deltaTime = scene.getEngine().getDeltaTime();
    const movementX = e.movementX || 0;
    const movementY = e.movementY || 0;
    if (player) {
      player.rotation.x += movementY * deltaTime * MOUSE_SENSITIVITY;
      player.rotation.y -= movementX * deltaTime * MOUSE_SENSITIVITY;
      player.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, player.rotation.x));
    }
  };

  const changeCallback = () => {
    if (document.pointerLockElement === canvas) {
      document.addEventListener('mousemove', mouseMove, false);
    } else {
      document.removeEventListener('mousemove', mouseMove, false);
    }
  };
  document.addEventListener('pointerlockchange', changeCallback, false);

  const requestPointerLock = () => {
    if (!scene.debugLayer.isVisible()) {
      canvas.requestPointerLock();
    }
  };

  return {
    camera: fpsCamera,
    requestPointerLock,
    dispose() {
      document.removeEventListener('pointerlockchange', changeCallback, false);
      document.removeEventListener('mousemove', mouseMove, false);
    },
  };
}
