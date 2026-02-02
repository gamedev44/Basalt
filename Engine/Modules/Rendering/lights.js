/**
 * Basalt Lights — HemisphericLight, DirectionalLight factory; add/remove
 */

export function createDefaultLights(scene) {
  const lights = [];
  const hemispheric = new BABYLON.HemisphericLight(
    'light',
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  hemispheric.intensity = 0.7;
  lights.push(hemispheric);

  return {
    lights,
    addLight(type, options = {}) {
      let light;
      if (type === 'point') {
        light = new BABYLON.PointLight(
          options.name || 'pointLight',
          options.position || BABYLON.Vector3.Zero(),
          scene
        );
      } else if (type === 'spot') {
        light = new BABYLON.SpotLight(
          options.name || 'spotLight',
          options.position || BABYLON.Vector3.Zero(),
          options.direction || new BABYLON.Vector3(0, -1, 0),
          options.angle || Math.PI / 4,
          options.exponent || 2,
          scene
        );
      } else if (type === 'directional') {
        light = new BABYLON.DirectionalLight(
          options.name || 'dirLight',
          options.direction || new BABYLON.Vector3(0, -1, 0),
          scene
        );
        if (options.position) light.position = options.position;
      } else {
        light = new BABYLON.HemisphericLight(
          options.name || 'hemiLight',
          options.direction || new BABYLON.Vector3(0, 1, 0),
          scene
        );
      }
      if (options.intensity != null) light.intensity = options.intensity;
      lights.push(light);
      return light;
    },
    removeLight(light) {
      const idx = lights.indexOf(light);
      if (idx >= 0) lights.splice(idx, 1);
      light.dispose();
    },
  };
}
