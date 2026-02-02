/**
 * Basalt Import Settings — Character/weapon import from Blender, UE5, etc.
 * Axis conversion (Y-up/Z-up, forward axis), scale. Save to config ini.
 */

/** Forward axis presets */
export const FORWARD_AXIS = {
  Z_POS: 'z+',
  Z_NEG: 'z-',
  Y_POS: 'y+',
  Y_NEG: 'y-',
  X_POS: 'x+',
  X_NEG: 'x-',
};

/** Up axis presets */
export const UP_AXIS = {
  Y_UP: 'y',
  Z_UP: 'z',
  X_UP: 'x',
};

/** Default import settings (UE5: -Y forward, Z up) */
export const IMPORT_DEFAULTS = {
  FORWARD_AXIS: FORWARD_AXIS.Y_NEG,
  UP_AXIS: UP_AXIS.Z_UP,
  SCALE: 1,
  CHARACTER_URL: '',
  CHARACTER_FILE: '',
};

/** Config schema for import */
export const IMPORT_SCHEMA = [
  { category: 'IMPORT', name: 'FORWARD_AXIS', type: 'string', value: IMPORT_DEFAULTS.FORWARD_AXIS },
  { category: 'IMPORT', name: 'UP_AXIS', type: 'string', value: IMPORT_DEFAULTS.UP_AXIS },
  { category: 'IMPORT', name: 'SCALE', type: 'number', value: 1, min: 0.01, max: 10, step: 0.1 },
  { category: 'IMPORT', name: 'CHARACTER_URL', type: 'string', value: '' },
  { category: 'IMPORT', name: 'CHARACTER_FILE', type: 'string', value: '' },
];

/** Get rotation matrix to convert from source axis to Babylon (Y-up, -Z forward) */
export function getImportRotation(config) {
  const forward = config?.FORWARD_AXIS ?? IMPORT_DEFAULTS.FORWARD_AXIS;
  const up = config?.UP_AXIS ?? IMPORT_DEFAULTS.UP_AXIS;

  const axisMap = {
    [FORWARD_AXIS.Z_POS]: { x: 0, y: 0, z: 1 },
    [FORWARD_AXIS.Z_NEG]: { x: 0, y: 0, z: -1 },
    [FORWARD_AXIS.Y_POS]: { x: 0, y: 1, z: 0 },
    [FORWARD_AXIS.Y_NEG]: { x: 0, y: -1, z: 0 },
    [FORWARD_AXIS.X_POS]: { x: 1, y: 0, z: 0 },
    [FORWARD_AXIS.X_NEG]: { x: -1, y: 0, z: 0 },
  };

  const upMap = {
    [UP_AXIS.Y_UP]: { x: 0, y: 1, z: 0 },
    [UP_AXIS.Z_UP]: { x: 0, y: 0, z: 1 },
    [UP_AXIS.X_UP]: { x: 1, y: 0, z: 0 },
  };

  const f = axisMap[forward] ?? axisMap[FORWARD_AXIS.Z_NEG];
  const u = upMap[up] ?? upMap[UP_AXIS.Y_UP];

  if (typeof BABYLON !== 'undefined') {
    const fwd = new BABYLON.Vector3(f.x, f.y, f.z);
    const upVec = new BABYLON.Vector3(u.x, u.y, u.z);
    const right = BABYLON.Vector3.Cross(fwd, upVec).normalize();
    const m = BABYLON.Matrix.Identity();
    BABYLON.Matrix.FromXYZVectorsToRef(right, upVec, fwd.negate(), m);
    return m;
  }
  return null;
}

/** Get import scale */
export function getImportScale(config) {
  return config?.IMPORT_SCALE ?? config?.SCALE ?? IMPORT_DEFAULTS.SCALE;
}

/** Serialize import settings to INI string */
export function exportImportSettingsIni(config) {
  const fwd = config?.FORWARD_AXIS ?? IMPORT_DEFAULTS.FORWARD_AXIS;
  const up = config?.UP_AXIS ?? IMPORT_DEFAULTS.UP_AXIS;
  const scale = config?.IMPORT_SCALE ?? config?.SCALE ?? IMPORT_DEFAULTS.SCALE;
  const url = config?.CHARACTER_URL ?? '';
  const file = config?.CHARACTER_FILE ?? '';
  return `[Import]
FORWARD_AXIS=${fwd}
UP_AXIS=${up}
SCALE=${scale}
CHARACTER_URL=${url}
CHARACTER_FILE=${file}
`;
}

/** Parse import settings from INI string */
export function parseImportSettingsIni(ini) {
  const out = {};
  const lines = ini.split('\n');
  let inImport = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '[Import]') { inImport = true; continue; }
    if (trimmed.startsWith('[')) { inImport = false; continue; }
    if (!inImport) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key === 'SCALE') out[key] = parseFloat(val) || 1;
    else out[key] = val;
  }
  return out;
}
