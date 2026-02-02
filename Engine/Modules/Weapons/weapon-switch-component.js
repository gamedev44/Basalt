/**
 * Basalt Weapon Switch — Switch between weapons (rifle, pistol) via enum key.
 * Single arms rig: rifle arms (arms_assault_rifle_02.glb) are canonical — all anims (idle, walk) play on them.
 * Per-weapon camera only when a weapon needs different arms (e.g. rocket launcher).
 */

/** Weapon slot enum */
export const WEAPON_SLOT = {
  RIFLE: 0,
  PISTOL: 1,
};

/** Canonical arms rig — rifle GLB has idle + walk; all weapons use this single set of arms. */
export const ARMS_RIG = {
  url: 'https://dl.dropbox.com/s/wbia4zetn1bdeze/',
  file: 'arms_assault_rifle_02.glb',
  anims: ['idle', 'walk'],
};

/**
 * Shared arms camera — Both rifle and pistol use the same arms rig.
 * One set of camera/ADS values for all weapons that share arms.
 * Override with per-weapon camera only when a weapon needs different arms (e.g. rocket launcher).
 */
export const SHARED_ARMS_CAMERA = {
  base: { x: -0.03, y: 0.04, z: -0.24 },
  ads: { x: -0.10, y: 0.07, z: 0.1 },
  camGlobalOffset: { x: 0, y: 0, z: 0 },
  bulletEmitterOffset: { x: 0, y: 0, z: 0 },
  bulletEmitterAdsOffset: { x: 0, y: 0, z: 0 },
};

/** Rifle-specific camera — moved left and up from shoulder (see SHOULDER_CAM_REFERENCE.md) */
const RIFLE_CAMERA = {
  base: { x: 0.02, y: 0.07, z: -0.24 },
  ads: { x: -0.05, y: 0.09, z: 0.1 },
  camGlobalOffset: { x: 0, y: 0, z: 0 },
  bulletEmitterOffset: { x: 0, y: 0, z: 0 },
  bulletEmitterAdsOffset: { x: 0, y: 0, z: 0 },
};

/** Weapon definitions — uses ARMS_RIG for arms; weaponMesh/hideList per weapon. camera per weapon. */
export const WEAPON_DEFINITIONS = {
  [WEAPON_SLOT.RIFLE]: {
    id: WEAPON_SLOT.RIFLE,
    name: 'Assault Rifle',
    url: ARMS_RIG.url,
    file: ARMS_RIG.file,
    hideList: ['knife', 'assault_rifle_02_iron_sights', 'bullet', 'scope_01', 'scope_02', 'scope_03', 'silencer'],
    anims: ARMS_RIG.anims,
    hasAttachments: true,
    camera: RIFLE_CAMERA,
  },
  [WEAPON_SLOT.PISTOL]: {
    id: WEAPON_SLOT.PISTOL,
    name: 'Handgun',
    url: 'https://dl.dropbox.com/s/axejnxioiwq155l/',
    file: 'arms_handgun_01.glb',
    hideList: ['knife', 'scope_02', 'scope_03', 'silencer'],
    anims: ['idle', 'walk'],
    hasAttachments: false,
    camera: SHARED_ARMS_CAMERA,
  },
};

/** Default values */
export const WEAPON_SWITCH_DEFAULTS = {
  WEAPON_SLOT: WEAPON_SLOT.RIFLE,
  WEAPON_SWITCH_KEY: 49,  // 1
  WEAPON_SWITCH_KEY_2: 50, // 2
};

/** Config schema — WEAPON_SLOT in COMPONENTS; key bindings in WEAPONS */
export const WEAPON_SWITCH_SCHEMA = [
  { category: 'COMPONENTS', name: 'WEAPON_SLOT', type: 'number', value: WEAPON_SLOT.RIFLE, min: 0, max: 1, step: 1 },
  { category: 'WEAPONS', name: 'WEAPON_SWITCH_KEY', type: 'number', value: 49, min: 0, max: 255, step: 1 },
  { category: 'WEAPONS', name: 'WEAPON_SWITCH_KEY_2', type: 'number', value: 50, min: 0, max: 255, step: 1 },
  { category: 'WEAPONS', name: 'WEAPON_WHEEL_KEY', type: 'number', value: 9, min: 0, max: 255, step: 1 },
];

/** Get current weapon slot from config */
export function getWeaponSlot(config) {
  const v = config?.WEAPON_SLOT ?? WEAPON_SWITCH_DEFAULTS.WEAPON_SLOT;
  return Math.max(0, Math.min(1, Math.floor(v)));
}

/** Get weapon definition for slot — merges config.WEAPON_OVERRIDES when present */
export function getWeaponDefinition(slot, config = null) {
  const base = WEAPON_DEFINITIONS[slot] ?? WEAPON_DEFINITIONS[WEAPON_SLOT.RIFLE];
  const overrides = config?.WEAPON_OVERRIDES?.[slot];
  if (!overrides) return base;
  return deepMerge({}, base, overrides);
}

function deepMerge(target, ...sources) {
  for (const src of sources) {
    if (!src || typeof src !== 'object') continue;
    for (const k of Object.keys(src)) {
      const v = src[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && v.constructor === Object &&
          target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])) {
        deepMerge(target[k], v);
      } else {
        target[k] = v;
      }
    }
  }
  return target;
}

/** Set weapon slot. Mutates config. Returns new slot. */
export function setWeaponSlot(config, slot) {
  const s = Math.max(0, Math.min(1, Math.floor(slot)));
  if (config) config.WEAPON_SLOT = s;
  return s;
}

/** Cycle to next weapon. Mutates config. Returns new slot. */
export function cycleWeapon(config) {
  const current = getWeaponSlot(config);
  const next = (current + 1) % 2;
  return setWeaponSlot(config, next);
}
