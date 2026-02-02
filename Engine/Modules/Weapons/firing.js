/**
 * Basalt Firing — Raycast, tracer, recoil (uses config)
 */

import { getBulletEmitterOffset } from '../Player/ads.js';
import { getFireRate, getRecoilParams, getTracerSettings, getRayLength } from './weapon-component.js';

export function createFiring(scene, input, config, getGround) {
  let bulletCount = 0;
  const currentRecoilPos = new BABYLON.Vector3(0, 0, 0);

  const run = (scene, getHead, getCameraNode) => {
    const deltaTime = scene.getEngine().getDeltaTime();
    const now = Date.now();
    const ground = getGround();
    const fpsCamera = scene.activeCamera;

    const fireRate = getFireRate(config);
    const recoil = getRecoilParams(config);
    const tracerSettings = getTracerSettings(config);
    const rayLength = getRayLength(config);

    if (input.isFiring && now - (input._lastFireTime ?? 0) > fireRate) {
      input._lastFireTime = now;
      bulletCount++;

      const ray = fpsCamera.getForwardRay(rayLength);
      const pickInfo = scene.pickWithRay(ray, (mesh) => mesh !== ground && mesh.isPickable);
      const targetPoint = pickInfo.hit ? pickInfo.pickedPoint : ray.origin.add(ray.direction.scale(rayLength));
      const offsetVec = getBulletEmitterOffset(config, input.isAds);
      const bulletOrigin = BABYLON.Vector3.TransformCoordinates(offsetVec, fpsCamera.getWorldMatrix());

      const dir = targetPoint.subtract(bulletOrigin).normalize().scale(tracerSettings.length);
      const tracerMesh = BABYLON.MeshBuilder.CreateLines('tracer', {
        points: [bulletOrigin, bulletOrigin.add(dir)],
      }, scene);
      tracerMesh.color = tracerSettings.color;
      setTimeout(() => tracerMesh.dispose(), 50);

      currentRecoilPos.x += (Math.random() - 0.5) * recoil.side;
      currentRecoilPos.y += recoil.up;
      currentRecoilPos.z -= recoil.back;
    }

    const lerped = BABYLON.Vector3.Lerp(currentRecoilPos, BABYLON.Vector3.Zero(), recoil.recovery * (deltaTime / 16));
    currentRecoilPos.x = lerped.x;
    currentRecoilPos.y = lerped.y;
    currentRecoilPos.z = lerped.z;
  };

  return {
    run,
    get bulletCount() { return bulletCount; },
    get currentRecoilPos() { return currentRecoilPos; },
  };
}
