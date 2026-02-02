/**
 * Basalt ADS Component — Aim Down Sights system and defaults
 * Centralizes ADS values and helpers for head position, bullet offset, crosshair.
 * Uses per-weapon headPositions when available (rifle backup 1:1).
 */

import { getWeaponDefinition } from '../Weapons/weapon-switch-component.js';

/** ADS default values (fallback when no weapon-specific positions) */
export const ADS_DEFAULTS = {
  BASE_HEAD_POS: { x: -0.03, y: 0.04, z: -0.24 },
  ADS_HEAD_POS: { x: -0.10, y: 0.07, z: 0.1 },
  CAM_GLOBAL_OFFSET: { x: 0, y: 0, z: 0 },
  BULLET_EMITTER_OFFSET: { x: 0, y: 0, z: 0 },
  BULLET_EMITTER_ADS_OFFSET: { x: 0, y: 0, z: 0 },
  CROSSHAIR_ALPHA_ADS: 0.3,
  CROSSHAIR_ALPHA_HIP: 1.0,
  CROSSHAIR_SCALE_ADS: 0.5,
  CROSSHAIR_SCALE_HIP: 1.0,
};

/** ADS schema for config (ADS category — crosshair + head/offset defaults) */
export const ADS_SCHEMA = [
  { category: 'ADS', name: 'BASE_HEAD_POS', type: 'Vector3', value: ADS_DEFAULTS.BASE_HEAD_POS },
  { category: 'ADS', name: 'ADS_HEAD_POS', type: 'Vector3', value: ADS_DEFAULTS.ADS_HEAD_POS },
  { category: 'ADS', name: 'CAM_GLOBAL_OFFSET', type: 'Vector3', value: ADS_DEFAULTS.CAM_GLOBAL_OFFSET },
  { category: 'ADS', name: 'CAM_OFFSET_X', type: 'number', value: 0, min: -0.2, max: 0.2, step: 0.01 },
  { category: 'ADS', name: 'CAM_OFFSET_Y', type: 'number', value: 0, min: -0.2, max: 0.2, step: 0.01 },
  { category: 'ADS', name: 'BULLET_EMITTER_OFFSET', type: 'Vector3', value: ADS_DEFAULTS.BULLET_EMITTER_OFFSET },
  { category: 'ADS', name: 'BULLET_EMITTER_ADS_OFFSET', type: 'Vector3', value: ADS_DEFAULTS.BULLET_EMITTER_ADS_OFFSET },
  { category: 'ADS', name: 'CROSSHAIR_ALPHA_ADS', type: 'number', value: 0.3, min: 0, max: 1, step: 0.1 },
  { category: 'ADS', name: 'CROSSHAIR_ALPHA_HIP', type: 'number', value: 1.0, min: 0, max: 1, step: 0.1 },
  { category: 'ADS', name: 'CROSSHAIR_SCALE_ADS', type: 'number', value: 0.5, min: 0.1, max: 1, step: 0.1 },
  { category: 'ADS', name: 'CROSSHAIR_SCALE_HIP', type: 'number', value: 1.0, min: 0.5, max: 2, step: 0.1 },
];

/** Get head/camera target position based on ADS state and current weapon */
export function getHeadPosition(config, isAds, recoilPos = null, camOffset = null) {
  const slot = typeof config?.WEAPON_SLOT === 'number' ? config.WEAPON_SLOT : null;
  const def = slot != null ? getWeaponDefinition(slot, config) : null;
  const cam = def?.camera;

  const base = cam?.base ?? config?.BASE_HEAD_POS ?? ADS_DEFAULTS.BASE_HEAD_POS;
  const ads = cam?.ads ?? config?.ADS_HEAD_POS ?? ADS_DEFAULTS.ADS_HEAD_POS;
  const offset = camOffset ?? cam?.camGlobalOffset ?? config?.CAM_GLOBAL_OFFSET ?? ADS_DEFAULTS.CAM_GLOBAL_OFFSET;
  const recoil = recoilPos ?? { x: 0, y: 0, z: 0 };

  const mode = isAds ? ads : base;
  const camOffsetX = config?.CAM_OFFSET_X ?? 0;
  const camOffsetY = config?.CAM_OFFSET_Y ?? 0;
  const x = (mode.x ?? 0) + (offset.x ?? 0) + camOffsetX + (recoil.x ?? 0);
  const y = (mode.y ?? 0) + (offset.y ?? 0) + camOffsetY + (recoil.y ?? 0);
  const z = (mode.z ?? 0) + (offset.z ?? 0) + (recoil.z ?? 0);

  return typeof BABYLON !== 'undefined'
    ? new BABYLON.Vector3(x, y, z)
    : { x, y, z };
}

/** Get bullet emitter offset based on ADS state and current weapon */
export function getBulletEmitterOffset(config, isAds) {
  const slot = typeof config?.WEAPON_SLOT === 'number' ? config.WEAPON_SLOT : null;
  const def = slot != null ? getWeaponDefinition(slot, config) : null;
  const cam = def?.camera;

  const hip = cam?.bulletEmitterOffset ?? config?.BULLET_EMITTER_OFFSET ?? ADS_DEFAULTS.BULLET_EMITTER_OFFSET;
  const ads = cam?.bulletEmitterAdsOffset ?? config?.BULLET_EMITTER_ADS_OFFSET ?? ADS_DEFAULTS.BULLET_EMITTER_ADS_OFFSET;
  const o = isAds ? ads : hip;
  return typeof BABYLON !== 'undefined'
    ? new BABYLON.Vector3(o.x ?? 0, o.y ?? 0, o.z ?? 0)
    : { x: o.x ?? 0, y: o.y ?? 0, z: o.z ?? 0 };
}

/** Get crosshair style (alpha, scale) based on ADS state */
export function getCrosshairStyle(config, isAds) {
  const alphaAds = config?.CROSSHAIR_ALPHA_ADS ?? ADS_DEFAULTS.CROSSHAIR_ALPHA_ADS;
  const alphaHip = config?.CROSSHAIR_ALPHA_HIP ?? ADS_DEFAULTS.CROSSHAIR_ALPHA_HIP;
  const scaleAds = config?.CROSSHAIR_SCALE_ADS ?? ADS_DEFAULTS.CROSSHAIR_SCALE_ADS;
  const scaleHip = config?.CROSSHAIR_SCALE_HIP ?? ADS_DEFAULTS.CROSSHAIR_SCALE_HIP;

  return {
    alpha: isAds ? alphaAds : alphaHip,
    scale: isAds ? scaleAds : scaleHip,
  };
}
