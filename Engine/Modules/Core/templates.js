/**
 * Basalt Template Loader — Pre-built scene templates (FPS, Empty)
 * Select via config.SCENE_TEMPLATE. Templates use the variables system.
 */

export const SCENE_TEMPLATE = {
  FPS: 'fps',
  EMPTY: 'empty',
};

/** Default template when none stored — Advanced FPS. Change here to change global default. */
export const DEFAULT_TEMPLATE = SCENE_TEMPLATE.FPS;

/** Template metadata for UI / selection */
export const TEMPLATE_INFO = {
  [SCENE_TEMPLATE.FPS]: {
    name: 'Advanced FPS',
    description: 'First-person shooter with weapon, movement, ADS, terrain',
  },
  [SCENE_TEMPLATE.EMPTY]: {
    name: 'Empty Scene',
    description: 'Z-up coordinate system, FreeCamera, ground on XY, sphere',
  },
};

/** Empty scene — Z-up, Y-forward, ground on XY plane */
export function createEmptyTemplate(engine, canvas, config, m) {
  const scene = new BABYLON.Scene(engine);
  scene.useRightHandedSystem = true;

  const width = config.EMPTY_SCENE_WIDTH ?? 256;
  const length = config.EMPTY_SCENE_LENGTH ?? 256;

  const camera = new BABYLON.FreeCamera(
    'camera1',
    new BABYLON.Vector3(0, -10, 5),
    scene
  );
  camera.upVector = new BABYLON.Vector3(0, 0, 1);
  camera.setTarget(BABYLON.Vector3.Zero());
  camera.attachControl(canvas, true);
  scene.activeCamera = camera;

  const light = new BABYLON.HemisphericLight(
    'light',
    new BABYLON.Vector3(0, 0, 1),
    scene
  );
  light.intensity = 0.7;

  const ground = BABYLON.MeshBuilder.CreateGround(
    'ground',
    { width, height: length },
    scene
  );
  ground.rotation.x = -Math.PI / 2;

  const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 2 }, scene);
  sphere.position.z = 1;

  return { scene, ground, camera };
}

/** Get active template id from config */
export function getActiveTemplate(config) {
  const v = config?.SCENE_TEMPLATE ?? SCENE_TEMPLATE.FPS;
  return v === SCENE_TEMPLATE.EMPTY ? SCENE_TEMPLATE.EMPTY : SCENE_TEMPLATE.FPS;
}
