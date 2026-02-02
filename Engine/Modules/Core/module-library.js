/**
 * Basalt Module Library — Atomized module manifests for on-the-fly scaling
 * Each engine feature is a standalone module; users enable/disable via drag-drop.
 * Categories: Lighting, Physics, Weapon, Player, World, Editor, etc.
 */

/** Module manifest schema: { id, name, description, category, components[], dependencies[], enabled } */
export const MODULE_MANIFESTS = {
  lighting: {
    id: 'lighting',
    name: 'Lighting Module',
    description: 'Global Illumination, Volumetrics, Sun settings. Lamps, Flashlights, Spotlights.',
    category: 'Rendering',
    components: ['HemisphericLight', 'DirectionalLight', 'PointLight', 'SpotLight', 'VolumetricLight'],
    dependencies: [],
    icon: 'lightbulb',
  },
  physics: {
    id: 'physics',
    name: 'Havok Physics CDN',
    description: 'Gravity, Collisions, Raycasting. Requires HavokPhysics_umd.js.',
    category: 'Physics',
    components: ['Gravity', 'Collisions', 'Raycasting', 'Constraints'],
    dependencies: ['havok'],
    icon: 'physics',
  },
  weapon: {
    id: 'weapon',
    name: 'Weapon Module',
    description: 'Recoil, Fire Rates, Attachments. Rifle/Pistol slots, weapon wheel.',
    category: 'Gameplay',
    components: ['Recoil', 'FireRate', 'Attachments', 'WeaponSwitch', 'WeaponWheel'],
    dependencies: ['player'],
    icon: 'sports_esports',
  },
  player: {
    id: 'player',
    name: 'Player Module',
    description: 'Character, movement, camera, input, ADS.',
    category: 'Gameplay',
    components: ['Character', 'Movement', 'Camera', 'Input', 'ADS'],
    dependencies: [],
    icon: 'person',
  },
  vehicle: {
    id: 'vehicle',
    name: 'Vehicle Module',
    description: 'Physics vehicle with Havok chassis, wheels, easy rigging.',
    category: 'Gameplay',
    components: ['Chassis', 'Wheels', 'Suspension', 'Steering'],
    dependencies: ['physics'],
    icon: 'directions_car',
  },
  mantle: {
    id: 'mantle',
    name: 'Mantle Terrain',
    description: 'Procedural terrain, heightmap, erosion.',
    category: 'World',
    components: ['TerrainGenerator', 'Heightmap', 'Erosion'],
    dependencies: [],
    icon: 'terrain',
  },
  'fps-controller': {
    id: 'fps-controller',
    name: 'FPS Controller',
    description: 'Full FPS template: player, weapon, HUD, movement.',
    category: 'Starter',
    components: ['Player', 'Weapon', 'HUD', 'Movement'],
    dependencies: ['player', 'weapon', 'lighting'],
    icon: 'sports_esports',
  },
};

/** Map module id -> modules.config MODULES entry id */
export const MODULE_ID_TO_CONFIG = {
  lighting: 'lights',
  physics: null, // Havok is script, not module
  weapon: null, // weapon-component, firing, etc. are separate
  player: null,
  vehicle: 'vehicle',
  mantle: null, // World/mantle
  'fps-controller': 'fps-controller',
};

/** Get enabled module ids from localStorage (user preferences) */
export function getEnabledModuleIds() {
  try {
    const s = localStorage.getItem('basalt_enabled_modules');
    return s ? JSON.parse(s) : null;
  } catch (_) {
    return null;
  }
}

/** Set enabled module ids (persists to localStorage) */
export function setEnabledModuleIds(ids) {
  try {
    localStorage.setItem('basalt_enabled_modules', JSON.stringify(ids));
  } catch (_) {}
}
