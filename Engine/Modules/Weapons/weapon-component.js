/**
 * Basalt Weapon Component — Weapon system defaults and helpers
 * Centralizes weapon URL, fire rate, recoil, tracer settings.
 */

import { getWeaponDefinition } from './weapon-switch-component.js';

/** Weapon default values (your original defaults) */
export const WEAPON_DEFAULTS = {
  WEAPON_URL: 'https://dl.dropbox.com/s/wbia4zetn1bdeze/',
  WEAPON_FILE: 'arms_assault_rifle_02.glb',
  HIDE_LIST: ['knife', 'assault_rifle_02_iron_sights', 'bullet', 'scope_01', 'scope_02', 'scope_03', 'silencer'],
  FIRE_RATE: 100,
  RECOIL_STRENGTH_UP: -0.01,
  RECOIL_STRENGTH_BACK: -0.04,
  RECOIL_STRENGTH_SIDE: 0,
  RECOIL_RECOVERY: 0.15,
  TRACER_LENGTH: 0.5,
  TRACER_COLOR: { r: 1, g: 0.8, b: 0.2 },
  RAY_LENGTH: 100,
};

/** Weapon schema for config (WEAPONS category) */
export const WEAPON_SCHEMA = [
  { category: 'WEAPONS', name: 'WEAPON_URL', type: 'string', value: WEAPON_DEFAULTS.WEAPON_URL },
  { category: 'WEAPONS', name: 'WEAPON_FILE', type: 'string', value: WEAPON_DEFAULTS.WEAPON_FILE },
  { category: 'WEAPONS', name: 'FIRE_RATE', type: 'number', value: 100, min: 10, max: 1000, step: 10 },
  { category: 'WEAPONS', name: 'RECOIL_STRENGTH_UP', type: 'number', value: -0.01, min: -0.1, max: 0, step: 0.001 },
  { category: 'WEAPONS', name: 'RECOIL_STRENGTH_BACK', type: 'number', value: -0.04, min: -0.2, max: 0, step: 0.01 },
  { category: 'WEAPONS', name: 'RECOIL_STRENGTH_SIDE', type: 'number', value: 0, min: -0.05, max: 0.05, step: 0.001 },
  { category: 'WEAPONS', name: 'RECOIL_RECOVERY', type: 'number', value: 0.15, min: 0.01, max: 1, step: 0.01 },
  { category: 'WEAPONS', name: 'TRACER_LENGTH', type: 'number', value: 0.5, min: 0.1, max: 2, step: 0.1 },
  { category: 'WEAPONS', name: 'RAY_LENGTH', type: 'number', value: 100, min: 10, max: 500, step: 10 },
];

/** Get fire rate (ms between shots) */
export function getFireRate(config) {
  return config?.FIRE_RATE ?? WEAPON_DEFAULTS.FIRE_RATE;
}

/** Get recoil params */
export function getRecoilParams(config) {
  return {
    up: config?.RECOIL_STRENGTH_UP ?? WEAPON_DEFAULTS.RECOIL_STRENGTH_UP,
    back: config?.RECOIL_STRENGTH_BACK ?? WEAPON_DEFAULTS.RECOIL_STRENGTH_BACK,
    side: config?.RECOIL_STRENGTH_SIDE ?? WEAPON_DEFAULTS.RECOIL_STRENGTH_SIDE,
    recovery: config?.RECOIL_RECOVERY ?? WEAPON_DEFAULTS.RECOIL_RECOVERY,
  };
}

/** Get weapon load options (url, file, hideList) — uses weapon-switch slot if available */
export function getWeaponLoadOptions(config) {
  let url = config?.WEAPON_URL ?? WEAPON_DEFAULTS.WEAPON_URL;
  let file = config?.WEAPON_FILE ?? WEAPON_DEFAULTS.WEAPON_FILE;
  let hideList = config?.WEAPON_HIDE_LIST ?? WEAPON_DEFAULTS.HIDE_LIST;

  if (typeof config?.WEAPON_SLOT === 'number') {
    const def = getWeaponDefinition(config.WEAPON_SLOT, config);
    if (def) {
      url = def.url;
      file = def.file;
      hideList = def.hideList ?? hideList;
    }
  }
  return { url, file, hideList };
}

/** Get tracer settings */
export function getTracerSettings(config) {
  const len = config?.TRACER_LENGTH ?? WEAPON_DEFAULTS.TRACER_LENGTH;
  const c = WEAPON_DEFAULTS.TRACER_COLOR;
  return {
    length: len,
    color: typeof BABYLON !== 'undefined'
      ? new BABYLON.Color3(c.r, c.g, c.b)
      : c,
  };
}

/** Get ray length for firing */
export function getRayLength(config) {
  return config?.RAY_LENGTH ?? WEAPON_DEFAULTS.RAY_LENGTH;
}
