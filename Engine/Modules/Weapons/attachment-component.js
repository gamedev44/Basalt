/**
 * Basalt Attachment Component — Show/hide weapon attachments via enum switch key
 * Cycle scope (iron/scope_01/02/03), muzzle (none/silencer) with a key.
 */

/** Attachment slot enums — scope options */
export const SCOPE = {
  IRON: 0,
  SCOPE_01: 1,
  SCOPE_02: 2,
  SCOPE_03: 3,
};

/** Attachment slot enums — muzzle options */
export const MUZZLE = {
  NONE: 0,
  SILENCER: 1,
};

/** Mesh names per slot/option (arms_assault_rifle_02.glb) */
const SCOPE_MESHES = {
  [SCOPE.IRON]: ['assault_rifle_02_iron_sights'],
  [SCOPE.SCOPE_01]: ['scope_01'],
  [SCOPE.SCOPE_02]: ['scope_02'],
  [SCOPE.SCOPE_03]: ['scope_03'],
};

const MUZZLE_MESHES = {
  [MUZZLE.NONE]: [],
  [MUZZLE.SILENCER]: ['silencer'],
};

/** Always hidden (not attachments) */
const ALWAYS_HIDDEN = ['knife', 'bullet'];

/** Default values */
export const ATTACHMENT_DEFAULTS = {
  ATTACHMENT_SCOPE: SCOPE.IRON,
  ATTACHMENT_MUZZLE: MUZZLE.NONE,
  ATTACHMENT_CYCLE_SCOPE_KEY: 86,   // V
  ATTACHMENT_CYCLE_MUZZLE_KEY: 66,  // B
};

/** Config schema — scope/muzzle in COMPONENTS; key bindings in ATTACHMENTS */
export const ATTACHMENT_SCHEMA = [
  { category: 'COMPONENTS', name: 'ATTACHMENT_SCOPE', type: 'number', value: SCOPE.IRON, min: 0, max: 3, step: 1 },
  { category: 'COMPONENTS', name: 'ATTACHMENT_MUZZLE', type: 'number', value: MUZZLE.NONE, min: 0, max: 1, step: 1 },
  { category: 'ATTACHMENTS', name: 'ATTACHMENT_CYCLE_SCOPE_KEY', type: 'number', value: 86, min: 0, max: 255, step: 1 },
  { category: 'ATTACHMENTS', name: 'ATTACHMENT_CYCLE_MUZZLE_KEY', type: 'number', value: 66, min: 0, max: 255, step: 1 },
];

/** Get scope from config */
export function getScope(config) {
  const v = config?.ATTACHMENT_SCOPE ?? ATTACHMENT_DEFAULTS.ATTACHMENT_SCOPE;
  return Math.max(0, Math.min(3, Math.floor(v)));
}

/** Get muzzle from config */
export function getMuzzle(config) {
  const v = config?.ATTACHMENT_MUZZLE ?? ATTACHMENT_DEFAULTS.ATTACHMENT_MUZZLE;
  return Math.max(0, Math.min(1, Math.floor(v)));
}

/** Get meshes to show for current attachment state */
function getVisibleMeshes(config) {
  const scope = getScope(config);
  const muzzle = getMuzzle(config);
  const scopeList = SCOPE_MESHES[scope] ?? SCOPE_MESHES[SCOPE.IRON];
  const muzzleList = MUZZLE_MESHES[muzzle] ?? MUZZLE_MESHES[MUZZLE.NONE];
  return [...scopeList, ...muzzleList];
}

/** All attachment mesh names */
const ALL_ATTACHMENT_NAMES = [
  ...new Set([
    ...Object.values(SCOPE_MESHES).flat(),
    ...Object.values(MUZZLE_MESHES).flat(),
    ...ALWAYS_HIDDEN,
  ]),
];

/** Apply attachment visibility to scene. Call after weapon loads and when config changes. */
export function applyAttachments(scene, config) {
  const visible = getVisibleMeshes(config);

  for (const name of ALL_ATTACHMENT_NAMES) {
    const m = scene.getMeshByName(name) || scene.getNodeByName(name);
    if (m) {
      m.setEnabled(visible.includes(name));
    }
  }
}

/** Cycle scope to next option. Returns new scope value. Mutates config. */
export function cycleScope(config) {
  const current = getScope(config);
  const next = (current + 1) % 4;
  if (config) config.ATTACHMENT_SCOPE = next;
  return next;
}

/** Cycle muzzle to next option. Returns new muzzle value. Mutates config. */
export function cycleMuzzle(config) {
  const current = getMuzzle(config);
  const next = (current + 1) % 2;
  if (config) config.ATTACHMENT_MUZZLE = next;
  return next;
}

/** Get cycle scope key code */
export function getCycleScopeKey(config) {
  return config?.ATTACHMENT_CYCLE_SCOPE_KEY ?? ATTACHMENT_DEFAULTS.ATTACHMENT_CYCLE_SCOPE_KEY;
}

/** Get cycle muzzle key code */
export function getCycleMuzzleKey(config) {
  return config?.ATTACHMENT_CYCLE_MUZZLE_KEY ?? ATTACHMENT_DEFAULTS.ATTACHMENT_CYCLE_MUZZLE_KEY;
}
