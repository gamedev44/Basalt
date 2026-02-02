/**
 * Basalt Weapon Loader — GLB load, parent to player, apply attachments
 * Supports weapon switch (rifle/pistol) via weapon-switch component.
 */

import { getWeaponLoadOptions } from './weapon-component.js';
import { applyAttachments } from './attachment-component.js';
import { getWeaponDefinition } from './weapon-switch-component.js';

export async function loadWeapon(scene, player, head, onLoaded, config = null) {
  const { url, file, hideList } = getWeaponLoadOptions(config);
  const def = config && typeof config.WEAPON_SLOT === 'number' ? getWeaponDefinition(config.WEAPON_SLOT, config) : null;

  try {
    const result = await BABYLON.SceneLoader.ImportMeshAsync('', url, file, scene);
    const newMeshes = result?.meshes;
    if (!newMeshes?.length) {
      if (onLoaded) onLoaded(null);
      return null;
    }
    const weaponRoot = newMeshes[0];
    weaponRoot.parent = player;

    const cameraNode = scene.getNodeByName('camera');
    if (cameraNode && head) head.parent = cameraNode;

    hideList?.forEach((name) => {
      const m = scene.getMeshByName(name) || scene.getNodeByName(name);
      if (m) m.setEnabled(false);
    });

    if (def?.hasAttachments) applyAttachments(scene, config);

    const animGroups = result?.animationGroups ?? [];
    const idle = animGroups.find((ag) => ag.name === 'idle') ?? scene.getAnimationGroupByName('idle');
    const walk = def?.anims?.includes('walk')
      ? (animGroups.find((ag) => ag.name === 'walk') ?? scene.getAnimationGroupByName('walk'))
      : null;
    if (idle) idle.start(true);

    const data = { weaponRoot, cameraNode, idle, walk };
    if (onLoaded) onLoaded(data);
    return data;
  } catch (e) {
    console.warn('[weapon-loader] load error:', e);
    if (onLoaded) onLoaded(null);
    return null;
  }
}

let _loadId = 0;

/** Stop previous animations (safe — no dispose to avoid conflicts with mesh disposal) */
function stopWeaponAnimations(prevIdle, prevWalk) {
  try {
    if (prevIdle?.stop) prevIdle.stop();
    if (prevWalk?.stop) prevWalk.stop();
  } catch (_) { /* ignore */ }
}

/** Load weapon by slot — stops prev anims, disposes previous root, loads new. Returns promise. */
export function loadWeaponBySlot(scene, player, head, config, currentWeaponRoot, onLoaded, fpsCamera = null, prevIdle = null, prevWalk = null) {
  const loadId = ++_loadId;
  stopWeaponAnimations(prevIdle, prevWalk);
  try {
    if (currentWeaponRoot?.dispose) currentWeaponRoot.dispose();
  } catch (_) { /* ignore */ }
  return loadWeapon(scene, player, head, (data) => {
    if (loadId !== _loadId) return;
    onLoaded?.(data);
  }, config, fpsCamera);
}
