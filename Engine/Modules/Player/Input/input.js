/**
 * Basalt Input — keys, isAds, pointer events
 */

export function createInput(config = null) {
  const keys = { left: 0, right: 0, forward: 0, back: 0, shift: 0, jump: 0, cycleScope: 0, cycleMuzzle: 0, weapon1: 0, weapon2: 0, weaponScrollUp: 0, weaponScrollDown: 0, weaponWheel: 0 };
  let isAds = false;
  let isFiring = false;

  const cycleScopeKey = config?.ATTACHMENT_CYCLE_SCOPE_KEY ?? 86;  // V
  const cycleMuzzleKey = config?.ATTACHMENT_CYCLE_MUZZLE_KEY ?? 66; // B
  const weapon1Key = config?.WEAPON_SWITCH_KEY ?? 49;   // 1
  const weapon2Key = config?.WEAPON_SWITCH_KEY_2 ?? 50;  // 2
  const weaponWheelKey = config?.WEAPON_WHEEL_KEY ?? 9;  // Tab

  const keydown = (evt) => {
    if (evt.keyCode === 87) keys.forward = 1;
    if (evt.keyCode === 83) keys.back = 1;
    if (evt.keyCode === 68) keys.left = 1;
    if (evt.keyCode === 65) keys.right = 1;
    if (evt.keyCode === 16) keys.shift = 1;
    if (evt.keyCode === 32) keys.jump = 1;
    if (evt.keyCode === cycleScopeKey) keys.cycleScope = 1;
    if (evt.keyCode === cycleMuzzleKey) keys.cycleMuzzle = 1;
    if (evt.keyCode === weapon1Key) keys.weapon1 = 1;
    if (evt.keyCode === weapon2Key) keys.weapon2 = 1;
    if (evt.keyCode === weaponWheelKey) keys.weaponWheel = 1;
  };
  const keyup = (evt) => {
    if (evt.keyCode === 87) keys.forward = 0;
    if (evt.keyCode === 83) keys.back = 0;
    if (evt.keyCode === 68) keys.left = 0;
    if (evt.keyCode === 65) keys.right = 0;
    if (evt.keyCode === 16) keys.shift = 0;
    if (evt.keyCode === 32) keys.jump = 0;
    if (evt.keyCode === cycleScopeKey) keys.cycleScope = 0;
    if (evt.keyCode === cycleMuzzleKey) keys.cycleMuzzle = 0;
    if (evt.keyCode === weapon1Key) keys.weapon1 = 0;
    if (evt.keyCode === weapon2Key) keys.weapon2 = 0;
    if (evt.keyCode === weaponWheelKey) keys.weaponWheel = 0;
  };

  const wheel = (evt) => {
    const varPanel = document.getElementById('variable-panel');
    const wdtPanel = document.getElementById('weapon-data-table');
    if (varPanel?.contains?.(evt.target) || wdtPanel?.contains?.(evt.target)) return;
    if (evt.deltaY < 0) keys.weaponScrollUp = 1;
    else if (evt.deltaY > 0) keys.weaponScrollDown = 1;
  };

  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  window.addEventListener('wheel', wheel, { passive: true });

  return {
    keys,
    get isAds() { return isAds; },
    set isAds(v) { isAds = v; },
    get isFiring() { return isFiring; },
    set isFiring(v) { isFiring = v; },
    attachPointerEvents(scene) {
      scene.onPointerDown = (evt) => {
        if (evt.button === 0) isFiring = true;
        if (evt.button === 2) isAds = true;
      };
      scene.onPointerUp = (evt) => {
        if (evt.button === 0) isFiring = false;
        if (evt.button === 2) isAds = false;
      };
    },
    dispose() {
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('wheel', wheel);
    },
  };
}
